import { NextResponse } from "next/server";

const SOURCES: Record<string, string> = {
  mlb: "https://site.api.espn.com/apis/v2/sports/baseball/mlb/standings",
  wnba: "https://site.api.espn.com/apis/v2/sports/basketball/wnba/standings",
};

interface RecapRow { abbr: string; name: string; logo: string | null; wins: number; losses: number; pct: number }

const num = (e: any, n: string) => {
  const v = e.stats?.find((s: any) => s.name === n)?.value;
  return typeof v === "number" ? v : 0;
};

/** Final standings for a sport that's out of season — top teams per league/conference. */
export async function GET(req: Request) {
  const sport = new URL(req.url).searchParams.get("sport") ?? "";
  const url = SOURCES[sport];
  if (!url) return NextResponse.json({ groups: [] }, { status: 400 });
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return NextResponse.json({ groups: [] });
    const data = await res.json();
    const groups = (data.children ?? []).map((c: any) => {
      const rows: RecapRow[] = (c.standings?.entries ?? []).map((e: any) => {
        const wins = num(e, "wins"), losses = num(e, "losses");
        return {
          abbr: e.team?.abbreviation ?? "", name: e.team?.displayName ?? "",
          logo: e.team?.logos?.[0]?.href ?? null, wins, losses,
          pct: wins + losses ? wins / (wins + losses) : 0,
        };
      });
      rows.sort((a, b) => b.pct - a.pct);
      return { name: c.name as string, rows: rows.slice(0, 6) };
    });
    return NextResponse.json({ groups });
  } catch {
    return NextResponse.json({ groups: [] });
  }
}
