import { NextResponse } from "next/server";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { INITIAL_BRACKET, WC_GROUPS, WC_TEAMS } from "@/lib/worldcup/data";
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

// ── R32 hydration from REAL ESPN knockout fixtures ─────────────────────────────
//
// R32_MAPPING above is an invented "1A vs 2B, 1C vs 2D, ..." formula — it is NOT
// FIFA's actual official bracket draw (which doesn't follow a uniform pattern),
// so once real knockout matches are reported it produces nonsense pairings
// (e.g. two host nations drawn directly against each other). Once the knockout
// stage has actually started, prefer ESPN's real fixtures over the formula.
//
// ESPN's scoreboard has no per-event "round" field, so R32 vs R16 must be
// inferred: walking all cross-group fixtures in chronological order, a match is
// R32 iff neither team has appeared in an earlier knockout fixture (each of the
// 32 teams plays exactly one R32 match before any R16 rematch).

const ESPN_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

interface RealFixture {
  date: string;
  venue: string;
  city: string;
  homeId: string;
  awayId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "scheduled" | "live" | "completed";
  winner: "top" | "bottom" | null;
}

function fixtureStatus(name: string, state?: string): "scheduled" | "live" | "completed" {
  if (name === "STATUS_FINAL" || name === "STATUS_FULL_TIME" || name === "STATUS_FINAL_PEN" || state === "post") return "completed";
  if (name === "STATUS_SCHEDULED" || state === "pre") return "scheduled";
  return "live";
}

async function fetchRealKnockoutFixtures(groups: WCGroup[]): Promise<RealFixture[]> {
  const teamGroup = new Map<string, string>();
  for (const g of groups) for (const t of g.teams) teamGroup.set(t.teamId, g.id);

  const opts: RequestInit = { next: { revalidate: 1800 }, headers: { "User-Agent": "mlbedgepro/1.0" } };
  const dates: string[] = [];
  const now = new Date();
  for (let i = -8; i <= 12; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() + i);
    dates.push(d.toISOString().slice(0, 10).replace(/-/g, ""));
  }

  const results = await Promise.allSettled(
    dates.map((d) => fetch(`${ESPN_SCOREBOARD}?dates=${d}&limit=30`, opts).then((r) => r.ok ? r.json() : null))
  );

  const fixtures: RealFixture[] = [];
  const seenEventIds = new Set<string>();

  for (const result of results) {
    if (result.status !== "fulfilled" || !result.value?.events) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const event of result.value.events as any[]) {
      if (event.id && seenEventIds.has(event.id)) continue;
      if (event.id) seenEventIds.add(event.id);

      const comp = event.competitions?.[0];
      if (!comp) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const teams: any[] = comp.competitors ?? [];
      const home = teams.find((t) => t.homeAway === "home");
      const away = teams.find((t) => t.homeAway === "away");
      if (!home || !away) continue;

      const homeId = abbToId(home.team.abbreviation);
      const awayId = abbToId(away.team.abbreviation);
      if (!WC_TEAMS[homeId] || !WC_TEAMS[awayId]) continue;

      // Knockout matches are cross-group; group-stage matches (same group) are
      // already covered by the groups endpoint.
      const hg = teamGroup.get(homeId), ag = teamGroup.get(awayId);
      if (hg && ag && hg === ag) continue;

      const statusName  = comp.status?.type?.name ?? "";
      const statusState = comp.status?.type?.state as string | undefined;
      const status       = fixtureStatus(statusName, statusState);
      const homeScore    = home.score != null ? parseInt(home.score, 10) : null;
      const awayScore    = away.score != null ? parseInt(away.score, 10) : null;
      const venue         = comp.venue ?? {};

      fixtures.push({
        date: event.date ?? "",
        venue: venue.fullName ?? "",
        city: venue.address?.city ?? "",
        homeId, awayId, homeScore, awayScore, status,
        winner: status === "completed" ? (home.winner ? "top" : away.winner ? "bottom" : null) : null,
      });
    }
  }

  fixtures.sort((a, b) => a.date.localeCompare(b.date));
  return fixtures;
}

/** Of all cross-group knockout fixtures, keep only each team's first (R32) appearance. */
function filterToR32(fixtures: RealFixture[]): RealFixture[] {
  const seenTeams = new Set<string>();
  const r32: RealFixture[] = [];
  for (const fx of fixtures) {
    if (seenTeams.has(fx.homeId) || seenTeams.has(fx.awayId)) continue;
    seenTeams.add(fx.homeId);
    seenTeams.add(fx.awayId);
    r32.push(fx);
  }
  return r32;
}

function hydrateR32FromRealFixtures(base: BracketState, allFixtures: RealFixture[]): BracketState | null {
  const r32Fixtures = filterToR32(allFixtures);
  if (r32Fixtures.length < 4) return null; // not enough real data to trust yet

  const updated = { ...base, matches: { ...base.matches } };
  const r32Ids = base.rounds.r32;

  for (let i = 0; i < r32Ids.length && i < r32Fixtures.length; i++) {
    const slot = r32Ids[i];
    const fx = r32Fixtures[i];
    const dt = new Date(fx.date);
    updated.matches[slot] = {
      ...updated.matches[slot],
      topTeamId: fx.homeId,
      bottomTeamId: fx.awayId,
      topScore: fx.homeScore,
      bottomScore: fx.awayScore,
      status: fx.status,
      winner: fx.winner,
      date: dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      time: dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }),
      venue: fx.venue || updated.matches[slot].venue,
      city: fx.city || updated.matches[slot].city,
    };
  }

  // Propagate determined R32 winners into their R16 slot
  for (const slot of r32Ids) {
    const m = updated.matches[slot];
    if (!m.winner || !m.nextMatchId) continue;
    const winnerId = m.winner === "top" ? m.topTeamId : m.bottomTeamId;
    const next = updated.matches[m.nextMatchId];
    if (!next) continue;
    updated.matches[m.nextMatchId] = {
      ...next,
      ...(m.nextSlot === "top" ? { topTeamId: winnerId } : { bottomTeamId: winnerId }),
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
    // Start with the computed pairing formula from live group standings —
    // this is the only option before the knockout draw is known.
    const liveGroups = await fetchLiveGroupStandings();
    let bracket = hydrateR32FromGroups(INITIAL_BRACKET, liveGroups);
    let knockoutLive = false;

    // Once real knockout fixtures exist, they override the formula entirely —
    // the formula is a guess, ESPN's actual fixtures are ground truth.
    try {
      const realFixtures = await fetchRealKnockoutFixtures(liveGroups);
      const realBracket = hydrateR32FromRealFixtures(bracket, realFixtures);
      if (realBracket) {
        bracket = realBracket;
        knockoutLive = true;
      }
    } catch {
      // keep formula-based hydration
    }

    // If API_FOOTBALL_KEY is set, also hydrate completed knockout matches
    if (process.env.API_FOOTBALL_KEY) {
      try {
        const fixtures = await fetchWCFixtures();
        bracket = hydrateBracketFromFixtures(bracket, fixtures);
      } catch {
        // keep prior hydration
      }
    }

    return NextResponse.json(
      { ...bracket, lastUpdated: new Date().toISOString(), knockoutLive },
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
