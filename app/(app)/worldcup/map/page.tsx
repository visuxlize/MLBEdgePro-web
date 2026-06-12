import { WorldCupNav } from "@/components/worldcup/WorldCupNav";
import { HostMapVisualizer } from "@/components/worldcup/HostMapVisualizer";

export const metadata = { title: "WC 2026 Host Map – MLBEdgePro" };

export default function MapPage() {
  return (
    <div className="min-h-screen bg-[#060C18] px-4 py-8 max-w-6xl mx-auto">
      <div className="mb-6 overflow-x-auto">
        <WorldCupNav />
      </div>
      <HostMapVisualizer />
    </div>
  );
}
