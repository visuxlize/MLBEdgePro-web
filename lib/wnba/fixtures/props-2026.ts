import type { WnbaPlayerProp } from "../types";

/**
 * Placeholder prop-projection fixture standing in for a real odds/props call.
 * Players, teams, and espnId are real (verified against ESPN's live 2026
 * roster data) — the line/model/edge/odds numbers are placeholders until
 * SportsBlaze is wired in behind lib/wnba/sportsblaze.ts.
 */
export const RAW_PROPS: WnbaPlayerProp[] = [
  { id: "1",  espnId: "4433403", player: "Caitlin Clark",    pos: "PG", team: "IND", matchup: "vs CHI", market: "Assists",         line: 8.5,  model: 9.8,  edge: 79, grade: "A",  odds: "-110", over: true },
  { id: "2",  espnId: "3149391", player: "A'ja Wilson",      pos: "PF", team: "LV",  matchup: "vs MIN", market: "Points",          line: 23.5, model: 27.1, edge: 78, grade: "A",  odds: "-115", over: true },
  { id: "3",  espnId: "3917450", player: "Napheesa Collier", pos: "PF", team: "MIN", matchup: "@ LV",   market: "Rebounds",        line: 8.5,  model: 10.4, edge: 74, grade: "A",  odds: "-108", over: true },
  { id: "4",  espnId: "2998928", player: "Breanna Stewart",  pos: "PF", team: "NY",  matchup: "vs CON", market: "Points",          line: 20.5, model: 23.8, edge: 73, grade: "B+", odds: "-112", over: true },
  { id: "5",  espnId: "4433402", player: "Angel Reese",      pos: "PF", team: "ATL", matchup: "@ WSH",  market: "Rebounds",        line: 11.5, model: 9.6,  edge: 70, grade: "B+", odds: "-105", over: false },
  { id: "6",  espnId: "4433730", player: "Paige Bueckers",   pos: "PG", team: "DAL", matchup: "vs PHX", market: "Points",          line: 18.5, model: 21.6, edge: 71, grade: "B+", odds: "-110", over: true },
  { id: "7",  espnId: "2998938", player: "Kahleah Copper",   pos: "SG", team: "PHX", matchup: "@ DAL",  market: "3-Pointers Made", line: 2.5,  model: 3.2,  edge: 67, grade: "B+", odds: "-110", over: true },
  { id: "8",  espnId: "4066533", player: "Sabrina Ionescu",  pos: "PG", team: "NY",  matchup: "vs CON", market: "3-Pointers Made", line: 3.5,  model: 4.1,  edge: 68, grade: "B+", odds: "-112", over: true },
  { id: "9",  espnId: "3065570", player: "Kelsey Plum",      pos: "PG", team: "LA",  matchup: "vs SEA", market: "Assists",         line: 5.5,  model: 6.7,  edge: 65, grade: "B",  odds: "-110", over: true },
  { id: "10", espnId: "3904576", player: "Marina Mabrey",    pos: "SG", team: "TOR", matchup: "@ CHI",  market: "Assists",         line: 4.5,  model: 5.5,  edge: 64, grade: "B",  odds: "-108", over: true },
  { id: "11", espnId: "2999101", player: "Jonquel Jones",    pos: "C",  team: "NY",  matchup: "vs CON", market: "Rebounds",        line: 7.5,  model: 6.1,  edge: 60, grade: "B",  odds: "+105", over: false },
  { id: "12", espnId: "4433524", player: "Sonia Citron",     pos: "SG", team: "WSH", matchup: "vs ATL", market: "Points",          line: 11.5, model: 13.8, edge: 61, grade: "B",  odds: "-110", over: true },
];
