import "server-only";
import { NBA_TEAMS } from "./teams";
import { modelNbaGame, powerRating } from "./analytics";
import { nbaSeasonStartYear } from "@/lib/season";
import type {
  NbaBoxPlayer, NbaCupData, NbaCupGroup, NbaCupRow, NbaGame, NbaGameDetail, NbaOdds,
  NbaPlayerSeason, NbaStandingRow, NbaTeamStatRow,
} from "./types";

const SITE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";
const V2 = "https://site.api.espn.com/apis/v2/sports/basketball/nba";

async function getJson(url: string, revalidate: number): Promise<any | null> {
  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const stat = (entry: any, name: string): string | undefined =>
  entry?.stats?.find((s: any) => s.name === name)?.displayValue;
const statNum = (entry: any, name: string): number => {
  const v = entry?.stats?.find((s: any) => s.name === name)?.value;
  return typeof v === "number" ? v : parseFloat(stat(entry, name) ?? "0") || 0;
};

/* ── Standings ───────────────────────────────────────────────────────────── */

export async function getNbaStandings(): Promise<NbaStandingRow[]> {
  const data = await getJson(`${V2}/standings`, 600);
  const out: NbaStandingRow[] = [];
  for (const child of data?.children ?? []) {
    const conf: "East" | "West" = /east/i.test(child.name) ? "East" : "West";
    const entries: any[] = child.standings?.entries ?? [];
    const rows = entries.map((e) => {
      const wins = statNum(e, "wins");
      const losses = statNum(e, "losses");
      const gp = wins + losses;
      const ppg = statNum(e, "avgPointsFor");
      const oppg = statNum(e, "avgPointsAgainst");
      const diff = Math.round((ppg - oppg) * 10) / 10;
      const abbr: string = e.team?.abbreviation ?? "";
      return {
        teamId: String(e.team?.id ?? ""),
        abbr,
        name: e.team?.displayName ?? NBA_TEAMS[abbr]?.name ?? abbr,
        conf,
        rank: 0,
        wins, losses,
        pct: gp ? wins / gp : 0,
        gb: stat(e, "gamesBehind") ?? "-",
        streak: stat(e, "streak") ?? "-",
        l10: stat(e, "Last Ten Games") ?? "-",
        home: stat(e, "Home") ?? "-",
        road: stat(e, "Road") ?? "-",
        ppg, oppg, diff, gp,
        power: Math.round(powerRating(diff, gp) * 10) / 10,
      } satisfies NbaStandingRow;
    });
    rows.sort((a, b) => b.pct - a.pct || b.diff - a.diff);
    rows.forEach((r, i) => (r.rank = i + 1));
    out.push(...rows);
  }
  return out;
}

export function standingsMap(rows: NbaStandingRow[]): Map<string, NbaStandingRow> {
  return new Map(rows.map((r) => [r.abbr, r]));
}

/* ── Scoreboard ──────────────────────────────────────────────────────────── */

function parseOdds(comp: any, homeAbbr: string): NbaOdds | undefined {
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
    homeML: o.moneyline?.home?.close?.odds,
    awayML: o.moneyline?.away?.close?.odds,
    details: o.details,
  };
}

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/New_York" }).toUpperCase();
}
function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
}

