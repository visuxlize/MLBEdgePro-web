"use client";

import Link from "next/link";
import { Lock, Zap, Check, ArrowRight, Star } from "lucide-react";
import { useSubscription, canAccess } from "@/lib/subscription";

interface Props {
  children: React.ReactNode;
  /** Which tier is required to see this content */
  requiredTier?: "fan" | "pro";
  feature?: string;
  benefits?: string[];
}

const TIER_CONFIG = {
  fan: {
    label:    "Fan Plan",
    price:    "$4.99",
    color:    "#FF7828",
    badge:    "FAN",
    tagline:  "Win probability, full props, edge reports & matchup analysis",
    benefits: [
      "Win probability model per game",
      "Full prop signals — all HR, Hit, K, 2+ Bases players",
      "Edge Report — AI-ranked value bets",
      "Full Prop Builder across all games",
      "Pitcher strikeout O/U + Total Runs O/U",
    ],
  },
  pro: {
    label:    "Pro Plan",
    price:    "$14.99",
    color:    "#818cf8",
    badge:    "PRO",
    tagline:  "Everything in Fan + the deepest MLB analysis anywhere",
    benefits: [
      "Everything in Fan ($4.99/mo)",
      "Bet Tracker — log slips, FanDuel odds, ROI tracking",
      "HR Deep Dive — spray charts & wall clearance",
      "Pitch → spray connection for all batters",
      "Barrel rate, exit velocity & pitcher vulnerability",
    ],
  },
};

export function PaywallGate({
  children,
  requiredTier = "fan",
  feature,
  benefits,
}: Props) {
  const subscription = useSubscription();

  if (!subscription.isLoaded) return null;
  if (canAccess(requiredTier, subscription)) return <>{children}</>;

  const cfg = TIER_CONFIG[requiredTier];
  const displayFeature = feature ?? (requiredTier === "pro" ? "HR Deep Dive" : "Pro Feature");
  const displayBenefits = benefits ?? cfg.benefits;

  return (
    <div
      className="relative grid w-full place-items-center overflow-hidden"
      style={{ minHeight: "calc(100vh - 3.5rem)" }}
    >
      {/* Dim preview */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none select-none"
        style={{ filter: "blur(4px) saturate(0.3)" }}
        aria-hidden
      >
        {children}
      </div>

      {/* Veil */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 90% 80% at 50% 50%, rgba(10,14,20,0.55) 0%, rgba(10,14,20,0.96) 100%)" }} />

      {/* Lock card */}
      <div className="relative z-10 flex w-full items-center justify-center p-5 sm:p-8">
        <div
          className="w-full max-w-[440px] rounded-3xl backdrop-blur-2xl shadow-[0_32px_80px_rgba(0,0,0,0.8)] overflow-hidden border"
          style={{ backgroundColor: "#0D1117fd", borderColor: `${cfg.color}22` }}
        >
          {/* Glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-44 rounded-full blur-3xl pointer-events-none"
            style={{ backgroundColor: `${cfg.color}12` }} />

          <div className="relative px-7 sm:px-9 py-9 sm:py-10 flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
              style={{ backgroundColor: `${cfg.color}15`, border: `1px solid ${cfg.color}30`, boxShadow: `0 8px 24px ${cfg.color}20` }}>
              {requiredTier === "pro"
                ? <Star size={26} style={{ color: cfg.color }} strokeWidth={1.7} />
                : <Lock size={26} style={{ color: cfg.color }} strokeWidth={1.7} />
              }
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 mb-3"
              style={{ borderColor: `${cfg.color}30`, backgroundColor: `${cfg.color}12` }}>
              <Zap size={9} style={{ color: cfg.color }} strokeWidth={2.5} />
              <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: cfg.color }}>{cfg.badge} PLAN</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">{displayFeature}</h3>
            <p className="text-sm text-white/40 mb-6 leading-relaxed max-w-xs">{cfg.tagline}</p>

            {/* Benefits */}
            <ul className="space-y-2.5 mb-7 w-full text-left">
              {displayBenefits.map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cfg.color}15`, border: `1px solid ${cfg.color}25` }}>
                    <Check size={10} style={{ color: cfg.color }} strokeWidth={3} />
                  </div>
                  <span className="text-sm text-white/60">{b}</span>
                </li>
              ))}
            </ul>

            {/* Price */}
            <div className="flex items-baseline justify-center gap-1 mb-5">
              <span className="text-4xl font-black text-white">{cfg.price}</span>
              <span className="text-white/30 text-base">/month</span>
            </div>

            {/* CTA */}
            <Link href={`/upgrade?tier=${requiredTier}`} className="w-full">
              <button
                className="w-full h-12 rounded-full flex items-center justify-center gap-2 font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${cfg.color}ee, ${cfg.color}bb)`, boxShadow: `0 8px 28px ${cfg.color}40` }}
              >
                <Zap size={14} strokeWidth={2.5} />
                Upgrade to {cfg.label}
                <ArrowRight size={13} strokeWidth={2.5} />
              </button>
            </Link>

            <p className="mt-4 text-xs text-white/18">Cancel anytime · Billed monthly · No contracts</p>
          </div>
        </div>
      </div>
    </div>
  );
}
