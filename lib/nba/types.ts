export type NbaStatus = "pre" | "live" | "final";

export interface NbaOdds {
  provider: string;
  /** Home-team spread (negative = home favored) */
  homeSpread: number | null;
  overUnder: number | null;
  homeML?: string;
  awayML?: string;
  details?: string;
}

export interface NbaGame {
  id: string;
  date: string;
  dateLabel: string;
  timeLabel: string;
  venue: string;
  away: string;
  home: string;
  awayScore?: number;
  homeScore?: number;
  awayRecord?: string;
  homeRecord?: string;
  status: NbaStatus;
  statusDetail: string;
  period?: number;
  clock?: string;
  isCup: boolean;
  cupLabel?: string;
  broadcast?: string;
  odds?: NbaOdds;
  headline?: string;
  /** Model outputs (see lib/nba/analytics.ts) */
  homeWinProb: number;
  edge: number;
  grade: string;
}

export interface NbaStandingRow {
  teamId: string;
  abbr: string;
  name: string;
  conf: "East" | "West";
  rank: number;
  wins: number;
  losses: number;
  pct: number;
  gb: string;
  streak: string;
  l10: string;
  home: string;
  road: string;
  ppg: number;
  oppg: number;
  diff: number;
  gp: number;
  /** Edge Power rating — shrunk net rating, used for power rankings & the game model */
  power: number;
}

export interface NbaCupRow {
  abbr: string;
  wins: number;
  losses: number;
  pf: number;
  pa: number;
  diff: number;
  /** "adv" = group winner, "wc" = wild-card position, undefined = not currently advancing */
  q?: "adv" | "wc";
}

export interface NbaCupGroup {
  id: string;
  conf: "East" | "West";
  label: string;
  rows: NbaCupRow[];
}

export interface NbaCupData {
  groups: NbaCupGroup[];
  games: NbaGame[];
  knockout: NbaGame[];
  /** How many group-play games are final vs total */
  played: number;
  total: number;
}

export type NbaPropMarket = "Points" | "Rebounds" | "Assists" | "3-Pointers";

export interface NbaPlayerProp {
  id: string;
  espnId: string;
  player: string;
  team: string;
  opp: string;
  gameId: string;
  home: boolean;
  tipLabel: string;
  market: NbaPropMarket;
  /** Prop line — real DraftKings line when posted, otherwise a season-average reference */
  line: number;
  /** "draftkings" = real sportsbook line · "model" = season-average reference (book hasn't posted yet) */
  source: "draftkings" | "model";
  openLine?: number;
  /** DraftKings' quoted price at this line (side not specified by the feed) */
  price?: number;
  updated?: string;
  /** Matchup-adjusted model projection */
  proj: number;
  seasonAvg: number;
  /** Opponent defensive factor applied (1.00 = neutral) */
  oppFactor: number;
  prob: number;
  /** Hit probability using the season average alone (no matchup/environment adjustment) */
  baseProb: number;
  over: boolean;
  edge: number;
  grade: string;
  minutes: number;
  gp: number;
}

export interface NbaPlayerSeason {
  espnId: string;
  name: string;
  team: string;
  gp: number;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  tpm: number;
  stl: number;
  blk: number;
  fgPct: number;
  tpPct: number;
}

export interface NbaTeamStatRow {
  label: string;
  away: string;
  home: string;
  awayPct: number;
  homePct: number;
}

export interface NbaBoxPlayer {
  espnId: string;
  name: string;
  pos: string;
  min: string;
  pts: string;
  reb: string;
  ast: string;
  fg: string;
  tp: string;
  pm: string;
}

export interface NbaShot { x: number; y: number; made: boolean; side: "away" | "home"; pts: number; player: string; period: number; clock: string }
export interface NbaPlayLine { id: string; period: number; clock: string; text: string; scoring: boolean; side?: "away" | "home"; score?: string }

export interface NbaLive {
  period: number;
  clock: string;
  quarters: { away: string[]; home: string[] };
  recent: NbaPlayLine[];
  shots: NbaShot[];
  /** Current scoring run (unanswered points) */
  run?: { side: "away" | "home"; pts: number; since: string };
  /** Score margin (away − home) after each scoring play */
  margin: number[];
  leadChanges: number;
  largestLead: { away: number; home: number };
}

export interface NbaGameDetail {
  game: NbaGame;
  teamStats: NbaTeamStatRow[];
  leaders: { team: string; category: string; value: string; player: string; espnId: string }[];
  box: { away: NbaBoxPlayer[]; home: NbaBoxPlayer[] };
  winProbSeries: number[];
  injuries: { team: string; player: string; status: string }[];
  recap?: string;
  live?: NbaLive;
}
