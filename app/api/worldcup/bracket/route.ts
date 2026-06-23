import { NextResponse } from "next/server";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { INITIAL_BRACKET, WC_GROUPS } from "@/lib/worldcup/data";
import { fetchWCFixtures } from "@/lib/worldcup/api-football";
import { isNextResponse, requirePlan } from "@/lib/require-plan";
import type { BracketState, GSTeam, WCGroup } from "@/lib/worldcup/types";

export const dynamic = "force-dynamic";

// ── ESPN group standings fetch ────────────────────────────────────────────────

const ESPN_STANDINGS = "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings";

// ESPN uses different abbreviations than our internal team IDs for a handful of teams
const ESPN_TO_ID: Record<string, string> = {
  MAR: "mor",
  CUW: "cur",
};

function abbToId(abbr: string): string {
  return ESPN_TO_ID[abbr.toUpperCase()] ?? abbr.toLowerCase();
}

function sortStandings(teams: GSTeam[]): GSTeam[] {
  return [...teams].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdA = a.gf - a.ga, gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    return b.gf - a.gf;
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ESPNEntry = { team: { abbreviation: string }; stats: { name: string; value: number }[] };

async function fetchLiveGroupStandings(): Promise<WCGroup[]> {
  const opts: RequestInit = { next: { revalidate: 1800 }, headers: { "User-Agent": "mlbedgepro/1.0" } };

  const [standingsRes] = await Promise.allSettled([
    fetch(ESPN_STANDINGS, opts),
  ]);

  if (standingsRes.status !== "fulfilled" || !standingsRes.value.ok) return WC_GROUPS;

  const standingsJson = await standingsRes.value.json();
  const standingsMap = new Map<string, GSTeam[]>();

  for (const child of standingsJson.children ?? []) {
    const letter = (child.name ?? "").replace("Group ", "").trim();
    if (!letter) continue;
    const entries: ESPNEntry[] = child.standings?.entries ?? [];
    const teams: GSTeam[] = entries.map((e) => {
      const s = Object.fromEntries(e.stats.map((st) => [st.name, st.value ?? 0]));
      return {
        teamId: abbToId(e.team.abbreviation),
        p:   Math.round(s.gamesPlayed   ?? 0),
        w:   Math.round(s.wins          ?? 0),
        d:   Math.round(s.ties          ?? 0),
        l:   Math.round(s.losses        ?? 0),
        gf:  Math.round(s.pointsFor     ?? 0),
        ga:  Math.round(s.pointsAgainst ?? 0),
        pts: Math.round(s.points        ?? 0),
      };
    });
    standingsMap.set(letter, teams);
  }

  return WC_GROUPS.map((g) => ({
    id: g.id,
    teams: standingsMap.get(g.id) ?? g.teams,
    matches: g.matches,
  }));
}

// ── Bracket hydration from group standings ────────────────────────────────────
//
// WC 2026 R32 bracket assignment (FIFA-defined):
//  r32_0:  1A vs 2B      r32_1:  1C vs 2D
//  r32_2:  1E vs 2F      r32_3:  1G vs 2H
//  r32_4:  1I vs 2J      r32_5:  1K vs 2L
//  r32_6:  2A vs 1B      r32_7:  2C vs 1D
//  r32_8:  2E vs 1F      r32_9:  2G vs 1H
//  r32_10: 2I vs 1J      r32_11: 2K vs 1L
//  r32_12–r32_15: Best 8 third-place teams (seeded after group stage ends)

const R32_MAPPING: Array<{ matchId: string; top: [string, 0 | 1 | 2]; bottom: [string, 0 | 1 | 2] }> = [
  { matchId: "r32_0",  top: ["A", 0], bottom: ["B", 1] },
  { matchId: "r32_1",  top: ["C", 0], bottom: ["D", 1] },
  { matchId: "r32_2",  top: ["E", 0], bottom: ["F", 1] },
  { matchId: "r32_3",  top: ["G", 0], bottom: ["H", 1] },
  { matchId: "r32_4",  top: ["I", 0], bottom: ["J", 1] },
  { matchId: "r32_5",  top: ["K", 0], bottom: ["L", 1] },
  { matchId: "r32_6",  top: ["A", 1], bottom: ["B", 0] },
  { matchId: "r32_7",  top: ["C", 1], bottom: ["D", 0] },
  { matchId: "r32_8",  top: ["E", 1], bottom: ["F", 0] },
  { matchId: "r32_9",  top: ["G", 1], bottom: ["H", 0] },
  { matchId: "r32_10", top: ["I", 1], bottom: ["J", 0] },
  { matchId: "r32_11", top: ["K", 1], bottom: ["L", 0] },
];

function groupHasStarted(group: WCGroup): boolean {
  return group.matches.some((m) => m.status !== "scheduled");
}

function hydrateR32FromGroups(base: BracketState, groups: WCGroup[]): BracketState {
  const groupMap = new Map<string, WCGroup>(groups.map((g) => [g.id, g]));
  const updated  = { ...base, matches: { ...base.matches } };

  // Fill winner/runner-up slots (r32_0 – r32_11) from group standings
  for (const slot of R32_MAPPING) {
    const topGroup    = groupMap.get(slot.top[0]);
    const bottomGroup = groupMap.get(slot.bottom[0]);
    if (!topGroup || !bottomGroup) continue;

    // Don't show a team in the bracket until their group has at least one result
    const topId    = groupHasStarted(topGroup)    ? sortStandings(topGroup.teams)[slot.top[1]]?.teamId    ?? null : null;
    const bottomId = groupHasStarted(bottomGroup) ? sortStandings(bottomGroup.teams)[slot.bottom[1]]?.teamId ?? null : null;

    if (!topId && !bottomId) continue;

    updated.matches[slot.matchId] = {
      ...updated.matches[slot.matchId],
      topTeamId:    topId,
      bottomTeamId: bottomId,
    };
  }

  // Fill best-third-place slots (r32_12 – r32_15) once enough groups have results
  const thirdPlaceTeams: GSTeam[] = groups
    .filter(groupHasStarted)
    .map((g) => sortStandings(g.teams)[2])
    .filter((t): t is GSTeam => !!t && t.p > 0);

  const best8 = [...thirdPlaceTeams]
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if ((b.gf - b.ga) !== (a.gf - a.ga)) return (b.gf - b.ga) - (a.gf - a.ga);
      return b.gf - a.gf;
    })
    .slice(0, 8);

  const thirdSlots = ["r32_12", "r32_13", "r32_14", "r32_15"];
  for (let i = 0; i < thirdSlots.length; i++) {
    const t1 = best8[i * 2];
    const t2 = best8[i * 2 + 1];
    if (!t1 && !t2) continue;

    updated.matches[thirdSlots[i]] = {
      ...updated.matches[thirdSlots[i]],
      topTeamId:    t1?.teamId ?? null,
      bottomTeamId: t2?.teamId ?? null,
    };
  }

  return updated;
}

