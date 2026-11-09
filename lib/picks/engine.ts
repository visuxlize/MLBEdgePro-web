import { jointProb, pairCorr } from "./correlation";
import type { PropItem } from "./types";

export type Tier = "strong" | "good" | "lean";
export const TIER_LABEL: Record<Tier, string> = { strong: "Strong play", good: "Good play", lean: "Lean" };

export interface Single { item: PropItem; tier: Tier; score: number }
export interface Parlay {
  id: string;
  kind: "sgp" | "multi";
  tag: "Safe" | "Balanced" | "Value" | "Longshot";
  title: string;
  subtitle: string;
  legs: PropItem[];
  /** correlation-adjusted chance all legs hit, 0–100 */
  joint: number;
  avgCorr: number;
  fair: number;
  fairDecimal: number;
  notes: string[];
  sports: string[];
}

const isGame = (p: PropItem) => p.scope === "game";

/** A posted line far from the player's season average usually means an injury / role change or a mismatched market — not value. */
export function suspectLine(p: PropItem): boolean {
  if (p.scope === "game" || p.kind !== "model" || p.lineSource !== "draftkings" || p.line == null || p.seasonAvg == null) return false;
  const d = Math.abs(p.seasonAvg - p.line);
  return d >= 2.5 && d / Math.max(1, p.line) > 0.45;
}

/** null = not a recommendation. Whole-game edges are small by construction (model blended with the market). */
export function tierOf(p: PropItem): Tier | null {
  if (p.kind !== "model") return null; // soccer player markets have no model behind them
  if (suspectLine(p)) return null;
  if (isGame(p)) return p.edge >= 5 ? "strong" : p.edge >= 3 ? "good" : p.edge >= 1.5 ? "lean" : null;
  const real = p.lineSource === "draftkings";
  const gp = Number(p.stats.find((s) => s.label === "Games")?.value ?? 10);
  if (real && gp >= 6 && p.edge >= 14 && p.prob >= 66) return "strong";
  if (p.edge >= (real ? 9 : 12) && p.prob >= 60) return "good";
  if (p.edge >= (real ? 5 : 9)) return "lean";
  return null;
}

/** Ranking score: normalises props and game bets onto one scale. */
export function scoreOf(p: PropItem): number {
  const real = p.lineSource === "draftkings" ? 3 : 0;
  return isGame(p) ? p.edge * 3.2 + p.prob * 0.1 + real : p.edge + p.prob * 0.1 + real;
}

export function fairAmerican(probPct: number) {
  const p = Math.min(0.995, Math.max(0.005, probPct / 100));
  return Math.round(p >= 0.5 ? (-100 * p) / (1 - p) : (100 * (1 - p)) / p);
}

/** Two legs that can't both be sensible in one slip. */
function conflict(a: PropItem, b: PropItem) {
  if (a.id === b.id) return true;
  if (a.gameId !== b.gameId) return false;
  if (!isGame(a) && !isGame(b) && a.athleteId === b.athleteId && a.marketKey === b.marketKey) return true;
  const result = (p: PropItem) => p.marketKey === "Spread" || p.marketKey === "Moneyline" || p.marketKey === "Match Result";
  if (result(a) && result(b)) return true; // spread + ML on one game are the same bet twice
  const total = (p: PropItem) => p.marketKey === "Total" || p.marketKey === "Total Goals";
  if (total(a) && total(b)) return true;
  return false;
}

function describe(legs: PropItem[], pairs: ReturnType<typeof jointProb>["pairs"]): string[] {
  const notes: string[] = [];
  const top = [...pairs].sort((x, y) => Math.abs(y.rho) - Math.abs(x.rho))[0];
  if (top && Math.abs(top.rho) >= 0.12) {
    notes.push(top.rho > 0
      ? `${top.a.player} ${top.a.pick} and ${top.b.player} ${top.b.pick} tend to hit together, so the combined chance is a little higher than multiplying them.`
      : `${top.a.player} ${top.a.pick} and ${top.b.player} ${top.b.pick} pull against each other, so the combined chance is a little lower than multiplying them.`);
  }
  const weakest = [...legs].sort((a, b) => a.prob - b.prob)[0];
  if (legs.length > 1) notes.push(`Weakest leg: ${weakest.player} ${weakest.pick} at ${weakest.prob}%.`);
  return notes;
}

function mkParlay(kind: Parlay["kind"], tag: Parlay["tag"], title: string, subtitle: string, legs: PropItem[], extraNote?: string): Parlay {
  const j = jointProb(legs);
  return {
    id: `${kind}:${legs.map((l) => l.id).sort().join("|")}`, kind, tag, title, subtitle, legs, joint: j.p, avgCorr: j.avgCorr,
    fair: fairAmerican(j.p), fairDecimal: j.p > 0 ? 100 / j.p : 0,
    notes: [...(extraNote ? [extraNote] : []), ...describe(legs, j.pairs)], sports: [...new Set(legs.map((l) => l.sport))],
  };
}

