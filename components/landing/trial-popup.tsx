"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Star, X, Flame } from "lucide-react";
import { useUser } from "@clerk/nextjs";

const STORAGE_KEY = "mlbedge_trial_popup_v1";

export function TrialPopup() {
  const { isSignedIn, isLoaded } = useUser();
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function goTo(href: string) {
    dismiss();
    router.push(href);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="trial-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[999] flex items-center justify-center backdrop-blur-md bg-black/60 px-4"
          onClick={dismiss}
        >
          <motion.div
            key="trial-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative w-full max-w-sm bg-[#0F1318] border border-[#FF7828]/20 rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors"
            >
              <X size={18} strokeWidth={2} />
            </button>

            {/* Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-11 h-11 rounded-2xl bg-[#FF7828]/15 flex items-center justify-center mb-4">
                <Flame size={22} className="text-[#FF7828]" strokeWidth={1.8} />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">Try Edge Pro free</h2>
              <p className="mt-1.5 text-sm text-white/40">No charge until trial ends. Card required.</p>
            </div>

            {/* Tier cards */}
            <div className="flex flex-col gap-3">
              {/* Fan */}
              <button
                onClick={() => goTo("/trial?tier=fan")}
                className="w-full text-left rounded-2xl border border-[#FF7828]/30 bg-[#FF7828]/[0.06] p-4 hover:bg-[#FF7828]/[0.12] transition-colors group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#FF7828]/20 flex items-center justify-center">
                      <Zap size={12} className="text-[#FF7828]" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-black text-[#FF7828] tracking-wide uppercase">Fan — 14-Day Free Trial</span>
                  </div>
                </div>
                <p className="text-xs text-white/40 mb-1">Props, Edge Report &amp; matchup analysis</p>
                <p className="text-xs font-bold text-white/25">$4.99/mo after</p>
              </button>

              {/* Pro */}
              <button
                onClick={() => goTo("/trial?tier=pro")}
                className="w-full text-left rounded-2xl border border-[#818CF8]/30 bg-[#818CF8]/[0.06] p-4 hover:bg-[#818CF8]/[0.12] transition-colors group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#818CF8]/20 flex items-center justify-center">
                      <Star size={12} className="text-[#818CF8]" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-black text-[#818CF8] tracking-wide uppercase">Pro — 3-Day Free Trial</span>
                  </div>
                </div>
                <p className="text-xs text-white/40 mb-1">Spray charts, barrel rate &amp; daily picks</p>
                <p className="text-xs font-bold text-white/25">$14.99/mo after</p>
              </button>
            </div>

            {/* Dismiss */}
            <button
              onClick={dismiss}
              className="w-full mt-4 text-xs text-white/25 hover:text-white/50 transition-colors text-center"
            >
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
