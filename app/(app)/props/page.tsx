import { Suspense } from "react";
import { Layers, RefreshCw } from "lucide-react";
import {
  fetchPitcherStats,
  fetchTeamBatters,
  fetchTodaysGames,
  fetchVenueWeather,
  type PitcherSeasonStats,
  type RosterBatter,
} from "@/lib/mlb/api";
import { PaywallGate } from "@/components/web-tool/paywall-gate";
import { PropsTool, type PropGame } from "./props-tool";

export const dynamic = "force-dynamic";

type BatterPropType = "HR" | "Hit" | "2+ Hits" | "2+ Bases";

function normalCDF(z: number): number {
  return 1 / (1 + Math.exp(-1.7 * z));
}

function hrProbability(batterHrPerAb: number, pitcherEra: number): number {
  const pitcherFactor = (pitcherEra || 4.5) / 4.5;
  return Math.min(0.35, Math.max(0.04, batterHrPerAb * pitcherFactor));
}

function hitProbability(avg: number, pitcherWhip: number): number {
  const adj = 1.3 / Math.max(0.8, pitcherWhip || 1.3);
  const adjAvg = Math.min(0.38, Math.max(0.15, avg * adj));
  return Math.round((1 - Math.pow(1 - adjAvg, 4)) * 100);
}

function twoHitsProbability(avg: number, pitcherWhip: number): number {
  const adj = 1.3 / Math.max(0.8, pitcherWhip || 1.3);
  const adjAvg = Math.min(0.38, Math.max(0.15, avg * adj));
  const p0 = Math.pow(1 - adjAvg, 4);
  const p1 = 4 * adjAvg * Math.pow(1 - adjAvg, 3);
  return Math.round((1 - p0 - p1) * 100);
}

// 2+ Bases = P(2B) + P(3B) + P(HR) + P(2+ singles)
// Approximated via ISO (extra-base hit rate) and OPS
function twoBasesProbability(batter: RosterBatter, pitcher: PitcherSeasonStats | null): number {
  const avg = parseFloat(batter.stats.avg) || 0.22;
  const ops = parseFloat(batter.stats.ops) || 0.68;
  const ab  = Math.max(batter.stats.atBats, 1);
  const iso = Math.max(0, ops * 0.6 - avg);           // proxy ISO from OPS
  const xbhRate = Math.min(0.30, Math.max(0.04, iso * 1.4)); // XBH per AB
  const pitcherAdj = pitcher ? Math.max(0.75, (pitcher.era || 4.5) / 4.5) : 1;
  // P(at least one XBH in ~4 PA) + P(2+ singles)
  const pXbh = 1 - Math.pow(1 - xbhRate * pitcherAdj, 4);
  const adjAvg = Math.min(0.36, Math.max(0.14, avg * (1.3 / Math.max(0.8, pitcher?.whip ?? 1.3))));
  const p2singles = twoHitsProbability(adjAvg, pitcher?.whip ?? 1.3) / 100 * 0.55;
  return Math.round(Math.min(70, Math.max(8, (pXbh + p2singles) * 100)));
}

function pitcherKLineProp(stats: PitcherSeasonStats) {
  const ip      = parseFloat(stats.inningsPitched) || 1;
  const starts  = Math.max(stats.gamesStarted, 1);
  const avgIp   = Math.min(ip / starts, 7);
  const k9      = stats.strikeOuts / (ip / 9);
  const projKs  = k9 * (avgIp / 9);
  const projRnd = Math.round(projKs * 10) / 10;
  const line    = Math.floor(projRnd) + 0.5;
  const z       = (line + 0.5 - Math.max(projKs, 0.5)) / Math.max(Math.sqrt(Math.max(projKs, 0.5)), 0.5);
  const overPct = Math.round(100 * (1 - normalCDF(z)));
  return {
    k9: Number.isFinite(k9) ? k9.toFixed(1) : "0.0",
    projectedKs: projRnd,
    line,
    overPct:  Math.min(82, Math.max(18, overPct)),
    underPct: Math.min(82, Math.max(18, 100 - overPct)),
  };
}

