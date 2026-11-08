import { getNbaStandings } from "@/lib/nba/espn";
import { NbaStandings } from "@/components/web-tool/nba-standings";

export const dynamic = "force-dynamic";

export default async function NbaStandingsPage() {
  return <NbaStandings rows={await getNbaStandings()} />;
}
