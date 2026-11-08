import "server-only";
import { normCdf } from "@/lib/nba/analytics";
import { poissonModel, type TableRow } from "@/lib/soccer/model";
import { SOCCER_LEAGUES } from "@/lib/soccer/leagues";
import { nbaSeasonStartYear } from "@/lib/season";

/**
 * Out-of-sample model scorecards. Every game is predicted using ONLY the games that were played before it
 * (ratings are rebuilt from scratch, day by day / week by week), then compared with what actually happened.
 * Win-probability model only — prop lines aren't stored, so props are not graded here.
 */

export interface BacktestPick {
  id: string;
  date: string;
  matchup: string;
  result: string;
  pick: string;
  prob: number;
  correct: boolean;
}

export interface CalibrationBucket { label: string; n: number; predicted: number; actual: number }

export interface Scorecard {
  sport: "NBA" | "NFL" | "Soccer";
  n: number;
  correct: number;
  accuracy: number;
  /** Accuracy of the naive "always pick the home team" baseline on the same games */
  baseline: number;
  brier: number;
  /** Mean absolute error of the predicted margin (points) — NBA/NFL */
  maeMargin?: number;
  buckets: CalibrationBucket[];
  recent: BacktestPick[];
  window: string;
  note: string;
}

async function getJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 21600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function pool<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

function summarize(
  sport: Scorecard["sport"],
  rows: { date: string; matchup: string; result: string; pick: string; prob: number; correct: boolean; homeWon: boolean; brier: number; marginErr?: number; id: string }[],
  window: string,
  note: string,
): Scorecard {
  const n = rows.length;
  const correct = rows.filter((r) => r.correct).length;
  const bucketsDef: [string, number, number][] = [["50–60%", 0.5, 0.6], ["60–70%", 0.6, 0.7], ["70–80%", 0.7, 0.8], ["80%+", 0.8, 1.01]];
  const buckets = bucketsDef.map(([label, lo, hi]) => {
    const b = rows.filter((r) => r.prob / 100 >= lo && r.prob / 100 < hi);
    return { label, n: b.length, predicted: b.length ? Math.round(b.reduce((a, r) => a + r.prob, 0) / b.length) : 0, actual: b.length ? Math.round((b.filter((r) => r.correct).length / b.length) * 100) : 0 };
  });
  const mae = rows.filter((r) => r.marginErr != null);
  return {
    sport, n, correct,
    accuracy: n ? Math.round((correct / n) * 1000) / 10 : 0,
    baseline: n ? Math.round((rows.filter((r) => r.homeWon).length / n) * 1000) / 10 : 0,
    brier: n ? Math.round((rows.reduce((a, r) => a + r.brier, 0) / n) * 1000) / 1000 : 0,
    maeMargin: mae.length ? Math.round((mae.reduce((a, r) => a + (r.marginErr ?? 0), 0) / mae.length) * 10) / 10 : undefined,
    buckets,
    recent: [...rows].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14).map(({ id, date, matchup, result, pick, prob, correct }) => ({ id, date, matchup, result, pick, prob, correct })),
    window, note,
  };
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });

/* ── NFL ─────────────────────────────────────────────────────────────────── */

