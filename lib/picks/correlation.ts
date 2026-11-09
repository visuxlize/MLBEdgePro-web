import type { PropItem } from "./types";

/**
 * Rule-of-thumb correlation between two bet outcomes in the SAME game (−1…1).
 * Positive = they tend to win together. These are sensible priors, not fitted values — they exist so a parlay
 * isn't priced as if every leg were independent.
 */
export function pairCorr(a: PropItem, b: PropItem): number {
  if (a.gameId !== b.gameId) return 0;
  if (a.id === b.id) return 1;
  const A = a.scope === "game" ? "game" : "player";
  const B = b.scope === "game" ? "game" : "player";
  const dir = (p: PropItem) => (p.side === "under" ? -1 : 1); // volume direction for props / totals

  /* player ↔ player */
  if (A === "player" && B === "player") {
    const sign = dir(a) * dir(b);
    if (a.athleteId === b.athleteId) {
      const passing = (m: string) => m === "Pass Yds" || m === "Pass TDs";
      return sign * (passing(a.marketKey) && passing(b.marketKey) ? 0.5 : 0.22);
    }
    if (a.team === b.team) {
      const qb = (p: PropItem) => p.marketKey === "Pass Yds" || p.marketKey === "Pass TDs";
      const rec = (p: PropItem) => p.marketKey === "Rec Yds" || p.marketKey === "Receptions";
      const rush = (p: PropItem) => p.marketKey === "Rush Yds";
      if ((qb(a) && rec(b)) || (qb(b) && rec(a))) return sign * 0.4;
      if ((qb(a) && rush(b)) || (qb(b) && rush(a))) return sign * -0.18;
      if (a.sport === "nba") return sign * 0.05;
      return sign * 0.03;
    }
    return sign * 0.1; // opposing teams: shootout / pace
  }

  /* player ↔ game bet */
  if (A !== B) {
    const pl = A === "player" ? a : b;
    const g = A === "game" ? a : b;
    if (g.marketKey === "Total" || g.marketKey === "Total Goals") {
      const base = pl.sport === "nfl" && pl.marketKey === "Rush Yds" ? 0.05 : pl.sport === "soccer" ? 0.3 : 0.18;
      return base * dir(pl) * (g.side === "under" ? -1 : 1);
    }
    // team result (moneyline / spread / match result)
    if (g.side === "draw") return 0;
    const onPicked = pl.team === g.team;
    const base = pl.sport === "soccer" ? 0.32 : pl.sport === "nfl" ? (pl.marketKey === "Rush Yds" ? 0.3 : 0.1) : pl.marketKey === "Points" ? 0.15 : 0.08;
    return base * dir(pl) * (onPicked ? 1 : -0.6);
  }

  /* game ↔ game */
  const result = (p: PropItem) => p.marketKey === "Spread" || p.marketKey === "Moneyline" || p.marketKey === "Match Result";
  if (result(a) && result(b)) return a.team === b.team ? 0.85 : -0.85;
  if (result(a) !== result(b)) return 0.05;
  return 0;
}

export interface Joint { p: number; avgCorr: number; pairs: { a: PropItem; b: PropItem; rho: number }[] }

/** Chance every leg hits, adjusted for pairwise correlation. p is 0–100. Legs in different games are independent. */
export function jointProb(items: PropItem[]): Joint {
  const ps = items.map((i) => Math.min(0.985, Math.max(0.015, i.prob / 100)));
  let p = ps.reduce((a, x) => a * x, 1);
  const pairs: Joint["pairs"] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const rho = pairCorr(items[i], items[j]);
      if (!rho) continue;
      pairs.push({ a: items[i], b: items[j], rho });
      const ratio = 1 + rho * Math.sqrt(((1 - ps[i]) * (1 - ps[j])) / (ps[i] * ps[j]));
      p *= Math.min(2.2, Math.max(0.25, ratio));
    }
  }
  p = Math.min(p, ...ps);
  const avgCorr = pairs.length ? pairs.reduce((a, x) => a + x.rho, 0) / pairs.length : 0;
  return { p: p * 100, avgCorr, pairs };
}
