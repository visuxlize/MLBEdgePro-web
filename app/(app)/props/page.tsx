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
import {
  PropsTool,
  type PropGame,
  type DailySlip,
  type DailySlipLeg,
  type FirstInningPropData,
  type MoneylinePropData,
} from "./props-tool";

export const dynamic = "force-dynamic";

type BatterPropType = "HR" | "Hit" | "2+ Hits" | "2+ Bases";

// ── Math helpers ───────────────────────────────────────────────────────────────

function normalCDF(z: number): number {
  return 1 / (1 + Math.exp(-1.7 * z));
}

// Enhanced HR probability using HR Nuke model (matches web deep-dive page)
function hrNukeProbability(batterHrPerAb: number, pitcherEra: number, batterOps: number): number {
  const era   = pitcherEra  || 4.5;
  const ops   = batterOps   || 0.700;
  const power = Math.min(1, Math.max(0, (ops - 0.62) / 0.38));
  const base  = Math.max(0, batterHrPerAb) * 100 * (era / 4.5) * 3.8;
  return Math.min(35, Math.max(4, Math.round(base + power * 5)));
}

// Returns true when matchup grades A or A+ — show HOT badge
function hrHotFlag(pct: number, batterOps: number, pitcherEra: number): boolean {
  const ops         = batterOps  || 0.700;
  const era         = pitcherEra || 4.5;
  const power       = Math.min(1, Math.max(0, (ops - 0.62) / 0.38));
  const vulnerability = Math.max(0, (era - 3.2) / 2.8);
  return pct >= 16 || (pct + power * 24 + vulnerability * 16) >= 44;
}

// Returns true when player is statistically overdue for a HR — show DUE badge
function hrDueFlag(hrPerAb: number, batterOps: number, atBats: number): boolean {
  if (atBats < 80) return false;
  const ops          = batterOps || 0.700;
  const power        = Math.min(1, Math.max(0, (ops - 0.62) / 0.38));
  const expectedRate = 0.028 + power * 0.040;
  return hrPerAb < expectedRate * 0.60;
}

function hitProbability(avg: number, pitcherWhip: number): number {
  const adj    = 1.3 / Math.max(0.8, pitcherWhip || 1.3);
  const adjAvg = Math.min(0.38, Math.max(0.15, avg * adj));
  return Math.round((1 - Math.pow(1 - adjAvg, 4)) * 100);
}

function twoHitsProbability(avg: number, pitcherWhip: number): number {
  const adj    = 1.3 / Math.max(0.8, pitcherWhip || 1.3);
  const adjAvg = Math.min(0.38, Math.max(0.15, avg * adj));
  const p0     = Math.pow(1 - adjAvg, 4);
  const p1     = 4 * adjAvg * Math.pow(1 - adjAvg, 3);
  return Math.round((1 - p0 - p1) * 100);
}

function twoBasesProbability(batter: RosterBatter, pitcher: PitcherSeasonStats | null): number {
  const avg  = parseFloat(batter.stats.avg) || 0.22;
  const ops  = parseFloat(batter.stats.ops) || 0.68;
  const iso  = Math.max(0, ops * 0.6 - avg);
  const xbhRate    = Math.min(0.30, Math.max(0.04, iso * 1.4));
  const pitcherAdj = pitcher ? Math.max(0.75, (pitcher.era || 4.5) / 4.5) : 1;
  const pXbh       = 1 - Math.pow(1 - xbhRate * pitcherAdj, 4);
  const adjAvg     = Math.min(0.36, Math.max(0.14, avg * (1.3 / Math.max(0.8, pitcher?.whip ?? 1.3))));
  const p2singles  = twoHitsProbability(adjAvg, pitcher?.whip ?? 1.3) / 100 * 0.55;
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
    k9:          Number.isFinite(k9) ? k9.toFixed(1) : "0.0",
    projectedKs: projRnd,
    line,
    overPct:  Math.min(82, Math.max(18, overPct)),
    underPct: Math.min(82, Math.max(18, 100 - overPct)),
  };
}

