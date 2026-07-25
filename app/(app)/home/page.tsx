import { currentUser } from "@clerk/nextjs/server";
import { fetchTodaysGames } from "@/lib/mlb/api";
import { getWeekSchedule } from "@/lib/nfl/espn";
import { getSchedule as getWnbaSchedule } from "@/lib/wnba/espn";
import { HomeClient } from "@/components/web-tool/home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [user, mlbGames, nflGames, wnbaGames] = await Promise.all([
    currentUser(),
    fetchTodaysGames().catch(() => []),
    getWeekSchedule("HOF_PRE1").catch(() => []),
    getWnbaSchedule().catch(() => []),
  ]);

  const rawFirstName = user?.firstName ?? "there";
  const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1);
  const todayDate = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return <HomeClient userName={firstName} todayDate={todayDate} mlbGames={mlbGames} nflGames={nflGames} wnbaGames={wnbaGames} />;
}
