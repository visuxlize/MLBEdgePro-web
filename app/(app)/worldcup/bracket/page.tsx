import { WorldCupNav } from "@/components/worldcup/WorldCupNav";
import { LiveAnimatedBracket } from "@/components/worldcup/LiveAnimatedBracket";

export const metadata = { title: "WC 2026 Bracket – MLBEdgePro" };

export default function BracketPage() {
  return (
    <div className="min-h-screen bg-[#060C18] px-4 py-8 max-w-7xl mx-auto">
      <div className="mb-6 overflow-x-auto">
        <WorldCupNav />
      </div>
      <LiveAnimatedBracket />
    </div>
  );
}
