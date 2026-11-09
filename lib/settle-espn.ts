import "server-only";

export type LegResult = "win" | "loss" | "push" | "void";
export interface SettleLegIn {
  key: string;
  sport: "nba" | "nfl" | "soccer";
  gameId: string;
  athleteId?: string;
  /** "game" = spread / moneyline / total / match result */
  scope?: "game";
  marketKey: string;
  line?: number;
  side?: "over" | "under" | "yes" | "home" | "away" | "draw";
  target?: string;
  league?: string;
}
export interface SettleLegOut { key: string; status: "pending" | "final"; result?: LegResult; actual?: number }

const BASE = "https://site.api.espn.com/apis/site/v2/sports";
const path = (l: SettleLegIn) => (l.sport === "nba" ? "basketball/nba" : l.sport === "nfl" ? "football/nfl" : `soccer/${l.league}`);

interface Summary { header?: { competitions?: { competitors?: { homeAway?: string; score?: string }[]; status?: { type?: { completed?: boolean; name?: string } } }[] }; boxscore?: { players?: { statistics?: { name?: string; labels?: string[]; athletes?: { athlete?: { id?: string }; stats?: string[]; didNotPlay?: boolean }[] }[] }[] }; rosters?: { roster?: { athlete?: { id?: string }; stats?: { name: string; value: number }[] }[] }[] }

async function getSummary(l: SettleLegIn): Promise<Summary | null> {
  try {
    const res = await fetch(`${BASE}/${path(l)}/summary?event=${l.gameId}`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    return res.ok ? ((await res.json()) as Summary) : null;
  } catch { return null; }
}

/** Number from a "m-a" / "c/a" / plain stat string */
const num = (v?: string) => { const n = parseFloat(String(v ?? "").split(/[-/]/)[0]); return Number.isFinite(n) ? n : 0; };

function nbaActual(s: Summary, l: SettleLegIn): number | "void" {
  for (const team of s.boxscore?.players ?? []) {
    const grp = team.statistics?.[0];
    const row = grp?.athletes?.find((a) => a.athlete?.id === l.athleteId);
    if (!grp || !row) continue;
    const labels = grp.labels ?? [];
    const at = (lab: string) => num(row.stats?.[labels.indexOf(lab)]);
    if (row.didNotPlay || !row.stats?.length || at("MIN") === 0) return "void";
    return l.marketKey === "Points" ? at("PTS") : l.marketKey === "Rebounds" ? at("REB") : l.marketKey === "Assists" ? at("AST") : at("3PT");
  }
  return "void";
}

function nflActual(s: Summary, l: SettleLegIn): number | "void" {
  const want: Record<string, { group: string; label: string }> = {
    "Pass Yds": { group: "passing", label: "YDS" }, "Pass TDs": { group: "passing", label: "TD" },
    "Rush Yds": { group: "rushing", label: "YDS" }, "Rec Yds": { group: "receiving", label: "YDS" }, Receptions: { group: "receiving", label: "REC" },
  };
  const w = want[l.marketKey];
  if (!w) return "void";
  let appeared = false;
  for (const team of s.boxscore?.players ?? []) {
    for (const grp of team.statistics ?? []) {
      const row = grp.athletes?.find((a) => a.athlete?.id === l.athleteId);
      if (!row) continue;
      appeared = true;
      if (grp.name === w.group) return num(row.stats?.[(grp.labels ?? []).indexOf(w.label)]);
    }
  }
  // Played (appears somewhere) but has no line in this category → a real zero. Never appeared → void like a DNP.
  return appeared ? 0 : "void";
}

function soccerResult(s: Summary, l: SettleLegIn): { actual: number; result: LegResult } | "void" {
  for (const r of s.rosters ?? []) {
    const p = r.roster?.find((x) => x.athlete?.id === l.athleteId);
    if (!p) continue;
    const st = (n: string) => p.stats?.find((x) => x.name === n)?.value ?? 0;
    if (st("appearances") === 0) return "void";
    const need = parseInt(l.target ?? "1", 10) || 1;
    const actual = l.marketKey === "Anytime Goalscorer" ? st("totalGoals") : l.marketKey === "Shots on Target" ? st("shotsOnTarget")
      : l.marketKey === "Shots" ? st("totalShots") : l.marketKey === "To be Carded" ? st("yellowCards") + st("redCards") : st("goalAssists");
    return { actual, result: actual >= (l.marketKey === "Anytime Goalscorer" || l.marketKey === "To be Carded" ? 1 : need) ? "win" : "loss" };
  }
  return "void";
}

function gameResult(s: Summary, l: SettleLegIn): { result: LegResult; actual: number } | "void" {
  const comp = s.header?.competitions?.[0]?.competitors ?? [];
  const h = parseFloat(comp.find((c) => c.homeAway === "home")?.score ?? "");
  const a = parseFloat(comp.find((c) => c.homeAway === "away")?.score ?? "");
  if (!Number.isFinite(h) || !Number.isFinite(a)) return "void";
  const line = l.line ?? 0;
  const cmp = (v: number): LegResult => (v > 0 ? "win" : v < 0 ? "loss" : "push");
  if (l.marketKey === "Total" || l.marketKey === "Total Goals") return { actual: h + a, result: cmp((h + a - line) * (l.side === "under" ? -1 : 1)) };
  if (l.marketKey === "Spread") { const m = l.side === "away" ? a - h : h - a; return { actual: m, result: cmp(m + line) }; }
  if (l.marketKey === "Moneyline" || l.marketKey === "Match Result") {
    if (l.side === "draw") return { actual: h - a, result: h === a ? "win" : "loss" };
    const m = l.side === "away" ? a - h : h - a;
    return { actual: m, result: m > 0 ? "win" : m < 0 ? "loss" : l.sport === "soccer" ? "loss" : "push" };
  }
  return "void";
}

export async function settleLegs(legs: SettleLegIn[]): Promise<SettleLegOut[]> {
  const games = new Map<string, Promise<Summary | null>>();
  for (const l of legs) { const k = `${path(l)}:${l.gameId}`; if (!games.has(k)) games.set(k, getSummary(l)); }

  return Promise.all(legs.map(async (l): Promise<SettleLegOut> => {
    const s = await games.get(`${path(l)}:${l.gameId}`)!;
    const type = s?.header?.competitions?.[0]?.status?.type;
    if (!s || !type) return { key: l.key, status: "pending" };
    if (/POSTPONED|CANCEL|SUSPENDED/i.test(type.name ?? "")) return { key: l.key, status: "final", result: "void" };
    if (!type.completed) return { key: l.key, status: "pending" };

    if (l.scope === "game") {
      const g = gameResult(s, l);
      return g === "void" ? { key: l.key, status: "final", result: "void" } : { key: l.key, status: "final", result: g.result, actual: g.actual };
    }
    if (l.sport === "soccer") {
      const r = soccerResult(s, { ...l, athleteId: l.athleteId ?? "" });
      return r === "void" ? { key: l.key, status: "final", result: "void" } : { key: l.key, status: "final", result: r.result, actual: r.actual };
    }
    const actual = l.sport === "nba" ? nbaActual(s, { ...l, athleteId: l.athleteId ?? "" }) : nflActual(s, { ...l, athleteId: l.athleteId ?? "" });
    if (actual === "void") return { key: l.key, status: "final", result: "void" };
    const line = l.line ?? 0;
    const result: LegResult = actual === line ? "push" : (actual > line) === (l.side !== "under") ? "win" : "loss";
    return { key: l.key, status: "final", result, actual };
  }));
}
