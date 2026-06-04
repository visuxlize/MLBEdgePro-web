import { Suspense } from "react";
import Link from "next/link";
import { TrendingUp, RefreshCw, Zap, Target, ExternalLink } from "lucide-react";
import {
  fetchTodaysGames,
  fetchPitcherStats,
  fetchTeamBatters,
  fetchVenueWeather,
  computeWinProbability,
  teamLogoUrl,
  type Game,
  type PitcherSeasonStats,
} from "@/lib/mlb/api";
import { generateJSON, hasAnthropicKey } from "@/lib/anthropic";
import { PaywallGate } from "@/components/web-tool/paywall-gate";

export const dynamic = "force-dynamic";

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

// ── Data fetching ─────────────────────────────────────────────────────────────

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
      const weather = await fetchVenueWeather(game.venue.id).catch(() => null);
      const prompt = `You are an elite MLB betting analyst with deep knowledge of statcast metrics, pitcher-batter matchups, and betting market inefficiencies.

Analyze this game and return a JSON edge report. Be direct and confident in your assessment.

GAME DATA:
Home: ${game.teams.home.team.name} (avg lineup OPS: ${avgOPS(homeBats).toFixed(3)})
Away: ${game.teams.away.team.name} (avg lineup OPS: ${avgOPS(awayBats).toFixed(3)})
Home Pitcher: ${game.teams.home.probablePitcher?.fullName ?? "TBD"} — ERA: ${homeP?.era ?? "N/A"}, WHIP: ${homeP?.whip ?? "N/A"}, K/9: ${homeP?.strikeoutsPer9Inn ?? "N/A"}, HR/9: ${homeP?.homeRunsPer9 ?? "N/A"}
Away Pitcher: ${game.teams.away.probablePitcher?.fullName ?? "TBD"} — ERA: ${awayP?.era ?? "N/A"}, WHIP: ${awayP?.whip ?? "N/A"}, K/9: ${awayP?.strikeoutsPer9Inn ?? "N/A"}, HR/9: ${awayP?.homeRunsPer9 ?? "N/A"}
Venue: ${game.venue.name}
Weather: ${weather ? `${weather.tempF}°F, wind ${weather.windMph}mph ${weather.windDirection}, ${weather.conditions}` : "N/A"}

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

// ── UI Components ─────────────────────────────────────────────────────────────

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
            <img src={teamLogoUrl(away.team.id)} alt="" width={28} height={28} className="w-7 h-7 object-contain" />
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
}

export default function AnalysisPage() {
  return (
    <div className="px-4 py-5 sm:px-8 sm:py-7 max-w-screen-xl mx-auto">
      <div className="mb-8">
        <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-1">Today&apos;s Edge</p>
        <h1 className="text-3xl font-black text-white mb-1">Edge Report</h1>
        <p className="text-sm text-white/35">Pitcher vs lineup matchup grades across today&apos;s full slate · Click any game for the full breakdown</p>
      </div>

      <PaywallGate
        feature="Edge Report"
        benefits={[
          "Value bets ranked by edge score",
          "Pitcher vs lineup matchup H2H grades",
          "Weather & ballpark factor analysis",
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
    </div>
  );
}
