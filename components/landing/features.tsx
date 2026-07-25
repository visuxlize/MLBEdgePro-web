"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CircleDot, Flame, Zap, TrendingUp, Cloud, BarChart3, Lock, Target, Activity, Radio, ClipboardList, Sparkles, ArrowRight } from "lucide-react";
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
    description: "HR, 1+ Hit, 2+ Hits, and K props for every confirmed starter matchup. Build multi-leg slips, set wager amounts, and track results.",
    tier: "fan",
    size: "lg",
  },
  {
    icon: Zap,
    title: "Edge Report",
    description: "AI-ranked value bets across the full slate. Identifies line discrepancies and pitcher-batter edges — updated as lineups confirm.",
    tier: "fan",
    size: "lg",
  },
  {
    icon: BarChart3,
    title: "Full Matchup Analysis",
    description: "Pitcher ERA, WHIP, K/9 vs opposing lineup OPS and hot/cold streaks. Every edge surfaced.",
    tier: "fan",
    size: "sm",
  },
  {
    icon: Target,
    title: "HR Deep Dive",
    description: "Spray charts, wall clearance, barrel rate, and exit velocity — know why a ball leaves the park, not just if it might.",
    tier: "superPro",
    size: "lg",
  },
  {
    icon: Activity,
    title: "Daily Picks",
    description: "Confident model picks with edge scores and reasoning. The plays our model grades highest each day.",
    tier: "superPro",
    size: "lg",
  },
];

const nflFeatures = [
  {
    icon: CircleDot,
    title: "This Week Dashboard",
    description: "Every HOF, preseason, and Week 1 matchup graded — week pills, stat strip, and an editorial top-edge hero, refreshed automatically.",
  },
  {
    icon: Radio,
    title: "Live Drive Tracker",
    description: "Possession, down & distance, and win probability that moves with the ball — not just a score, the whole drive.",
  },
  {
    icon: ClipboardList,
    title: "Prop Builder & Parlay Slip",
    description: "QB, RB, WR, and TE projections vs. the book's line, with one tap to build a slip and see live edge & payout.",
  },
  {
    icon: Sparkles,
    title: "Edge AI Breakdowns",
    description: "Ask the model why it likes a side. Full game narratives, head-to-head splits, and the factors driving every grade.",
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
  const isFan = feature.tier === "fan";
  const isSuperPro = feature.tier === "superPro";

  const borderCls = isSuperPro
    ? "border-[#818cf8]/20 bg-[#818cf8]/[0.04]"
    : isFan
    ? "border-[#FF7828]/20 bg-[#FF7828]/[0.04]"
    : "border-white/[0.07] bg-[#111622]";

  const iconBgCls = isSuperPro
    ? "bg-[#818cf8]/15"
    : isFan
    ? "bg-[#FF7828]/15"
    : "bg-white/[0.06]";

  const iconColor = isSuperPro ? "#818cf8" : isFan ? "#FF7828" : undefined;

  return (
    <motion.div
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={fadeUp}
      className={`relative flex flex-col rounded-2xl border p-6 overflow-hidden ${borderCls} ${
        feature.size === "lg" ? "min-h-[220px]" : "min-h-[180px]"
      }`}
    >
      {/* Tier badge */}
      {isFan && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full border border-[#FF7828]/30 bg-[#FF7828]/10 px-2.5 py-1">
          <Zap size={9} className="text-[#FF7828]" strokeWidth={2.5} />
          <span className="text-[9px] font-black text-[#FF7828] tracking-widest uppercase">Fan</span>
        </div>
      )}
      {isSuperPro && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full border border-[#818cf8]/30 bg-[#818cf8]/10 px-2.5 py-1">
          <span className="text-[9px] font-black text-[#818cf8] tracking-widest uppercase">Pro</span>
        </div>
      )}

      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${iconBgCls}`}>
        <Icon
          size={18}
          strokeWidth={1.7}
          style={iconColor ? { color: iconColor } : undefined}
          className={!iconColor ? "text-white/55" : undefined}
        />
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
          Every game, score, and prediction free. Fan unlocks props and edge reports. Pro goes all the way.
        </motion.p>

        {/* Free tier */}
        <div className="mt-12 mb-3 flex items-center gap-3">
          <span className="text-xs font-bold text-white/30 tracking-widest uppercase">Free Plan</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {features.filter((f) => f.tier === "free").map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>

        {/* Fan tier */}
        <div className="mt-6 mb-3 flex items-center gap-3">
          <span className="text-xs font-bold text-[#FF7828] tracking-widest uppercase">Fan — $4.99/mo · 14-Day Free Trial</span>
          <div className="flex-1 h-px bg-[#FF7828]/15" />
          <Lock size={11} className="text-[#FF7828]/50" strokeWidth={2} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.filter((f) => f.tier === "fan").map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i + 3} />
          ))}
        </div>

        {/* Pro tier */}
        <div className="mt-6 mb-3 flex items-center gap-3">
          <span className="text-xs font-bold text-[#818cf8] tracking-widest uppercase">Pro — $14.99/mo · 3-Day Free Trial</span>
          <div className="flex-1 h-px bg-[#818cf8]/15" />
          <Lock size={11} className="text-[#818cf8]/50" strokeWidth={2} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.filter((f) => f.tier === "superPro").map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i + 6} />
          ))}
        </div>

        {/* NFL Edge Pro — new sport, early access */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-16 rounded-3xl border border-[#818cf8]/25 overflow-hidden p-7 sm:p-10"
          style={{ background: "linear-gradient(135deg, rgba(255,120,40,0.08), rgba(129,140,248,0.08))" }}
        >
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#818cf8]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#FF7828]/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-9">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#818cf8]/30 bg-[#818cf8]/10 px-3.5 py-1.5 text-xs font-black text-[#818cf8] tracking-widest uppercase">
                <Zap size={11} strokeWidth={2.5} />
                New Sport &middot; Pro Early Access
              </span>
              <h3 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight text-white">
                Now expanding: <span className="gradient-orange-text">NFL Edge Pro</span>
              </h3>
              <p className="mt-3 text-sm sm:text-base text-white/50 leading-relaxed max-w-xl">
                After the success of our World Cup analysis this summer, we&rsquo;re taking the same model
                beyond MLB. NFL Edge Pro is live in early access for Pro members now, covering the Hall of
                Fame Game and full preseason ahead of a Week 1 kickoff.
              </p>
            </div>
            <Link href="/trial?tier=pro" className="shrink-0">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#818cf8] hover:bg-[#9CA5FF] transition-colors text-white font-bold text-sm px-5 py-2.5 group">
                Try Pro Free &mdash; 3 Days
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
              </span>
            </Link>
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nflFeatures.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  variants={fadeUp}
                  className="flex flex-col rounded-2xl border border-white/[0.08] bg-[#0D1117]/60 p-5"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 bg-[#818cf8]/15">
                    <Icon size={18} strokeWidth={1.7} style={{ color: "#818cf8" }} />
                  </div>
                  <h4 className="text-base font-bold text-white mb-1.5">{f.title}</h4>
                  <p className="text-sm text-white/45 leading-relaxed">{f.description}</p>
                </motion.div>
              );
            })}
          </div>

          <p className="relative mt-7 text-xs text-white/30 leading-relaxed">
            More sports are joining the model every season &mdash; NFL is first, with the next one already in the works.
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
