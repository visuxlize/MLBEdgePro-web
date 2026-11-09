import { SavedSlipsPanel } from "@/components/web-tool/saved-slips-panel";
import { SportHeader } from "@/components/web-tool/sport-ui";

export const metadata = { title: "My Slips — Edge Pro" };

export default function SlipsPage() {
  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-lg mx-auto page-pad py-4 sm:py-6" style={{ paddingBottom: 110 }}>
        <SportHeader
          eyebrow="Your bets" title="My Slips" accent="#1a73ff"
          subtitle="Everything you've saved — with your stake, the payout, and a running win/loss. We check the final box scores and mark each leg for you."
        />
        <SavedSlipsPanel mode="full" />
      </div>
    </div>
  );
}
