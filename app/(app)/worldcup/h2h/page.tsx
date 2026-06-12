import { WorldCupNav } from "@/components/worldcup/WorldCupNav";
import { H2HMatchup } from "@/components/worldcup/H2HMatchup";

export const metadata = { title: "WC 2026 H2H – MLBEdgePro" };

export default function H2HPage() {
  return (
    <div className="min-h-screen bg-[#060C18] px-4 py-8 max-w-4xl mx-auto">
      <div className="mb-6 overflow-x-auto">
        <WorldCupNav />
      </div>
      <H2HMatchup />
    </div>
  );
}
