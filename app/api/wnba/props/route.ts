import { NextResponse } from "next/server";
import { getPlayerProps } from "@/lib/wnba/sportsblaze";
import type { WnbaPropPosition } from "@/lib/wnba/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pos = searchParams.get("pos") as WnbaPropPosition | null;

  const props = await getPlayerProps(pos ?? undefined);
  return NextResponse.json(props);
}
