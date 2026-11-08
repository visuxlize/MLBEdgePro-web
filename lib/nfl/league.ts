import "server-only";
import { gradeFromEdge, modelNflGame, nflPower, buildNflProps } from "./analytics";
import { NFL_TEAMS } from "./teams";
import { getEventPropLines } from "@/lib/props/dk-lines";
import type {
  NflGameDetail, NflLeaderLine, NflOdds, NflPlayerSeason, NflPropPlay, NflSeasonGame, NflStandingRow, NflTeamStatRow,
} from "./types";

const SITE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";
const V2 = "https://site.api.espn.com/apis/v2/sports/football/nfl";
const SEASON = 2026;

async function getJson(url: string, revalidate: number): Promise<any | null> {
  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const sv = (e: any, name: string): number => {
  const v = e?.stats?.find((s: any) => s.name === name)?.value;
  return typeof v === "number" ? v : parseFloat(e?.stats?.find((s: any) => s.name === name)?.displayValue ?? "0") || 0;
};
const sd = (e: any, name: string): string | undefined => e?.stats?.find((s: any) => s.name === name)?.displayValue;

/* ── Standings ───────────────────────────────────────────────────────────── */

export async function getNflStandings(): Promise<NflStandingRow[]> {
  const data = await getJson(`${V2}/standings?level=3&season=${SEASON}`, 600);
  const out: NflStandingRow[] = [];
  for (const conf of data?.children ?? []) {
    const confName: "AFC" | "NFC" = /american/i.test(conf.name) ? "AFC" : "NFC";
    for (const div of conf.children ?? []) {
      for (const e of div.standings?.entries ?? []) {
        const wins = sv(e, "wins"), losses = sv(e, "losses"), ties = sv(e, "ties");
        const gp = wins + losses + ties;
        const pf = sv(e, "pointsFor"), pa = sv(e, "pointsAgainst");
        const abbr: string = e.team?.abbreviation ?? "";
        const ppg = gp ? pf / gp : 0, papg = gp ? pa / gp : 0;
        out.push({
          abbr, name: e.team?.displayName ?? NFL_TEAMS[abbr]?.name ?? abbr,
          conf: confName, division: div.name ?? "",
          seed: sv(e, "playoffSeed"),
          wins, losses, ties,
          pct: gp ? (wins + ties / 2) / gp : 0,
          pf, pa, diff: pf - pa, gp,
          streak: sd(e, "streak") ?? "-",
          home: sd(e, "Home") ?? "-", road: sd(e, "Road") ?? "-",
          divRecord: sd(e, "vs. Div.") ?? "-", confRecord: sd(e, "vs. Conf.") ?? "-",
          power: Math.round(nflPower(gp ? (pf - pa) / gp : 0, gp) * 10) / 10,
          ppg: Math.round(ppg * 10) / 10, papg: Math.round(papg * 10) / 10,
        });
      }
    }
  }
  return out;
}

export const nflStandingsMap = (rows: NflStandingRow[]) => new Map(rows.map((r) => [r.abbr, r]));

/* ── Scoreboard ──────────────────────────────────────────────────────────── */

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/New_York" }).toUpperCase();
}
function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
}

function parseOdds(comp: any, homeAbbr: string): NflOdds | undefined {
  const o = comp?.odds?.[0];
  if (!o) return undefined;
  let homeSpread: number | null = null;
  const line = o.pointSpread?.home?.close?.line;
  if (line != null && !isNaN(parseFloat(line))) homeSpread = parseFloat(line);
  else if (typeof o.details === "string") {
    const m = o.details.match(/^(\w+)\s+([-+]?\d+(\.\d+)?)$/);
    if (m) homeSpread = m[1] === homeAbbr ? parseFloat(m[2]) : -parseFloat(m[2]);
  }
  return {
    provider: o.provider?.name ?? "DraftKings",
    homeSpread,
    overUnder: typeof o.overUnder === "number" ? o.overUnder : null,
    homeML: o.moneyline?.home?.close?.odds, awayML: o.moneyline?.away?.close?.odds,
  };
}

