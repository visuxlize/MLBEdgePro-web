import { H2HMatchup } from "@/components/worldcup/H2HMatchup";

export const metadata = { title: "WC 2026 H2H – MLBEdgePro" };

export default function H2HPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <H2HMatchup />
    </div>
  );
}
