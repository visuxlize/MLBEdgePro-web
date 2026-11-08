import { PaywallGate } from "@/components/web-tool/paywall-gate";
import { SoccerPropsBoard } from "@/components/web-tool/soccer-props-board";
import { getSoccerProps } from "@/lib/soccer/props";
import { etDateStr } from "@/lib/season";

export const dynamic = "force-dynamic";

export default async function SoccerPropsPage() {
  const data = await getSoccerProps(etDateStr(0));
  return (
    <PaywallGate
      requiredTier="fan"
      feature="Soccer Player Props"
      benefits={["Live DraftKings goalscorer, shots, cards & assists markets", "Implied chance and price movement on every prop", "Every major league, one board"]}
    >
      <SoccerPropsBoard data={data} />
    </PaywallGate>
  );
}