function parseLeaders(comp: any): NflLeaderLine[] {
  const out: NflLeaderLine[] = [];
  const map: Record<string, NflLeaderLine["category"]> = { passingYards: "Passing", rushingYards: "Rushing", receivingYards: "Receiving" };
  for (const l of comp.leaders ?? []) {
    const cat = map[l.name];
    const top = l.leaders?.[0];
    if (!cat || !top) continue;
    out.push({
      category: cat, player: top.athlete?.displayName ?? "", line: top.displayValue ?? "",
      team: comp.competitors?.find((c: any) => String(c.team?.id) === String(top.team?.id))?.team?.abbreviation ?? "",
      espnId: String(top.athlete?.id ?? ""),
    });
  }
  return out;
}

export function mapNflSeasonEvent(ev: any, seasonType: 1 | 2 | 3, weekNum: number, weekLabel: string, st: Map<string, NflStandingRow>): NflSeasonGame | null {
  try {
    const comp = ev.competitions?.[0];
    if (!comp) return null;
    const away = comp.competitors?.find((c: any) => c.homeAway === "away");
    const home = comp.competitors?.find((c: any) => c.homeAway === "home");
    const aAbbr = away?.team?.abbreviation, hAbbr = home?.team?.abbreviation;
    if (!aAbbr || !hAbbr) return null;
    const state = comp.status?.type?.state;
    const status = state === "in" ? "live" : state === "post" ? "final" : "pre";
    const odds = parseOdds(comp, hAbbr);
    const model = modelNflGame(st.get(hAbbr), st.get(aAbbr), odds?.homeSpread);
    const rec = (c: any) => c.records?.find((r: any) => r.type === "total" || r.name === "overall")?.summary;
    return {
      id: String(ev.id), seasonType, weekNum, weekLabel,
      date: comp.date ?? ev.date, dateLabel: dateLabel(comp.date ?? ev.date), timeLabel: timeLabel(comp.date ?? ev.date),
      venue: comp.venue?.fullName ?? "",
      away: aAbbr, home: hAbbr,
      awayScore: status !== "pre" ? Number(away.score) : undefined,
      homeScore: status !== "pre" ? Number(home.score) : undefined,
      awayRecord: rec(away), homeRecord: rec(home),
      status,
      statusDetail: status === "pre" ? timeLabel(comp.date ?? ev.date) : (comp.status?.type?.shortDetail ?? (status === "final" ? "FINAL" : "LIVE")),
      broadcast: comp.broadcasts?.[0]?.names?.[0],
      odds, leaders: status === "pre" ? [] : parseLeaders(comp),
      homeWinProb: model.homeWinProb, edge: model.edge, grade: model.grade,
    };
  } catch {
    return null;
  }
}

export interface NflWeekPayload {
  seasonType: 1 | 2 | 3;
  weekNum: number;
  label: string;
  games: NflSeasonGame[];
  bye: string[];
}

export function nflWeekLabel(seasonType: number, week: number) {
  if (seasonType === 3) return ["Wild Card", "Divisional", "Conf. Championship", "", "Super Bowl"][week - 1] ?? `Playoffs ${week}`;
  if (seasonType === 1) return week === 1 ? "Hall of Fame" : `Preseason ${week - 1}`;
  return `Week ${week}`;
}

export async function getNflWeek(seasonType: 1 | 2 | 3, week: number): Promise<NflWeekPayload> {
  const [data, standings] = await Promise.all([
    getJson(`${SITE}/scoreboard?seasontype=${seasonType}&week=${week}&dates=${SEASON}`, 120),
    getNflStandings(),
  ]);
  const st = nflStandingsMap(standings);
  const label = nflWeekLabel(seasonType, week);
  const games = (data?.events ?? [])
    .map((e: any) => mapNflSeasonEvent(e, seasonType, week, label, st))
    .filter((g: NflSeasonGame | null): g is NflSeasonGame => g !== null)
    .sort((a: NflSeasonGame, b: NflSeasonGame) => a.date.localeCompare(b.date));
  const bye: string[] = (data?.week?.teamsOnBye ?? []).map((t: any) => t.abbreviation);
  return { seasonType, weekNum: week, label, games, bye };
}

