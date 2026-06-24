import { Suspense } from "react";
import Link from "next/link";
import { TrendingUp, RefreshCw, Zap, Target, ExternalLink, Layers } from "lucide-react";
import {
  fetchTodaysGames,
  fetchPitcherStats,
  fetchTeamBatters,
  computeWinProbability,
  teamLogoUrl,
  type Game,
  type PitcherSeasonStats,
  type RosterBatter,
} from "@/lib/mlb/api";
import { unstable_noStore as noStore } from "next/cache";
import { generateJSON, hasAnthropicKey } from "@/lib/anthropic";
import { PaywallGate } from "@/components/web-tool/paywall-gate";
import { PlayerImg } from "@/components/web-tool/player-img";
import { fetchFanDuelOddsMap, lookupLine, lookupGameTotal } from "@/lib/odds";
import {
  PropsTool,
  type PropGame,
  type DailySlip,
  type DailySlipLeg,
  type FirstInningPropData,
  type MoneylinePropData,
} from "@/app/(app)/props/props-tool";

export const dynamic = "force-dynamic";

// ── Edge Report types ─────────────────────────────────────────────────────────

interface EdgeScoreResult {
  edgeScore: number;
  grade: string;
  confidence: string;
  recommendedBets: string[];
  winProbability: { home: number; away: number };
  keyEdges: string[];
  insight: string;
  overUnderLean: string;
  totalRunEstimate: number;
  isAI: boolean;
}

interface StrongPick {
  game: string;
  pick: string;
  reasoning: string;
  confidenceLevel: "LOCK" | "STRONG" | "LEAN";
  edgeScore: number;
}

interface DailyPicksResult {
  strongPicks: StrongPick[];
  dayRating: string;
  dayNote: string;
}

const CONFIDENCE_COLOR: Record<string, string> = {
  LOCK:   "#50C882",
  STRONG: "#FF7828",
  LEAN:   "#818cf8",
};

// ── Rule-based fallback edge scoring ─────────────────────────────────────────

function ruleBasedEdgeScore(
  homeP: PitcherSeasonStats | null,
  awayP: PitcherSeasonStats | null,
  winProb: { home: number; away: number },
): EdgeScoreResult {
  const pitcherScore = (p: PitcherSeasonStats | null) => {
    if (!p) return 0;
    return Math.max(0, (6 - p.era) * 8 + (2 - p.whip) * 10 + p.strikeoutsPer9Inn * 1.5);
  };

  const homeScore = pitcherScore(homeP);
  const awayScore = pitcherScore(awayP);
  const differential = Math.abs(homeScore - awayScore);
  const edgeScore = Math.min(95, Math.max(20, Math.round(40 + differential * 1.2)));

  const grade =
    edgeScore >= 80 ? "A+" :
    edgeScore >= 70 ? "A"  :
    edgeScore >= 60 ? "B+" :
    edgeScore >= 50 ? "B"  :
    edgeScore >= 38 ? "C+" : "C";

  const favored = winProb.home >= 50 ? "home" : "away";
  const favoredP = favored === "home" ? homeP : awayP;
  const keyEdges: string[] = [];
  if (favoredP) {
    if (favoredP.era < 3.5)  keyEdges.push(`Elite ERA ${favoredP.era.toFixed(2)}`);
    if (favoredP.whip < 1.1) keyEdges.push(`Elite WHIP ${favoredP.whip.toFixed(2)}`);
    if (favoredP.strikeoutsPer9Inn > 9) keyEdges.push(`High K/9 ${favoredP.strikeoutsPer9Inn.toFixed(1)}`);
  }
  if (!keyEdges.length) keyEdges.push("Pitcher matchup neutral", "Model-based estimate");

  const homeRunEstimate = homeP && awayP
    ? Math.round((homeP.era + awayP.era) * 0.38 + 2)
    : 8;

  return {
    edgeScore,
    grade,
    confidence:      edgeScore >= 70 ? "HIGH" : edgeScore >= 50 ? "MEDIUM" : "LOW",
    recommendedBets: [`${favored === "home" ? "Home" : "Away"} ML`],
    winProbability:  winProb,
    keyEdges,
    insight:         `Model projects ${Math.max(winProb.home, winProb.away)}% win prob for ${favored} team`,
    overUnderLean:   homeRunEstimate >= 9 ? "OVER" : homeRunEstimate <= 7 ? "UNDER" : "PUSH",
    totalRunEstimate: homeRunEstimate,
    isAI: false,
  };
}

// ── Edge data fetching ────────────────────────────────────────────────────────

interface GameWithScore {
  game: Game;
  score: EdgeScoreResult;
  homePitcher: PitcherSeasonStats | null;
  awayPitcher: PitcherSeasonStats | null;
  homeLineupOPS: number;
  awayLineupOPS: number;
}

