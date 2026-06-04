"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  CircleDot, BarChart3, Layers, TrendingUp, Target,
  Settings, Lock, BookOpen, Menu, X, Zap, LogOut, ChevronRight,
} from "lucide-react";
import { useSubscription } from "@/lib/subscription";
import { motion, AnimatePresence } from "framer-motion";

const NAV = [
  { href: "/games",        icon: CircleDot,  label: "Today's Games", requiredTier: null           },
  { href: "/scores",       icon: BarChart3,  label: "Live Scores",   requiredTier: null           },
  { href: "/analysis",     icon: TrendingUp, label: "Edge Report",   requiredTier: "fan" as const },
  { href: "/props",        icon: Layers,     label: "Prop Builder",  requiredTier: "fan" as const },
  { href: "/hr-deep-dive", icon: Target,     label: "HR Nuke",       requiredTier: "pro" as const },
  { href: "/bet-tracker",  icon: BookOpen,   label: "Bet Tracker",   requiredTier: "pro" as const },
];

function DiamondLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
      <path d="M14 2L4 10l10 16 10-16L14 2z" stroke="#FF7828" strokeWidth="1.8" strokeLinejoin="round" fill="rgba(255,120,40,0.12)" />
      <path d="M4 10h20M14 2l-5 8h10L14 2z" stroke="#FF7828" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function AppSidebar() {
  const pathname     = usePathname();
  const { isPro, isSuperPro } = useSubscription();
  const { user }     = useUser();
  const { signOut }  = useClerk();
  const [open, setOpen] = useState(false);

  function isLocked(requiredTier: "fan" | "pro" | null): boolean {
    if (!requiredTier) return false;
    if (requiredTier === "fan") return !isPro;
    return !isSuperPro;
  }

  const tierColor   = isSuperPro ? "#818cf8" : isPro ? "#FF7828" : null;
  const tierLabel   = isSuperPro ? "Pro" : isPro ? "Fan" : null;

  return (
    <>
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="h-14 flex items-center justify-between px-4 sm:px-5 border-b border-white/[0.06] bg-[#0A0E14]/95 backdrop-blur-xl sticky top-0 z-40">

        {/* Logo → /games */}
        <Link href="/games" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
          <DiamondLogo />
          <span className="text-[15px] font-bold text-white">
            MLB Edge<span className="text-[#FF7828]"> Pro</span>
          </span>
        </Link>

        {/* Desktop center nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {NAV.map(({ href, icon: Icon, label, requiredTier }) => {
            const active      = pathname.startsWith(href);
            const locked      = isLocked(requiredTier);
            const isProFeature = requiredTier === "pro";
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? isProFeature
                      ? "bg-[#818cf8]/12 text-[#818cf8]"
                      : "bg-[#FF7828]/12 text-[#FF7828]"
                    : "text-white/40 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                <Icon size={14} strokeWidth={active ? 2.2 : 1.7} />
                <span>{label}</span>
                {locked && <Lock size={9} className="text-white/20" strokeWidth={2} />}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Upgrade pill — desktop only */}
          {!isSuperPro && (
            <Link
              href={isPro ? "/upgrade?tier=pro" : "/upgrade?tier=fan"}
              className={`hidden md:flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${
                isPro
                  ? "border-[#818cf8]/30 bg-[#818cf8]/10 text-[#818cf8] hover:bg-[#818cf8]/15"
                  : "border-[#FF7828]/30 bg-[#FF7828]/10 text-[#FF7828] hover:bg-[#FF7828]/15"
              }`}
            >
              {isPro ? "Upgrade to Pro" : "Go Fan"}
            </Link>
          )}

          {/* Settings — desktop */}
          <Link
            href="/settings"
            aria-label="Settings"
            className={`hidden sm:flex w-9 h-9 rounded-xl items-center justify-center transition-colors ${
              pathname.startsWith("/settings")
                ? "bg-[#FF7828]/12 text-[#FF7828]"
                : "text-white/35 hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <Settings size={17} strokeWidth={1.7} />
          </Link>

          {/* Avatar — desktop */}
          <Link
            href="/settings"
            aria-label="Account settings"
            className="hidden sm:flex h-9 w-9 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04] transition hover:border-white/15"
          >
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-black text-white/45">
                {user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "M"}
              </span>
            )}
          </Link>

          {/* Hamburger — mobile */}
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} strokeWidth={1.8} />
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[280px] bg-[#0A0E14] border-l border-white/[0.07] flex flex-col overflow-y-auto"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 h-14 border-b border-white/[0.06] shrink-0">
                <Link href="/games" onClick={() => setOpen(false)} className="flex items-center gap-2">
                  <DiamondLogo />
                  <span className="text-[15px] font-bold text-white">MLB Edge<span className="text-[#FF7828]"> Pro</span></span>
                </Link>
                <button onClick={() => setOpen(false)} className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors">
                  <X size={20} strokeWidth={1.8} />
                </button>
              </div>

              {/* User info */}
              {user && (
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.04] shrink-0">
                      {user.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-sm font-black text-white/45">
                          {user.firstName?.[0] ?? user.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "M"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {user.firstName ?? user.emailAddresses?.[0]?.emailAddress ?? "User"}
                      </p>
                      {tierLabel && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full border"
                          style={{ color: tierColor!, borderColor: `${tierColor}35`, backgroundColor: `${tierColor}15` }}>
                          {tierLabel} Plan
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Nav links */}
              <nav className="flex-1 px-3 py-4 space-y-1">
                {NAV.map(({ href, icon: Icon, label, requiredTier }) => {
                  const active      = pathname.startsWith(href);
                  const locked      = isLocked(requiredTier);
                  const isProFeature = requiredTier === "pro";
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-colors ${
                        active
                          ? isProFeature
                            ? "bg-[#818cf8]/12 text-[#818cf8]"
                            : "bg-[#FF7828]/12 text-[#FF7828]"
                          : "text-white/50 hover:text-white hover:bg-white/[0.05]"
                      }`}
                    >
                      <Icon size={18} strokeWidth={active ? 2.2 : 1.7} />
                      <span className="flex-1">{label}</span>
                      {locked && <Lock size={12} className="text-white/20" strokeWidth={2} />}
                      {!locked && <ChevronRight size={14} className="text-white/15" strokeWidth={1.5} />}
                    </Link>
                  );
                })}
              </nav>

              {/* Upgrade + Settings + Logout */}
              <div className="px-3 pb-6 space-y-2 border-t border-white/[0.06] pt-4 shrink-0">
                {/* Upgrade pill */}
                {!isSuperPro && (
                  <Link
                    href={isPro ? "/upgrade?tier=pro" : "/upgrade?tier=fan"}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl font-bold text-sm transition-colors"
                    style={{ backgroundColor: isPro ? "#818cf820" : "#FF782815", color: isPro ? "#818cf8" : "#FF7828", border: `1px solid ${isPro ? "#818cf830" : "#FF782830"}` }}
                  >
                    <Zap size={14} strokeWidth={2.5} />
                    {isPro ? "Upgrade to Pro" : "Go Fan — $4.99/mo"}
                  </Link>
                )}

                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white/50 hover:text-white hover:bg-white/[0.05] transition-colors font-medium"
                >
                  <Settings size={18} strokeWidth={1.7} />
                  <span>Settings</span>
                </Link>

                <button
                  onClick={() => { setOpen(false); signOut({ redirectUrl: "/" }); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[#EB505A]/70 hover:text-[#EB505A] hover:bg-[#EB505A]/[0.05] transition-colors font-medium"
                >
                  <LogOut size={18} strokeWidth={1.7} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
