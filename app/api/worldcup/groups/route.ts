import { NextResponse } from "next/server";
import { WC_GROUPS, WC_TEAMS } from "@/lib/worldcup/data";
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

function espnStatusToGS(name: string): GSMatch["status"] {
  if (name === "STATUS_FINAL") return "completed";
  if (name === "STATUS_SCHEDULED") return "scheduled";
  return "live"; // STATUS_IN_PROGRESS, STATUS_FIRST_HALF, etc.
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

async function fetchLiveGroups(): Promise<WCGroup[]> {
  const opts: RequestInit = { next: { revalidate: 3600 }, headers: { "User-Agent": "mlbedgepro/1.0" } };

  // ── 1. Live standings ────────────────────────────────────────────────────────
  const standingsRes = await fetch(ESPN_STANDINGS, opts);
  if (!standingsRes.ok) return WC_GROUPS;
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

  // ── 2. Recent match results (last 7 days to cover full group stage so far) ──
  const dates = recentDates(7);
  const scoreboardResults = await Promise.allSettled(
    dates.map((d) => fetch(`${ESPN_SCOREBOARD}?dates=${d}&limit=20`, opts).then((r) => r.ok ? r.json() : null))
  );

  // Map of "homeId_awayId" → match result
  const matchUpdates = new Map<string, { homeScore: number | null; awayScore: number | null; status: GSMatch["status"] }>();

  for (const result of scoreboardResults) {
    if (result.status !== "fulfilled" || !result.value?.events) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const event of result.value.events as any[]) {
      const comp = event.competitions?.[0];
      if (!comp) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const teams: any[] = comp.competitors ?? [];
      const home = teams.find((t) => t.homeAway === "home");
      const away = teams.find((t) => t.homeAway === "away");
      if (!home || !away) continue;

      const homeId = abbToId(home.team.abbreviation);
      const awayId = abbToId(away.team.abbreviation);
      const statusName  = comp.status?.type?.name ?? "";
      const gsStatus    = espnStatusToGS(statusName);
      const homeScore   = home.score != null ? parseInt(home.score, 10) : null;
      const awayScore   = away.score != null ? parseInt(away.score, 10) : null;

      matchUpdates.set(`${homeId}_${awayId}`, { homeScore, awayScore, status: gsStatus });
    }
  }

  // ── 3. Merge into WCGroup[] ──────────────────────────────────────────────────
  return WC_GROUPS.map((g) => ({
    id:     g.id,
    teams:  standingsMap.get(g.id) ?? g.teams,
    matches: g.matches.map((m) => {
      const upd = matchUpdates.get(`${m.home}_${m.away}`);
      if (!upd) return m;
      return { ...m, homeScore: upd.homeScore, awayScore: upd.awayScore, status: upd.status };
    }),
  }));
}

export async function GET() {
  try {
    const groups = await fetchLiveGroups();
    return NextResponse.json(
      { groups, lastUpdated: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { groups: WC_GROUPS, lastUpdated: new Date().toISOString() },
      { status: 200 }
    );
  }
}
