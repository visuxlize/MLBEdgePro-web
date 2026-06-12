import { LiveAnimatedBracket } from "@/components/worldcup/LiveAnimatedBracket";

export const metadata = { title: "WC 2026 Bracket – MLBEdgePro" };

export default function BracketPage() {
  return (
    <div className="w-full px-2 sm:px-4">
      <LiveAnimatedBracket />
    </div>
  );
}
