import type { NflPlayerProp } from "../types";

export const RAW_PROPS: NflPlayerProp[] = [
  // WSH vs CLE — Aug 11
  { id: "1",  player: "J. Daniels",      pos: "QB", team: "WSH", matchup: "vs CLE", market: "Passing Yards",   line: 92.5,  model: 118,  edge: 79, grade: "A",  odds: "-110", over: true,  week: "HOF_PRE1", gameDate: "Aug 11" },
  // JAX vs PIT — Aug 12
  { id: "2",  player: "B. Thomas Jr.",   pos: "WR", team: "JAX", matchup: "vs PIT", market: "Receptions",      line: 2.5,   model: 3.4,  edge: 77, grade: "A",  odds: "-115", over: true,  week: "HOF_PRE1", gameDate: "Aug 12" },
  { id: "5",  player: "D. Metcalf",      pos: "WR", team: "PIT", matchup: "@ JAX",  market: "Receiving Yards", line: 28.5,  model: 22,   edge: 71, grade: "B+", odds: "-105", over: false, week: "HOF_PRE1", gameDate: "Aug 12" },
  { id: "12", player: "T. Lawrence",     pos: "QB", team: "JAX", matchup: "vs PIT", market: "Passing Yards",   line: 108.5, model: 126,  edge: 61, grade: "B",  odds: "-112", over: true,  week: "HOF_PRE1", gameDate: "Aug 12" },
  // DET vs LAC — Aug 13
  { id: "3",  player: "J. Herbert",      pos: "QB", team: "LAC", matchup: "@ DET",  market: "Passing Yards",   line: 125.5, model: 148,  edge: 74, grade: "A",  odds: "-108", over: true,  week: "HOF_PRE1", gameDate: "Aug 13" },
  { id: "6",  player: "J. Gibbs",        pos: "RB", team: "DET", matchup: "vs LAC", market: "Rushing Yards",   line: 32.5,  model: 41,   edge: 68, grade: "B+", odds: "-118", over: true,  week: "HOF_PRE1", gameDate: "Aug 13" },
  { id: "8",  player: "S. LaPorta",      pos: "TE", team: "DET", matchup: "vs LAC", market: "Anytime TD",      line: 0.5,   model: 0.34, edge: 58, grade: "B",  odds: "+230", over: true,  week: "HOF_PRE1", gameDate: "Aug 13" },
  { id: "9",  player: "J. Gibbs",        pos: "RB", team: "DET", matchup: "vs LAC", market: "Receptions",      line: 3.5,   model: 4.2,  edge: 62, grade: "B",  odds: "-120", over: true,  week: "HOF_PRE1", gameDate: "Aug 13" },
  { id: "10", player: "A. St. Brown",    pos: "WR", team: "DET", matchup: "vs LAC", market: "Receiving Yards", line: 46.5,  model: 55,   edge: 65, grade: "B+", odds: "-110", over: true,  week: "HOF_PRE1", gameDate: "Aug 13" },
  // NYG vs NYJ — Aug 14
  { id: "4",  player: "M. Nabers",       pos: "WR", team: "NYG", matchup: "vs NYJ", market: "Receiving Yards", line: 34.5,  model: 43,   edge: 73, grade: "B+", odds: "-112", over: true,  week: "HOF_PRE1", gameDate: "Aug 14" },
  // CHI vs KC — Aug 15
  { id: "7",  player: "C. Williams",     pos: "QB", team: "CHI", matchup: "vs KC",  market: "Passing Yards",   line: 88.5,  model: 104,  edge: 66, grade: "B+", odds: "-110", over: true,  week: "HOF_PRE1", gameDate: "Aug 15" },
  { id: "11", player: "T. Kelce",        pos: "TE", team: "KC",  matchup: "@ CHI",  market: "Receiving Yards", line: 24.5,  model: 19,   edge: 57, grade: "B",  odds: "-105", over: false, week: "HOF_PRE1", gameDate: "Aug 15" },
];
