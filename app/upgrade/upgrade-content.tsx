"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Minus, Zap, Star, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/lib/subscription";

const FREE_FEATURES = [
  "Today's full game schedule",
  "Live scores & game status",
  "Win prediction (home / away)",
  "Upcoming matchup overview",
  "Stadium weather conditions",
];

const FAN_FEATURES = [
  "Everything in Free",
  "Edge Report — AI-ranked value bets",
  "Full Prop Builder (HR, 1+ Hit, 2+ Hits, K props)",
  "Batter vs Pitcher matchup analysis",
  "Multi-leg prop slips",
  "Save & track your bet slips",
  "Priority data refresh",
];

const PRO_FEATURES = [
  "Everything in Fan",
  "HR Deep Dive — spray charts & grade",
  "Wall Clearance + Carry Analysis",
  "Pitch → Spray Connection",
  "Barrel Rate & Exit Velocity Analysis",
  "Confident daily picks",
  "Batter power & pitcher vulnerability",
  "⚽ World Cup 2026 — Group stage, brackets & AI picks",
  "⚽ Live group standings & team deep dives",
  "⚽ ELO win probabilities for every match",
];

const COMPARISON: [string, boolean, boolean, boolean][] = [
  ["Today's game schedule",            true,  true,  true ],
  ["Live scores",                      true,  true,  true ],
  ["Win predictions",                  true,  true,  true ],
  ["Weather conditions",               true,  true,  true ],
  ["Home Run props",                   false, true,  true ],
  ["Hit & 2+ Hit props",               false, true,  true ],
  ["Pitcher K projections",            false, true,  true ],
  ["Edge Report",                      false, true,  true ],
  ["Matchup analysis",                 false, true,  true ],
  ["Prop Builder & slips",             false, true,  true ],
  ["HR Deep Dive",                     false, false, true ],
  ["Wall Clearance Analysis",          false, false, true ],
  ["Carry Conditions",                 false, false, true ],
  ["Pitch → Spray Connection",         false, false, true ],
  ["⚽ WC Groups & Standings",         false, false, true ],
  ["⚽ WC Bracket & Predictions",      false, false, true ],
  ["⚽ Team Deep Dives & ELO Model",   false, false, true ],
];

function CheckIcon({ yes, color }: { yes: boolean; color?: string }) {
  if (!yes) return <Minus size={13} className="text-white/15" strokeWidth={2} />;
  return <Check size={14} strokeWidth={2.5} style={{ color: color ?? "rgba(255,255,255,0.3)" }} />;
}

