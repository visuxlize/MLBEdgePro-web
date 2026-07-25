import { NextResponse } from "next/server";
import { getPlayerProps } from "@/lib/nfl/sportsblaze";
import type { NflPropPosition, NflWeekKey } from "@/lib/nfl/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const week = searchParams.get("week") as NflWeekKey | null;
  const pos = searchParams.get("pos") as NflPropPosition | null;

  const props = await getPlayerProps(week ?? undefined, pos ?? undefined);
  return NextResponse.json(props);
}
