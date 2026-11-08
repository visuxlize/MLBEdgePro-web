"use client";

import { motion } from "framer-motion";
import { UserPlus, CircleDot, Zap } from "lucide-react";
import { Container } from "./container";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create your free account",
    description: "Sign up in seconds with email. No credit card, no commitment. You're instantly on the free plan.",
  },
  {
    number: "02",
    icon: CircleDot,
    title: "See today's full slate",
    description: "Every NBA, NFL and soccer game with live scores, live trackers and model win probabilities — completely free, every day.",
  },
  {
    number: "03",
    icon: Zap,
    title: "Upgrade for the full edge",
    description: "Unlock real DraftKings prop lines, line movement and model projections for $4.99/month. Cancel anytime.",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#14161b]/[.09] bg-[#14161b]/[0.04] px-4 py-1.5 text-xs font-semibold text-[#14161b]/64 tracking-wider uppercase">
            How It Works
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-center text-[#14161b]"
        >
          Up and running in 60 seconds
        </motion.h2>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-10 left-[calc(33%-12px)] right-[calc(33%-12px)] h-px bg-[#14161b]/[0.06]" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                className="flex flex-col items-center text-center"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl border border-[#1a73ff]/25 bg-[#1a73ff]/[0.08] flex items-center justify-center">
                    <Icon size={28} className="text-[#1a73ff]" strokeWidth={1.6} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full border border-[#1a73ff]/40 bg-background flex items-center justify-center">
                    <span className="text-[9px] font-black text-[#1a73ff]">{step.number}</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[#14161b] mb-2">{step.title}</h3>
                <p className="text-sm text-[#14161b]/56 leading-relaxed max-w-[260px]">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
