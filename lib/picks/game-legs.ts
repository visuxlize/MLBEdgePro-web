import { modelNbaGame, normCdf } from "@/lib/nba/analytics";
import { modelNflGame } from "@/lib/nfl/analytics";
import { nbaLogoUrl, nbaTeamHex, nbaTeamName } from "@/lib/nba/teams";
import { nflLogoUrl, nflTeamHex, nflTeamName } from "@/lib/nfl/teams";
import type { NbaStandingRow } from "@/lib/nba/types";
import type { NflStandingRow } from "@/lib/nfl/types";
import type { SoccerMatch } from "@/lib/soccer/types";
import type { PropItem } from "./types";

/** Weight given to our model vs the market. Books are sharp, so we only move the market's number part-way. */
const MODEL_WEIGHT = 0.5;
const BE_110 = 52.4; // break-even hit rate at −110

const impl = (american: number) => (american < 0 ? -american / (-american + 100) : 100 / (american + 100));
const parseML = (s?: string | number | null): number | undefined => {
  if (s == null) return undefined;
  if (typeof s === "number") return s;
  if (/^even$/i.test(s)) return 100;
  const n = parseInt(String(s).replace(/[^\d+-]/g, ""), 10);
  return Number.isFinite(n) && Math.abs(n) >= 100 ? n : undefined;
};
const r1 = (n: number) => Math.round(n * 10) / 10;
const sgn = (n: number) => (n > 0 ? `+${n}` : String(n));
const gradeOf = (e: number) => (e >= 6 ? "A+" : e >= 4 ? "A" : e >= 2.5 ? "B+" : e >= 1.2 ? "B" : "C");

export interface GameCtx {
  id: string; away: string; home: string; when: string;
  homeSpread?: number | null; total?: number | null; homeML?: string; awayML?: string;
}

interface Cfg {
  sport: "nba" | "nfl"; sdMargin: number; sdTotal: number;
  name: (a: string) => string; hex: (a: string) => string; logo: (a: string) => string;
}
const NBA: Cfg = { sport: "nba", sdMargin: 12, sdTotal: 18, name: nbaTeamName, hex: nbaTeamHex, logo: nbaLogoUrl };
const NFL: Cfg = { sport: "nfl", sdMargin: 13.5, sdTotal: 10.5, name: nflTeamName, hex: nflTeamHex, logo: nflLogoUrl };

function base(cfg: Cfg, g: GameCtx, teamAbbr: string, opp: string, over: Partial<PropItem>): PropItem {
  return {
    id: "", sport: cfg.sport, scope: "game", athleteId: "", kind: "model",
    player: cfg.name(teamAbbr), headshot: cfg.logo(teamAbbr), hex: cfg.hex(teamAbbr), logo: cfg.logo(teamAbbr),
    team: teamAbbr, opp, home: teamAbbr === g.home, gameId: g.id, gameLabel: `${g.away} @ ${g.home}`, when: g.when,
    marketKey: "", marketShort: "", pick: "", lineSource: "draftkings", prob: 50, edge: 0, stats: [], notes: [], ...over,
  };
}

