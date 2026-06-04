"use client";

import { useEffect } from "react";
import { Zap, Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import { setPendingTrial } from "@/components/PendingTrialRedirect";

const TIER_META = {
  fan: {
    label:    "Fan",
    trial:    "14-day free trial",
    price:    "$4.99/mo after",
    tagline:  "Props, Edge Report & matchup analysis — every game, every day.",
    color:    "#FF7828",
    bg:       "rgba(255,120,40,0.08)",
    border:   "rgba(255,120,40,0.25)",
    Icon:     Zap,
  },
  pro: {
    label:    "Pro",
    trial:    "3-day free trial",
    price:    "$14.99/mo after",
    tagline:  "Spray charts, barrel rate, exit velocity & daily picks.",
    color:    "#818CF8",
    bg:       "rgba(129,140,248,0.08)",
    border:   "rgba(129,140,248,0.25)",
    Icon:     Star,
  },
} as const;

export function TrialLanding({ tier }: { tier: "fan" | "pro" }) {
  const meta = TIER_META[tier];
  const { Icon } = meta;

  // Save the intent immediately — survives the entire sign-up/OAuth flow
  useEffect(() => {
    setPendingTrial(tier);
  }, [tier]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-[#0A0E14] overflow-hidden">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[100px]"
        style={{ background: `${meta.color}12` }}
      />

      <div className="relative z-10 w-full max-w-md text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 border mb-6"
          style={{ background: meta.bg, borderColor: meta.border }}
        >
          <Icon size={12} strokeWidth={2.5} style={{ color: meta.color }} />
          <span className="text-xs font-black tracking-wider uppercase" style={{ color: meta.color }}>
            {meta.label} — {meta.trial}
          </span>
        </div>

        <h1 className="text-3xl font-black text-white tracking-tight mb-3">
          Start your free trial
        </h1>

        <p className="text-white/45 text-sm leading-relaxed mb-2">
          {meta.tagline}
        </p>
        <p className="text-white/25 text-xs mb-10">
          {meta.price} · Card required · Cancel anytime
        </p>

        {/* CTA — goes to the real /sign-up page which has proper OAuth handling */}
        <Link
          href="/sign-up"
          className="inline-flex items-center justify-center gap-2 w-full h-13 rounded-full text-white font-bold text-base shadow-[0_8px_32px_rgba(255,120,40,0.35)] transition-opacity hover:opacity-90"
          style={{ background: meta.color }}
        >
          Create account — free {meta.label} trial
          <ArrowRight size={16} strokeWidth={2.5} />
        </Link>

        <p className="mt-4 text-xs text-white/25">
          Already have an account?{" "}
          <Link href="/sign-in" className="transition-colors" style={{ color: meta.color }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
