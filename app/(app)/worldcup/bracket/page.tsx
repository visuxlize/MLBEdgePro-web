import { LiveAnimatedBracket } from "@/components/worldcup/LiveAnimatedBracket";

export const metadata = { title: "WC 2026 Bracket – MLBEdgePro" };

export default function BracketPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <LiveAnimatedBracket />
    </div>
  );
}
