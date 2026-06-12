// ── World Cup 2026 Core Types ───────────────────────────────────────────────

export interface WCTeam {
  id: string;
  name: string;
  shortName: string;    // 3-letter code (e.g. "FRA")
  countryCode: string;  // ISO-2 for flags (e.g. "fr")
  group?: string;
  strength: number;     // ELO-style rating (1400–1900)
  color: string;        // primary jersey hex
}

export type MatchStatus = "scheduled" | "live" | "completed" | "tbd";
export type WinnerSide = "top" | "bottom" | null;
export type RoundKey = "r32" | "r16" | "qf" | "sf" | "final" | "3rd";

export interface BracketMatch {
  id: string;
  round: RoundKey;
  /** 0-indexed position within the round */
  position: number;
  /** "upper" = top-half of the bracket, "lower" = bottom-half */
  side: "upper" | "lower" | "center";
  topTeamId: string | null;
  bottomTeamId: string | null;
  topScore: number | null;
  bottomScore: number | null;
  topPens: number | null;
  bottomPens: number | null;
  status: MatchStatus;
  winner: WinnerSide;
  date: string;
  time: string;
  venue: string;
  city: string;
  /** ID of match this winner advances to */
  nextMatchId: string | null;
  /** Which slot (top/bottom) in the next match */
  nextSlot: WinnerSide;
  /** Win probability for top team (0–1), used by predictor */
  topWinProb?: number;
}

export interface BracketState {
  matches: Record<string, BracketMatch>;
  /** Ordered match IDs per round */
  rounds: Record<RoundKey, string[]>;
  /** The champion team ID, set after final */
  championId: string | null;
}

// ── Host City / Venue ────────────────────────────────────────────────────────

export type HostCountry = "USA" | "Canada" | "Mexico";

export interface HostCity {
  id: string;
  name: string;
  displayName: string;
  stadium: string;
  country: HostCountry;
  /** [longitude, latitude] — note: react-simple-maps uses [lng, lat] order */
  coordinates: [number, number];
  capacity: number;
  /** Approximate number of matches hosted */
  matchCount: number;
  timezone: string;
  /** June-July typical climate */
  weather: CityWeather;
  /** Placeholder scheduled matches */
  upcomingMatches: UpcomingMatch[];
  /** Is it a Final/Championship venue */
  isFinalVenue?: boolean;
}

export interface CityWeather {
  tempF: number;
  condition: string;
  humidity: number;
  windMph: number;
  icon: string; // emoji or icon key
}

export interface UpcomingMatch {
  matchLabel: string; // e.g., "Group A – Match 1"
  date: string;       // e.g., "Jun 12, 2026"
  teams: string;      // e.g., "Team A vs Team B"
}

// ── Odds / Betting ───────────────────────────────────────────────────────────

export interface WCOddsMarket {
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  moneyline: {
    home: string;
    draw: string;
    away: string;
  };
  spread?: {
    home: { line: number; odds: string };
    away: { line: number; odds: string };
  };
  totals?: {
    over: { line: number; odds: string };
    under: { line: number; odds: string };
  };
  bookmaker: string;
  lastUpdate: string;
}

export interface PlayerProp {
  playerId: number;
  playerName: string;
  teamName: string;
  propType: string;        // e.g., "Anytime Goalscorer", "Shots on Target O/U"
  line?: number;
  overOdds?: string;
  underOdds?: string;
  yesOdds?: string;
  noOdds?: string;
  modelProb: number;       // our model's win probability (0–1)
  impliedProb: number;     // bookmaker implied probability (0–1)
  hasEdge: boolean;        // modelProb > impliedProb + threshold
  edgePct: number;         // model - implied (percentage points)
}

// ── API-Football Player / Lineup ─────────────────────────────────────────────

export interface WCPlayer {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: number;
  nationality: string;
  teamId: number;
  teamName: string;
  position: "Goalkeeper" | "Defender" | "Midfielder" | "Attacker";
  /** x: 0-100 (left-right on pitch), y: 0-100 (top-bottom) */
  pitchX: number;
  pitchY: number;
  jerseyNumber: number;
  photo?: string;
  stats?: WCPlayerStats;
}

export interface WCPlayerStats {
  goals: number;
  assists: number;
  appearances: number;
  minutesPlayed: number;
  yellowCards: number;
  redCards: number;
  shotsTotal: number;
  shotsOnTarget: number;
  passAccuracy: number;
  rating?: number;
}

// ── API-Football response types ──────────────────────────────────────────────

// ── Group Stage Types ────────────────────────────────────────────────────────

export interface GSGoal { teamId: string; scorer: string; min: number; }
export interface GSMatch {
  home: string; away: string;
  date: string; time: string; venue: string;
  homeScore: number | null; awayScore: number | null;
  goals: GSGoal[];
  status: "scheduled" | "completed" | "live";
}
export interface GSTeam { teamId: string; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number; }
export interface WCGroup { id: string; teams: GSTeam[]; matches: GSMatch[]; }

export interface ApiFootballFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string; long: string };
    venue: { name: string; city: string };
  };
  league: { id: number; name: string; round: string };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}
