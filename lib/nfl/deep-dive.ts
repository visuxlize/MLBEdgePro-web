import type { NflEdgeFactor, NflGame, NflH2HStat, NflWinProbPoint } from "./types";

/**
 * Placeholder head-to-head stats, edge factors, and AI narrative for the game
 * deep-dive screen — ported from the prototype's inline `deepData()` math.
 * Swap for real per-team/per-game stats once nfl-data-py weekly stats are wired in.
 */
export function nflH2H(game: NflGame): NflH2HStat[] {
  return [
    { label: "Offense",        awayVal: "27.4", homeVal: "24.1", awayPct: 78, homePct: 66 },
    { label: "Defense",        awayVal: "20.8", homeVal: "19.2", awayPct: 64, homePct: 73 },
    { label: "Form L5",        awayVal: "3-2",  homeVal: "4-1",  awayPct: 60, homePct: 80 },
    { label: "Starter snaps",  awayVal: "42%",  homeVal: "55%",  awayPct: 52, homePct: 70 },
  ];
}

export function nflEdgeFactors(game: NflGame): NflEdgeFactor[] {
  const favHome = game.homeWinProb >= 50;
  return [
    { label: "Starter snap-share lean", value: `+12% ${game.home}`,              pct: 72, color: "#34d399" },
    { label: "QB depth edge",           value: favHome ? game.home : game.away,  pct: 64, color: "#34d399" },
    { label: "OL continuity",           value: `+8% ${game.away}`,               pct: 46, color: "#fb923c" },
    { label: "Coaching tendency",       value: `${game.home} 8-2 L10`,           pct: 80, color: "#34d399" },
  ];
}

export function nflNarrative(game: NflGame): { text: string; tags: string[] } {
  const fav = game.homeWinProb >= 50 ? game.home : game.away;
  return {
    text: `The model gives ${game.home} a ${game.homeWinProb}% win probability, driven by projected starter snap-share and a clear QB-room depth advantage. ${game.away} keeps it live through the air, but ${game.home}'s front seven and coaching continuity tilt the closing number. Best value sits on ${fav} and the correlated passing props below.`,
    tags: ["Snap-share model", "QB depth", "Weather-adjusted"],
  };
}

/** Smoothed win-probability path — real ESPN series when available, else a plausible synthesized one. */
export function nflWinProbPath(homeWinProb: number, series: number[], seed: string): { line: string; area: string; points: NflWinProbPoint[] } {
  let pts: NflWinProbPoint[];
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
  return { line, area, points: pts };
}
