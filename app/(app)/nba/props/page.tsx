import { PaywallGate } from "@/components/web-tool/paywall-gate";
import { NbaPropsTool } from "@/components/web-tool/nba-props-tool";
import { getNbaProps } from "@/lib/nba/props";

export const dynamic = "force-dynamic";

export default async function NbaPropsPage() {
  const { props, games, dayLabel, liveLines } = await getNbaProps();
  return (
    <PaywallGate
      requiredTier="fan"
      feature="NBA Props Analysis"
      benefits={[
        "Real DraftKings prop lines with open-to-current movement",
        "Hit probability & grade on points, rebounds, assists, threes",
        "Filter by market, side and game",
        "One-tap slip with combined model hit chance",
      ]}
    >
      <NbaPropsTool props={props} games={games} dayLabel={dayLabel} liveLines={liveLines} />
    </PaywallGate>
  );
}
