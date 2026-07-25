import "server-only";
import { wnbaModelEdge } from "./edge";
import type { WnbaGame, WnbaLiveState } from "./types";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/wnba";

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase();
}
function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function statusFromState(state: string | undefined): WnbaGame["status"] {
  if (state === "in") return "live";
  if (state === "post") return "final";
  return "pre";
}
/** "2026-07-21" -> "20260721" for ESPN's `dates` query param. */
function toEspnDate(date: string): string {
  return date.replaceAll("-", "");
}

function mapEvent(ev: any): WnbaGame | null {
  try {
    const comp = ev.competitions?.[0];
    if (!comp) return null;
    const away = comp.competitors?.find((c: any) => c.homeAway === "away");
    const home = comp.competitors?.find((c: any) => c.homeAway === "home");
    if (!away?.team?.abbreviation || !home?.team?.abbreviation) return null;
    const status = statusFromState(comp.status?.type?.state);
    const { edge, grade, homeWinProb } = wnbaModelEdge(ev.id);
    const live: WnbaLiveState | undefined = status === "live" ? {
      period: comp.status?.period ?? 1,
      clock: comp.status?.displayClock ?? "",
      lastPlay: "",
    } : undefined;

    return {
      id: ev.id,
      date: comp.date,
      dateLabel: dateLabel(comp.date),
      timeLabel: timeLabel(comp.date),
      venue: comp.venue?.fullName ?? "",
      away: away.team.abbreviation,
      home: home.team.abbreviation,
      awayScore: status !== "pre" ? Number(away.score) : undefined,
      homeScore: status !== "pre" ? Number(home.score) : undefined,
      status,
      statusDetail:
        status === "live" ? `Q${comp.status?.period ?? 1} ${comp.status?.displayClock ?? ""}`.trim() :
        status === "final" ? "FINAL" : timeLabel(comp.date),
      live,
      edge, grade, homeWinProb,
    };
  } catch {
    return null;
  }
}

/** Today's (or a given date's) WNBA schedule — real ESPN data, no stub needed. */
export async function getSchedule(date?: string): Promise<WnbaGame[]> {
  try {
    const url = date ? `${BASE}/scoreboard?dates=${toEspnDate(date)}` : `${BASE}/scoreboard`;
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const events = Array.isArray(data.events) ? data.events : [];
    return events
      .map(mapEvent)
      .filter((g: WnbaGame | null): g is WnbaGame => g !== null)
      .sort((a: WnbaGame, b: WnbaGame) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

export interface WnbaGameSummary {
  game: WnbaGame;
  winProbSeries: number[];
}

/** Single game detail — venue photo + win-probability series when ESPN has them. */
export async function getGameSummary(eventId: string): Promise<WnbaGameSummary | null> {
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
    const { edge, grade, homeWinProb } = wnbaModelEdge(eventId);

    const venue = data.gameInfo?.venue;
    const live: WnbaLiveState | undefined = status === "live" ? {
      period: comp.status?.period ?? 1,
      clock: comp.status?.displayClock ?? "",
      lastPlay: data.plays?.[0]?.text ?? "",
    } : undefined;

    const game: WnbaGame = {
      id: eventId,
      date: comp.date,
      dateLabel: dateLabel(comp.date),
      timeLabel: timeLabel(comp.date),
      venue: venue?.fullName ?? comp.venue?.fullName ?? "",
      venueImage: venue?.images?.[0]?.href,
      away: away.team.abbreviation,
      home: home.team.abbreviation,
      awayScore: status !== "pre" ? Number(away.score) : undefined,
      homeScore: status !== "pre" ? Number(home.score) : undefined,
      status,
      statusDetail:
        status === "live" ? `Q${comp.status?.period ?? 1} ${comp.status?.displayClock ?? ""}`.trim() :
        status === "final" ? "FINAL" : timeLabel(comp.date),
      live,
      edge, grade, homeWinProb,
    };

    const wp = Array.isArray(data.winprobability) ? data.winprobability : [];
    const winProbSeries = wp.map((w: any) => Math.round((w.homeWinPercentage ?? 0.5) * 100));

    return { game, winProbSeries };
  } catch {
    return null;
  }
}
