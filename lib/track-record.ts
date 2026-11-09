import type { SavedSlip, SlipLeg } from "@/lib/saved-slips";

const toDec = (american: number) => (american > 0 ? american / 100 + 1 : 100 / -american + 1);
export const parseAmerican = (s: string): number | undefined => {
  const n = parseInt(String(s).replace(/[^\d+-]/g, ""), 10);
  return Number.isFinite(n) && Math.abs(n) >= 100 ? n : undefined;
};

/** Decimal odds for one leg: real price when we have one, otherwise the model's fair price. */
function legDecimal(l: SlipLeg): number {
  if (l.kind === "market") { const a = parseAmerican(l.odds); if (a) return toDec(a); }
  const p = Math.min(0.97, Math.max(0.03, Number(l.prob ?? l.model) / 100 || 0.5));
  return 1 / p;
}

export interface SlipReturn { decimal: number; returned: number; profit: number; source: "your" | "book" | "fair" }

/** What the slip pays (or would pay) given its stake and how its legs settled. */
export function slipReturn(s: SavedSlip): SlipReturn | null {
  if (!s.stake || s.stake <= 0) return null;
  const live = s.legs.filter((l) => l.result !== "push" && l.result !== "void");
  const source = s.estSource ?? "fair";
  let decimal: number;
  if (s.estSource === "your" && s.estDecimal) decimal = s.estDecimal;          // user-entered odds are taken as-is
  else if (s.legs.some((l) => l.result === "push" || l.result === "void")) decimal = live.reduce((a, l) => a * legDecimal(l), 1); // pushed legs drop out
  else decimal = s.estDecimal ?? s.legs.reduce((a, l) => a * legDecimal(l), 1);
  const won = s.status === "won";
  const lost = s.status === "lost";
  const returned = won ? s.stake * decimal : lost ? 0 : s.status === "push" ? s.stake : s.stake * decimal;
  return { decimal, returned, profit: won ? returned - s.stake : lost ? -s.stake : 0, source };
}

export interface CalBucket { n: number; wins: number; pred: number; actual: number }
export interface TrackRecord {
  slips: { won: number; lost: number; push: number; pending: number };
  staked: number; profit: number; roi: number | null;
  legs: { n: number; wins: number; hit: number; pred: number };
  byKey: Record<string, CalBucket & { label: string }>;
  byGrade: { grade: string; n: number; hit: number; pred: number }[];
  /** profit uses estimated odds unless the user entered theirs */
  estimated: boolean;
}

const settledLegs = (s: SavedSlip) => s.legs.filter((l) => (l.result === "win" || l.result === "loss") && l.sport && l.prob != null);

export function computeRecord(slips: SavedSlip[]): TrackRecord {
  const rec: TrackRecord = { slips: { won: 0, lost: 0, push: 0, pending: 0 }, staked: 0, profit: 0, roi: null, legs: { n: 0, wins: 0, hit: 0, pred: 0 }, byKey: {}, byGrade: [], estimated: false };
  const grades = new Map<string, { n: number; w: number; pred: number }>();
  let predSum = 0;

  for (const s of slips) {
    if (s.status === "won") rec.slips.won++; else if (s.status === "lost") rec.slips.lost++; else if (s.status === "push") rec.slips.push++; else if (s.status === "pending") rec.slips.pending++;
    const r = slipReturn(s);
    if (r && (s.status === "won" || s.status === "lost" || s.status === "push")) {
      rec.staked += s.stake!; rec.profit += r.profit;
      if (r.source !== "your") rec.estimated = true;
    }
    for (const l of settledLegs(s)) {
      const win = l.result === "win";
      rec.legs.n++; if (win) rec.legs.wins++; predSum += l.prob!;
      const k = `${l.sport}:${l.marketKey}`;
      const b = rec.byKey[k] ?? { n: 0, wins: 0, pred: 0, actual: 0, label: `${l.sport!.toUpperCase()} · ${l.market}` };
      b.n++; if (win) b.wins++; b.pred += l.prob!; rec.byKey[k] = b;
      const g = grades.get(l.grade) ?? { n: 0, w: 0, pred: 0 };
      g.n++; if (win) g.w++; g.pred += l.prob!; grades.set(l.grade, g);
    }
  }
  rec.roi = rec.staked > 0 ? (rec.profit / rec.staked) * 100 : null;
  rec.legs.hit = rec.legs.n ? (rec.legs.wins / rec.legs.n) * 100 : 0;
  rec.legs.pred = rec.legs.n ? predSum / rec.legs.n : 0;
  for (const b of Object.values(rec.byKey)) { b.actual = (b.wins / b.n) * 100; b.pred = b.pred / b.n; }
  rec.byGrade = [...grades.entries()].map(([grade, g]) => ({ grade, n: g.n, hit: (g.w / g.n) * 100, pred: g.pred / g.n })).sort((a, b) => b.pred - a.pred);
  return rec;
}

/**
 * Personal calibration: nudge a model chance toward what actually happened for this sport + market.
 * Shrinks hard toward the model until there is a real sample (needs ≥8 settled legs).
 */
export function adjustProb(rec: TrackRecord, sport: string, marketKey: string, prob: number): { prob: number; n: number; applied: boolean } {
  const b = rec.byKey[`${sport}:${marketKey}`];
  if (!b || b.n < 8) return { prob, n: b?.n ?? 0, applied: false };
  const adj = prob + (b.actual - b.pred) * (b.n / (b.n + 25));
  return { prob: Math.min(97, Math.max(3, adj)), n: b.n, applied: Math.abs(adj - prob) >= 0.5 };
}
