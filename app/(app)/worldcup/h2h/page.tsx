import { MatchAnalysis } from "@/components/worldcup/MatchAnalysis";

export const metadata = { title: "WC 2026 Match Analysis – MLBEdgePro" };

export default function MatchAnalysisPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <MatchAnalysis />
    </div>
  );
}
