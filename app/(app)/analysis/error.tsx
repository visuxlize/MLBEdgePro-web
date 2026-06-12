"use client";

import Link from "next/link";
import { RefreshCw, Zap, ArrowLeft } from "lucide-react";

export default function AnalysisError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#FF7828]/10 border border-[#FF7828]/20 flex items-center justify-center mb-5">
        <Zap size={22} className="text-[#FF7828]" strokeWidth={1.5} />
      </div>
      <h1 className="text-xl font-black text-white mb-2">Edge Report unavailable</h1>
      <p className="text-sm text-white/40 mb-6 max-w-xs">
        Could not load today&apos;s edge data. This usually resolves in a few seconds.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF7828]/15 border border-[#FF7828]/30 text-sm font-bold text-[#FF7828] hover:bg-[#FF7828]/25 transition-colors"
        >
          <RefreshCw size={13} strokeWidth={2} />
          Retry
        </button>
        <Link
          href="/games"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.10] text-sm font-bold text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft size={13} strokeWidth={2} />
          Games
        </Link>
      </div>
    </div>
  );
}
