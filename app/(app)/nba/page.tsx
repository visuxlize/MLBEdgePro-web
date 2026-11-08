import { getNbaSchedule, getNbaStandings } from "@/lib/nba/espn";
import { etDateStr } from "@/lib/nba/props";
import { NbaToday } from "@/components/web-tool/nba-today";

export const dynamic = "force-dynamic";

export default async function NbaPage() {
  const todayKey = etDateStr(0);
  const [games, standings] = await Promise.all([getNbaSchedule(todayKey), getNbaStandings()]);
  return <NbaToday todayKey={todayKey} initialGames={games} standings={standings} />;
}