// Total runs O/U: rich breakdown analysis
function totalRunsProp(
  homePitcher: PitcherSeasonStats | null,
  awayPitcher: PitcherSeasonStats | null,
  homeBatters: RosterBatter[],
  awayBatters: RosterBatter[],
  venue: string,
  wx: { tempF: number; windMph: number; windDirection: string; conditions: string } | null,
): {
  line: number;
  overPct: number;
  underPct: number;
  expectedRuns: number;
  expectedHome: number;
  expectedAway: number;
  // breakdown factors
  homeLineupOPS: number;
  awayLineupOPS: number;
  pitchingFactor: number;    // <1 favors under, >1 favors over
  weatherFactor: number;
  lineupFactor: number;
  factors: Array<{ label: string; impact: "over" | "under" | "neutral"; description: string }>;
} {
  const homeEra  = homePitcher?.era  ?? 4.5;
  const awayEra  = awayPitcher?.era  ?? 4.5;
  const homeWhip = homePitcher?.whip ?? 1.3;
  const awayWhip = awayPitcher?.whip ?? 1.3;
  const homeHr9  = homePitcher?.homeRunsPer9 ?? 1.1;
  const awayHr9  = awayPitcher?.homeRunsPer9 ?? 1.1;

  // Average innings for starter (cap 6)
  const homeInn = homePitcher
    ? Math.min(6, parseFloat(homePitcher.inningsPitched) / Math.max(homePitcher.gamesStarted, 1))
    : 5;
  const awayInn = awayPitcher
    ? Math.min(6, parseFloat(awayPitcher.inningsPitched) / Math.max(awayPitcher.gamesStarted, 1))
    : 5;

  // Base expected runs: ERA * innings / 9
  let expectedAway = (awayEra / 9) * homeInn;  // home pitcher facing away batters
  let expectedHome = (homeEra / 9) * awayInn;  // away pitcher facing home batters

  // Lineup quality adjustment
  const avgOPS = (batters: RosterBatter[]) => {
    if (!batters.length) return 0.7;
    return batters.slice(0, 9).reduce((s, b) => s + (parseFloat(b.stats.ops) || 0.7), 0) / Math.min(batters.length, 9);
  };
  const homeOPS = avgOPS(homeBatters);
  const awayOPS = avgOPS(awayBatters);
  const lineupFactor = ((homeOPS + awayOPS) / 2) / 0.72;  // 0.72 = league avg OPS
  expectedHome *= lineupFactor;
  expectedAway *= lineupFactor;

  let total = expectedHome + expectedAway;

  // Weather
  let weatherFactor = 1.0;
  if (wx) {
    if (wx.tempF > 85) weatherFactor += 0.04;
    if (wx.tempF < 55) weatherFactor -= 0.05;
    if (wx.windMph > 14) weatherFactor += 0.04;
    if (wx.windMph > 10 && (wx.windDirection === "S" || wx.windDirection === "SW")) weatherFactor += 0.02;
    if (wx.windMph > 10 && (wx.windDirection === "N" || wx.windDirection === "NE")) weatherFactor -= 0.02;
  }
  total *= weatherFactor;

  const expectedRuns = Math.round(total * 10) / 10;
  const line = Math.floor(expectedRuns) + 0.5;

  const z = (line - expectedRuns) / 2.4;
  const overPct = Math.round((1 - normalCDF(z)) * 100);

  // Build human-readable factor breakdown
  const factors: Array<{ label: string; impact: "over" | "under" | "neutral"; description: string }> = [];

  // Pitching factors
  const avgEra = (homeEra + awayEra) / 2;
  if (avgEra >= 4.8) {
    factors.push({ label: "Vulnerable Pitching", impact: "over", description: `Combined ERA ${avgEra.toFixed(2)} — both starters give up runs at an above-average rate.` });
  } else if (avgEra <= 3.4) {
    factors.push({ label: "Elite Pitching Duel", impact: "under", description: `Combined ERA ${avgEra.toFixed(2)} — expect both starters to keep lineups quiet.` });
  } else {
    factors.push({ label: "Solid Pitching Matchup", impact: "neutral", description: `Combined ERA ${avgEra.toFixed(2)} — pitching is a wash; other factors decide this.` });
  }

  if (homeHr9 + awayHr9 > 2.4) {
    factors.push({ label: "HR-Prone Pitchers", impact: "over", description: `Combined HR/9 of ${(homeHr9 + awayHr9).toFixed(1)} — long balls are a real threat today.` });
  }
  const avgWhip = (homeWhip + awayWhip) / 2;
  if (avgWhip >= 1.4) {
    factors.push({ label: "High Walk Rates", impact: "over", description: `Avg WHIP ${avgWhip.toFixed(2)} — runners on base extends innings and run potential.` });
  } else if (avgWhip <= 1.0) {
    factors.push({ label: "Pinpoint Control", impact: "under", description: `Avg WHIP ${avgWhip.toFixed(2)} — neither pitcher gives away free baserunners.` });
  }

  // Lineup factors
  if (homeOPS > 0.78 && awayOPS > 0.78) {
    factors.push({ label: "Hot Lineups Both Sides", impact: "over", description: `Home .${Math.round(homeOPS * 1000)} OPS · Away .${Math.round(awayOPS * 1000)} OPS — both offenses are clicking.` });
  } else if (homeOPS < 0.68 && awayOPS < 0.68) {
    factors.push({ label: "Cold Offenses", impact: "under", description: `Home .${Math.round(homeOPS * 1000)} OPS · Away .${Math.round(awayOPS * 1000)} OPS — neither lineup is producing.` });
  } else {
    factors.push({ label: "Lineup Edge", impact: homeOPS > awayOPS ? "over" : "neutral", description: `Home .${Math.round(homeOPS * 1000)} vs Away .${Math.round(awayOPS * 1000)} — moderate offensive difference.` });
  }

  // Weather factor
  if (wx) {
    if (wx.tempF > 85) factors.push({ label: "Heat Carries Ball", impact: "over", description: `${wx.tempF}°F — hot air is thinner, balls carry further. Favors extra-base hits.` });
    if (wx.tempF < 58) factors.push({ label: "Cold Suppresses Offense", impact: "under", description: `${wx.tempF}°F — cold air is denser, ball dies off the bat. Pitchers' advantage.` });
    if (wx.windMph > 12) {
      const isBlowing = wx.windDirection === "S" || wx.windDirection === "SW" || wx.windDirection === "W";
      factors.push({
        label: isBlowing ? "Wind Blowing Out" : "Wind Blowing In",
        impact: isBlowing ? "over" : "under",
        description: `${wx.windMph}mph ${wx.windDirection} — wind ${isBlowing ? "pushes fly balls toward the seats" : "knocks balls back into the park"}.`,
      });
    }
    if (wx.conditions.includes("rain") || wx.conditions.includes("drizzle")) {
      factors.push({ label: "Wet Conditions", impact: "under", description: "Rain or drizzle typically slows offenses and reduces run scoring." });
    }
  }

  // Park context
  if (venue.includes("Coors") || venue.includes("Globe Life")) {
    factors.push({ label: "Hitter-Friendly Park", impact: "over", description: `${venue} consistently produces above-average run totals.` });
  }
  if (venue.includes("Oracle") || venue.includes("T-Mobile") || venue.includes("Petco")) {
    factors.push({ label: "Pitcher-Friendly Park", impact: "under", description: `${venue} suppresses offense — especially HR production.` });
  }

  return {
    line,
    expectedRuns,
    expectedHome: Math.round(expectedHome * 10) / 10,
    expectedAway: Math.round(expectedAway * 10) / 10,
    overPct:  Math.min(78, Math.max(22, overPct)),
    underPct: Math.min(78, Math.max(22, 100 - overPct)),
    homeLineupOPS: Math.round(homeOPS * 1000) / 1000,
    awayLineupOPS: Math.round(awayOPS * 1000) / 1000,
    pitchingFactor: Math.round((avgEra / 4.5) * 100) / 100,
    weatherFactor:  Math.round(weatherFactor * 100) / 100,
    lineupFactor:   Math.round(lineupFactor * 100) / 100,
    factors,
  };
}

