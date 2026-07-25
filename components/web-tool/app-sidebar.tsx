"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  CircleDot, BarChart3, TrendingUp, Target,
  Settings, Lock, Menu, X, Zap, LogOut, ChevronRight, Bot, Home as HomeIcon,
} from "lucide-react";
import { useSubscription } from "@/lib/subscription";
import { motion, AnimatePresence } from "framer-motion";

const MLB_NAV = [
  { href: "/games",        icon: CircleDot,  label: "Today's Games", requiredTier: null           },
  { href: "/scores",       icon: BarChart3,  label: "Live Scores",   requiredTier: null           },
  { href: "/analysis",     icon: TrendingUp, label: "Analysis",      requiredTier: "fan" as const },
  { href: "/hr-deep-dive", icon: Target,     label: "HR Nuke",       requiredTier: "pro" as const },
  { href: "/ai",           icon: Bot,        label: "Edge AI",       requiredTier: "pro" as const },
];

function DiamondLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
      <path d="M14 2L4 10l10 16 10-16L14 2z" stroke="#FF7828" strokeWidth="1.8" strokeLinejoin="round" fill="rgba(255,120,40,0.12)" />
      <path d="M4 10h20M14 2l-5 8h10L14 2z" stroke="#FF7828" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function BaseballIcon({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6 6c2 2.5 2 9.5 0 12M18 6c-2 2.5-2 9.5 0 12" />
    </svg>
  );
}

function FootballIcon({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7">
      <ellipse cx="12" cy="12" rx="9.2" ry="5.6" transform="rotate(-45 12 12)" />
      <path d="M9.2 14.8l5.6-5.6M10.5 11.7l1.2 1.2M12.3 9.9l1.2 1.2" />
    </svg>
  );
}

function BasketballIcon({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v17M3.5 12h17M5.2 5.2c2.4 2.2 3.8 4.4 3.8 6.8s-1.4 4.6-3.8 6.8M18.8 5.2c-2.4 2.2-3.8 4.4-3.8 6.8s1.4 4.6 3.8 6.8" />
    </svg>
  );
}

type Sport = "mlb" | "nfl" | "wnba";

function SportPill({ sport }: { sport: Sport }) {
  const router = useRouter();
  const tabs: { key: Sport; href: string; label: string; icon: (p: { size?: number }) => React.JSX.Element; gradient: string; textCls: string }[] = [
    { key: "mlb",  href: "/games", label: "MLB",  icon: BaseballIcon,   gradient: "from-[#f97316] to-[#fb923c]", textCls: "text-white" },
    { key: "nfl",  href: "/nfl",   label: "NFL",  icon: FootballIcon,   gradient: "from-[#f97316] to-[#fb923c]", textCls: "text-white" },
    { key: "wnba", href: "/wnba",  label: "WNBA", icon: BasketballIcon, gradient: "from-[#2dd4bf] to-[#5eead4]", textCls: "text-[#06070d]" },
  ];
  return (
    <div className="flex items-center p-[3px] rounded-full border border-white/[0.08] bg-white/[0.03]">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = sport === t.key;
        return (
          <button
            key={t.key}
            onClick={() => router.push(t.href)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-[5px] text-[11px] font-black tracking-wide transition-colors ${
              active ? `bg-gradient-to-br ${t.gradient} ${t.textCls}` : "text-white/40 hover:text-white/70"
            }`}
          >
            <Icon /> {t.label}
          </button>
        );
      })}
    </div>
  );
}

const HOME_ITEM = { href: "/home", icon: HomeIcon, label: "Home", requiredTier: null as null };

function nflNav(isSuperPro: boolean) {
  return [
    { href: "/nfl", icon: CircleDot, label: "This Week", requiredTier: null as null },
    ...(isSuperPro ? [{ href: "/nfl/props", icon: Target, label: "Props", requiredTier: null as null }] : []),
  ];
}

const WNBA_NAV = [
  { href: "/wnba",        icon: CircleDot, label: "Today",  requiredTier: null as null },
  { href: "/wnba/props",  icon: Target,    label: "Props",  requiredTier: "fan" as const },
  { href: "/wnba/impact", icon: BarChart3, label: "Impact", requiredTier: "pro" as const },
];

export function AppSidebar() {
  const pathname     = usePathname();
  const { isPro, isSuperPro } = useSubscription();
  const { user }     = useUser();
  const { signOut }  = useClerk();
  const [open, setOpen] = useState(false);

  const sport: Sport = pathname.startsWith("/wnba") ? "wnba" : pathname.startsWith("/nfl") ? "nfl" : "mlb";
  const sportLabel = sport === "wnba" ? "WNBA" : sport === "nfl" ? "NFL" : "MLB";
  const navItems = [
    HOME_ITEM,
    ...(sport === "wnba" ? WNBA_NAV : sport === "nfl" ? nflNav(isSuperPro) : MLB_NAV),
  ];

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

        {/* Logo → /home + sport pill */}
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <Link href="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
            <DiamondLogo />
            <span className="text-[15px] font-bold text-white font-display tracking-wide hidden md:inline">
              {sportLabel} Edge<span className="text-[#FF7828]"> Pro</span>
            </span>
          </Link>
          <div className="hidden sm:flex">
            <SportPill sport={sport} />
          </div>
        </div>

        {/* Desktop center nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navItems.map(({ href, icon: Icon, label, requiredTier }) => {
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
          {(sport === "nfl" || sport === "wnba") && (
            <span className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white/25 cursor-default">
              <Bot size={14} strokeWidth={1.7} />
              <span>Edge AI</span>
              <Lock size={9} className="text-white/15" strokeWidth={2} />
            </span>
          )}
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
              <img src={user.imageUrl} alt="" className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
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
                <Link href="/home" onClick={() => setOpen(false)} className="flex items-center gap-2">
                  <DiamondLogo />
                  <span className="text-[15px] font-bold text-white font-display tracking-wide">{sportLabel} Edge<span className="text-[#FF7828]"> Pro</span></span>
                </Link>
                <button onClick={() => setOpen(false)} className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors">
                  <X size={20} strokeWidth={1.8} />
                </button>
              </div>

              {/* Sport pill */}
              <div className="px-5 pt-4">
                <SportPill sport={sport} />
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
                {navItems.map(({ href, icon: Icon, label, requiredTier }) => {
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
                {(sport === "nfl" || sport === "wnba") && (
                  <span className="flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-white/25 cursor-default">
                    <Bot size={18} strokeWidth={1.7} />
                    <span className="flex-1">Edge AI</span>
                    <Lock size={12} className="text-white/15" strokeWidth={2} />
                  </span>
                )}
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
