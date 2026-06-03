import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateJSON } from "@/lib/gemini";

interface HRNukeInput {
  batterName: string;
  batterHand: string;
  barrelPct: number;
  avgEV: number;
  maxEV: number;
  iso: number;
  slg: number;
  hrCount: number;
  pullPct: number;
  centerPct: number;
  oppoPct: number;
  vsISO?: number;
  vsSLG?: number;
  vsHR?: number;
  pitcherName: string;
  pitcherHand: string;
  barrelAllowed: number;
  evAllowed: number;
  fbRate: number;
  hr9: number;
  pitchMix: string;
  pitchSLGMap: string;
  pitchwOBAMap: string;
  parkName: string;
  rfDist: number;
  rfHeight: number;
  cfDist: number;
  cfHeight: number;
  lfDist: number;
  lfHeight: number;
  parkFactor: number;
  tempF: number;
  windMph: number;
  windDir: string;
  rfCarry: number;
  cfCarry: number;
  lfCarry: number;
}

interface HRNukeOutput {
  hrMatchupGrade: string;
  modelHRProbability: number;
  batterPowerRating: string;
  pitcherVulnerabilityRating: string;
  exploitablePitches: { type: string; usage: number; slgAllowed: number; xwOBA: number }[];
  bestAttackZone: string;
  wallClearance: {
    pull:   { clearanceFt: number; carryFt: number; wallFt: number; favorable: boolean };
    center: { clearanceFt: number; carryFt: number; wallFt: number; favorable: boolean };
    oppo:   { clearanceFt: number; carryFt: number; wallFt: number; favorable: boolean };
  };
  confidenceFactors: string[];
  redFlags: string[];
  narrative: string;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const d: HRNukeInput = await req.json();

  const prompt = `You are an MLB home run probability model trained on Statcast data. Analyze this batter-pitcher matchup and output an HR probability report as JSON.

BATTER: ${d.batterName} (${d.batterHand})
- Barrel%: ${d.barrelPct}%
- Avg Exit Velocity: ${d.avgEV} mph
- Max Exit Velocity: ${d.maxEV} mph
- ISO: ${d.iso}
- SLG: ${d.slg}
- HR this season: ${d.hrCount}
- Pull%: ${d.pullPct}%, Center%: ${d.centerPct}%, Oppo%: ${d.oppoPct}%
- vs ${d.pitcherHand}HP this season: ISO ${d.vsISO ?? "N/A"} / SLG ${d.vsSLG ?? "N/A"} / ${d.vsHR ?? "N/A"} HR

PITCHER: ${d.pitcherName} (${d.pitcherHand})
- Barrel% Allowed: ${d.barrelAllowed}%
- Avg EV Allowed: ${d.evAllowed} mph
- FB Rate: ${d.fbRate}%
- HR/9: ${d.hr9}
- Pitch Mix: ${d.pitchMix}
- SLG Allowed by pitch: ${d.pitchSLGMap}
- xwOBA by pitch: ${d.pitchwOBAMap}

BALLPARK: ${d.parkName}
- RF wall: ${d.rfDist}ft / ${d.rfHeight}ft
- CF wall: ${d.cfDist}ft / ${d.cfHeight}ft
- LF wall: ${d.lfDist}ft / ${d.lfHeight}ft
- Park factor (HR): ${d.parkFactor}

WEATHER: ${d.tempF}°F · ${d.windMph}mph ${d.windDir} · Carry effect: RF ${d.rfCarry > 0 ? "+" : ""}${d.rfCarry}ft, CF ${d.cfCarry > 0 ? "+" : ""}${d.cfCarry}ft, LF ${d.lfCarry > 0 ? "+" : ""}${d.lfCarry}ft

Respond ONLY with this JSON (no markdown, no code fences):
{
  "hrMatchupGrade": "<A+|A|B+|B|C|D|F>",
  "modelHRProbability": <0.00-1.00>,
  "batterPowerRating": "<ELITE|PLUS|ABOVE_AVG|AVG|BELOW>",
  "pitcherVulnerabilityRating": "<HIGH|MED|LOW>",
  "exploitablePitches": [
    { "type": "<pitch name>", "usage": <0-1>, "slgAllowed": <decimal>, "xwOBA": <decimal> }
  ],
  "bestAttackZone": "<PULL|CENTER|OPPO>",
  "wallClearance": {
    "pull":   { "clearanceFt": <int>, "carryFt": <int>, "wallFt": <int>, "favorable": <bool> },
    "center": { "clearanceFt": <int>, "carryFt": <int>, "wallFt": <int>, "favorable": <bool> },
    "oppo":   { "clearanceFt": <int>, "carryFt": <int>, "wallFt": <int>, "favorable": <bool> }
  },
  "confidenceFactors": ["<factor>", "<factor>", "<factor>"],
  "redFlags": ["<flag if any>"],
  "narrative": "<2 sentences, confident tone, specific stats, no hedging>"
}`;

  try {
    const result = await generateJSON<HRNukeOutput>(prompt);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Gemini hr-nuke error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
