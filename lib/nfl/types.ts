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
  week?: NflWeekKey;
  gameDate?: string;
}

/* ── League-wide (all weeks, standings, players) ─────────────────────────── */

export interface NflOdds {
  provider: string;
  /** Home-team spread (negative = home favored) */
  homeSpread: number | null;
  overUnder: number | null;
  homeML?: string;
  awayML?: string;
}

export interface NflLeaderLine {
  category: "Passing" | "Rushing" | "Receiving";
  player: string;
  line: string;
  team: string;
  espnId: string;
}

export interface NflSeasonGame {
  id: string;
  seasonType: 1 | 2 | 3;
  weekNum: number;
  weekLabel: string;
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
  status: NflGameStatus;
  statusDetail: string;
  broadcast?: string;
  odds?: NflOdds;
  leaders: NflLeaderLine[];
  homeWinProb: number;
  edge: number;
  grade: string;
}

export interface NflStandingRow {
  abbr: string;
  name: string;
  conf: "AFC" | "NFC";
  division: string;
  seed: number;
  wins: number;
  losses: number;
  ties: number;
  pct: number;
  pf: number;
  pa: number;
  diff: number;
  gp: number;
  streak: string;
  home: string;
  road: string;
  divRecord: string;
  confRecord: string;
  /** Edge Power: points differential per game, shrunk for sample size */
  power: number;
  ppg: number;
  papg: number;
}

export interface NflPlayerSeason {
  espnId: string;
  name: string;
  team: string;
  pos: string;
  gp: number;
  /** raw season stats keyed by ESPN stat name */
  s: Record<string, number>;
}

export type NflPropMarket = "Pass Yds" | "Pass TDs" | "Rush Yds" | "Rec Yds" | "Receptions";

export interface NflPropPlay {
  id: string;
  espnId: string;
  player: string;
  pos: string;
  team: string;
  opp: string;
  home: boolean;
  gameId: string;
  kickoff: string;
  market: NflPropMarket;
  /** Prop line — real DraftKings line when posted, otherwise a season-average reference */
  line: number;
  source: "draftkings" | "model";
  openLine?: number;
  updated?: string;
  proj: number;
  seasonAvg: number;
  factor: number;
  prob: number;
  baseProb: number;
  over: boolean;
  edge: number;
  grade: string;
  gp: number;
  /** Plain-English reasons behind the lean */
  notes: string[];
}

export interface NflTeamStatRow { label: string; away: string; home: string; awayPct: number; homePct: number }

export interface NflPlayLine {
  id: string;
  period: number;
  clock: string;
  text: string;
  type: string;
  scoring: boolean;
  yards?: number;
  team?: string;
}

/** Live drive / field state for an in-progress (or just-finished) game. */
export interface NflLive {
  period: number;
  clock: string;
  possession: string | null;
  downText: string;
  distance?: number;
  yardsToEndzone?: number;
  /** Ball position 0–100 from the left end zone (away attacks right, home attacks left) */
  ballX: number;
  driveStartX?: number;
  drive?: { team: string; plays: number; yards: number; time: string; description: string };
  redZone: boolean;
  lastPlay?: NflPlayLine;
  recent: NflPlayLine[];
  quarters: { away: string[]; home: string[] };
  scoring: { period: number; clock: string; team: string; text: string; away: number; home: number }[];
}

export interface NflGameDetail {
  game: NflSeasonGame;
  teamStats: NflTeamStatRow[];
  injuries: { team: string; player: string; status: string; pos: string }[];
  winProbSeries: number[];
  /** ESPN's matchup predictor — home win % */
  predictorHome?: number;
  live?: NflLive;
  venueImage?: string;
  recap?: string;
}
