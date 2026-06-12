import type { HostCity, WCTeam, BracketState, BracketMatch } from "./types";

// ── Host Cities ───────────────────────────────────────────────────────────────

export const HOST_CITIES: HostCity[] = [
  {
    id: "nyc", name: "New York/New Jersey", displayName: "New York",
    stadium: "MetLife Stadium", country: "USA",
    coordinates: [-74.0742, 40.8128], capacity: 82_500, matchCount: 8,
    timezone: "ET", isFinalVenue: true,
    weather: { tempF: 78, condition: "Partly Cloudy", humidity: 62, windMph: 12, icon: "⛅" },
    upcomingMatches: [
      { matchLabel: "Group C – Match 2", date: "Jun 14, 2026", teams: "TBD vs TBD" },
      { matchLabel: "Round of 32", date: "Jul 1, 2026", teams: "TBD vs TBD" },
      { matchLabel: "🏆 Final", date: "Jul 19, 2026", teams: "TBD vs TBD" },
    ],
  },
  {
    id: "lax", name: "Los Angeles", displayName: "Los Angeles",
    stadium: "SoFi Stadium", country: "USA",
    coordinates: [-118.3393, 33.9534], capacity: 70_240, matchCount: 7,
    timezone: "PT",
    weather: { tempF: 76, condition: "Sunny", humidity: 45, windMph: 8, icon: "☀️" },
    upcomingMatches: [
      { matchLabel: "Group A – Match 1", date: "Jun 12, 2026", teams: "TBD vs TBD" },
      { matchLabel: "Round of 32", date: "Jun 29, 2026", teams: "TBD vs TBD" },
    ],
  },
  {
    id: "sfo", name: "San Francisco Bay Area", displayName: "Bay Area",
    stadium: "Levi's Stadium", country: "USA",
    coordinates: [-121.9698, 37.4032], capacity: 68_500, matchCount: 6,
    timezone: "PT",
    weather: { tempF: 64, condition: "Foggy Morning", humidity: 72, windMph: 14, icon: "🌫️" },
    upcomingMatches: [
      { matchLabel: "Group B – Match 1", date: "Jun 13, 2026", teams: "TBD vs TBD" },
      { matchLabel: "Round of 16", date: "Jul 5, 2026", teams: "TBD vs TBD" },
    ],
  },
  {
    id: "sea", name: "Seattle", displayName: "Seattle",
    stadium: "Lumen Field", country: "USA",
    coordinates: [-122.3316, 47.5952], capacity: 69_000, matchCount: 6,
    timezone: "PT",
    weather: { tempF: 68, condition: "Partly Cloudy", humidity: 65, windMph: 10, icon: "⛅" },
    upcomingMatches: [
      { matchLabel: "Group D – Match 1", date: "Jun 15, 2026", teams: "TBD vs TBD" },
      { matchLabel: "Round of 32", date: "Jun 30, 2026", teams: "TBD vs TBD" },
    ],
  },
  {
    id: "dal", name: "Dallas", displayName: "Dallas",
    stadium: "AT&T Stadium", country: "USA",
    coordinates: [-97.0945, 32.7480], capacity: 80_000, matchCount: 6,
    timezone: "CT",
    weather: { tempF: 93, condition: "Hot & Sunny", humidity: 50, windMph: 16, icon: "🌞" },
    upcomingMatches: [
      { matchLabel: "Group E – Match 1", date: "Jun 16, 2026", teams: "TBD vs TBD" },
      { matchLabel: "Round of 16", date: "Jul 6, 2026", teams: "TBD vs TBD" },
    ],
  },
  {
    id: "hou", name: "Houston", displayName: "Houston",
    stadium: "NRG Stadium", country: "USA",
    coordinates: [-95.4107, 29.6847], capacity: 72_220, matchCount: 6,
    timezone: "CT",
    weather: { tempF: 91, condition: "Hot & Humid", humidity: 82, windMph: 11, icon: "🌡️" },
    upcomingMatches: [
      { matchLabel: "Group F – Match 1", date: "Jun 17, 2026", teams: "TBD vs TBD" },
      { matchLabel: "Quarter-Final", date: "Jul 10, 2026", teams: "TBD vs TBD" },
    ],
  },
  {
    id: "bos", name: "Boston", displayName: "Boston",
    stadium: "Gillette Stadium", country: "USA",
    coordinates: [-71.2642, 42.0910], capacity: 65_878, matchCount: 6,
    timezone: "ET",
    weather: { tempF: 74, condition: "Partly Cloudy", humidity: 60, windMph: 15, icon: "⛅" },
    upcomingMatches: [
      { matchLabel: "Group G – Match 1", date: "Jun 18, 2026", teams: "TBD vs TBD" },
      { matchLabel: "Round of 32", date: "Jul 2, 2026", teams: "TBD vs TBD" },
    ],
  },
  {
    id: "phi", name: "Philadelphia", displayName: "Philadelphia",
    stadium: "Lincoln Financial Field", country: "USA",
    coordinates: [-75.1674, 39.9008], capacity: 69_796, matchCount: 6,
    timezone: "ET",
    weather: { tempF: 83, condition: "Warm & Humid", humidity: 68, windMph: 9, icon: "🌤️" },
    upcomingMatches: [
      { matchLabel: "Group H – Match 1", date: "Jun 19, 2026", teams: "TBD vs TBD" },
      { matchLabel: "Round of 16", date: "Jul 7, 2026", teams: "TBD vs TBD" },
    ],
  },
  {
    id: "kci", name: "Kansas City", displayName: "Kansas City",
    stadium: "Arrowhead Stadium", country: "USA",
    coordinates: [-94.4839, 39.0489], capacity: 76_416, matchCount: 6,
    timezone: "CT",
    weather: { tempF: 87, condition: "Warm, Possible Storms", humidity: 70, windMph: 18, icon: "⛈️" },
    upcomingMatches: [
      { matchLabel: "Group I – Match 1", date: "Jun 20, 2026", teams: "TBD vs TBD" },
      { matchLabel: "Quarter-Final", date: "Jul 11, 2026", teams: "TBD vs TBD" },
    ],
  },
  {
    id: "atl", name: "Atlanta", displayName: "Atlanta",
    stadium: "Mercedes-Benz Stadium", country: "USA",
    coordinates: [-84.4007, 33.7555], capacity: 71_000, matchCount: 6,
    timezone: "ET",
    weather: { tempF: 89, condition: "Hot & Humid", humidity: 75, windMph: 8, icon: "🌡️" },
    upcomingMatches: [
      { matchLabel: "Group J – Match 1", date: "Jun 21, 2026", teams: "TBD vs TBD" },
      { matchLabel: "Round of 32", date: "Jul 3, 2026", teams: "TBD vs TBD" },
    ],
  },
  {
    id: "mia", name: "Miami", displayName: "Miami",
    stadium: "Hard Rock Stadium", country: "USA",
    coordinates: [-80.2389, 25.9580], capacity: 65_326, matchCount: 7,
    timezone: "ET",
    weather: { tempF: 87, condition: "Hot, Afternoon Showers", humidity: 88, windMph: 14, icon: "🌦️" },
    upcomingMatches: [
      { matchLabel: "Group K – Match 1", date: "Jun 22, 2026", teams: "TBD vs TBD" },
      { matchLabel: "Semi-Final", date: "Jul 14, 2026", teams: "TBD vs TBD" },
    ],
  },
  {
    id: "tor", name: "Toronto", displayName: "Toronto",
    stadium: "BMO Field (Expanded)", country: "Canada",
    coordinates: [-79.4179, 43.6333], capacity: 45_000, matchCount: 6,
    timezone: "ET",
    weather: { tempF: 73, condition: "Partly Cloudy", humidity: 58, windMph: 13, icon: "⛅" },
    upcomingMatches: [
      { matchLabel: "Group L – Match 1", date: "Jun 23, 2026", teams: "TBD vs TBD" },
      { matchLabel: "Round of 32", date: "Jul 4, 2026", teams: "TBD vs TBD" },
    ],
  },
  {
    id: "van", name: "Vancouver", displayName: "Vancouver",
    stadium: "BC Place", country: "Canada",
    coordinates: [-123.1118, 49.2767], capacity: 54_500, matchCount: 6,
    timezone: "PT",
    weather: { tempF: 69, condition: "Mild & Partly Cloudy", humidity: 62, windMph: 11, icon: "⛅" },
    upcomingMatches: [
      { matchLabel: "Group A – Match 2", date: "Jun 14, 2026", teams: "TBD vs TBD" },
      { matchLabel: "Round of 16", date: "Jul 8, 2026", teams: "TBD vs TBD" },
    ],
  },
  {
    id: "mex", name: "Mexico City", displayName: "Mexico City",
    stadium: "Estadio Azteca", country: "Mexico",
    coordinates: [-99.1503, 19.3027], capacity: 87_523, matchCount: 7,
    timezone: "CT",
    weather: { tempF: 73, condition: "Mild (altitude), PM showers", humidity: 55, windMph: 9, icon: "🌦️" },
    upcomingMatches: [
      { matchLabel: "Group B – Match 2", date: "Jun 14, 2026", teams: "Mexico vs TBD" },
      { matchLabel: "Round of 32", date: "Jul 5, 2026", teams: "TBD vs TBD" },
      { matchLabel: "Semi-Final", date: "Jul 15, 2026", teams: "TBD vs TBD" },
    ],
  },
  {
    id: "gdl", name: "Guadalajara", displayName: "Guadalajara",
    stadium: "Estadio Akron", country: "Mexico",
    coordinates: [-103.4692, 20.6897], capacity: 49_850, matchCount: 6,
    timezone: "CT",
    weather: { tempF: 83, condition: "Warm, Afternoon Showers", humidity: 60, windMph: 10, icon: "🌦️" },
    upcomingMatches: [
      { matchLabel: "Group C – Match 1", date: "Jun 15, 2026", teams: "TBD vs TBD" },
      { matchLabel: "Round of 32", date: "Jun 30, 2026", teams: "TBD vs TBD" },
    ],
  },
  {
    id: "mty", name: "Monterrey", displayName: "Monterrey",
    stadium: "Estadio BBVA", country: "Mexico",
    coordinates: [-100.2396, 25.6693], capacity: 51_348, matchCount: 6,
    timezone: "CT",
    weather: { tempF: 96, condition: "Very Hot & Dry", humidity: 38, windMph: 20, icon: "🔥" },
    upcomingMatches: [
      { matchLabel: "Group D – Match 2", date: "Jun 17, 2026", teams: "TBD vs TBD" },
      { matchLabel: "Quarter-Final", date: "Jul 12, 2026", teams: "TBD vs TBD" },
    ],
  },
];

