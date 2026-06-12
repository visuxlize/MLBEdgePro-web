import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { requirePlan, isNextResponse } from "@/lib/require-plan";
import { rateLimit, getIp } from "@/lib/rate-limit";

interface GameSummary {
  away: string;
  home: string;
  edgeScore: number;
  grade: string;
  keyEdges: string[];
}

interface StrongPick {
  game: string;
  pick: string;
  reasoning: string;
  confidenceLevel: "LOCK" | "STRONG" | "LEAN";
  edgeScore: number;
}

interface DailyPicksOutput {
  strongPicks: StrongPick[];
  dayRating: "JUICY" | "GOOD" | "AVERAGE" | "THIN";
  dayNote: string;
}

function sanitizeGame(g: GameSummary): GameSummary {
  const s = (v: unknown, n = 80) => String(v ?? "").slice(0, n).replace(/[`<>]/g, "");
  return {
    away:      s(g.away),
    home:      s(g.home),
    edgeScore: Number(g.edgeScore) || 0,
    grade:     s(g.grade, 4),
    keyEdges:  Array.isArray(g.keyEdges)
      ? g.keyEdges.slice(0, 5).map((e) => s(e, 120))
      : [],
  };
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const rl = rateLimit(`daily-picks:${ip}`, 15, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const planResult = await requirePlan("fan");
  if (isNextResponse(planResult)) return planResult;

  const { games }: { games: GameSummary[] } = await req.json();

  if (!Array.isArray(games) || !games.length) {
    return NextResponse.json({ error: "No games provided" }, { status: 400 });
  }

  const safeGames = games.slice(0, 20).map(sanitizeGame);

  const gameLines = safeGames
    .map((g) => `${g.away} @ ${g.home}: Edge Score ${g.edgeScore}, Grade ${g.grade}, Keys: ${g.keyEdges.join(", ")}`)
    .join("\n");

  const prompt = `You are an MLB sharp bettor. Given today's edge report scores across all games, identify the 3 strongest plays of the day.

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
}`;

  try {
    const result = await generateJSON<DailyPicksOutput>(prompt);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Claude daily-picks error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
