"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Loader2, Zap, Star } from "lucide-react";

function TrialCheckoutInner() {
  const searchParams = useSearchParams();
  const tier = (searchParams.get("tier") ?? "fan") as "fan" | "pro";
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startCheckout() {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier, trial: true }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
        if (!data.url) throw new Error("No checkout URL returned");

        window.location.href = data.url;
      } catch (err: any) {
        setError(err.message ?? "Something went wrong. Please try again.");
      }
    }

    startCheckout();
  }, [tier]);

  const isFan = tier === "fan";
  const color = isFan ? "#FF7828" : "#818CF8";
  const Icon = isFan ? Zap : Star;
  const trialDays = isFan ? "14" : "3";

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="rounded-2xl border border-[#EB505A]/25 bg-[#EB505A]/[0.06] p-8 max-w-md w-full">
          <p className="text-[#EB505A] font-bold text-lg mb-2">Couldn't start checkout</p>
          <p className="text-white/40 text-sm mb-6">{error}</p>
          <a
            href={`/trial?tier=${tier}`}
            className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-white transition-colors"
            style={{ background: color }}
          >
            Try again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px]"
        style={{ background: `${color}0D` }}
      />

      <div className="relative z-10 flex flex-col items-center gap-5">
        {/* Spinning icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <Loader2 size={28} className="animate-spin" style={{ color }} />
        </div>

        <div>
          <p className="text-white font-black text-xl mb-1">Setting up your trial</p>
          <p className="text-white/40 text-sm">
            Redirecting to Stripe for your {trialDays}-day{" "}
            <span style={{ color }} className="font-bold">
              {isFan ? "Fan" : "Pro"}
            </span>{" "}
            trial…
          </p>
        </div>

        <div
          className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold"
          style={{ background: `${color}15`, color }}
        >
          <Icon size={11} strokeWidth={2.5} />
          {trialDays}-day free trial · No charge today
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
