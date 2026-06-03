// MLB Stats API — mirrors the mobile app's data layer
const BASE = "https://statsapi.mlb.com/api/v1";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Team { id: number; name: string; }
export interface Pitcher { id: number; fullName: string; }
export interface TeamSide {
  team: Team;
  probablePitcher?: Pitcher;
  score?: number;    // from schedule response (sometimes missing)
}
export interface Linescore {
  currentInning?: number;
  currentInningOrdinal?: string;
  inningState?: string;
  teams?: {
    away?: { runs?: number; hits?: number; errors?: number };
    home?: { runs?: number; hits?: number; errors?: number };
  };
}
export interface Game {
  gamePk: number;
  gameDate: string;
  status: { detailedState: string; abstractGameState: string };
  teams: { away: TeamSide; home: TeamSide };
  venue: { id: number; name: string };
  linescore?: Linescore;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Score with linescore fallback — the schedule endpoint doesn't always populate teams.away.score */
export function getScore(side: TeamSide, linescore?: Linescore, which?: "away" | "home"): number | undefined {
  if (side.score !== undefined) return side.score;
  if (which && linescore?.teams?.[which]?.runs !== undefined) {
    return linescore.teams[which]!.runs;
  }
  return undefined;
}

export function teamLogoUrl(teamId: number): string {
  return `https://www.mlbstatic.com/team-logos/team-cap-on-light/${teamId}.svg`;
}

export function teamLogoDarkUrl(teamId: number): string {
  return `https://www.mlbstatic.com/team-logos/team-cap-on-dark/${teamId}.svg`;
}

export function playerHeadshotUrl(playerId: number): string {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${playerId}/headshot/67/current`;
}

// ESPN venue ID lookup (used by getStadiumImageUrl)
const VENUE_ESPN_ID: Record<number, number> = {
  1: 3, 2: 1, 3: 2, 4: 4, 5: 5, 7: 7, 12: 31, 14: 14, 15: 30, 17: 16,
  19: 27, 22: 19, 31: 47, 32: 4242, 680: 41, 2392: 44, 2394: 45, 2395: 43,
  2602: 83, 2680: 85, 2681: 84, 2889: 87, 3289: 209, 3309: 89, 3312: 210,
  3313: 208, 4169: 4223, 4705: 218, 5325: 231,
};

export function getStadiumImageUrl(venueId: number): string {
  const espnId = VENUE_ESPN_ID[venueId];
  if (!espnId) return "";
  return `https://a.espncdn.com/i/venues/mlb/day/${espnId}.jpg`;
}

// Team primary colors for gradient fallbacks
export const TEAM_COLORS: Record<number, string> = {
  108: "#BA0021", 109: "#A71930", 110: "#DF4601", 111: "#BD3039", 112: "#0E3386",
  113: "#C6011F", 114: "#00385D", 115: "#33006F", 116: "#0C2340", 117: "#EB6E1F",
  118: "#004687", 119: "#005A9C", 120: "#AB0003", 121: "#002D72", 133: "#003831",
  134: "#27251F", 135: "#2F241D", 136: "#0C2C56", 137: "#FD5A1E", 138: "#C41E3A",
  139: "#092C5C", 140: "#003278", 141: "#134A8E", 142: "#002B5C", 143: "#E81828",
  144: "#CE1141", 145: "#27251F", 146: "#00A3E0", 147: "#003087", 158: "#12284B",
};

export const TEAM_ABBR: Record<number, string> = {
  108: "LAA", 109: "ARI", 110: "BAL", 111: "BOS", 112: "CHC", 113: "CIN",
  114: "CLE", 115: "COL", 116: "DET", 117: "HOU", 118: "KC",  119: "LAD",
  120: "WSH", 121: "NYM", 133: "OAK", 134: "PIT", 135: "SD",  136: "SEA",
  137: "SF",  138: "STL", 139: "TB",  140: "TEX", 141: "TOR", 142: "MIN",
  143: "PHI", 144: "ATL", 145: "CWS", 146: "MIA", 147: "NYY", 158: "MIL",
};

// ── Fetchers ───────────────────────────────────────────────────────────────────

export async function fetchGamesByDate(date: string): Promise<Game[]> {
  const url = `${BASE}/schedule?sportId=1&date=${date}&hydrate=probablePitcher,linescore(teams),team`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("MLB API error");
  const data = await res.json();
  return (data.dates ?? []).flatMap((d: any) => d.games ?? []) as Game[];
}

export async function fetchTodaysGames(): Promise<Game[]> {
  return fetchGamesByDate(new Date().toISOString().slice(0, 10));
}

export async function fetchScores(): Promise<Game[]> {
  const games = await fetchTodaysGames();
  return games.filter((g) => g.status.abstractGameState !== "Preview");
}

// ── Display helpers ────────────────────────────────────────────────────────────

export function gameStatusLabel(game: Game): string {
  const state = game.status.detailedState;
  if (state === "Final" || state === "Game Over") return "Final";
  if (state === "In Progress") {
    const ls = game.linescore;
    return `${ls?.inningState ?? ""} ${ls?.currentInningOrdinal ?? ""}`.trim() || "Live";
  }
  return new Date(game.gameDate).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const tomorrow  = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, today))     return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  if (sameDay(d, tomorrow))  return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
