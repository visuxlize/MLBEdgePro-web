import { PaywallGate } from "@/components/web-tool/paywall-gate";
import { getPlayerProps } from "@/lib/nfl/sportsblaze";
import { NflPropsTool } from "@/components/web-tool/nfl-props-tool";

export default async function NflPropsPage() {
  const props = await getPlayerProps();

  return (
    <PaywallGate
      requiredTier="pro"
      feature="NFL Prop Builder"
      benefits={[
        "Model projection vs. the book on every prop",
        "Position filters — QB, RB, WR, TE",
        "One-tap parlay slip with live edge & payout",
      ]}
    >
      <NflPropsTool props={props} />
    </PaywallGate>
  );
}
