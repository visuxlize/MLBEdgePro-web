/**
 * API-Football (api-sports.io) integration for World Cup 2026
 *
 * Env vars required:
 *   API_FOOTBALL_KEY=your_key_here
 *
 * FIFA World Cup 2026 league ID: 1 (World Cup)
 * Season: 2026
 *
 * BallDontLie note: BallDontLie covers NBA/NFL/MLB — not FIFA soccer.
 * For World Cup soccer data, API-Football is the authoritative source.
 */

import type { ApiFootballFixture, WCPlayer } from "./types";

const BASE_URL = "https://v3.football.api-sports.io";
const WC_LEAGUE_ID = 1;
const WC_SEASON   = 2026;

function headers(): HeadersInit {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("API_FOOTBALL_KEY not set");
  return {
    "x-apisports-key": key,
    "Content-Type": "application/json",
  };
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: headers(),
    next: { revalidate: 300 }, // cache 5 min
  });
  if (!res.ok) throw new Error(`API-Football ${path}: ${res.status}`);
  const json = await res.json();
  return json.response as T;
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

/** Fetch all WC 2026 fixtures (group + knockout) */
export async function fetchWCFixtures(): Promise<ApiFootballFixture[]> {
  return apiFetch<ApiFootballFixture[]>(
    `/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`
  );
}

/** Fetch fixtures for a specific round, e.g. "Round of 32" */
export async function fetchWCRoundFixtures(round: string): Promise<ApiFootballFixture[]> {
  const encoded = encodeURIComponent(round);
  return apiFetch<ApiFootballFixture[]>(
    `/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}&round=${encoded}`
  );
}

/** Fetch today's WC fixtures */
export async function fetchWCTodayFixtures(): Promise<ApiFootballFixture[]> {
  const today = new Date().toISOString().split("T")[0];
  return apiFetch<ApiFootballFixture[]>(
    `/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}&date=${today}`
  );
}

/** Fetch live WC fixtures */
export async function fetchWCLiveFixtures(): Promise<ApiFootballFixture[]> {
  return apiFetch<ApiFootballFixture[]>(
    `/fixtures?league=${WC_LEAGUE_ID}&live=all`
  );
}

// ── Teams ─────────────────────────────────────────────────────────────────────

export interface ApiTeam {
  team: { id: number; name: string; logo: string; code: string };
  venue: { name: string; city: string; capacity: number };
}

/** Fetch all teams participating in WC 2026 */
export async function fetchWCTeams(): Promise<ApiTeam[]> {
  return apiFetch<ApiTeam[]>(
    `/teams?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`
  );
}

// ── Standings ─────────────────────────────────────────────────────────────────

export interface GroupStanding {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  group: string;
  form?: string;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
}

export async function fetchWCStandings(): Promise<GroupStanding[][]> {
  const data = await apiFetch<{ league: { standings: GroupStanding[][] } }[]>(
    `/standings?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`
  );
  return data[0]?.league?.standings ?? [];
}

// ── Players / Lineups ─────────────────────────────────────────────────────────

export interface ApiLineup {
  team: { id: number; name: string; logo: string; colors: { goalkeeper: { primary: string }; player: { primary: string } } };
  coach: { id: number; name: string; photo: string };
  formation: string;
  startXI: Array<{
    player: { id: number; name: string; number: number; pos: string; grid: string | null };
  }>;
  substitutes: Array<{
    player: { id: number; name: string; number: number; pos: string; grid: string | null };
  }>;
}

export async function fetchMatchLineups(fixtureId: number): Promise<ApiLineup[]> {
  return apiFetch<ApiLineup[]>(`/fixtures/lineups?fixture=${fixtureId}`);
}

/** Fetch squad/players for a team in WC 2026 */
export async function fetchWCSquad(teamId: number): Promise<WCPlayer[]> {
  interface ApiPlayer {
    player: {
      id: number; name: string; firstname: string; lastname: string;
      age: number; nationality: string; photo: string;
    };
    statistics: Array<{
      games: { position: string; minutes: number; rating: string };
      goals: { total: number | null; assists: number | null };
      cards: { yellow: number; red: number };
      shots: { total: number | null; on: number | null };
      passes: { accuracy: string | null };
    }>;
  }

  const data = await apiFetch<ApiPlayer[]>(
    `/players?league=${WC_LEAGUE_ID}&season=${WC_SEASON}&team=${teamId}`
  );

  return data.map((d, i) => {
    const s = d.statistics[0];
    const pos = s?.games.position as WCPlayer["position"] ?? "Midfielder";
    return {
      id: d.player.id,
      name: d.player.name,
      firstname: d.player.firstname,
      lastname: d.player.lastname,
      age: d.player.age,
      nationality: d.player.nationality,
      teamId,
      teamName: "",
      position: pos,
      // Default pitch positions — override with lineup data
      pitchX: 50,
      pitchY: 50,
      jerseyNumber: i + 1,
      photo: d.player.photo,
      stats: {
        goals:         s?.goals.total ?? 0,
        assists:       s?.goals.assists ?? 0,
        appearances:   1,
        minutesPlayed: s?.games.minutes ?? 0,
        yellowCards:   s?.cards.yellow ?? 0,
        redCards:      s?.cards.red ?? 0,
        shotsTotal:    s?.shots.total ?? 0,
        shotsOnTarget: s?.shots.on ?? 0,
        passAccuracy:  parseFloat(s?.passes.accuracy ?? "0") || 0,
        rating:        parseFloat(s?.games.rating ?? "0") || undefined,
      },
    };
  });
}

// ── Grid to pitch coordinates ─────────────────────────────────────────────────

/** Convert API-Football formation grid (e.g., "1:1") to pitch XY (0–100) */
export function gridToPitchXY(grid: string | null, side: "home" | "away"): [number, number] {
  if (!grid) return [50, 50];
  const [col, row] = grid.split(":").map(Number);
  // col = column from left (1 = goalkeeper side), row = row from top
  // API-Football uses 1-4 columns (GK, DEF, MID, ATT) and rows within each
  const x = side === "home"
    ? 10 + (col - 1) * 22
    : 90 - (col - 1) * 22;
  const y = row * 15 + 7;
  return [Math.min(90, Math.max(10, x)), Math.min(95, Math.max(5, y))];
}
