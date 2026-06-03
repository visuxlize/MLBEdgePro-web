"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Minus, Zap, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/lib/subscription";

const PRO_FEATURES = [
  "HR, 1+ Hit & 2+ Hit props",
  "Pitcher strikeout projections",
  "Edge Report — AI-ranked value bets",
  "Full batter vs pitcher analysis",
  "Prop Builder & multi-leg slips",
  "Save & track your bet slips",
  "Priority data refresh",
];

const COMPARISON = [
  ["Today's game schedule", true, true],
  ["Live scores", true, true],
  ["Win predictions", true, true],
  ["Weather conditions", true, true],
  ["Home Run props", false, true],
  ["Hit & 2+ Hit props", false, true],
  ["Pitcher K projections", false, true],
  ["Edge Report", false, true],
  ["Matchup analysis", false, true],
  ["Prop Builder & slips", false, true],
];

export default function UpgradePage() {
  const { isPro } = useSubscription();

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#FF7828]/[0.05] blur-[120px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-indigo-500/[0.04] blur-[100px]" />

      <div className="relative max-w-4xl mx-auto px-5 sm:px-8 py-12">
        {/* Back */}
        <Link href="/games" className="inline-flex items-center gap-2 text-sm text-white/35 hover:text-white transition-colors mb-10">
          <ArrowLeft size={14} strokeWidth={2} />
          Back to app
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF7828]/25 bg-[#FF7828]/[0.08] px-4 py-1.5 mb-5">
            <Zap size={11} className="text-[#FF7828]" strokeWidth={2.5} />
            <span className="text-xs font-bold text-[#FF7828] tracking-wider uppercase">Edge Pro</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Unlock every edge
          </h1>
          <p className="text-white/45 text-base max-w-md mx-auto leading-relaxed">
            Every prop. Every edge. Every advantage. For less than a coffee a month.
          </p>
        </motion.div>

        {/* Already Pro */}
        {isPro && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.08] p-5 flex items-center gap-4 mb-8"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <Check size={20} className="text-emerald-400" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-emerald-400 font-bold">You&apos;re on Edge Pro!</p>
              <p className="text-white/40 text-sm mt-0.5">All features are unlocked for your account.</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-white/[0.08] bg-[#111622] p-7"
          >
            <p className="text-xs font-bold text-white/30 tracking-widest uppercase mb-5">Free Plan</p>
            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-4xl font-black text-white">$0</span>
              <span className="text-white/30 text-base">/month</span>
            </div>
            <p className="text-sm text-white/30 mb-5">Always free. No card required.</p>
            <div className="py-3 px-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-sm text-white/35 text-center font-medium">
              Current Plan
            </div>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="relative rounded-2xl border border-[#FF7828]/30 bg-[#FF7828]/[0.05] p-7 overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#FF7828]/10 blur-3xl pointer-events-none" />
            <p className="text-xs font-bold text-[#FF7828] tracking-widest uppercase mb-5">Edge Pro</p>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-black text-white">$4.99</span>
              <span className="text-white/40 text-base">/month</span>
            </div>
            <p className="text-sm text-white/35 mb-5">Cancel anytime.</p>

            {!isPro ? (
              <Button className="w-full rounded-full h-11 bg-[#FF7828] hover:bg-[#FFA550] text-white font-bold gap-2 shadow-[0_6px_24px_rgba(255,120,40,0.30)] mb-5">
                <Zap size={14} strokeWidth={2.5} />
                Start Edge Pro
                <ArrowRight size={14} strokeWidth={2.5} />
              </Button>
            ) : (
              <div className="py-3 px-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] text-sm text-emerald-400 text-center font-bold mb-5 flex items-center justify-center gap-2">
                <Check size={14} strokeWidth={2.5} />
                Active
              </div>
            )}

            <ul className="space-y-2.5">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#FF7828]/15 flex items-center justify-center shrink-0">
                    <Check size={9} className="text-[#FF7828]" strokeWidth={3} />
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
          <div className="grid grid-cols-[1fr_80px_80px] border-b border-white/[0.07] bg-white/[0.02] px-6 py-3">
            <span className="text-xs font-bold text-white/30 uppercase tracking-wider">Feature</span>
            <span className="text-xs font-bold text-white/30 uppercase tracking-wider text-center">Free</span>
            <span className="text-xs font-bold text-[#FF7828] uppercase tracking-wider text-center">Pro</span>
          </div>
          {COMPARISON.map(([label, free, pro]) => (
            <div key={String(label)} className="grid grid-cols-[1fr_80px_80px] border-b border-white/[0.04] last:border-0 px-6 py-3.5">
              <span className="text-sm text-white/55">{String(label)}</span>
              <div className="flex justify-center">
                {free ? <Check size={14} className="text-white/30" strokeWidth={2.5} /> : <Minus size={13} className="text-white/15" strokeWidth={2} />}
              </div>
              <div className="flex justify-center">
                {pro ? <Check size={14} className="text-[#FF7828]" strokeWidth={2.5} /> : <Minus size={13} className="text-white/15" strokeWidth={2} />}
              </div>
            </div>
          ))}
        </motion.div>

        <p className="mt-8 text-xs text-white/18 text-center">
          Subscription auto-renews monthly until cancelled. For educational & entertainment purposes only.
        </p>
      </div>
    </div>
  );
}
