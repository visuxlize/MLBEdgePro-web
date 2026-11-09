"use client";

import { useSyncExternalStore } from "react";
import type { PropItem } from "@/lib/picks/types";
import { jointProb } from "@/lib/picks/correlation";

/**
 * One shared prop slip for the whole app (NBA · NFL · Soccer).
 * Legs are stored as full snapshots so the slip survives navigation, reloads and
 * works from any page — not just the page the prop was added on.
 */
const KEY = "edgepro:slip:v2";
const MAX_LEGS = 12;
const MAX_AGE = 1000 * 60 * 60 * 40; // props expire quickly — drop legs older than ~40h

export interface SlipLegRecord { item: PropItem; addedAt: number }

const EMPTY: SlipLegRecord[] = [];
let legs: SlipLegRecord[] = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(legs)); } catch { /* storage blocked */ }
}
function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SlipLegRecord[];
      const fresh = parsed.filter((l) => l?.item?.id && Date.now() - l.addedAt < MAX_AGE);
      legs = fresh.length ? fresh : EMPTY;
    }
  } catch { /* corrupted — start clean */ }
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    try { legs = e.newValue ? (JSON.parse(e.newValue) as SlipLegRecord[]) : EMPTY; } catch { legs = EMPTY; }
    emit();
  });
}
function emit() { listeners.forEach((l) => l()); }
function set(next: SlipLegRecord[]) { legs = next.length ? next : EMPTY; persist(); emit(); }

function subscribe(cb: () => void) { hydrate(); listeners.add(cb); return () => { listeners.delete(cb); }; }
const getSnapshot = () => { hydrate(); return legs; };
const getServerSnapshot = () => EMPTY;

export const slip = {
  has: (id: string) => legs.some((l) => l.item.id === id),
  add(item: PropItem) {
    hydrate();
    if (legs.some((l) => l.item.id === item.id)) return true;
    if (legs.length >= MAX_LEGS) return false;
    set([...legs, { item, addedAt: Date.now() }]);
    return true;
  },
  remove: (id: string) => set(legs.filter((l) => l.item.id !== id)),
  toggle(item: PropItem) { return slip.has(item.id) ? (slip.remove(item.id), false) : slip.add(item); },
  clear: () => set([]),
  /** Add several legs at once (parlay "add all"). Returns how many were added. */
  addMany(items: PropItem[]) {
    hydrate();
    const fresh = items.filter((i) => !legs.some((l) => l.item.id === i.id)).slice(0, Math.max(0, MAX_LEGS - legs.length));
    if (fresh.length) set([...legs, ...fresh.map((item) => ({ item, addedAt: Date.now() }))]);
    return fresh.length;
  },
  replace: (items: PropItem[]) => set(items.slice(0, MAX_LEGS).map((item) => ({ item, addedAt: Date.now() }))),
  MAX_LEGS,
};

export function useSlip() {
  const records = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { legs: records.map((r) => r.item), ids: new Set(records.map((r) => r.item.id)), count: records.length };
}

/* ── Math ── */

export const toDecimal = (american: number) => (american > 0 ? american / 100 + 1 : 100 / -american + 1);
export const fmtAmerican = (p: number) => (p > 0 ? `+${p}` : String(p));
/** Fair American price for a probability (0–100). */
export function fairAmerican(probPct: number) {
  const p = Math.min(0.995, Math.max(0.005, probPct / 100));
  return Math.round(p >= 0.5 ? (-100 * p) / (1 - p) : (100 * (1 - p)) / p);
}

export interface SlipMath {
  combined: number;            // 0–100
  fair: number;                // American
  fairDecimal: number;
  bookDecimal: number | null;  // only when every leg has a real, side-specific price (soccer)
  sameGame: { label: string; n: number }[];
  /** average pairwise correlation of same-game legs (0 when none) */
  avgCorr: number;
  weakest?: PropItem;
}
export function slipMath(items: PropItem[]): SlipMath {
  const joint = jointProb(items);
  const combined = items.length ? joint.p : 0;
  const byGame = new Map<string, { label: string; n: number }>();
  items.forEach((p) => byGame.set(p.gameId, { label: p.gameLabel, n: (byGame.get(p.gameId)?.n ?? 0) + 1 }));
  const bookReady = items.length > 0 && items.every((p) => p.kind === "market" && p.price != null);
  return {
    combined,
    fair: items.length ? fairAmerican(combined) : 0,
    fairDecimal: combined > 0 ? 100 / combined : 0,
    bookDecimal: bookReady ? items.reduce((a, p) => a * toDecimal(p.price!), 1) : null,
    sameGame: [...byGame.values()].filter((g) => g.n > 1),
    avgCorr: joint.avgCorr,
    weakest: items.length > 1 ? [...items].sort((a, b) => a.prob - b.prob)[0] : undefined,
  };
}
