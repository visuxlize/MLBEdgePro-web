import type { WnbaImpactStat } from "./types";

/**
 * Placeholder advanced-stat fixture for the Pro-only Player Impact Deep Dive —
 * the WNBA answer to MLB's HR Deep Dive. Swap for a real stats-provider call
 * (usage%, true shooting%, plus-minus, shot-zone splits) later; callers don't
 * need to change since this is already async/provider-shaped.
 */
const RAW_IMPACT: WnbaImpactStat[] = [
  { espnId: "3149391", player: "A'ja Wilson",      pos: "PF", team: "LV",  usageRate: 31.2, trueShooting: 61.4, plusMinus: 9.8,  grade: "A+", zones: [{ zone: "Paint", pct: 58 }, { zone: "Mid-range", pct: 24 }, { zone: "3PT", pct: 18 }] },
  { espnId: "3917450", player: "Napheesa Collier", pos: "PF", team: "MIN", usageRate: 28.6, trueShooting: 59.1, plusMinus: 8.2,  grade: "A",  zones: [{ zone: "Paint", pct: 52 }, { zone: "Mid-range", pct: 28 }, { zone: "3PT", pct: 20 }] },
  { espnId: "4433403", player: "Caitlin Clark",    pos: "PG", team: "IND", usageRate: 27.4, trueShooting: 56.8, plusMinus: 6.4,  grade: "A",  zones: [{ zone: "Paint", pct: 30 }, { zone: "Mid-range", pct: 26 }, { zone: "3PT", pct: 44 }] },
  { espnId: "2998928", player: "Breanna Stewart",  pos: "PF", team: "NY",  usageRate: 27.1, trueShooting: 58.3, plusMinus: 7.1,  grade: "A",  zones: [{ zone: "Paint", pct: 46 }, { zone: "Mid-range", pct: 30 }, { zone: "3PT", pct: 24 }] },
  { espnId: "3904577", player: "Arike Ogunbowale", pos: "SG", team: "DAL", usageRate: 29.5, trueShooting: 54.2, plusMinus: 3.6,  grade: "B+", zones: [{ zone: "Paint", pct: 32 }, { zone: "Mid-range", pct: 34 }, { zone: "3PT", pct: 34 }] },
  { espnId: "4433402", player: "Angel Reese",      pos: "PF", team: "ATL", usageRate: 24.8, trueShooting: 51.6, plusMinus: 1.2,  grade: "B",  zones: [{ zone: "Paint", pct: 66 }, { zone: "Mid-range", pct: 22 }, { zone: "3PT", pct: 12 }] },
  { espnId: "2998938", player: "Kahleah Copper",   pos: "SG", team: "PHX", usageRate: 25.3, trueShooting: 55.7, plusMinus: 2.4,  grade: "B+", zones: [{ zone: "Paint", pct: 36 }, { zone: "Mid-range", pct: 30 }, { zone: "3PT", pct: 34 }] },
  { espnId: "1068",    player: "Nneka Ogwumike",   pos: "PF", team: "LA",  usageRate: 22.6, trueShooting: 57.9, plusMinus: -0.8, grade: "B",  zones: [{ zone: "Paint", pct: 54 }, { zone: "Mid-range", pct: 32 }, { zone: "3PT", pct: 14 }] },
];

export async function getImpactStats(): Promise<WnbaImpactStat[]> {
  return RAW_IMPACT;
}
