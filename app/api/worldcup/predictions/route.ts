import { NextRequest, NextResponse } from "next/server";
import { WC_GROUPS, WC_TEAMS, eloWinProb } from "@/lib/worldcup/data";
import type { WCGroup, GSMatch } from "@/lib/worldcup/types";

export interface MatchPrediction {
  home: string;
  away: string;
  predictedHome: number;
  predictedAway: number;
  confidence: number;
}

export interface GroupPrediction {
  groupId: string;
  winner: string;
  runnerUp: string;
  thirdPlace: string;
  matches: MatchPrediction[];
}

function predictScore(homeId: string, awayId: string): MatchPrediction {
  const home = WC_TEAMS[homeId];
  const away = WC_TEAMS[awayId];
  if (!home || !away) {
    return { home: homeId, away: awayId, predictedHome: 1, predictedAway: 1, confidence: 50 };
  }

  const homeProb = eloWinProb(home.strength, away.strength);
  // Home advantage: slight boost
  const adjHomeProb = Math.min(0.92, homeProb + 0.04);

  const baseGoals = 1.5;
  const eloDiff = home.strength - away.strength;
  const strengthFactor = eloDiff / 400;

  const predictedHome = Math.max(0, Math.round((baseGoals + strengthFactor * 0.8) * 10) / 10);
  const predictedAway = Math.max(0, Math.round((baseGoals - strengthFactor * 0.6) * 10) / 10);

  const roundedHome = Math.round(predictedHome);
  const roundedAway = Math.round(predictedAway);

  const confidence = Math.round(
    (adjHomeProb > 0.5 ? adjHomeProb : (1 - adjHomeProb)) * 100
  );

  return {
    home: homeId,
    away: awayId,
    predictedHome: roundedHome,
    predictedAway: roundedAway,
    confidence,
  };
}

function simulateGroup(group: WCGroup): GroupPrediction {
  // Points simulation for unplayed matches
  const pts: Record<string, number> = {};
  const gd: Record<string, number> = {};

  for (const t of group.teams) {
    pts[t.teamId] = t.pts;
    gd[t.teamId] = t.gf - t.ga;
  }

  const matchPredictions: MatchPrediction[] = [];

  for (const m of group.matches) {
    if (m.status === "completed") continue;

    const pred = predictScore(m.home, m.away);
    matchPredictions.push(pred);

    const h = pred.predictedHome;
    const a = pred.predictedAway;

    if (h > a) {
      pts[m.home] = (pts[m.home] ?? 0) + 3;
    } else if (h < a) {
      pts[m.away] = (pts[m.away] ?? 0) + 3;
    } else {
      pts[m.home] = (pts[m.home] ?? 0) + 1;
      pts[m.away] = (pts[m.away] ?? 0) + 1;
    }
    gd[m.home] = (gd[m.home] ?? 0) + (h - a);
    gd[m.away] = (gd[m.away] ?? 0) + (a - h);
  }

  const sorted = group.teams
    .map((t) => t.teamId)
    .sort((a, b) => {
      const pDiff = (pts[b] ?? 0) - (pts[a] ?? 0);
      if (pDiff !== 0) return pDiff;
      return (gd[b] ?? 0) - (gd[a] ?? 0);
    });

  return {
    groupId: group.id,
    winner: sorted[0] ?? "",
    runnerUp: sorted[1] ?? "",
    thirdPlace: sorted[2] ?? "",
    matches: matchPredictions,
  };
}

async function aiPredictions(groups: WCGroup[]): Promise<GroupPrediction[]> {
  const { generateJSON } = await import("@/lib/anthropic");

  const teamSummary = groups.flatMap((g) =>
    g.teams.map((t) => {
      const info = WC_TEAMS[t.teamId];
      return `${t.teamId}(strength:${info?.strength ?? 1600},pts:${t.pts})`;
    })
  ).join(", ");

  const prompt = `World Cup 2026 group stage predictions. Teams with ELO strengths and current points:
${teamSummary}

Groups: ${groups.map((g) => `${g.id}: ${g.teams.map((t) => t.teamId).join(",")}`).join(" | ")}

For each group predict: winner, runnerUp, thirdPlace (team IDs). Return JSON array:
[{"groupId":"A","winner":"mex","runnerUp":"kor","thirdPlace":"cze","matches":[]}]
Only predict unplayed matches if needed. Keep matches array empty.`;

  return generateJSON<GroupPrediction[]>(prompt);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const groupFilter = searchParams.get("group");

  const groups = groupFilter
    ? WC_GROUPS.filter((g) => g.id === groupFilter.toUpperCase())
    : WC_GROUPS;

  const hasAnthropicKey = !!(
    process.env.ANTHROPIC_API_KEY ??
    process.env.CLAUDE_API_KEY ??
    process.env.GROQ_API_KEY
  );

  let predictions: GroupPrediction[];

  if (hasAnthropicKey) {
    try {
      predictions = await aiPredictions(groups);
      // Merge in match-level predictions from rule-based (AI only returns standings)
      predictions = predictions.map((p) => {
        const group = groups.find((g) => g.id === p.groupId);
        if (!group) return p;
        const matchPreds = group.matches
          .filter((m: GSMatch) => m.status !== "completed")
          .map((m: GSMatch) => predictScore(m.home, m.away));
        return { ...p, matches: matchPreds };
      });
    } catch {
      predictions = groups.map(simulateGroup);
    }
  } else {
    predictions = groups.map(simulateGroup);
  }

  return NextResponse.json(
    { predictions },
    { headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=60" } }
  );
}
