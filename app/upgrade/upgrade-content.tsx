"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Minus, Zap, Star, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/lib/subscription";

const FREE_FEATURES = [
  "Every NBA, NFL & soccer schedule and live score",
  "Live game trackers — drive tracker, shot chart, match timeline",
  "Standings, power rankings & the Emirates NBA Cup",
  "Model win probability on every game",
  "Soccer match centre — lineups, momentum, xG & match insights",
];

const FAN_FEATURES = [
  "Everything in Free",
  "Real DraftKings player-prop lines — NBA, NFL & soccer",
  "Model projection vs the book on every prop",
  "Line movement since open",
  "Betting lines vs model spread & total",
  "Game props with the reasoning behind each lean",
  "Priority data refresh",
];

const PRO_FEATURES = [
  "Everything in Fan",
  "WNBA Player Impact Deep Dive (in season)",
  "MLB HR Deep Dive — spray charts & grade (in season)",
  "Early access to new leagues & markets",
];

const COMPARISON: [string, boolean, boolean, boolean][] = [
  ["Schedules & live scores",          true,  true,  true ],
  ["Live game trackers",               true,  true,  true ],
  ["Standings & power rankings",       true,  true,  true ],
  ["Emirates NBA Cup tracker",         true,  true,  true ],
  ["Model win probability",            true,  true,  true ],
  ["DraftKings game lines vs model",   false, true,  true ],
  ["Real DraftKings player props",     false, true,  true ],
  ["Prop line movement",               false, true,  true ],
  ["Game props & reasoning",           false, true,  true ],
  ["Soccer match centre & insights",    true,  true,  true ],
  ["WNBA Player Impact Deep Dive",     false, false, true ],
  ["MLB HR Deep Dive",                 false, false, true ],
];

