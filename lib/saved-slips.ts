"use client";

import { useSyncExternalStore } from "react";

export type SlipSport = "MLB" | "NFL" | "NBA" | "WNBA" | "Soccer" | "Mixed";
export type LegResult = "win" | "loss" | "push" | "void";
export type SlipStatus = "pending" | "won" | "lost" | "push";

export interface SlipLeg {
  id: string;
  player: string;
  team: string;
  market: string;
  side: string;
  line: string | number;
  model: string | number;
  grade: string;
  odds: string;
  /* ── tracking fields (NBA · NFL · Soccer). Older / MLB slips don't have them. ── */
  sport?: "nba" | "nfl" | "soccer";
  /** "game" = spread / moneyline / total / match result (no player) */
  scope?: "game";
  /** Display text of the pick for game legs, e.g. "LAL -5.5" */
  pickText?: string;
  gameId?: string;
  gameLabel?: string;
  athleteId?: string;
  marketKey?: string;
  /** ESPN league slug — soccer only */
  league?: string;
  /** Soccer target, e.g. "2+" or "Yes" */
  target?: string;
  kind?: "model" | "market";
  /** Model hit chance (0–100) at save time — what the calibration learns from */
  prob?: number;
  result?: LegResult;
  actual?: number;
}

export interface SavedSlip {
  id: string;
  sport: SlipSport;
  savedAt: number;
  legs: SlipLeg[];
  combinedPayout: string;
  avgEdge: number;
  label?: string;
  stake?: number;
  /** Combined American odds the user actually got (optional override) */
  oddsAmerican?: number;
  /** Estimated combined decimal odds at save time, and where they came from */
  estDecimal?: number;
  estSource?: "your" | "book" | "fair";
  status?: SlipStatus;
  settledAt?: number;
  /** User forced the result by hand */
  manual?: boolean;
}

const KEY = "edge-saved-slips";
const EMPTY: SavedSlip[] = [];
let slips: SavedSlip[] = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function persist() { try { localStorage.setItem(KEY, JSON.stringify(slips)); } catch { /* storage full / blocked */ } }
function emit() { listeners.forEach((l) => l()); }
function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try { const raw = localStorage.getItem(KEY); if (raw) slips = (JSON.parse(raw) as SavedSlip[]) ?? EMPTY; } catch { /* corrupted */ }
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    try { slips = e.newValue ? (JSON.parse(e.newValue) as SavedSlip[]) : EMPTY; } catch { slips = EMPTY; }
    emit();
  });
}
function commit(next: SavedSlip[]) { slips = next.length ? next : EMPTY; persist(); emit(); }

/** Status derived from leg results. Loss beats pending: one dead leg kills a parlay. */
export function deriveStatus(legs: SlipLeg[]): SlipStatus | undefined {
  const tracked = legs.filter((l) => l.gameId && (l.athleteId || l.scope === "game"));
  if (!tracked.length) return undefined;
  if (tracked.some((l) => l.result === "loss")) return "lost";
  if (tracked.some((l) => !l.result)) return "pending";
  return tracked.every((l) => l.result === "push" || l.result === "void") ? "push" : "won";
}

function withStatus(s: SavedSlip): SavedSlip {
  if (s.manual) return s;
  const status = deriveStatus(s.legs);
  if (!status) return s;
  return { ...s, status, settledAt: status === "pending" ? undefined : s.settledAt ?? Date.now() };
}

export function loadSavedSlips(): SavedSlip[] { hydrate(); return slips; }

export function saveSlip(slip: Omit<SavedSlip, "id" | "savedAt">): SavedSlip {
  hydrate();
  const entry = withStatus({ ...slip, id: crypto.randomUUID(), savedAt: Date.now() });
  commit([entry, ...slips].slice(0, 100));
  return entry;
}

export function updateSlip(id: string, patch: Partial<SavedSlip>) {
  hydrate();
  commit(slips.map((s) => (s.id === id ? withStatus({ ...s, ...patch }) : s)));
}

export function updateLeg(slipId: string, legId: string, patch: Partial<SlipLeg>) {
  hydrate();
  commit(slips.map((s) => (s.id === slipId ? withStatus({ ...s, manual: false, legs: s.legs.map((l) => (l.id === legId ? { ...l, ...patch } : l)) }) : s)));
}

export function deleteLeg(slipId: string, legId: string) {
  hydrate();
  const target = slips.find((s) => s.id === slipId);
  if (!target) return;
  if (target.legs.length <= 1) return deleteSlip(slipId);
  commit(slips.map((s) => (s.id === slipId ? withStatus({ ...s, estDecimal: undefined, estSource: s.estSource === "your" ? "your" : undefined, legs: s.legs.filter((l) => l.id !== legId) }) : s)));
}

export function deleteSlip(id: string): void { hydrate(); commit(slips.filter((s) => s.id !== id)); }

export function clearSlips(sport?: SlipSport): void { hydrate(); commit(sport ? slips.filter((s) => s.sport !== sport) : []); }

/** Apply auto-settlement results coming back from the server. */
export function applyResults(results: { slipId: string; legId: string; result: LegResult; actual?: number }[]) {
  hydrate();
  if (!results.length) return;
  const by = new Map(results.map((r) => [`${r.slipId}:${r.legId}`, r]));
  commit(slips.map((s) => {
    if (!s.legs.some((l) => by.has(`${s.id}:${l.id}`))) return s;
    return withStatus({ ...s, legs: s.legs.map((l) => { const r = by.get(`${s.id}:${l.id}`); return r ? { ...l, result: r.result, actual: r.actual } : l; }) });
  }));
}

export function calcPayout(legCount: number): string {
  if (legCount === 0) return "—";
  return (Math.pow(1.72, legCount)).toFixed(2) + "x";
}

const subscribe = (cb: () => void) => { hydrate(); listeners.add(cb); return () => { listeners.delete(cb); }; };
const getSnapshot = () => { hydrate(); return slips; };
export function useSavedSlips(): SavedSlip[] { return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY); }