/** Which regular-season week ESPN considers current (the board's default). */
export async function getNflCurrentWeek(): Promise<{ seasonType: 1 | 2 | 3; week: number }> {
  const data = await getJson(`${SITE}/scoreboard`, 300);
  const t = data?.season?.type;
  return { seasonType: (t === 1 || t === 2 || t === 3 ? t : 2) as 1 | 2 | 3, week: data?.week?.number ?? 1 };
}

/* ── Player stats ────────────────────────────────────────────────────────── */

async function fetchAthletes(sort: string, limit: number): Promise<NflPlayerSeason[]> {
  const url =
    `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/statistics/byathlete` +
    `?region=us&lang=en&contentorigin=espn&isqualified=true&page=1&limit=${limit}&sort=${encodeURIComponent(sort)}%3Adesc&season=${SEASON}&seasontype=2`;
  const data = await getJson(url, 900);
  if (!data) return [];
  const cats: any[] = data.categories ?? [];
  return (data.athletes ?? []).map((a: any) => {
    const s: Record<string, number> = {};
    (a.categories ?? []).forEach((c: any, i: number) => {
      (cats[i]?.names ?? []).forEach((n: string, j: number) => { s[n] = c.values?.[j]; });
    });
    return {
      espnId: String(a.athlete?.id ?? ""), name: a.athlete?.displayName ?? "",
      team: a.athlete?.teamShortName ?? "", pos: a.athlete?.position?.abbreviation ?? "",
      gp: s.gamesPlayed ?? 0, s,
    } satisfies NflPlayerSeason;
  });
}

export interface NflPlayerBoards {
  passing: NflPlayerSeason[];
  rushing: NflPlayerSeason[];
  receiving: NflPlayerSeason[];
  defense: NflPlayerSeason[];
}

export async function getNflPlayerBoards(): Promise<NflPlayerBoards> {
  const [passing, rushing, receiving, defense] = await Promise.all([
    fetchAthletes("passing.passingYards", 40),
    fetchAthletes("rushing.rushingYards", 50),
    fetchAthletes("receiving.receivingYards", 60),
    fetchAthletes("defensive.sacks", 30),
  ]);
  return { passing, rushing, receiving, defense };
}

/** Props pool = QBs, RBs, WRs and TEs from the stat boards, de-duplicated by player. */
export async function getNflPropPool(): Promise<NflPlayerSeason[]> {
  const b = await getNflPlayerBoards();
  const map = new Map<string, NflPlayerSeason>();
  for (const p of [...b.passing, ...b.rushing, ...b.receiving]) {
    const prev = map.get(p.espnId);
    map.set(p.espnId, prev ? { ...prev, s: { ...prev.s, ...p.s } } : p);
  }
  return [...map.values()];
}

const NFL_MARKETS: Record<string, string> = {
  "Total Passing Yards (incl. overtime)": "Pass Yds", "Total Passing Touchdowns (incl. overtime)": "Pass TDs",
  "Total Rushing Yards (incl. overtime)": "Rush Yds", "Total Receiving Yards (incl. overtime)": "Rec Yds", "Total Receptions (incl. overtime)": "Receptions",
};

/** Real DraftKings lines for one NFL game, keyed `${espnId}:${market}`. */
export async function getNflGameLines(gameId: string) {
  const lines = await getEventPropLines("football/leagues/nfl", gameId, (n) => n in NFL_MARKETS, { maxPages: 2 });
  return new Map(lines.map((l) => [`${l.athleteId}:${NFL_MARKETS[l.market]}`, { line: l.line, openLine: l.openLine, updated: l.updated }]));
}

export interface NflPropsPayload {
  props: NflPropPlay[];
  games: NflSeasonGame[];
  weekLabel: string;
  liveLines: number;
}