export function mapNbaEvent(ev: any, st: Map<string, NbaStandingRow>): NbaGame | null {
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
    const model = modelNbaGame(st.get(hAbbr), st.get(aAbbr), odds?.homeSpread);
    const cupNote = (comp.notes ?? []).find((n: any) => /cup/i.test(n.headline ?? ""));
    const rec = (c: any) => c.records?.find((r: any) => r.type === "total" || r.name === "overall")?.summary;
    return {
      id: String(ev.id),
      date: comp.date ?? ev.date,
      dateLabel: dateLabel(comp.date ?? ev.date),
      timeLabel: timeLabel(comp.date ?? ev.date),
      venue: comp.venue?.fullName ?? "",
      away: aAbbr, home: hAbbr,
      awayScore: status !== "pre" ? Number(away.score) : undefined,
      homeScore: status !== "pre" ? Number(home.score) : undefined,
      awayRecord: rec(away), homeRecord: rec(home),
      status,
      statusDetail: status === "pre" ? timeLabel(comp.date ?? ev.date) : (comp.status?.type?.shortDetail ?? (status === "final" ? "FINAL" : "LIVE")),
      period: comp.status?.period, clock: comp.status?.displayClock,
      isCup: !!cupNote,
      cupLabel: cupNote?.headline,
      broadcast: comp.broadcasts?.[0]?.names?.[0],
      odds,
      headline: comp.headlines?.[0]?.shortLinkText ?? comp.headlines?.[0]?.description,
      homeWinProb: model.homeWinProb, edge: model.edge, grade: model.grade,
    };
  } catch {
    return null;
  }
}

