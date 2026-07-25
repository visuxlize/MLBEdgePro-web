import { NextResponse } from "next/server";
import { getSchedule } from "@/lib/wnba/espn";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? undefined;

  const games = await getSchedule(date);
  return NextResponse.json(games);
}
