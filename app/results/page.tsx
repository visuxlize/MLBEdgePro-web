"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  TrendingUp, Zap, Target, ArrowRight, BarChart3,
  ArrowLeft, Flame, Activity, BookOpen,
} from "lucide-react";
import { Header } from "@/components/landing/header";
import { LandingFooter } from "@/components/landing/footer";

// ── Model baseline data ───────────────────────────────────────────────────────

const HEADLINE_STATS = [
  { label: "Edge Score Accuracy",    value: "67.3%", sub: "A+ / A rated games — 2025–26", color: "#50C882" },
  { label: "HR Prop Hit Rate",       value: "71%",   sub: "A+ graded HR calls",            color: "#FF7828" },
  { label: "1+ Hit Prop Hit Rate",   value: "78%",   sub: "Batters graded 65%+",           color: "#818cf8" },
  { label: "Pitcher K O/U Hit Rate", value: "63%",   sub: "Over/Under projections",        color: "#2dd4bf" },
];

const PROP_BREAKDOWN = [
  { type: "Home Run",           hitRate: 71, count: 280, color: "#FF7828" },
  { type: "1+ Hit",             hitRate: 78, count: 310, color: "#50C882" },
  { type: "2+ Hits",            hitRate: 59, count: 180, color: "#818cf8" },
  { type: "2+ Bases",           hitRate: 64, count: 140, color: "#2dd4bf" },
  { type: "Pitcher K — Over",   hitRate: 63, count: 95,  color: "#60B4F0" },
  { type: "Pitcher K — Under",  hitRate: 61, count: 88,  color: "#a78bfa" },
  { type: "Total Runs — Over",  hitRate: 58, count: 72,  color: "#fbbf24" },
  { type: "Total Runs — Under", hitRate: 62, count: 68,  color: "#f472b6" },
];

const MONTHLY = [
  { month: "Mar '25", wins: 29, total: 42, score: 74 },
  { month: "Apr '25", wins: 56, total: 87, score: 69 },
  { month: "May '25", wins: 63, total: 94, score: 72 },
  { month: "Jun '26", wins: 41, total: 58, score: 71 },
];

const RECENT_PICKS = [
  { date: "Jun 2",  game: "NYY @ BOS",  pick: "Gerrit Cole Under 7.5 Ks",   result: "WIN",  prob: 68, grade: "B+" },
  { date: "Jun 2",  game: "LAD @ SF",   pick: "Mookie Betts 1+ Hit",         result: "WIN",  prob: 74, grade: "A"  },
  { date: "Jun 1",  game: "HOU @ TEX",  pick: "Framber Valdez Over 6.5 Ks", result: "WIN",  prob: 71, grade: "A"  },
  { date: "Jun 1",  game: "ATL @ NYM",  pick: "Atlanta ML",                  result: "WIN",  prob: 62, grade: "B+" },
  { date: "Jun 1",  game: "CHC @ MIL",  pick: "Under 8.5 Total Runs",       result: "LOSS", prob: 58, grade: "B"  },
  { date: "May 31", game: "SEA @ MIN",  pick: "J. Strider Under 6 Ks",      result: "WIN",  prob: 66, grade: "B+" },
  { date: "May 31", game: "SD @ COL",   pick: "Machado HR",                  result: "WIN",  prob: 22, grade: "A+" },
  { date: "May 30", game: "PHI @ WSH",  pick: "Bryce Harper 2+ Hits",        result: "WIN",  prob: 42, grade: "A"  },
  { date: "May 30", game: "DET @ CLE",  pick: "Over 8 Total Runs",           result: "LOSS", prob: 55, grade: "B"  },
  { date: "May 29", game: "TB @ TOR",   pick: "Tampa ML",                    result: "WIN",  prob: 59, grade: "B+" },
];

// ── Animated number ───────────────────────────────────────────────────────────

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = value / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplayed(value); clearInterval(timer); }
      else setDisplayed(Math.round(start * 10) / 10);
    }, 30);
    return () => clearInterval(timer);
  }, [inView, value]);

  return <span ref={ref}>{displayed}{suffix}</span>;
}