/** dateStr = YYYYMMDD (ET). Omit for "today". */
export async function getNbaSchedule(dateStr?: string): Promise<NbaGame[]> {
  const [data, standings] = await Promise.all([
    getJson(`${SITE}/scoreboard${dateStr ? `?dates=${dateStr}` : ""}`, 60),
    getNbaStandings(),
  ]);
  const st = standingsMap(standings);
  const events: any[] = data?.events ?? [];
  return events
    .map((e) => mapNbaEvent(e, st))
    .filter((g): g is NbaGame => g !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/* ── Emirates NBA Cup ────────────────────────────────────────────────────── */

function ymd(d: Date) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

export async function getNbaCup(): Promise<NbaCupData> {
  const startYear = nbaSeasonStartYear();
  const standings = await getNbaStandings();
  const st = standingsMap(standings);

  // Group play + knockouts live on Tue/Wed/Fri/Sat between late Oct and late Dec.
  // ESPN's NBA scoreboard rejects multi-day ranges, so fetch those days individually (cached).
  const days: string[] = [];
  const cursor = new Date(startYear, 9, 28); // Oct 28
  const end = new Date(startYear, 11, 24);   // Dec 24
  while (cursor < end) {
    if ([2, 3, 5, 6].includes(cursor.getDay())) days.push(ymd(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  const batches = await Promise.all(days.map((d) => getJson(`${SITE}/scoreboard?dates=${d}`, 900)));
  const cupGames: NbaGame[] = [];
  for (const b of batches) {
    for (const ev of b?.events ?? []) {
      const g = mapNbaEvent(ev, st);
      if (g?.isCup) cupGames.push(g);
    }
  }
  cupGames.sort((a, b) => a.date.localeCompare(b.date));

  const groupGames = cupGames.filter((g) => /group/i.test(g.cupLabel ?? ""));
  const knockout = cupGames.filter((g) => !/group/i.test(g.cupLabel ?? ""));

  // Union-find: teams that play each other in group play share a group.
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    if (!parent.has(x)) parent.set(x, x);
    const p = parent.get(x)!;
    if (p === x) return x;
    const r = find(p);
    parent.set(x, r);
    return r;
  };
  for (const g of groupGames) parent.set(find(g.away), find(g.home));

  const rowsByTeam = new Map<string, NbaCupRow>();
  const row = (abbr: string) => {
    if (!rowsByTeam.has(abbr)) rowsByTeam.set(abbr, { abbr, wins: 0, losses: 0, pf: 0, pa: 0, diff: 0 });
    return rowsByTeam.get(abbr)!;
  };
  let played = 0;
  for (const g of groupGames) {
    const a = row(g.away), h = row(g.home);
    if (g.status !== "final") continue;
    played++;
    a.pf += g.awayScore ?? 0; a.pa += g.homeScore ?? 0;
    h.pf += g.homeScore ?? 0; h.pa += g.awayScore ?? 0;
    if ((g.awayScore ?? 0) > (g.homeScore ?? 0)) { a.wins++; h.losses++; } else { h.wins++; a.losses++; }
  }
  rowsByTeam.forEach((r) => (r.diff = r.pf - r.pa));

  const grouped = new Map<string, NbaCupRow[]>();
  rowsByTeam.forEach((r) => {
    const root = find(r.abbr);
    grouped.set(root, [...(grouped.get(root) ?? []), r]);
  });
  const rank = (a: NbaCupRow, b: NbaCupRow) => b.wins - a.wins || b.diff - a.diff || b.pf - a.pf;

  const groups: NbaCupGroup[] = [];
  grouped.forEach((rows, root) => {
    rows.sort(rank);
    const conf = NBA_TEAMS[rows[0].abbr]?.conf ?? "East";
    groups.push({ id: root, conf, label: "", rows });
  });
  // Stable naming: order by the leader's abbr inside each conference
  for (const conf of ["East", "West"] as const) {
    const inConf = groups.filter((g) => g.conf === conf).sort((a, b) => a.rows[0].abbr.localeCompare(b.rows[0].abbr));
    inConf.forEach((g, i) => (g.label = `${conf} Group ${String.fromCharCode(65 + i)}`));
    // Group winners advance; best runner-up per conference takes the wild card
    inConf.forEach((g) => (g.rows[0].q = "adv"));
    const wc = inConf.map((g) => g.rows[1]).filter(Boolean).sort(rank)[0];
    if (wc) wc.q = "wc";
  }
  groups.sort((a, b) => a.label.localeCompare(b.label));

  return { groups, games: groupGames, knockout, played, total: groupGames.length };
}

/* ── Game summary ────────────────────────────────────────────────────────── */

const TEAM_STAT_ROWS: { name: string; label: string; invert?: boolean }[] = [
  { name: "fieldGoalPct", label: "FG %" },
  { name: "threePointFieldGoalPct", label: "3PT %" },
  { name: "freeThrowPct", label: "FT %" },
  { name: "totalRebounds", label: "Rebounds" },
  { name: "assists", label: "Assists" },
  { name: "turnovers", label: "Turnovers", invert: true },
  { name: "steals", label: "Steals" },
  { name: "blocks", label: "Blocks" },
  { name: "pointsInPaint", label: "Points in paint" },
  { name: "fastBreakPoints", label: "Fast-break pts" },
];

export async function getNbaGameDetail(eventId: string): Promise<NbaGameDetail | null> {
  const [data, standings] = await Promise.all([
    getJson(`${SITE}/summary?event=${eventId}`, 120),
    getNbaStandings(),
  ]);
  if (!data) return null;
  const comp = data.header?.competitions?.[0];
  if (!comp) return null;
  const st = standingsMap(standings);

  // Reuse the scoreboard mapper — summary's header competition has the same shape plus pickcenter odds.
  const evLike = {
    id: eventId, date: comp.date,
    competitions: [{
      ...comp,
      odds: data.pickcenter?.length ? data.pickcenter : comp.odds,
      venue: data.gameInfo?.venue ?? comp.venue,
      notes: comp.notes ?? [],
    }],
  };
  const game = mapNbaEvent(evLike, st);
  if (!game) return null;

  // Team stat comparison
  const teams: any[] = data.boxscore?.teams ?? [];
  const byAbbr = (abbr: string) => teams.find((t) => t.team?.abbreviation === abbr);
  const at = byAbbr(game.away), ht = byAbbr(game.home);
  const teamStats: NbaTeamStatRow[] = [];
  if (at && ht) {
    for (const r of TEAM_STAT_ROWS) {
      const a = at.statistics?.find((s: any) => s.name === r.name);
      const h = ht.statistics?.find((s: any) => s.name === r.name);
      if (!a || !h) continue;
      const av = parseFloat(a.displayValue) || 0, hv = parseFloat(h.displayValue) || 0;
      const tot = av + hv || 1;
      let ap = (av / tot) * 100, hp = (hv / tot) * 100;
      if (r.invert) [ap, hp] = [hp, ap];
      teamStats.push({ label: r.label, away: a.displayValue, home: h.displayValue, awayPct: Math.round(ap), homePct: Math.round(hp) });
    }
  }

  // Leaders
  const leaders: NbaGameDetail["leaders"] = [];
  for (const l of data.leaders ?? []) {
    for (const cat of l.leaders ?? []) {
      const top = cat.leaders?.[0];
      if (!top) continue;
      leaders.push({
        team: l.team?.abbreviation ?? "", category: cat.displayName ?? cat.name,
        value: top.displayValue, player: top.athlete?.displayName ?? "", espnId: String(top.athlete?.id ?? ""),
      });
    }
  }

  // Box score
  const box: NbaGameDetail["box"] = { away: [], home: [] };
  for (const p of data.boxscore?.players ?? []) {
    const abbr = p.team?.abbreviation;
    const block = p.statistics?.[0];
    if (!block) continue;
    const labels: string[] = block.labels ?? [];
    const idx = (l: string) => labels.indexOf(l);
    const rows: NbaBoxPlayer[] = (block.athletes ?? [])
      .filter((a: any) => a.stats?.length)
      .map((a: any) => ({
        espnId: String(a.athlete?.id ?? ""),
        name: a.athlete?.displayName ?? "",
        pos: a.athlete?.position?.abbreviation ?? "",
        min: a.stats[idx("MIN")] ?? "", pts: a.stats[idx("PTS")] ?? "", reb: a.stats[idx("REB")] ?? "",
        ast: a.stats[idx("AST")] ?? "", fg: a.stats[idx("FG")] ?? "", tp: a.stats[idx("3PT")] ?? "", pm: a.stats[idx("+/-")] ?? "",
      }));
    rows.sort((x, y) => (parseInt(y.pts) || 0) - (parseInt(x.pts) || 0));
    if (abbr === game.away) box.away = rows;
    else if (abbr === game.home) box.home = rows;
  }

  const wp: any[] = Array.isArray(data.winprobability) ? data.winprobability : [];
  const winProbSeries = wp.map((w) => Math.round((w.homeWinPercentage ?? 0.5) * 100));

  const injuries: NbaGameDetail["injuries"] = [];
  for (const i of data.injuries ?? []) {
    for (const x of (i.injuries ?? []).slice(0, 4)) {
      injuries.push({ team: i.team?.abbreviation ?? "", player: x.athlete?.displayName ?? "", status: x.status ?? "" });
    }
  }

  return { game, teamStats, leaders, box, winProbSeries, injuries, recap: data.article?.headline ?? game.headline };
}

/* ── Player season stats & props ─────────────────────────────────────────── */

export async function getNbaPlayerSeasons(limit = 150): Promise<NbaPlayerSeason[]> {
  const season = nbaSeasonStartYear() + 1;
  const url =
    `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete` +
    `?region=us&lang=en&contentorigin=espn&isqualified=false&page=1&limit=${limit}` +
    `&sort=offensive.avgPoints%3Adesc&season=${season}&seasontype=2`;
  const data = await getJson(url, 900);
  if (!data) return [];
  const cats: any[] = data.categories ?? [];
  const out: NbaPlayerSeason[] = [];
  for (const a of data.athletes ?? []) {
    const v: Record<string, number> = {};
    (a.categories ?? []).forEach((c: any, i: number) => {
      const names: string[] = cats[i]?.names ?? [];
      names.forEach((n, j) => (v[n] = c.values?.[j]));
    });
    out.push({
      espnId: String(a.athlete?.id ?? ""),
      name: a.athlete?.displayName ?? "",
      team: a.athlete?.teamShortName ?? "",
      gp: v.gamesPlayed ?? 0, min: v.avgMinutes ?? 0,
      pts: v.avgPoints ?? 0, reb: v.avgRebounds ?? 0, ast: v.avgAssists ?? 0,
      tpm: v.avgThreePointFieldGoalsMade ?? 0, stl: v.avgSteals ?? 0, blk: v.avgBlocks ?? 0,
      fgPct: v.fieldGoalPct ?? 0, tpPct: v.threePointFieldGoalPct ?? 0,
    });
  }
  return out;
}
