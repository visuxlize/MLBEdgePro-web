import { NextResponse } from "next/server";
import { settleLegs, type SettleLegIn } from "@/lib/settle-espn";

export const dynamic = "force-dynamic";

const ID = /^\d{3,12}$/;
const LEAGUE = /^[A-Za-z0-9.]{2,24}$/;
const SPORTS = new Set(["nba", "nfl", "soccer"]);

/** Checks saved legs against final ESPN box scores. Public data only — nothing is stored server-side. */
export async function POST(req: Request) {
  let body: { legs?: SettleLegIn[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }
  const legs = (body.legs ?? []).slice(0, 40).filter((l) =>
    l && typeof l.key === "string" && SPORTS.has(l.sport) && ID.test(String(l.gameId)) && (l.scope === "game" || ID.test(String(l.athleteId))) &&
    typeof l.marketKey === "string" && l.marketKey.length < 40 && (l.sport !== "soccer" || (typeof l.league === "string" && LEAGUE.test(l.league))));
  if (!legs.length) return NextResponse.json({ results: [] });
  return NextResponse.json({ results: await settleLegs(legs) });
}
