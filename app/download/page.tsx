"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Bell, Check, Flame, Zap, BarChart3,
  Target, Cloud, Trophy, Smartphone, Star, ChevronRight,
  TrendingUp, Layers, Eye, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/landing/header";
import { LandingFooter } from "@/components/landing/footer";
import { Container } from "@/components/landing/container";
import { AnimatedBackground } from "@/components/landing/animated-background";

const easing = [0.22, 1, 0.36, 1] as const;

// ─── Waitlist form ────────────────────────────────────────────────────────────

function WaitlistForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async () => {
    if (!email.includes("@")) { setErrorMsg("Enter a valid email."); return; }
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setState("success");
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setState("error");
    }
  };

  if (state === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4"
      >
        <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
          <Check size={18} className="text-emerald-400" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-sm font-bold text-white">You&apos;re on the list!</p>
          <p className="text-xs text-white/40 mt-0.5">We&apos;ll email you the moment the iOS app launches.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`flex flex-col gap-2.5 ${compact ? "w-full max-w-sm" : "w-full max-w-md"}`}>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="your@email.com"
          className="flex-1 h-12 rounded-xl border border-white/10 bg-[#111622] px-4 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#FF7828]/50 focus:ring-1 focus:ring-[#FF7828]/25 transition-all"
        />
        <Button
          onClick={submit}
          disabled={state === "loading"}
          className="h-12 px-5 rounded-xl bg-[#FF7828] hover:bg-[#FFA550] text-white font-bold gap-1.5 shadow-[0_6px_20px_rgba(255,120,40,0.30)] shrink-0"
        >
          {state === "loading" ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Bell size={13} strokeWidth={2} />
              {compact ? "Join" : "Notify Me"}
            </>
          )}
        </Button>
      </div>
      {errorMsg && <p className="text-xs text-red-400 pl-1">{errorMsg}</p>}
      <p className="text-xs text-white/18 pl-1">No spam. Just a launch notification.</p>
    </div>
  );
}

// ─── Phone frame component ────────────────────────────────────────────────────

function PhoneFrame({
  src, alt, width = 220, zDepth = 0, rotate = 0, scale = 1, floatDelay = 0
}: {
  src: string; alt: string; width?: number; zDepth?: number;
  rotate?: number; scale?: number; floatDelay?: number;
}) {
  return (
    <motion.div
      style={{ zIndex: zDepth, position: "relative" }}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 5 + floatDelay * 0.5, delay: floatDelay, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Glow behind the hero phone */}
      {zDepth > 1 && (
        <div
          className="absolute -inset-8 rounded-full blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,120,40,0.25) 0%, transparent 70%)" }}
        />
      )}
      <div
        className="rounded-[2.6rem] overflow-hidden border-2 border-white/10 shadow-[0_28px_80px_rgba(0,0,0,0.75)]"
        style={{ width, transform: `rotate(${rotate}deg) scale(${scale})` }}
      >
        <Image src={src} alt={alt} width={width} height={Math.round(width * 2.16)} className="w-full block" />
      </div>
    </motion.div>
  );
}

// ─── Feature showcase rows ─────────────────────────────────────────────────────

