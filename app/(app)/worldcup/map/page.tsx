import { HostMapVisualizer } from "@/components/worldcup/HostMapVisualizer";

export const metadata = { title: "WC 2026 Host Map – MLBEdgePro" };

export default function MapPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <HostMapVisualizer />
    </div>
  );
}
