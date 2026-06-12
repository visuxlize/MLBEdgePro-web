import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { INITIAL_BRACKET } from "@/lib/worldcup/data";
import { fetchWCFixtures } from "@/lib/worldcup/api-football";
import type { BracketState } from "@/lib/worldcup/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getIp(req);
  const rl = rateLimit(`wc-bracket:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  // If API_FOOTBALL_KEY is set, attempt to hydrate from live data
  if (process.env.API_FOOTBALL_KEY) {
    try {
      const fixtures = await fetchWCFixtures();
      const bracket  = hydrateBracket(INITIAL_BRACKET, fixtures);
      return NextResponse.json(bracket);
    } catch {
      // Fall through to static data on API failure
    }
  }

  return NextResponse.json(INITIAL_BRACKET);
}

// ── Hydration ─────────────────────────────────────────────────────────────────

import type { ApiFootballFixture } from "@/lib/worldcup/types";

function hydrateBracket(
  base: BracketState,
  fixtures: ApiFootballFixture[]
): BracketState {
  const updated = { ...base, matches: { ...base.matches } };

  for (const fix of fixtures) {
    const home = fix.teams.home;
    const away = fix.teams.away;
    const status = fix.fixture.status.short;
    const goals  = fix.goals;

    // Match bracket match by home/away team name (approximate)
    const matchId = Object.keys(updated.matches).find((id) => {
      const m = updated.matches[id];
      if (!m.topTeamId || !m.bottomTeamId) return false;
      // Simple string contains check — good enough for demo
      return (
        (home.name.toLowerCase().includes(m.topTeamId.toLowerCase()) ||
         m.topTeamId.toLowerCase().includes(home.name.toLowerCase().slice(0, 3))) &&
        (away.name.toLowerCase().includes(m.bottomTeamId.toLowerCase()) ||
         m.bottomTeamId.toLowerCase().includes(away.name.toLowerCase().slice(0, 3)))
      );
    });

    if (!matchId) continue;

    const m = updated.matches[matchId];
    const isCompleted = status === "FT" || status === "AET" || status === "PEN";
    const isLive      = status === "1H" || status === "HT" || status === "2H" || status === "ET";

    updated.matches[matchId] = {
      ...m,
      topScore:    goals.home,
      bottomScore: goals.away,
      topPens:     fix.score.penalty.home,
      bottomPens:  fix.score.penalty.away,
      status:      isCompleted ? "completed" : isLive ? "live" : "scheduled",
      winner:      isCompleted
        ? (home.winner ? "top" : away.winner ? "bottom" : null)
        : null,
    };
  }

  return updated;
}
