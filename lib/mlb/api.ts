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
  balls?: number;
  strikes?: number;
  outs?: number;
  teams?: {
    away?: { runs?: number; hits?: number; errors?: number };
    home?: { runs?: number; hits?: number; errors?: number };
  };
  offense?: {
    first?: { id?: number };
    second?: { id?: number };
    third?: { id?: number };
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

// Primary full-colour logo — works on any background
export function teamLogoUrl(teamId: number): string {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}

// Cap logo on dark — used as a secondary fallback
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

// ── Fetchers ───────────────────────────────────────────────────────────────────

export async function fetchGamesByDate(date: string): Promise<Game[]> {
  const url = `${BASE}/schedule?sportId=1&date=${date}&hydrate=probablePitcher,linescore,team`;
  const res = await fetch(url, { cache: "no-store" });
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
    const season = new Date().getFullYear();
    const url = `${BASE}/people/${personId}/stats?stats=season&group=pitching&season=${season}`;
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
    const season = new Date().getFullYear();
    const url = `${BASE}/people/${personId}/stats?stats=season&group=hitting&season=${season}`;
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
    const season = new Date().getFullYear();
    const url = `${BASE}/people/${personId}?hydrate=stats(type=season,group=${groups},season=${season}),currentTeam`;
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

// ── Head-to-Head History ──────────────────────────────────────────────────────

export interface H2HGame {
  gamePk: number;
  date: string;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
  venue: string;
  winnerTeamId: number;
}

export async function fetchH2HHistory(
  team1Id: number,
  team2Id: number,
  limit = 5,
): Promise<H2HGame[]> {
  try {
    const currentYear = new Date().getFullYear();
    const results: H2HGame[] = [];

    for (const year of [currentYear, currentYear - 1]) {
      if (results.length >= limit) break;
      const url = `${BASE}/schedule?teamId=${team1Id}&opponentId=${team2Id}&season=${year}&sportId=1&gameType=R`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) continue;
      const data = await res.json();
      const games: any[] = (data.dates ?? []).flatMap((d: any) => d.games ?? []).reverse();

      for (const g of games) {
        if (results.length >= limit) break;
        if (g.status?.abstractGameState !== "Final") continue;
        const homeTeamId = g.teams?.home?.team?.id ?? 0;
        const awayTeamId = g.teams?.away?.team?.id ?? 0;
        const homeScore  = g.teams?.home?.score ?? 0;
        const awayScore  = g.teams?.away?.score ?? 0;
        results.push({
          gamePk: g.gamePk,
          date: g.gameDate,
          homeTeamId,
          awayTeamId,
          homeScore,
          awayScore,
          venue: g.venue?.name ?? "",
          winnerTeamId: homeScore >= awayScore ? homeTeamId : awayTeamId,
        });
      }
    }

    return results.slice(0, limit);
  } catch {
    return [];
  }
}

// ── NRFI Prediction ───────────────────────────────────────────────────────────

export interface NRFIPrediction {
  verdict: "YES" | "NO" | "PUSH";
  confidence: number;
  reason: string;
}

export function computeNRFI(
  awayPitcher: PitcherSeasonStats | null,
  homePitcher: PitcherSeasonStats | null,
): NRFIPrediction {
  if (!awayPitcher && !homePitcher) {
    return { verdict: "PUSH", confidence: 50, reason: "No pitcher data available" };
  }
  const avgERA  = ((awayPitcher?.era ?? 4.5) + (homePitcher?.era ?? 4.5)) / 2;
  const avgWHIP = ((awayPitcher?.whip ?? 1.3) + (homePitcher?.whip ?? 1.3)) / 2;

  const eraScore  = Math.max(0, Math.min(100, (6.5 - avgERA) * 18));
  const whipScore = Math.max(0, Math.min(100, (1.9 - avgWHIP) * 70));
  const raw = Math.round((eraScore * 0.6 + whipScore * 0.4));

  const awayERA = awayPitcher?.era.toFixed(2) ?? "N/A";
  const homeERA = homePitcher?.era.toFixed(2) ?? "N/A";

  if (raw >= 60) {
    return {
      verdict: "YES",
      confidence: Math.min(82, raw),
      reason: `${awayERA} ERA vs ${homeERA} ERA — elite starters shutting down lineups early`,
    };
  }
  if (raw <= 38) {
    return {
      verdict: "NO",
      confidence: Math.min(78, 100 - raw),
      reason: `${awayERA} ERA vs ${homeERA} ERA — vulnerable pitching increases first-inning scoring`,
    };
  }
  return {
    verdict: "PUSH",
    confidence: raw,
    reason: `${awayERA} ERA vs ${homeERA} ERA — mixed signals, could go either way`,
  };
}

// ── First-inning scoring (for NRFI post-game verify) ─────────────────────────

// Returns player IDs who hit a HR in a team's most recent completed game
export async function fetchTeamLastGameHRHitters(teamId: number): Promise<Set<number>> {
  try {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);
    const url = `${BASE}/schedule?teamId=${teamId}&season=${today.getFullYear()}&gameType=R&startDate=${startDate.toISOString().slice(0, 10)}&endDate=${today.toISOString().slice(0, 10)}&sportId=1`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return new Set();
    const data = await res.json();
    const games: any[] = (data.dates ?? []).flatMap((d: any) => d.games ?? []);
    const last = games.filter((g) => g.status?.abstractGameState === "Final").pop();
    if (!last) return new Set();
    const bsRes = await fetch(`${BASE}/game/${last.gamePk}/boxscore`, { next: { revalidate: 3600 } });
    if (!bsRes.ok) return new Set();
    const bsData = await bsRes.json();
    const hrHitters = new Set<number>();
    for (const side of ["home", "away"] as const) {
      for (const p of Object.values(bsData.teams?.[side]?.players ?? {}) as any[]) {
        if ((p.stats?.batting?.homeRuns ?? 0) > 0 && p.person?.id) {
          hrHitters.add(p.person.id);
        }
      }
    }
    return hrHitters;
  } catch {
    return new Set();
  }
}

export async function fetchFirstInningScores(
  gamePk: number,
): Promise<{ away: number; home: number } | null> {
  try {
    const url = `${BASE}/game/${gamePk}/linescore`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const inning1 = (data.innings ?? [])[0];
    if (!inning1) return null;
    return {
      away: inning1.away?.runs ?? 0,
      home: inning1.home?.runs ?? 0,
    };
  } catch {
    return null;
  }
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