const SHOWCASE = [
  {
    tag: "TODAY'S DASHBOARD",
    title: "Everything you need at first pitch",
    description: "Your favorite team featured front and center. Live scores, game status, starting pitchers, and stadium weather — all in one view. Free for every user, every day.",
    tier: "free",
    screenshots: [
      { src: "/screenshots/01-today-dashboard.png", alt: "Today dashboard" },
      { src: "/screenshots/02-scores-tab.png",      alt: "Scores tab" },
    ],
    stats: [
      { label: "Games tracked", value: "15 / day", color: "#FF7828" },
      { label: "Live updates",  value: "Real-time",  color: "#50C882" },
    ],
  },
  {
    tag: "DEEP GAME ANALYSIS",
    title: "Every matchup broken down completely",
    description: "Tap any game to surface the full pitcher card — ERA, WHIP, K/9, W/L — plus a weather overlay showing wind direction and speed. The edge analysis section breaks down the prediction score with per-factor reasoning.",
    tier: "free",
    screenshots: [
      { src: "/screenshots/03-game-detail-pitchers-weather.png", alt: "Game detail pitchers" },
      { src: "/screenshots/04-game-detail-edge-analysis-batter-props.png", alt: "Edge analysis" },
    ],
    stats: [
      { label: "Edge score",   value: "0–100",   color: "#818cf8" },
      { label: "Wind impact",  value: "Per park", color: "#2dd4bf" },
    ],
    flip: true,
  },
  {
    tag: "PROP BUILDER",
    title: "Build slips with data-driven props",
    description: "HR, 1+ Hit, 2+ Hit props for every batter vs the confirmed starter. Ranked by probability. Add legs to your slip, see combined probability and break-even odds, then save it to track the result.",
    tier: "pro",
    screenshots: [
      { src: "/screenshots/09-prop-builder-home-run.png",    alt: "HR props" },
      { src: "/screenshots/11-prop-builder-add-to-slip.png", alt: "Add to slip" },
      { src: "/screenshots/12-prop-builder-your-slip.png",   alt: "Your slip" },
    ],
    stats: [
      { label: "Prop types",      value: "HR · Hit · K", color: "#FF7828" },
      { label: "Combined odds",   value: "Auto-calc",    color: "#818cf8" },
    ],
  },
  {
    tag: "EDGE REPORT",
    title: "AI-ranked value bets across the full slate",
    description: "Every game ranked by edge score. Pitcher-batter mismatches, weather boosts, line discrepancies — surfaced before the market adjusts. The report updates as lineups are confirmed throughout the day.",
    tier: "pro",
    screenshots: [
      { src: "/screenshots/07-analysis-edge-report.png", alt: "Edge report" },
      { src: "/screenshots/06-analysis-matchups.png",    alt: "Matchup analysis" },
    ],
    stats: [
      { label: "Ranked daily",  value: "Full slate",  color: "#FF7828" },
      { label: "Factors",       value: "8 weighted",  color: "#50C882" },
    ],
    flip: true,
  },
];