function formatAvg(avg: string): string {
  if (!avg || avg.startsWith("-")) return avg;
  return avg.replace("0.", ".");
}

function buildBatterRows(
  batters: RosterBatter[],
  pitcher: PitcherSeasonStats | null,
  pitcherName: string,
  propType: BatterPropType,
) {
  return batters
    .map((b) => {
      const ab  = Math.max(b.stats.atBats, 1);
      const avg = parseFloat(b.stats.avg) || 0.22;
      let pct: number;
      switch (propType) {
        case "HR":
          pct = Math.round(hrProbability(b.stats.homeRuns / ab, pitcher?.era ?? 4.5) * 100);
          break;
        case "Hit":
          pct = hitProbability(avg, pitcher?.whip ?? 1.3);
          break;
        case "2+ Hits":
          pct = twoHitsProbability(avg, pitcher?.whip ?? 1.3);
          break;
        case "2+ Bases":
          pct = twoBasesProbability(b, pitcher);
          break;
      }
      return {
        id:         b.id,
        playerName: b.fullName,
        position:   b.position,
        teamId:     b.teamId,
        pct,
        pitcherName,
        subStats:
          propType === "HR"
            ? `${formatAvg(b.stats.avg)} AVG · ${b.stats.homeRuns} HR · ${b.stats.ops} OPS`
            : propType === "2+ Bases"
            ? `${formatAvg(b.stats.avg)} AVG · ${b.stats.ops} OPS · ${b.stats.homeRuns} HR`
            : `${formatAvg(b.stats.avg)} AVG · ${b.stats.rbi} RBI · ${b.stats.ops} OPS`,
      };
    })
    .filter((r) => r.pct > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 18);
}

