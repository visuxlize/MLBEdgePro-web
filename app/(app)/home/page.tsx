import { currentUser } from "@clerk/nextjs/server";
import { getNbaSchedule, getNbaStandings } from "@/lib/nba/espn";
import { etDateStr } from "@/lib/nba/props";
import { getNflCurrentWeek, getNflWeek } from "@/lib/nfl/league";
import { getSoccerFixtures } from "@/lib/soccer/match-center";
import { HomeClient } from "@/components/web-tool/home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cur = await getNflCurrentWeek();
  const [user, nbaGames, standings, nflWeek, soccer] = await Promise.all([
    currentUser(),
    getNbaSchedule(etDateStr(0)).catch(() => []),
    getNbaStandings().catch(() => []),
    getNflWeek(cur.seasonType, cur.week).catch(() => null),
    getSoccerFixtures(etDateStr(0)).catch(() => []),
  ]);

  const rawFirstName = user?.firstName ?? "there";
  const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1);
  const todayDate = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <HomeClient
      userName={firstName}
      todayDate={todayDate}
      nba={{ games: nbaGames, standings }}
      nfl={{ weekLabel: nflWeek?.label ?? `Week ${cur.week}`, weekNum: cur.week, games: nflWeek?.games ?? [] }}
      soccer={soccer}
    />
  );
}
