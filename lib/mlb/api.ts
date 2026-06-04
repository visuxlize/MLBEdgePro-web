// MLB Stats API — mirrors the mobile app's data layer
const BASE = "https://statsapi.mlb.com/api/v1";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Team { id: number; name: string; }
export interface Pitcher { id: number; fullName: string; }
export interface TeamSide {
  team: Team;
  probablePitcher?: Pitcher;
  score?: number;    // from schedule response (sometimes missing)
}
export interface Linescore {
  currentInning?: number;
  currentInningOrdinal?: string;
  inningState?: string;
  teams?: {
    away?: { runs?: number; hits?: number; errors?: number };
    home?: { runs?: number; hits?: number; errors?: number };
  };
}
export interface Game {
  gamePk: number;
  gameDate: string;
  status: { detailedState: string; abstractGameState: string };
  teams: { away: TeamSide; home: TeamSide };
  venue: { id: number; name: string };
  linescore?: Linescore;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Score with linescore fallback — the schedule endpoint doesn't always populate teams.away.score */
export function getScore(side: TeamSide, linescore?: Linescore, which?: "away" | "home"): number | undefined {
  if (side.score !== undefined) return side.score;
  if (which && linescore?.teams?.[which]?.runs !== undefined) {
    return linescore.teams[which]!.runs;
  }
  return undefined;
}

export function teamLogoUrl(teamId: number): string {
  return `https://www.mlbstatic.com/team-logos/team-cap-on-light/${teamId}.svg`;
}

export function teamLogoDarkUrl(teamId: number): string {
  return `https://www.mlbstatic.com/team-logos/team-cap-on-dark/${teamId}.svg`;
}

export function playerHeadshotUrl(playerId: number): string {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${playerId}/headshot/67/current`;
}

// ESPN venue ID lookup (used by getStadiumImageUrl)
const VENUE_ESPN_ID: Record<number, number> = {
  1: 3, 2: 1, 3: 2, 4: 4, 5: 5, 7: 7, 12: 31, 14: 14, 15: 30, 17: 16,
  19: 27, 22: 19, 31: 47, 32: 4242, 680: 41, 2392: 44, 2394: 45, 2395: 43,
  2602: 83, 2680: 85, 2681: 84, 2889: 87, 3289: 209, 3309: 89, 3312: 210,
  3313: 208, 4169: 4223, 4705: 218, 5325: 231,
};

export function getStadiumImageUrl(venueId: number): string {
  const espnId = VENUE_ESPN_ID[venueId];
  if (!espnId) return "";
  return `https://a.espncdn.com/i/venues/mlb/day/${espnId}.jpg`;
}

// Team primary colors for gradient fallbacks
export const TEAM_COLORS: Record<number, string> = {
  108: "#BA0021", 109: "#A71930", 110: "#DF4601", 111: "#BD3039", 112: "#0E3386",
  113: "#C6011F", 114: "#00385D", 115: "#33006F", 116: "#0C2340", 117: "#EB6E1F",
  118: "#004687", 119: "#005A9C", 120: "#AB0003", 121: "#002D72", 133: "#003831",
  134: "#27251F", 135: "#2F241D", 136: "#0C2C56", 137: "#FD5A1E", 138: "#C41E3A",
  139: "#092C5C", 140: "#003278", 141: "#134A8E", 142: "#002B5C", 143: "#E81828",
  144: "#CE1141", 145: "#27251F", 146: "#00A3E0", 147: "#003087", 158: "#12284B",
};

export const TEAM_ABBR: Record<number, string> = {
  108: "LAA", 109: "ARI", 110: "BAL", 111: "BOS", 112: "CHC", 113: "CIN",
  114: "CLE", 115: "COL", 116: "DET", 117: "HOU", 118: "KC",  119: "LAD",
  120: "WSH", 121: "NYM", 133: "OAK", 134: "PIT", 135: "SD",  136: "SEA",
  137: "SF",  138: "STL", 139: "TB",  140: "TEX", 141: "TOR", 142: "MIN",
  143: "PHI", 144: "ATL", 145: "CWS", 146: "MIA", 147: "NYY", 158: "MIL",
};

// ── Extended stat types ────────────────────────────────────────────────────────

export interface PitcherSeasonStats {
  era: number;
  whip: number;
  strikeoutsPer9Inn: number;
  walksPer9Inn: number;
  homeRunsPer9: number;
  strikeOuts: number;
  wins: number;
  losses: number;
  inningsPitched: string;
  homeRuns: number;
  baseOnBalls: number;
  gamesStarted: number;
  flyBallPct?: number;
  barrelsPct?: number;
}

export interface BatterSeasonStats {
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  homeRuns: number;
  iso: number;
  barrelsPct?: number;
  avgExitVelocity?: number;
  hardHitPct?: number;
}

export interface LineupPlayer {
  id: number;
  fullName: string;
  position: string;
  battingOrder: number;
}

export interface RosterBatter {
  id: number;
  fullName: string;
  position: string;
  teamId: number;
  stats: {
    avg: string;
    homeRuns: number;
    rbi: number;
    strikeOuts: number;
    baseOnBalls: number;
    ops: string;
    atBats: number;
    plateAppearances: number;
  };
}

// Venue lat/long for weather lookups (MLB venue IDs → coords)
const VENUE_COORDS: Record<number, { lat: number; lon: number }> = {
  1:    { lat: 40.8296, lon: -73.9262 }, // Yankee Stadium
  2:    { lat: 42.3467, lon: -71.0972 }, // Fenway Park
  3:    { lat: 41.8299, lon: -87.6338 }, // Wrigley Field
  4:    { lat: 38.8730, lon: -77.0074 }, // Nationals Park
  5:    { lat: 39.7559, lon: -104.9942 }, // Coors Field
  7:    { lat: 41.4962, lon: -81.6852 }, // Progressive Field
  12:   { lat: 37.7786, lon: -122.3893 }, // Oracle Park
  14:   { lat: 36.1601, lon: -86.7785 }, // Truist Park
  15:   { lat: 33.8908, lon: -84.4677 }, // Truist Park (ATL)
  17:   { lat: 42.6910, lon: -83.2453 }, // Comerica Park
  19:   { lat: 29.7573, lon: -95.3555 }, // Minute Maid Park
  22:   { lat: 34.0739, lon: -118.2400 }, // Dodger Stadium
  31:   { lat: 37.7516, lon: -122.2005 }, // Oakland Coliseum
  32:   { lat: 39.9012, lon: -82.9963 }, // Great American Ball Park
  680:  { lat: 47.5914, lon: -122.3328 }, // T-Mobile Park
  2392: { lat: 32.7073, lon: -97.0836 }, // Globe Life Field
  2394: { lat: 33.4453, lon: -112.0667 }, // Chase Field
  2395: { lat: 25.7781, lon: -80.2196 }, // loanDepot park
  2602: { lat: 43.6414, lon: -79.3894 }, // Rogers Centre
  2680: { lat: 44.9817, lon: -93.2783 }, // Target Field
  2681: { lat: 44.9817, lon: -93.2783 }, // Target Field alt
  2889: { lat: 38.9569, lon: -76.8914 }, // Camden Yards alt
  3289: { lat: 39.0558, lon: -84.5076 }, // Great American BPark
  3309: { lat: 40.4469, lon: -79.9599 }, // PNC Park
  3312: { lat: 32.7473, lon: -117.1573 }, // Petco Park
  3313: { lat: 38.5737, lon: -121.4678 }, // Sutter Health Park
  4169: { lat: 40.7571, lon: -73.8458 }, // Citi Field
  4705: { lat: 43.0284, lon: -76.1062 }, // NBT Bank Stadium
  5325: { lat: 35.0961, lon: -80.8428 }, // Truist Field
};

// ── Fetchers ───────────────────────────────────────────────────────────────────

export async function fetchGamesByDate(date: string): Promise<Game[]> {
  const url = `${BASE}/schedule?sportId=1&date=${date}&hydrate=probablePitcher,linescore(teams),team`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("MLB API error");
  const data = await res.json();
  return (data.dates ?? []).flatMap((d: any) => d.games ?? []) as Game[];
}

export async function fetchTodaysGames(): Promise<Game[]> {
  return fetchGamesByDate(new Date().toISOString().slice(0, 10));
}

export async function fetchScores(): Promise<Game[]> {
  const games = await fetchTodaysGames();
  return games.filter((g) => g.status.abstractGameState !== "Preview");
}

export async function fetchPitcherStats(personId: number): Promise<PitcherSeasonStats | null> {
  try {
    const url = `${BASE}/people/${personId}/stats?stats=season&group=pitching&season=2025`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    const split = data.stats?.[0]?.splits?.[0]?.stat;
    if (!split) return null;
    return {
      era:                 parseFloat(split.era ?? "0"),
      whip:                parseFloat(split.whip ?? "0"),
      strikeoutsPer9Inn:   parseFloat(split.strikeoutsPer9Inn ?? "0"),
      walksPer9Inn:        parseFloat(split.walksPer9Inn ?? "0"),
      homeRunsPer9:        parseFloat(split.homeRunsPer9 ?? "0"),
      strikeOuts:          parseInt(split.strikeOuts ?? "0", 10),
      wins:                parseInt(split.wins ?? "0", 10),
      losses:              parseInt(split.losses ?? "0", 10),
      inningsPitched:      split.inningsPitched ?? "0.0",
      homeRuns:            parseInt(split.homeRuns ?? "0", 10),
      baseOnBalls:         parseInt(split.baseOnBalls ?? "0", 10),
      gamesStarted:        parseInt(split.gamesStarted ?? "1", 10),
    };
  } catch {
    return null;
  }
}

export async function fetchBatterStats(personId: number): Promise<BatterSeasonStats | null> {
  try {
    const url = `${BASE}/people/${personId}/stats?stats=season&group=hitting&season=2025`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    const split = data.stats?.[0]?.splits?.[0]?.stat;
    if (!split) return null;
    const slg = parseFloat(split.slg ?? "0");
    const obp = parseFloat(split.obp ?? "0");
    const avg = parseFloat(split.avg ?? "0");
    return {
      avg,
      obp,
      slg,
      ops:       parseFloat(split.ops ?? "0"),
      homeRuns:  parseInt(split.homeRuns ?? "0", 10),
      iso:       Math.max(0, slg - avg),
    };
  } catch {
    return null;
  }
}

// Comprehensive player season stats (batter + pitcher combined)
export interface PlayerFullStats {
  id: number;
  fullName: string;
  position: string;
  teamName: string;
  // Batter stats
  avg?: number;
  obp?: number;
  slg?: number;
  ops?: number;
  homeRuns?: number;
  rbi?: number;
  hits?: number;
  atBats?: number;
  strikeOuts?: number;
  walks?: number;
  stolenBases?: number;
  iso?: number;
  woba?: number;
  // Pitcher stats
  era?: number;
  whip?: number;
  wins?: number;
  losses?: number;
  strikeoutsPer9?: number;
  walksPer9?: number;
  homeRunsPer9?: number;
  innings?: string;
  saves?: number;
}

export async function fetchPlayerFullStats(personId: number, isPitcher = false): Promise<PlayerFullStats | null> {
  try {
    const groups = isPitcher ? "pitching" : "hitting";
    const url = `${BASE}/people/${personId}?hydrate=stats(type=season,group=${groups},season=2025),currentTeam`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    const person = data.people?.[0];
    if (!person) return null;
    const split = person.stats?.[0]?.splits?.[0]?.stat ?? {};
    const base: PlayerFullStats = {
      id:       person.id,
      fullName: person.fullName,
      position: person.primaryPosition?.abbreviation ?? "—",
      teamName: person.currentTeam?.name ?? "",
    };
    if (isPitcher) {
      return {
        ...base,
        era:            parseFloat(split.era ?? "0"),
        whip:           parseFloat(split.whip ?? "0"),
        wins:           parseInt(split.wins ?? "0", 10),
        losses:         parseInt(split.losses ?? "0", 10),
        strikeoutsPer9: parseFloat(split.strikeoutsPer9Inn ?? "0"),
        walksPer9:      parseFloat(split.walksPer9Inn ?? "0"),
        homeRunsPer9:   parseFloat(split.homeRunsPer9 ?? "0"),
        innings:        split.inningsPitched ?? "0.0",
        saves:          parseInt(split.saves ?? "0", 10),
      };
    }
    const avg = parseFloat(split.avg ?? "0");
    const slg = parseFloat(split.slg ?? "0");
    return {
      ...base,
      avg,
      obp:         parseFloat(split.obp ?? "0"),
      slg,
      ops:         parseFloat(split.ops ?? "0"),
      homeRuns:    parseInt(split.homeRuns ?? "0", 10),
      rbi:         parseInt(split.rbi ?? "0", 10),
      hits:        parseInt(split.hits ?? "0", 10),
      atBats:      parseInt(split.atBats ?? "0", 10),
      strikeOuts:  parseInt(split.strikeOuts ?? "0", 10),
      walks:       parseInt(split.baseOnBalls ?? "0", 10),
      stolenBases: parseInt(split.stolenBases ?? "0", 10),
      iso:         Math.max(0, slg - avg),
    };
  } catch {
    return null;
  }
}

// Rule-based win probability from pitcher stats
export function computeWinProbability(
  homePitcher: PitcherSeasonStats | null,
  awayPitcher: PitcherSeasonStats | null,
): { home: number; away: number } {
  const score = (p: PitcherSeasonStats | null) => {
    if (!p) return 50;
    const eraScore  = Math.max(0, (6 - p.era) * 8);
    const whipScore = Math.max(0, (2 - p.whip) * 12);
    const k9Score   = p.strikeoutsPer9Inn * 1.5;
    return eraScore + whipScore + k9Score;
  };
  const homeAdv = 3; // home field
  const h = score(homePitcher) + homeAdv;
  const a = score(awayPitcher);
  const total = h + a || 1;
  const homeRaw = Math.round((h / total) * 100);
  // clamp 38-68%
  const home = Math.min(68, Math.max(38, homeRaw));
  return { home, away: 100 - home };
}

export async function fetchGameLineup(gamePk: number): Promise<LineupPlayer[]> {
  try {
    const url = `${BASE}/game/${gamePk}/boxscore`;
    const res = await fetch(url, { next: { revalidate: 120 } });
    if (!res.ok) return [];
    const data = await res.json();
    const players: LineupPlayer[] = [];
    for (const side of ["away", "home"] as const) {
      const roster = data.teams?.[side]?.players ?? {};
      for (const p of Object.values(roster) as any[]) {
        if (p.battingOrder) {
          players.push({
            id:           p.person.id,
            fullName:     p.person.fullName,
            position:     p.position?.abbreviation ?? "?",
            battingOrder: parseInt(p.battingOrder, 10),
          });
        }
      }
    }
    return players.sort((a, b) => a.battingOrder - b.battingOrder);
  } catch {
    return [];
  }
}

export async function fetchTeamBatters(teamId: number): Promise<RosterBatter[]> {
  try {
    const season = new Date().getFullYear();
    const url = `${BASE}/teams/${teamId}/roster?rosterType=active&season=${season}&hydrate=person(stats(type=season,group=hitting,season=${season}))`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const data = await res.json();

    const batters: RosterBatter[] = [];
    for (const entry of data.roster ?? []) {
      const person = entry.person;
      const pos = entry.position?.abbreviation ?? "";
      if (!person?.id || pos === "P" || pos === "TWP") continue;

      const stat = person.stats?.[0]?.splits?.[0]?.stat ?? {};
      const atBats = parseInt(stat.atBats ?? "0", 10);
      if (atBats < 10) continue;

      batters.push({
        id: person.id,
        fullName: person.fullName,
        position: pos,
        teamId,
        stats: {
          avg: stat.avg ?? ".000",
          homeRuns: parseInt(stat.homeRuns ?? "0", 10),
          rbi: parseInt(stat.rbi ?? "0", 10),
          strikeOuts: parseInt(stat.strikeOuts ?? "0", 10),
          baseOnBalls: parseInt(stat.baseOnBalls ?? "0", 10),
          ops: stat.ops ?? ".000",
          atBats,
          plateAppearances: parseInt(stat.plateAppearances ?? String(atBats), 10),
        },
      });
    }

    return batters.sort((a, b) => parseFloat(b.stats.ops) - parseFloat(a.stats.ops));
  } catch {
    return [];
  }
}

export interface VenueWeather {
  tempF: number;
  windMph: number;
  windDirection: string;
  conditions: string;
  humidity: number;
}

export async function fetchVenueWeather(venueId: number): Promise<VenueWeather | null> {
  const coords = VENUE_COORDS[venueId];
  if (!coords || !process.env.OPENWEATHER_API_KEY) return null;
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&units=imperial&appid=${process.env.OPENWEATHER_API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) return null;
    const data = await res.json();
    const deg = data.wind?.deg ?? 0;
    const dirs = ["N","NE","E","SE","S","SW","W","NW"];
    const windDirection = dirs[Math.round(deg / 45) % 8];
    return {
      tempF:         Math.round(data.main?.temp ?? 72),
      windMph:       Math.round((data.wind?.speed ?? 0) * 1.15), // m/s to mph already in imperial
      windDirection,
      conditions:    data.weather?.[0]?.description ?? "clear",
      humidity:      data.main?.humidity ?? 50,
    };
  } catch {
    return null;
  }
}

// ── Display helpers ────────────────────────────────────────────────────────────

export function gameStatusLabel(game: Game): string {
  const state = game.status.detailedState;
  if (state === "Final" || state === "Game Over") return "Final";
  if (state === "In Progress") {
    const ls = game.linescore;
    return `${ls?.inningState ?? ""} ${ls?.currentInningOrdinal ?? ""}`.trim() || "Live";
  }
  return new Date(game.gameDate).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const tomorrow  = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, today))     return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  if (sameDay(d, tomorrow))  return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
