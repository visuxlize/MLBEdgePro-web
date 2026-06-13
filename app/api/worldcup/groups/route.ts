import { NextResponse } from "next/server";
import { WC_GROUPS, WC_TEAMS } from "@/lib/worldcup/data";
import type { WCGroup, GSTeam, GSMatch } from "@/lib/worldcup/types";
import type { GroupStanding } from "@/lib/worldcup/api-football";
import type { ApiFootballFixture } from "@/lib/worldcup/types";

const BASE_URL = "https://v3.football.api-sports.io";
const WC_LEAGUE_ID = 1;
const WC_SEASON = 2026;

// Map API-Football team names to our internal team IDs
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
  "Portugal": "por", "Colombia": "col", "Uzbekistan": "uzb", "DR Congo": "cod", "Congo DR": "cod",
  "England": "eng", "Croatia": "cro", "Ghana": "gha", "Panama": "pan",
};

function teamNameToId(name: string): string | null {
  return NAME_TO_ID[name] ?? null;
}

function apiStatusToGS(short: string): GSMatch["status"] {
  if (["1H", "2H", "HT", "ET", "P", "LIVE"].includes(short)) return "live";
  if (["FT", "AET", "PEN"].includes(short)) return "completed";
  return "scheduled";
}

async function fetchLiveGroups(): Promise<WCGroup[]> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return WC_GROUPS;

  const fetchOpts = {
    headers: { "x-apisports-key": key, "Content-Type": "application/json" },
    next: { revalidate: 120 },
  };

  const [standingsRes, fixturesRes] = await Promise.all([
    fetch(`${BASE_URL}/standings?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`, fetchOpts),
    fetch(`${BASE_URL}/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`, fetchOpts),
  ]);

  if (!standingsRes.ok || !fixturesRes.ok) return WC_GROUPS;

  const standingsJson = await standingsRes.json();
  const fixturesJson = await fixturesRes.json();

  const rawStandings: GroupStanding[][] = standingsJson.response?.[0]?.league?.standings ?? [];
  const rawFixtures: ApiFootballFixture[] = fixturesJson.response ?? [];

  // Build group standings map: groupName -> GSTeam[]
  const standingsMap = new Map<string, GSTeam[]>();
  for (const groupArr of rawStandings) {
    if (!groupArr.length) continue;
    const groupName = groupArr[0].group; // e.g. "Group A"
    const groupLetter = groupName.replace("Group ", "").trim();
    const teams: GSTeam[] = groupArr.map((s) => ({
      teamId: teamNameToId(s.team.name) ?? s.team.name.toLowerCase().slice(0, 3),
      p: s.all.played,
      w: s.all.win,
      d: s.all.draw,
      l: s.all.lose,
      gf: s.all.goals.for,
      ga: s.all.goals.against,
      pts: s.points,
    }));
    standingsMap.set(groupLetter, teams);
  }

  // Build matches map: groupLetter -> GSMatch[]
  const matchesMap = new Map<string, GSMatch[]>();
  for (const fix of rawFixtures) {
    const round = fix.league.round ?? "";
    const groupMatch = round.match(/Group Stage - (\d+)/i) ?? round.match(/Group ([A-L])/i);
    if (!groupMatch) continue;

    const groupLetter = rawStandings
      .flat()
      .find((s) =>
        s.team.name === fix.teams.home.name || s.team.name === fix.teams.away.name
      )?.group?.replace("Group ", "").trim();

    if (!groupLetter) continue;

    const homeId = teamNameToId(fix.teams.home.name);
    const awayId = teamNameToId(fix.teams.away.name);
    if (!homeId || !awayId) continue;

    const dt = new Date(fix.fixture.date);
    const dateStr = dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    const gsMatch: GSMatch = {
      home: homeId,
      away: awayId,
      date: dateStr,
      time: timeStr,
      venue: `${fix.fixture.venue.name}, ${fix.fixture.venue.city}`,
      homeScore: fix.goals.home,
      awayScore: fix.goals.away,
      goals: [],
      status: apiStatusToGS(fix.fixture.status.short),
    };

    const existing = matchesMap.get(groupLetter) ?? [];
    existing.push(gsMatch);
    matchesMap.set(groupLetter, existing);
  }

  // Merge into WCGroup[]
  return WC_GROUPS.map((g) => ({
    id: g.id,
    teams: standingsMap.get(g.id) ?? g.teams,
    matches: matchesMap.get(g.id) ?? g.matches,
  }));
}

export async function GET() {
  try {
    const groups = await fetchLiveGroups();
    return NextResponse.json(
      { groups, lastUpdated: new Date().toISOString() },
      { headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=60" } }
    );
  } catch {
    return NextResponse.json(
      { groups: WC_GROUPS, lastUpdated: new Date().toISOString() },
      { status: 200 }
    );
  }
}
