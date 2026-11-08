import { NextResponse } from "next/server";
import { getNbaSchedule } from "@/lib/nba/espn";

export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date") ?? undefined;
  const clean = date && /^\d{8}$/.test(date) ? date : undefined;
  return NextResponse.json(await getNbaSchedule(clean));
}
