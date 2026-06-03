"use client";

import { motion } from "framer-motion";
import { CircleDot, Flame, Zap, TrendingUp, Cloud, BarChart3, Lock } from "lucide-react";
import { Container } from "./container";

const features = [
  {
    icon: CircleDot,
    title: "Today's Games",
    description: "Full MLB schedule with live scores, game status, starting pitchers, and venue information at a glance.",
    tier: "free",
    size: "sm",
  },
  {
    icon: TrendingUp,
    title: "Win Predictions",
    description: "Machine-learning win probability for every game — home vs away, updated as lineups are confirmed.",
    tier: "free",
    size: "sm",
  },
  {
    icon: Cloud,
    title: "Weather Impact",
    description: "Real-time stadium weather affecting fly balls, pitching, and run totals for every outdoor park.",
    tier: "free",
    size: "sm",
  },
  {
    icon: Flame,
    title: "Prop Builder",
    description: "HR, 1+ Hit, 2+ Hits, and strikeout props for every batter vs confirmed starters. Ranked by probability. Build multi-leg slips and save them to track results.",
    tier: "pro",
    size: "lg",
  },
  {
    icon: Zap,
    title: "Edge Report",
    description: "AI-ranked value bets across the full slate. Identifies line discrepancies, pitcher-batter mismatches, and weather-boosted edges before the books adjust.",
    tier: "pro",
    size: "lg",
  },
  {
    icon: BarChart3,
    title: "Full Matchup Analysis",
    description: "Pitcher ERA, WHIP, K/9 vs opposing lineup OPS and recent form. Every statistical edge visualized.",
    tier: "pro",
    size: "sm",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const Icon = feature.icon;
  const isPro = feature.tier === "pro";

  return (
    <motion.div
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={fadeUp}
      className={`relative flex flex-col rounded-2xl border p-6 overflow-hidden ${
        isPro
          ? "border-[#FF7828]/20 bg-[#FF7828]/[0.04]"
          : "border-white/[0.07] bg-[#111622]"
      } ${feature.size === "lg" ? "min-h-[220px]" : "min-h-[180px]"}`}
    >
      {/* Pro badge */}
      {isPro && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full border border-[#FF7828]/30 bg-[#FF7828]/10 px-2.5 py-1">
          <Zap size={9} className="text-[#FF7828]" strokeWidth={2.5} />
          <span className="text-[9px] font-black text-[#FF7828] tracking-widest uppercase">Pro</span>
        </div>
      )}

      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${
        isPro ? "bg-[#FF7828]/15" : "bg-white/[0.06]"
      }`}>
        <Icon size={18} className={isPro ? "text-[#FF7828]" : "text-white/55"} strokeWidth={1.7} />
      </div>

      <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
      <p className="text-sm text-white/45 leading-relaxed">{feature.description}</p>
    </motion.div>
  );
}

export function LandingFeatures() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/50 tracking-wider uppercase">
            Features
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-center text-white leading-tight"
        >
          Free to start.{" "}
          <span className="gradient-orange-text">Lethal when Pro.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mt-4 text-center text-white/45 max-w-xl mx-auto leading-relaxed"
        >
          Every game, every score, every prediction — free. Unlock props, edges, and full analysis for $4.99/month.
        </motion.p>

        {/* Free tier label */}
        <div className="mt-12 mb-3 flex items-center gap-3">
          <span className="text-xs font-bold text-white/30 tracking-widest uppercase">Free Plan</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {features.filter((f) => f.tier === "free").map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>

        {/* Pro tier label */}
        <div className="mt-6 mb-3 flex items-center gap-3">
          <span className="text-xs font-bold text-[#FF7828] tracking-widest uppercase">Edge Pro — $4.99/mo</span>
          <div className="flex-1 h-px bg-[#FF7828]/15" />
          <Lock size={11} className="text-[#FF7828]/50" strokeWidth={2} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.filter((f) => f.tier === "pro").map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i + 3} />
          ))}
        </div>
      </Container>
    </section>
  );
}
