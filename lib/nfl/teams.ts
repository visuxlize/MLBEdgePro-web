/**
 * Static NFL team map — mirrors the TEAM_COLORS/TEAM_ABBR convention in lib/mlb/api.ts.
 * Hex values pulled directly from ESPN's /teams endpoint (team.color) for accuracy.
 */

export interface NflTeamInfo {
  name: string;
  hex: string;
}

export const NFL_TEAMS: Record<string, NflTeamInfo> = {
  ARI: { name: "Arizona Cardinals",     hex: "#A40227" },
  ATL: { name: "Atlanta Falcons",       hex: "#A71930" },
  BAL: { name: "Baltimore Ravens",      hex: "#29126F" },
  BUF: { name: "Buffalo Bills",         hex: "#00338D" },
  CAR: { name: "Carolina Panthers",     hex: "#0085CA" },
  CHI: { name: "Chicago Bears",         hex: "#0B1C3A" },
  CIN: { name: "Cincinnati Bengals",    hex: "#FB4F14" },
  CLE: { name: "Cleveland Browns",      hex: "#472A08" },
  DAL: { name: "Dallas Cowboys",        hex: "#002A5C" },
  DEN: { name: "Denver Broncos",        hex: "#0A2343" },
  DET: { name: "Detroit Lions",         hex: "#0076B6" },
  GB:  { name: "Green Bay Packers",     hex: "#204E32" },
  HOU: { name: "Houston Texans",        hex: "#00143F" },
  IND: { name: "Indianapolis Colts",    hex: "#003B75" },
  JAX: { name: "Jacksonville Jaguars",  hex: "#007487" },
  KC:  { name: "Kansas City Chiefs",    hex: "#E31837" },
  LV:  { name: "Las Vegas Raiders",     hex: "#000000" },
  LAC: { name: "Los Angeles Chargers",  hex: "#0080C6" },
  LAR: { name: "Los Angeles Rams",      hex: "#003594" },
  MIA: { name: "Miami Dolphins",        hex: "#008E97" },
  MIN: { name: "Minnesota Vikings",     hex: "#4F2683" },
  NE:  { name: "New England Patriots",  hex: "#002A5C" },
  NO:  { name: "New Orleans Saints",    hex: "#D3BC8D" },
  NYG: { name: "New York Giants",       hex: "#003C7F" },
  NYJ: { name: "New York Jets",         hex: "#115740" },
  PHI: { name: "Philadelphia Eagles",   hex: "#06424D" },
  PIT: { name: "Pittsburgh Steelers",   hex: "#000000" },
  SF:  { name: "San Francisco 49ers",   hex: "#AA0000" },
  SEA: { name: "Seattle Seahawks",      hex: "#002A5C" },
  TB:  { name: "Tampa Bay Buccaneers",  hex: "#BD1C36" },
  TEN: { name: "Tennessee Titans",      hex: "#4495D2" },
  WSH: { name: "Washington Commanders", hex: "#5A1414" },
};

export function nflTeamHex(abbr: string): string {
  return NFL_TEAMS[abbr]?.hex ?? "#7c5cfa";
}

export function nflTeamName(abbr: string): string {
  return NFL_TEAMS[abbr]?.name ?? abbr;
}

export function nflLogoUrl(abbr: string): string {
  return `https://a.espncdn.com/i/teamlogos/nfl/500-dark/${abbr.toLowerCase()}.png`;
}
