export type NflWeekKey = "HOF_PRE1" | "PRE2" | "PRE3" | "WK1";

export interface NflWeekDef {
  key: NflWeekKey;
  label: string;
  dateRange: string;
  fetch: { seasonType: 1 | 2; week: number }[];
}

export type NflGameStatus = "pre" | "live" | "final";

export interface NflDriveState {
  possession: string;
  downDistance: string;
  spot: string;
  ballPct: number;
  firstDownPct: number;
  driveStats: string;
  lastPlay: string;
}

export interface NflWinProbPoint {
  x: number;
  y: number;
}

export interface NflGame {
  id: string;
  week: NflWeekKey;
  weekLabel: string;
  date: string;
  dateLabel: string;
  timeLabel: string;
  venue: string;
  venueId?: string;
  venueImage?: string;
  away: string;
  home: string;
  awayScore?: number;
  homeScore?: number;
  status: NflGameStatus;
  statusDetail: string;
  qbAway?: string;
  qbHome?: string;
  drive?: NflDriveState;
  edge: number;
  grade: string;
  homeWinProb: number;
}

export interface NflH2HStat {
  label: string;
  awayVal: string;
  homeVal: string;
  awayPct: number;
  homePct: number;
}

export interface NflEdgeFactor {
  label: string;
  value: string;
  pct: number;
  color: string;
}

export type NflPropPosition = "QB" | "RB" | "WR" | "TE";

export interface NflPlayerProp {
  id: string;
  player: string;
  pos: NflPropPosition;
  team: string;
  matchup: string;
  market: string;
  line: number;
  model: number;
  edge: number;
  grade: string;
  odds: string;
  over: boolean;
}
