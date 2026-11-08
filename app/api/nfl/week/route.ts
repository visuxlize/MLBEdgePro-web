import { NextResponse } from "next/server";
import { getNflWeek } from "@/lib/nfl/league";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const type = Number(sp.get("type") ?? 2);
  const week = Number(sp.get("week") ?? 1);
  if (![1, 2, 3].includes(type) || !(week >= 1 && week <= 18)) return NextResponse.json({ error: "bad params" }, { status: 400 });
  return NextResponse.json(await getNflWeek(type as 1 | 2 | 3, week));
}
