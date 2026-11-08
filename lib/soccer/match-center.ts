import "server-only";
import { SOCCER_LEAGUES, LEAGUE_MAP } from "./leagues";
import { fetchAllSoccerFixtures } from "./espn";
import { liveOutcome, poissonModel, tableRowsFromEntries, type TableRow } from "./model";
import type { SoccerLeagueKey, SoccerMatch } from "./types";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer";
const V2 = "https://site.api.espn.com/apis/v2/sports/soccer";

async function getJson(url: string, revalidate: number): Promise<any | null> {
  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/* ── League tables ───────────────────────────────────────────────────────── */

export async function getLeagueTable(key: SoccerLeagueKey): Promise<TableRow[]> {
  const def = LEAGUE_MAP[key];
  const data = await getJson(`${V2}/${def.slug}/standings`, 900);
  const entries: any[] = [];
  const walk = (node: any) => {
    for (const e of node?.standings?.entries ?? []) entries.push(e);
    for (const c of node?.children ?? []) walk(c);
  };
  walk(data);
  return tableRowsFromEntries(entries);
}

export async function getAllTables(): Promise<Record<SoccerLeagueKey, TableRow[]>> {
  const res = await Promise.all(SOCCER_LEAGUES.map(async (l) => [l.key, await getLeagueTable(l.key)] as const));
  return Object.fromEntries(res) as Record<SoccerLeagueKey, TableRow[]>;
}

/* ── Fixtures with model probabilities ───────────────────────────────────── */

export async function getSoccerFixtures(dateStr?: string): Promise<SoccerMatch[]> {
  const [matches, tables] = await Promise.all([fetchAllSoccerFixtures(dateStr), getAllTables()]);
  return matches
    .map((m) => {
      const rows = tables[m.league] ?? [];
      const h = rows.find((r) => r.id === m.homeTeam.id), a = rows.find((r) => r.id === m.awayTeam.id);
      const mod = poissonModel(h, a, rows);
      return { ...m, model: { home: mod.home, draw: mod.draw, away: mod.away, xgHome: mod.xgHome, xgAway: mod.xgAway } };
    })
    .sort((a, b) => {
      const rank = (s: SoccerMatch["status"]) => (s === "live" ? 0 : s === "pre" ? 1 : 2);
      return rank(a.status) - rank(b.status) || a.date.localeCompare(b.date);
    });
}

/* ── Match centre ────────────────────────────────────────────────────────── */

export interface MatchStatRow { label: string; home: string; away: string; homePct: number; awayPct: number }
export interface MatchEvent { minute: string; sort: number; type: "goal" | "yellow" | "red" | "sub" | "pen-miss"; side: "home" | "away"; player: string; assist?: string; text: string }
export interface MomentumBucket { label: string; home: number; away: number; goalsHome: number; goalsAway: number }
export interface LineupPlayer {
  id: string; name: string; jersey: string; pos: string; place: number; starter: boolean;
  goals: number; assists: number; shots: number; sot: number; saves: number; yellow: number; red: number;
}
export interface BestPlayer extends LineupPlayer { side: "home" | "away"; score: number }

export interface SoccerMatchCenter {
  match: SoccerMatch;
  league: { key: SoccerLeagueKey; name: string; season?: string };
  stats: MatchStatRow[];
  xg: { home: number; away: number; basis: "model" | "shots" };
  events: MatchEvent[];
  momentum: MomentumBucket[];
  lineups: { home: { formation: string; players: LineupPlayer[] }; away: { formation: string; players: LineupPlayer[] } };
  best?: BestPlayer;
  odds?: { homeML?: number; drawML?: number; awayML?: number; overUnder?: number; overOdds?: number; underOdds?: number; provider?: string };
  form: { home: string[]; away: string[] };
  records: { home?: string; away?: string };
  table: (TableRow & { isMatch: boolean })[];
  model: ReturnType<typeof poissonModel> & { pick: string; reason: string; edge: number; grade: string; value?: { side: "home" | "draw" | "away"; modelPct: number; marketPct: number } };
  video?: { thumbnail: string; href: string; title: string };
  recap?: string;
  /** In-play state — only for live matches */
  live?: {
    minute: number;
    clock: string;
    progress: number;
    prob: { home: number; draw: number; away: number };
    probStart: { home: number; draw: number; away: number };
    recent: { minute: string; text: string; type: string }[];
  };
}

const num = (v: any) => (v == null ? 0 : parseFloat(String(v)) || 0);
const stat = (list: any[] | undefined, name: string) => list?.find((s) => s.name === name);

function impliedProb(ml?: number): number | undefined {
  if (ml == null || isNaN(ml)) return undefined;
  return ml > 0 ? 100 / (ml + 100) : -ml / (-ml + 100);
}

function minuteSort(clock: string): number {
  const m = clock.match(/(\d+)'(?:\+(\d+)')?/);
  return m ? parseInt(m[1]) + (m[2] ? parseInt(m[2]) / 100 : 0) : 0;
}

