import type { WnbaPlayerProp } from "../types";

/**
 * Placeholder prop-projection fixture standing in for a real odds/props call.
 * Modeled on the NFL fixture's shape (lib/nfl/fixtures/props-2026.ts). Swap the
 * body of getPlayerProps() in lib/wnba/sportsblaze.ts for a real API call later —
 * callers don't need to change.
 */
export const RAW_PROPS: WnbaPlayerProp[] = [
  { id: "1",  player: "Caitlin Clark",     pos: "PG", team: "IND", matchup: "vs CHI", market: "Assists",           line: 7.5,  model: 9.1,  edge: 79, grade: "A",  odds: "-110", over: true },
  { id: "2",  player: "A'ja Wilson",       pos: "PF", team: "LV",  matchup: "vs MIN", market: "Points",            line: 22.5, model: 26.4, edge: 77, grade: "A",  odds: "-115", over: true },
  { id: "3",  player: "Napheesa Collier",  pos: "PF", team: "MIN", matchup: "@ LV",   market: "Rebounds",          line: 8.5,  model: 10.2, edge: 74, grade: "A",  odds: "-108", over: true },
  { id: "4",  player: "Breanna Stewart",   pos: "PF", team: "NY",  matchup: "vs CON", market: "Points",            line: 19.5, model: 23,   edge: 73, grade: "B+", odds: "-112", over: true },
  { id: "5",  player: "Angel Reese",       pos: "PF", team: "CHI", matchup: "@ IND",  market: "Rebounds",          line: 11.5, model: 9.8,  edge: 71, grade: "B+", odds: "-105", over: false },
  { id: "6",  player: "Arike Ogunbowale",  pos: "SG", team: "DAL", matchup: "vs PHX", market: "Points",            line: 20.5, model: 24,   edge: 68, grade: "B+", odds: "-118", over: true },
  { id: "7",  player: "Kahleah Copper",    pos: "SG", team: "PHX", matchup: "@ DAL",  market: "3-Pointers Made",   line: 2.5,  model: 3.1,  edge: 66, grade: "B+", odds: "-110", over: true },
  { id: "8",  player: "Nneka Ogwumike",    pos: "PF", team: "SEA", matchup: "vs LA",  market: "Points",            line: 15.5, model: 12,   edge: 58, grade: "B",  odds: "+120", over: false },
  { id: "9",  player: "Cameron Brink",     pos: "PF", team: "LA",  matchup: "@ SEA",  market: "Rebounds",          line: 6.5,  model: 8.1,  edge: 62, grade: "B",  odds: "-120", over: true },
  { id: "10", player: "Marina Mabrey",     pos: "SG", team: "CON", matchup: "@ NY",   market: "Assists",           line: 4.5,  model: 5.6,  edge: 65, grade: "B+", odds: "-110", over: true },
  { id: "11", player: "Rhyne Howard",      pos: "SG", team: "ATL", matchup: "vs WSH", market: "3-Pointers Made",   line: 2.5,  model: 3.3,  edge: 61, grade: "B",  odds: "-105", over: true },
  { id: "12", player: "Brittney Sanders",  pos: "SF", team: "WSH", matchup: "@ ATL",  market: "Points",            line: 13.5, model: 16,   edge: 60, grade: "B",  odds: "-112", over: true },
];