function UpgradeInner({ highlightTier }: { highlightTier: "fan" | "pro" | null }) {
  const { isPro, isSuperPro, plan } = useSubscription();

  const [loadingTier, setLoadingTier] = useState<"fan" | "pro" | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  async function handleCheckout(tier: "fan" | "pro") {
    setLoadingTier(tier);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Failed to start checkout. Please try again.");
      }
      window.location.href = data.url;
    } catch (err: any) {
      setCheckoutError(err.message ?? "Something went wrong. Please try again.");
      setLoadingTier(null);
    }
  }

  const fanActive = plan === "fan" && !isSuperPro;
  const proActive = isSuperPro;

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#FF7828]/[0.05] blur-[120px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#818cf8]/[0.04] blur-[100px]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12 w-full">
        {/* Back */}
        <Link href="/games" className="inline-flex items-center gap-2 text-sm text-white/35 hover:text-white transition-colors mb-10">
          <ArrowLeft size={14} strokeWidth={2} />
          Back to app
        </Link>

        {/* Checkout error banner */}
        {checkoutError && (
          <div className="mb-6 rounded-2xl border border-[#EB505A]/30 bg-[#EB505A]/[0.06] px-5 py-4 flex items-start gap-3">
            <span className="text-[#EB505A] text-lg leading-none mt-0.5">⚠</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#EB505A] mb-0.5">Checkout failed</p>
              <p className="text-xs text-white/50">{checkoutError}</p>
            </div>
            <button onClick={() => setCheckoutError(null)} className="text-white/25 hover:text-white/50 shrink-0">✕</button>
          </div>
        )}

        {/* World Cup urgency banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 rounded-2xl border border-[#FBBF24]/30 bg-gradient-to-r from-[#FBBF24]/[0.10] to-[#f59e0b]/[0.06] px-5 py-4 flex items-center gap-4 relative overflow-hidden"
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[#FBBF24]/[0.08] blur-3xl pointer-events-none" />
          <div className="text-3xl shrink-0">⚽</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-[#FBBF24] mb-0.5">FIFA World Cup 2026 is LIVE — Limited Time Access</p>
            <p className="text-xs text-white/50">Pro members get full group stage tracking, bracket predictions, team deep dives & ELO win probability for every match. Only available while the tournament runs.</p>
          </div>
          <div className="shrink-0 hidden sm:flex items-center gap-1.5 rounded-full border border-[#FBBF24]/40 bg-[#FBBF24]/15 px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FBBF24] animate-pulse" />
            <span className="text-[10px] font-black text-[#FBBF24] tracking-widest uppercase">Live Now</span>
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF7828]/25 bg-[#FF7828]/[0.08] px-4 py-1.5 mb-5">
            <Zap size={11} className="text-[#FF7828]" strokeWidth={2.5} />
            <span className="text-xs font-bold text-[#FF7828] tracking-wider uppercase">MLB Edge Pro</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Unlock every edge
          </h1>
          <p className="text-white/45 text-base max-w-md mx-auto leading-relaxed">
            Every prop. Every edge. Every advantage — plus World Cup 2026 analysis while it&apos;s live.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="rounded-2xl border border-white/[0.08] bg-[#111622] p-7"
          >
            <p className="text-xs font-bold text-white/30 tracking-widest uppercase mb-5">Free</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-black text-white">$0</span>
              <span className="text-white/30 text-base">/month</span>
            </div>
            <p className="text-sm text-white/30 mb-5">Always free. No card required.</p>
            <div className="py-3 px-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-sm text-white/35 text-center font-medium mb-5">
              {plan === "free" ? "Current Plan" : "Get Started Free"}
            </div>
            <ul className="space-y-2.5">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                    <Check size={9} className="text-white/30" strokeWidth={3} />
                  </div>
                  <span className="text-sm text-white/45">{f}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Fan */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className={`relative rounded-2xl border p-7 overflow-hidden ${
              highlightTier === "fan" || (!highlightTier && !isSuperPro && isPro)
                ? "border-[#FF7828]/40 bg-[#FF7828]/[0.06]"
                : "border-[#FF7828]/25 bg-[#FF7828]/[0.04]"
            }`}
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#FF7828]/8 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-[#FF7828] tracking-widest uppercase">Fan</p>
              <div className="flex items-center gap-1.5 rounded-full border border-[#FF7828]/30 bg-[#FF7828]/10 px-2.5 py-1">
                <Zap size={9} className="text-[#FF7828]" strokeWidth={2.5} />
                <span className="text-[9px] font-black text-[#FF7828] tracking-widest uppercase">Most Popular</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#FF7828]/30 bg-[#FF7828]/10 px-3 py-1 mb-4">
              <span className="text-[10px] font-black text-[#FF7828] tracking-wide uppercase">14-Day Free Trial</span>
            </div>

            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-black text-white">$4.99</span>
              <span className="text-white/40 text-base">/mo after trial</span>
            </div>
            <p className="text-sm text-white/35 mb-5">Cancel anytime. No contracts.</p>

            {fanActive ? (
              <div className="py-3 px-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] text-sm text-emerald-400 text-center font-bold mb-5 flex items-center justify-center gap-2">
                <Check size={14} strokeWidth={2.5} />
                Active Plan
              </div>
            ) : isSuperPro ? (
              <div className="py-3 px-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-sm text-white/25 text-center font-medium mb-5">
                Included in Pro
              </div>
            ) : (
              <Button
                onClick={() => handleCheckout("fan")}
                disabled={loadingTier !== null}
                className="w-full rounded-full h-11 bg-[#FF7828] hover:bg-[#FFA550] text-white font-bold gap-2 shadow-[0_6px_24px_rgba(255,120,40,0.30)] mb-5"
              >
                {loadingTier === "fan" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <Zap size={14} strokeWidth={2.5} />
                    Try Fan Free → 14 Days
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </>
                )}
              </Button>
            )}

            <ul className="space-y-2.5">
              {FAN_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#FF7828]/15 flex items-center justify-center shrink-0">
                    <Check size={9} className="text-[#FF7828]" strokeWidth={3} />
                  </div>
                  <span className="text-sm text-white/65">{f}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className={`relative rounded-2xl border p-7 overflow-hidden ${
              highlightTier === "pro" || (!highlightTier && !isSuperPro && !isPro)
                ? "border-[#818cf8]/40 bg-[#818cf8]/[0.07]"
                : "border-[#818cf8]/25 bg-[#818cf8]/[0.04]"
            }`}
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#818cf8]/8 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-[#818cf8] tracking-widest uppercase">Pro</p>
              <div className="flex items-center gap-1.5 rounded-full border border-[#818cf8]/30 bg-[#818cf8]/10 px-2.5 py-1">
                <Star size={9} className="text-[#818cf8]" strokeWidth={2.5} />
                <span className="text-[9px] font-black text-[#818cf8] tracking-widest uppercase">Best Value</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#818cf8]/30 bg-[#818cf8]/10 px-3 py-1 mb-3">
              <span className="text-[10px] font-black text-[#818cf8] tracking-wide uppercase">3-Day Free Trial</span>
            </div>

            <div className="flex items-center gap-2 mb-4 rounded-xl border border-[#FBBF24]/30 bg-[#FBBF24]/[0.08] px-3 py-2">
              <span className="text-base">⚽</span>
              <div>
                <p className="text-[10px] font-black text-[#FBBF24] tracking-wide uppercase leading-none mb-0.5">Limited Time — World Cup 2026 Live</p>
                <p className="text-[10px] text-white/40">Full tournament access while it runs. Grab it now.</p>
              </div>
              <span className="ml-auto w-2 h-2 rounded-full bg-[#FBBF24] animate-pulse shrink-0" />
            </div>

            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-black text-white">$14.99</span>
              <span className="text-white/40 text-base">/mo after trial</span>
            </div>
            <p className="text-sm text-white/35 mb-5">Cancel anytime. No contracts.</p>

            {proActive ? (
              <div className="py-3 px-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] text-sm text-emerald-400 text-center font-bold mb-5 flex items-center justify-center gap-2">
                <Check size={14} strokeWidth={2.5} />
                Active Plan
              </div>
            ) : (
              <Button
                onClick={() => handleCheckout("pro")}
                disabled={loadingTier !== null}
                className="w-full rounded-full h-11 font-bold gap-2 mb-5 text-white"
                style={{
                  background: "linear-gradient(135deg, #818cf8ee, #818cf8bb)",
                  boxShadow: "0 6px 24px rgba(129,140,248,0.30)",
                }}
              >
                {loadingTier === "pro" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <Star size={14} strokeWidth={2.5} />
                    {fanActive ? "Upgrade to Pro → 3 Days Free" : "Try Pro Free → 3 Days"}
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </>
                )}
              </Button>
            )}

            <ul className="space-y-2.5">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#818cf8]/15 flex items-center justify-center shrink-0">
                    <Check size={9} className="text-[#818cf8]" strokeWidth={3} />
                  </div>
                  <span className="text-sm text-white/65">{f}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl border border-white/[0.07] overflow-hidden"
        >
          <div className="grid grid-cols-[1fr_48px_48px_48px] sm:grid-cols-[1fr_72px_72px_72px] border-b border-white/[0.07] bg-white/[0.02] px-4 sm:px-6 py-3">
            <span className="text-xs font-bold text-white/30 uppercase tracking-wider">Feature</span>
            <span className="text-xs font-bold text-white/30 uppercase tracking-wider text-center">Free</span>
            <span className="text-xs font-bold text-[#FF7828] uppercase tracking-wider text-center">Fan</span>
            <span className="text-xs font-bold text-[#818cf8] uppercase tracking-wider text-center">Pro</span>
          </div>
          {COMPARISON.map(([label, free, fan, pro]) => (
            <div key={label} className="grid grid-cols-[1fr_48px_48px_48px] sm:grid-cols-[1fr_72px_72px_72px] border-b border-white/[0.04] last:border-0 px-4 sm:px-6 py-3 sm:py-3.5">
              <span className="text-sm text-white/55">{label}</span>
              <div className="flex justify-center"><CheckIcon yes={free} /></div>
              <div className="flex justify-center"><CheckIcon yes={fan} color="#FF7828" /></div>
              <div className="flex justify-center"><CheckIcon yes={pro} color="#818cf8" /></div>
            </div>
          ))}
        </motion.div>

        <p className="mt-8 text-xs text-white/18 text-center">
          Subscription auto-renews monthly until cancelled. For educational &amp; entertainment purposes only.
        </p>
      </div>
    </div>
  );
}

// Thin wrapper that reads searchParams — must be the only thing in Suspense
function SearchParamsReader() {
  const searchParams = useSearchParams();
  const highlightTier = searchParams.get("tier") as "fan" | "pro" | null;
  return <UpgradeInner highlightTier={highlightTier} />;
}

export function UpgradeContent() {
  return <SearchParamsReader />;
}
