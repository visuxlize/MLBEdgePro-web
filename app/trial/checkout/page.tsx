"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Zap, Star, AlertCircle } from "lucide-react";
import Link from "next/link";

const TRIAL_TIER_KEY = "mlbedge_pending_trial_tier";

function TrialCheckoutInner() {
  const searchParams = useSearchParams();

  // Prefer URL query param; fall back to sessionStorage (set before OAuth redirect)
  const tierFromUrl = searchParams.get("tier") as "fan" | "pro" | null;
  const tierFromStorage = typeof window !== "undefined"
    ? (sessionStorage.getItem(TRIAL_TIER_KEY) as "fan" | "pro" | null)
    : null;
  const tier = tierFromUrl ?? tierFromStorage ?? "fan";
  const [error, setError] = useState<string | null>(null);

  const isFan = tier === "fan";
  const color = isFan ? "#1a73ff" : "#6d4fe0";
  const Icon = isFan ? Zap : Star;
  const trialDays = isFan ? "14" : "3";

  useEffect(() => {
    let cancelled = false;

    async function startCheckout() {
      // Clear the pending tier now that we're in checkout
      sessionStorage.removeItem(TRIAL_TIER_KEY);

      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier, trial: true }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
        if (!data.url) throw new Error("No checkout URL returned");
        window.location.href = data.url;
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? "Something went wrong. Please try again.");
        }
      }
    }

    startCheckout();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="min-h-screen bg-[#eceef2] flex flex-col items-center justify-center px-6 text-center">
        <div className="rounded-2xl border border-[#ef3b4a]/25 bg-[#ef3b4a]/[0.06] p-8 max-w-md w-full">
          <AlertCircle size={32} className="text-[#ef3b4a] mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-[#ef3b4a] font-bold text-lg mb-2">Couldn&apos;t start checkout</p>
          <p className="text-[#14161b]/56 text-sm mb-6 leading-relaxed">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`/trial?tier=${tier}`}
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-[#14161b] transition-colors"
              style={{ background: color }}
            >
              Try again
            </a>
            <Link
              href="/games"
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium text-[#14161b]/56 border border-[#14161b]/[.09] hover:text-[#14161b] transition-colors"
            >
              Back to app
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eceef2] flex flex-col items-center justify-center px-6 text-center">
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px]"
        style={{ background: `${color}0D` }}
      />

      <div className="relative z-10 flex flex-col items-center gap-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <Loader2 size={28} className="animate-spin" style={{ color }} />
        </div>

        <div>
          <p className="text-[#14161b] font-black text-xl mb-1">Setting up your trial…</p>
          <p className="text-[#14161b]/56 text-sm">
            Opening checkout for your{" "}
            <span className="font-bold" style={{ color }}>
              {trialDays}-day {isFan ? "Fan" : "Pro"} trial
            </span>
          </p>
        </div>

        <div
          className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold"
          style={{ background: `${color}15`, color }}
        >
          <Icon size={11} strokeWidth={2.5} />
          {trialDays}-day free trial · No charge today · Card required
        </div>
      </div>
    </div>
  );
}

export default function TrialCheckoutPage() {
  return (
    <Suspense>
      <TrialCheckoutInner />
    </Suspense>
  );
}
