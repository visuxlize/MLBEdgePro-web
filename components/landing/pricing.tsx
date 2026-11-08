"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Minus, Zap, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "./container";

const FREE_FEATURES = [
  "Every NBA, NFL & soccer schedule and live score",
  "Live game trackers — drive tracker, shot chart, match timeline",
  "Standings, power rankings & the Emirates NBA Cup",
  "Model win probability on every game",
  "Soccer match centre — lineups, momentum, xG & match insights",
];

const FAN_FEATURES = [
  "Everything in Free",
  "Real DraftKings player-prop lines — NBA, NFL & soccer",
  "Model projection vs the book on every prop",
  "Line movement since open",
  "Betting lines vs model spread & total",
  "Game props with the reasoning behind each lean",
  "Priority data refresh",
];

const PRO_FEATURES = [
  "Everything in Fan",
  "WNBA Player Impact Deep Dive (in season)",
  "MLB HR Deep Dive — spray charts & grade (in season)",
  "Early access to new leagues & markets",
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
  ["Schedules & live scores",          true,  true,  true ],
  ["Live game trackers",               true,  true,  true ],
  ["Standings & power rankings",       true,  true,  true ],
  ["Emirates NBA Cup tracker",         true,  true,  true ],
  ["Model win probability",            true,  true,  true ],
  ["DraftKings game lines vs model",   false, true,  true ],
  ["Real DraftKings player props",     false, true,  true ],
  ["Prop line movement",               false, true,  true ],
  ["Game props & reasoning",           false, true,  true ],
  ["Soccer match centre & insights",    true,  true,  true ],
  ["WNBA Player Impact Deep Dive",     false, false, true ],
  ["MLB HR Deep Dive",                 false, false, true ],
];

function CheckIcon({ yes, color }: { yes: boolean; color?: string }) {
  if (!yes) return <Minus size={14} className="text-[#14161b]/25" strokeWidth={2} />;
  return <Check size={15} strokeWidth={2.6} style={{ color: color ?? "#12a150" }} />;
}

const PLANS = [
  { key: "free", name: "Free", price: "$0", per: "forever", tag: "Start here", cta: "Create free account", href: "/sign-up", features: FREE_FEATURES, color: "#12a150", trial: "No card required" },
  { key: "fan", name: "Fan", price: "$4.99", per: "/month", tag: "Most popular", cta: "Try Fan free — 14 days", href: "/trial?tier=fan", features: FAN_FEATURES, color: "#1a73ff", trial: "14-day free trial · cancel anytime", featured: true },
  { key: "pro", name: "Pro", price: "$14.99", per: "/month", tag: "Everything", cta: "Try Pro free — 3 days", href: "/trial?tier=pro", features: PRO_FEATURES, color: "#6d4fe0", trial: "3-day free trial · cancel anytime" },
] as const;

export function LandingPricing() {
  return (
    <section id="pricing" className="py-20 sm:py-28">
      <Container>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5 }} className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[#14161b]/64 tracking-wider uppercase" style={{ boxShadow: "0 8px 24px rgba(20,22,27,.05)" }}>Pricing</span>
          <h2 className="mt-5 text-3xl sm:text-5xl font-black tracking-tight text-[#14161b] leading-[1.05]">Free to start. <span className="gradient-orange-text">Built to win.</span></h2>
          <p className="mt-4 text-base text-[#14161b]/60">Live trackers and standings are free. Upgrade when you want real prop lines and the model&rsquo;s full read.</p>
        </motion.div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3 items-stretch">
          {PLANS.map((p, i) => (
            <motion.div key={p.key} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
              className={`relative rounded-[28px] bg-white p-7 flex flex-col ${"featured" in p && p.featured ? "lg:-mt-4 lg:pb-9" : ""}`}
              style={{ boxShadow: "featured" in p && p.featured ? "0 0 0 2px #1a73ff, 0 30px 70px rgba(26,115,255,.22)" : "0 1px 2px rgba(20,22,27,.04), 0 12px 36px rgba(20,22,27,.07)" }}>
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-black uppercase tracking-[.14em]" style={{ color: p.color }}>{p.name}</p>
                <span className="text-[10px] font-black tracking-widest uppercase rounded-full px-2.5 py-1" style={{ color: p.color, background: `${p.color}14` }}>{p.tag}</span>
              </div>
              <p className="mt-5 flex items-baseline gap-1"><span className="text-5xl font-black tracking-tight text-[#14161b]">{p.price}</span><span className="text-[14px] text-[#14161b]/45">{p.per}</span></p>
              <p className="mt-1 text-[12px] text-[#14161b]/45">{p.trial}</p>
              <Link href={p.href} className="mt-6 block">
                <span className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[14px] font-bold transition-transform hover:-translate-y-0.5"
                  style={"featured" in p && p.featured ? { background: "#1a73ff", color: "#fff", boxShadow: "0 10px 26px rgba(26,115,255,.4)" } : { background: "#f3f4f7", color: "#14161b" }}>
                  {p.cta} <ArrowRight size={15} strokeWidth={2.4} />
                </span>
              </Link>
              <ul className="mt-6 flex flex-col gap-3">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-[13.5px] leading-snug text-[#14161b]/72">
                    <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: `${p.color}14` }}><Check size={11} strokeWidth={3} style={{ color: p.color }} /></span>{f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 rounded-[28px] bg-white overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(20,22,27,.04), 0 12px 36px rgba(20,22,27,.07)" }}>
          <div className="grid grid-cols-[1fr_64px_64px_64px] sm:grid-cols-[1fr_96px_96px_96px] px-5 sm:px-7 py-4 text-[11px] font-black uppercase tracking-wider" style={{ background: "#f6f7f9", color: "#8a909b" }}>
            <span>Compare plans</span><span className="text-center">Free</span><span className="text-center" style={{ color: "#1a73ff" }}>Fan</span><span className="text-center" style={{ color: "#6d4fe0" }}>Pro</span>
          </div>
          {COMPARISON.map(([label, f, a, b], i) => (
            <div key={label} className="grid grid-cols-[1fr_64px_64px_64px] sm:grid-cols-[1fr_96px_96px_96px] items-center px-5 sm:px-7 py-3.5" style={{ borderTop: i ? "1px solid #eceef2" : undefined }}>
              <span className="text-[13.5px] text-[#14161b]/75">{label}</span>
              <span className="flex justify-center"><CheckIcon yes={f} /></span>
              <span className="flex justify-center"><CheckIcon yes={a} color="#1a73ff" /></span>
              <span className="flex justify-center"><CheckIcon yes={b} color="#6d4fe0" /></span>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-[12px] text-[#14161b]/40">Billed monthly. Cancel anytime from your account. Must be 21+ to use betting content.</p>
      </Container>
    </section>
  );
}
