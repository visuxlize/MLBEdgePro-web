import { getNflStandings } from "@/lib/nfl/league";
import { NflStandings } from "@/components/web-tool/nfl-standings";

export const dynamic = "force-dynamic";

export default async function NflStandingsPage() {
  return <NflStandings rows={await getNflStandings()} />;
}