// ── Teams ─────────────────────────────────────────────────────────────────────

export const WC_TEAMS: Record<string, WCTeam> = {
  // Upper bracket teams
  fra: { id: "fra", name: "France",      shortName: "FRA", countryCode: "fr", strength: 1855, color: "#002395" },
  mor: { id: "mor", name: "Morocco",     shortName: "MAR", countryCode: "ma", strength: 1682, color: "#C1272D" },
  esp: { id: "esp", name: "Spain",       shortName: "ESP", countryCode: "es", strength: 1785, color: "#c60b1e" },
  jpn: { id: "jpn", name: "Japan",       shortName: "JPN", countryCode: "jp", strength: 1652, color: "#bc002d" },
  eng: { id: "eng", name: "England",     shortName: "ENG", countryCode: "gb", strength: 1795, color: "#012169" },
  sen: { id: "sen", name: "Senegal",     shortName: "SEN", countryCode: "sn", strength: 1642, color: "#00853F" },
  ger: { id: "ger", name: "Germany",     shortName: "GER", countryCode: "de", strength: 1762, color: "#000000" },
  col: { id: "col", name: "Colombia",    shortName: "COL", countryCode: "co", strength: 1702, color: "#FCD116" },
  bra: { id: "bra", name: "Brazil",      shortName: "BRA", countryCode: "br", strength: 1842, color: "#009c3b" },
  usa: { id: "usa", name: "USA",         shortName: "USA", countryCode: "us", strength: 1662, color: "#3C3B6E" },
  arg: { id: "arg", name: "Argentina",   shortName: "ARG", countryCode: "ar", strength: 1872, color: "#74ACDF" },
  nga: { id: "nga", name: "Nigeria",     shortName: "NGA", countryCode: "ng", strength: 1632, color: "#008751" },
  por: { id: "por", name: "Portugal",    shortName: "POR", countryCode: "pt", strength: 1812, color: "#006600" },
  sui: { id: "sui", name: "Switzerland", shortName: "SUI", countryCode: "ch", strength: 1722, color: "#FF0000" },
  ned: { id: "ned", name: "Netherlands", shortName: "NED", countryCode: "nl", strength: 1802, color: "#FF4F00" },
  mex: { id: "mex", name: "Mexico",      shortName: "MEX", countryCode: "mx", strength: 1692, color: "#006847" },
  // Lower bracket teams
  ita: { id: "ita", name: "Italy",        shortName: "ITA", countryCode: "it", strength: 1735, color: "#003087" },
  ksa: { id: "ksa", name: "Saudi Arabia", shortName: "KSA", countryCode: "sa", strength: 1582, color: "#006C35" },
  bel: { id: "bel", name: "Belgium",      shortName: "BEL", countryCode: "be", strength: 1772, color: "#000000" },
  ecu: { id: "ecu", name: "Ecuador",      shortName: "ECU", countryCode: "ec", strength: 1622, color: "#FFD100" },
  cro: { id: "cro", name: "Croatia",      shortName: "CRO", countryCode: "hr", strength: 1742, color: "#FF0000" },
  kor: { id: "kor", name: "South Korea",  shortName: "KOR", countryCode: "kr", strength: 1662, color: "#003478" },
  uru: { id: "uru", name: "Uruguay",      shortName: "URU", countryCode: "uy", strength: 1752, color: "#75AADB" },
  can: { id: "can", name: "Canada",       shortName: "CAN", countryCode: "ca", strength: 1642, color: "#FF0000" },
  den: { id: "den", name: "Denmark",      shortName: "DEN", countryCode: "dk", strength: 1722, color: "#C60C30" },
  gha: { id: "gha", name: "Ghana",        shortName: "GHA", countryCode: "gh", strength: 1622, color: "#006B3F" },
  aut: { id: "aut", name: "Austria",      shortName: "AUT", countryCode: "at", strength: 1682, color: "#ED2939" },
  irn: { id: "irn", name: "Iran",         shortName: "IRN", countryCode: "ir", strength: 1642, color: "#239F40" },
  pol: { id: "pol", name: "Poland",       shortName: "POL", countryCode: "pl", strength: 1692, color: "#DC143C" },
  aus: { id: "aus", name: "Australia",    shortName: "AUS", countryCode: "au", strength: 1612, color: "#00843D" },
  srb: { id: "srb", name: "Serbia",       shortName: "SRB", countryCode: "rs", strength: 1702, color: "#C6363C" },
  egy: { id: "egy", name: "Egypt",        shortName: "EGY", countryCode: "eg", strength: 1632, color: "#CE1126" },
};

