import type { WnbaEdgeFactor, WnbaGame, WnbaH2HStat } from "./types";

/**
 * Placeholder head-to-head stats, edge factors, and AI narrative for the game
 * deep-dive screen — basketball-flavored version of lib/nfl/deep-dive.ts.
 * Swap for real per-team/per-game stats once a real stats provider is wired in.
 */
export function wnbaH2H(game: WnbaGame): WnbaH2HStat[] {
  return [
    { label: "Offensive Rating", awayVal: "104.2", homeVal: "108.6", awayPct: 64, homePct: 78 },
    { label: "Pace",             awayVal: "82.1",  homeVal: "85.4",  awayPct: 60, homePct: 72 },
    { label: "Rebound Margin",   awayVal: "+1.4",  homeVal: "+4.8",  awayPct: 56, homePct: 76 },
    { label: "Bench Scoring",    awayVal: "18.2",  homeVal: "24.6",  awayPct: 50, homePct: 74 },
  ];
}

export function wnbaEdgeFactors(game: WnbaGame): WnbaEdgeFactor[] {
  const favHome = game.homeWinProb >= 50;
  return [
    { label: "Rebounding margin lean", value: `+${game.home}`,               pct: 72, color: "#34d399" },
    { label: "Star-player usage edge", value: favHome ? game.home : game.away, pct: 66, color: "#34d399" },
    { label: "Bench depth",            value: `+${game.away}`,               pct: 44, color: "#fb923c" },
    { label: "Rest advantage",         value: `${game.home} B2B-free`,        pct: 78, color: "#34d399" },
  ];
}

export function wnbaNarrative(game: WnbaGame): { text: string; tags: string[] } {
  const fav = game.homeWinProb >= 50 ? game.home : game.away;
  return {
    text: `The model gives ${game.home} a ${game.homeWinProb}% win probability, driven by a rebounding-margin edge and a clear advantage in bench scoring depth. ${game.away} can hang around behind perimeter shooting, but ${game.home}'s pace and rest edge tilt the closing number. Best value sits on ${fav} and the correlated player props below.`,
    tags: ["Pace model", "Rebounding margin", "Usage-adjusted"],
  };
}

/** Smoothed win-probability path — real ESPN series when available, else a plausible synthesized one. */
export function wnbaWinProbPath(homeWinProb: number, series: number[], seed: string): { line: string; area: string } {
  let pts: { x: number; y: number }[];
  if (series.length >= 2) {
    pts = series.map((v, i) => ({ x: (i / (series.length - 1)) * 320, y: 120 - (v / 100) * 120 }));
  } else {
    let seedNum = 0;
    for (let i = 0; i < seed.length; i++) seedNum = (seedNum * 31 + seed.charCodeAt(i)) | 0;
    let v = 50;
    pts = [];
    for (let i = 0; i <= 10; i++) {
      v += (homeWinProb - v) * 0.18 + Math.sin(i * 1.7 + seedNum) * 6;
      v = Math.max(12, Math.min(88, v));
      pts.push({ x: (i / 10) * 320, y: Math.max(6, Math.min(114, 120 - (v / 100) * 120)) });
    }
    pts[pts.length - 1].y = 120 - (homeWinProb / 100) * 120;
  }
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `M0 120 ${pts.map((p) => `L${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")} L320 120 Z`;
  return { line, area };
}
