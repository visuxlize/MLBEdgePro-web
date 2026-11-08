import { PaywallGate } from "@/components/web-tool/paywall-gate";
import { NflPropsBoard } from "@/components/web-tool/nfl-props-board";
import { getNflProps } from "@/lib/nfl/league";

export const dynamic = "force-dynamic";

export default async function NflPropsPage() {
  const { props, games, weekLabel, liveLines } = await getNflProps();
  return (
    <PaywallGate
      requiredTier="fan"
      feature="NFL Game Props Analysis"
      benefits={[
        "Real DraftKings prop lines with open-to-current movement",
        "Hit probability, grade and the reasons behind each lean",
        "Filter by market and game; one-tap slip",
      ]}
    >
      <NflPropsBoard props={props} games={games} weekLabel={weekLabel} liveLines={liveLines} />
    </PaywallGate>
  );
}