export async function GET(req: Request) {
  const planResult = await requirePlan("pro");
  if (isNextResponse(planResult)) return planResult;

  const ip = getIp(req);
  const rl = rateLimit(`wc-bracket:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    // Always try to populate R32 from live group standings first
    const liveGroups = await fetchLiveGroupStandings();
    let bracket = hydrateR32FromGroups(INITIAL_BRACKET, liveGroups);

    // If API_FOOTBALL_KEY is set, also hydrate completed knockout matches
    if (process.env.API_FOOTBALL_KEY) {
      try {
        const fixtures = await fetchWCFixtures();
        bracket = hydrateBracketFromFixtures(bracket, fixtures);
      } catch {
        // keep group-stage hydration
      }
    }

    return NextResponse.json(
      { ...bracket, lastUpdated: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(INITIAL_BRACKET);
  }
}

// ── Hydrate completed bracket matches from API-Football ───────────────────────

import type { ApiFootballFixture } from "@/lib/worldcup/types";

function hydrateBracketFromFixtures(
  base: BracketState,
  fixtures: ApiFootballFixture[]
): BracketState {
  const updated = { ...base, matches: { ...base.matches } };

  for (const fix of fixtures) {
    const home = fix.teams.home;
    const away = fix.teams.away;
    const status = fix.fixture.status.short;
    const goals  = fix.goals;

    const matchId = Object.keys(updated.matches).find((id) => {
      const m = updated.matches[id];
      if (!m.topTeamId || !m.bottomTeamId) return false;
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
