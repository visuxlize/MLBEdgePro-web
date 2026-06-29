import { PaywallGate } from "@/components/web-tool/paywall-gate";
import { WCNav } from "@/components/worldcup/WCNav";

export default function WCLayout({ children }: { children: React.ReactNode }) {
  return (
    <PaywallGate
      requiredTier="pro"
      feature="FIFA World Cup 2026"
      benefits={[
        "Live group standings & match scores",
        "Full knockout bracket with AI predictions",
        "Match analysis & xG metrics",
        "AI tournament simulation (10,000 runs)",
      ]}
    >
      <div className="spotlight min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 pt-4 pb-2">
          <WCNav />
        </div>
        {children}
      </div>
    </PaywallGate>
  );
}
