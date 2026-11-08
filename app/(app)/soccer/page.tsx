import { etDateStr } from "@/lib/season";
import { SoccerCenter } from "@/components/web-tool/soccer-center";
import { getAllTables, getSoccerFixtures, getSoccerMatchCenter } from "@/lib/soccer/match-center";

export const dynamic = "force-dynamic";

export default async function SoccerPage() {
  const todayKey = etDateStr(0);
  const [matches, tables] = await Promise.all([getSoccerFixtures(todayKey), getAllTables()]);
  // Feature the most interesting match: live first, then the biggest-league result / fixture.
  const order = ["epl", "laliga", "seriea", "bundesliga", "ucl", "ligue1", "europa", "mls", "ligamx", "brasileirao"];
  const pick =
    matches.find((m) => m.status === "live") ??
    [...matches].sort((a, b) => order.indexOf(a.league) - order.indexOf(b.league))[0];
  const center = pick ? await getSoccerMatchCenter(pick.league, pick.id) : null;
  return <SoccerCenter todayKey={todayKey} initialMatches={matches} initialCenter={center} tables={tables} />;
}
