import { getNflCurrentWeek, getNflStandings, getNflWeek } from "@/lib/nfl/league";
import { NflHub } from "@/components/web-tool/nfl-hub";

export const dynamic = "force-dynamic";

export default async function NflPage() {
  const cur = await getNflCurrentWeek();
  const [initial, standings] = await Promise.all([getNflWeek(cur.seasonType, cur.week), getNflStandings()]);
  return <NflHub initial={initial} current={{ type: cur.seasonType, week: cur.week }} standings={standings} />;
}
