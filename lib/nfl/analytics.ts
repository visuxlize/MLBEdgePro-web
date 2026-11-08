/** NFL model utilities — pure functions (server & client safe). Ratings come from real ESPN standings. */
import type { NflPlayerSeason, NflPropMarket, NflPropPlay, NflStandingRow } from "./types";

export function normCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

export function gradeFromEdge(edge: number): string {
  return edge >= 80 ? "A+" : edge >= 72 ? "A" : edge >= 64 ? "B+" : edge >= 55 ? "B" : edge >= 46 ? "C+" : "C";
}

export function nflPower(ppgDiff: number, gp: number): number {
  return ppgDiff * (gp / (gp + 5));
}

const HFA = 1.8;

export interface NflGameModel {
  homeWinProb: number;
  margin: number;
  projHome: number;
  projAway: number;
  projTotal: number;
  edge: number;
  grade: string;
  valuePts?: number;
}

export function modelNflGame(home: NflStandingRow | undefined, away: NflStandingRow | undefined, marketHomeSpread?: number | null): NflGameModel {
  const margin = (home?.power ?? 0) - (away?.power ?? 0) + HFA;
  const homeWinProb = Math.max(5, Math.min(95, Math.round(normCdf(margin / 13.5) * 100)));
  const lg = 22.5;
  const hOff = home?.ppg ?? lg, hDef = home?.papg ?? lg, aOff = away?.ppg ?? lg, aDef = away?.papg ?? lg;
  const total = (hOff + aDef) / 2 + (aOff + hDef) / 2;
  const projHome = Math.round(((total + margin) / 2) * 10) / 10;
  const projAway = Math.round(((total - margin) / 2) * 10) / 10;
  let edge = 40 + Math.abs(homeWinProb - 50) * 1.5;
  let valuePts: number | undefined;
  if (marketHomeSpread != null) {
    valuePts = Math.round((margin + marketHomeSpread) * 10) / 10;
    edge = 44 + Math.abs(valuePts) * 4.2 + Math.abs(homeWinProb - 50) * 0.35;
  }
  edge = Math.max(41, Math.min(94, Math.round(edge)));
  return { homeWinProb, margin: Math.round(margin * 10) / 10, projHome, projAway, projTotal: Math.round(total * 10) / 10, edge, grade: gradeFromEdge(edge), valuePts };
}

/* ── Player props ────────────────────────────────────────────────────────── */

interface MarketDef {
  market: NflPropMarket;
  pos: string[];
  /** per-game average from season stats */
  avg: (p: NflPlayerSeason) => number;
  /** exponent applied to opponent points-allowed ratio */
  oppExp: number;
  /** exponent applied to game-total environment ratio */
  envExp: number;
  /** how a team's game script (spread) moves the stat: +1 = benefits from trailing, -1 = benefits from leading */
  script: number;
  sd: (avg: number) => number;
  min: number;
}

const perGame = (p: NflPlayerSeason, k: string) => (p.gp ? (p.s[k] ?? 0) / p.gp : 0);

const MARKETS: MarketDef[] = [
  { market: "Pass Yds",  pos: ["QB"],        avg: (p) => perGame(p, "passingYards"),       oppExp: 0.6, envExp: 0.8, script: 0.5,  sd: (a) => Math.max(38, a * 0.25), min: 150 },
  { market: "Pass TDs",  pos: ["QB"],        avg: (p) => perGame(p, "passingTouchdowns"),  oppExp: 0.7, envExp: 1.0, script: 0.3,  sd: (a) => Math.max(0.8, Math.sqrt(a) * 0.9), min: 1.0 },
  { market: "Rush Yds",  pos: ["RB"],        avg: (p) => perGame(p, "rushingYards"),       oppExp: 0.4, envExp: 0.4, script: -1,   sd: (a) => Math.max(18, a * 0.45), min: 30 },
  { market: "Rec Yds",   pos: ["WR", "TE"],  avg: (p) => perGame(p, "receivingYards"),     oppExp: 0.6, envExp: 0.8, script: 0.5,  sd: (a) => Math.max(18, a * 0.5), min: 30 },
  { market: "Receptions",pos: ["WR", "TE", "RB"], avg: (p) => perGame(p, "receptions"),    oppExp: 0.4, envExp: 0.6, script: 0.5,  sd: (a) => Math.max(1.6, Math.sqrt(a) * 1.25), min: 3.5 },
];

