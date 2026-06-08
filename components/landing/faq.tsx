"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { Container } from "./container";

const FAQ = [
  {
    q: "Is the free plan really free?",
    a: "Yes — completely free forever. You get full game schedules, live scores, win predictions, and weather conditions every day with no credit card required.",
  },
  {
    q: "What does Edge Pro include?",
    a: "Edge Pro ($4.99/month) unlocks the full analytical suite: HR/Hit/2+ Hit props with Hot and Due badges powered by our HR Nuke model, pitcher strikeout projections, 1st Inning Over/Under predictions, Moneyline picks, the Edge Report (AI-ranked value bets), full batter vs pitcher matchup analysis, and the Prop Builder for building and saving multi-leg slips.",
  },
  {
    q: "What is the Props Dashboard?",
    a: "The Props Dashboard is an Edge Pro feature that auto-generates ready-to-use bet slips for the day — 2-leg, 3-leg, 4-leg, and 5-leg parlays in both Safe and Long Shot tiers. Each slip is built by the model based on today's games and can be saved directly to your Bet Tracker with one tap.",
  },
  {
    q: "What are the 'Hot' and 'Due' badges on HR props?",
    a: "'Hot' means the model rates that player's HR matchup as particularly strong today — high probability based on batter power, pitcher vulnerability, park factors, and weather. 'Due' means the player's recent drought + historical pace suggest they're statistically overdue for a home run. Use both signals together for the highest-confidence spots.",
  },
  {
    q: "What is the 1st Inning Over/Under?",
    a: "The 1st Inning O/U predicts whether a game will see at least 1 run scored in the first inning (Over 0.5). The model weighs the starting pitcher's 1st-inning ERA and strand rate against the opposing leadoff lineup's on-base ability. It's a fast-resolving prop popular for live betting.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your account settings at any time. Your Pro access continues until the end of your billing period.",
  },
  {
    q: "Is the web app the same as the mobile app?",
    a: "The web app has the same core analysis engine and data. The iOS app is available — download it from the Download page for the full mobile experience including push notifications and offline access.",
  },
  {
    q: "How accurate are the predictions?",
    a: "Win predictions and prop probabilities are model estimates based on 2025 season stats, pitcher matchup data, and weather. They're designed for educational use and to inform your research — not as guaranteed picks.",
  },
  {
    q: "What data sources do you use?",
    a: "We use the official MLB Stats API for game data, lineups, and pitching stats. Weather data comes from OpenWeather's stadium-specific forecasts. Odds data is sourced from The Odds API.",
  },
];

export function LandingFaq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 sm:py-28">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/50 tracking-wider uppercase">
            FAQ
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-5 text-3xl sm:text-4xl font-black tracking-tight text-center text-white mb-12"
        >
          Frequently asked questions
        </motion.h2>

        <div className="max-w-2xl mx-auto space-y-2">
          {FAQ.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-xl border border-white/[0.07] bg-[#111622] overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm font-semibold text-white pr-4">{item.q}</span>
                <motion.div animate={{ rotate: open === i ? 45 : 0 }} transition={{ duration: 0.2 }}>
                  <Plus size={16} className="text-white/35 shrink-0" strokeWidth={2} />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                  >
                    <p className="px-6 pb-5 text-sm text-white/45 leading-relaxed border-t border-white/[0.05] pt-4">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
