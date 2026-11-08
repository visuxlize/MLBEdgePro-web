/** Soccer Poisson model — pure functions built from real league-table goals for/against. */

export interface TableRow {
  id: string;
  rank: number;
  name: string;
  abbr: string;
  logo: string;
  gp: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

const val = (e: any, n: string) => {
  const v = e.stats?.find((s: any) => s.name === n)?.value;
  return typeof v === "number" ? v : 0;
};

export function tableRowsFromEntries(entries: any[]): TableRow[] {
  const rows: TableRow[] = entries.map((e) => ({
    id: String(e.team?.id ?? e.id ?? ""),
    rank: val(e, "rank"),
    name: e.team?.displayName ?? e.team ?? "",
    abbr: e.team?.abbreviation ?? "",
    logo: e.team?.logos?.[0]?.href ?? `https://a.espncdn.com/i/teamlogos/soccer/500/${e.team?.id ?? e.id}.png`,
    gp: val(e, "gamesPlayed"), w: val(e, "wins"), d: val(e, "ties"), l: val(e, "losses"),
    gf: val(e, "pointsFor"), ga: val(e, "pointsAgainst"), gd: val(e, "pointDifferential"), pts: val(e, "points"),
  }));
  rows.sort((a, b) => (a.rank || 99) - (b.rank || 99) || b.pts - a.pts || b.gd - a.gd);
  rows.forEach((r, i) => { if (!r.rank) r.rank = i + 1; });
  return rows;
}

function pmf(k: number, lambda: number) {
  let f = 1;
  for (let i = 2; i <= k; i++) f *= i;
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / f;
}

export interface SoccerModel {
  home: number; draw: number; away: number;
  xgHome: number; xgAway: number;
  over25: number; btts: number;
  scorelines: { score: string; p: number }[];
}

export function poissonModel(home: TableRow | undefined, away: TableRow | undefined, table: TableRow[]): SoccerModel {
  const played = table.filter((r) => r.gp > 0);
  const lgAvg = played.length ? played.reduce((a, r) => a + r.gf / r.gp, 0) / played.length : 1.35;
  const strength = (r: TableRow | undefined, kind: "att" | "def") => {
    if (!r || !r.gp) return 1;
    const raw = (kind === "att" ? r.gf : r.ga) / r.gp / lgAvg;
    const k = r.gp / (r.gp + 6); // shrink small samples toward league average
    return 1 + (raw - 1) * k;
  };
  const xgHome = Math.max(0.25, Math.min(4, lgAvg * 1.12 * strength(home, "att") * strength(away, "def")));
  const xgAway = Math.max(0.2, Math.min(3.5, lgAvg * 0.92 * strength(away, "att") * strength(home, "def")));

  let h = 0, d = 0, a = 0, over = 0, btts = 0;
  const grid: { score: string; p: number }[] = [];
  for (let i = 0; i <= 8; i++) {
    for (let j = 0; j <= 8; j++) {
      const p = pmf(i, xgHome) * pmf(j, xgAway);
      if (i > j) h += p; else if (i === j) d += p; else a += p;
      if (i + j >= 3) over += p;
      if (i > 0 && j > 0) btts += p;
      grid.push({ score: `${i}-${j}`, p });
    }
  }
  const tot = h + d + a;
  const home100 = Math.round((h / tot) * 100), draw100 = Math.round((d / tot) * 100);
  return {
    home: home100, draw: draw100, away: 100 - home100 - draw100,
    xgHome: Math.round(xgHome * 100) / 100, xgAway: Math.round(xgAway * 100) / 100,
    over25: Math.round((over / tot) * 100), btts: Math.round((btts / tot) * 100),
    scorelines: grid.sort((x, y) => y.p - x.p).slice(0, 4).map((g) => ({ score: g.score, p: Math.round((g.p / tot) * 1000) / 10 })),
  };
}

/** In-play outcome probabilities: remaining expected goals scale with the time left. */
export function liveOutcome(xgHome: number, xgAway: number, homeGoals: number, awayGoals: number, minute: number) {
  const r = Math.max(0.03, (90 - Math.min(90, minute)) / 90);
  const lh = xgHome * r, la = xgAway * r;
  let h = 0, d = 0, a = 0;
  for (let i = 0; i <= 8; i++) {
    for (let j = 0; j <= 8; j++) {
      const p = pmf(i, lh) * pmf(j, la);
      const diff = homeGoals + i - (awayGoals + j);
      if (diff > 0) h += p; else if (diff === 0) d += p; else a += p;
    }
  }
  const t = h + d + a;
  const hp = Math.round((h / t) * 100), dp = Math.round((d / t) * 100);
  return { home: hp, draw: dp, away: 100 - hp - dp };
}