export async function nflScorecard(): Promise<Scorecard> {
  const weeks = Array.from({ length: 18 }, (_, i) => i + 1);
  const data = await pool(weeks, 6, (w) => getJson(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${w}&dates=2026`));
  const teams = new Map<string, { gp: number; pf: number; pa: number }>();
  const rows: Parameters<typeof summarize>[1] = [];
  let first = "", last = "";
  data.forEach((d) => {
    const games = (d?.events ?? []).filter((e: any) => e.competitions?.[0]?.status?.type?.state === "post");
    if (games.length === 0) return;
    const parsed = games.map((e: any) => {
      const c = e.competitions[0];
      const h = c.competitors.find((x: any) => x.homeAway === "home"), a = c.competitors.find((x: any) => x.homeAway === "away");
      return { id: String(e.id), date: c.date, h: h.team.abbreviation as string, a: a.team.abbreviation as string, hs: Number(h.score), as: Number(a.score) };
    });
    for (const g of parsed) {
      const th = teams.get(g.h), ta = teams.get(g.a);
      if (!th || !ta || th.gp < 1 || ta.gp < 1) continue;
      const pw = (t: { gp: number; pf: number; pa: number }) => ((t.pf - t.pa) / t.gp) * (t.gp / (t.gp + 5));
      const margin = pw(th) - pw(ta) + 1.8;
      const ph = normCdf(margin / 13.5);
      const pickHome = ph >= 0.5;
      const homeWon = g.hs > g.as;
      const correct = g.hs !== g.as && pickHome === homeWon;
      const prob = Math.round((pickHome ? ph : 1 - ph) * 100);
      rows.push({
        id: g.id, date: g.date, matchup: `${g.a} @ ${g.h}`, result: `${g.as}–${g.hs}`, pick: `${pickHome ? g.h : g.a} ML`, prob, correct, homeWon,
        brier: (ph - (homeWon ? 1 : 0)) ** 2, marginErr: Math.abs(margin - (g.hs - g.as)),
      });
      if (!first) first = g.date; last = g.date;
    }
    for (const g of parsed) {
      const th = teams.get(g.h) ?? { gp: 0, pf: 0, pa: 0 }, ta = teams.get(g.a) ?? { gp: 0, pf: 0, pa: 0 };
      th.gp++; th.pf += g.hs; th.pa += g.as; ta.gp++; ta.pf += g.as; ta.pa += g.hs;
      teams.set(g.h, th); teams.set(g.a, ta);
    }
  });
  return summarize("NFL", rows, first ? `${fmtDate(first)} – ${fmtDate(last)}` : "", "Ratings rebuilt week by week from points scored and allowed; Week 1 is used only to seed ratings.");
}

/* ── NBA ─────────────────────────────────────────────────────────────────── */

export async function nbaScorecard(): Promise<Scorecard> {
  const y = nbaSeasonStartYear();
  const days: string[] = [];
  const cur = new Date(Date.UTC(y, 9, 20, 12));
  const end = new Date(Date.now() - 86_400_000);
  while (cur <= end) { days.push(cur.toISOString().slice(0, 10).replace(/-/g, "")); cur.setUTCDate(cur.getUTCDate() + 1); }
  const data = await pool(days, 8, (d) => getJson(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${d}`));
  const teams = new Map<string, { gp: number; pf: number; pa: number }>();
  const rows: Parameters<typeof summarize>[1] = [];
  let first = "", last = "";
  for (const d of data) {
    const games = (d?.events ?? []).filter((e: any) => e.competitions?.[0]?.status?.type?.state === "post" && e.season?.slug === "regular-season");
    if (games.length === 0) continue;
    const parsed = games.map((e: any) => {
      const c = e.competitions[0];
      const h = c.competitors.find((x: any) => x.homeAway === "home"), a = c.competitors.find((x: any) => x.homeAway === "away");
      return { id: String(e.id), date: c.date, h: h.team.abbreviation as string, a: a.team.abbreviation as string, hs: Number(h.score), as: Number(a.score) };
    });
    for (const g of parsed) {
      const th = teams.get(g.h), ta = teams.get(g.a);
      if (!th || !ta || th.gp < 2 || ta.gp < 2) continue;
      const pw = (t: { gp: number; pf: number; pa: number }) => ((t.pf - t.pa) / t.gp) * (t.gp / (t.gp + 12));
      const margin = pw(th) - pw(ta) + 2.3;
      const ph = normCdf(margin / 12);
      const pickHome = ph >= 0.5;
      const homeWon = g.hs > g.as;
      const prob = Math.round((pickHome ? ph : 1 - ph) * 100);
      rows.push({
        id: g.id, date: g.date, matchup: `${g.a} @ ${g.h}`, result: `${g.as}–${g.hs}`, pick: `${pickHome ? g.h : g.a} ML`, prob, correct: pickHome === homeWon, homeWon,
        brier: (ph - (homeWon ? 1 : 0)) ** 2, marginErr: Math.abs(margin - (g.hs - g.as)),
      });
      if (!first) first = g.date; last = g.date;
    }
    for (const g of parsed) {
      const th = teams.get(g.h) ?? { gp: 0, pf: 0, pa: 0 }, ta = teams.get(g.a) ?? { gp: 0, pf: 0, pa: 0 };
      th.gp++; th.pf += g.hs; th.pa += g.as; ta.gp++; ta.pf += g.as; ta.pa += g.hs;
      teams.set(g.h, th); teams.set(g.a, ta);
    }
  }
  return summarize("NBA", rows, first ? `${fmtDate(first)} – ${fmtDate(last)}` : "", "Ratings rebuilt day by day from points scored and allowed; a team needs 2 games of history before it is graded.");
}

/* ── Soccer ──────────────────────────────────────────────────────────────── */

const SOCCER_BACKTEST = ["epl", "laliga", "seriea", "bundesliga", "ligue1"] as const;

