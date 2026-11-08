"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, ArrowRight, BarChart3, CircleDot, LineChart, ListOrdered, Radio, Target, Trophy, Zap } from "lucide-react";
import { useState } from "react";
import { Container } from "./container";
import { NbaDemo, NflDemo, PropsDemo, SoccerDemo, StandingsDemo } from "./demos";

const SPORTS = [
  {
    key: "NBA", color: "#ea6a0a", tint: "rgba(234,106,10,.09)", icon: CircleDot,
    title: "NBA", blurb: "Live shot charts, standings and the Emirates NBA Cup.",
    points: ["Live shot chart, scoring runs & lead tracker", "Standings, East/West & Edge Power rankings", "Emirates NBA Cup groups and who's advancing", "Real DraftKings points, rebounds, assists & threes"],
  },
  {
    key: "NFL", color: "#6d4fe0", tint: "rgba(109,79,224,.09)", icon: Activity,
    title: "NFL", blurb: "All 18 weeks, scores, placement and game props.",
    points: ["Live drive tracker with field position & first-down line", "Every week, every score, with seeding on each card", "Player leaders with this week's matchup grade", "DraftKings game props with open-to-current movement"],
  },
  {
    key: "SOC", color: "#12a150", tint: "rgba(18,161,80,.09)", icon: Trophy,
    title: "Soccer", blurb: "Ten leagues in a match centre built for analysis.",
    points: ["Live timeline, momentum and win probability", "Lineups on the pitch, best player and xG", "Match insights: scorelines, over 2.5, value vs market", "DraftKings goalscorer, shots, cards & assists"],
  },
];

const FEATURES = [
  { icon: Radio, title: "Live game trackers", body: "Every live game gets a tracker that updates on its own — drive map, shot chart or match timeline with live win probability.", tier: "Free" },
  { icon: ListOrdered, title: "Standings & power rankings", body: "Division races, playoff seeding and an Edge Power ranking that weighs point differential.", tier: "Free" },
  { icon: LineChart, title: "Real prop lines", body: "DraftKings player props for the NBA, NFL and soccer with a model projection against each line.", tier: "Fan" },
  { icon: Target, title: "Line movement", body: "See where every prop opened and where it sits now, so you know when the market has moved.", tier: "Fan" },
  { icon: BarChart3, title: "Lines vs the model", body: "Spread, total and moneyline next to the model's number, with the points of value called out.", tier: "Fan" },
  { icon: Zap, title: "Match insights", body: "Expected goals, likeliest scorelines and where the model disagrees with the market.", tier: "Free" },
];

const TIER_COLOR: Record<string, string> = { Free: "#12a150", Fan: "#1a73ff", Pro: "#6d4fe0" };

