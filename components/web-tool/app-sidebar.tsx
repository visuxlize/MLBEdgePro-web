"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  CircleDot, BarChart3, Layers, Target, LayoutGrid, Users, ListOrdered,
  Settings, Lock, Menu, X, Zap, LogOut, ChevronRight, Bot, Home as HomeIcon,
  Trophy, Grid2x2,
} from "lucide-react";
import { useSubscription } from "@/lib/subscription";
import { getSeasonInfo, type SportKey } from "@/lib/season";
import { motion, AnimatePresence } from "framer-motion";

/* ── Icons ───────────────────────────────────────────────────────────────── */

function DiamondLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
      <path d="M14 2L4 10l10 16 10-16L14 2z" stroke="#FF7828" strokeWidth="1.8" strokeLinejoin="round" fill="rgba(255,120,40,0.12)" />
      <path d="M4 10h20M14 2l-5 8h10L14 2z" stroke="#FF7828" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
type IconProps = { size?: number };
const svgProps = (size: number) => ({ viewBox: "0 0 24 24", width: size, height: size, fill: "none", stroke: "currentColor", strokeWidth: 1.7 });
function BaseballIcon({ size = 12 }: IconProps) { return (<svg {...svgProps(size)}><circle cx="12" cy="12" r="8.5" /><path d="M6 6c2 2.5 2 9.5 0 12M18 6c-2 2.5-2 9.5 0 12" /></svg>); }
function FootballIcon({ size = 12 }: IconProps) { return (<svg {...svgProps(size)}><ellipse cx="12" cy="12" rx="9.2" ry="5.6" transform="rotate(-45 12 12)" /><path d="M9.2 14.8l5.6-5.6M10.5 11.7l1.2 1.2M12.3 9.9l1.2 1.2" /></svg>); }
function BasketballIcon({ size = 12 }: IconProps) { return (<svg {...svgProps(size)}><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v17M3.5 12h17M5.2 5.2c2.4 2.2 3.8 4.4 3.8 6.8s-1.4 4.6-3.8 6.8M18.8 5.2c-2.4 2.2-3.8 4.4-3.8 6.8s1.4 4.6 3.8 6.8" /></svg>); }
function SoccerIcon({ size = 12 }: IconProps) { return (<svg {...svgProps(size)}><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5l2.5 3.5-2.5 1.5-2.5-1.5L12 3.5zM12 20.5l-2.5-3.5 2.5-1.5 2.5 1.5L12 20.5zM3.5 12l3.5-2.5L8.5 12l-1.5 2.5L3.5 12zM20.5 12l-3.5 2.5L15.5 12l1.5-2.5L20.5 12z" /></svg>); }

/* ── Sports registry ─────────────────────────────────────────────────────── */

interface SportDef {
  key: SportKey; href: string; label: string; icon: (p: IconProps) => React.JSX.Element;
  gradient: string; textCls: string; accent: string;
}
const SPORTS: SportDef[] = [
  { key: "nba",    href: "/nba",    label: "NBA",    icon: BasketballIcon, gradient: "from-[#fb923c] to-[#fdba74]", textCls: "text-[#06070d]", accent: "#fb923c" },
  { key: "nfl",    href: "/nfl",    label: "NFL",    icon: FootballIcon,   gradient: "from-[#7c5cfa] to-[#a78bfa]", textCls: "text-white",     accent: "#a78bfa" },
  { key: "soccer", href: "/soccer", label: "Soccer", icon: SoccerIcon,     gradient: "from-[#34d399] to-[#6ee7b7]", textCls: "text-[#06070d]", accent: "#34d399" },
  { key: "mlb",    href: "/games",  label: "MLB",    icon: BaseballIcon,   gradient: "from-[#f97316] to-[#fb923c]", textCls: "text-white",     accent: "#f97316" },
  { key: "wnba",   href: "/wnba",   label: "WNBA",   icon: BasketballIcon, gradient: "from-[#2dd4bf] to-[#5eead4]", textCls: "text-[#06070d]", accent: "#2dd4bf" },
];
const ACTIVE_SPORTS = SPORTS.filter((s) => getSeasonInfo(s.key).status === "in-season");
const OFF_SPORTS = SPORTS.filter((s) => getSeasonInfo(s.key).status === "offseason");

function SportPill({ sport }: { sport: SportKey }) {
  const router = useRouter();
  return (
    <div className="flex items-center p-[3px] rounded-full border border-white/[0.08] bg-white/[0.03]">
      {ACTIVE_SPORTS.map((t) => {
        const Icon = t.icon;
        const active = sport === t.key;
        return (
          <button
            key={t.key}
            onClick={() => router.push(t.href)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-[5px] text-[11px] font-black tracking-wide transition-colors ${
              active ? `bg-gradient-to-br ${t.gradient} ${t.textCls}` : "text-white/45 hover:text-white/80"
            }`}
          >
            <Icon /> {t.label}
          </button>
        );
      })}
      {OFF_SPORTS.length > 0 && <span className="mx-1 h-4 w-px bg-white/10" />}
      {OFF_SPORTS.map((t) => {
        const Icon = t.icon;
        const active = sport === t.key;
        return (
          <button
            key={t.key}
            onClick={() => router.push(t.href)}
            title={`${t.label} · Offseason`}
            aria-label={`${t.label} (offseason)`}
            className={`relative inline-flex items-center justify-center rounded-full w-7 h-[26px] transition-colors ${
              active ? "bg-white/15 text-white" : "text-white/25 hover:text-white/60"
            }`}
          >
            <Icon size={13} />
          </button>
        );
      })}
    </div>
  );
}

/* ── Nav definitions ─────────────────────────────────────────────────────── */

type NavItem = { href: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; label: string; requiredTier: "fan" | "pro" | null };

const HOME_ITEM: NavItem = { href: "/home", icon: HomeIcon, label: "Home", requiredTier: null };

const NAV: Record<SportKey, NavItem[]> = {
  nba: [
    { href: "/nba",           icon: CircleDot,   label: "Today",     requiredTier: null },
    { href: "/nba/standings", icon: ListOrdered, label: "Standings", requiredTier: null },
    { href: "/nba/cup",       icon: Trophy,      label: "Cup",       requiredTier: null },
    { href: "/nba/props",     icon: Target,      label: "Props",     requiredTier: "fan" },
  ],
  nfl: [
    { href: "/nfl",           icon: CircleDot,   label: "Games",     requiredTier: null },
    { href: "/nfl/standings", icon: ListOrdered, label: "Standings", requiredTier: null },
    { href: "/nfl/players",   icon: Users,       label: "Players",   requiredTier: null },
    { href: "/nfl/props",     icon: Target,      label: "Props",     requiredTier: "fan" },
  ],
  soccer: [
    { href: "/soccer",         icon: CircleDot,  label: "Matches", requiredTier: null },
    { href: "/soccer/leagues", icon: LayoutGrid, label: "Leagues", requiredTier: null },
    { href: "/soccer/props",   icon: Layers,     label: "Props",   requiredTier: "fan" },
  ],
  mlb: [
    { href: "/games",        icon: CircleDot, label: "Season",  requiredTier: null },
    { href: "/scores",       icon: BarChart3, label: "Scores",  requiredTier: null },
    { href: "/props",        icon: Layers,    label: "Props",   requiredTier: null },
    { href: "/hr-deep-dive", icon: Target,    label: "HR Nuke", requiredTier: "pro" },
    { href: "/ai",           icon: Bot,       label: "Edge AI", requiredTier: "pro" },
  ],
  wnba: [
    { href: "/wnba",        icon: CircleDot, label: "Season", requiredTier: null },
    { href: "/wnba/props",  icon: Target,    label: "Props",  requiredTier: "fan" },
    { href: "/wnba/impact", icon: BarChart3, label: "Impact", requiredTier: "pro" },
  ],
};

const SPORT_ROOTS = new Set(["/nba", "/nfl", "/soccer", "/wnba", "/home"]);
function isActive(pathname: string, href: string) {
  return SPORT_ROOTS.has(href) ? pathname === href || (href !== "/home" && pathname.startsWith(`${href}/game`)) : pathname.startsWith(href);
}

function detectSport(pathname: string): SportKey {
  if (pathname.startsWith("/nba")) return "nba";
  if (pathname.startsWith("/soccer")) return "soccer";
  if (pathname.startsWith("/wnba")) return "wnba";
  if (pathname.startsWith("/nfl")) return "nfl";
  if (pathname.startsWith("/home") || pathname.startsWith("/settings")) return "nba";
  return "mlb";
}

/* ── Main component ──────────────────────────────────────────────────────── */

export function AppSidebar() {
  const pathname = usePathname();
  const { isPro, isSuperPro } = useSubscription();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);

  const sport = detectSport(pathname);
  const sportDef = SPORTS.find((s) => s.key === sport)!;
  const navItems: NavItem[] = [HOME_ITEM, ...NAV[sport]];
  const showAi = sport === "nba" || sport === "nfl" || sport === "wnba" || sport === "soccer";

  function isLocked(requiredTier: "fan" | "pro" | null): boolean {
    if (!requiredTier) return false;
    return requiredTier === "fan" ? !isPro : !isSuperPro;
  }
  const tierColor = isSuperPro ? "#818cf8" : isPro ? "#FF7828" : null;
  const tierLabel = isSuperPro ? "Pro" : isPro ? "Fan" : null;
  const activeColor = (item: NavItem) => (item.requiredTier === "pro" ? "#818cf8" : sportDef.accent);

  return (
    <>
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header
        className="h-14 flex items-center justify-between gap-2 border-b border-white/[0.06] bg-[#0A0E14]/95 backdrop-blur-xl sticky top-0 z-40 page-pad"
      >
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <Link href="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
            <DiamondLogo />
            <span className="text-[15px] font-bold text-white font-display tracking-wide hidden md:inline">
              Edge<span className="text-[#FF7828]"> Pro</span>
            </span>
          </Link>
          <div className="hidden sm:flex"><SportPill sport={sport} /></div>
          <span className="sm:hidden font-display font-bold text-[15px] text-white flex items-center gap-1.5">
            <span style={{ color: sportDef.accent }}><sportDef.icon size={15} /></span>{sportDef.label}
          </span>
        </div>

        {/* Desktop center nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navItems.map((item) => {
            const { href, icon: Icon, label, requiredTier } = item;
            const active = isActive(pathname, href);
            const color = activeColor(item);
            return (
              <Link
                key={href} href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${active ? "" : "text-white/40 hover:text-white hover:bg-white/[0.05]"}`}
                style={active ? { background: `${color}1f`, color } : undefined}
              >
                <Icon size={14} strokeWidth={active ? 2.2 : 1.7} />
                <span>{label}</span>
                {isLocked(requiredTier) && <Lock size={9} className="text-white/20" strokeWidth={2} />}
              </Link>
            );
          })}
          {showAi && (
            <span className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white/25 cursor-default">
              <Bot size={14} strokeWidth={1.7} /><span>Edge AI</span><Lock size={9} className="text-white/15" strokeWidth={2} />
            </span>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {!isSuperPro && (
            <Link
              href={isPro ? "/upgrade?tier=pro" : "/upgrade?tier=fan"}
              className={`hidden md:flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${
                isPro ? "border-[#818cf8]/30 bg-[#818cf8]/10 text-[#818cf8] hover:bg-[#818cf8]/15" : "border-[#FF7828]/30 bg-[#FF7828]/10 text-[#FF7828] hover:bg-[#FF7828]/15"
              }`}
            >
              {isPro ? "Upgrade to Pro" : "Go Fan"}
            </Link>
          )}
          <Link href="/settings" aria-label="Settings"
            className={`hidden sm:flex w-9 h-9 rounded-xl items-center justify-center transition-colors ${pathname.startsWith("/settings") ? "bg-[#FF7828]/12 text-[#FF7828]" : "text-white/35 hover:text-white hover:bg-white/[0.06]"}`}>
            <Settings size={17} strokeWidth={1.7} />
          </Link>
          <Link href="/settings" aria-label="Account settings"
            className="hidden sm:flex h-9 w-9 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04] transition hover:border-white/15">
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.imageUrl} alt="" className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-black text-white/45">
                {user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "M"}
              </span>
            )}
          </Link>
          <button onClick={() => setOpen(true)} aria-label="Open menu"
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors">
            <Menu size={20} strokeWidth={1.8} />
          </button>
        </div>
      </header>

      {/* ── Side rail — inner display of a foldable / small tablets (640–1023) ─── */}
      <nav
        aria-label="Primary"
        className="hidden sm:flex lg:hidden fixed left-0 top-14 bottom-0 z-30 w-[76px] flex-col items-center gap-1 py-3 border-r border-white/[0.06] bg-[#0A0E14]/95 backdrop-blur-xl"
        style={{ paddingLeft: "env(safe-area-inset-left)" }}
      >
        {navItems.map((item) => {
          const { href, icon: Icon, label, requiredTier } = item;
          const active = isActive(pathname, href);
          const color = activeColor(item);
          return (
            <Link key={href} href={href} className="press relative w-[64px] flex flex-col items-center gap-1 rounded-2xl py-2.5" style={{ color: active ? color : "rgba(255,255,255,.4)" }}>
              {active && <motion.span layoutId="rail-pill" className="absolute inset-0 rounded-2xl" style={{ background: `${color}1f` }} transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span className="relative"><Icon size={19} strokeWidth={active ? 2.2 : 1.7} />{isLocked(requiredTier) && <Lock size={8} className="absolute -top-1 -right-2 text-white/30" />}</span>
              <span className="relative text-[10px] font-bold tracking-wide">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom tab bar — closed fold / phones (< 640) ───────────────────── */}
      <nav
        aria-label="Primary"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.07] bg-[#0A0E14]/95 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)", paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}
      >
        <div className="flex items-stretch justify-around h-[62px] px-1">
          {[HOME_ITEM, ...NAV[sport].slice(0, 3)].map((item) => {
            const { href, icon: Icon, label, requiredTier } = item;
            const active = isActive(pathname, href);
            const color = activeColor(item);
            return (
              <Link key={href} href={href} className="press relative flex-1 flex flex-col items-center justify-center gap-1" style={{ color: active ? color : "rgba(255,255,255,.4)" }}>
                {active && <motion.span layoutId="tab-pill" className="absolute top-1.5 h-[30px] w-14 rounded-full" style={{ background: `${color}22` }} transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <span className="relative h-[30px] flex items-center"><Icon size={19} strokeWidth={active ? 2.2 : 1.7} />{isLocked(requiredTier) && <Lock size={8} className="absolute -top-0.5 -right-2 text-white/30" />}</span>
                <span className="text-[10px] font-bold tracking-wide -mt-1">{label}</span>
              </Link>
            );
          })}
          <button onClick={() => setSheet(true)} className="press flex-1 flex flex-col items-center justify-center gap-1 text-white/40" aria-label="Switch sport">
            <span className="h-[30px] flex items-center"><Grid2x2 size={19} strokeWidth={1.7} /></span>
            <span className="text-[10px] font-bold tracking-wide -mt-1">Sports</span>
          </button>
        </div>
      </nav>

      {/* ── Sport switcher sheet (phones) ───────────────────────────────────── */}
      <AnimatePresence>
        {sheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setSheet(false)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[28px] border-t border-white/[0.08] bg-[#0b0d15] px-5 pt-3 pb-6"
              style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-white/35 mb-3">Choose a sport</p>
              <div className="grid grid-cols-2 gap-2.5">
                {SPORTS.map((s) => {
                  const info = getSeasonInfo(s.key);
                  const Icon = s.icon;
                  const off = info.status === "offseason";
                  return (
                    <Link key={s.key} href={s.href} onClick={() => setSheet(false)}
                      className="press relative flex items-center gap-3 rounded-2xl p-3.5"
                      style={{ background: sport === s.key ? `${s.accent}1f` : "rgba(255,255,255,.04)", border: `1px solid ${sport === s.key ? `${s.accent}66` : "rgba(255,255,255,.07)"}`, opacity: off ? 0.62 : 1 }}>
                      <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.accent}22`, color: s.accent }}><Icon size={20} /></span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-black text-white">{s.label}</span>
                        <span className="block text-[10px] font-bold" style={{ color: off ? "rgba(255,255,255,.4)" : s.accent }}>{info.chip}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Drawer (settings / account) ─────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[min(300px,86vw)] bg-[#0A0E14] border-l border-white/[0.07] flex flex-col overflow-y-auto"
              style={{ paddingRight: "env(safe-area-inset-right)", paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="flex items-center justify-between px-5 h-14 border-b border-white/[0.06] shrink-0">
                <Link href="/home" onClick={() => setOpen(false)} className="flex items-center gap-2">
                  <DiamondLogo />
                  <span className="text-[15px] font-bold text-white font-display tracking-wide">Edge<span className="text-[#FF7828]"> Pro</span></span>
                </Link>
                <button onClick={() => setOpen(false)} aria-label="Close menu" className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors">
                  <X size={20} strokeWidth={1.8} />
                </button>
              </div>

              <div className="px-5 pt-4"><SportPill sport={sport} /></div>

              {user && (
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.04] shrink-0">
                      {user.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-sm font-black text-white/45">{user.firstName?.[0] ?? "M"}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{user.firstName ?? user.emailAddresses?.[0]?.emailAddress ?? "User"}</p>
                      {tierLabel && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full border" style={{ color: tierColor!, borderColor: `${tierColor}35`, backgroundColor: `${tierColor}15` }}>{tierLabel} Plan</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                  const { href, icon: Icon, label, requiredTier } = item;
                  const active = isActive(pathname, href);
                  const color = activeColor(item);
                  const locked = isLocked(requiredTier);
                  return (
                    <Link key={href} href={href} onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-colors ${active ? "" : "text-white/50 hover:text-white hover:bg-white/[0.05]"}`}
                      style={active ? { background: `${color}1f`, color } : undefined}>
                      <Icon size={18} strokeWidth={active ? 2.2 : 1.7} />
                      <span className="flex-1">{label}</span>
                      {locked ? <Lock size={12} className="text-white/20" strokeWidth={2} /> : <ChevronRight size={14} className="text-white/15" strokeWidth={1.5} />}
                    </Link>
                  );
                })}
                {showAi && (
                  <span className="flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-white/25 cursor-default">
                    <Bot size={18} strokeWidth={1.7} /><span className="flex-1">Edge AI</span><Lock size={12} className="text-white/15" strokeWidth={2} />
                  </span>
                )}
              </nav>

              <div className="px-3 pb-6 space-y-2 border-t border-white/[0.06] pt-4 shrink-0">
                {!isSuperPro && (
                  <Link href={isPro ? "/upgrade?tier=pro" : "/upgrade?tier=fan"} onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl font-bold text-sm transition-colors"
                    style={{ backgroundColor: isPro ? "#818cf820" : "#FF782815", color: isPro ? "#818cf8" : "#FF7828", border: `1px solid ${isPro ? "#818cf830" : "#FF782830"}` }}>
                    <Zap size={14} strokeWidth={2.5} />{isPro ? "Upgrade to Pro" : "Go Fan — $4.99/mo"}
                  </Link>
                )}
                <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white/50 hover:text-white hover:bg-white/[0.05] transition-colors font-medium">
                  <Settings size={18} strokeWidth={1.7} /><span>Settings</span>
                </Link>
                <button onClick={() => { setOpen(false); signOut({ redirectUrl: "/" }); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[#EB505A]/70 hover:text-[#EB505A] hover:bg-[#EB505A]/[0.05] transition-colors font-medium">
                  <LogOut size={18} strokeWidth={1.7} /><span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
