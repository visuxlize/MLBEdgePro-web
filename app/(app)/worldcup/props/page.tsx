import { BettingDashboard } from "@/components/worldcup/BettingDashboard";

export const metadata = { title: "WC 2026 Betting – MLBEdgePro" };

export default function PropsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <BettingDashboard />
    </div>
  );
}
