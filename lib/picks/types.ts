/** One bettable leg — a player prop or a whole-game bet — in the shape every sport shares. */
export interface PropItem {
  id: string;
  sport: "nba" | "nfl" | "soccer";
  /** "player" props (default) or whole-game bets: spread, moneyline, total, match result */
  scope?: "player" | "game";
  athleteId: string;
  /** ESPN league slug (soccer) */
  league?: string;
  /** Soccer target, "Yes" or "2+" */
  target?: string;
  /** "model" = we grade a line (hit chance, grade, projection) · "market" = a posted price only */
  kind: "model" | "market";
  player: string;
  headshot: string;
  hex: string;
  logo: string;
  team: string;
  pos?: string;
  opp: string;
  home?: boolean;
  gameId: string;
  gameLabel: string;
  when: string;
  marketKey: string;
  marketShort: string;
  /** The recommended pick, e.g. "Over 24.5" or "Anytime — Yes" */
  pick: string;
  side?: "over" | "under" | "home" | "away" | "draw" | "yes";
  line?: number;
  lineSource: "draftkings" | "model";
  openLine?: number;
  /** Hit chance (model) or implied chance from the price (market), 0–100 */
  prob: number;
  baseProb?: number;
  edge: number;
  grade?: string;
  proj?: number;
  seasonAvg?: number;
  price?: number;
  openPrice?: number;
  movement?: "shorter" | "longer" | null;
  stats: { label: string; value: string }[];
  notes: string[];
  tag?: { label: string; tone: "good" | "bad" | "neutral" };
}

