"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { Container } from "./container";

const FAQ = [
  {
    q: "Is the free plan really free?",
    a: "Yes — completely free forever. You get every NBA, NFL and soccer schedule, live scores, live game trackers, standings and model win probabilities with no credit card required.",
  },
  {
    q: "What does the Fan plan include?",
    a: "Fan ($4.99/month) adds real DraftKings player-prop lines for the NBA, NFL and soccer, a model projection against each line, line movement since open, and betting lines compared with the model's spread and total.",
  },
  {
    q: "Where do the prop lines come from?",
    a: "Prop lines and prices come from DraftKings via ESPN's odds feed and update through the day. Lines usually post a day or two before a game; until then we show a clearly labelled season-average reference instead. Always confirm the number and price at your sportsbook.",
  },
  {
    q: "What is the live game tracker?",
    a: "Every live game gets a live analysis view: an NFL drive tracker with field position and first-down line, an NBA shot chart with scoring runs and a lead tracker, and a soccer timeline with live win probability — all updating automatically.",
  },
  {
    q: "What's the difference between Fan and Pro?",
    a: "Pro ($14.99/month) adds the WNBA Player Impact and MLB HR deep dives while those seasons are live, plus early access to new leagues and markets. The soccer match centre, live trackers and standings are free for everyone.",
  },
  {
    q: "Why are MLB and WNBA marked offseason?",
    a: "Both seasons are complete, so their live slates rest until the next season. You can still browse the season recap, and everything switches back on automatically when games return.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your account settings at any time. Your access continues until the end of your billing period.",
  },
  {
    q: "How accurate are the predictions?",
    a: "Win probabilities and projections are model estimates built from season scoring data, opponent strength, game totals and spreads. They are designed for entertainment and to inform your research — not guaranteed picks. Sports betting involves risk; must be 21+.",
  },
  {
    q: "What data sources do you use?",
    a: "Schedules, scores, standings, play-by-play and player stats come from ESPN. Sportsbook lines and prop prices come from DraftKings via ESPN.",
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
          <span className="inline-flex items-center gap-2 rounded-full border border-[#14161b]/[.09] bg-[#14161b]/[0.04] px-4 py-1.5 text-xs font-semibold text-[#14161b]/64 tracking-wider uppercase">
            FAQ
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-5 text-3xl sm:text-4xl font-black tracking-tight text-center text-[#14161b] mb-12"
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
              className="rounded-xl border border-[#14161b]/[.09] bg-[#ffffff] overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#14161b]/[0.02] transition-colors"
              >
                <span className="text-sm font-semibold text-[#14161b] pr-4">{item.q}</span>
                <motion.div animate={{ rotate: open === i ? 45 : 0 }} transition={{ duration: 0.2 }}>
                  <Plus size={16} className="text-[#14161b]/56 shrink-0" strokeWidth={2} />
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
                    <p className="px-6 pb-5 text-sm text-[#14161b]/56 leading-relaxed border-t border-[#14161b]/[.09] pt-4">
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
