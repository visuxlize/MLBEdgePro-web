import { NextResponse } from "next/server";
import { getSoccerMatchCenter } from "@/lib/soccer/match-center";
import { LEAGUE_MAP } from "@/lib/soccer/leagues";
import type { SoccerLeagueKey } from "@/lib/soccer/types";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const league = sp.get("league") as SoccerLeagueKey | null;
  const id = sp.get("id");
  if (!league || !(league in LEAGUE_MAP) || !id || !/^\d+$/.test(id)) return NextResponse.json({ error: "bad params" }, { status: 400 });
  const data = await getSoccerMatchCenter(league, id);
  return data ? NextResponse.json(data) : NextResponse.json({ error: "not found" }, { status: 404 });
}
