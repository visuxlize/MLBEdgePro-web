import { PaywallGate } from "@/components/web-tool/paywall-gate";
import { PicksBoard } from "@/components/web-tool/picks-board";
import { getPicksData } from "@/lib/picks/data";

export const metadata = { title: "Picks — Edge Pro" };
export const revalidate = 300;

export default async function PicksPage() {
  const data = await getPicksData();
  return (
    <PaywallGate
      requiredTier="fan"
      feature="Picks"
      benefits={[
        "Single bets, same-game and multi-game parlays — ranked by edge",
        "The research behind every pick: the case and the risks",
        "Correlation-aware parlay odds, tuned to your results",
      ]}
    >
      <PicksBoard {...data} />
    </PaywallGate>
  );
}
