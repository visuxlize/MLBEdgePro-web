import { currentUser } from "@clerk/nextjs/server";
import { fetchTodaysGames } from "@/lib/mlb/api";
import { getWeekSchedule } from "@/lib/nfl/espn";
import { HomeClient } from "@/components/web-tool/home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [user, mlbGames, nflGames] = await Promise.all([
    currentUser(),
    fetchTodaysGames().catch(() => []),
    getWeekSchedule("HOF_PRE1").catch(() => []),
  ]);

  const firstName = user?.firstName ?? "there";
  const todayDate = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return <HomeClient userName={firstName} todayDate={todayDate} mlbGames={mlbGames} nflGames={nflGames} />;
}
