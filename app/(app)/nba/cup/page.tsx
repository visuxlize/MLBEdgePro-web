import { getNbaCup } from "@/lib/nba/espn";
import { NbaCup } from "@/components/web-tool/nba-cup";

export const dynamic = "force-dynamic";

export default async function NbaCupPage() {
  return <NbaCup data={await getNbaCup()} />;
}