async function buildPropGames(): Promise<PropGame[]> {
  const games = await fetchTodaysGames();
  const withPitchers = games.filter((g) => g.teams.away.probablePitcher || g.teams.home.probablePitcher);

  return Promise.all(
    withPitchers.map(async (game) => {
      const [homeBatters, awayBatters, homePitcherStats, awayPitcherStats, weather] = await Promise.all([
        fetchTeamBatters(game.teams.home.team.id),
        fetchTeamBatters(game.teams.away.team.id),
        game.teams.home.probablePitcher ? fetchPitcherStats(game.teams.home.probablePitcher.id) : Promise.resolve(null),
        game.teams.away.probablePitcher ? fetchPitcherStats(game.teams.away.probablePitcher.id) : Promise.resolve(null),
        fetchVenueWeather(game.venue.id).catch(() => null),
      ]);

      const homePName = game.teams.home.probablePitcher?.fullName ?? "TBD";
      const awayPName = game.teams.away.probablePitcher?.fullName ?? "TBD";

      const makeCombined = (type: BatterPropType) => [
        ...buildBatterRows(awayBatters, homePitcherStats, homePName, type),
        ...buildBatterRows(homeBatters, awayPitcherStats, awayPName, type),
      ].sort((a, b) => b.pct - a.pct).slice(0, 22);

      const runsData = totalRunsProp(
        homePitcherStats,
        awayPitcherStats,
        homeBatters,
        awayBatters,
        game.venue.name,
        weather,
      );

      return {
        gamePk:   game.gamePk,
        gameDate: game.gameDate,
        status:   game.status.detailedState,
        venue:    game.venue.name,
        away: { id: game.teams.away.team.id, name: game.teams.away.team.name, pitcher: awayPName },
        home: { id: game.teams.home.team.id, name: game.teams.home.team.name, pitcher: homePName },
        props: {
          HR:         makeCombined("HR"),
          Hit:        makeCombined("Hit"),
          "2+ Hits":  makeCombined("2+ Hits"),
          "2+ Bases": makeCombined("2+ Bases"),
        },
        pitchers: [
          ...(game.teams.away.probablePitcher && awayPitcherStats
            ? [{ id: game.teams.away.probablePitcher.id, name: awayPName, teamName: game.teams.away.team.name, opponent: game.teams.home.team.name, era: awayPitcherStats.era.toFixed(2), whip: awayPitcherStats.whip.toFixed(2), wins: awayPitcherStats.wins, losses: awayPitcherStats.losses, ...pitcherKLineProp(awayPitcherStats) }]
            : []),
          ...(game.teams.home.probablePitcher && homePitcherStats
            ? [{ id: game.teams.home.probablePitcher.id, name: homePName, teamName: game.teams.home.team.name, opponent: game.teams.away.team.name, era: homePitcherStats.era.toFixed(2), whip: homePitcherStats.whip.toFixed(2), wins: homePitcherStats.wins, losses: homePitcherStats.losses, ...pitcherKLineProp(homePitcherStats) }]
            : []),
        ],
        totalRuns: {
          ...runsData,
          awayTeam: game.teams.away.team.name,
          homeTeam: game.teams.home.team.name,
          awayPitcher: {
            name: awayPName,
            era:  awayPitcherStats?.era  ?? null,
            whip: awayPitcherStats?.whip ?? null,
            k9:   awayPitcherStats?.strikeoutsPer9Inn ?? null,
            wins: awayPitcherStats?.wins ?? 0,
            losses: awayPitcherStats?.losses ?? 0,
          },
          homePitcher: {
            name: homePName,
            era:  homePitcherStats?.era  ?? null,
            whip: homePitcherStats?.whip ?? null,
            k9:   homePitcherStats?.strikeoutsPer9Inn ?? null,
            wins: homePitcherStats?.wins ?? 0,
            losses: homePitcherStats?.losses ?? 0,
          },
          venue: game.venue.name,
          weather: weather ?? null,
        },
      };
    })
  );
}

