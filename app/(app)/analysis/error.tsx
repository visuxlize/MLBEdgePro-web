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
    <div className="spotlight min-h-[60vh] flex flex-col items-center justify-center px-6 text-center" style={{ background: "var(--bg)" }}>
      <div className="w-14 h-14 rounded-[var(--r-tile)] flex items-center justify-center mb-5"
        style={{ background: "color-mix(in srgb, var(--orange) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--orange) 28%, transparent)" }}>
        <Zap size={22} strokeWidth={1.5} style={{ color: "var(--orange)" }} />
      </div>
      <h1 className="font-spot-sans text-xl font-black mb-2" style={{ color: "var(--text)" }}>Edge Report unavailable</h1>
      <p className="font-spot-sans text-sm mb-6 max-w-xs" style={{ color: "var(--text-muted)" }}>
        Could not load today&apos;s edge data. This usually resolves in a few seconds.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--r-tile)] font-spot-sans text-sm font-bold transition-colors"
          style={{ background: "color-mix(in srgb, var(--orange) 15%, transparent)", border: "1px solid color-mix(in srgb, var(--orange) 30%, transparent)", color: "var(--orange-soft)" }}
        >
          <RefreshCw size={13} strokeWidth={2} />
          Retry
        </button>
        <Link
          href="/games"
          className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--r-tile)] font-spot-sans text-sm font-bold transition-colors"
          style={{ background: "rgba(255,255,255,.06)", border: "1px solid var(--hairline)", color: "var(--text-muted)" }}
        >
          <ArrowLeft size={13} strokeWidth={2} />
          Games
        </Link>
      </div>
    </div>
  );
}
