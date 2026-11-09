import "server-only";
import { getNbaProps } from "@/lib/nba/props";
import { getNbaStandings, standingsMap } from "@/lib/nba/espn";
import { getNflProps, getNflStandings, nflStandingsMap } from "@/lib/nfl/league";
import { getSoccerProps } from "@/lib/soccer/props";
import { LEAGUE_MAP } from "@/lib/soccer/leagues";
import { etDateStr } from "@/lib/season";
import { nbaToItems, nflToItems } from "@/components/web-tool/props-adapters";
import { nbaGameLegs, nflGameLegs, soccerGameLegs } from "./game-legs";
import type { PropItem } from "./types";

export interface PicksData {
  items: PropItem[];
  counts: { nba: number; nfl: number; soccer: number };
  liveLines: { nba: number; nfl: number };
  nbaDay: string;
  nflWeek: string;
}

/** Every bettable leg we can grade today, across sports. The engine (client-side) turns these into picks. */
export async function getPicksData(): Promise<PicksData> {
  const settle = <T,>(p: Promise<T>, fallback: T) => p.catch(() => fallback);
  const [nba, nfl, soc, nbaRows, nflRows] = await Promise.all([
    settle(getNbaProps(), { props: [], games: [], dayLabel: "", liveLines: 0 }),
    settle(getNflProps(), { props: [], games: [], weekLabel: "", liveLines: 0 }),
    settle(getSoccerProps(etDateStr(0)), { props: [], matches: [], withLines: 0 }),
    settle(getNbaStandings(), []),
    settle(getNflStandings(), []),
  ]);

  const nbaGames = nba.games.map((g) => ({ id: g.id, away: g.away, home: g.home, when: g.timeLabel, homeSpread: g.odds?.homeSpread, total: g.odds?.overUnder, homeML: g.odds?.homeML, awayML: g.odds?.awayML }));
  const nflGames = nfl.games.map((g) => ({ id: g.id, away: g.away, home: g.home, when: `${g.dateLabel} · ${g.timeLabel}`, homeSpread: g.odds?.homeSpread, total: g.odds?.overUnder, homeML: g.odds?.homeML, awayML: g.odds?.awayML }));

  const items: PropItem[] = [
    ...nbaToItems(nba.props), ...nbaGameLegs(nbaGames, standingsMap(nbaRows)),
    ...nflToItems(nfl.props), ...nflGameLegs(nflGames, nflStandingsMap(nflRows)),
    ...soccerGameLegs(soc.matches, (m) => LEAGUE_MAP[m.league].slug, () => ""),
  ];
  const count = (s: string) => items.filter((i) => i.sport === s).length;
  return { items, counts: { nba: count("nba"), nfl: count("nfl"), soccer: count("soccer") }, liveLines: { nba: nba.liveLines, nfl: nfl.liveLines }, nbaDay: nba.dayLabel, nflWeek: nfl.weekLabel };
}
