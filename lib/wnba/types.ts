export type WnbaGameStatus = "pre" | "live" | "final";

export interface WnbaLiveState {
  period: number;
  clock: string;
  lastPlay: string;
}

export interface WnbaGame {
  id: string;
  date: string;
  dateLabel: string;
  timeLabel: string;
  venue: string;
  venueImage?: string;
  away: string;
  home: string;
  awayScore?: number;
  homeScore?: number;
  status: WnbaGameStatus;
  statusDetail: string;
  live?: WnbaLiveState;
  edge: number;
  grade: string;
  homeWinProb: number;
}

export interface WnbaH2HStat {
  label: string;
  awayVal: string;
  homeVal: string;
  awayPct: number;
  homePct: number;
}

export interface WnbaEdgeFactor {
  label: string;
  value: string;
  pct: number;
  color: string;
}

export type WnbaPropPosition = "PG" | "SG" | "SF" | "PF" | "C";
export type WnbaPropMarket = "Points" | "Rebounds" | "Assists" | "3-Pointers Made";

export interface WnbaPlayerProp {
  id: string;
  espnId: string;
  player: string;
  pos: WnbaPropPosition;
  team: string;
  matchup: string;
  market: WnbaPropMarket;
  line: number;
  model: number;
  edge: number;
  grade: string;
  odds: string;
  over: boolean;
}

export interface WnbaImpactStat {
  espnId: string;
  player: string;
  pos: WnbaPropPosition;
  team: string;
  usageRate: number;
  trueShooting: number;
  plusMinus: number;
  zones: { zone: string; pct: number }[];
  grade: string;
}
