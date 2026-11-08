/** Static NBA team map (ESPN abbreviations). Hex values are tuned to stay legible on the dark Spotlight surfaces. */

export interface NbaTeamInfo {
  name: string;
  hex: string;
  conf: "East" | "West";
  division: string;
}

export const NBA_TEAMS: Record<string, NbaTeamInfo> = {
  ATL:  { name: "Atlanta Hawks",          hex: "#E03A3E", conf: "East", division: "Southeast" },
  BOS:  { name: "Boston Celtics",         hex: "#16A05B", conf: "East", division: "Atlantic" },
  BKN:  { name: "Brooklyn Nets",          hex: "#9CA3AF", conf: "East", division: "Atlantic" },
  CHA:  { name: "Charlotte Hornets",      hex: "#1FB5C9", conf: "East", division: "Southeast" },
  CHI:  { name: "Chicago Bulls",          hex: "#CE1141", conf: "East", division: "Central" },
  CLE:  { name: "Cleveland Cavaliers",    hex: "#B3274F", conf: "East", division: "Central" },
  DAL:  { name: "Dallas Mavericks",       hex: "#2F7FD1", conf: "West", division: "Southwest" },
  DEN:  { name: "Denver Nuggets",         hex: "#FEC524", conf: "West", division: "Northwest" },
  DET:  { name: "Detroit Pistons",        hex: "#E0364A", conf: "East", division: "Central" },
  GS:   { name: "Golden State Warriors",  hex: "#FFC72C", conf: "West", division: "Pacific" },
  HOU:  { name: "Houston Rockets",        hex: "#CE1141", conf: "West", division: "Southwest" },
  IND:  { name: "Indiana Pacers",         hex: "#FDBB30", conf: "East", division: "Central" },
  LAC:  { name: "LA Clippers",            hex: "#3B82C4", conf: "West", division: "Pacific" },
  LAL:  { name: "Los Angeles Lakers",     hex: "#A87CF0", conf: "West", division: "Pacific" },
  MEM:  { name: "Memphis Grizzlies",      hex: "#7C95C9", conf: "West", division: "Southwest" },
  MIA:  { name: "Miami Heat",             hex: "#D6264F", conf: "East", division: "Southeast" },
  MIL:  { name: "Milwaukee Bucks",        hex: "#2E9B5C", conf: "East", division: "Central" },
  MIN:  { name: "Minnesota Timberwolves", hex: "#4FA3E0", conf: "West", division: "Northwest" },
  NO:   { name: "New Orleans Pelicans",   hex: "#C8A15B", conf: "West", division: "Southwest" },
  NY:   { name: "New York Knicks",        hex: "#2E86DE", conf: "East", division: "Atlantic" },
  OKC:  { name: "Oklahoma City Thunder",  hex: "#2D9CDB", conf: "West", division: "Northwest" },
  ORL:  { name: "Orlando Magic",          hex: "#2A8FD6", conf: "East", division: "Southeast" },
  PHI:  { name: "Philadelphia 76ers",     hex: "#2F7FD1", conf: "East", division: "Atlantic" },
  PHX:  { name: "Phoenix Suns",           hex: "#F07B2A", conf: "West", division: "Pacific" },
  POR:  { name: "Portland Trail Blazers", hex: "#E5484D", conf: "West", division: "Northwest" },
  SAC:  { name: "Sacramento Kings",       hex: "#8E5BD0", conf: "West", division: "Pacific" },
  SA:   { name: "San Antonio Spurs",      hex: "#C4CED4", conf: "West", division: "Southwest" },
  TOR:  { name: "Toronto Raptors",        hex: "#E5484D", conf: "East", division: "Atlantic" },
  UTAH: { name: "Utah Jazz",              hex: "#F9A01B", conf: "West", division: "Northwest" },
  WSH:  { name: "Washington Wizards",     hex: "#E0414F", conf: "East", division: "Southeast" },
};

export function nbaTeamHex(abbr: string): string {
  return NBA_TEAMS[abbr]?.hex ?? "#a78bfa";
}
export function nbaTeamName(abbr: string): string {
  return NBA_TEAMS[abbr]?.name ?? abbr;
}
export function nbaShortName(abbr: string): string {
  const n = NBA_TEAMS[abbr]?.name ?? abbr;
  return n.split(" ").slice(-1)[0];
}
export function nbaLogoUrl(abbr: string): string {
  return `https://a.espncdn.com/i/teamlogos/nba/500/${abbr.toLowerCase()}.png`;
}
export function nbaHeadshotUrl(espnId: string): string {
  return `https://a.espncdn.com/i/headshots/nba/players/full/${espnId}.png`;
}
