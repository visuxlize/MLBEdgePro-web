export type SoccerLeagueKey =
  | "epl" | "laliga" | "seriea" | "bundesliga" | "ligue1"
  | "ucl" | "europa" | "mls" | "ligamx" | "brasileirao";

export interface SoccerLeagueDef {
  key: SoccerLeagueKey;
  slug: string;
  label: string;
  shortLabel: string;
  region: "europe" | "americas" | "continental";
  color: string;
  country: string;
  espnLeagueId: string;
  teams: number;
  format: string;
}

export interface SoccerTeamInfo {
  id: string;
  name: string;
  shortName: string;
  abbr: string;
  logo: string;
  hex: string;
}

export interface SoccerMatch {
  id: string;
  league: SoccerLeagueKey;
  date: string;
  status: "pre" | "live" | "final";
  minute?: number;
  homeTeam: SoccerTeamInfo;
  awayTeam: SoccerTeamInfo;
  homeScore?: number;
  awayScore?: number;
  venue?: string;
  /** Live clock text e.g. "67'" and ESPN's short status ("FT", "HT", "67'") */
  clock?: string;
  statusDetail?: string;
  odds?: { homeML?: string; drawML?: string; awayML?: string; overUnder?: number | null };
  /** Model win/draw/loss % (from league tables) — filled by getSoccerFixtures */
  model?: { home: number; draw: number; away: number; xgHome: number; xgAway: number };
}
