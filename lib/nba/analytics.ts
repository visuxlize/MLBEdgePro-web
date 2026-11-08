/**
 * NBA model utilities — pure functions (safe in server & client).
 * Ratings come from real ESPN standings data (points for / against, shrunk by games played).
 */
import type { NbaPlayerProp, NbaPlayerSeason, NbaPropMarket, NbaStandingRow } from "./types";

/** Standard normal CDF (Abramowitz–Stegun approximation) */
export function normCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

export function gradeFromEdge(edge: number): string {
  return edge >= 80 ? "A+" : edge >= 72 ? "A" : edge >= 64 ? "B+" : edge >= 55 ? "B" : edge >= 46 ? "C+" : "C";
}

/** Shrink a raw average point differential toward 0 — early-season samples are noisy. */
export function powerRating(avgDiff: number, gp: number): number {
  return avgDiff * (gp / (gp + 12));
}

const HOME_COURT = 2.3;

export interface GameModel {
  homeWinProb: number;
  /** Expected home margin (positive = home wins) */
  margin: number;
  projHome: number;
  projAway: number;
  projTotal: number;
  edge: number;
  grade: string;
  /** Model margin minus market margin (points of value) when a market line exists */
  valuePts?: number;
}

export function modelNbaGame(
  home: NbaStandingRow | undefined,
  away: NbaStandingRow | undefined,
  marketHomeSpread?: number | null,
): GameModel {
  const hp = home?.power ?? 0;
  const ap = away?.power ?? 0;
  const margin = hp - ap + HOME_COURT;
  const homeWinProb = Math.max(4, Math.min(96, Math.round(normCdf(margin / 12) * 100)));

  const lg = 114;
  const hOff = home?.ppg ?? lg, hDef = home?.oppg ?? lg;
  const aOff = away?.ppg ?? lg, aDef = away?.oppg ?? lg;
  const total = ((hOff + aDef) / 2 + (aOff + hDef) / 2);
  const projHome = Math.round((total + margin) / 2 * 10) / 10;
  const projAway = Math.round((total - margin) / 2 * 10) / 10;

  let edge = 40 + Math.abs(homeWinProb - 50) * 1.6;
  let valuePts: number | undefined;
  if (marketHomeSpread != null) {
    valuePts = Math.round((margin - -marketHomeSpread) * 10) / 10;
    edge = 44 + Math.abs(valuePts) * 5.2 + Math.abs(homeWinProb - 50) * 0.4;
  }
  edge = Math.max(41, Math.min(94, Math.round(edge)));
  return { homeWinProb, margin: Math.round(margin * 10) / 10, projHome, projAway, projTotal: Math.round(total * 10) / 10, edge, grade: gradeFromEdge(edge), valuePts };
}

// ── Player props ────────────────────────────────────────────────────────────

const MARKETS: { market: NbaPropMarket; key: keyof NbaPlayerSeason; exp: number; env: number; sd: (avg: number) => number; min: number }[] = [
  { market: "Points",     key: "pts", exp: 0.7, env: 0.9, sd: (a) => Math.max(4.5, a * 0.3),            min: 12 },
  { market: "Rebounds",   key: "reb", exp: 0.3, env: 0.6, sd: (a) => Math.max(1.6, Math.sqrt(a) * 1.25), min: 5 },
  { market: "Assists",    key: "ast", exp: 0.3, env: 0.7, sd: (a) => Math.max(1.4, Math.sqrt(a) * 1.3),  min: 4 },
  { market: "3-Pointers", key: "tpm", exp: 0.5, env: 0.8, sd: (a) => Math.max(0.9, Math.sqrt(a) * 1.15), min: 1.8 },
];

export interface RealLine { line: number; openLine: number; price?: number; updated?: string }

export interface PropGameCtx {
  id: string; away: string; home: string; tipLabel: string;
  /** Market total & home spread when a book line is posted */
  total?: number | null;
  homeSpread?: number | null;
  /** Real DraftKings lines keyed `${espnId}:${market}` — when present for a game, only real lines are used */
  lines?: Map<string, RealLine>;
}

/**
 * Props model. With real DraftKings lines the edge is the model's hit chance at the book's number (50% = fair);
 * without them it falls back to a season-average reference line. The reference line is the season average snapped to a half-point; because a half-point line
 * is rarely exactly the mean, raw hit-probability mostly reflects rounding. So the *edge* is measured as the
 * lift over the baseline (season-average-only) probability — what the matchup, game environment (market total)
 * and blowout risk (market spread) actually add.
 */
export function buildNbaProps(
  players: NbaPlayerSeason[],
  games: PropGameCtx[],
  standings: Map<string, NbaStandingRow>,
): NbaPlayerProp[] {
  const rows = [...standings.values()];
  const lgOppg = rows.length ? rows.reduce((a, r) => a + r.oppg, 0) / rows.length : 114;
  const lgTotal = lgOppg * 2;
  const out: NbaPlayerProp[] = [];

  for (const g of games) {
    const envRatio = g.total ? g.total / lgTotal : 1;
    const spreadAbs = Math.abs(g.homeSpread ?? 0);
    const blowout = 1 - Math.max(0, spreadAbs - 9) * 0.006;
    for (const side of ["home", "away"] as const) {
      const team = g[side];
      const opp = side === "home" ? g.away : g.home;
      const oppRow = standings.get(opp);
      const ratio = oppRow ? oppRow.oppg / lgOppg : 1;
      const shrink = oppRow ? oppRow.gp / (oppRow.gp + 8) : 0;
      const roster = players.filter((p) => p.team === team && p.gp >= 3 && p.min >= 18);
      for (const p of roster) {
        for (const m of MARKETS) {
          const avg = p[m.key] as number;
          if (!avg || avg < m.min) continue;
          const oppFactor = Math.pow(ratio, m.exp * shrink) * Math.pow(envRatio, m.env) * blowout;
          const proj = avg * oppFactor;
          const real = g.lines?.get(`${p.espnId}:${m.market}`);
          if (g.lines && g.lines.size > 0 && !real) continue; // book posted this game — only show real lines
          const line = real ? real.line : Math.floor(avg) + 0.5;
          const sd = m.sd(avg);
          const pOver = 1 - normCdf((line - proj) / sd);
          const baseOver = real ? 0.5 : 1 - normCdf((line - avg) / sd);
          const over = pOver - baseOver >= 0;
          const prob = Math.round((over ? pOver : 1 - pOver) * 100);
          const baseProb = Math.round((over ? baseOver : 1 - baseOver) * 100);
          const lift = Math.abs(pOver - baseOver) * 100;
          const edge = Math.max(41, Math.min(95, Math.round(44 + lift * 6.5 + Math.max(0, prob - 50) * 0.35)));
          out.push({
            id: `${g.id}-${p.espnId}-${m.market}`,
            espnId: p.espnId, player: p.name, team, opp, gameId: g.id, home: side === "home",
            tipLabel: g.tipLabel, market: m.market, line,
            source: real ? "draftkings" : "model", openLine: real?.openLine, price: real?.price, updated: real?.updated,
            proj: Math.round(proj * 10) / 10,
            seasonAvg: Math.round(avg * 10) / 10,
            oppFactor: Math.round(oppFactor * 100) / 100,
            prob, baseProb, over, edge, grade: gradeFromEdge(edge),
            minutes: Math.round(p.min), gp: p.gp,
          });
        }
      }
    }
  }
  return out.sort((a, b) => b.edge - a.edge);
}
