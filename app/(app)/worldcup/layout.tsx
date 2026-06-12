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
      <div className="min-h-screen bg-[#060C18] px-4 py-8">
        <div className="max-w-7xl mx-auto mb-6 overflow-x-auto">
          <WorldCupNav />
        </div>
        {children}
      </div>
    </PaywallGate>
  );
}