async function PropsContent() {
  const games = await buildPropGames();
  if (!games.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Layers size={44} className="text-white/10 mb-4" strokeWidth={1.2} />
        <p className="text-white/35">No prop data available yet. Check back closer to first pitch.</p>
      </div>
    );
  }
  return <PropsTool games={games} />;
}

export default function PropsPage() {
  return (
    <div className="px-4 py-5 sm:px-8 sm:py-7 max-w-screen-xl mx-auto">
      <div className="mb-6">
        <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-1">Today&apos;s Slate</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">Prop Builder</h1>
        <p className="text-sm text-white/35">Real MLB roster and pitcher data · HR · Hits · 2+ Bases · Strikeouts · Total Runs</p>
      </div>

      <PaywallGate
        feature="Prop Builder"
        benefits={[
          "HR, 1+ Hit, 2+ Hit & 2+ Bases props",
          "Pitcher strikeout Over/Under projections",
          "Game total runs Over/Under analysis",
          "Build & save multi-leg slips",
        ]}
      >
        <Suspense fallback={
          <div className="flex items-center gap-3 py-16 text-white/30">
            <RefreshCw size={18} className="animate-spin" strokeWidth={1.5} />
            <span className="text-sm">Loading live prop data...</span>
          </div>
        }>
          <PropsContent />
        </Suspense>
      </PaywallGate>

      <p className="mt-6 text-xs text-white/15">
        Probabilities are model estimates based on current-season MLB stats. For educational use only.
      </p>
    </div>
  );
}
