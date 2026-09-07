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
}

export interface SoccerMatchEdge {
  homeXg: number;
  awayXg: number;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  homePpda: number;
  awayPpda: number;
  possession: number;
  edge: number;
  grade: string;
  pick: string;
  pickReason: string;
}

export type SoccerPropType = "goals" | "shots" | "assists" | "cards";
export type SoccerPosition = "All" | "ST" | "MF" | "DF" | "GK";

export interface SoccerPlayerProp {
  id: string;
  playerName: string;
  espnPlayerId: string;
  teamId: string;
  teamAbbr: string;
  teamHex: string;
  teamLogo: string;
  position: SoccerPosition;
  league: SoccerLeagueKey;
  matchup: string;
  market: string;
  propType: SoccerPropType;
  line: number;
  modelProj: number;
  probability: number;
  side: "OVER" | "YES" | "UNDER";
  odds: string;
  grade: string;
  edge: number;
}
