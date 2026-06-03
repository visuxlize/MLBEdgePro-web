import { Suspense } from "react";
import { TrendingUp, RefreshCw, Zap, Lock, Target } from "lucide-react";
import {
  fetchTodaysGames,
  teamLogoUrl,
  fetchPitcherStats,
  fetchVenueWeather,
  type Game,
} from "@/lib/mlb/api";
import { generateJSON } from "@/lib/gemini";
import { PaywallGate } from "@/components/web-tool/paywall-gate";

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

async function fetchEdgeScore(game: Game): Promise<EdgeScoreResult> {
  const [homePStats, awayPStats, weather] = await Promise.allSettled([
    game.teams.home.probablePitcher
      ? fetchPitcherStats(game.teams.home.probablePitcher.id)
      : Promise.resolve(null),
    game.teams.away.probablePitcher
      ? fetchPitcherStats(game.teams.away.probablePitcher.id)
      : Promise.resolve(null),
    fetchVenueWeather(game.venue.id),
  ]);

  const homeP = homePStats.status === "fulfilled" ? homePStats.value : null;
  const awayP = awayPStats.status === "fulfilled" ? awayPStats.value : null;
  const wx    = weather.status === "fulfilled" ? weather.value : null;

  const prompt = `You are an elite MLB betting analyst with deep knowledge of statcast metrics, pitcher-batter matchups, and betting market inefficiencies.

Analyze this game and return a JSON edge report. Be direct and confident in your assessment.

GAME DATA:
Home: ${game.teams.home.team.name}
Away: ${game.teams.away.team.name}
Home Pitcher: ${game.teams.home.probablePitcher?.fullName ?? "TBD"} — ERA: ${homeP?.era ?? "N/A"}, WHIP: ${homeP?.whip ?? "N/A"}, K/9: ${homeP?.strikeoutsPer9Inn ?? "N/A"}, HR/9: ${homeP?.homeRunsPer9 ?? "N/A"}
Away Pitcher: ${game.teams.away.probablePitcher?.fullName ?? "TBD"} — ERA: ${awayP?.era ?? "N/A"}, WHIP: ${awayP?.whip ?? "N/A"}, K/9: ${awayP?.strikeoutsPer9Inn ?? "N/A"}, HR/9: ${awayP?.homeRunsPer9 ?? "N/A"}
Venue: ${game.venue.name}
Weather: ${wx ? `${wx.tempF}°F, wind ${wx.windMph}mph ${wx.windDirection}, ${wx.conditions}` : "N/A"}

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

  return generateJSON<EdgeScoreResult>(prompt);
}

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

function EdgeCard({ game, score }: { game: Game; score: EdgeScoreResult }) {
  const away = game.teams.away;
  const home = game.teams.home;
  const edgeColor = score.edgeScore >= 75 ? "#50C882" : score.edgeScore >= 60 ? "#FF7828" : "#818cf8";

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={teamLogoUrl(away.team.id)} alt="" width={32} height={32} className="w-8 h-8 object-contain" />
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

      <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${score.edgeScore}%`, backgroundColor: edgeColor }}
        />
      </div>

      <p className="text-xs text-white/50 leading-relaxed italic">&ldquo;{score.insight}&rdquo;</p>

      {score.keyEdges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {score.keyEdges.slice(0, 3).map((k) => (
            <span key={k} className="text-[10px] text-white/40 border border-white/[0.06] bg-white/[0.03] rounded-full px-2.5 py-0.5">{k}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-white/25 pt-1 border-t border-white/[0.04]">
        <span>
          {Math.round(score.winProbability.home * 100)}% home · {Math.round(score.winProbability.away * 100)}% away
        </span>
        <span className={score.overUnderLean === "OVER" ? "text-[#50C882]" : score.overUnderLean === "UNDER" ? "text-red-400" : "text-white/25"}>
          {score.overUnderLean} · {score.totalRunEstimate} est. runs
        </span>
      </div>

      {score.recommendedBets.length > 0 && (
        <div className="rounded-xl bg-[#FF7828]/[0.08] border border-[#FF7828]/15 px-3 py-2">
          <p className="text-[9px] text-[#FF7828]/60 font-bold uppercase tracking-widest mb-1">Recommended</p>
          <p className="text-xs text-[#FF7828] font-bold">{score.recommendedBets[0]}</p>
        </div>
      )}
    </div>
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
  if (!games.length) return null;

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
    (g) => g.teams.away.probablePitcher && g.teams.home.probablePitcher
  );

  if (!withPitchers.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Zap size={44} className="text-white/10 mb-4" strokeWidth={1.2} />
        <p className="text-white/35">Edge data requires confirmed pitchers</p>
      </div>
    );
  }

  // Fetch Gemini edge scores for all games concurrently (cap at 6 to stay in rate limits)
  const capped = withPitchers.slice(0, 6);
  const scoreResults = await Promise.allSettled(capped.map(fetchEdgeScore));

  const scored: Array<{ game: Game; score: EdgeScoreResult }> = [];
  for (let i = 0; i < capped.length; i++) {
    const r = scoreResults[i];
    if (r.status === "fulfilled") {
      scored.push({ game: capped[i], score: r.value });
    } else {
      // Fallback deterministic score so the card still renders
      scored.push({
        game: capped[i],
        score: {
          edgeScore:        Math.max(45, Math.min(90, 55 + ((capped[i].gamePk * 7) % 40))),
          grade:            "B",
          confidence:       "MEDIUM",
          recommendedBets:  [],
          winProbability:   { home: 0.5, away: 0.5 },
          keyEdges:         [],
          insight:          "Gemini analysis unavailable — check GEMINI_API_KEY.",
          overUnderLean:    "PUSH",
          totalRunEstimate: 8,
        },
      });
    }
  }

  const sorted = [...scored].sort((a, b) => b.score.edgeScore - a.score.edgeScore);

  const picksInput = sorted.map(({ game, score }) => ({
    away:      game.teams.away.team.name,
    home:      game.teams.home.team.name,
    edgeScore: score.edgeScore,
    grade:     score.grade,
    keyEdges:  score.keyEdges,
  }));

  return (
    <>
      <Suspense fallback={null}>
        <StrongPicksBanner games={picksInput} />
      </Suspense>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map(({ game, score }) => (
          <EdgeCard key={game.gamePk} game={game} score={score} />
        ))}
      </div>
    </>
  );
}

export default function AnalysisPage() {
  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <div className="mb-8">
        <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-1">Today&apos;s Edge</p>
        <h1 className="text-3xl font-black text-white mb-1">Edge Report</h1>
        <p className="text-sm text-white/35">AI-ranked value bets across today&apos;s full slate</p>
      </div>

      <PaywallGate
        feature="Edge Report"
        benefits={[
          "Value bets ranked by Gemini AI edge score",
          "Pitcher vs lineup matchup grades",
          "Weather & ballpark factor analysis",
          "Today's strong picks (LOCK / STRONG / LEAN)",
        ]}
      >
        <Suspense fallback={
          <div className="flex items-center gap-3 py-16 text-white/30">
            <RefreshCw size={18} className="animate-spin" strokeWidth={1.5} />
            <span className="text-sm">Analyzing edges with Gemini AI…</span>
          </div>
        }>
          <EdgeContent />
        </Suspense>
      </PaywallGate>
    </div>
  );
}