function ShowcaseRow({ item, index }: { item: typeof SHOWCASE[0]; index: number }) {
  const isPro = item.tier === "pro";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: easing }}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center py-16 sm:py-20 border-t border-white/[0.05] ${
        item.flip ? "lg:[&>*:first-child]:order-2" : ""
      }`}
    >
      {/* Copy */}
      <div className="flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: isPro ? "#FF7828" : "rgba(255,255,255,0.30)" }}>
            {item.tag}
          </span>
          {isPro && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#FF7828]/30 bg-[#FF7828]/10 px-2 py-0.5 text-[9px] font-black text-[#FF7828] tracking-widest uppercase">
              <Lock size={8} strokeWidth={2.5} />
              Pro
            </span>
          )}
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-4">
          {item.title}
        </h2>
        <p className="text-white/45 text-base leading-relaxed mb-8">
          {item.description}
        </p>

        {/* Stat pills */}
        <div className="grid grid-cols-2 gap-3 mb-8 max-w-xs">
          {item.stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/[0.07] bg-[#111622] px-4 py-3">
              <p className="text-[10px] text-white/25 font-bold tracking-wider uppercase mb-1">{s.label}</p>
              <p className="text-sm font-black" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Screenshots */}
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        {item.screenshots.slice(0, 3).map((s, i) => {
          const isCenter = i === 1 && item.screenshots.length > 1;
          return (
            <motion.div
              key={s.src}
              initial={{ opacity: 0, y: 20 + i * 10 }}
              whileInView={{ opacity: isCenter ? 0.5 : (i === 0 ? 1 : 0.65), y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: easing }}
              className={isCenter ? "hidden sm:block" : ""}
            >
              <PhoneFrame
                src={s.src}
                alt={s.alt}
                width={i === 0 ? 210 : 175}
                zDepth={i === 0 ? 2 : 1}
                rotate={i === 0 ? -2 : i === 2 ? 4 : 0}
                floatDelay={i * 1.2}
              />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Scrolling screenshot strip ───────────────────────────────────────────────

const STRIP_SHOTS = [
  "/screenshots/01-today-dashboard.png",
  "/screenshots/09-prop-builder-home-run.png",
  "/screenshots/07-analysis-edge-report.png",
  "/screenshots/04-game-detail-edge-analysis-batter-props.png",
  "/screenshots/12-prop-builder-your-slip.png",
  "/screenshots/03-game-detail-pitchers-weather.png",
  "/screenshots/08-analysis-props.png",
  "/screenshots/13-settings-account-bet-history.png",
];

function ScrollingStrip() {
  // Duplicate for infinite scroll effect
  const all = [...STRIP_SHOTS, ...STRIP_SHOTS];
  return (
    <div className="overflow-hidden py-8">
      <motion.div
        className="flex gap-4"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        style={{ width: "max-content" }}
      >
        {all.map((src, i) => (
          <div key={i} className="shrink-0 w-[130px] rounded-[1.8rem] overflow-hidden border border-white/[0.08] opacity-70 hover:opacity-100 transition-opacity">
            <Image src={src} alt="App screenshot" width={130} height={281} className="w-full block" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DownloadPage() {
  return (
    <>
      <Header />
      <main className="overflow-hidden">

        {/* HERO ────────────────────────────────────────────────────────────── */}
        <section className="relative min-h-[90vh] flex items-center pt-16 pb-12 sm:pt-20 sm:pb-16">
          <AnimatedBackground />

          <Container className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Copy */}
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: easing }}
                  className="mb-5"
                >
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#FF7828]/25 bg-[#FF7828]/[0.08] px-4 py-2">
                    <Smartphone size={12} className="text-[#FF7828]" strokeWidth={2} />
                    <span className="text-xs font-bold text-[#FF7828] tracking-wider uppercase">iOS App — Coming Soon</span>
                  </div>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.1, ease: easing }}
                  className="text-5xl sm:text-6xl font-black tracking-tight text-white leading-[1.04] mb-5"
                >
                  The MLB edge{" "}
                  <span className="gradient-orange-text">in your pocket</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2, ease: easing }}
                  className="text-white/45 text-base sm:text-lg leading-relaxed max-w-lg mb-8"
                >
                  Every prop. Every edge. Every game — in a native iOS app built for speed. Join the waitlist to get early access when it launches.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.3, ease: easing }}
                >
                  <WaitlistForm />
                </motion.div>

                {/* Social proof */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="flex items-center gap-3 mt-7"
                >
                  <div className="flex -space-x-2">
                    {["#FF7828", "#818cf8", "#2dd4bf", "#50C882", "#FF7828"].map((c, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${c}15`, borderColor: `${c}40` }}
                      >
                        <Star size={9} style={{ color: c }} strokeWidth={2} />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-white/30">Join <span className="text-white/50 font-semibold">240+</span> bettors on the waitlist</p>
                </motion.div>
              </div>

              {/* Hero phone showcase */}
              <div className="flex items-center justify-center">
                <div className="relative">
                  {/* Back phones */}
                  <motion.div
                    initial={{ opacity: 0, x: 50, rotate: 8 }}
                    animate={{ opacity: 0.45, x: 70, rotate: 8 }}
                    transition={{ duration: 0.9, delay: 0.5, ease: easing }}
                    className="absolute top-8"
                  >
                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}>
                      <div className="w-[185px] rounded-[2.4rem] overflow-hidden border-2 border-white/10 shadow-2xl">
                        <Image src="/screenshots/09-prop-builder-home-run.png" alt="Prop Builder" width={185} height={400} />
                      </div>
                    </motion.div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -50, rotate: -8 }}
                    animate={{ opacity: 0.35, x: -75, rotate: -9 }}
                    transition={{ duration: 0.9, delay: 0.6, ease: easing }}
                    className="absolute top-12"
                  >
                    <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 6, delay: 1, repeat: Infinity, ease: "easeInOut" }}>
                      <div className="w-[175px] rounded-[2.3rem] overflow-hidden border-2 border-white/8 shadow-2xl">
                        <Image src="/screenshots/07-analysis-edge-report.png" alt="Edge Report" width={175} height={378} />
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Hero phone */}
                  <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.9, delay: 0.3, ease: easing }}
                    className="relative z-10"
                  >
                    <div className="absolute -inset-6 rounded-full blur-3xl opacity-35 pointer-events-none"
                      style={{ background: "radial-gradient(circle, rgba(255,120,40,0.4) 0%, transparent 70%)" }} />
                    <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
                      <div className="w-[230px] rounded-[2.6rem] overflow-hidden border-2 border-white/15 shadow-[0_32px_80px_rgba(0,0,0,0.8)]">
                        <Image src="/screenshots/01-today-dashboard.png" alt="Today Dashboard" width={230} height={498} priority />
                      </div>
                    </motion.div>
                    {/* Floating labels */}
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.1, duration: 0.4 }}
                      className="absolute -right-4 top-20 z-20 rounded-xl border border-[#50C882]/25 bg-[#0D1117]/90 backdrop-blur-sm px-3 py-2 shadow-lg">
                      <p className="text-[9px] text-white/30 tracking-widest uppercase">Win Prob</p>
                      <p className="text-base font-black text-[#50C882]">67%</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.3, duration: 0.4 }}
                      className="absolute -left-6 bottom-32 z-20 rounded-xl border border-[#FF7828]/25 bg-[#0D1117]/90 backdrop-blur-sm px-3 py-2 shadow-lg">
                      <p className="text-[9px] text-white/30 tracking-widest uppercase">Edge Score</p>
                      <p className="text-base font-black text-[#FF7828]">91</p>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </div>
          </Container>

          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </section>

        {/* SCROLLING STRIP ─────────────────────────────────────────────────── */}
        <div className="border-y border-white/[0.05] bg-[#0A0E14]">
          <ScrollingStrip />
        </div>

        {/* DESIGN CONCEPT HEADER ───────────────────────────────────────────── */}
        <section className="py-16 sm:py-20">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto text-center mb-6"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/40 tracking-wider uppercase mb-5">
                App Design
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
                Five tabs.{" "}
                <span className="gradient-orange-text">Five distinct tools.</span>
              </h2>
              <p className="text-white/40 text-base leading-relaxed">
                Built around the Liquid Glass tab bar. Every screen purpose-built — no bloat, no clutter.
              </p>
            </motion.div>

            {/* Tab architecture */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="rounded-2xl border border-white/[0.07] bg-[#111622] p-6 mb-16"
            >
              <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-6">App Tab Architecture</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                  { icon: BarChart3,  label: "Today",    sub: "Games · Weather · Slips",      color: "#FF7828", active: true },
                  { icon: TrendingUp, label: "Scores",   sub: "Results · R/H/E · CTAs",       color: "#818cf8" },
                  { icon: Target,     label: "Analysis", sub: "Matchups · Edge Score",        color: "#2dd4bf" },
                  { icon: Layers,     label: "Builder",  sub: "Props · Parlay · Odds",        color: "#50C882" },
                  { icon: Eye,        label: "Settings", sub: "History · Win Rate",           color: "#FF7828" },
                ].map((tab, i) => (
                  <motion.div
                    key={tab.label}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${
                      tab.active
                        ? "shadow-[0_4px_16px_rgba(255,120,40,0.30)]"
                        : ""
                    }`}
                      style={{ backgroundColor: `${tab.color}${tab.active ? "25" : "12"}`, border: `1px solid ${tab.color}${tab.active ? "40" : "20"}` }}
                    >
                      <tab.icon size={20} style={{ color: tab.color }} strokeWidth={1.7} />
                    </div>
                    <p className="text-sm font-bold text-white mb-1">{tab.label}</p>
                    <p className="text-[10px] text-white/25 leading-relaxed">{tab.sub}</p>
                    {tab.active && <div className="w-6 h-0.5 rounded-full bg-[#FF7828] mt-2" />}
                  </motion.div>
                ))}
              </div>
              <p className="mt-6 text-center text-[11px] text-white/20">
                Liquid Glass tab bar · iOS 26 native · blur fallback for older iOS
              </p>
            </motion.div>
          </Container>
        </section>

        {/* SHOWCASE ROWS ───────────────────────────────────────────────────── */}
        <section className="pb-8">
          <Container>
            {SHOWCASE.map((item, i) => (
              <ShowcaseRow key={item.tag} item={item} index={i} />
            ))}
          </Container>
        </section>

        {/* PRICING SECTION ─────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-20 border-t border-white/[0.05]">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
                Start free. Try Fan or Pro on us.
              </h2>
              <p className="text-white/40 max-w-md mx-auto">
                14-day Fan trial. 3-day Pro trial. Card required. No charge until your trial ends.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {/* Free */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl p-6"
                style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <p className="text-xs font-bold tracking-widest uppercase mb-1 text-white/30">Free</p>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black text-white">$0</span>
                  <span className="text-white/30 text-sm">/month</span>
                </div>
                <ul className="space-y-2.5">
                  {["Today's game schedule", "Live scores", "Win predictions", "Weather conditions"].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <Check size={13} strokeWidth={2.5} style={{ color: "rgba(255,255,255,0.30)", flexShrink: 0 }} />
                      <span className="text-sm text-white/45">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Fan */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.08 }}
                className="rounded-2xl p-6 relative overflow-hidden"
                style={{ backgroundColor: "rgba(255,120,40,0.06)", border: "1px solid rgba(255,120,40,0.30)" }}
              >
                <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#FF7828]/10 blur-3xl pointer-events-none" />
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold tracking-widest uppercase text-[#FF7828]">Fan</p>
                  <span className="rounded-full border border-[#FF7828]/30 bg-[#FF7828]/10 px-2 py-0.5 text-[9px] font-black text-[#FF7828] tracking-widest uppercase">Most Popular</span>
                </div>
                <div className="text-[9px] font-black text-[#FF7828] tracking-widest uppercase mb-1">14-Day Free Trial</div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black text-white">$4.99</span>
                  <span className="text-white/30 text-sm">/mo after trial</span>
                </div>
                <ul className="space-y-2.5">
                  {["Edge Report — AI-ranked value bets", "Full Prop Builder (HR, hits, K props)", "Batter vs Pitcher matchup analysis", "Multi-leg prop slips & bet tracker", "Priority data refresh"].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <Check size={13} strokeWidth={2.5} style={{ color: "#FF7828", flexShrink: 0 }} />
                      <span className="text-sm text-white/70">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Pro */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.16 }}
                className="rounded-2xl p-6 relative overflow-hidden"
                style={{ backgroundColor: "rgba(129,140,248,0.06)", border: "1px solid rgba(129,140,248,0.30)" }}
              >
                <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#818cf8]/10 blur-3xl pointer-events-none" />
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold tracking-widest uppercase text-[#818cf8]">Pro</p>
                  <span className="rounded-full border border-[#818cf8]/30 bg-[#818cf8]/10 px-2 py-0.5 text-[9px] font-black text-[#818cf8] tracking-widest uppercase">Best Value</span>
                </div>
                <div className="text-[9px] font-black text-[#818cf8] tracking-widest uppercase mb-1">3-Day Free Trial</div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black text-white">$14.99</span>
                  <span className="text-white/30 text-sm">/mo after trial</span>
                </div>
                <ul className="space-y-2.5">
                  {["HR Deep Dive + spray charts", "Wall Clearance & Carry Analysis", "Confident daily picks"].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <Check size={13} strokeWidth={2.5} style={{ color: "#818cf8", flexShrink: 0 }} />
                      <span className="text-sm text-white/70">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </Container>
        </section>

        {/* FINAL CTA ───────────────────────────────────────────────────────── */}
        <section className="relative py-20 sm:py-28 border-t border-white/[0.05] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-[#FF7828]/[0.07] blur-[80px]" />
          </div>

          <Container className="relative z-10">
            <div className="max-w-lg mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="w-16 h-16 rounded-2xl border border-[#FF7828]/30 bg-[#FF7828]/10 flex items-center justify-center mx-auto mb-6"
              >
                <Smartphone size={28} className="text-[#FF7828]" strokeWidth={1.6} />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4"
              >
                Be first when it launches
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-white/40 mb-8 leading-relaxed"
              >
                The iOS app is in development. Join the waitlist — you&apos;ll get a notification the moment it&apos;s available in the App Store.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex justify-center"
              >
                <WaitlistForm />
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-6 text-xs text-white/20"
              >
                In the meantime,{" "}
                <a href="/sign-up" className="text-[#FF7828] hover:underline">
                  use the full web app →
                </a>
              </motion.p>
            </div>
          </Container>
        </section>
      </main>
      <LandingFooter />
    </>
  );
}