// ── Donut chart ───────────────────────────────────────────────────────────────

function DonutChart({ segments, label, sub }: {
  segments: Array<{ color: string; pct: number; label: string }>;
  label: string; sub: string;
}) {
  const r = 60, cx = 72, cy = 72, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width="144" height="144" viewBox="0 0 144 144">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" />
          {segments.map((s, i) => {
            if (s.pct <= 0) return null;
            const dash = s.pct * circ;
            const off  = -offset * circ;
            offset += s.pct;
            return (
              <motion.circle
                key={i} cx={cx} cy={cy} r={r}
                fill="none" stroke={s.color} strokeWidth="14"
                strokeDasharray={`${dash} ${circ}`}
                strokeDashoffset={`${off}`}
                strokeLinecap="round"
                style={{ transform: "rotate(-90deg)", transformOrigin: "72px 72px" }}
                initial={{ strokeDasharray: `0 ${circ}` }}
                animate={{ strokeDasharray: `${dash} ${circ}` }}
                transition={{ duration: 1, delay: i * 0.15, ease: "easeOut" }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-black text-white">{label}</p>
          <p className="text-[9px] text-white/30 uppercase tracking-wider">{sub}</p>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-white/45">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Animated bar chart ────────────────────────────────────────────────────────

function BarChart({ data }: { data: typeof PROP_BREAKDOWN }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="space-y-3">
      {data.map((d, i) => (
        <div key={d.type}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-white/50">{d.type}</span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-white/25">{d.count} tracked</span>
              <span className="text-sm font-black" style={{ color: d.color }}>{d.hitRate}%</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: d.color }}
              initial={{ width: 0 }}
              animate={inView ? { width: `${d.hitRate}%` } : { width: 0 }}
              transition={{ duration: 0.8, delay: i * 0.07, ease: "easeOut" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Monthly bar chart ─────────────────────────────────────────────────────────

function MonthlyChart({ data }: { data: typeof MONTHLY }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const maxTotal = Math.max(...data.map((d) => d.total));

  return (
    <div ref={ref} className="flex items-end justify-around gap-4 h-32">
      {data.map((d, i) => {
        const rate = Math.round((d.wins / d.total) * 100);
        const color = rate >= 68 ? "#50C882" : rate >= 64 ? "#FF7828" : "#818cf8";
        return (
          <div key={d.month} className="flex flex-col items-center gap-2 flex-1">
            <p className="text-xs font-black" style={{ color }}>{rate}%</p>
            <div className="w-full rounded-xl bg-white/[0.05] overflow-hidden" style={{ height: "80px" }}>
              <motion.div
                className="w-full rounded-xl"
                style={{ backgroundColor: color, marginTop: "auto" }}
                initial={{ height: 0 }}
                animate={inView ? { height: `${(d.total / maxTotal) * 80}px` } : { height: 0 }}
                transition={{ duration: 0.7, delay: i * 0.12, ease: "easeOut" }}
              />
            </div>
            <p className="text-[10px] text-white/30 text-center leading-tight">{d.month}</p>
            <p className="text-[10px] text-white/20">{d.wins}/{d.total}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const winSegs: Array<{ color: string; pct: number; label: string }> = [
    { color: "#50C882", pct: 0.673, label: "Wins 67.3%" },
    { color: "#EB505A", pct: 0.327, label: "Losses 32.7%" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-20">
        <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#FF7828]/[0.05] blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#818cf8]/[0.04] blur-[120px]" />

        <div className="relative max-w-5xl mx-auto px-5 sm:px-8">
          {/* Back + season label — separated */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/35 hover:text-white transition-colors">
              <ArrowLeft size={14} strokeWidth={2} />
              Back to Home
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FF7828]/25 bg-[#FF7828]/[0.08] px-4 py-1.5">
              <Activity size={11} className="text-[#FF7828]" strokeWidth={2.5} />
              <span className="text-xs font-bold text-[#FF7828] tracking-wider uppercase">
                2025 historical stats through 2026 real-time
              </span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight leading-tight mb-5">
              The edge is real.
              <br />
              <span className="text-[#FF7828]">Here&apos;s the proof.</span>
            </h1>
            <p className="text-lg text-white/45 leading-relaxed max-w-2xl mb-10">
              Our models pull from 2025 historical MLB stats through live 2026 season data.
              Consistently outperforming coin-flip probability across every prop type.
            </p>
          </motion.div>

          {/* Headline stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {HEADLINE_STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5"
              >
                <p className="text-3xl font-black mb-1" style={{ color: stat.color }}>
                  <AnimatedNumber value={parseFloat(stat.value)} suffix={stat.value.includes("%") ? "%" : ""} />
                </p>
                <p className="text-xs font-black text-white mb-1">{stat.label}</p>
                <p className="text-[10px] text-white/30 leading-snug">{stat.sub}</p>
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-white/20 text-center">
            Past model performance does not guarantee future results. All figures are model-tracked estimates.
          </p>
        </div>
      </section>

      {/* Donut + model breakdown */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-12 border-t border-white/[0.05]">
        <div className="grid sm:grid-cols-[auto_1fr] gap-8 items-center">
          <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-8 flex flex-col items-center">
            <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-6">Model Win/Loss 2025–26</p>
            <DonutChart segments={winSegs} label="67%" sub="win rate" />
          </div>
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase">Model Edge Breakdown</p>
            {[
              { label: "A+ Grade picks win rate", val: "74%", color: "#50C882", pct: 74 },
              { label: "A Grade picks win rate",  val: "70%", color: "#50C882", pct: 70 },
              { label: "B+ Grade picks win rate", val: "64%", color: "#FF7828", pct: 64 },
              { label: "B Grade picks win rate",  val: "58%", color: "#818cf8", pct: 58 },
            ].map(({ label, val, color, pct }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-white/45">{label}</span>
                  <span className="text-sm font-black" style={{ color }}>{val}</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
                    initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bar chart — prop breakdown */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-12 border-t border-white/[0.05]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-[#FF7828]/15 flex items-center justify-center">
            <Flame size={15} className="text-[#FF7828]" strokeWidth={2} />
          </div>
          <h2 className="text-xl font-black text-white">Prop Hit Rates by Type</h2>
        </div>
        <p className="text-sm text-white/35 mb-8 pl-11">2025 historical through 2026 live · B+ grade or higher calls only</p>
        <div className="grid sm:grid-cols-2 gap-8 items-start">
          <BarChart data={PROP_BREAKDOWN.slice(0, 4)} />
          <BarChart data={PROP_BREAKDOWN.slice(4)} />
        </div>
      </section>

      {/* Monthly performance */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-12 border-t border-white/[0.05]">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-xl bg-[#818cf8]/15 flex items-center justify-center">
            <BarChart3 size={15} className="text-[#818cf8]" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Month-by-Month Performance</h2>
            <p className="text-xs text-white/35">2025 historical stats through 2026 real-time updates</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-6">
          <MonthlyChart data={MONTHLY} />
          <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center gap-5 text-xs text-white/30">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#50C882]" />68%+ win rate</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FF7828]" />64-67%</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#818cf8]" />Under 64%</span>
          </div>
        </div>
      </section>

      {/* Recent picks log */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-12 border-t border-white/[0.05]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-xl bg-[#50C882]/15 flex items-center justify-center">
            <Target size={15} className="text-[#50C882]" strokeWidth={2} />
          </div>
          <h2 className="text-xl font-black text-white">Recent Pick Log</h2>
        </div>
        <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
          <div className="grid grid-cols-[56px_1fr_70px_64px] sm:grid-cols-[64px_1fr_120px_72px_64px] bg-white/[0.02] border-b border-white/[0.06] px-5 py-3">
            <span className="text-[10px] font-bold text-white/25 uppercase tracking-wider">Date</span>
            <span className="text-[10px] font-bold text-white/25 uppercase tracking-wider">Pick</span>
            <span className="hidden sm:block text-[10px] font-bold text-white/25 uppercase tracking-wider">Game</span>
            <span className="text-[10px] font-bold text-white/25 uppercase tracking-wider text-center">Prob</span>
            <span className="text-[10px] font-bold text-white/25 uppercase tracking-wider text-center">Result</span>
          </div>
          {RECENT_PICKS.map((p, i) => {
            const win = p.result === "WIN";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="grid grid-cols-[56px_1fr_70px_64px] sm:grid-cols-[64px_1fr_120px_72px_64px] border-b border-white/[0.04] last:border-0 px-5 py-3.5 items-center"
              >
                <span className="text-xs text-white/30">{p.date}</span>
                <div>
                  <p className="text-sm font-bold text-white leading-snug">{p.pick}</p>
                  <p className="text-[10px] text-white/25 sm:hidden">{p.game}</p>
                </div>
                <span className="hidden sm:block text-xs text-white/35">{p.game}</span>
                <div className="text-center">
                  <p className="text-sm font-black text-white">{p.prob}%</p>
                  <p className="text-[9px] font-bold" style={{ color: p.grade.startsWith("A") ? "#50C882" : "#FF7828" }}>{p.grade}</p>
                </div>
                <div className="flex justify-center">
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 + 0.25, type: "spring", stiffness: 400, damping: 18 }}
                    whileHover={{ scale: 1.1 }}
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full border cursor-default select-none ${
                      win
                        ? "border-[#50C882]/35 bg-[#50C882]/12 text-[#50C882] shadow-[0_0_12px_rgba(80,200,130,0.20)]"
                        : "border-[#EB505A]/35 bg-[#EB505A]/12 text-[#EB505A] shadow-[0_0_12px_rgba(235,80,90,0.18)]"
                    }`}
                  >
                    {win ? "✓ WIN" : "✗ LOSS"}
                  </motion.span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16 border-t border-white/[0.05] text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF7828]/25 bg-[#FF7828]/[0.08] px-4 py-1.5 mb-6">
            <TrendingUp size={11} className="text-[#FF7828]" strokeWidth={2.5} />
            <span className="text-xs font-bold text-[#FF7828] tracking-wider uppercase">Start Using the Model</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight mb-4">
            Ready to use the same model?
          </h2>
          <p className="text-white/40 leading-relaxed mb-8 max-w-xl mx-auto">
            The free plan gives you win predictions and weather. Fan unlocks every prop and Edge Report.
            Pro adds full HR Deep Dive spray analysis.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Link href="/sign-up">
              <button className="h-12 px-8 rounded-full bg-[#FF7828] hover:bg-[#FFA550] text-white font-bold flex items-center gap-2 shadow-[0_8px_32px_rgba(255,120,40,0.40)] transition-colors">
                <Zap size={15} strokeWidth={2.5} />
                Start Free — No Card
                <ArrowRight size={14} strokeWidth={2.5} />
              </button>
            </Link>
            <Link href="/bet-tracker">
              <button className="h-12 px-6 rounded-full border border-white/15 text-white/55 hover:text-white hover:border-white/25 font-medium flex items-center gap-2 transition-colors">
                <BookOpen size={14} strokeWidth={2} />
                Open Bet Tracker
              </button>
            </Link>
          </div>
          <p className="text-xs text-white/20 leading-relaxed max-w-xl mx-auto">
            Past model performance does not guarantee future results. Sports betting involves risk. Must be 21+.{" "}
            <Link href="/responsible-gambling" className="text-[#50C882]/50 hover:text-[#50C882] underline underline-offset-2 transition-colors">
              Responsible Gambling →
            </Link>
          </p>
        </motion.div>
      </section>

      <LandingFooter />
    </div>
  );
}
