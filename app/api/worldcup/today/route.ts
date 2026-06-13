import { NextResponse } from "next/server";
import { WC_GROUPS, WC_TEAMS } from "@/lib/worldcup/data";
import type { GSMatch } from "@/lib/worldcup/types";

export interface TodayMatch {
  groupId: string;
  home: string;
  away: string;
  homeId: string;
  awayId: string;
  date: string;
  time: string;
  venue: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "scheduled" | "live" | "completed";
  homeFlagUrl: string;
  awayFlagUrl: string;
}

function flagUrl(countryCode: string) {
  return `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
}

function parseMatchDate(dateStr: string): Date | null {
  // dateStr like "Jun 13" or "Jun 13, 2026"
  try {
    const withYear = dateStr.includes(",") ? dateStr : `${dateStr}, 2026`;
    return new Date(`${withYear} UTC`);
  } catch {
    return null;
  }
}

async function fetchTodayFromApi(): Promise<TodayMatch[] | null> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return null;

  const today = new Date().toISOString().split("T")[0];
  const res = await fetch(
    `https://v3.football.api-sports.io/fixtures?league=1&season=2026&date=${today}`,
    {
      headers: { "x-apisports-key": key, "Content-Type": "application/json" },
      next: { revalidate: 60 },
    }
  );

  if (!res.ok) return null;

  const json = await res.json();
  const fixtures = json.response ?? [];

  const NAME_TO_ID: Record<string, string> = {
    "Mexico": "mex", "South Korea": "kor", "Czech Republic": "cze", "South Africa": "rsa",
    "Canada": "can", "Switzerland": "sui", "Bosnia & Herzegovina": "bih", "Qatar": "qat",
    "Brazil": "bra", "Morocco": "mor", "Scotland": "sco", "Haiti": "hai",
    "USA": "usa", "United States": "usa", "Paraguay": "par", "Australia": "aus", "Turkey": "tur",
    "Germany": "ger", "Ecuador": "ecu", "Ivory Coast": "civ", "Curacao": "cur", "Curaçao": "cur",
    "Netherlands": "ned", "Japan": "jpn", "Sweden": "swe", "Tunisia": "tun",
    "Belgium": "bel", "Iran": "irn", "Egypt": "egy", "New Zealand": "nzl",
    "Spain": "esp", "Uruguay": "uru", "Saudi Arabia": "ksa", "Cape Verde": "cpv",
    "France": "fra", "Senegal": "sen", "Norway": "nor", "Iraq": "irq",
    "Argentina": "arg", "Austria": "aut", "Algeria": "alg", "Jordan": "jor",
    "Portugal": "por", "Colombia": "col", "Uzbekistan": "uzb", "DR Congo": "cod",
    "England": "eng", "Croatia": "cro", "Ghana": "gha", "Panama": "pan",
  };

  return fixtures.map((fix: {
    fixture: { date: string; status: { short: string }; venue: { name: string; city: string } };
    teams: { home: { name: string }; away: { name: string } };
    goals: { home: number | null; away: number | null };
    league: { round: string };
  }) => {
    const homeId = NAME_TO_ID[fix.teams.home.name] ?? fix.teams.home.name.toLowerCase().slice(0, 3);
    const awayId = NAME_TO_ID[fix.teams.away.name] ?? fix.teams.away.name.toLowerCase().slice(0, 3);
    const homeTeam = WC_TEAMS[homeId];
    const awayTeam = WC_TEAMS[awayId];

    const short = fix.fixture.status.short;
    const status = ["1H", "2H", "HT", "ET", "P", "LIVE"].includes(short)
      ? "live"
      : ["FT", "AET", "PEN"].includes(short)
      ? "completed"
      : "scheduled";

    const dt = new Date(fix.fixture.date);
    return {
      groupId: fix.league.round?.match(/Group ([A-L])/)?.[1] ?? "?",
      home: homeTeam?.name ?? fix.teams.home.name,
      away: awayTeam?.name ?? fix.teams.away.name,
      homeId,
      awayId,
      date: dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      time: dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }) + " ET",
      venue: `${fix.fixture.venue.name}, ${fix.fixture.venue.city}`,
      homeScore: fix.goals.home,
      awayScore: fix.goals.away,
      status,
      homeFlagUrl: flagUrl(homeTeam?.countryCode ?? homeId),
      awayFlagUrl: flagUrl(awayTeam?.countryCode ?? awayId),
    };
  });
}

function getTodayFromStatic(): TodayMatch[] {
  const today = new Date();
  const todayStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const results: TodayMatch[] = [];

  for (const group of WC_GROUPS) {
    for (const m of group.matches) {
      // Normalize date comparison: "Jun 13" == "Jun 13"
      if (m.date.trim() !== todayStr) continue;
      const homeTeam = WC_TEAMS[m.home];
      const awayTeam = WC_TEAMS[m.away];
      results.push({
        groupId: group.id,
        home: homeTeam?.name ?? m.home,
        away: awayTeam?.name ?? m.away,
        homeId: m.home,
        awayId: m.away,
        date: m.date,
        time: m.time,
        venue: m.venue,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        status: m.status,
        homeFlagUrl: flagUrl(homeTeam?.countryCode ?? m.home),
        awayFlagUrl: flagUrl(awayTeam?.countryCode ?? m.away),
      });
    }
  }

  return results;
}

export async function GET() {
  try {
    const liveMatches = await fetchTodayFromApi();
    const matches = liveMatches ?? getTodayFromStatic();

    return NextResponse.json(
      { matches, date: new Date().toISOString().split("T")[0] },
      { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" } }
    );
  } catch {
    return NextResponse.json(
      { matches: getTodayFromStatic(), date: new Date().toISOString().split("T")[0] },
      { status: 200 }
    );
  }
}
