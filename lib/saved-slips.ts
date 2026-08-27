"use client";

export type SlipSport = "MLB" | "NFL" | "WNBA";

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
}

export interface SavedSlip {
  id: string;
  sport: SlipSport;
  savedAt: number;
  legs: SlipLeg[];
  combinedPayout: string;
  avgEdge: number;
  label?: string;
}

const KEY = "edge-saved-slips";

export function loadSavedSlips(): SavedSlip[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedSlip[];
  } catch {
    return [];
  }
}

export function saveSlip(slip: Omit<SavedSlip, "id" | "savedAt">): SavedSlip {
  const entry: SavedSlip = { ...slip, id: crypto.randomUUID(), savedAt: Date.now() };
  try {
    const existing = loadSavedSlips();
    localStorage.setItem(KEY, JSON.stringify([entry, ...existing].slice(0, 50)));
  } catch {
    // storage full or unavailable
  }
  return entry;
}

export function deleteSlip(id: string): void {
  try {
    const existing = loadSavedSlips().filter((s) => s.id !== id);
    localStorage.setItem(KEY, JSON.stringify(existing));
  } catch {}
}

export function clearSlips(sport?: SlipSport): void {
  try {
    const existing = sport ? loadSavedSlips().filter((s) => s.sport !== sport) : [];
    localStorage.setItem(KEY, JSON.stringify(existing));
  } catch {}
}

export function calcPayout(legCount: number): string {
  if (legCount === 0) return "—";
  return (Math.pow(1.72, legCount)).toFixed(2) + "x";
}