function CheckIcon({ yes, color }: { yes: boolean; color?: string }) {
  if (!yes) return <Minus size={13} className="text-[#14161b]/38" strokeWidth={2} />;
  return <Check size={14} strokeWidth={2.5} style={{ color: color ?? "rgba(20,22,27,.38)" }} />;
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
      <div className="pointer-events-none fixed top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#1a73ff]/[0.05] blur-[120px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#6d4fe0]/[0.04] blur-[100px]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12 w-full">
        {/* Back */}
        <Link href="/games" className="inline-flex items-center gap-2 text-sm text-[#14161b]/56 hover:text-[#14161b] transition-colors mb-10">
          <ArrowLeft size={14} strokeWidth={2} />
          Back to app
        </Link>

        {/* Checkout error banner */}
        {checkoutError && (
          <div className="mb-6 rounded-2xl border border-[#ef3b4a]/30 bg-[#ef3b4a]/[0.06] px-5 py-4 flex items-start gap-3">
            <span className="text-[#ef3b4a] text-lg leading-none mt-0.5">⚠</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#ef3b4a] mb-0.5">Checkout failed</p>
              <p className="text-xs text-[#14161b]/64">{checkoutError}</p>
            </div>
            <button onClick={() => setCheckoutError(null)} className="text-[#14161b]/46 hover:text-[#14161b]/64 shrink-0">✕</button>
          </div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1a73ff]/25 bg-[#1a73ff]/[0.08] px-4 py-1.5 mb-5">
            <Zap size={11} className="text-[#1a73ff]" strokeWidth={2.5} />
            <span className="text-xs font-bold text-[#1a73ff] tracking-wider uppercase">Edge Pro</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-[#14161b] tracking-tight mb-4">
            Unlock every edge
          </h1>
          <p className="text-[#14161b]/56 text-base max-w-md mx-auto leading-relaxed">
            Every prop. Every edge. Every advantage.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="rounded-2xl border border-[#14161b]/[.09] bg-[#ffffff] p-7"
          >
            <p className="text-xs font-bold text-[#14161b]/46 tracking-widest uppercase mb-5">Free</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-black text-[#14161b]">$0</span>
              <span className="text-[#14161b]/46 text-base">/month</span>
            </div>
            <p className="text-sm text-[#14161b]/46 mb-5">Always free. No card required.</p>
            <div className="py-3 px-4 rounded-xl border border-[#14161b]/[.09] bg-[#14161b]/[0.02] text-sm text-[#14161b]/56 text-center font-medium mb-5">
              {plan === "free" ? "Current Plan" : "Get Started Free"}
            </div>
            <ul className="space-y-2.5">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#14161b]/[0.06] flex items-center justify-center shrink-0">
                    <Check size={9} className="text-[#14161b]/46" strokeWidth={3} />
                  </div>
                  <span className="text-sm text-[#14161b]/56">{f}</span>
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
                ? "border-[#1a73ff]/40 bg-[#1a73ff]/[0.06]"
                : "border-[#1a73ff]/25 bg-[#1a73ff]/[0.04]"
            }`}
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#1a73ff]/8 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-[#1a73ff] tracking-widest uppercase">Fan</p>
              <div className="flex items-center gap-1.5 rounded-full border border-[#1a73ff]/30 bg-[#1a73ff]/10 px-2.5 py-1">
                <Zap size={9} className="text-[#1a73ff]" strokeWidth={2.5} />
                <span className="text-[9px] font-black text-[#1a73ff] tracking-widest uppercase">Most Popular</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#1a73ff]/30 bg-[#1a73ff]/10 px-3 py-1 mb-4">
              <span className="text-[10px] font-black text-[#1a73ff] tracking-wide uppercase">14-Day Free Trial</span>
            </div>

            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-black text-[#14161b]">$4.99</span>
              <span className="text-[#14161b]/56 text-base">/mo after trial</span>
            </div>
            <p className="text-sm text-[#14161b]/56 mb-5">Cancel anytime. No contracts.</p>

            {fanActive ? (
              <div className="py-3 px-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] text-sm text-emerald-400 text-center font-bold mb-5 flex items-center justify-center gap-2">
                <Check size={14} strokeWidth={2.5} />
                Active Plan
              </div>
            ) : isSuperPro ? (
              <div className="py-3 px-4 rounded-xl border border-[#14161b]/[.09] bg-[#14161b]/[0.02] text-sm text-[#14161b]/46 text-center font-medium mb-5">
                Included in Pro
              </div>
            ) : (
              <Button
                onClick={() => handleCheckout("fan")}
                disabled={loadingTier !== null}
                className="w-full rounded-full h-11 bg-[#1a73ff] hover:bg-[#5a9bff] text-white font-bold gap-2 shadow-[0_6px_24px_rgba(26,115,255,0.30)] mb-5"
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
                  <div className="w-4 h-4 rounded-full bg-[#1a73ff]/15 flex items-center justify-center shrink-0">
                    <Check size={9} className="text-[#1a73ff]" strokeWidth={3} />
                  </div>
                  <span className="text-sm text-[#14161b]/74">{f}</span>
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
                ? "border-[#6d4fe0]/40 bg-[#6d4fe0]/[0.07]"
                : "border-[#6d4fe0]/25 bg-[#6d4fe0]/[0.04]"
            }`}
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#6d4fe0]/8 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-[#6d4fe0] tracking-widest uppercase">Pro</p>
              <div className="flex items-center gap-1.5 rounded-full border border-[#6d4fe0]/30 bg-[#6d4fe0]/10 px-2.5 py-1">
                <Star size={9} className="text-[#6d4fe0]" strokeWidth={2.5} />
                <span className="text-[9px] font-black text-[#6d4fe0] tracking-widest uppercase">Best Value</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#6d4fe0]/30 bg-[#6d4fe0]/10 px-3 py-1 mb-3">
              <span className="text-[10px] font-black text-[#6d4fe0] tracking-wide uppercase">3-Day Free Trial</span>
            </div>

            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-black text-[#14161b]">$14.99</span>
              <span className="text-[#14161b]/56 text-base">/mo after trial</span>
            </div>
            <p className="text-sm text-[#14161b]/56 mb-5">Cancel anytime. No contracts.</p>

            {proActive ? (
              <div className="py-3 px-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] text-sm text-emerald-400 text-center font-bold mb-5 flex items-center justify-center gap-2">
                <Check size={14} strokeWidth={2.5} />
                Active Plan
              </div>
            ) : (
              <Button
                onClick={() => handleCheckout("pro")}
                disabled={loadingTier !== null}
                className="w-full rounded-full h-11 font-bold gap-2 mb-5 text-[#14161b]"
                style={{
                  background: "linear-gradient(135deg, #6d4fe0ee, #6d4fe0bb)",
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
                  <div className="w-4 h-4 rounded-full bg-[#6d4fe0]/15 flex items-center justify-center shrink-0">
                    <Check size={9} className="text-[#6d4fe0]" strokeWidth={3} />
                  </div>
                  <span className="text-sm text-[#14161b]/74">{f}</span>
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
          className="rounded-2xl border border-[#14161b]/[.09] overflow-hidden"
        >
          <div className="grid grid-cols-[1fr_48px_48px_48px] sm:grid-cols-[1fr_72px_72px_72px] border-b border-[#14161b]/[.09] bg-[#14161b]/[0.02] px-4 sm:px-6 py-3">
            <span className="text-xs font-bold text-[#14161b]/46 uppercase tracking-wider">Feature</span>
            <span className="text-xs font-bold text-[#14161b]/46 uppercase tracking-wider text-center">Free</span>
            <span className="text-xs font-bold text-[#1a73ff] uppercase tracking-wider text-center">Fan</span>
            <span className="text-xs font-bold text-[#6d4fe0] uppercase tracking-wider text-center">Pro</span>
          </div>
          {COMPARISON.map(([label, free, fan, pro]) => (
            <div key={label} className="grid grid-cols-[1fr_48px_48px_48px] sm:grid-cols-[1fr_72px_72px_72px] border-b border-[#14161b]/[.09] last:border-0 px-4 sm:px-6 py-3 sm:py-3.5">
              <span className="text-sm text-[#14161b]/64">{label}</span>
              <div className="flex justify-center"><CheckIcon yes={free} /></div>
              <div className="flex justify-center"><CheckIcon yes={fan} color="#1a73ff" /></div>
              <div className="flex justify-center"><CheckIcon yes={pro} color="#6d4fe0" /></div>
            </div>
          ))}
        </motion.div>

        <p className="mt-8 text-xs text-[#14161b]/38 text-center">
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
