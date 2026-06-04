"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Check, TrendingUp, BarChart3, Target, Cloud, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "./container";
import { AnimatedBackground } from "./animated-background";

const FREE_BULLETS = [
  { icon: Check, text: "Full game schedule — free forever" },
  { icon: Check, text: "Live scores & win predictions" },
  { icon: Check, text: "Stadium weather conditions" },
];

const easing = [0.22, 1, 0.36, 1] as const;

function StatPill({ icon: Icon, label, value, color = "#FF7828" }: {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-[#0D1117]/80 backdrop-blur-sm px-4 py-2.5">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
        <Icon size={13} style={{ color }} strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-[10px] text-white/30 font-bold tracking-wider uppercase">{label}</p>
        <p className="text-sm font-bold text-white leading-tight">{value}</p>
      </div>
    </div>
  );
}

// The hero screenshot stack — three phones at different angles
function PhoneStack() {
  return (
    <div className="relative h-[540px] sm:h-[600px] flex items-center justify-center">
      {/* Back phone — Scores tab */}
      <motion.div
        initial={{ opacity: 0, x: 60, rotate: 8, scale: 0.9 }}
        animate={{ opacity: 0.55, x: 80, rotate: 8, scale: 0.88 }}
        transition={{ duration: 0.9, delay: 0.5, ease: easing }}
        className="absolute"
        style={{ zIndex: 1 }}
      >
        <div className="w-[200px] rounded-[2.4rem] overflow-hidden border-2 border-white/10 shadow-2xl">
          <Image
            src="/screenshots/02-scores-tab.png"
            alt="Scores tab"
            width={200}
            height={433}
            className="w-full"
            priority
          />
        </div>
      </motion.div>

      {/* Far back — Edge Report */}
      <motion.div
        initial={{ opacity: 0, x: -60, rotate: -8, scale: 0.85 }}
        animate={{ opacity: 0.40, x: -85, rotate: -9, scale: 0.83 }}
        transition={{ duration: 0.9, delay: 0.7, ease: easing }}
        className="absolute"
        style={{ zIndex: 1 }}
      >
        <div className="w-[190px] rounded-[2.4rem] overflow-hidden border-2 border-white/8 shadow-2xl">
          <Image
            src="/screenshots/07-analysis-edge-report.png"
            alt="Edge Report"
            width={190}
            height={411}
            className="w-full"
            priority
          />
        </div>
      </motion.div>

      {/* Front phone — Today dashboard (hero) */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.3, ease: easing }}
        className="relative z-10"
      >
        {/* Phone glow */}
        <div
          className="absolute -inset-6 rounded-full blur-2xl opacity-40 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,120,40,0.35) 0%, transparent 70%)" }}
        />
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-[230px] rounded-[2.6rem] overflow-hidden border-2 border-white/15 shadow-[0_32px_80px_rgba(0,0,0,0.8)]">
            <Image
              src="/screenshots/01-today-dashboard.png"
              alt="Today dashboard"
              width={230}
              height={498}
              className="w-full"
              priority
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Floating stat labels */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 1.1 }}
        className="absolute right-0 top-16 z-20"
      >
        <div className="rounded-xl border border-[#50C882]/25 bg-[#0D1117]/90 backdrop-blur-sm px-3 py-2 shadow-lg">
          <p className="text-[9px] text-white/30 font-bold tracking-widest uppercase mb-0.5">Win Prob</p>
          <p className="text-lg font-black text-[#50C882]">67%</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 1.3 }}
        className="absolute left-0 bottom-28 z-20"
      >
        <div className="rounded-xl border border-[#FF7828]/25 bg-[#0D1117]/90 backdrop-blur-sm px-3 py-2 shadow-lg">
          <p className="text-[9px] text-white/30 font-bold tracking-widest uppercase mb-0.5">Edge Score</p>
          <p className="text-lg font-black text-[#FF7828]">91 / 100</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.5 }}
        className="absolute right-2 bottom-20 z-20"
      >
        <div className="rounded-xl border border-[#818cf8]/25 bg-[#0D1117]/90 backdrop-blur-sm px-3 py-2 shadow-lg">
          <p className="text-[9px] text-white/30 font-bold tracking-widest uppercase mb-0.5">HR Prop</p>
          <p className="text-lg font-black text-[#818cf8]">42%</p>
        </div>
      </motion.div>
    </div>
  );
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-24 lg:py-28 min-h-[90vh] flex items-center">
      {/* Fluid animated background */}
      <AnimatedBackground />

      <Container className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-12 items-center">
        {/* Left — copy */}
        <div className="flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easing }}
            className="mb-5 w-fit"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#FF7828]/30 bg-[#FF7828]/10 px-3.5 py-1.5 text-xs font-bold text-[#FF7828] tracking-widest uppercase">
              <Zap size={11} strokeWidth={2.5} />
              AI-Powered MLB Analysis
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: easing }}
            className="text-5xl sm:text-6xl lg:text-[3.8rem] font-black tracking-tight leading-[1.04] text-white"
          >
            Your MLB{" "}
            <br />
            betting edge.
            <br />
            <span className="gradient-orange-text">Every day.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: easing }}
            className="mt-6 text-base sm:text-lg text-white/50 leading-relaxed max-w-md"
          >
            Data-driven game predictions, prop analysis, and edge reports — built for serious MLB bettors who want every advantage.
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
                <span className="text-sm text-white/60">{text}</span>
              </li>
            ))}
          </motion.ul>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: easing }}
            className="mt-9 flex flex-col sm:flex-row items-start gap-3"
          >
            <Link href="/trial?tier=fan">
              <Button
                size="lg"
                className="h-13 px-7 rounded-full bg-[#FF7828] hover:bg-[#FFA550] text-white font-bold text-base gap-2 group shadow-[0_8px_32px_rgba(255,120,40,0.40)]"
              >
                Try Fan Free — 14 Days
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
              </Button>
            </Link>
            <Link href="/trial?tier=pro">
              <Button
                variant="ghost"
                size="lg"
                className="h-13 px-5 rounded-full text-white/45 hover:text-white hover:bg-white/5 font-medium text-sm gap-2"
              >
                Try Pro Free — 3 Days
                <ArrowRight size={13} strokeWidth={2} />
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="mt-4 text-xs text-white/20"
          >
            No charge until trial ends · Card required · Cancel anytime
          </motion.p>

          {/* Stat pills */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="mt-10 grid grid-cols-2 gap-2 max-w-sm"
          >
            <StatPill icon={BarChart3}  label="Games analyzed"  value="15 / day"    color="#FF7828" />
            <StatPill icon={Target}     label="Avg edge score"  value="+8.4%"       color="#818cf8" />
            <StatPill icon={TrendingUp} label="Model win rate"  value="67.3%"       color="#50C882" />
            <StatPill icon={Cloud}      label="Weather tracked" value="All parks"   color="#2dd4bf" />
          </motion.div>
        </div>

        {/* Right — phone stack */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-center"
        >
          <PhoneStack />
        </motion.div>
      </Container>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
