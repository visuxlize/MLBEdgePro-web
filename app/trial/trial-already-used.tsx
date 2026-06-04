"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Star, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

const TIER_META = {
  fan: {
    label:   "Fan",
    price:   "$4.99 / month",
    tagline: "Props, Edge Report & matchup analysis — every game, every day.",
    color:   "#FF7828",
    bg:      "rgba(255,120,40,0.08)",
    border:  "rgba(255,120,40,0.25)",
    Icon:    Zap,
    features: [
      "AI-ranked value bets (Edge Report)",
      "Full Prop Builder — HR, Hit, K props",
      "Batter vs. Pitcher matchup analysis",
      "Multi-leg prop slips & bet tracking",
      "Priority data refresh",
    ],
  },
  pro: {
    label:   "Pro",
    price:   "$14.99 / month",
    tagline: "Full edge — spray charts, barrel rate, exit velocity & daily picks.",
    color:   "#818CF8",
    bg:      "rgba(129,140,248,0.08)",
    border:  "rgba(129,140,248,0.25)",
    Icon:    Star,
    features: [
      "Everything in Fan",
      "HR Deep Dive — spray charts & grades",
      "Wall Clearance + Carry Analysis",
      "Barrel Rate & Exit Velocity Analysis",
      "Confident daily picks with edge scores",
      "Batter power & pitcher vulnerability",
    ],
  },
} as const;

function PlanCard({
  tierKey,
  onSubscribe,
  loading,
}: {
  tierKey: "fan" | "pro";
  onSubscribe: (tier: "fan" | "pro") => void;
  loading: "fan" | "pro" | null;
}) {
  const meta = TIER_META[tierKey];
  const { Icon } = meta;
  const isLoading = loading === tierKey;

  return (
    <div
      className="rounded-2xl border p-6 flex flex-col gap-5"
      style={{ background: meta.bg, borderColor: meta.border }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${meta.color}20` }}
          >
            <Icon size={17} strokeWidth={2.5} style={{ color: meta.color }} />
          </div>
          <div>
            <p className="text-xs font-black tracking-widest uppercase" style={{ color: meta.color }}>
              {meta.label}
            </p>
            <p className="text-white font-black text-lg leading-tight">{meta.price}</p>
          </div>
        </div>
        <p className="text-xs text-white/30 font-medium">Cancel anytime</p>
      </div>

      {/* Tagline */}
      <p className="text-sm text-white/50 leading-relaxed">{meta.tagline}</p>

      {/* Features */}
      <ul className="space-y-2">
        {meta.features.map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-sm text-white/65">
            <CheckCircle size={13} strokeWidth={2.5} style={{ color: meta.color, flexShrink: 0 }} />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={() => onSubscribe(tierKey)}
        disabled={loading !== null}
        className="mt-auto flex items-center justify-center gap-2 h-11 rounded-full font-bold text-sm text-white transition-opacity disabled:opacity-50"
        style={{
          background: meta.color,
          boxShadow: `0 6px 24px ${meta.color}40`,
        }}
      >
        {isLoading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <>
            Subscribe to {meta.label}
            <ArrowRight size={14} strokeWidth={2.5} />
          </>
        )}
      </button>
    </div>
  );
}

export function TrialAlreadyUsed({ tier }: { tier: "fan" | "pro" }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"fan" | "pro" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe(selectedTier: "fan" | "pro") {
    setLoading(selectedTier);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // trial: false — this is a paid subscription, no trial
        body: JSON.stringify({ tier: selectedTier, trial: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      if (!data.url) throw new Error("No checkout URL returned");
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-[#0A0E14] overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] rounded-full bg-[#FF7828]/[0.06] blur-[100px]" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF7828]/25 bg-[#FF7828]/[0.08] px-4 py-1.5">
            <Zap size={11} className="text-[#FF7828]" strokeWidth={2.5} />
            <span className="text-xs font-bold text-[#FF7828] tracking-widest uppercase">MLB Edge Pro</span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight mb-3">
            You've already used your free trial
          </h1>
          <p className="text-white/45 text-base leading-relaxed max-w-md mx-auto">
            Your trial has ended. Subscribe now to keep every edge — or stay on the free plan.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl border border-[#EB505A]/25 bg-[#EB505A]/[0.06] px-4 py-3 text-sm text-[#EB505A]">
            {error}
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <PlanCard tierKey="fan" onSubscribe={handleSubscribe} loading={loading} />
          <PlanCard tierKey="pro" onSubscribe={handleSubscribe} loading={loading} />
        </div>

        {/* Stay free */}
        <div className="text-center">
          <Link
            href="/games"
            className="text-sm text-white/30 hover:text-white/60 transition-colors"
          >
            Continue on Free plan →
          </Link>
        </div>
      </div>
    </div>
  );
}
