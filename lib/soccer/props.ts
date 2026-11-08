import "server-only";
import { getAthleteInfo, getEventPropLines, type DkLine } from "@/lib/props/dk-lines";
import { LEAGUE_MAP } from "./leagues";
import { getSoccerFixtures } from "./match-center";
import type { SoccerLeagueKey, SoccerMatch } from "./types";

export type SoccerMarket = "Anytime Goalscorer" | "Shots on Target" | "Shots" | "To be Carded" | "Assist";

const MARKETS: Record<string, SoccerMarket> = {
  "Anytime Goalscorer": "Anytime Goalscorer",
  "Shots on Target Milestones": "Shots on Target",
  "Shots Milestones": "Shots",
  "To Receive a Card": "To be Carded",
  "Assists Milestones": "Assist",
};
/** How many props per market to surface for each match (most-likely first) */
const KEEP: Record<SoccerMarket, number> = { "Anytime Goalscorer": 6, "Shots on Target": 3, Shots: 2, "To be Carded": 3, Assist: 2 };

export interface SoccerRealProp {
  id: string;
  matchId: string;
  league: SoccerLeagueKey;
  leagueLabel: string;
  matchup: string;
  kickoff: string;
  status: SoccerMatch["status"];
  player: string;
  athleteId: string;
  jersey?: string;
  pos?: string;
  teamAbbr: string;
  teamLogo: string;
  teamHex: string;
  opp: string;
  market: SoccerMarket;
  /** e.g. "2+" for milestone markets, "Yes" for goalscorer / card */
  target: string;
  price: number;
  openPrice?: number;
  /** Implied probability from the quoted price (includes the book's margin) */
  implied: number;
  movement: "shorter" | "longer" | null;
  updated?: string;
}

export interface SoccerPropsPayload {
  props: SoccerRealProp[];
  matches: SoccerMatch[];
  /** matches that have DraftKings props posted */
  withLines: number;
}

const implied = (american: number) => Math.round((american < 0 ? -american / (-american + 100) : 100 / (american + 100)) * 1000) / 10;

const LEAGUE_ORDER: SoccerLeagueKey[] = ["epl", "laliga", "seriea", "bundesliga", "ucl", "ligue1", "europa", "mls", "ligamx", "brasileirao"];

export async function getSoccerProps(dateStr: string): Promise<SoccerPropsPayload> {
  const fixtures = (await getSoccerFixtures(dateStr))
    .filter((m) => m.status !== "final")
    .sort((a, b) => LEAGUE_ORDER.indexOf(a.league) - LEAGUE_ORDER.indexOf(b.league) || a.date.localeCompare(b.date))
    .slice(0, 10);

  const perMatch = await Promise.all(fixtures.map(async (m) => {
    const lines = await getEventPropLines(`soccer/leagues/${LEAGUE_MAP[m.league].slug}`, m.id, (n) => n in MARKETS, { maxPages: 1, revalidate: 300 });
    return { m, lines: lines.filter((l) => l.overPrice != null) };
  }));

  const out: SoccerRealProp[] = [];
  for (const { m, lines } of perMatch) {
    // One entry per player & market — keep the line closest to a coin-flip (most informative)
    const best = new Map<string, DkLine>();
    for (const l of lines) {
      const key = `${l.athleteId}:${MARKETS[l.market]}`;
      const cur = best.get(key);
      if (!cur || Math.abs(implied(l.overPrice!) - 50) < Math.abs(implied(cur.overPrice!) - 50)) best.set(key, l);
    }
    const picked: DkLine[] = [];
    for (const mk of Object.values(MARKETS)) {
      picked.push(...[...best.values()].filter((l) => MARKETS[l.market] === mk).sort((a, b) => implied(b.overPrice!) - implied(a.overPrice!)).slice(0, KEEP[mk]));
    }
    const infos = await Promise.all(picked.map((l) => getAthleteInfo(l.athleteRef)));
    picked.forEach((l, i) => {
      const info = infos[i];
      if (!info?.name) return;
      const isHome = info.teamId === m.homeTeam.id;
      const isAway = info.teamId === m.awayTeam.id;
      if (!isHome && !isAway) return;
      const team = isHome ? m.homeTeam : m.awayTeam;
      const opp = isHome ? m.awayTeam : m.homeTeam;
      const market = MARKETS[l.market];
      const price = l.overPrice!;
      const open = l.openOverPrice;
      const dec = (p: number) => (p > 0 ? p / 100 + 1 : 100 / -p + 1);
      out.push({
        id: `${m.id}-${l.athleteId}-${market}`, matchId: m.id, league: m.league, leagueLabel: LEAGUE_MAP[m.league].shortLabel,
        matchup: `${m.homeTeam.shortName} vs ${m.awayTeam.shortName}`, kickoff: m.date, status: m.status,
        player: info.name, athleteId: l.athleteId, jersey: info.jersey, pos: info.pos,
        teamAbbr: team.abbr, teamLogo: team.logo, teamHex: team.hex, opp: opp.shortName,
        market, target: market === "Anytime Goalscorer" || market === "To be Carded" ? "Yes" : `${l.line}+`,
        price, openPrice: open, implied: implied(price),
        movement: m.status !== "live" && open != null && Math.abs(dec(price) - dec(open)) >= 0.04 ? (dec(price) < dec(open) ? "shorter" : "longer") : null,
        updated: l.updated,
      });
    });
  }

  return { props: out.sort((a, b) => b.implied - a.implied), matches: fixtures, withLines: perMatch.filter((x) => x.lines.length > 0).length };
}