function Proof() {
  const items = [["3", "sports in full swing"], ["10", "soccer leagues"], ["18", "NFL weeks, every score"], ["1,000+", "markets on a typical game"]];
  return (
    <section className="py-10">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {items.map(([n, l], i) => (
            <motion.div key={l} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="rounded-[22px] bg-white px-5 py-4 text-center" style={{ boxShadow: "0 1px 2px rgba(20,22,27,.04), 0 8px 24px rgba(20,22,27,.05)" }}>
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-[#14161b]">{n}</p>
              <p className="text-[12px] text-[#14161b]/55 mt-1">{l}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function LiveToggle() {
  const [s, setS] = useState<"nfl" | "nba">("nfl");
  return (
    <div>
      <div className="inline-flex p-1 rounded-2xl bg-white mb-3" style={{ boxShadow: "0 1px 2px rgba(20,22,27,.04), 0 6px 18px rgba(20,22,27,.05)" }}>
        {(["nfl", "nba"] as const).map((k) => (
          <button key={k} onClick={() => setS(k)} className="px-4 py-1.5 rounded-xl text-[12px] font-bold transition-colors" style={s === k ? { background: "#1a73ff", color: "#fff" } : { color: "#8a909b" }}>{k === "nfl" ? "NFL drive tracker" : "NBA shot chart"}</button>
        ))}
      </div>
      {s === "nfl" ? <NflDemo /> : <NbaDemo />}
    </div>
  );
}

const TOUR = [
  { id: "live", eyebrow: "Live analysis", title: "Watch every game like a pro", body: "Every live game gets its own tracker that refreshes by itself — the NFL drive map with first-down line, the NBA shot chart with scoring runs, and a win probability that moves with every play.", points: ["Field position, down & distance, red-zone flags", "Shot chart, runs and lead tracker", "Win probability and play-by-play, live"], visual: <LiveToggle /> },
  { id: "props", eyebrow: "Real prop lines", title: "DraftKings lines, graded by the model", body: "Real player-prop lines for the NBA, NFL and soccer with a matchup-adjusted projection against each one — plus how far the number has moved since it opened.", points: ["Hit probability and grade on every prop", "Line movement: open → current", "Reasons: defense, game total, game script"], visual: <PropsDemo /> },
  { id: "soccer", eyebrow: "Soccer match centre", title: "Ten leagues, one match centre", body: "Timeline, momentum, lineups on the pitch, best player and expected goals — with a live win probability and the model's read on value versus the market.", points: ["Live timeline with goals and cards", "xG, likeliest scorelines, over 2.5, both score", "Goalscorer, shots, cards and assists markets"], visual: <SoccerDemo /> },
  { id: "rank", eyebrow: "Standings & rankings", title: "Know who's actually good", body: "Division races, playoff seeding, the Emirates NBA Cup groups and an Edge Power ranking that weighs point differential — so you see through the win-loss record.", points: ["East/West, divisions and seeding lines", "Emirates NBA Cup: who's advancing", "Power rankings across the league"], visual: <StandingsDemo /> },
];

function Tour() {
  return (
    <section id="tour" className="py-16 sm:py-24">
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[#14161b]/64 tracking-wider uppercase" style={{ boxShadow: "0 8px 24px rgba(20,22,27,.05)" }}>Live tour</span>
          <h2 className="mt-5 text-3xl sm:text-5xl font-black tracking-tight text-[#14161b] leading-[1.05]">See what you get <span className="gradient-orange-text">inside.</span></h2>
          <p className="mt-4 text-base text-[#14161b]/60">These are the real tools — shown here with sample data.</p>
        </div>
        <div className="flex flex-col gap-20 sm:gap-28">
          {TOUR.map((t, i) => (
            <div key={t.id} className={`grid gap-8 lg:gap-14 lg:grid-cols-2 items-center ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55 }}>
                <p className="text-[12px] font-extrabold uppercase tracking-[.16em] text-[#1a73ff]">{t.eyebrow}</p>
                <h3 className="mt-3 text-2xl sm:text-4xl font-black tracking-tight text-[#14161b] leading-[1.1]">{t.title}</h3>
                <p className="mt-4 text-[15px] text-[#14161b]/62 leading-relaxed max-w-lg">{t.body}</p>
                <ul className="mt-5 flex flex-col gap-2.5">
                  {t.points.map((pt) => <li key={pt} className="flex gap-2.5 text-[14.5px] text-[#14161b]/75"><span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[#1a73ff] shrink-0" />{pt}</li>)}
                </ul>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 30, scale: 0.98 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, delay: 0.1 }} className="rounded-[28px] p-4 sm:p-6" style={{ background: "linear-gradient(145deg,#e4ecfb,#f1f3f8)" }}>
                {t.visual}
              </motion.div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function LandingFeatures() {
  return (
    <>
    <Proof />
    <Tour />
    <section id="features" className="py-20 sm:py-28">
      <Container>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5 }} className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[#14161b]/64 tracking-wider uppercase" style={{ boxShadow: "var(--shadow-card, 0 8px 24px rgba(20,22,27,.05))" }}>Features</span>
          <h2 className="mt-5 text-3xl sm:text-5xl font-black tracking-tight text-[#14161b] leading-[1.05]">Built for game day, <span className="gradient-orange-text">every sport.</span></h2>
          <p className="mt-4 text-base text-[#14161b]/60 leading-relaxed">Three sports in full swing, one clean workspace. Live analysis when the game is on, real prop lines when you&rsquo;re building a slip.</p>
        </motion.div>

        {/* Sports */}
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {SPORTS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.key} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-[26px] bg-white p-6 flex flex-col" style={{ boxShadow: "0 1px 2px rgba(20,22,27,.04), 0 12px 36px rgba(20,22,27,.07)" }}>
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: s.tint, color: s.color }}><Icon size={20} strokeWidth={1.9} /></span>
                  <div>
                    <h3 className="text-xl font-black text-[#14161b] leading-none">{s.title}</h3>
                    <p className="text-[12px] text-[#14161b]/50 mt-1">{s.blurb}</p>
                  </div>
                </div>
                <ul className="mt-5 flex flex-col gap-2.5">
                  {s.points.map((pt) => (
                    <li key={pt} className="flex gap-2.5 text-[14px] text-[#14161b]/72 leading-snug">
                      <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color }} />{pt}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Feature grid */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-30px" }} transition={{ duration: 0.45, delay: i * 0.05 }}
                className="rounded-[22px] bg-white p-5" style={{ boxShadow: "0 1px 2px rgba(20,22,27,.04), 0 8px 24px rgba(20,22,27,.05)" }}>
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-xl bg-[#f3f4f7] flex items-center justify-center text-[#14161b]"><Icon size={18} strokeWidth={1.8} /></span>
                  <span className="text-[10px] font-black tracking-widest uppercase rounded-full px-2.5 py-1" style={{ color: TIER_COLOR[f.tier], background: `${TIER_COLOR[f.tier]}14` }}>{f.tier}</span>
                </div>
                <h3 className="mt-4 text-[16px] font-bold text-[#14161b]">{f.title}</h3>
                <p className="mt-1.5 text-[13.5px] text-[#14161b]/58 leading-relaxed">{f.body}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Offseason note */}
        <div className="mt-6 rounded-[22px] border border-dashed border-[#14161b]/15 bg-white/60 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[14px] text-[#14161b]/60 max-w-2xl"><b className="text-[#14161b]">MLB and WNBA are in their offseason.</b> Their season recaps are live now and the full tools switch back on automatically when games return.</p>
          <Link href="/trial?tier=fan" className="shrink-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#1a73ff] text-white font-bold text-sm px-5 py-2.5 group" style={{ boxShadow: "0 8px 22px rgba(26,115,255,.35)" }}>
              Try Fan Free — 14 Days <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
            </span>
          </Link>
        </div>
      </Container>
    </section>
    </>
  );
}