function usLegs(cfg: Cfg, g: GameCtx, model: { margin: number; projTotal: number; homeWinProb: number; projHome: number; projAway: number }): PropItem[] {
  const out: PropItem[] = [];

  if (g.homeSpread != null) {
    const S = g.homeSpread;
    const rawHome = normCdf((model.margin + S) / cfg.sdMargin) * 100;
    const homeSide = rawHome >= 50;
    const raw = homeSide ? rawHome : 100 - rawHome;
    const prob = Math.round(50 + (raw - 50) * MODEL_WEIGHT);
    const team = homeSide ? g.home : g.away, opp = homeSide ? g.away : g.home;
    const line = homeSide ? S : -S;
    const val = r1(homeSide ? model.margin + S : -(model.margin + S));
    out.push(base(cfg, g, team, opp, {
      id: `g-${g.id}-spread`, marketKey: "Spread", marketShort: "Spread", pick: `${team} ${sgn(line)}`, side: homeSide ? "home" : "away", line,
      prob, baseProb: BE_110, edge: r1(prob - BE_110), grade: gradeOf(prob - BE_110), price: -110, proj: undefined,
      stats: [{ label: "Model margin", value: `${model.margin >= 0 ? g.home : g.away} by ${Math.abs(model.margin)}` }, { label: "Market line", value: `${g.home} ${sgn(S)}` }, { label: "Value", value: `${val >= 0 ? "+" : ""}${val} pts` }],
      notes: [`Our power ratings make ${model.margin >= 0 ? g.home : g.away} a ${Math.abs(model.margin)}-point ${model.margin >= 0 ? "favorite" : "favorite on the road"}; the market has ${g.home} at ${sgn(S)}.`, `That's ${Math.abs(val)} points of ${val >= 0 ? "value" : "disagreement"} on ${team} ${sgn(line)}.`, `Chance shown blends the model with the market (${Math.round(MODEL_WEIGHT * 100)}% model) because betting lines are sharp.`],
    }));
  }

  if (g.total != null) {
    const T = g.total;
    const rawOver = normCdf((model.projTotal - T) / cfg.sdTotal) * 100;
    const over = rawOver >= 50;
    const raw = over ? rawOver : 100 - rawOver;
    const prob = Math.round(50 + (raw - 50) * MODEL_WEIGHT);
    out.push(base(cfg, g, g.home, g.away, {
      id: `g-${g.id}-total`, player: `${g.away} @ ${g.home}`, marketKey: "Total", marketShort: "Total", pick: `${over ? "Over" : "Under"} ${T}`, side: over ? "over" : "under", line: T,
      prob, baseProb: BE_110, edge: r1(prob - BE_110), grade: gradeOf(prob - BE_110), price: -110,
      stats: [{ label: "Model total", value: String(model.projTotal) }, { label: "Market total", value: String(T) }, { label: "Gap", value: `${r1(model.projTotal - T) >= 0 ? "+" : ""}${r1(model.projTotal - T)}` }],
      notes: [`Both teams' scoring and defense project ${model.projTotal} combined points (${g.home} ${model.projHome}, ${g.away} ${model.projAway}) against a ${T} total.`, `That points to the ${over ? "over" : "under"} by ${Math.abs(r1(model.projTotal - T))}.`],
    }));
  }

  const hML = parseML(g.homeML), aML = parseML(g.awayML);
  if (hML && aML) {
    const iH = impl(hML), iA = impl(aML);
    const nvH = iH / (iH + iA);
    const pH = nvH + MODEL_WEIGHT * (model.homeWinProb / 100 - nvH);
    const eH = pH * 100 - iH * 100, eA = (1 - pH) * 100 - iA * 100;
    const homeSide = eH >= eA;
    const prob = Math.round((homeSide ? pH : 1 - pH) * 100);
    const price = homeSide ? hML : aML;
    const team = homeSide ? g.home : g.away, opp = homeSide ? g.away : g.home;
    const be = (homeSide ? iH : iA) * 100;
    out.push(base(cfg, g, team, opp, {
      id: `g-${g.id}-ml`, marketKey: "Moneyline", marketShort: "ML", pick: `${team} ${sgn(price)}`, side: homeSide ? "home" : "away",
      prob, baseProb: Math.round(be * 10) / 10, edge: r1(prob - be), grade: gradeOf(prob - be), price,
      stats: [{ label: "Model win %", value: `${homeSide ? model.homeWinProb : 100 - model.homeWinProb}%` }, { label: "Market (no-vig)", value: `${Math.round((homeSide ? nvH : 1 - nvH) * 100)}%` }, { label: "Price", value: sgn(price) }],
      notes: [`Model gives ${team} a ${homeSide ? model.homeWinProb : 100 - model.homeWinProb}% win chance vs ${Math.round((homeSide ? nvH : 1 - nvH) * 100)}% implied by DraftKings (vig removed).`, `At ${sgn(price)} you need ${Math.round(be)}% to break even.`],
    }));
  }
  return out;
}

export function nbaGameLegs(games: GameCtx[], rows: Map<string, NbaStandingRow>): PropItem[] {
  return games.flatMap((g) => usLegs(NBA, g, modelNbaGame(rows.get(g.home), rows.get(g.away), g.homeSpread)));
}
export function nflGameLegs(games: GameCtx[], rows: Map<string, NflStandingRow>): PropItem[] {
  return games.flatMap((g) => usLegs(NFL, g, modelNflGame(rows.get(g.home), rows.get(g.away), g.homeSpread)));
}

