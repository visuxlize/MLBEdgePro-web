import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date      = searchParams.get("date");
  const teamId    = searchParams.get("teamId");
  const startDate = searchParams.get("startDate");
  const endDate   = searchParams.get("endDate");

  const hydrate = "probablePitcher,linescore(teams),team";
  let url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&hydrate=${hydrate}`;

  if (teamId && startDate && endDate) {
    url += `&teamId=${teamId}&startDate=${startDate}&endDate=${endDate}`;
  } else if (date) {
    url += `&date=${date}`;
  } else {
    url += `&date=${new Date().toISOString().slice(0, 10)}`;
  }

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return NextResponse.json([], { status: 502 });
    const data = await res.json();
    const games = (data.dates ?? []).flatMap((d: any) => d.games ?? []);
    return NextResponse.json(games);
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
