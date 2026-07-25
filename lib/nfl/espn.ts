import "server-only";
import { nflModelEdge } from "./edge";
import { getStartingQb } from "./nfl-data";
import type { NflDriveState, NflGame, NflWeekDef, NflWeekKey } from "./types";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";

/**
 * ESPN's preseason calendar for the 2026 season maps cleanly onto the brief's four
 * dashboard week-pills — HOF Weekend and Preseason Week 1 are separate ESPN weeks
 * but shown as one combined pill here, matching the prototype.
 */
export const NFL_WEEKS: NflWeekDef[] = [
  { key: "HOF_PRE1", label: "HOF + PRE 1", dateRange: "AUG 6–15",  fetch: [{ seasonType: 1, week: 1 }, { seasonType: 1, week: 2 }] },
  { key: "PRE2",     label: "PRE 2",        dateRange: "AUG 20–23", fetch: [{ seasonType: 1, week: 3 }] },
  { key: "PRE3",     label: "PRE 3",        dateRange: "AUG 27–29", fetch: [{ seasonType: 1, week: 4 }] },
  { key: "WK1",      label: "WK 1",         dateRange: "SEP 9",     fetch: [{ seasonType: 2, week: 1 }] },
];

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase();
}
function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function statusFromState(state: string | undefined): NflGame["status"] {
  if (state === "in") return "live";
  if (state === "post") return "final";
  return "pre";
}

/** Best-effort live drive/situation parsing — ESPN omits `situation` entirely once a game isn't live. */
function parseDrive(comp: any, homeAbbr: string, lastPlay = ""): NflDriveState | undefined {
  const situation = comp?.situation;
  if (!situation) return undefined;
  const yardLine = typeof situation.yardLine === "number" ? situation.yardLine : 50;
  return {
    possession: situation.possessionText?.split(" ")[0] ?? homeAbbr,
    downDistance: situation.shortDownDistanceText ?? "",
    spot: situation.possessionText ?? "",
    ballPct: Math.max(4, Math.min(96, yardLine)),
    firstDownPct: Math.max(4, Math.min(96, yardLine + (situation.distance ?? 10))),
    driveStats: "",
    lastPlay,
  };
}

async function fetchScoreboardEvents(seasonType: 1 | 2, week: number, revalidate: number): Promise<any[]> {
  try {
    const res = await fetch(`${BASE}/scoreboard?seasontype=${seasonType}&week=${week}&dates=2026`, {
      next: { revalidate },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.events) ? data.events : [];
  } catch {
    return [];
  }
}

function mapEvent(ev: any, weekKey: NflWeekKey, weekLabel: string): NflGame | null {
  try {
    const comp = ev.competitions?.[0];
    if (!comp) return null;
    const away = comp.competitors?.find((c: any) => c.homeAway === "away");
    const home = comp.competitors?.find((c: any) => c.homeAway === "home");
    if (!away?.team?.abbreviation || !home?.team?.abbreviation) return null;
    const status = statusFromState(comp.status?.type?.state);
    const { edge, grade, homeWinProb } = nflModelEdge(ev.id);
    return {
      id: ev.id,
      week: weekKey,
      weekLabel,
      date: comp.date,
      dateLabel: dateLabel(comp.date),
      timeLabel: timeLabel(comp.date),
      venue: comp.venue?.fullName ?? "",
      venueId: comp.venue?.id,
      away: away.team.abbreviation,
      home: home.team.abbreviation,
      awayScore: status !== "pre" ? Number(away.score) : undefined,
      homeScore: status !== "pre" ? Number(home.score) : undefined,
      status,
      statusDetail:
        status === "live" ? (comp.status?.type?.shortDetail ?? "LIVE") :
        status === "final" ? "FINAL" : timeLabel(comp.date),
      drive: status === "live" ? parseDrive(comp, home.team.abbreviation) : undefined,
      edge, grade, homeWinProb,
    };
  } catch {
    return null;
  }
}

/** Games for one of the four dashboard week-pills, enriched with placeholder starting QBs. */
export async function getWeekSchedule(weekKey: NflWeekKey): Promise<NflGame[]> {
  const def = NFL_WEEKS.find((w) => w.key === weekKey);
  if (!def) return [];
  const revalidate = weekKey === "HOF_PRE1" ? 300 : 600; // nearest week refreshes a bit faster
  const batches = await Promise.all(def.fetch.map((f) => fetchScoreboardEvents(f.seasonType, f.week, revalidate)));
  const games = batches
    .flat()
    .map((ev) => mapEvent(ev, weekKey, def.label))
    .filter((g): g is NflGame => g !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  return Promise.all(
    games.map(async (g) => ({
      ...g,
      qbAway: await getStartingQb(g.away),
      qbHome: await getStartingQb(g.home),
    })),
  );
}

export interface NflGameSummary {
  game: NflGame;
  drive?: NflDriveState;
  winProbSeries: number[];
}

/** Single game detail — live drive/situation + win-probability series when ESPN has them. */
export async function getGameSummary(eventId: string): Promise<NflGameSummary | null> {
  try {
    const res = await fetch(`${BASE}/summary?event=${eventId}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    const comp = data.header?.competitions?.[0];
    if (!comp) return null;
    const away = comp.competitors?.find((c: any) => c.homeAway === "away");
    const home = comp.competitors?.find((c: any) => c.homeAway === "home");
    if (!away?.team?.abbreviation || !home?.team?.abbreviation) return null;
    const status = statusFromState(comp.status?.type?.state);
    const { edge, grade, homeWinProb } = nflModelEdge(eventId);

    const game: NflGame = {
      id: eventId,
      // `week`/`weekLabel` aren't meaningful for a single fetched-by-id game (the
      // deep-dive page builds its own tag line from date/time/venue instead).
      week: "HOF_PRE1",
      weekLabel: "",
      date: comp.date,
      dateLabel: dateLabel(comp.date),
      timeLabel: timeLabel(comp.date),
      venue: comp.venue?.fullName ?? "",
      venueId: comp.venue?.id,
      away: away.team.abbreviation,
      home: home.team.abbreviation,
      awayScore: status !== "pre" ? Number(away.score) : undefined,
      homeScore: status !== "pre" ? Number(home.score) : undefined,
      status,
      statusDetail:
        status === "live" ? (comp.status?.type?.shortDetail ?? "LIVE") :
        status === "final" ? "FINAL" : timeLabel(comp.date),
      qbAway: await getStartingQb(away.team.abbreviation),
      qbHome: await getStartingQb(home.team.abbreviation),
      edge, grade, homeWinProb,
    };

    const drive = status === "live" ? parseDrive(comp, game.home, data.plays?.[0]?.text ?? "") : undefined;

    const wp = Array.isArray(data.winprobability) ? data.winprobability : [];
    const winProbSeries = wp.map((w: any) => Math.round((w.homeWinPercentage ?? 0.5) * 100));

    return { game, drive, winProbSeries };
  } catch {
    return null;
  }
}

/** Venue hero photo, sourced live from ESPN's team endpoint (franchise.venue.images[0]). */
export async function getTeamVenueImage(abbr: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/teams/${abbr.toLowerCase()}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    const img = data?.team?.franchise?.venue?.images?.[0]?.href;
    return typeof img === "string" ? img : null;
  } catch {
    return null;
  }
}