const PLAY_WEIGHT: Record<string, number> = {
  Goal: 5, "Penalty - Scored": 5, "Shot On Target": 3, "Shot Off Target": 1.6, "Shot Blocked": 1.8, "Corner Awarded": 1.2, "Free Kick Won": 0.4, Offside: 0.4,
};

export async function getSoccerMatchCenter(league: SoccerLeagueKey, eventId: string): Promise<SoccerMatchCenter | null> {
  const def = LEAGUE_MAP[league];
  if (!def) return null;
  const [data, table] = await Promise.all([getJson(`${BASE}/${def.slug}/summary?event=${eventId}`, 60), getLeagueTable(league)]);
  if (!data) return null;
  const comp = data.header?.competitions?.[0];
  if (!comp) return null;

  const hc = comp.competitors?.find((c: any) => c.homeAway === "home");
  const ac = comp.competitors?.find((c: any) => c.homeAway === "away");
  if (!hc || !ac) return null;
  const mkTeam = (c: any) => {
    const t = c.team ?? {};
    const raw = t.color ?? "7c5cfa";
    return {
      id: String(t.id ?? ""), name: t.displayName ?? "", shortName: t.shortDisplayName ?? t.abbreviation ?? "", abbr: t.abbreviation ?? "",
      logo: t.logos?.[0]?.href ?? t.logo ?? `https://a.espncdn.com/i/teamlogos/soccer/500/${t.id}.png`,
      hex: raw.startsWith("#") ? raw : `#${raw}`,
    };
  };
  const state = comp.status?.type?.state;
  const status: SoccerMatch["status"] = state === "in" ? "live" : state === "post" ? "final" : "pre";
  const match: SoccerMatch = {
    id: eventId, league, date: comp.date, status,
    homeTeam: mkTeam(hc), awayTeam: mkTeam(ac),
    homeScore: status !== "pre" ? num(hc.score) : undefined, awayScore: status !== "pre" ? num(ac.score) : undefined,
    venue: data.gameInfo?.venue?.fullName, clock: comp.status?.displayClock, statusDetail: comp.status?.type?.shortDetail,
  };

  /* Team stats */
  const teams: any[] = data.boxscore?.teams ?? [];
  const ht = teams.find((t) => t.homeAway === "home") ?? teams[0];
  const at = teams.find((t) => t.homeAway === "away") ?? teams[1];
  const ROWS: [string, string, boolean?][] = [
    ["Possession", "possessionPct"], ["Shots", "totalShots"], ["On target", "shotsOnTarget"], ["Corners", "wonCorners"],
    ["Pass accuracy", "passPct"], ["Fouls", "foulsCommitted", true], ["Offsides", "offsides", true], ["Saves", "saves"],
    ["Tackles won", "effectiveTackles"], ["Interceptions", "interceptions"],
  ];
  const stats: MatchStatRow[] = [];
  if (ht && at) {
    for (const [label, key, invert] of ROWS) {
      const a = stat(ht.statistics, key), b = stat(at.statistics, key);
      if (!a || !b) continue;
      let hv = num(a.displayValue), av = num(b.displayValue);
      if (key === "passPct") { hv = hv <= 1 ? hv * 100 : hv; av = av <= 1 ? av * 100 : av; }
      const tot = hv + av || 1;
      let hp = (hv / tot) * 100, ap = (av / tot) * 100;
      if (invert) [hp, ap] = [ap, hp];
      const fmt = (v: number) => (key === "possessionPct" || key === "passPct" ? `${Math.round(v)}%` : String(Math.round(v)));
      stats.push({ label, home: fmt(hv), away: fmt(av), homePct: Math.round(hp), awayPct: Math.round(ap) });
    }
  }

  /* xG — model before kickoff, shot-based estimate afterwards */
  const hRow = table.find((r) => r.id === match.homeTeam.id), aRow = table.find((r) => r.id === match.awayTeam.id);
  const model0 = poissonModel(hRow, aRow, table);
  const shotXg = (t: any) => {
    if (!t) return 0;
    const shots = num(stat(t.statistics, "totalShots")?.displayValue), sot = num(stat(t.statistics, "shotsOnTarget")?.displayValue);
    const pens = num(stat(t.statistics, "penaltyKickShots")?.displayValue);
    return Math.round((0.3 * Math.max(0, sot - pens) + 0.045 * Math.max(0, shots - sot) + 0.76 * pens) * 100) / 100;
  };
  const xg = status === "pre" ? { home: model0.xgHome, away: model0.xgAway, basis: "model" as const } : { home: shotXg(ht), away: shotXg(at), basis: "shots" as const };

  /* Events & momentum */
  const homeId = match.homeTeam.id;
  const sideOf = (teamId?: string): "home" | "away" => (String(teamId) === homeId ? "home" : "away");
  const events: MatchEvent[] = [];
  for (const k of data.keyEvents ?? []) {
    const t = k.type?.text as string;
    const type = t === "Goal" || t === "Penalty - Scored" || t === "Own Goal" ? "goal" : t === "Yellow Card" ? "yellow" : t === "Red Card" ? "red" : t === "Substitution" ? "sub" : null;
    if (!type) continue;
    const parts = k.participants ?? [];
    const clock = k.clock?.displayValue ?? "";
    events.push({
      minute: clock, sort: minuteSort(clock), type, side: sideOf(k.team?.id),
      player: parts[0]?.athlete?.displayName ?? "", assist: type === "goal" ? parts[1]?.athlete?.displayName : undefined,
      text: k.shortText ?? k.text ?? "",
    });
  }
  events.sort((a, b) => a.sort - b.sort);

  const buckets = ["0-15", "15-30", "30-45", "45-60", "60-75", "75-90"].map((label) => ({ label, home: 0, away: 0, goalsHome: 0, goalsAway: 0 }));
  const bucketOf = (min: number) => Math.min(5, Math.floor(Math.max(0, min - 0.01) / 15));
  const homeName = match.homeTeam.name;
  for (const c of data.commentary ?? []) {
    const type = c.play?.type?.text as string | undefined;
    const w = type ? PLAY_WEIGHT[type] : undefined;
    if (!w) continue;
    const min = minuteSort(c.time?.displayValue ?? c.play?.clock?.displayValue ?? "");
    const teamName = c.play?.team?.displayName;
    const side = teamName ? (teamName === homeName ? "home" : "away") : null;
    if (!side) continue;
    buckets[bucketOf(min)][side] += w;
  }
  for (const e of events) if (e.type === "goal") buckets[bucketOf(e.sort)][e.side === "home" ? "goalsHome" : "goalsAway"]++;
  const maxB = Math.max(1, ...buckets.map((b) => Math.max(b.home, b.away)));
  const momentum: MomentumBucket[] = buckets.map((b) => ({ ...b, home: Math.round((b.home / maxB) * 100), away: Math.round((b.away / maxB) * 100) }));

  /* Lineups + best player */
  const mkLineup = (r: any) => ({
    formation: r?.formation ?? "",
    players: (r?.roster ?? []).filter((p: any) => p.starter || p.subbedIn).map((p: any) => ({
      id: String(p.athlete?.id ?? ""), name: p.athlete?.displayName ?? "", jersey: String(p.jersey ?? ""), pos: p.position?.abbreviation ?? "",
      place: parseInt(p.formationPlace ?? "0") || 0, starter: !!p.starter,
      goals: num(stat(p.stats, "totalGoals")?.value), assists: num(stat(p.stats, "goalAssists")?.value),
      shots: num(stat(p.stats, "totalShots")?.value), sot: num(stat(p.stats, "shotsOnTarget")?.value), saves: num(stat(p.stats, "saves")?.value),
      yellow: num(stat(p.stats, "yellowCards")?.value), red: num(stat(p.stats, "redCards")?.value),
    } satisfies LineupPlayer)),
  });
  const rosterH = data.rosters?.find((r: any) => r.homeAway === "home") ?? data.rosters?.[0];
  const rosterA = data.rosters?.find((r: any) => r.homeAway === "away") ?? data.rosters?.[1];
  const lineups = { home: mkLineup(rosterH), away: mkLineup(rosterA) };
  let best: BestPlayer | undefined;
  if (status !== "pre") {
    for (const side of ["home", "away"] as const) {
      for (const p of lineups[side].players) {
        const score = p.goals * 5 + p.assists * 3 + p.sot * 1.1 + p.shots * 0.3 + p.saves * 0.7 - p.red * 3 - p.yellow * 0.2;
        if (score > 0 && (!best || score > best.score)) best = { ...p, side, score };
      }
    }
  }

  /* Market odds */
  const pc = data.pickcenter?.[0];
  const odds = pc ? {
    provider: pc.provider?.name, homeML: pc.homeTeamOdds?.moneyLine, awayML: pc.awayTeamOdds?.moneyLine, drawML: pc.drawOdds?.moneyLine,
    overUnder: pc.overUnder, overOdds: pc.overOdds, underOdds: pc.underOdds,
  } : undefined;

  /* Model pick vs market */
  const outcomes = [
    { side: "home" as const, p: model0.home, ml: odds?.homeML, label: match.homeTeam.shortName },
    { side: "draw" as const, p: model0.draw, ml: odds?.drawML, label: "Draw" },
    { side: "away" as const, p: model0.away, ml: odds?.awayML, label: match.awayTeam.shortName },
  ];
  const mktSum = outcomes.reduce((a, o) => a + (impliedProb(o.ml) ?? 0), 0) || 1;
  let value: SoccerMatchCenter["model"]["value"];
  let bestGap = 0;
  for (const o of outcomes) {
    const imp = impliedProb(o.ml);
    if (imp == null) continue;
    const market = (imp / mktSum) * 100;
    if (o.p - market > bestGap) { bestGap = o.p - market; value = { side: o.side, modelPct: o.p, marketPct: Math.round(market) }; }
  }
  const top = [...outcomes].sort((a, b) => b.p - a.p)[0];
  const edge = Math.max(41, Math.min(94, Math.round(42 + (top.p - 33) * 0.9 + bestGap * 1.6)));
  const grade = edge >= 80 ? "A+" : edge >= 72 ? "A" : edge >= 64 ? "B+" : edge >= 55 ? "B" : edge >= 46 ? "C+" : "C";
  const pick = top.side === "draw" ? "Draw" : `${top.label} ML`;
  const gd = (r?: TableRow) => (r ? `${r.gf} scored / ${r.ga} conceded in ${r.gp}` : "");
  const reason = `${match.homeTeam.shortName} (${gd(hRow)}) vs ${match.awayTeam.shortName} (${gd(aRow)}) → model xG ${model0.xgHome}–${model0.xgAway}.` +
    (value && bestGap >= 4 ? ` The market prices ${value.side === "draw" ? "the draw" : value.side === "home" ? match.homeTeam.shortName : match.awayTeam.shortName} at ${value.marketPct}% vs the model's ${value.modelPct}%.` : "");

  /* Form */
  const form: { home: string[]; away: string[] } = { home: [], away: [] };
  for (const f of data.lastFiveGames ?? []) {
    const side = String(f.team?.id) === homeId ? "home" : "away";
    form[side] = (f.events ?? []).slice(0, 5).map((e: any) => e.gameResult ?? "?");
  }

  /* Table slice around the two teams */
  const idx = (r?: TableRow) => (r ? table.findIndex((t) => t.id === r.id) : -1);
  const ranks = [idx(hRow), idx(aRow)].filter((i) => i >= 0);
  const lo = ranks.length ? Math.max(0, Math.min(...ranks) - 1) : 0;
  const hi = ranks.length ? Math.min(table.length, Math.max(...ranks) + 2) : Math.min(5, table.length);
  const tableSlice = table.slice(lo, Math.max(hi, lo + 5)).map((r) => ({ ...r, isMatch: r.id === match.homeTeam.id || r.id === match.awayTeam.id }));

  const vid = data.videos?.[0];
  let live: SoccerMatchCenter["live"];
  if (status === "live") {
    const minute = minuteSort(match.clock ?? "");
    const recent = (data.commentary ?? [])
      .filter((c: any) => c.text && !/^(lineup|substitution|delay|match ends)/i.test(c.text))
      .slice(-12).reverse()
      .map((c: any) => ({ minute: c.time?.displayValue ?? c.play?.clock?.displayValue ?? "", text: String(c.text), type: c.play?.type?.text ?? "" }));
    live = {
      minute, clock: match.clock ?? "", progress: Math.min(100, (minute / 90) * 100),
      prob: liveOutcome(model0.xgHome, model0.xgAway, match.homeScore ?? 0, match.awayScore ?? 0, minute),
      probStart: { home: model0.home, draw: model0.draw, away: model0.away },
      recent,
    };
  }
  return {
    live,
    match,
    league: { key: league, name: data.header?.league?.name ?? def.label, season: data.header?.season?.displayName ?? data.header?.league?.season?.displayName },
    stats, xg, events, momentum, lineups, best, odds,
    form, records: { home: hc.record?.find((r: any) => r.type === "total")?.summary, away: ac.record?.find((r: any) => r.type === "total")?.summary },
    table: tableSlice,
    model: { ...model0, pick, reason, edge, grade, value },
    video: vid?.thumbnail ? { thumbnail: vid.thumbnail, href: vid.links?.web?.href ?? vid.links?.source?.href ?? "", title: vid.headline ?? vid.title ?? "Highlights" } : undefined,
    recap: data.article?.headline,
  };
}
