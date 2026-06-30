import { NextResponse } from "next/server";
import { WC_GROUPS } from "@/lib/worldcup/data";
import type { WCGroup, GSTeam, GSMatch } from "@/lib/worldcup/types";

export const dynamic = "force-dynamic";

const ESPN_STANDINGS  = "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings";
const ESPN_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

// ESPN abbreviation → our internal team ID
const ESPN_TO_ID: Record<string, string> = {
  MAR: "mor",   // Morocco
  CUW: "cur",   // Curaçao
};
function abbToId(abbr: string): string {
  const up = abbr.toUpperCase();
  return ESPN_TO_ID[up] ?? abbr.toLowerCase();
}

function espnStatusToGS(name: string, state?: string): GSMatch["status"] {
  if (name === "STATUS_FINAL" || name === "STATUS_FULL_TIME" || state === "post") return "completed";
  if (name === "STATUS_SCHEDULED" || state === "pre") return "scheduled";
  return "live";
}

// Return YYYYMMDD strings for the last N days (including today)
function recentDates(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(d.toISOString().slice(0, 10).replace(/-/g, ""));
  }
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ESPNEntry = { team: { abbreviation: string }; stats: { name: string; value: number }[] };

// teamId → groupId, built from the static roster. Group COMPOSITION comes from
// the official draw and doesn't change once announced — only standings/results
// are live, so it's safe to use the static roster purely for this lookup.
const TEAM_GROUP = new Map<string, string>();
for (const g of WC_GROUPS) {
  for (const t of g.teams) TEAM_GROUP.set(t.teamId, g.id);
}

interface LiveGroupsResult {
  groups: WCGroup[];
  live: boolean;
}

async function fetchLiveGroups(): Promise<LiveGroupsResult> {
  const opts: RequestInit = { next: { revalidate: 1800 }, headers: { "User-Agent": "mlbedgepro/1.0" } };

  // ── 1. Live standings ────────────────────────────────────────────────────────
  const standingsRes = await fetch(ESPN_STANDINGS, opts);
  if (!standingsRes.ok) return { groups: WC_GROUPS, live: false };
  const standingsJson = await standingsRes.json();

  const standingsMap = new Map<string, GSTeam[]>();
  for (const child of standingsJson.children ?? []) {
    const letter = (child.name ?? "").replace("Group ", "").trim();
    if (!letter) continue;
    const entries: ESPNEntry[] = child.standings?.entries ?? [];
    const teams: GSTeam[] = entries.map((e) => {
      const s = Object.fromEntries(e.stats.map((st) => [st.name, st.value ?? 0]));
      return {
        teamId: abbToId(e.team.abbreviation),
        p:   Math.round(s.gamesPlayed  ?? 0),
        w:   Math.round(s.wins         ?? 0),
        d:   Math.round(s.ties         ?? 0),
        l:   Math.round(s.losses       ?? 0),
        gf:  Math.round(s.pointsFor    ?? 0),
        ga:  Math.round(s.pointsAgainst ?? 0),
        pts: Math.round(s.points       ?? 0),
      };
    });
    standingsMap.set(letter, teams);
  }
  if (standingsMap.size === 0) return { groups: WC_GROUPS, live: false };

  // ── 2. Live group-stage results, built DIRECTLY from ESPN scoreboard events.
  //    (Previously this patched the static fixture list by matching exact
  //    homeId_awayId pairs against our static schedule — but our static
  //    schedule is a placeholder draft, not the official fixture list, so the
  //    pair lookup almost never matched and silently kept stale fake scores.
  //    Building the match objects straight from the live event is robust to
  //    any difference in our placeholder schedule.) ────────────────────────────
  const dates = recentDates(21);
  const scoreboardResults = await Promise.allSettled(
    dates.map((d) => fetch(`${ESPN_SCOREBOARD}?dates=${d}&limit=30`, opts).then((r) => r.ok ? r.json() : null))
  );

  const matchesByGroup = new Map<string, GSMatch[]>();
  const seenEventIds = new Set<string>();

  for (const result of scoreboardResults) {
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

      // Group-stage matches only — both teams must share a group. Cross-group
      // matchups are knockout-round fixtures, handled by the bracket endpoint.
      const homeGroup = TEAM_GROUP.get(homeId);
      const awayGroup = TEAM_GROUP.get(awayId);
      if (!homeGroup || !awayGroup || homeGroup !== awayGroup) continue;

      const statusName  = comp.status?.type?.name ?? "";
      const statusState = comp.status?.type?.state as string | undefined;
      const status       = espnStatusToGS(statusName, statusState);
      const homeScore    = home.score != null ? parseInt(home.score, 10) : null;
      const awayScore    = away.score != null ? parseInt(away.score, 10) : null;
      const dt            = new Date(event.date ?? "");
      const venue          = comp.venue ?? {};

      const match: GSMatch = {
        home: homeId,
        away: awayId,
        date: dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        time: dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }) + " ET",
        venue: [venue.fullName, venue.address?.city].filter(Boolean).join(", "),
        homeScore,
        awayScore,
        goals: [],
        status,
      };

      const list = matchesByGroup.get(homeGroup) ?? [];
      list.push(match);
      matchesByGroup.set(homeGroup, list);
    }
  }

  // ── 3. Merge: a group's live matches (if ESPN returned any) replace its
  //    static placeholder schedule; groups with no live matches found keep
  //    the static schedule as a display fallback. ─────────────────────────────
  const groups: WCGroup[] = WC_GROUPS.map((g) => {
    const live = matchesByGroup.get(g.id);
    return {
      id: g.id,
      teams: standingsMap.get(g.id) ?? g.teams,
      matches: live && live.length > 0 ? live : g.matches,
    };
  });

  return { groups, live: true };
}

export async function GET() {
  try {
    const { groups, live } = await fetchLiveGroups();
    return NextResponse.json(
      { groups, lastUpdated: new Date().toISOString(), live },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { groups: WC_GROUPS, lastUpdated: new Date().toISOString(), live: false },
      { status: 200 }
    );
  }
}
