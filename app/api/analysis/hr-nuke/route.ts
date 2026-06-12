import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { requirePlan, isNextResponse } from "@/lib/require-plan";
import { rateLimit, getIp } from "@/lib/rate-limit";

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

function sanitizeStr(s: unknown, maxLen: number): string {
  return String(s ?? "").slice(0, maxLen).replace(/[`<>]/g, "");
}

export async function POST(req: NextRequest) {
  // Rate limit: 20 requests per minute per IP
  const ip = getIp(req);
  const rl = rateLimit(`hr-nuke:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  // Require Pro plan
  const planResult = await requirePlan("pro");
  if (isNextResponse(planResult)) return planResult;

  const d: HRNukeInput = await req.json();

  // Sanitize free-text fields that get interpolated into the AI prompt
  const batterName  = sanitizeStr(d.batterName,  80);
  const pitcherName = sanitizeStr(d.pitcherName, 80);
  const batterHand  = sanitizeStr(d.batterHand,  10);
  const pitcherHand = sanitizeStr(d.pitcherHand, 10);
  const pitchMix    = sanitizeStr(d.pitchMix,    500);
  const pitchSLGMap = sanitizeStr(d.pitchSLGMap, 500);
  const pitchwOBAMap = sanitizeStr(d.pitchwOBAMap, 500);
  const parkName    = sanitizeStr(d.parkName,    100);
  const windDir     = sanitizeStr(d.windDir,     50);

  const prompt = `You are an MLB home run probability model trained on Statcast data. Analyze this batter-pitcher matchup and output an HR probability report as JSON.

BATTER: ${batterName} (${batterHand})
- Barrel%: ${d.barrelPct}%
- Avg Exit Velocity: ${d.avgEV} mph
- Max Exit Velocity: ${d.maxEV} mph
- ISO: ${d.iso}
- SLG: ${d.slg}
- HR this season: ${d.hrCount}
- Pull%: ${d.pullPct}%, Center%: ${d.centerPct}%, Oppo%: ${d.oppoPct}%
- vs ${pitcherHand}HP this season: ISO ${d.vsISO ?? "N/A"} / SLG ${d.vsSLG ?? "N/A"} / ${d.vsHR ?? "N/A"} HR

PITCHER: ${pitcherName} (${pitcherHand})
- Barrel% Allowed: ${d.barrelAllowed}%
- Avg EV Allowed: ${d.evAllowed} mph
- FB Rate: ${d.fbRate}%
- HR/9: ${d.hr9}
- Pitch Mix: ${pitchMix}
- SLG Allowed by pitch: ${pitchSLGMap}
- xwOBA by pitch: ${pitchwOBAMap}

BALLPARK: ${parkName}
- RF wall: ${d.rfDist}ft / ${d.rfHeight}ft
- CF wall: ${d.cfDist}ft / ${d.cfHeight}ft
- LF wall: ${d.lfDist}ft / ${d.lfHeight}ft
- Park factor (HR): ${d.parkFactor}

WEATHER: ${d.tempF}°F · ${d.windMph}mph ${windDir} · Carry effect: RF ${d.rfCarry > 0 ? "+" : ""}${d.rfCarry}ft, CF ${d.cfCarry > 0 ? "+" : ""}${d.cfCarry}ft, LF ${d.lfCarry > 0 ? "+" : ""}${d.lfCarry}ft

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
    console.error("Claude hr-nuke error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
