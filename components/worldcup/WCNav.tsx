"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, LayoutGrid, Trophy, Gamepad2, BarChart3, Cpu, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/worldcup",          label: "Hub",      emoji: "🌐", icon: Globe },
  { href: "/worldcup/groups",   label: "Groups",   emoji: null, icon: LayoutGrid },
  { href: "/worldcup/bracket",  label: "Bracket",  emoji: "🏆", icon: Trophy },
  { href: "/worldcup/games",    label: "Games",    emoji: "⚽", icon: Gamepad2 },
  { href: "/worldcup/analysis", label: "Analysis", emoji: "📊", icon: BarChart3 },
  { href: "/worldcup/ai-sim",   label: "AI Sim",   emoji: "⬡",  icon: Cpu },
];

export function WCNav() {
  const pathname = usePathname();

  return (
    <div
      className="flex items-center justify-between gap-4 px-5 py-3 rounded-[var(--r-card)]"
      style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}
    >
      {/* Left: logo + divider + tabs */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Logo */}
        <div className="shrink-0 flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--grad-gold)" }}
          >
            <Trophy size={14} style={{ color: "#0a0a0a" }} />
          </div>
          <div className="hidden sm:block">
            <p className="font-spot-sans text-[11px] font-black leading-none" style={{ color: "var(--text)" }}>MLB Edge Pro</p>
            <p className="font-spot-sans text-[9px] leading-none mt-0.5" style={{ color: "var(--gold-2)" }}>World Cup 2026</p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-6 shrink-0" style={{ background: "var(--hairline)" }} />

        {/* Tab pills */}
        <nav className="flex items-center gap-1 overflow-x-auto">
          {NAV_ITEMS.map(({ href, label, emoji }) => {
            const active = pathname === href || (href !== "/worldcup" && pathname.startsWith(href));
            return (
              <Link key={href} href={href} className="shrink-0">
                <motion.div
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-chip)] text-xs font-bold transition-colors"
                  style={
                    active
                      ? { background: "var(--grad-gold)", color: "#0a0a0a" }
                      : { color: "rgba(255,255,255,.45)" }
                  }
                  whileHover={!active ? { color: "rgba(255,255,255,.75)" } : undefined}
                  whileTap={{ scale: 0.96 }}
                >
                  {emoji && <span className="text-[11px]">{emoji}</span>}
                  <span className="font-spot-sans">{label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: back link */}
      <Link
        href="/games"
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-chip)] font-spot-sans text-xs font-bold transition-colors"
        style={{ color: "rgba(255,255,255,.45)", border: "1px solid var(--hairline)" }}
      >
        <ArrowLeft size={11} strokeWidth={2.5} />
        <span className="hidden sm:inline">Back to MLB Edge Pro</span>
        <span className="sm:hidden">MLB</span>
      </Link>
    </div>
  );
}
