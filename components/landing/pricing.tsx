"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Minus, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "./container";

const FREE_FEATURES = [
  "Today's full game schedule",
  "Live scores & game status",
  "Win predictions (home/away)",
  "Upcoming matchup overview",
  "Stadium weather conditions",
];

const PRO_FEATURES = [
  "Everything in Free",
  "HR, Hit & multi-hit props",
  "Pitcher strikeout projections",
  "Edge Report — ranked value bets",
  "Full batter vs pitcher analysis",
  "Prop Builder & slip tracking",
  "Save & track your bet slips",
  "Priority data refresh",
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export function LandingPricing() {
  return (
    <section id="pricing" className="py-20 sm:py-28">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/50 tracking-wider uppercase">
            Pricing
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-center text-white"
        >
          Simple pricing. No surprises.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mt-4 text-center text-white/45 max-w-md mx-auto"
        >
          Start free with no card required. Upgrade for the full edge anytime.
        </motion.p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {/* Free plan */}
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="flex flex-col rounded-2xl border border-white/[0.08] bg-[#111622] p-7"
          >
            <p className="text-xs font-bold text-white/35 tracking-widest uppercase mb-5">Free Plan</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-black text-white">$0</span>
              <span className="text-white/35 text-base">/month</span>
            </div>
            <p className="text-sm text-white/35 mb-7">Always free. No card required.</p>

            <Link href="/sign-up">
              <Button variant="outline" className="w-full rounded-full h-11 font-bold border-white/10 hover:border-white/20">
                Get Started Free
              </Button>
            </Link>

            <ul className="mt-7 space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <Check size={15} className="text-white/35 shrink-0" strokeWidth={2.5} />
                  <span className="text-sm text-white/50">{f}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Pro plan */}
          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="relative flex flex-col rounded-2xl border border-[#FF7828]/30 bg-[#FF7828]/[0.05] p-7 overflow-hidden"
          >
            {/* Glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#FF7828]/10 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-bold text-[#FF7828] tracking-widest uppercase">Edge Pro</p>
              <div className="flex items-center gap-1.5 rounded-full border border-[#FF7828]/30 bg-[#FF7828]/10 px-2.5 py-1">
                <Zap size={9} className="text-[#FF7828]" strokeWidth={2.5} />
                <span className="text-[9px] font-black text-[#FF7828] tracking-widest uppercase">Most Popular</span>
              </div>
            </div>

            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-black text-white">$4.99</span>
              <span className="text-white/45 text-base">/month</span>
            </div>
            <p className="text-sm text-white/35 mb-7">Cancel anytime. No contracts.</p>

            <Link href="/sign-up">
              <Button className="w-full rounded-full h-11 font-bold bg-[#FF7828] hover:bg-[#FFA550] text-white gap-2 shadow-[0_6px_24px_rgba(255,120,40,0.35)]">
                <Zap size={14} strokeWidth={2.5} />
                Start Edge Pro
                <ArrowRight size={14} strokeWidth={2.5} />
              </Button>
            </Link>

            <ul className="mt-7 space-y-3">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#FF7828]/15 flex items-center justify-center shrink-0">
                    <Check size={10} className="text-[#FF7828]" strokeWidth={3} />
                  </div>
                  <span className="text-sm text-white/70">{f}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Full comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-14 max-w-3xl mx-auto"
        >
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_80px_80px] border-b border-white/[0.07] bg-white/[0.02] px-6 py-3">
              <span className="text-xs font-bold text-white/30 uppercase tracking-wider">Feature</span>
              <span className="text-xs font-bold text-white/30 uppercase tracking-wider text-center">Free</span>
              <span className="text-xs font-bold text-[#FF7828] uppercase tracking-wider text-center">Pro</span>
            </div>
            {[
              ["Game schedule", true, true],
              ["Live scores", true, true],
              ["Win predictions", true, true],
              ["Weather conditions", true, true],
              ["Home Run props", false, true],
              ["Hit & 2+ Hit props", false, true],
              ["Pitcher K projections", false, true],
              ["Edge Report", false, true],
              ["Matchup analysis", false, true],
              ["Prop Builder & slips", false, true],
            ].map(([label, free, pro]) => (
              <div key={String(label)} className="grid grid-cols-[1fr_80px_80px] border-b border-white/[0.04] last:border-0 px-6 py-3.5">
                <span className="text-sm text-white/55">{String(label)}</span>
                <div className="flex justify-center">
                  {free ? <Check size={15} className="text-white/30" strokeWidth={2.5} /> : <Minus size={14} className="text-white/15" strokeWidth={2} />}
                </div>
                <div className="flex justify-center">
                  {pro ? <Check size={15} className="text-[#FF7828]" strokeWidth={2.5} /> : <Minus size={14} className="text-white/15" strokeWidth={2} />}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