/* ── Soccer ── */
export function soccerGameLegs(matches: SoccerMatch[], slugOf: (m: SoccerMatch) => string, labelOf: (m: SoccerMatch) => string): PropItem[] {
  const out: PropItem[] = [];
  for (const m of matches) {
    if (m.status !== "pre" || !m.model || !m.odds) continue;
    const when = new Date(m.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const gameLabel = `${m.homeTeam.shortName} vs ${m.awayTeam.shortName}`;
    const common = { sport: "soccer" as const, scope: "game" as const, athleteId: "", kind: "model" as const, gameId: m.id, gameLabel, when, league: slugOf(m), lineSource: "draftkings" as const, stats: [] as PropItem["stats"], notes: [] as string[] };
    const mk = (team: SoccerMatch["homeTeam"], opp: SoccerMatch["homeTeam"], o: Partial<PropItem>): PropItem => ({
      id: "", ...common, player: team.shortName, headshot: team.logo, hex: team.hex.length >= 7 ? team.hex : "#12a150", logo: team.logo, team: team.abbr, opp: opp.shortName,
      marketKey: "", marketShort: "", pick: "", prob: 50, edge: 0, ...o,
    });

    const hML = parseML(m.odds.homeML), dML = parseML(m.odds.drawML), aML = parseML(m.odds.awayML);
    if (hML && dML && aML) {
      const imp = [impl(hML), impl(dML), impl(aML)];
      const sum = imp[0] + imp[1] + imp[2];
      const mod = [m.model.home, m.model.draw, m.model.away];
      const rows = imp.map((i, k) => {
        const nv = i / sum;
        const b = nv + MODEL_WEIGHT * (mod[k] / 100 - nv);
        return { k, nv, b, price: [hML, dML, aML][k], be: i * 100, edge: b * 100 - i * 100 };
      });
      const best = rows.sort((x, y) => y.edge - x.edge)[0];
      const side = (["home", "draw", "away"] as const)[best.k];
      const team = side === "away" ? m.awayTeam : m.homeTeam;
      const opp = side === "away" ? m.homeTeam : m.awayTeam;
      const label = side === "draw" ? "Draw" : `${team.shortName} to win`;
      out.push(mk(team, opp, {
        id: `g-${m.id}-result`, marketKey: "Match Result", marketShort: "Result", pick: `${label} ${sgn(best.price)}`, side, home: side === "home", prob: Math.round(best.b * 100),
        baseProb: Math.round(best.be * 10) / 10, edge: r1(best.edge), grade: gradeOf(best.edge), price: best.price,
        player: side === "draw" ? gameLabel : team.shortName,
        stats: [{ label: "Model", value: `${mod[best.k]}%` }, { label: "Market (no-vig)", value: `${Math.round(best.nv * 100)}%` }, { label: "Price", value: sgn(best.price) }],
        notes: [`League-table goal model: ${m.homeTeam.shortName} ${m.model.home}% · Draw ${m.model.draw}% · ${m.awayTeam.shortName} ${m.model.away}% (expected goals ${m.model.xgHome}–${m.model.xgAway}).`, `DraftKings (vig removed) has this outcome at ${Math.round(best.nv * 100)}%, and you need ${Math.round(best.be)}% to break even at ${sgn(best.price)}.`],
      }));
    }

    if (m.odds.overUnder === 2.5) {
      const lam = m.model.xgHome + m.model.xgAway;
      const rawOver = (1 - Math.exp(-lam) * (1 + lam + (lam * lam) / 2)) * 100;
      const over = rawOver >= 50;
      const raw = over ? rawOver : 100 - rawOver;
      const prob = Math.round(50 + (raw - 50) * MODEL_WEIGHT);
      out.push(mk(m.homeTeam, m.awayTeam, {
        id: `g-${m.id}-goals`, player: gameLabel, marketKey: "Total Goals", marketShort: "Goals", pick: `${over ? "Over" : "Under"} 2.5`, side: over ? "over" : "under", line: 2.5,
        prob, baseProb: BE_110, edge: r1(prob - BE_110), grade: gradeOf(prob - BE_110), price: -110,
        stats: [{ label: "Expected goals", value: r1(lam).toString() }, { label: "Model over 2.5", value: `${Math.round(rawOver)}%` }],
        notes: [`Combined expected goals are ${r1(lam)} (${m.model.xgHome} + ${m.model.xgAway}), which makes over 2.5 about ${Math.round(rawOver)}% before blending with the market.`],
      }));
    }
  }
  return out;
}
