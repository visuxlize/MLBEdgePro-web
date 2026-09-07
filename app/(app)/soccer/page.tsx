import { fetchAllSoccerFixtures } from "@/lib/soccer/espn";
import { SoccerDashboard } from "@/components/web-tool/soccer-dashboard";

export const dynamic = "force-dynamic";

export default async function SoccerPage() {
  const matches = await fetchAllSoccerFixtures();
  return <SoccerDashboard matches={matches} />;
}
