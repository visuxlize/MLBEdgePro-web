import "server-only";
import { buildNbaProps } from "./analytics";
import { getNbaPlayerSeasons, getNbaSchedule, getNbaStandings, standingsMap } from "./espn";
import { etDateStr } from "@/lib/season";
import { getEventPropLines } from "@/lib/props/dk-lines";
import type { RealLine } from "./analytics";
import type { NbaGame, NbaPlayerProp } from "./types";

export { etDateStr } from "@/lib/season";

const NBA_MARKETS: Record<string, string> = {
  "Total Points": "Points", "Total Rebounds": "Rebounds", "Total Assists": "Assists", "Total 3-Point Field Goals": "3-Pointers",
};

/** Real DraftKings lines for one NBA game, keyed `${espnId}:${market}`. Empty until the book posts props. */
export async function getNbaGameLines(gameId: string): Promise<Map<string, RealLine>> {
  const lines = await getEventPropLines("basketball/leagues/nba", gameId, (n) => n in NBA_MARKETS, { maxPages: 6 });
  return new Map(lines.map((l) => [`${l.athleteId}:${NBA_MARKETS[l.market]}`, { line: l.line, openLine: l.openLine, price: l.price, updated: l.updated }]));
}

export interface NbaPropsPayload {
  props: NbaPlayerProp[];
  games: NbaGame[];
  dayLabel: string;
  /** How many games have real DraftKings lines posted */
  liveLines: number;
}

/** Props for the next slate with games still to play (today, else the next few days). */
export async function getNbaProps(): Promise<NbaPropsPayload> {
  let games: NbaGame[] = [];
  for (let i = 0; i < 5 && games.length === 0; i++) {
    const day = await getNbaSchedule(etDateStr(i));
    games = day.filter((g) => g.status !== "final");
  }
  const [players, standings] = await Promise.all([getNbaPlayerSeasons(160), getNbaStandings()]);
  const lineMaps = await Promise.all(games.map((g) => getNbaGameLines(g.id)));
  const props = buildNbaProps(
    players,
    games.map((g, i) => ({ id: g.id, away: g.away, home: g.home, tipLabel: g.timeLabel, total: g.odds?.overUnder, homeSpread: g.odds?.homeSpread, lines: lineMaps[i] })),
    standingsMap(standings),
  );
  return { props, games, dayLabel: games[0]?.dateLabel ?? "", liveLines: lineMaps.filter((m) => m.size > 0).length };
}
