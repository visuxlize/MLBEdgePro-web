import Link from "next/link";
import { AppSidebar } from "@/components/web-tool/app-sidebar";
import { PendingTrialRedirect } from "@/components/PendingTrialRedirect";
import { FloatingChat } from "@/components/web-tool/floating-chat";

function DisclaimerStrip() {
  return (
    <div className="border-t border-white/[0.04] bg-[#080C12] px-4 py-3 text-center">
      <p className="text-[10px] text-white/18 leading-relaxed max-w-4xl mx-auto">
        <span className="font-bold text-white/28">DISCLAIMER:</span> MLB Edge is for entertainment &amp; informational purposes only.
        All projections are model estimates — not guarantees of any outcome. Sports betting involves risk. Must be 21+.{" "}
        <Link href="/responsible-gambling" className="text-[#50C882]/50 hover:text-[#50C882]/80 underline underline-offset-2 transition-colors">
          Responsible Gambling
        </Link>
        {" · "}
        <span className="text-white/22">Helpline: 1-800-522-4700</span>
      </p>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PendingTrialRedirect />
      <AppSidebar />
      <main className="flex-1 w-full">{children}</main>
      <DisclaimerStrip />
      <FloatingChat />
    </div>
  );
}