function combos<T>(arr: T[], k: number): T[][] {
  const out: T[][] = [];
  const go = (start: number, cur: T[]) => {
    if (cur.length === k) { out.push([...cur]); return; }
    for (let i = start; i < arr.length; i++) { cur.push(arr[i]); go(i + 1, cur); cur.pop(); }
  };
  go(0, []);
  return out;
}

const norm = (p: PropItem) => Math.min(1.6, p.edge / (isGame(p) ? 5 : 14));

export function buildPicks(items: PropItem[]) {
  const singlesAll: Single[] = items
    .map((item) => ({ item, tier: tierOf(item), score: scoreOf(item) }))
    .filter((s): s is Single => s.tier !== null)
    .sort((a, b) => b.score - a.score);

  // "Strong" has to mean something: only the top handful keep it, the rest read as "good".
  let strongSeen = 0;
  for (const s of singlesAll) if (s.tier === "strong" && ++strongSeen > 12) s.tier = "good";

  // At most two legs per player so one hot name doesn't fill the board.
  const perPlayer = new Map<string, number>();
  const singles = singlesAll.filter((s) => {
    const k = s.item.scope === "game" ? s.item.id : `${s.item.sport}:${s.item.athleteId}`;
    const n = (perPlayer.get(k) ?? 0) + 1;
    perPlayer.set(k, n);
    return n <= 2;
  });

  /* Same-game parlays */
  const byGame = new Map<string, Single[]>();
  singles.forEach((s) => byGame.set(s.item.gameId, [...(byGame.get(s.item.gameId) ?? []), s]));
  const sgps: Parlay[] = [];
  for (const [, list] of byGame) {
    const cand = list.slice(0, 7).map((s) => s.item);
    if (cand.length < 2) continue;
    const label = cand[0].gameLabel;
    for (const size of [2, 3] as const) {
      let best: { legs: PropItem[]; q: number } | null = null;
      for (const c of combos(cand, size)) {
        if (c.some((a, i) => c.slice(i + 1).some((b) => conflict(a, b) || pairCorr(a, b) < -0.12))) continue;
        const j = jointProb(c);
        if (j.p < (size === 2 ? 42 : 28)) continue;
        const q = (c.reduce((a, l) => a + norm(l), 0) / size) * (j.p / 100) * (1 + Math.max(0, j.avgCorr));
        if (!best || q > best.q) best = { legs: c, q };
      }
      if (best) sgps.push(mkParlay("sgp", size === 2 ? "Safe" : "Balanced", `${label}`, size === 2 ? "Same-game · 2 legs" : "Same-game · 3 legs", best.legs));
    }
  }
  sgps.sort((a, b) => b.joint * b.legs.length ** 0.5 - a.joint * a.legs.length ** 0.5);

  /* Multi-game parlays: one leg per game */
  const pickDistinct = (pool: Single[], n: number): PropItem[] => {
    const out: PropItem[] = [];
    for (const s of pool) {
      if (out.some((o) => o.gameId === s.item.gameId)) continue;
      out.push(s.item);
      if (out.length === n) break;
    }
    return out.length === n ? out : [];
  };
  const multis: Parlay[] = [];
  const add = (p: Parlay | null) => { if (p && !multis.some((m) => m.id === p.id)) multis.push(p); };
  const byProb = [...singles].filter((s) => s.item.prob >= 58).sort((a, b) => b.item.prob - a.item.prob || b.score - a.score);
  const banker = pickDistinct(byProb, 3);
  if (banker.length) add(mkParlay("multi", "Balanced", "The Banker", "3 legs · highest hit chances", banker));
  const value = pickDistinct(singles, 4);
  if (value.length) add(mkParlay("multi", "Value", "The Value Four", "4 legs · biggest edges", value));
  const moon = pickDistinct(singles, 6);
  if (moon.length) add(mkParlay("multi", "Longshot", "The Moonshot", "6 legs · long odds", moon));
  for (const sport of ["nba", "nfl", "soccer"] as const) {
    const pool = singles.filter((s) => s.item.sport === sport);
    const n = pickDistinct(pool, 3).length ? 3 : pickDistinct(pool, 2).length ? 2 : 0;
    if (n) add(mkParlay("multi", "Balanced", `${sport === "nba" ? "NBA" : sport === "nfl" ? "NFL" : "Soccer"} ${n}-leg`, `${n} legs · all ${sport === "soccer" ? "soccer" : sport.toUpperCase()}`, pickDistinct(pool, n)));
  }
  return { singles, sgps: sgps.slice(0, 8), multis };
}
