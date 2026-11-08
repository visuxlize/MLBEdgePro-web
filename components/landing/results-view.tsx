"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";
import { Container } from "./container";
import type { Scorecard } from "@/lib/results/backtest";

const INK = "#14161b", GREEN = "#12a150", RED = "#ef3b4a", BLUE = "#1a73ff";
const SHADOW = "0 1px 2px rgba(20,22,27,.04), 0 12px 36px rgba(20,22,27,.07)";
type Key = "nfl" | "nba" | "soccer";

function Counter({ to, suffix = "", dec = 0 }: { to: number; suffix?: string; dec?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1100);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return <span ref={ref}>{v.toFixed(dec)}{suffix}</span>;
}

function Stat({ label, value, sub, color = INK, dec = 0, suffix = "" }: { label: string; value: number; sub: string; color?: string; dec?: number; suffix?: string }) {
  return (
    <div className="rounded-[22px] bg-white p-5" style={{ boxShadow: SHADOW }}>
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#14161b]/45">{label}</p>
      <p className="mt-2 text-4xl font-black tracking-tight" style={{ color }}><Counter to={value} dec={dec} suffix={suffix} /></p>
      <p className="mt-1 text-[12px] text-[#14161b]/50">{sub}</p>
    </div>
  );
}

function Calibration({ c }: { c: Scorecard }) {
  return (
    <div className="rounded-[26px] bg-white p-6" style={{ boxShadow: SHADOW }}>
      <h3 className="text-lg font-black text-[#14161b]">Does 70% mean 70%?</h3>
      <p className="text-[13px] text-[#14161b]/55 mt-1">When the model says a pick is X% likely, how often did it actually win?</p>
      <div className="mt-5 flex flex-col gap-4">
        {c.buckets.map((b, i) => (
          <div key={b.label}>
            <div className="flex items-center justify-between text-[12px] mb-1.5">
              <span className="font-bold text-[#14161b]">Model said {b.label}</span>
              <span className="text-[#14161b]/50">{b.n ? `${b.n} games` : "no games"}</span>
            </div>
            <div className="relative h-3 rounded-full bg-[#eef0f4] overflow-hidden">
              <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ background: `linear-gradient(90deg, ${BLUE}66, ${BLUE})` }} initial={{ width: 0 }} whileInView={{ width: `${b.actual}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay: i * 0.08 }} />
              {b.n > 0 && <span className="absolute top-0 bottom-0 w-0.5 bg-[#14161b]" style={{ left: `${b.predicted}%` }} title={`Predicted ${b.predicted}%`} />}
            </div>
            <div className="flex justify-between text-[11px] mt-1 text-[#14161b]/50"><span>Won {b.n ? `${b.actual}%` : "—"}</span><span>Predicted avg {b.n ? `${b.predicted}%` : "—"}</span></div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-[#14161b]/40">Blue bar = actual win rate · black tick = average predicted probability.</p>
    </div>
  );
}

function Recent({ c }: { c: Scorecard }) {
  return (
    <div className="rounded-[26px] bg-white overflow-hidden" style={{ boxShadow: SHADOW }}>
      <div className="px-6 pt-5 pb-3"><h3 className="text-lg font-black text-[#14161b]">Latest graded picks</h3><p className="text-[13px] text-[#14161b]/55 mt-1">Pick made before the game, from games already played that day or week.</p></div>
      {c.recent.map((r, i) => (
        <motion.div key={r.id} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }} className="flex items-center gap-3 px-6 py-3" style={{ borderTop: "1px solid #eceef2" }}>
          <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: r.correct ? "rgba(18,161,80,.12)" : "rgba(239,59,74,.1)" }}>{r.correct ? <Check size={14} color={GREEN} strokeWidth={3} /> : <X size={14} color={RED} strokeWidth={3} />}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-bold text-[#14161b] truncate">{r.pick} <span className="font-normal text-[#14161b]/45">· {r.prob}%</span></p>
            <p className="text-[11.5px] text-[#14161b]/45 truncate">{r.matchup}</p>
          </div>
          <div className="text-right shrink-0"><p className="font-mono text-[13px] font-bold text-[#14161b]">{r.result}</p><p className="text-[10.5px] text-[#14161b]/40">{new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" })}</p></div>
        </motion.div>
      ))}
    </div>
  );
}

export function ResultsView({ cards }: { cards: { nfl: Scorecard | null; nba: Scorecard | null; soccer: Scorecard | null } }) {
  const tabs: { key: Key; label: string; c: Scorecard | null }[] = [
    { key: "nfl", label: "NFL", c: cards.nfl }, { key: "nba", label: "NBA", c: cards.nba }, { key: "soccer", label: "Soccer", c: cards.soccer },
  ];
  const [k, setK] = useState<Key>("nfl");
  const cur = tabs.find((t) => t.key === k)!.c;
  const edge = cur ? Math.round((cur.accuracy - cur.baseline) * 10) / 10 : 0;

  return (
    <main className="py-14 sm:py-20">
      <Container>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[#14161b]/64 tracking-wider uppercase" style={{ boxShadow: "0 8px 24px rgba(20,22,27,.05)" }}>Results</span>
          <h1 className="mt-5 text-4xl sm:text-6xl font-black tracking-tight text-[#14161b] leading-[1.03]">Every pick, <span className="gradient-orange-text">graded in public.</span></h1>
          <p className="mt-5 text-base sm:text-lg text-[#14161b]/60 leading-relaxed">We rebuild the model day by day and predict each game using only what was known <i>before</i> it was played — then compare with what happened. No cherry-picking, no hindsight.</p>
        </motion.div>

        <div className="mt-10 flex justify-center">
          <div className="inline-flex p-1 rounded-2xl bg-white" style={{ boxShadow: SHADOW }}>
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setK(t.key)} className="relative px-6 py-2.5 rounded-xl text-[14px] font-bold transition-colors" style={k === t.key ? { background: BLUE, color: "#fff", boxShadow: "0 6px 16px rgba(26,115,255,.3)" } : { color: "#8a909b" }}>{t.label}</button>
            ))}
          </div>
        </div>

        {!cur || cur.n === 0 ? (
          <p className="mt-12 text-center text-[#14161b]/55">Results for this sport are being compiled — check back shortly.</p>
        ) : (
          <motion.div key={k} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mt-10">
            <p className="text-center text-[12px] text-[#14161b]/45 mb-5">{cur.window} · {cur.n} games graded</p>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Stat label="Pick accuracy" value={cur.accuracy} suffix="%" dec={1} color={GREEN} sub={`${cur.correct} of ${cur.n} correct`} />
              <Stat label="Vs. home-team baseline" value={Math.abs(edge)} suffix=" pts" dec={1} color={edge >= 0 ? BLUE : RED} sub={`${edge >= 0 ? "+" : "−"} vs always picking home (${cur.baseline}%)`} />
              {cur.maeMargin != null
                ? <Stat label="Avg margin error" value={cur.maeMargin} dec={1} suffix=" pts" sub="Predicted vs actual point margin" />
                : <Stat label="Games graded" value={cur.n} sub="Home / draw / away" />}
              <Stat label="Brier score" value={cur.brier} dec={3} sub={cur.sport === "Soccer" ? "3-way · lower is better (0.667 = coin flip)" : "Lower is better (0.250 = coin flip)"} />
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <Calibration c={cur} />
              <Recent c={cur} />
            </div>

            <div className="mt-6 rounded-[22px] border border-dashed border-[#14161b]/15 bg-white/60 p-5 text-[13px] leading-relaxed text-[#14161b]/60">
              <b className="text-[#14161b]">How this is measured.</b> {cur.note} Early-season samples are small, so expect these numbers to move. This grades win predictions only — player-prop lines change by the minute and aren&rsquo;t archived, so props aren&rsquo;t scored here. Sports betting involves risk; nothing here is a guarantee.
            </div>
          </motion.div>
        )}

        <div className="mt-14 text-center">
          <Link href="/sign-up"><span className="inline-flex items-center gap-2 rounded-full bg-[#1a73ff] text-white font-bold px-7 py-3.5" style={{ boxShadow: "0 10px 28px rgba(26,115,255,.4)" }}>Start free <ArrowRight size={16} strokeWidth={2.5} /></span></Link>
        </div>
      </Container>
    </main>
  );
}
