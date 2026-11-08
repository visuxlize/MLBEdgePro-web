import Link from "next/link";
import { AppSidebar } from "@/components/web-tool/app-sidebar";
import { PendingTrialRedirect } from "@/components/PendingTrialRedirect";
import { OffseasonGuard } from "@/components/web-tool/offseason-guard";

function DisclaimerStrip() {
  return (
    <div className="px-4 py-4 text-center" style={{ borderTop: "1px solid rgba(20,22,27,.06)" }}>
      <p className="text-[11px] leading-relaxed max-w-4xl mx-auto" style={{ color: "#8a909b" }}>
        <span className="font-bold" style={{ color: "#6b7280" }}>DISCLAIMER:</span> Edge Pro is for entertainment &amp; informational purposes only.
        All projections are model estimates — not guarantees of any outcome. Sports betting involves risk. Must be 21+.{" "}
        <Link href="/responsible-gambling" className="underline underline-offset-2 transition-colors" style={{ color: "#1a73ff" }}>
          Responsible Gambling
        </Link>
        {" · "}
        <span>Helpline: 1-800-522-4700</span>
      </p>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#eceef2" }}>
      <PendingTrialRedirect />
      <AppSidebar />
      {/* Phones: clear the bottom tab bar. 640–1023: clear the vertical rail. */}
      <div className="flex-1 flex flex-col pb-[calc(62px+env(safe-area-inset-bottom))] sm:pb-0 sm:pl-[calc(76px+env(safe-area-inset-left))] lg:pl-0">
        <OffseasonGuard>
          <main className="flex-1 w-full">{children}</main>
        </OffseasonGuard>
        <DisclaimerStrip />
      </div>
    </div>
  );
}
