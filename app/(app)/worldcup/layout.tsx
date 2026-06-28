import { PaywallGate } from "@/components/web-tool/paywall-gate";
import { WorldCupNav } from "@/components/worldcup/WorldCupNav";

export default function WorldCupLayout({ children }: { children: React.ReactNode }) {
  return (
    <PaywallGate
      requiredTier="pro"
      feature="FIFA World Cup Analysis"
      benefits={[
        "Tournament bracket and simulation insights",
        "Host city map with venue context",
        "Live World Cup betting/props dashboard",
        "Head-to-head lineup and matchup analysis",
      ]}
    >
      <div className="spotlight min-h-screen px-3 sm:px-4 py-6 sm:py-8" style={{ background: "var(--bg)" }}>
        <div className="max-w-7xl mx-auto mb-5 sm:mb-6">
          <WorldCupNav />
        </div>
        {children}
      </div>
    </PaywallGate>
  );
}
