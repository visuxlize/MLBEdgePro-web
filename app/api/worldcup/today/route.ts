import { NextResponse } from "next/server";
import { WC_GROUPS, WC_TEAMS } from "@/lib/worldcup/data";
import type { GSMatch } from "@/lib/worldcup/types";

export const dynamic = "force-dynamic";

export interface TodayMatch {
  groupId: string;
  home: string;
  away: string;
  homeId: string;
  awayId: string;
  date: string;
  time: string;
  venue: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "scheduled" | "live" | "completed";
  homeFlagUrl: string;
  awayFlagUrl: string;
}

const ESPN_TO_ID: Record<string, string> = {
  MAR: "mor",
  CUW: "cur",
};
function abbToId(abbr: string): string {
  const up = abbr.toUpperCase();
  return ESPN_TO_ID[up] ?? abbr.toLowerCase();
}

function flagUrl(cc: string) {
  return `https://flagcdn.com/w80/${cc.toLowerCase()}.png`;
}

// Build teamId → groupId mapping from static data
const TEAM_GROUP = new Map<string, string>();
for (const g of WC_GROUPS) {
  for (const t of g.teams) TEAM_GROUP.set(t.teamId, g.id);
}

async function fetchTodayFromESPN(): Promise<TodayMatch[] | null> {
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard",
      { next: { revalidate: 300 }, headers: { "User-Agent": "mlbedgepro/1.0" } }
    );
    if (!res.ok) return null;

    const json  = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events: any[] = json.events ?? [];
    if (!events.length) return null;

    const results: TodayMatch[] = [];
    for (const event of events) {
      const comp  = event.competitions?.[0];
      if (!comp) continue;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const teams: any[] = comp.competitors ?? [];
      const home  = teams.find((t) => t.homeAway === "home");
      const away  = teams.find((t) => t.homeAway === "away");
      if (!home || !away) continue;

      const homeId  = abbToId(home.team.abbreviation);
      const awayId  = abbToId(away.team.abbreviation);
      const homeTeam = WC_TEAMS[homeId];
      const awayTeam = WC_TEAMS[awayId];

      const statusName  = comp.status?.type?.name ?? "";
      const statusState = comp.status?.type?.state as string | undefined;
      const status: TodayMatch["status"] =
        statusName === "STATUS_FINAL" || statusName === "STATUS_FULL_TIME" || statusState === "post" ? "completed"
        : statusName === "STATUS_SCHEDULED" || statusState === "pre" ? "scheduled"
        : "live";

      const dt = new Date(event.date ?? "");
      const venue = comp.venue ?? {};

      results.push({
        groupId:   TEAM_GROUP.get(homeId) ?? TEAM_GROUP.get(awayId) ?? "?",
        home:      homeTeam?.name ?? home.team.displayName ?? "",
        away:      awayTeam?.name ?? away.team.displayName ?? "",
        homeId,
        awayId,
        date:      dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        time:      dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }) + " ET",
        venue:     [venue.fullName, venue.address?.city].filter(Boolean).join(", "),
        homeScore: home.score != null ? parseInt(home.score, 10) : null,
        awayScore: away.score != null ? parseInt(away.score, 10) : null,
        status,
        homeFlagUrl: homeTeam ? flagUrl(homeTeam.countryCode) : "",
        awayFlagUrl: awayTeam ? flagUrl(awayTeam.countryCode) : "",
      });
    }

    return results.length > 0 ? results : null;
  } catch {
    return null;
  }
}

function getTodayFromStatic(): TodayMatch[] {
  const todayStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const results: TodayMatch[] = [];

  for (const group of WC_GROUPS) {
    for (const m of group.matches) {
      if (m.date.trim() !== todayStr) continue;
      const homeTeam = WC_TEAMS[m.home];
      const awayTeam = WC_TEAMS[m.away];
      results.push({
        groupId:    group.id,
        home:       homeTeam?.name ?? m.home,
        away:       awayTeam?.name ?? m.away,
        homeId:     m.home,
        awayId:     m.away,
        date:       m.date,
        time:       m.time,
        venue:      m.venue,
        homeScore:  m.homeScore,
        awayScore:  m.awayScore,
        status:     m.status,
        homeFlagUrl: homeTeam ? flagUrl(homeTeam.countryCode) : "",
        awayFlagUrl: awayTeam ? flagUrl(awayTeam.countryCode) : "",
      });
    }
  }
  return results;
}

export async function GET() {
  try {
    const liveMatches = await fetchTodayFromESPN();
    const matches     = liveMatches ?? getTodayFromStatic();

    return NextResponse.json(
      { matches, date: new Date().toISOString().split("T")[0] },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { matches: getTodayFromStatic(), date: new Date().toISOString().split("T")[0] },
      { status: 200 }
    );
  }
}
