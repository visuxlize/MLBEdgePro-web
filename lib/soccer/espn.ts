import "server-only";
import type { SoccerMatch, SoccerLeagueKey, SoccerTeamInfo } from "./types";
import { SOCCER_LEAGUES, LEAGUE_MAP, soccerLogoUrl } from "./leagues";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer";

function statusFromState(state: string): SoccerMatch["status"] {
  if (state === "in") return "live";
  if (state === "post") return "final";
  return "pre";
}

function teamFromComp(comp: any): SoccerTeamInfo {
  const t = comp?.team ?? {};
  const rawHex = t.color ?? "7c5cfa";
  const hex = rawHex.startsWith("#") ? rawHex : `#${rawHex}`;
  return {
    id: String(t.id ?? ""),
    name: t.displayName ?? t.location ?? "Unknown",
    shortName: t.shortDisplayName ?? t.abbreviation ?? "UNK",
    abbr: t.abbreviation ?? "UNK",
    logo: t.logo ?? soccerLogoUrl(String(t.id ?? "")),
    hex,
  };
}

async function fetchLeague(key: SoccerLeagueKey): Promise<SoccerMatch[]> {
  const def = LEAGUE_MAP[key];
  if (!def) return [];
  try {
    const res = await fetch(`${BASE}/${def.slug}/scoreboard?limit=20`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const events: any[] = Array.isArray(data.events) ? data.events : [];

    return events.map((ev: any) => {
      const comp = ev.competitions?.[0] ?? {};
      const status = statusFromState(comp.status?.type?.state ?? "pre");
      const minute = comp.status?.displayClock
        ? parseInt(comp.status.displayClock, 10) || undefined
        : undefined;

      const homeComp = (comp.competitors ?? []).find((c: any) => c.homeAway === "home");
      const awayComp = (comp.competitors ?? []).find((c: any) => c.homeAway === "away");

      return {
        id: String(ev.id),
        league: key,
        date: ev.date ?? comp.date ?? "",
        status,
        minute,
        homeTeam: teamFromComp(homeComp),
        awayTeam: teamFromComp(awayComp),
        homeScore: homeComp?.score != null ? parseInt(homeComp.score, 10) : undefined,
        awayScore: awayComp?.score != null ? parseInt(awayComp.score, 10) : undefined,
        venue: comp.venue?.fullName,
      } satisfies SoccerMatch;
    });
  } catch {
    return [];
  }
}

export async function fetchSoccerFixtures(league: SoccerLeagueKey): Promise<SoccerMatch[]> {
  return fetchLeague(league);
}

export async function fetchAllSoccerFixtures(): Promise<SoccerMatch[]> {
  const results = await Promise.allSettled(
    SOCCER_LEAGUES.map((l) => fetchLeague(l.key))
  );
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}
