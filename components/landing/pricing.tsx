"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Minus, Zap, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "./container";

const FREE_FEATURES = [
  "Today's full game schedule",
  "Live scores & game status",
  "Win predictions (home/away)",
  "Upcoming matchup overview",
  "Stadium weather conditions",
];

const FAN_FEATURES = [
  "Everything in Free",
  "Edge Report — ranked value bets",
  "HR, Hit & multi-hit props",
  "Pitcher strikeout projections",
  "Full batter vs pitcher analysis",
  "Prop Builder & slip tracking",
  "Save & track your bet slips",
  "Priority data refresh",
];

const PRO_FEATURES = [
  "Everything in Fan",
  "HR Deep Dive — spray charts",
  "Wall Clearance + Carry Analysis",
  "Pitch → Spray Connection",
  "Barrel Rate & EV Analysis",
  "Confident daily picks",
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const COMPARISON: [string, boolean, boolean, boolean][] = [
  ["Game schedule",            true,  true,  true ],
  ["Live scores",              true,  true,  true ],
  ["Win predictions",          true,  true,  true ],
  ["Weather conditions",       true,  true,  true ],
  ["Home Run props",           false, true,  true ],
  ["Hit & 2+ Hit props",       false, true,  true ],
  ["Pitcher K projections",    false, true,  true ],
  ["Edge Report",              false, true,  true ],
  ["Matchup analysis",         false, true,  true ],
  ["Prop Builder & slips",     false, true,  true ],
  ["HR Deep Dive",             false, false, true ],
  ["Wall Clearance Analysis",  false, false, true ],
  ["Carry Conditions",         false, false, true ],
  ["Pitch → Spray Connection", false, false, true ],
];

function CheckIcon({ yes, color }: { yes: boolean; color?: string }) {
  if (!yes) return <Minus size={13} className="text-white/15" strokeWidth={2} />;
  return <Check size={14} strokeWidth={2.5} style={{ color: color ?? "rgba(255,255,255,0.3)" }} />;
}

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
          Start free, go Fan for the full edge, or go Pro for deep-dive analytics.
        </motion.p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {/* Free */}
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="flex flex-col rounded-2xl border border-white/[0.08] bg-[#111622] p-7"
          >
            <p className="text-xs font-bold text-white/35 tracking-widest uppercase mb-5">Free</p>
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

          {/* Fan */}
          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="relative flex flex-col rounded-2xl border border-[#FF7828]/30 bg-[#FF7828]/[0.05] p-7 overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#FF7828]/10 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-bold text-[#FF7828] tracking-widest uppercase">Fan</p>
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
                Start Fan
                <ArrowRight size={14} strokeWidth={2.5} />
              </Button>
            </Link>

            <ul className="mt-7 space-y-3">
              {FAN_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#FF7828]/15 flex items-center justify-center shrink-0">
                    <Check size={10} className="text-[#FF7828]" strokeWidth={3} />
                  </div>
                  <span className="text-sm text-white/70">{f}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Pro */}
          <motion.div
            custom={2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="relative flex flex-col rounded-2xl border border-[#818cf8]/30 bg-[#818cf8]/[0.05] p-7 overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#818cf8]/10 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-bold text-[#818cf8] tracking-widest uppercase">Pro</p>
              <div className="flex items-center gap-1.5 rounded-full border border-[#818cf8]/30 bg-[#818cf8]/10 px-2.5 py-1">
                <Star size={9} className="text-[#818cf8]" strokeWidth={2.5} />
                <span className="text-[9px] font-black text-[#818cf8] tracking-widest uppercase">Best Value</span>
              </div>
            </div>

            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-black text-white">$14.99</span>
              <span className="text-white/45 text-base">/month</span>
            </div>
            <p className="text-sm text-white/35 mb-7">Cancel anytime. No contracts.</p>

            <Link href="/sign-up">
              <Button
                className="w-full rounded-full h-11 font-bold text-white gap-2"
                style={{
                  background: "linear-gradient(135deg, #818cf8ee, #818cf8bb)",
                  boxShadow: "0 6px 24px rgba(129,140,248,0.35)",
                }}
              >
                <Star size={14} strokeWidth={2.5} />
                Start Pro
                <ArrowRight size={14} strokeWidth={2.5} />
              </Button>
            </Link>

            <ul className="mt-7 space-y-3">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#818cf8]/15 flex items-center justify-center shrink-0">
                    <Check size={10} className="text-[#818cf8]" strokeWidth={3} />
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
          className="mt-14 max-w-5xl mx-auto"
        >
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
            <div className="grid grid-cols-[1fr_72px_72px_72px] border-b border-white/[0.07] bg-white/[0.02] px-6 py-3">
              <span className="text-xs font-bold text-white/30 uppercase tracking-wider">Feature</span>
              <span className="text-xs font-bold text-white/30 uppercase tracking-wider text-center">Free</span>
              <span className="text-xs font-bold text-[#FF7828] uppercase tracking-wider text-center">Fan</span>
              <span className="text-xs font-bold text-[#818cf8] uppercase tracking-wider text-center">Pro</span>
            </div>
            {COMPARISON.map(([label, free, fan, pro]) => (
              <div key={label} className="grid grid-cols-[1fr_72px_72px_72px] border-b border-white/[0.04] last:border-0 px-6 py-3.5">
                <span className="text-sm text-white/55">{label}</span>
                <div className="flex justify-center"><CheckIcon yes={free} /></div>
                <div className="flex justify-center"><CheckIcon yes={fan} color="#FF7828" /></div>
                <div className="flex justify-center"><CheckIcon yes={pro} color="#818cf8" /></div>
              </div>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