// First-inning O/U: Over/Under 0.5 runs
function buildFirstInningProp(
  pitcher: PitcherSeasonStats,
  opposingBatters: RosterBatter[],
): { overPct: number; underPct: number } {
  const era  = pitcher.era  || 4.5;
  const whip = pitcher.whip || 1.30;
  // Average opposing lineup AVG from top 4 batters
  const teamAvg = opposingBatters.length > 0
    ? opposingBatters.slice(0, 4).reduce((s, b) => s + (parseFloat(b.stats.avg) || 0.245), 0) / Math.min(opposingBatters.length, 4)
    : 0.245;

  let overPct = 38; // ~38% historical base rate
  overPct += (whip - 1.30) * 30;
  overPct += (era  - 4.0)  * 3;
  overPct += (teamAvg - 0.245) * 80;
  overPct = Math.min(72, Math.max(25, Math.round(overPct)));
  return { overPct, underPct: 100 - overPct };
}

// Moneyline: win prediction from pitcher matchup
function buildMoneylinePrediction(
  homePitcher: PitcherSeasonStats,
  awayPitcher: PitcherSeasonStats,
  homeTeamName: string,
  awayTeamName: string,
  homeTeamId: number,
  awayTeamId: number,
): MoneylinePropData {
  const homeEra  = homePitcher.era  || 4.5;
  const awayEra  = awayPitcher.era  || 4.5;
  const homeWhip = homePitcher.whip || 1.3;
  const awayWhip = awayPitcher.whip || 1.3;
  const homeK9   = homePitcher.strikeoutsPer9Inn || 8.5;
  const awayK9   = awayPitcher.strikeoutsPer9Inn || 8.5;

  let homeAdj = 0;
  homeAdj += ((awayEra  - homeEra)  / 6)   * 12;
  homeAdj += ((awayWhip - homeWhip) / 1.5) * 8;
  homeAdj += ((homeK9   - awayK9)   / 10)  * 5;
  homeAdj += 4; // home field advantage

  const homeWinPct = Math.round(Math.min(85, Math.max(15, 50 + homeAdj)));
  const awayWinPct = 100 - homeWinPct;
  const diff       = Math.abs(homeWinPct - 50);
  const confidence = diff >= 18 ? "High" : diff >= 10 ? "Medium" : "Low";

  const eraEdge = homeEra < awayEra
    ? `${homeTeamName} ERA ${homeEra.toFixed(2)} vs ${awayTeamName} ERA ${awayEra.toFixed(2)} — pitching edge`
    : `${awayTeamName} ERA ${awayEra.toFixed(2)} vs ${homeTeamName} ERA ${homeEra.toFixed(2)} — pitching edge`;

  return {
    homeTeam:        homeTeamName,
    awayTeam:        awayTeamName,
    homeTeamId,
    awayTeamId,
    homeWinPct,
    awayWinPct,
    confidence:      confidence as "High" | "Medium" | "Low",
    predictedWinner: homeWinPct >= awayWinPct ? homeTeamName : awayTeamName,
    keyFactor:       eraEdge,
  };
}