// ── ELO Win Probability ───────────────────────────────────────────────────────

export function eloWinProb(topStrength: number, bottomStrength: number): number {
  // Standard ELO formula — probability that top team wins (excl. draw)
  // For soccer we use a modified version that returns win prob for 90 min + extra time
  const eloDiff = topStrength - bottomStrength;
  const rawProb = 1 / (1 + Math.pow(10, -eloDiff / 400));
  // Compress towards 0.5 a bit since draws are common in soccer
  return 0.1 + rawProb * 0.8;
}

// ── Bracket Wiring Helper ─────────────────────────────────────────────────────

function match(
  id: string, round: BracketMatch["round"], position: number,
  side: BracketMatch["side"],
  topTeamId: string | null, bottomTeamId: string | null,
  nextMatchId: string | null, nextSlot: BracketMatch["nextSlot"],
  date: string, time: string, venue: string, city: string,
): BracketMatch {
  const topT = topTeamId ? WC_TEAMS[topTeamId] : null;
  const botT = bottomTeamId ? WC_TEAMS[bottomTeamId] : null;
  const topWinProb = topT && botT
    ? eloWinProb(topT.strength, botT.strength)
    : 0.5;
  return {
    id, round, position, side,
    topTeamId, bottomTeamId,
    topScore: null, bottomScore: null,
    topPens: null, bottomPens: null,
    status: "scheduled",
    winner: null,
    date, time, venue, city,
    nextMatchId, nextSlot,
    topWinProb,
  };
}