export interface NflPropGameCtx {
  id: string; away: string; home: string; kickoff: string;
  total?: number | null;
  homeSpread?: number | null;
  /** Real DraftKings lines keyed `${espnId}:${market}` — when present for a game, only real lines are used */
  lines?: Map<string, { line: number; openLine: number; updated?: string }>;
}

/**
 * Props model. Reference line = season per-game average snapped to a half-point. Edge is the *lift* over the
 * baseline hit chance from (1) opponent scoring defense, (2) game environment (market total) and (3) game
 * script (market spread — trailing teams throw more, leading teams run more).
 */
export function buildNflProps(players: NflPlayerSeason[], games: NflPropGameCtx[], standings: Map<string, NflStandingRow>): NflPropPlay[] {
  const rows = [...standings.values()];
  const lgPapg = rows.length ? rows.reduce((a, r) => a + r.papg, 0) / rows.length : 22.5;
  const lgTotal = lgPapg * 2;
  const out: NflPropPlay[] = [];

  for (const g of games) {
    const env = g.total ? g.total / lgTotal : 1;
    for (const side of ["home", "away"] as const) {
      const team = g[side], opp = side === "home" ? g.away : g.home;
      const oppRow = standings.get(opp);
      const ratio = oppRow ? oppRow.papg / lgPapg : 1;
      const shrink = oppRow ? oppRow.gp / (oppRow.gp + 4) : 0;
      // team spread from its own perspective (negative = favored)
      const teamSpread = g.homeSpread == null ? 0 : side === "home" ? g.homeSpread : -g.homeSpread;
      const trailing = Math.max(-10, Math.min(10, teamSpread)); // + = underdog
      for (const p of players.filter((x) => x.team === team && x.gp >= 3)) {
        for (const m of MARKETS) {
          if (!m.pos.includes(p.pos)) continue;
          const avg = m.avg(p);
          if (avg < m.min) continue;
          const oppF = Math.pow(ratio, m.oppExp * shrink);
          const envF = Math.pow(env, m.envExp);
          const scriptF = 1 + m.script * trailing * 0.008;
          const factor = oppF * envF * scriptF;
          const proj = avg * factor;
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
          const edge = Math.max(41, Math.min(95, Math.round(44 + lift * 6 + Math.max(0, prob - 50) * 0.3)));

          const notes: string[] = [];
          if (oppF >= 1.02) notes.push(`${opp} allow ${oppRow!.papg.toFixed(1)} ppg — a soft scoring defense`);
          else if (oppF <= 0.98) notes.push(`${opp} allow just ${oppRow!.papg.toFixed(1)} ppg — a tough scoring defense`);
          if (g.total) notes.push(env >= 1.04 ? `High game total (${g.total}) lifts volume` : env <= 0.96 ? `Low game total (${g.total}) caps volume` : `Game total ${g.total}`);
          if (g.homeSpread != null && Math.abs(teamSpread) >= 3) {
            const fav = teamSpread < 0;
            notes.push(fav ? `${team} favored by ${Math.abs(teamSpread)} — leans on the ground late` : `${team} are ${Math.abs(teamSpread)}-pt underdogs — expect more passing`);
          }
          out.push({
            id: `${g.id}-${p.espnId}-${m.market}`, espnId: p.espnId, player: p.name, pos: p.pos, team, opp, home: side === "home",
            gameId: g.id, kickoff: g.kickoff, market: m.market, line,
            source: real ? "draftkings" : "model", openLine: real?.openLine, updated: real?.updated,
            proj: Math.round(proj * 10) / 10, seasonAvg: Math.round(avg * 10) / 10, factor: Math.round(factor * 100) / 100,
            prob, baseProb, over, edge, grade: gradeFromEdge(edge), gp: p.gp, notes,
          });
        }
      }
    }
  }
  return out.sort((a, b) => b.edge - a.edge);
}
