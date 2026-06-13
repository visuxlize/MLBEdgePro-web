"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Map, BarChart3, Users, Globe, ArrowLeft, LayoutGrid, Ticket } from "lucide-react";

const NAV_ITEMS = [
  { href: "/worldcup",         label: "Hub",      icon: Globe },
  { href: "/worldcup/groups",  label: "Groups",   icon: LayoutGrid },
  { href: "/worldcup/bracket", label: "Bracket",  icon: Trophy },
  { href: "/worldcup/map",     label: "Map",      icon: Map },
  { href: "/worldcup/props",   label: "Betting",  icon: BarChart3 },
  { href: "/worldcup/h2h",     label: "Analysis",  icon: Users },
  { href: "/worldcup/slips",   label: "Slips",    icon: Ticket },
];

export function WorldCupNav() {
  const pathname = usePathname();

  return (
    <div className="space-y-3">
      <Link
        href="/games"
        className="inline-flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3 py-2 text-xs font-bold text-white/75 hover:text-white hover:border-white/[0.15] transition-colors"
      >
        <ArrowLeft size={13} strokeWidth={2.4} />
        Back to MLBEdgePro
      </Link>
      <nav className="flex items-center gap-1 rounded-2xl border border-white/[0.07] bg-[#0D1420]/80 backdrop-blur-md p-1.5 overflow-x-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/worldcup" && pathname.startsWith(href));

          return (
            <Link key={href} href={href} className="relative shrink-0">
              <motion.div
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors relative ${
                  active ? "text-white" : "text-white/40 hover:text-white/70"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {active && (
                  <motion.div
                    layoutId="wc-nav-pill"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.12), rgba(56,189,248,0.08))" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={13} strokeWidth={active ? 2.5 : 2} className={active ? "text-[#FBBF24]" : ""} />
                <span className="relative">{label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