// ── Initial Bracket State ─────────────────────────────────────────────────────

export const INITIAL_BRACKET: BracketState = {
  championId: null,
  rounds: {
    r32:   ["r32_0","r32_1","r32_2","r32_3","r32_4","r32_5","r32_6","r32_7","r32_8","r32_9","r32_10","r32_11","r32_12","r32_13","r32_14","r32_15"],
    r16:   ["r16_0","r16_1","r16_2","r16_3","r16_4","r16_5","r16_6","r16_7"],
    qf:    ["qf_0","qf_1","qf_2","qf_3"],
    sf:    ["sf_0","sf_1"],
    final: ["final_0"],
    "3rd": ["3rd_0"],
  },
  matches: {
    // ── Round of 32 — Upper bracket (positions 0–7) ──────────────────────────
    r32_0:  match("r32_0",  "r32", 0, "upper", "fra", "mor", "r16_0", "top",    "Jul 1",  "18:00","MetLife Stadium",    "New York"),
    r32_1:  match("r32_1",  "r32", 1, "upper", "esp", "jpn", "r16_0", "bottom", "Jul 1",  "21:00","SoFi Stadium",       "Los Angeles"),
    r32_2:  match("r32_2",  "r32", 2, "upper", "eng", "sen", "r16_1", "top",    "Jul 2",  "18:00","Gillette Stadium",   "Boston"),
    r32_3:  match("r32_3",  "r32", 3, "upper", "ger", "col", "r16_1", "bottom", "Jul 2",  "21:00","Lumen Field",        "Seattle"),
    r32_4:  match("r32_4",  "r32", 4, "upper", "bra", "usa", "r16_2", "top",    "Jul 3",  "18:00","AT&T Stadium",       "Dallas"),
    r32_5:  match("r32_5",  "r32", 5, "upper", "arg", "nga", "r16_2", "bottom", "Jul 3",  "21:00","Hard Rock Stadium",  "Miami"),
    r32_6:  match("r32_6",  "r32", 6, "upper", "por", "sui", "r16_3", "top",    "Jul 4",  "18:00","Levi's Stadium",     "Bay Area"),
    r32_7:  match("r32_7",  "r32", 7, "upper", "ned", "mex", "r16_3", "bottom", "Jul 4",  "21:00","Estadio Azteca",     "Mexico City"),
    // ── Round of 32 — Lower bracket (positions 8–15) ─────────────────────────
    r32_8:  match("r32_8",  "r32", 8, "lower", "ita", "ksa", "r16_4", "top",    "Jul 5",  "18:00","NRG Stadium",        "Houston"),
    r32_9:  match("r32_9",  "r32", 9, "lower", "bel", "ecu", "r16_4", "bottom", "Jul 5",  "21:00","Arrowhead Stadium",  "Kansas City"),
    r32_10: match("r32_10", "r32",10, "lower", "cro", "kor", "r16_5", "top",    "Jul 6",  "18:00","BMO Field",          "Toronto"),
    r32_11: match("r32_11", "r32",11, "lower", "uru", "can", "r16_5", "bottom", "Jul 6",  "21:00","BC Place",           "Vancouver"),
    r32_12: match("r32_12", "r32",12, "lower", "den", "gha", "r16_6", "top",    "Jul 7",  "18:00","Lincoln Financial",  "Philadelphia"),
    r32_13: match("r32_13", "r32",13, "lower", "aut", "irn", "r16_6", "bottom", "Jul 7",  "21:00","Estadio Akron",      "Guadalajara"),
    r32_14: match("r32_14", "r32",14, "lower", "pol", "aus", "r16_7", "top",    "Jul 8",  "18:00","Estadio BBVA",       "Monterrey"),
    r32_15: match("r32_15", "r32",15, "lower", "srb", "egy", "r16_7", "bottom", "Jul 8",  "21:00","Mercedes-Benz Std.", "Atlanta"),
    // ── Round of 16 — Upper ──────────────────────────────────────────────────
    r16_0:  match("r16_0",  "r16", 0, "upper", null, null, "qf_0", "top",    "Jul 10", "18:00","MetLife Stadium",    "New York"),
    r16_1:  match("r16_1",  "r16", 1, "upper", null, null, "qf_0", "bottom", "Jul 10", "21:00","SoFi Stadium",       "Los Angeles"),
    r16_2:  match("r16_2",  "r16", 2, "upper", null, null, "qf_1", "top",    "Jul 11", "18:00","AT&T Stadium",       "Dallas"),
    r16_3:  match("r16_3",  "r16", 3, "upper", null, null, "qf_1", "bottom", "Jul 11", "21:00","Estadio Azteca",     "Mexico City"),
    // ── Round of 16 — Lower ──────────────────────────────────────────────────
    r16_4:  match("r16_4",  "r16", 4, "lower", null, null, "qf_2", "top",    "Jul 12", "18:00","NRG Stadium",        "Houston"),
    r16_5:  match("r16_5",  "r16", 5, "lower", null, null, "qf_2", "bottom", "Jul 12", "21:00","Arrowhead Stadium",  "Kansas City"),
    r16_6:  match("r16_6",  "r16", 6, "lower", null, null, "qf_3", "top",    "Jul 13", "18:00","Hard Rock Stadium",  "Miami"),
    r16_7:  match("r16_7",  "r16", 7, "lower", null, null, "qf_3", "bottom", "Jul 13", "21:00","BMO Field",          "Toronto"),
    // ── Quarter-Finals ────────────────────────────────────────────────────────
    qf_0:   match("qf_0",   "qf",  0, "upper", null, null, "sf_0", "top",    "Jul 15", "18:00","MetLife Stadium",    "New York"),
    qf_1:   match("qf_1",   "qf",  1, "upper", null, null, "sf_0", "bottom", "Jul 15", "21:00","AT&T Stadium",       "Dallas"),
    qf_2:   match("qf_2",   "qf",  2, "lower", null, null, "sf_1", "top",    "Jul 16", "18:00","SoFi Stadium",       "Los Angeles"),
    qf_3:   match("qf_3",   "qf",  3, "lower", null, null, "sf_1", "bottom", "Jul 16", "21:00","NRG Stadium",        "Houston"),
    // ── Semi-Finals ───────────────────────────────────────────────────────────
    sf_0:   match("sf_0",   "sf",  0, "upper", null, null, "final_0", "top",    "Jul 18", "21:00","MetLife Stadium",  "New York"),
    sf_1:   match("sf_1",   "sf",  1, "lower", null, null, "final_0", "bottom", "Jul 19", "21:00","SoFi Stadium",     "Los Angeles"),
    // ── Final ─────────────────────────────────────────────────────────────────
    final_0: match("final_0","final",0,"center", null, null, null, null, "Jul 21", "21:00","MetLife Stadium",    "New York"),
    // ── Third Place ───────────────────────────────────────────────────────────
    "3rd_0": match("3rd_0", "3rd", 0, "center", null, null, null, null, "Jul 20", "17:00","Estadio Azteca",     "Mexico City"),
  },
};