// Total runs O/U
function totalRunsProp(
  homePitcher: PitcherSeasonStats | null,
  awayPitcher: PitcherSeasonStats | null,
  homeBatters: RosterBatter[],
  awayBatters: RosterBatter[],
  venue: string,
  wx: { tempF: number; windMph: number; windDirection: string; conditions: string } | null,
) {
  const homeEra  = homePitcher?.era  ?? 4.5;
  const awayEra  = awayPitcher?.era  ?? 4.5;
  const homeWhip = homePitcher?.whip ?? 1.3;
  const awayWhip = awayPitcher?.whip ?? 1.3;
  const homeHr9  = homePitcher?.homeRunsPer9 ?? 1.1;
  const awayHr9  = awayPitcher?.homeRunsPer9 ?? 1.1;

  const homeInn = homePitcher
    ? Math.min(6, parseFloat(homePitcher.inningsPitched) / Math.max(homePitcher.gamesStarted, 1))
    : 5;
  const awayInn = awayPitcher
    ? Math.min(6, parseFloat(awayPitcher.inningsPitched) / Math.max(awayPitcher.gamesStarted, 1))
    : 5;

  let expectedAway = (awayEra / 9) * homeInn;
  let expectedHome = (homeEra / 9) * awayInn;

  const avgOPS = (batters: RosterBatter[]) => {
    if (!batters.length) return 0.7;
    return batters.slice(0, 9).reduce((s, b) => s + (parseFloat(b.stats.ops) || 0.7), 0) / Math.min(batters.length, 9);
  };
  const homeOPS      = avgOPS(homeBatters);
  const awayOPS      = avgOPS(awayBatters);
  const lineupFactor = ((homeOPS + awayOPS) / 2) / 0.72;
  expectedHome *= lineupFactor;
  expectedAway *= lineupFactor;

  let total = expectedHome + expectedAway;
  let weatherFactor = 1.0;
  if (wx) {
    if (wx.tempF > 85)  weatherFactor += 0.04;
    if (wx.tempF < 55)  weatherFactor -= 0.05;
    if (wx.windMph > 14) weatherFactor += 0.04;
    if (wx.windMph > 10 && (wx.windDirection === "S" || wx.windDirection === "SW")) weatherFactor += 0.02;
    if (wx.windMph > 10 && (wx.windDirection === "N" || wx.windDirection === "NE")) weatherFactor -= 0.02;
  }
  total *= weatherFactor;

  const expectedRuns = Math.round(total * 10) / 10;
  const line         = Math.floor(expectedRuns) + 0.5;
  const z            = (line - expectedRuns) / 2.4;
  const overPct      = Math.round((1 - normalCDF(z)) * 100);

  const factors: Array<{ label: string; impact: "over" | "under" | "neutral"; description: string }> = [];
  const avgEra = (homeEra + awayEra) / 2;
  if (avgEra >= 4.8)       factors.push({ label: "Vulnerable Pitching",  impact: "over",    description: `Combined ERA ${avgEra.toFixed(2)} — both starters give up runs at an above-average rate.` });
  else if (avgEra <= 3.4)  factors.push({ label: "Elite Pitching Duel",  impact: "under",   description: `Combined ERA ${avgEra.toFixed(2)} — expect both starters to keep lineups quiet.` });
  else                     factors.push({ label: "Solid Pitching Matchup",impact: "neutral", description: `Combined ERA ${avgEra.toFixed(2)} — pitching is a wash; other factors decide this.` });

  if (homeHr9 + awayHr9 > 2.4)
    factors.push({ label: "HR-Prone Pitchers",   impact: "over",  description: `Combined HR/9 of ${(homeHr9 + awayHr9).toFixed(1)} — long balls are a real threat today.` });
  const avgWhip = (homeWhip + awayWhip) / 2;
  if (avgWhip >= 1.4)       factors.push({ label: "High Walk Rates",   impact: "over",  description: `Avg WHIP ${avgWhip.toFixed(2)} — runners on base extends innings and run potential.` });
  else if (avgWhip <= 1.0)  factors.push({ label: "Pinpoint Control",  impact: "under", description: `Avg WHIP ${avgWhip.toFixed(2)} — neither pitcher gives away free baserunners.` });

  if (homeOPS > 0.78 && awayOPS > 0.78)
    factors.push({ label: "Hot Lineups Both Sides", impact: "over",    description: `Home .${Math.round(homeOPS * 1000)} OPS · Away .${Math.round(awayOPS * 1000)} OPS — both offenses are clicking.` });
  else if (homeOPS < 0.68 && awayOPS < 0.68)
    factors.push({ label: "Cold Offenses",           impact: "under",   description: `Home .${Math.round(homeOPS * 1000)} OPS · Away .${Math.round(awayOPS * 1000)} OPS — neither lineup is producing.` });
  else
    factors.push({ label: "Lineup Edge", impact: homeOPS > awayOPS ? "over" : "neutral", description: `Home .${Math.round(homeOPS * 1000)} vs Away .${Math.round(awayOPS * 1000)} — moderate offensive difference.` });

  if (wx) {
    if (wx.tempF > 85)   factors.push({ label: "Heat Carries Ball",    impact: "over",  description: `${wx.tempF}°F — hot air is thinner, balls carry further. Favors extra-base hits.` });
    if (wx.tempF < 58)   factors.push({ label: "Cold Suppresses Offense", impact: "under", description: `${wx.tempF}°F — cold air is denser, ball dies off the bat. Pitchers' advantage.` });
    if (wx.windMph > 12) {
      const blowing = wx.windDirection === "S" || wx.windDirection === "SW" || wx.windDirection === "W";
      factors.push({ label: blowing ? "Wind Blowing Out" : "Wind Blowing In", impact: blowing ? "over" : "under", description: `${wx.windMph}mph ${wx.windDirection} — wind ${blowing ? "pushes fly balls toward the seats" : "knocks balls back into the park"}.` });
    }
    if (wx.conditions.includes("rain") || wx.conditions.includes("drizzle"))
      factors.push({ label: "Wet Conditions", impact: "under", description: "Rain or drizzle typically slows offenses and reduces run scoring." });
  }
  if (venue.includes("Coors") || venue.includes("Globe Life"))
    factors.push({ label: "Hitter-Friendly Park", impact: "over",  description: `${venue} consistently produces above-average run totals.` });
  if (venue.includes("Oracle") || venue.includes("T-Mobile") || venue.includes("Petco"))
    factors.push({ label: "Pitcher-Friendly Park", impact: "under", description: `${venue} suppresses offense — especially HR production.` });

  return {
    line, expectedRuns,
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
      const ops = parseFloat(b.stats.ops) || 0.700;
      let pct: number;
      let isHot: boolean | undefined;
      let isDue: boolean | undefined;

      switch (propType) {
        case "HR": {
          const era = pitcher?.era ?? 4.5;
          pct   = hrNukeProbability(b.stats.homeRuns / ab, era, ops);
          isHot = hrHotFlag(pct, ops, era);
          isDue = hrDueFlag(b.stats.homeRuns / ab, ops, ab);
          break;
        }
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
        isHot,
        isDue,
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

// ── Daily slips (server-side) ─────────────────────────────────────────────────

function buildDailySlips(games: PropGame[]): DailySlip[] {
  const hitLegs:     { id: string; desc: string; pct: number }[] = [];
  const twoHitsLegs: { id: string; desc: string; pct: number }[] = [];
  const hrLegs:      { id: string; desc: string; pct: number }[] = [];
  const kLegs:       { id: string; desc: string; pct: number }[] = [];
  const seen = new Set<string>();

  for (const g of games) {
    for (const r of g.props.Hit.slice(0, 8)) {
      const id = `${r.id}-Hit`;
      if (!seen.has(id)) { seen.add(id); hitLegs.push({ id, desc: `${r.playerName} 1+ Hit vs ${r.pitcherName.split(" ").pop()}`, pct: r.pct }); }
    }
    for (const r of g.props["2+ Hits"].slice(0, 4)) {
      const id = `${r.id}-2Hits`;
      if (!seen.has(id)) { seen.add(id); twoHitsLegs.push({ id, desc: `${r.playerName} 2+ Hits vs ${r.pitcherName.split(" ").pop()}`, pct: r.pct }); }
    }
    for (const r of g.props.HR.slice(0, 4)) {
      const id = `${r.id}-HR`;
      if (!seen.has(id)) { seen.add(id); hrLegs.push({ id, desc: `${r.playerName} HR vs ${r.pitcherName.split(" ").pop()}`, pct: r.pct }); }
    }
    for (const p of g.pitchers.filter((p) => p.overPct >= 55).slice(0, 1)) {
      const id = `${p.id}-k-over`;
      if (!seen.has(id)) { seen.add(id); kLegs.push({ id, desc: `${p.name} Over ${p.line} Ks`, pct: p.overPct }); }
    }
  }

  hitLegs.sort((a, b) => b.pct - a.pct);
  twoHitsLegs.sort((a, b) => b.pct - a.pct);
  hrLegs.sort((a, b) => b.pct - a.pct);
  kLegs.sort((a, b) => b.pct - a.pct);

  const safe     = hitLegs.filter((l) => l.pct >= 62);
  const longshot = [
    ...hrLegs.filter((l) => l.pct >= 13),
    ...twoHitsLegs.filter((l) => l.pct >= 35 && l.pct < 62),
  ].sort((a, b) => b.pct - a.pct);

  const slips: DailySlip[] = [];

  function dedupeNames(arr: typeof hitLegs) {
    const names = new Set<string>();
    return arr.filter((l) => {
      const name = l.desc.split(" ").slice(0, 2).join(" ");
      if (names.has(name)) return false;
      names.add(name);
      return true;
    });
  }

  function toLegs(arr: typeof hitLegs): DailySlipLeg[] {
    return arr.map((l) => ({ id: l.id, description: l.desc, probability: l.pct }));
  }

  function combinedPct(arr: typeof hitLegs): number {
    return arr.reduce((a, l) => a * (l.pct / 100), 1) * 100;
  }

  function trySlip(id: string, label: string, tier: "safe" | "longshot", arr: typeof hitLegs, minLegs: number): DailySlip | null {
    const unique = dedupeNames(arr);
    if (unique.length < minLegs) return null;
    const legs = unique.slice(0, minLegs);
    return { id, label, tier, legs: toLegs(legs), combinedPct: combinedPct(legs) };
  }

  // Safe slips
  const s2 = trySlip("2-safe", "2-Leg Safe Pick", "safe", safe, 2);
  if (s2) slips.push(s2);

  const s3arr = dedupeNames([...safe.slice(0, 2), ...kLegs.slice(0, 1)]);
  const s3 = s3arr.length >= 3
    ? trySlip("3-safe", "3-Leg Safe Pick", "safe", s3arr, 3)
    : trySlip("3-safe", "3-Leg Safe Pick", "safe", safe, 3);
  if (s3) slips.push(s3);

  const s4arr = dedupeNames([...safe.slice(0, 3), ...kLegs.slice(0, 1)]);
  const s4 = s4arr.length >= 4
    ? trySlip("4-safe", "4-Leg Safe Pick", "safe", s4arr, 4)
    : trySlip("4-safe", "4-Leg Safe Pick", "safe", safe, 4);
  if (s4) slips.push(s4);

  const s5arr = dedupeNames([...safe.slice(0, 4), ...kLegs.slice(0, 1)]);
  const s5 = s5arr.length >= 5
    ? trySlip("5-safe", "5-Leg Safe Pick", "safe", s5arr, 5)
    : trySlip("5-safe", "5-Leg Safe Pick", "safe", safe, 5);
  if (s5) slips.push(s5);

  // Long shot slips
  const ls2 = trySlip("2-longshot", "2-Leg Long Shot", "longshot", longshot, 2);
  if (ls2) slips.push(ls2);
  const ls3 = trySlip("3-longshot", "3-Leg Long Shot", "longshot", longshot, 3);
  if (ls3) slips.push(ls3);
  const ls4 = trySlip("4-longshot", "4-Leg Long Shot", "longshot", longshot, 4);
  if (ls4) slips.push(ls4);
  const ls5 = trySlip("5-longshot", "5-Leg Long Shot", "longshot", longshot, 5);
  if (ls5) slips.push(ls5);

  return slips;
}

// ── Game data builder ─────────────────────────────────────────────────────────

async function buildPropGames(): Promise<{ games: PropGame[]; dailySlips: DailySlip[] }> {
  const games        = await fetchTodaysGames();
  const withPitchers = games.filter((g) => g.teams.away.probablePitcher || g.teams.home.probablePitcher);

  const propGames = await Promise.all(
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

      const makeCombined = (type: BatterPropType) =>
        [
          ...buildBatterRows(awayBatters, homePitcherStats, homePName, type),
          ...buildBatterRows(homeBatters, awayPitcherStats, awayPName, type),
        ].sort((a, b) => b.pct - a.pct).slice(0, 22);

      const runsData = totalRunsProp(homePitcherStats, awayPitcherStats, homeBatters, awayBatters, game.venue.name, weather);

      // First Inning O/U
      const firstInning: FirstInningPropData[] = [];
      if (game.teams.away.probablePitcher && awayPitcherStats) {
        const fi = buildFirstInningProp(awayPitcherStats, homeBatters);
        firstInning.push({
          pitcherId:   game.teams.away.probablePitcher.id,
          pitcherName: awayPName,
          pitcherTeam: game.teams.away.team.name,
          opponent:    game.teams.home.team.name,
          era:         awayPitcherStats.era.toFixed(2),
          whip:        awayPitcherStats.whip.toFixed(2),
          wins:        awayPitcherStats.wins,
          losses:      awayPitcherStats.losses,
          overPct:     fi.overPct,
          underPct:    fi.underPct,
        });
      }
      if (game.teams.home.probablePitcher && homePitcherStats) {
        const fi = buildFirstInningProp(homePitcherStats, awayBatters);
        firstInning.push({
          pitcherId:   game.teams.home.probablePitcher.id,
          pitcherName: homePName,
          pitcherTeam: game.teams.home.team.name,
          opponent:    game.teams.away.team.name,
          era:         homePitcherStats.era.toFixed(2),
          whip:        homePitcherStats.whip.toFixed(2),
          wins:        homePitcherStats.wins,
          losses:      homePitcherStats.losses,
          overPct:     fi.overPct,
          underPct:    fi.underPct,
        });
      }

      // Moneyline
      const moneyline: MoneylinePropData | null =
        homePitcherStats && awayPitcherStats
          ? buildMoneylinePrediction(
              homePitcherStats,
              awayPitcherStats,
              game.teams.home.team.name,
              game.teams.away.team.name,
              game.teams.home.team.id,
              game.teams.away.team.id,
            )
          : null;

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
          awayPitcher: { name: awayPName, era: awayPitcherStats?.era ?? null, whip: awayPitcherStats?.whip ?? null, k9: awayPitcherStats?.strikeoutsPer9Inn ?? null, wins: awayPitcherStats?.wins ?? 0, losses: awayPitcherStats?.losses ?? 0 },
          homePitcher: { name: homePName, era: homePitcherStats?.era ?? null, whip: homePitcherStats?.whip ?? null, k9: homePitcherStats?.strikeoutsPer9Inn ?? null, wins: homePitcherStats?.wins ?? 0, losses: homePitcherStats?.losses ?? 0 },
          venue:   game.venue.name,
          weather: weather ?? null,
        },
        firstInning,
        moneyline,
      } satisfies PropGame;
    })
  );

  const dailySlips = buildDailySlips(propGames);
  return { games: propGames, dailySlips };
}

// ── Page ──────────────────────────────────────────────────────────────────────

async function PropsContent() {
  const { games, dailySlips } = await buildPropGames();
  if (!games.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Layers size={44} className="text-white/10 mb-4" strokeWidth={1.2} />
        <p className="text-white/35">No prop data available yet. Check back closer to first pitch.</p>
      </div>
    );
  }
  return <PropsTool games={games} dailySlips={dailySlips} />;
}

export default function PropsPage() {
  return (
    <div className="px-4 py-5 sm:px-8 sm:py-7 max-w-screen-xl mx-auto">
      <div className="mb-6">
        <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-1">Today&apos;s Slate</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">Prop Builder</h1>
        <p className="text-sm text-white/35">
          Dashboard · HR Nuke Model · 1st Inn O/U · Moneyline · Pitcher Ks · Total Runs
        </p>
      </div>

      <PaywallGate
        feature="Prop Builder"
        benefits={[
          "Dashboard: pre-built 2–5 leg safe & long shot parlays",
          "HR Nuke model with HOT & DUE badges",
          "1st Inning Over/Under 0.5 runs",
          "Moneyline win predictions",
          "Pitcher strikeout O/U projections",
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
