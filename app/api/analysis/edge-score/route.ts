import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateJSON } from "@/lib/gemini";

interface EdgeScoreInput {
  homeTeam: string;
  awayTeam: string;
  homeRecord?: string;
  awayRecord?: string;
  homePitcher: string;
  awayPitcher: string;
  homePitcherERA?: number;
  homePitcherWHIP?: number;
  homePitcherK9?: number;
  homePitcherBB9?: number;
  awayPitcherERA?: number;
  awayPitcherWHIP?: number;
  awayPitcherK9?: number;
  awayPitcherBB9?: number;
  venueName?: string;
  tempF?: number;
  windMph?: number;
  windDirection?: string;
  conditions?: string;
  homeL10Record?: string;
  awayL10Record?: string;
  homeRunsLast10?: number;
  awayRunsLast10?: number;
  homeBullpenERA?: number;
  awayBullpenERA?: number;
}

interface EdgeScoreOutput {
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

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data: EdgeScoreInput = await req.json();

  const prompt = `You are an elite MLB betting analyst with deep knowledge of statcast metrics, pitcher-batter matchups, and betting market inefficiencies.

Analyze this game and return a JSON edge report. Be direct and confident in your assessment.

GAME DATA:
Home: ${data.homeTeam} (${data.homeRecord ?? "N/A"})
Away: ${data.awayTeam} (${data.awayRecord ?? "N/A"})
Home Pitcher: ${data.homePitcher} — ERA: ${data.homePitcherERA ?? "N/A"}, WHIP: ${data.homePitcherWHIP ?? "N/A"}, K/9: ${data.homePitcherK9 ?? "N/A"}, BB/9: ${data.homePitcherBB9 ?? "N/A"}
Away Pitcher: ${data.awayPitcher} — ERA: ${data.awayPitcherERA ?? "N/A"}, WHIP: ${data.awayPitcherWHIP ?? "N/A"}, K/9: ${data.awayPitcherK9 ?? "N/A"}, BB/9: ${data.awayPitcherBB9 ?? "N/A"}
Venue: ${data.venueName ?? "Unknown"}
Weather: ${data.tempF ?? "N/A"}°F, wind ${data.windMph ?? "N/A"}mph ${data.windDirection ?? ""}, ${data.conditions ?? "clear"}
Home last 10: ${data.homeL10Record ?? "N/A"}, ${data.homeRunsLast10 ?? "N/A"} runs scored
Away last 10: ${data.awayL10Record ?? "N/A"}, ${data.awayRunsLast10 ?? "N/A"} runs scored
Home bullpen ERA (last 7 days): ${data.homeBullpenERA ?? "N/A"}
Away bullpen ERA (last 7 days): ${data.awayBullpenERA ?? "N/A"}

Respond ONLY with this JSON (no markdown, no code fences):
{
  "edgeScore": <integer 0-100>,
  "grade": "<A+|A|B+|B|C+|C|D>",
  "confidence": "<HIGH|MEDIUM|LOW>",
  "recommendedBets": ["<specific bet like 'Home ML -130'>"],
  "winProbability": { "home": <0-1>, "away": <0-1> },
  "keyEdges": ["<factor 1>", "<factor 2>", "<factor 3>"],
  "insight": "<one punchy sentence, max 20 words, no hedging>",
  "overUnderLean": "<OVER|UNDER|PUSH>",
  "totalRunEstimate": <number>
}`;

  try {
    const result = await generateJSON<EdgeScoreOutput>(prompt);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Gemini edge-score error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
