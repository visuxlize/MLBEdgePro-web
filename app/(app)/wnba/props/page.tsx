import { PaywallGate } from "@/components/web-tool/paywall-gate";
import { getPlayerProps } from "@/lib/wnba/sportsblaze";
import { WnbaPropsTool } from "@/components/web-tool/wnba-props-tool";

export default async function WnbaPropsPage() {
  const props = await getPlayerProps();

  return (
    <PaywallGate
      requiredTier="fan"
      feature="WNBA Prop Builder"
      benefits={[
        "Model projection vs. the book on every prop",
        "Position filters — PG, SG, SF, PF, C",
        "One-tap parlay slip with live edge & payout",
      ]}
    >
      <WnbaPropsTool props={props} />
    </PaywallGate>
  );
}