/** Props for the current/next slate that still has games to play. */
export async function getNflProps(): Promise<NflPropsPayload> {
  const cur = await getNflCurrentWeek();
  let week = await getNflWeek(cur.seasonType, cur.week);
  let games = week.games.filter((g) => g.status !== "final");
  if (games.length === 0 && cur.seasonType === 2 && cur.week < 18) {
    week = await getNflWeek(2, cur.week + 1);
    games = week.games.filter((g) => g.status !== "final");
  }
  const [pool, standings] = await Promise.all([getNflPropPool(), getNflStandings()]);
  const lineMaps = await Promise.all(games.map((g) => getNflGameLines(g.id)));
  const props = buildNflProps(
    pool,
    games.map((g, i) => ({ id: g.id, away: g.away, home: g.home, kickoff: `${g.dateLabel} · ${g.timeLabel}`, total: g.odds?.overUnder, homeSpread: g.odds?.homeSpread, lines: lineMaps[i] })),
    nflStandingsMap(standings),
  );
  return { props, games, weekLabel: week.label, liveLines: lineMaps.filter((m) => m.size > 0).length };
}

/* ── Game detail ─────────────────────────────────────────────────────────── */

const TEAM_ROWS: { label: string; match: RegExp; invert?: boolean }[] = [
  { label: "Points / game", match: /^Points Per Game$/i },
  { label: "Total yards", match: /^Total Yards$/i },
  { label: "Passing yards", match: /^Yards Passing$/i },
  { label: "Rushing yards", match: /^Yards Rushing$/i },
  { label: "Points allowed", match: /^Points Allowed Per Game$/i, invert: true },
  { label: "Yards allowed", match: /^Yards Allowed$/i, invert: true },
];

export async function getNflGameDetail(eventId: string): Promise<NflGameDetail | null> {
  const [data, standings] = await Promise.all([getJson(`${SITE}/summary?event=${eventId}`, 120), getNflStandings()]);
  if (!data) return null;
  const comp = data.header?.competitions?.[0];
  if (!comp) return null;
  const st = nflStandingsMap(standings);
  const wk = data.header?.week ?? 0;
  const stype = (data.header?.season?.type ?? 2) as 1 | 2 | 3;
  const ev = {
    id: eventId, date: comp.date,
    competitions: [{ ...comp, odds: data.pickcenter?.length ? data.pickcenter : comp.odds, venue: data.gameInfo?.venue ?? comp.venue }],
  };
  const game = mapNflSeasonEvent(ev, stype, wk, nflWeekLabel(stype, wk), st);
  if (!game) return null;

  const teams: any[] = data.boxscore?.teams ?? [];
  const by = (abbr: string) => teams.find((t) => t.team?.abbreviation === abbr);
  const at = by(game.away), ht = by(game.home);
  const teamStats: NflTeamStatRow[] = [];
  if (at && ht) {
    for (const r of TEAM_ROWS) {
      const a = at.statistics?.find((s: any) => r.match.test(s.label ?? s.name ?? ""));
      const h = ht.statistics?.find((s: any) => r.match.test(s.label ?? s.name ?? ""));
      if (!a || !h) continue;
      const av = parseFloat(a.displayValue) || 0, hv = parseFloat(h.displayValue) || 0;
      const tot = av + hv || 1;
      let ap = (av / tot) * 100, hp = (hv / tot) * 100;
      if (r.invert) [ap, hp] = [hp, ap];
      teamStats.push({ label: r.label, away: a.displayValue, home: h.displayValue, awayPct: Math.round(ap), homePct: Math.round(hp) });
    }
  }

  const injuries: NflGameDetail["injuries"] = [];
  for (const i of data.injuries ?? []) {
    for (const x of (i.injuries ?? []).slice(0, 5)) {
      injuries.push({ team: i.team?.abbreviation ?? "", player: x.athlete?.displayName ?? "", status: x.status ?? "", pos: x.athlete?.position?.abbreviation ?? "" });
    }
  }

  const wp: any[] = Array.isArray(data.winprobability) ? data.winprobability : [];
  const winProbSeries = wp.map((w) => Math.round((w.homeWinPercentage ?? 0.5) * 100));
  const pred = data.predictor?.homeTeam?.gameProjection;

  return {
    game, teamStats, injuries, winProbSeries,
    predictorHome: pred != null ? Math.round(parseFloat(pred)) : undefined,
    venueImage: data.gameInfo?.venue?.images?.[0]?.href,
    recap: data.article?.headline,
  };
}

export { gradeFromEdge };
