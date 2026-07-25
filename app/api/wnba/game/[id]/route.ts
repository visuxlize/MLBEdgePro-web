import { NextResponse } from "next/server";
import { getGameSummary } from "@/lib/wnba/espn";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const summary = await getGameSummary(id);
  if (!summary) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  return NextResponse.json(summary);
}
