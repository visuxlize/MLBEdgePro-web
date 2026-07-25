/**
 * Static WNBA team map — mirrors the convention in lib/mlb/api.ts and lib/nfl/teams.ts.
 * Hex values pulled directly from ESPN's /teams endpoint (team.color) for accuracy.
 */

export interface WnbaTeamInfo {
  name: string;
  hex: string;
}

export const WNBA_TEAMS: Record<string, WnbaTeamInfo> = {
  ATL: { name: "Atlanta Dream",         hex: "#E31837" },
  CHI: { name: "Chicago Sky",           hex: "#5091CD" },
  CON: { name: "Connecticut Sun",       hex: "#F05023" },
  DAL: { name: "Dallas Wings",          hex: "#002B5C" },
  GS:  { name: "Golden State Valkyries", hex: "#B38FCF" },
  IND: { name: "Indiana Fever",         hex: "#002D62" },
  LV:  { name: "Las Vegas Aces",        hex: "#A7A8AA" },
  LA:  { name: "Los Angeles Sparks",    hex: "#552583" },
  MIN: { name: "Minnesota Lynx",        hex: "#266092" },
  NY:  { name: "New York Liberty",      hex: "#86CEBC" },
  PHX: { name: "Phoenix Mercury",       hex: "#3C286E" },
  POR: { name: "Portland Fire",         hex: "#CEE5EB" },
  SEA: { name: "Seattle Storm",         hex: "#2C5235" },
  TOR: { name: "Toronto Tempo",         hex: "#33476D" },
  WSH: { name: "Washington Mystics",    hex: "#E03A3E" },
};

export function wnbaTeamHex(abbr: string): string {
  return WNBA_TEAMS[abbr]?.hex ?? "#2dd4bf";
}

export function wnbaTeamName(abbr: string): string {
  return WNBA_TEAMS[abbr]?.name ?? abbr;
}

export function wnbaLogoUrl(abbr: string): string {
  return `https://a.espncdn.com/i/teamlogos/wnba/500-dark/${abbr.toLowerCase()}.png`;
}

export function wnbaHeadshotUrl(espnId: string): string {
  return `https://a.espncdn.com/i/headshots/wnba/players/full/${espnId}.png`;
}
