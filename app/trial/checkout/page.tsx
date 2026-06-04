"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { Loader2, Zap, Star, AlertCircle } from "lucide-react";
import Link from "next/link";

const FAN_PLAN_ID = process.env.NEXT_PUBLIC_CLERK_FAN_PLAN_ID!;
const PRO_PLAN_ID = process.env.NEXT_PUBLIC_CLERK_PRO_PLAN_ID!;

function TrialCheckoutInner() {
  const searchParams = useSearchParams();
  const tier = (searchParams.get("tier") ?? "fan") as "fan" | "pro";
  const router = useRouter();
  const clerk = useClerk();
  const [error, setError] = useState<string | null>(null);

  const isFan = tier === "fan";
  const color = isFan ? "#FF7828" : "#818CF8";
  const Icon = isFan ? Zap : Star;
  const trialDays = isFan ? "14" : "3";
  const planId = isFan ? FAN_PLAN_ID : PRO_PLAN_ID;

  useEffect(() => {
    let cancelled = false;

    async function startCheckout() {
      try {
        if (!planId) {
          throw new Error("Plan not configured. Please contact support.");
        }

        // clerk.billing is experimental — cast to any
        const billing = (clerk as any).billing;
        if (!billing) {
          throw new Error("Billing not available. Please refresh and try again.");
        }

        await billing.startCheckout({
          planId,
          planPeriod: "monthly",
        });

        if (!cancelled) {
          router.push(`/games?upgrade=success&tier=${tier}`);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? "Something went wrong. Please try again.");
        }
      }
    }

    // Wait for clerk to be loaded before starting
    if (clerk.loaded) {
      startCheckout();
    }

    return () => { cancelled = true; };
  }, [clerk.loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0E14] flex flex-col items-center justify-center px-6 text-center">
        <div className="rounded-2xl border border-[#EB505A]/25 bg-[#EB505A]/[0.06] p-8 max-w-md w-full">
          <AlertCircle size={32} className="text-[#EB505A] mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-[#EB505A] font-bold text-lg mb-2">Couldn&apos;t start checkout</p>
          <p className="text-white/40 text-sm mb-6 leading-relaxed">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`/trial?tier=${tier}`}
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-white transition-colors"
              style={{ background: color }}
            >
              Try again
            </a>
            <Link
              href="/games"
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium text-white/40 border border-white/[0.08] hover:text-white transition-colors"
            >
              Back to app
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E14] flex flex-col items-center justify-center px-6 text-center">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px]"
        style={{ background: `${color}0D` }}
      />

      <div className="relative z-10 flex flex-col items-center gap-5">
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <Loader2 size={28} className="animate-spin" style={{ color }} />
        </div>

        <div>
          <p className="text-white font-black text-xl mb-1">Setting up your trial…</p>
          <p className="text-white/40 text-sm">
            Opening checkout for your{" "}
            <span className="font-bold" style={{ color }}>
              {trialDays}-day {isFan ? "Fan" : "Pro"} trial
            </span>
          </p>
        </div>

        {/* Badge */}
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