async function fetchGameData(game: Game): Promise<GameWithScore> {
  const [homePStats, awayPStats, homeBatters, awayBatters] = await Promise.allSettled([
    game.teams.home.probablePitcher
      ? fetchPitcherStats(game.teams.home.probablePitcher.id)
      : Promise.resolve(null),
    game.teams.away.probablePitcher
      ? fetchPitcherStats(game.teams.away.probablePitcher.id)
      : Promise.resolve(null),
    fetchTeamBatters(game.teams.home.team.id),
    fetchTeamBatters(game.teams.away.team.id),
  ]);

  const homeP = homePStats.status === "fulfilled" ? homePStats.value : null;
  const awayP = awayPStats.status === "fulfilled" ? awayPStats.value : null;
  const homeBats = homeBatters.status === "fulfilled" ? homeBatters.value : [];
  const awayBats = awayBatters.status === "fulfilled" ? awayBatters.value : [];

  const avgOPS = (batters: typeof homeBats) => {
    if (!batters.length) return 0.7;
    const ops = batters.map((b) => parseFloat(b.stats.ops) || 0.7);
    return ops.reduce((a, b) => a + b, 0) / ops.length;
  };

  const winProb = computeWinProbability(homeP, awayP);

  let score: EdgeScoreResult;
  if (hasAnthropicKey()) {
    try {
      const prompt = `You are an elite MLB betting analyst with deep knowledge of statcast metrics, pitcher-batter matchups, and betting market inefficiencies.

Analyze this game and return a JSON edge report. Be direct and confident in your assessment.

GAME DATA:
Home: ${game.teams.home.team.name} (avg lineup OPS: ${avgOPS(homeBats).toFixed(3)})
Away: ${game.teams.away.team.name} (avg lineup OPS: ${avgOPS(awayBats).toFixed(3)})
Home Pitcher: ${game.teams.home.probablePitcher?.fullName ?? "TBD"} — ERA: ${homeP?.era ?? "N/A"}, WHIP: ${homeP?.whip ?? "N/A"}, K/9: ${homeP?.strikeoutsPer9Inn ?? "N/A"}, HR/9: ${homeP?.homeRunsPer9 ?? "N/A"}
Away Pitcher: ${game.teams.away.probablePitcher?.fullName ?? "TBD"} — ERA: ${awayP?.era ?? "N/A"}, WHIP: ${awayP?.whip ?? "N/A"}, K/9: ${awayP?.strikeoutsPer9Inn ?? "N/A"}, HR/9: ${awayP?.homeRunsPer9 ?? "N/A"}
Venue: ${game.venue.name}

Respond ONLY with this JSON (no markdown, no code fences):
{
  "edgeScore": <integer 0-100>,
  "grade": "<A+|A|B+|B|C+|C|D>",
  "confidence": "<HIGH|MEDIUM|LOW>",
  "recommendedBets": ["<specific bet>"],
  "winProbability": { "home": <0-1>, "away": <0-1> },
  "keyEdges": ["<factor 1>", "<factor 2>", "<factor 3>"],
  "insight": "<one punchy sentence, max 20 words, no hedging>",
  "overUnderLean": "<OVER|UNDER|PUSH>",
  "totalRunEstimate": <number>
}`;
      const raw = await generateJSON<Omit<EdgeScoreResult, "isAI">>(prompt);
      score = { ...raw, isAI: true };
    } catch {
      score = ruleBasedEdgeScore(homeP, awayP, winProb);
    }
  } else {
    score = ruleBasedEdgeScore(homeP, awayP, winProb);
  }

  return {
    game,
    score,
    homePitcher: homeP,
    awayPitcher: awayP,
    homeLineupOPS: avgOPS(homeBats),
    awayLineupOPS: avgOPS(awayBats),
  };
}

// ── Edge UI Components ────────────────────────────────────────────────────────

function GradeChip({ grade }: { grade: string }) {
  const color = grade.startsWith("A") ? "#50C882" : grade.startsWith("B") ? "#FF7828" : "#818cf8";
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black border"
      style={{ color, borderColor: `${color}40`, backgroundColor: `${color}15` }}
    >
      {grade}
    </div>
  );
}

function MatchupRow({
  pitcherName,
  era,
  whip,
  k9,
  opponentOPS,
}: {
  pitcherName: string;
  era: number;
  whip: number;
  k9: number;
  opponentOPS: number;
}) {
  const advantage = era < 3.8 && opponentOPS < 0.75;
  const color = advantage ? "#50C882" : opponentOPS > 0.8 ? "#EB505A" : "#FF7828";
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.04] last:border-0">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-white truncate">{pitcherName.split(" ").pop()}</p>
        <p className="text-[10px] text-white/30">{era.toFixed(2)} ERA · {whip.toFixed(2)} WHIP · {k9.toFixed(1)} K/9</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] text-white/30">vs lineup OPS</p>
        <p className="text-sm font-black" style={{ color }}>{opponentOPS.toFixed(3)}</p>
      </div>
    </div>
  );
}

