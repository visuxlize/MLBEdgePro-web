import { NextResponse } from "next/server";
import { getWeekSchedule, getTeamVenueImage } from "@/lib/nfl/espn";
import type { NflWeekKey } from "@/lib/nfl/types";

const VALID_WEEKS: NflWeekKey[] = ["HOF_PRE1", "PRE2", "PRE3", "WK1"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const week = searchParams.get("week") as NflWeekKey | null;

  if (!week || !VALID_WEEKS.includes(week)) {
    return NextResponse.json({ error: "week must be one of HOF_PRE1, PRE2, PRE3, WK1" }, { status: 400 });
  }

  const games = await getWeekSchedule(week);

  // Enrich with venue hero photos — one lookup per distinct home team, long-cached.
  const homeTeams = Array.from(new Set(games.map((g) => g.home)));
  const venueEntries = await Promise.all(homeTeams.map(async (abbr) => [abbr, await getTeamVenueImage(abbr)] as const));
  const venueByTeam = Object.fromEntries(venueEntries);
  const enriched = games.map((g) => ({ ...g, venueImage: venueByTeam[g.home] ?? undefined }));

  return NextResponse.json(enriched);
}
