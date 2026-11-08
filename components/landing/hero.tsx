"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Check, TrendingUp, BarChart3, Target, Cloud, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "./container";
import { AnimatedBackground } from "./animated-background";
import { HeroShowcase } from "./demos";

const FREE_BULLETS = [
  { icon: Check, text: "Every NBA, NFL & soccer game — free forever" },
  { icon: Check, text: "Live game trackers & win probability" },
  { icon: Check, text: "Standings, power rankings & the NBA Cup" },
];

const easing = [0.22, 1, 0.36, 1] as const;

function StatPill({ icon: Icon, label, value, color = "#1a73ff" }: {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[#14161b]/[.09] bg-[#ffffff]/80 backdrop-blur-sm px-4 py-2.5">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
        <Icon size={13} style={{ color }} strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-[10px] text-[#14161b]/46 font-bold tracking-wider uppercase">{label}</p>
        <p className="text-sm font-bold text-[#14161b] leading-tight">{value}</p>
      </div>
    </div>
  );
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-24 lg:py-28 min-h-[90vh] flex items-center">
      {/* Fluid animated background */}
      <AnimatedBackground />

      <Container className="relative z-10 grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-12 lg:gap-14 items-center">
        {/* Left — copy */}
        <div className="flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easing }}
            className="mb-5 w-fit"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#1a73ff]/30 bg-[#1a73ff]/10 px-3.5 py-1.5 text-xs font-bold text-[#1a73ff] tracking-widest uppercase">
              <Zap size={11} strokeWidth={2.5} />
              Live NBA · NFL · Soccer
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: easing }}
            className="text-5xl sm:text-6xl lg:text-[3.8rem] font-black tracking-tight leading-[1.04] text-[#14161b]"
          >
            Every live game.
            <br />
            Real prop lines.
            <br />
            <span className="gradient-orange-text">Your edge.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: easing }}
            className="mt-6 text-base sm:text-lg text-[#14161b]/64 leading-relaxed max-w-md"
          >
            Live game trackers, real DraftKings prop lines and model-graded picks for the NBA, NFL and soccer — built for serious bettors who want every advantage.
          </motion.p>

          <motion.ul
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: easing }}
            className="mt-7 space-y-2.5"
          >
            {FREE_BULLETS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Icon size={11} className="text-emerald-400" strokeWidth={3} />
                </div>
                <span className="text-sm text-[#14161b]/74">{text}</span>
              </li>
            ))}
          </motion.ul>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: easing }}
            className="mt-9 flex flex-col sm:flex-row items-start gap-3"
          >
            <Link href="/sign-up">
              <Button
                size="lg"
                className="h-13 px-7 rounded-full bg-[#1a73ff] hover:bg-[#5a9bff] text-white font-bold text-base gap-2 group shadow-[0_8px_32px_rgba(26,115,255,0.40)]"
              >
                Start free — no card
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
              </Button>
            </Link>
            <Link href="#tour">
              <Button
                variant="ghost"
                size="lg"
                className="h-13 px-5 rounded-full text-[#14161b]/56 hover:text-[#14161b] hover:bg-[#14161b]/[0.05] font-medium text-sm gap-2"
              >
                See it in action
                <ArrowRight size={13} strokeWidth={2} />
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="mt-4 text-xs text-[#14161b]/38"
          >
            Free forever plan · Upgrade for real prop lines · Cancel anytime
          </motion.p>

          {/* Stat pills */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="mt-10 grid grid-cols-2 gap-2 max-w-sm"
          >
            <StatPill icon={BarChart3}  label="Sports covered"  value="NBA · NFL · Soccer" color="#1a73ff" />
            <StatPill icon={Target}     label="Prop lines"      value="DraftKings"  color="#6d4fe0" />
            <StatPill icon={TrendingUp} label="Soccer leagues"  value="10 leagues"  color="#12a150" />
            <StatPill icon={Cloud}      label="Live updates"    value="Every 30s"   color="#0f9d8e" />
          </motion.div>
        </div>

        {/* Right — phone stack */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-center"
        >
          <HeroShowcase />
        </motion.div>
      </Container>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