function EdgeCard({ data }: { data: GameWithScore }) {
  const { game, score, homePitcher, awayPitcher, homeLineupOPS, awayLineupOPS } = data;
  const away = game.teams.away;
  const home = game.teams.home;
  const edgeColor = score.edgeScore >= 75 ? "#50C882" : score.edgeScore >= 60 ? "#FF7828" : "#818cf8";

  return (
    <Link href={`/game/${game.gamePk}`} className="block group">
      <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5 flex flex-col gap-3 hover:border-white/[0.14] transition-colors h-full">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <PlayerImg src={teamLogoUrl(away.team.id)} alt="" className="w-7 h-7 object-contain" />
            <div>
              <p className="text-sm font-bold text-white">
                {away.team.name.split(" ").pop()} <span className="text-white/25 font-normal">@</span> {home.team.name.split(" ").pop()}
              </p>
              {away.probablePitcher && home.probablePitcher && (
                <p className="text-[11px] text-white/30 mt-0.5">
                  {away.probablePitcher.fullName.split(" ").pop()} vs {home.probablePitcher.fullName.split(" ").pop()}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GradeChip grade={score.grade} />
            <div className="text-right">
              <p className="text-[10px] text-white/25 tracking-widest uppercase">Edge Score</p>
              <p className="text-2xl font-black" style={{ color: edgeColor }}>{score.edgeScore}</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${score.edgeScore}%`, backgroundColor: edgeColor }} />
        </div>

        {/* Insight */}
        <p className="text-xs text-white/50 leading-relaxed italic">&ldquo;{score.insight}&rdquo;</p>

        {/* Key edges */}
        {score.keyEdges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {score.keyEdges.slice(0, 3).map((k) => (
              <span key={k} className="text-[10px] text-white/40 border border-white/[0.06] bg-white/[0.03] rounded-full px-2.5 py-0.5">{k}</span>
            ))}
          </div>
        )}

        {/* H2H Matchup rows */}
        {(homePitcher || awayPitcher) && (
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] px-3 py-2">
            <p className="text-[9px] font-bold text-white/20 tracking-widest uppercase mb-1.5">Pitcher vs Lineup</p>
            {awayPitcher && away.probablePitcher && (
              <MatchupRow
                pitcherName={away.probablePitcher.fullName}
                era={awayPitcher.era}
                whip={awayPitcher.whip}
                k9={awayPitcher.strikeoutsPer9Inn}
                opponentOPS={homeLineupOPS}
              />
            )}
            {homePitcher && home.probablePitcher && (
              <MatchupRow
                pitcherName={home.probablePitcher.fullName}
                era={homePitcher.era}
                whip={homePitcher.whip}
                k9={homePitcher.strikeoutsPer9Inn}
                opponentOPS={awayLineupOPS}
              />
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-white/25 pt-1 border-t border-white/[0.04]">
          <span>
            {Math.round(score.winProbability.home * 100)}% home · {Math.round(score.winProbability.away * 100)}% away
          </span>
          <div className="flex items-center gap-2">
            <span className={score.overUnderLean === "OVER" ? "text-[#50C882]" : score.overUnderLean === "UNDER" ? "text-red-400" : ""}>
              {score.overUnderLean} · {score.totalRunEstimate} est. runs
            </span>
            {!score.isAI && (
              <span className="text-white/15 text-[9px]">model</span>
            )}
          </div>
        </div>

        {/* Recommended bet */}
        {score.recommendedBets.length > 0 && (
          <div className="rounded-xl bg-[#FF7828]/[0.08] border border-[#FF7828]/15 px-3 py-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-[9px] text-[#FF7828]/60 font-bold uppercase tracking-widest mb-0.5">Recommended</p>
              <p className="text-xs text-[#FF7828] font-bold">{score.recommendedBets[0]}</p>
            </div>
            <ExternalLink size={12} className="text-[#FF7828]/40 shrink-0 group-hover:text-[#FF7828]/70 transition-colors" />
          </div>
        )}
      </div>
    </Link>
  );
}

function PickBadge({ level }: { level: string }) {
  const color = CONFIDENCE_COLOR[level] ?? "#818cf8";
  return (
    <span className="text-[9px] font-black px-2 py-0.5 rounded-full border" style={{ color, borderColor: `${color}40`, backgroundColor: `${color}15` }}>
      {level}
    </span>
  );
}

async function StrongPicksBanner({ games }: { games: Array<{ away: string; home: string; edgeScore: number; grade: string; keyEdges: string[] }> }) {
  if (!games.length || !hasAnthropicKey()) return null;

  let picks: DailyPicksResult | null = null;
  try {
    const gameLines = games
      .map((g) => `${g.away} @ ${g.home}: Edge Score ${g.edgeScore}, Grade ${g.grade}, Keys: ${g.keyEdges.join(", ")}`)
      .join("\n");

    picks = await generateJSON<DailyPicksResult>(`You are an MLB sharp bettor. Given today's edge report scores across all games, identify the 3 strongest plays of the day.

GAMES WITH SCORES:
${gameLines}

Return ONLY this JSON (no markdown, no code fences):
{
  "strongPicks": [
    {
      "game": "<Away @ Home>",
      "pick": "<specific bet>",
      "reasoning": "<one sentence>",
      "confidenceLevel": "<LOCK|STRONG|LEAN>",
      "edgeScore": <int>
    }
  ],
  "dayRating": "<JUICY|GOOD|AVERAGE|THIN>",
  "dayNote": "<one sentence about today's slate overall>"
}`);
  } catch {
    return null;
  }

  if (!picks?.strongPicks?.length) return null;

  const dayColor = picks.dayRating === "JUICY" ? "#50C882" : picks.dayRating === "GOOD" ? "#FF7828" : "#818cf8";

  return (
    <div className="mb-8 rounded-2xl border border-[#50C882]/20 bg-[#50C882]/[0.04] p-5 overflow-hidden relative">
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#50C882]/[0.06] blur-3xl pointer-events-none" />
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-[#50C882]" strokeWidth={2} />
          <p className="text-sm font-black text-white">Today&apos;s Strong Picks</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: dayColor }}>{picks.dayRating} SLATE</span>
          <span className="text-[10px] text-white/25">·</span>
          <span className="text-[10px] text-white/35">{picks.dayNote}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {picks.strongPicks.map((p, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-[#111622] p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] text-white/35">{p.game}</p>
              <PickBadge level={p.confidenceLevel} />
            </div>
            <p className="text-sm font-black text-white mb-1">{p.pick}</p>
            <p className="text-[11px] text-white/40 leading-relaxed">{p.reasoning}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

async function EdgeContent() {
  try {
    let games: Game[] = [];
    try { games = await fetchTodaysGames(); } catch {}

    const withPitchers = games.filter(
      (g) => g.teams.away.probablePitcher || g.teams.home.probablePitcher
    );

    if (!withPitchers.length) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Zap size={44} className="text-white/10 mb-4" strokeWidth={1.2} />
          <p className="text-white/35">Edge data requires confirmed pitchers</p>
        </div>
      );
    }

    const capped = withPitchers.slice(0, 8);
    const results = await Promise.allSettled(capped.map(fetchGameData));

    const scored: GameWithScore[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") scored.push(r.value);
    }

    if (!scored.length) {
      return (
        <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-8 text-center">
          <Zap size={38} className="mx-auto mb-3 text-white/10" strokeWidth={1.2} />
          <p className="text-white/45">Could not load game data. Please try again shortly.</p>
        </div>
      );
    }

    const sorted = [...scored].sort((a, b) => b.score.edgeScore - a.score.edgeScore);

    const picksInput = sorted.map(({ game, score }) => ({
      away:      game.teams.away.team.name,
      home:      game.teams.home.team.name,
      edgeScore: score.edgeScore,
      grade:     score.grade,
      keyEdges:  score.keyEdges,
    }));

    const isAI = scored.some((s) => s.score.isAI);

    return (
      <>
        {isAI && (
          <Suspense fallback={null}>
            <StrongPicksBanner games={picksInput} />
          </Suspense>
        )}
        {!hasAnthropicKey() && (
          <div className="mb-5 rounded-xl border border-[#FF7828]/20 bg-[#FF7828]/[0.05] px-4 py-3 flex items-center gap-3">
            <TrendingUp size={14} className="text-[#FF7828] shrink-0" strokeWidth={2} />
            <p className="text-xs text-white/50">
              <span className="text-[#FF7828] font-bold">Tip:</span> Add <code className="text-white/70 bg-white/[0.08] px-1 rounded">ANTHROPIC_API_KEY</code> to your Vercel env vars to enable AI-powered edge scoring.
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((data) => (
            <EdgeCard key={data.game.gamePk} data={data} />
          ))}
        </div>
      </>
    );
  } catch {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-8 text-center">
        <Zap size={38} className="mx-auto mb-3 text-white/10" strokeWidth={1.2} />
        <p className="text-white/45 mb-2">Edge data temporarily unavailable.</p>
        <p className="text-xs text-white/25">Check back in a moment — MLB data may be refreshing.</p>
      </div>
    );
  }
}

// ── Props content (copied from old props/page.tsx) ────────────────────────────

type BatterPropType = "HR" | "Hit" | "2+ Hits" | "2+ Bases";

function normalCDF(z: number): number {
  return 1 / (1 + Math.exp(-1.7 * z));
}

function hrNukeProbability(batterHrPerAb: number, pitcherEra: number, batterOps: number): number {
  const era   = pitcherEra  || 4.5;
  const ops   = batterOps   || 0.700;
  const power = Math.min(1, Math.max(0, (ops - 0.62) / 0.38));
  const base  = Math.max(0, batterHrPerAb) * 100 * (era / 4.5) * 3.8;
  return Math.min(35, Math.max(4, Math.round(base + power * 5)));
}

function hrHotFlag(pct: number, batterOps: number, pitcherEra: number): boolean {
  const ops         = batterOps  || 0.700;
  const era         = pitcherEra || 4.5;
  const power       = Math.min(1, Math.max(0, (ops - 0.62) / 0.38));
  const vulnerability = Math.max(0, (era - 3.2) / 2.8);
  return pct >= 16 || (pct + power * 24 + vulnerability * 16) >= 44;
}

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

function buildFirstInningProp(
  pitcher: PitcherSeasonStats,
  opposingBatters: RosterBatter[],
): { overPct: number; underPct: number } {
  const era  = pitcher.era  || 4.5;
  const whip = pitcher.whip || 1.30;
  const teamAvg = opposingBatters.length > 0
    ? opposingBatters.slice(0, 4).reduce((s, b) => s + (parseFloat(b.stats.avg) || 0.245), 0) / Math.min(opposingBatters.length, 4)
    : 0.245;

  let overPct = 38;
  overPct += (whip - 1.30) * 30;
  overPct += (era  - 4.0)  * 3;
  overPct += (teamAvg - 0.245) * 80;
  overPct = Math.min(72, Math.max(25, Math.round(overPct)));
  return { overPct, underPct: 100 - overPct };
}

const LEAGUE_AVG_PITCHER: PitcherSeasonStats = {
  wins: 0, losses: 0, era: 4.50, whip: 1.30, strikeOuts: 0,
  inningsPitched: "5.0", gamesStarted: 1, strikeoutsPer9Inn: 8.5,
  homeRunsPer9: 1.1, walksPer9Inn: 3.3, homeRuns: 0, baseOnBalls: 0,
};

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
  homeAdj += 4;

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

function totalRunsProp(
  homePitcher: PitcherSeasonStats | null,
  awayPitcher: PitcherSeasonStats | null,
  homeBatters: RosterBatter[],
  awayBatters: RosterBatter[],
  venue: string,
  wx: null,
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

  const total = expectedHome + expectedAway;

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

interface BuildLeg {
  id: string;
  desc: string;
  playerName: string;
  pct: number;
  playerId?: number;
  teamId?: number;
  propType: string;
  gamePk: number;
}

function buildDailySlips(games: PropGame[]): DailySlip[] {
  const hitLegs:     BuildLeg[] = [];
  const twoHitsLegs: BuildLeg[] = [];
  const hrLegs:      BuildLeg[] = [];
  const kOverLegs:   BuildLeg[] = [];
  const kUnderLegs:  BuildLeg[] = [];
  const seen = new Set<string>();

  for (const g of games) {
    for (const r of g.props.Hit.slice(0, 8)) {
      const id = `${r.id}-Hit`;
      if (!seen.has(id)) { seen.add(id); hitLegs.push({ id, desc: `${r.playerName} 1+ Hit`, playerName: r.playerName, pct: r.pct, playerId: r.id, teamId: r.teamId, propType: "1+ Hit", gamePk: g.gamePk }); }
    }
    for (const r of g.props["2+ Hits"].slice(0, 6)) {
      const id = `${r.id}-2Hits`;
      if (!seen.has(id)) { seen.add(id); twoHitsLegs.push({ id, desc: `${r.playerName} 2+ Hits`, playerName: r.playerName, pct: r.pct, playerId: r.id, teamId: r.teamId, propType: "2+ Hits", gamePk: g.gamePk }); }
    }
    for (const r of g.props.HR.slice(0, 6)) {
      const id = `${r.id}-HR`;
      if (!seen.has(id)) { seen.add(id); hrLegs.push({ id, desc: `${r.playerName} HR`, playerName: r.playerName, pct: r.pct, playerId: r.id, teamId: r.teamId, propType: "HR", gamePk: g.gamePk }); }
    }
    for (const p of g.pitchers) {
      const overId  = `${p.id}-k-over`;
      const underId = `${p.id}-k-under`;
      if (!seen.has(overId))  { seen.add(overId);  kOverLegs.push({ id: overId,  desc: `${p.name} Over ${p.line} Ks`,  playerName: p.name, pct: p.overPct,  playerId: p.id, propType: "Pitcher K's", gamePk: g.gamePk }); }
      if (!seen.has(underId)) { seen.add(underId); kUnderLegs.push({ id: underId, desc: `${p.name} Under ${p.line} Ks`, playerName: p.name, pct: p.underPct, playerId: p.id, propType: "K Under",     gamePk: g.gamePk }); }
    }
  }

  hitLegs.sort((a, b) => b.pct - a.pct);
  twoHitsLegs.sort((a, b) => b.pct - a.pct);
  hrLegs.sort((a, b) => b.pct - a.pct);
  kOverLegs.sort((a, b) => b.pct - a.pct);
  kUnderLegs.sort((a, b) => b.pct - a.pct);

  function shuffleWithinTiers(legs: BuildLeg[], band = 4): BuildLeg[] {
    if (legs.length <= 1) return legs;
    const out: BuildLeg[] = [];
    let i = 0;
    while (i < legs.length) {
      let j = i + 1;
      while (j < legs.length && legs[j].pct >= legs[i].pct - band) j++;
      const group = legs.slice(i, j);
      for (let k = group.length - 1; k > 0; k--) {
        const r = Math.floor(Math.random() * (k + 1));
        [group[k], group[r]] = [group[r], group[k]];
      }
      out.push(...group);
      i = j;
    }
    return out;
  }

  const safeHits    = shuffleWithinTiers(hitLegs.filter((l) => l.pct >= 62));
  const midTwoHits  = shuffleWithinTiers(twoHitsLegs.filter((l) => l.pct >= 30 && l.pct < 62));
  const hotHRs      = shuffleWithinTiers(hrLegs.filter((l) => l.pct >= 10));
  const goodKOvers  = kOverLegs.filter((l) => l.pct >= 52);
  const goodKUnders = kUnderLegs.filter((l) => l.pct >= 40);

  function spreadAcrossGames(legs: BuildLeg[], count: number): BuildLeg[] {
    const result: BuildLeg[] = [];
    const usedGames   = new Set<number>();
    const usedPlayers = new Set<string>();
    for (const leg of legs) {
      if (result.length >= count) break;
      if (!usedGames.has(leg.gamePk) && !usedPlayers.has(leg.playerName)) {
        usedGames.add(leg.gamePk);
        usedPlayers.add(leg.playerName);
        result.push(leg);
      }
    }
    for (const leg of legs) {
      if (result.length >= count) break;
      if (!usedPlayers.has(leg.playerName)) {
        usedPlayers.add(leg.playerName);
        result.push(leg);
      }
    }
    return result;
  }

  function mergeUnique(...arrs: BuildLeg[][]): BuildLeg[] {
    const used = new Set<string>();
    const result: BuildLeg[] = [];
    for (const arr of arrs) {
      for (const leg of arr) {
        if (!used.has(leg.playerName)) { used.add(leg.playerName); result.push(leg); }
      }
    }
    return result;
  }

  function toLegs(arr: BuildLeg[]): DailySlipLeg[] {
    return arr.map((l) => ({ id: l.id, description: l.desc, playerName: l.playerName, probability: l.pct, playerId: l.playerId, teamId: l.teamId, propType: l.propType }));
  }

  function combinedPct(arr: BuildLeg[]): number {
    return arr.reduce((a, l) => a * (l.pct / 100), 1) * 100;
  }

  function makeSlip(id: string, label: string, tier: "safe" | "longshot", arr: BuildLeg[]): DailySlip | null {
    if (arr.length === 0) return null;
    return { id, label, tier, legs: toLegs(arr), combinedPct: combinedPct(arr) };
  }

  function buildSafeVariants(count: number): DailySlip[] {
    const variants: DailySlip[] = [];
    const globalUsed = new Set<string>();
    for (let v = 0; v < 3; v++) {
      const avail = safeHits.filter((l) => !globalUsed.has(l.playerName));
      const kBoost = goodKOvers.filter((l) => !globalUsed.has(l.playerName));
      let picks: BuildLeg[] = [];
      if (count >= 3 && kBoost.length > 0) {
        const hits = spreadAcrossGames(avail, count - 1);
        picks = mergeUnique(hits, kBoost.slice(0, 1)).slice(0, count);
      }
      if (picks.length < count) {
        picks = spreadAcrossGames(avail, count);
      }
      if (picks.length >= count) {
        const slip = makeSlip(`${count}-safe-v${v}`, `${count}-Leg Safe Pick`, "safe", picks.slice(0, count));
        if (slip) { variants.push(slip); picks.slice(0, count).forEach((l) => globalUsed.add(l.playerName)); }
      }
    }
    return variants;
  }

  function buildLongshotVariants(count: number): DailySlip[] {
    const variants: DailySlip[] = [];
    const globalUsed = new Set<string>();
    for (let v = 0; v < 3; v++) {
      const availHR  = hotHRs.filter((l) => !globalUsed.has(l.playerName));
      const avail2H  = midTwoHits.filter((l) => !globalUsed.has(l.playerName));
      const availKU  = goodKUnders.filter((l) => !globalUsed.has(l.playerName));
      let picks: BuildLeg[] = [];
      if (count === 2) {
        picks = mergeUnique(spreadAcrossGames(availHR, 1), spreadAcrossGames(avail2H, 1)).slice(0, 2);
      } else if (count <= 4) {
        const hrCount  = Math.max(1, Math.floor(count / 2));
        const hrs      = spreadAcrossGames(availHR, hrCount);
        const usedHR   = new Set(hrs.map((l) => l.playerName));
        const twos     = spreadAcrossGames(avail2H.filter((l) => !usedHR.has(l.playerName)), count - hrCount);
        picks = mergeUnique(hrs, twos).slice(0, count);
      } else {
        const hrs   = spreadAcrossGames(availHR, 2);
        const used  = new Set(hrs.map((l) => l.playerName));
        const twos  = spreadAcrossGames(avail2H.filter((l) => !used.has(l.playerName)), count - 2 - (availKU.length > 0 ? 1 : 0));
        [...twos].forEach((l) => used.add(l.playerName));
        const kus   = availKU.filter((l) => !used.has(l.playerName)).slice(0, 1);
        picks = mergeUnique(hrs, twos, kus).slice(0, count);
      }
      if (picks.length < count) {
        const combined = mergeUnique(availHR, avail2H);
        picks = spreadAcrossGames(combined, count);
      }
      if (picks.length >= count) {
        const slip = makeSlip(`${count}-longshot-v${v}`, `${count}-Leg Long Shot`, "longshot", picks.slice(0, count));
        if (slip) { variants.push(slip); picks.slice(0, count).forEach((l) => globalUsed.add(l.playerName)); }
      }
    }
    return variants;
  }

  const slips: DailySlip[] = [];
  for (const count of [2, 3, 4, 5, 6]) {
    slips.push(...buildSafeVariants(count));
    slips.push(...buildLongshotVariants(count));
  }
  return slips;
}

async function buildPropGames(): Promise<{ games: PropGame[]; dailySlips: DailySlip[]; fanDuelOdds: Record<string, string> }> {
  noStore();
  const [allGames, fanDuelOdds] = await Promise.all([
    fetchTodaysGames(),
    fetchFanDuelOddsMap(),
  ]);
  const withPitchers = allGames.filter((g) => g.teams.away.probablePitcher || g.teams.home.probablePitcher);

  const propGames = await Promise.all(
    withPitchers.map(async (game) => {
      const [homeBatters, awayBatters, homePitcherStats, awayPitcherStats] = await Promise.all([
        fetchTeamBatters(game.teams.home.team.id),
        fetchTeamBatters(game.teams.away.team.id),
        game.teams.home.probablePitcher ? fetchPitcherStats(game.teams.home.probablePitcher.id) : Promise.resolve(null),
        game.teams.away.probablePitcher ? fetchPitcherStats(game.teams.away.probablePitcher.id) : Promise.resolve(null),
      ]);

      const homePName = game.teams.home.probablePitcher?.fullName ?? "TBD";
      const awayPName = game.teams.away.probablePitcher?.fullName ?? "TBD";

      const makeCombined = (type: BatterPropType) =>
        [
          ...buildBatterRows(awayBatters, homePitcherStats, homePName, type),
          ...buildBatterRows(homeBatters, awayPitcherStats, awayPName, type),
        ].sort((a, b) => b.pct - a.pct).slice(0, 22);

      const runsData = totalRunsProp(homePitcherStats, awayPitcherStats, homeBatters, awayBatters, game.venue.name, null);

      const topFirstPct = homePitcherStats
        ? buildFirstInningProp(homePitcherStats, awayBatters).overPct / 100
        : 0.38;
      const botFirstPct = awayPitcherStats
        ? buildFirstInningProp(awayPitcherStats, homeBatters).overPct / 100
        : 0.38;
      const combinedOver1stPct = Math.min(80, Math.max(20,
        Math.round(100 * (1 - (1 - topFirstPct) * (1 - botFirstPct))),
      ));
      const firstInning: FirstInningPropData | null =
        (game.teams.away.probablePitcher || game.teams.home.probablePitcher)
          ? {
              gamePk:          game.gamePk,
              awayTeam:        game.teams.away.team.name,
              awayTeamId:      game.teams.away.team.id,
              homeTeam:        game.teams.home.team.name,
              homeTeamId:      game.teams.home.team.id,
              awayPitcherName: awayPName,
              homePitcherName: homePName,
              awayPitcherEra:  awayPitcherStats?.era.toFixed(2) ?? "—",
              homePitcherEra:  homePitcherStats?.era.toFixed(2) ?? "—",
              overPct:         combinedOver1stPct,
              underPct:        100 - combinedOver1stPct,
            }
          : null;

      const moneyline: MoneylinePropData | null =
        (game.teams.home.probablePitcher || game.teams.away.probablePitcher)
          ? buildMoneylinePrediction(
              homePitcherStats ?? LEAGUE_AVG_PITCHER,
              awayPitcherStats ?? LEAGUE_AVG_PITCHER,
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
            ? [{ id: game.teams.away.probablePitcher.id, name: awayPName, teamName: game.teams.away.team.name, opponent: game.teams.home.team.name, era: awayPitcherStats.era.toFixed(2), whip: awayPitcherStats.whip.toFixed(2), wins: awayPitcherStats.wins, losses: awayPitcherStats.losses, ...pitcherKLineProp(awayPitcherStats), bookLine: lookupLine(fanDuelOdds, awayPName, "Pitcher K's") ?? undefined }]
            : []),
          ...(game.teams.home.probablePitcher && homePitcherStats
            ? [{ id: game.teams.home.probablePitcher.id, name: homePName, teamName: game.teams.home.team.name, opponent: game.teams.away.team.name, era: homePitcherStats.era.toFixed(2), whip: homePitcherStats.whip.toFixed(2), wins: homePitcherStats.wins, losses: homePitcherStats.losses, ...pitcherKLineProp(homePitcherStats), bookLine: lookupLine(fanDuelOdds, homePName, "Pitcher K's") ?? undefined }]
            : []),
        ],
        totalRuns: {
          ...runsData,
          awayTeam: game.teams.away.team.name,
          homeTeam: game.teams.home.team.name,
          awayPitcher: { name: awayPName, era: awayPitcherStats?.era ?? null, whip: awayPitcherStats?.whip ?? null, k9: awayPitcherStats?.strikeoutsPer9Inn ?? null, wins: awayPitcherStats?.wins ?? 0, losses: awayPitcherStats?.losses ?? 0 },
          homePitcher: { name: homePName, era: homePitcherStats?.era ?? null, whip: homePitcherStats?.whip ?? null, k9: homePitcherStats?.strikeoutsPer9Inn ?? null, wins: homePitcherStats?.wins ?? 0, losses: homePitcherStats?.losses ?? 0 },
          venue:   game.venue.name,
          bookLine: lookupGameTotal(fanDuelOdds, game.teams.away.team.name, game.teams.home.team.name) ?? undefined,
        },
        firstInning,
        moneyline,
      } satisfies PropGame;
    })
  );

  const dailySlips = buildDailySlips(propGames);
  return { games: propGames, dailySlips, fanDuelOdds };
}

async function PropsContent() {
  const { games, dailySlips, fanDuelOdds } = await buildPropGames();
  if (!games.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Layers size={44} className="text-white/10 mb-4" strokeWidth={1.2} />
        <p className="text-white/35">No prop data available yet. Check back closer to first pitch.</p>
      </div>
    );
  }
  return <PropsTool games={games} dailySlips={dailySlips} fanDuelOdds={fanDuelOdds} />;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === "props" ? "props" : "edge";

  return (
    <div className="px-4 py-5 sm:px-8 sm:py-7 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-1">Analysis</p>
        <h1 className="text-3xl font-black font-display text-white mb-1">Edge Report</h1>
        <p className="text-sm text-white/35">Pitcher matchup grades · Prop signals · Today&apos;s best plays</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.06] w-fit">
        <Link
          href="/analysis"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === "edge"
              ? "bg-[#FF7828] text-white shadow-lg"
              : "text-white/40 hover:text-white"
          }`}
        >
          <TrendingUp size={14} strokeWidth={2} />
          Edge Report
        </Link>
        <Link
          href="/analysis?tab=props"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === "props"
              ? "bg-[#818cf8] text-white shadow-lg"
              : "text-white/40 hover:text-white"
          }`}
        >
          <Layers size={14} strokeWidth={2} />
          Prop Builder
        </Link>
      </div>

      {activeTab === "edge" ? (
        <PaywallGate
          feature="Edge Report"
          benefits={[
            "Value bets ranked by edge score",
            "Pitcher vs lineup matchup H2H grades",
            "Today's strong picks (LOCK / STRONG / LEAN) with AI",
          ]}
        >
          <Suspense fallback={
            <div className="flex items-center gap-3 py-16 text-white/30">
              <RefreshCw size={18} className="animate-spin" strokeWidth={1.5} />
              <span className="text-sm">Loading edge data...</span>
            </div>
          }>
            <EdgeContent />
          </Suspense>
        </PaywallGate>
      ) : (
        <PaywallGate
          feature="Prop Builder"
          benefits={[
            "HR probability for every batter",
            "Hit, 2+ Hits, 2+ Bases prop signals",
            "Pitcher strikeout projections",
            "Build parlay slips with AI analysis",
          ]}
        >
          <Suspense fallback={
            <div className="flex items-center gap-3 py-16 text-white/30">
              <RefreshCw size={18} className="animate-spin" strokeWidth={1.5} />
              <span className="text-sm">Loading prop data...</span>
            </div>
          }>
            <PropsContent />
          </Suspense>
        </PaywallGate>
      )}
    </div>
  );
}
