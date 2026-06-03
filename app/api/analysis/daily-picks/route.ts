import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateJSON } from "@/lib/gemini";

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

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { games }: { games: GameSummary[] } = await req.json();

  if (!games?.length) {
    return NextResponse.json({ error: "No games provided" }, { status: 400 });
  }

  const gameLines = games
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
    console.error("Gemini daily-picks error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
