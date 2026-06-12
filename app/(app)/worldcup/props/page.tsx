import { WorldCupNav } from "@/components/worldcup/WorldCupNav";
import { BettingDashboard } from "@/components/worldcup/BettingDashboard";

export const metadata = { title: "WC 2026 Betting – MLBEdgePro" };

export default function PropsPage() {
  return (
    <div className="min-h-screen bg-[#060C18] px-4 py-8 max-w-4xl mx-auto">
      <div className="mb-6 overflow-x-auto">
        <WorldCupNav />
      </div>
      <BettingDashboard />
    </div>
  );
}