export async function soccerScorecard(): Promise<Scorecard> {
  const y = new Date().getFullYear();
  const days: string[] = [];
  const cur = new Date(Date.UTC(y, 8, 5, 12)); // Sep 5
  const end = new Date(Date.now() - 86_400_000);
  while (cur <= end) { days.push(cur.toISOString().slice(0, 10).replace(/-/g, "")); cur.setUTCDate(cur.getUTCDate() + 1); }
  const tasks = SOCCER_BACKTEST.flatMap((lg) => days.map((d) => ({ lg, d })));
  const slugOf = (k: string) => SOCCER_LEAGUES.find((l) => l.key === k)!.slug;
  const data = await pool(tasks, 24, (t) => getJson(`https://site.api.espn.com/apis/site/v2/sports/soccer/${slugOf(t.lg)}/scoreboard?dates=${t.d}`));

  type G = { id: string; date: string; lg: string; h: string; a: string; hn: string; an: string; hs: number; as: number };
  const games: G[] = [];
  data.forEach((d, i) => {
    for (const e of d?.events ?? []) {
      const c = e.competitions?.[0];
      if (c?.status?.type?.state !== "post") continue;
      const h = c.competitors?.find((x: any) => x.homeAway === "home"), a = c.competitors?.find((x: any) => x.homeAway === "away");
      if (!h || !a) continue;
      games.push({ id: String(e.id), date: c.date ?? e.date, lg: tasks[i].lg, h: String(h.team.id), a: String(a.team.id), hn: h.team.shortDisplayName ?? h.team.abbreviation, an: a.team.shortDisplayName ?? a.team.abbreviation, hs: Number(h.score), as: Number(a.score) });
    }
  });
  games.sort((x, y2) => x.date.localeCompare(y2.date));

  const byLeague = new Map<string, Map<string, TableRow>>();
  const row = (lg: string, id: string, name: string): TableRow => {
    const m = byLeague.get(lg) ?? new Map<string, TableRow>();
    byLeague.set(lg, m);
    if (!m.has(id)) m.set(id, { id, rank: 0, name, abbr: "", logo: "", gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 });
    return m.get(id)!;
  };
  const rows: Parameters<typeof summarize>[1] = [];
  const seen = new Set<string>();
  let first = "", last = "";
  for (const g of games) {
    if (seen.has(g.id)) continue;
    seen.add(g.id);
    const th = row(g.lg, g.h, g.hn), ta = row(g.lg, g.a, g.an);
    if (th.gp >= 3 && ta.gp >= 3) {
      const table = [...(byLeague.get(g.lg)?.values() ?? [])];
      const m = poissonModel(th, ta, table);
      const probs = [{ k: "home", p: m.home }, { k: "draw", p: m.draw }, { k: "away", p: m.away }];
      const top = [...probs].sort((p, q) => q.p - p.p)[0];
      const actual = g.hs > g.as ? "home" : g.hs < g.as ? "away" : "draw";
      const label = top.k === "home" ? g.hn : top.k === "away" ? g.an : "Draw";
      const oh = { home: actual === "home" ? 1 : 0, draw: actual === "draw" ? 1 : 0, away: actual === "away" ? 1 : 0 };
      rows.push({
        id: g.id, date: g.date, matchup: `${g.hn} vs ${g.an}`, result: `${g.hs}–${g.as}`, pick: top.k === "draw" ? "Draw" : `${label} ML`, prob: top.p, correct: top.k === actual, homeWon: actual === "home",
        brier: (m.home / 100 - oh.home) ** 2 + (m.draw / 100 - oh.draw) ** 2 + (m.away / 100 - oh.away) ** 2,
      });
      if (!first) first = g.date; last = g.date;
    }
    th.gp++; ta.gp++; th.gf += g.hs; th.ga += g.as; ta.gf += g.as; ta.ga += g.hs;
  }
  // 3-way: buckets measure the top pick's confidence; baseline = "always home"
  return summarize("Soccer", rows.map((r) => ({ ...r })), first ? `${fmtDate(first)} – ${fmtDate(last)}` : "", "1X2 across the Premier League, La Liga, Serie A, Bundesliga and Ligue 1. Goals-for/against ratings rebuilt match by match; a team needs 3 games of history. Draws are the hardest result to call.");
}

export async function allScorecards() {
  const [nfl, nba, soccer] = await Promise.all([nflScorecard().catch(() => null), nbaScorecard().catch(() => null), soccerScorecard().catch(() => null)]);
  return { nfl, nba, soccer };
}
