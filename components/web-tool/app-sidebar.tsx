"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  CircleDot, BarChart3, Layers, Target, LayoutGrid, Users, ListOrdered,
  Settings, Lock, Menu, X, Zap, LogOut, ChevronRight, Home as HomeIcon,
  Trophy, Grid2x2,
} from "lucide-react";
import { useSubscription } from "@/lib/subscription";
import { getSeasonInfo, type SportKey } from "@/lib/season";
import { motion, AnimatePresence } from "framer-motion";

const BLUE = "#1a73ff";
const INK = "#14161b";

/* ── Icons ───────────────────────────────────────────────────────────────── */

function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="10" fill={INK} />
      <path d="M16 6.5l8 5.8-3 9.4h-10l-3-9.4 8-5.8z" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M16 6.5v5.2M24 12.3l-5 1.6M21 21.7l-3.2-4.2M11 21.7l3.2-4.2M8 12.3l5 1.6" stroke={BLUE} strokeWidth="1.6" strokeLinecap="round" />
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

interface SportDef { key: SportKey; href: string; label: string; icon: (p: IconProps) => React.JSX.Element; accent: string }
const SPORTS: SportDef[] = [
  { key: "nba",    href: "/nba",    label: "NBA",    icon: BasketballIcon, accent: "#ea6a0a" },
  { key: "nfl",    href: "/nfl",    label: "NFL",    icon: FootballIcon,   accent: "#6d4fe0" },
  { key: "soccer", href: "/soccer", label: "Soccer", icon: SoccerIcon,     accent: "#12a150" },
  { key: "mlb",    href: "/games",  label: "MLB",    icon: BaseballIcon,   accent: "#ea6a0a" },
  { key: "wnba",   href: "/wnba",   label: "WNBA",   icon: BasketballIcon, accent: "#0f9d8e" },
];
const ACTIVE_SPORTS = SPORTS.filter((s) => getSeasonInfo(s.key).status === "in-season");
const OFF_SPORTS = SPORTS.filter((s) => getSeasonInfo(s.key).status === "offseason");

function SportPill({ sport }: { sport: SportKey }) {
  const router = useRouter();
  return (
    <div className="flex items-center p-[3px] rounded-full bg-white" style={{ boxShadow: "var(--shadow-card)" }}>
      {ACTIVE_SPORTS.map((t) => {
        const Icon = t.icon;
        const active = sport === t.key;
        return (
          <button
            key={t.key}
            onClick={() => router.push(t.href)}
            className="press inline-flex items-center gap-1.5 rounded-full px-3 py-[6px] text-[12px] font-bold tracking-wide transition-colors"
            style={active ? { background: BLUE, color: "#fff", boxShadow: "0 4px 12px rgba(26,115,255,.35)" } : { color: "#6b7280" }}
          >
            <Icon /> {t.label}
          </button>
        );
      })}
      {OFF_SPORTS.length > 0 && <span className="mx-1 h-4 w-px bg-[#14161b]/10" />}
      {OFF_SPORTS.map((t) => {
        const Icon = t.icon;
        const active = sport === t.key;
        return (
          <button
            key={t.key}
            onClick={() => router.push(t.href)}
            title={`${t.label} · Offseason`}
            aria-label={`${t.label} (offseason)`}
            className="press relative inline-flex items-center justify-center rounded-full w-7 h-[26px] transition-colors"
            style={active ? { background: "#eef0f4", color: INK } : { color: "#b5bac4" }}
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

  const isLocked = (t: "fan" | "pro" | null) => (!t ? false : t === "fan" ? !isPro : !isSuperPro);
  const tierLabel = isSuperPro ? "Pro" : isPro ? "Fan" : null;
  const initial = user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "M";

  return (
    <>
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="h-[60px] flex items-center justify-between gap-2 sticky top-0 z-40 page-pad backdrop-blur-xl" style={{ background: "rgba(246,247,249,.88)", borderBottom: "1px solid rgba(20,22,27,.06)" }}>
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <Link href="/home" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity shrink-0" aria-label="Edge Pro home">
            <BrandMark />
            <span className="text-[17px] font-medium tracking-tight hidden md:inline" style={{ color: INK }}>Edge Pro</span>
          </Link>
          <div className="hidden sm:flex"><SportPill sport={sport} /></div>
          <span className="sm:hidden font-semibold text-[16px] flex items-center gap-1.5" style={{ color: INK }}>
            <span style={{ color: sportDef.accent }}><sportDef.icon size={16} /></span>{sportDef.label}
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1.5">
          {navItems.map(({ href, icon: Icon, label, requiredTier }) => {
            const active = isActive(pathname, href);
            return (
              <Link key={href} href={href} className="press m-pill flex items-center gap-2 px-4 py-2.5 text-[14px] font-medium"
                style={{ color: active ? BLUE : INK, background: "#fff", boxShadow: active ? `inset 0 0 0 1.5px ${BLUE}55, var(--shadow-card)` : "var(--shadow-card)", borderRadius: 14 }}>
                <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                <span>{label}</span>
                {isLocked(requiredTier) && <Lock size={10} className="opacity-40" strokeWidth={2} />}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {!isSuperPro && (
            <Link href={isPro ? "/upgrade?tier=pro" : "/upgrade?tier=fan"} className="press hidden md:flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-bold text-white" style={{ background: BLUE, boxShadow: "0 6px 16px rgba(26,115,255,.3)" }}>
              {isPro ? "Upgrade to Pro" : "Go Fan"}
            </Link>
          )}
          <Link href="/settings" aria-label="Settings" className="press hidden sm:flex w-10 h-10 rounded-[14px] items-center justify-center bg-white" style={{ boxShadow: "var(--shadow-card)", color: pathname.startsWith("/settings") ? BLUE : INK }}>
            <Settings size={18} strokeWidth={1.7} />
          </Link>
          <Link href="/settings" aria-label="Account settings" className="press hidden sm:flex h-10 w-10 overflow-hidden rounded-[14px] bg-white items-center justify-center" style={{ boxShadow: "var(--shadow-card)" }}>
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.imageUrl} alt="" className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <span className="text-xs font-black" style={{ color: INK }}>{initial}</span>
            )}
          </Link>
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="press lg:hidden w-10 h-10 rounded-[14px] flex items-center justify-center bg-white" style={{ boxShadow: "var(--shadow-card)", color: INK }}>
            <Menu size={20} strokeWidth={1.8} />
          </button>
        </div>
      </header>

      {/* ── Side rail — inner display of a foldable / small tablets (640–1023) ─── */}
      <nav aria-label="Primary" className="hidden sm:flex lg:hidden fixed left-0 top-[60px] bottom-0 z-30 w-[76px] flex-col items-center gap-1 py-3"
        style={{ paddingLeft: "env(safe-area-inset-left)", background: "rgba(246,247,249,.92)", backdropFilter: "blur(14px)", borderRight: "1px solid rgba(20,22,27,.06)" }}>
        {navItems.map(({ href, icon: Icon, label, requiredTier }) => {
          const active = isActive(pathname, href);
          return (
            <Link key={href} href={href} className="press relative w-[62px] flex flex-col items-center gap-1 rounded-2xl py-2.5" style={{ color: active ? BLUE : "#6b7280" }}>
              {active && <motion.span layoutId="rail-pill" className="absolute inset-0 rounded-2xl bg-white" style={{ boxShadow: `inset 0 0 0 1.5px ${BLUE}44, var(--shadow-card)` }} transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span className="relative"><Icon size={19} strokeWidth={active ? 2.2 : 1.7} />{isLocked(requiredTier) && <Lock size={8} className="absolute -top-1 -right-2 opacity-40" />}</span>
              <span className="relative text-[10px] font-bold tracking-wide">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom tab bar — closed fold / phones (< 640) ───────────────────── */}
      <nav aria-label="Primary" className="sm:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{ paddingBottom: "env(safe-area-inset-bottom)", paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)", background: "rgba(255,255,255,.94)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(20,22,27,.07)" }}>
        <div className="flex items-stretch justify-around h-[62px] px-1">
          {[HOME_ITEM, ...NAV[sport].slice(0, 3)].map(({ href, icon: Icon, label, requiredTier }) => {
            const active = isActive(pathname, href);
            return (
              <Link key={href} href={href} className="press relative flex-1 flex flex-col items-center justify-center gap-1" style={{ color: active ? BLUE : "#8a909b" }}>
                {active && <motion.span layoutId="tab-pill" className="absolute top-1.5 h-[30px] w-14 rounded-full" style={{ background: "rgba(26,115,255,.12)" }} transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <span className="relative h-[30px] flex items-center"><Icon size={19} strokeWidth={active ? 2.2 : 1.7} />{isLocked(requiredTier) && <Lock size={8} className="absolute -top-0.5 -right-2 opacity-40" />}</span>
                <span className="text-[10px] font-bold tracking-wide -mt-1">{label}</span>
              </Link>
            );
          })}
          <button onClick={() => setSheet(true)} className="press flex-1 flex flex-col items-center justify-center gap-1" style={{ color: "#8a909b" }} aria-label="Switch sport">
            <span className="h-[30px] flex items-center"><Grid2x2 size={19} strokeWidth={1.7} /></span>
            <span className="text-[10px] font-bold tracking-wide -mt-1">Sports</span>
          </button>
        </div>
      </nav>

      {/* ── Sport switcher sheet (phones) ───────────────────────────────────── */}
      <AnimatePresence>
        {sheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setSheet(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[28px] bg-white px-5 pt-3" style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))", boxShadow: "0 -20px 60px rgba(20,22,27,.18)" }}>
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#14161b]/15" />
              <p className="text-[11px] font-bold uppercase tracking-[.16em] mb-3" style={{ color: "#8a909b" }}>Choose a sport</p>
              <div className="grid grid-cols-2 gap-2.5">
                {SPORTS.map((s) => {
                  const info = getSeasonInfo(s.key);
                  const Icon = s.icon;
                  const off = info.status === "offseason";
                  return (
                    <Link key={s.key} href={s.href} onClick={() => setSheet(false)} className="press relative flex items-center gap-3 rounded-2xl p-3.5"
                      style={{ background: sport === s.key ? "rgba(26,115,255,.08)" : "#f6f7f9", boxShadow: sport === s.key ? `inset 0 0 0 1.5px ${BLUE}66` : "none", opacity: off ? 0.62 : 1 }}>
                      <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-white" style={{ color: s.accent, boxShadow: "var(--shadow-card)" }}><Icon size={20} /></span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-bold" style={{ color: INK }}>{s.label}</span>
                        <span className="block text-[10px] font-bold" style={{ color: off ? "#8a909b" : s.accent }}>{info.chip}</span>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[min(300px,86vw)] bg-white flex flex-col overflow-y-auto" style={{ paddingRight: "env(safe-area-inset-right)", paddingBottom: "env(safe-area-inset-bottom)", boxShadow: "-20px 0 60px rgba(20,22,27,.18)" }}>
              <div className="flex items-center justify-between px-5 h-[60px] shrink-0" style={{ borderBottom: "1px solid rgba(20,22,27,.06)" }}>
                <Link href="/home" onClick={() => setOpen(false)} className="flex items-center gap-2.5"><BrandMark /><span className="text-[16px] font-medium" style={{ color: INK }}>Edge Pro</span></Link>
                <button onClick={() => setOpen(false)} aria-label="Close menu" className="press w-10 h-10 rounded-[14px] flex items-center justify-center" style={{ background: "#f3f4f7", color: INK }}><X size={20} strokeWidth={1.8} /></button>
              </div>

              <div className="px-5 pt-4"><SportPill sport={sport} /></div>

              {user && (
                <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(20,22,27,.06)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-[14px] overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "#f3f4f7" }}>
                      {user.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : <span className="text-sm font-black" style={{ color: INK }}>{initial}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: INK }}>{user.firstName ?? user.emailAddresses?.[0]?.emailAddress ?? "User"}</p>
                      {tierLabel && <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ color: BLUE, background: "rgba(26,115,255,.10)" }}>{tierLabel} Plan</span>}
                    </div>
                  </div>
                </div>
              )}

              <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map(({ href, icon: Icon, label, requiredTier }) => {
                  const active = isActive(pathname, href);
                  return (
                    <Link key={href} href={href} onClick={() => setOpen(false)} className="press flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-colors"
                      style={active ? { background: "rgba(26,115,255,.10)", color: BLUE } : { color: "#4b515c" }}>
                      <Icon size={18} strokeWidth={active ? 2.2 : 1.7} />
                      <span className="flex-1">{label}</span>
                      {isLocked(requiredTier) ? <Lock size={12} className="opacity-40" strokeWidth={2} /> : <ChevronRight size={14} className="opacity-30" strokeWidth={1.5} />}
                    </Link>
                  );
                })}
              </nav>

              <div className="px-3 pb-6 space-y-2 pt-4 shrink-0" style={{ borderTop: "1px solid rgba(20,22,27,.06)" }}>
                {!isSuperPro && (
                  <Link href={isPro ? "/upgrade?tier=pro" : "/upgrade?tier=fan"} onClick={() => setOpen(false)} className="press flex items-center justify-center gap-2 w-full h-11 rounded-2xl font-bold text-sm text-white" style={{ background: BLUE, boxShadow: "0 8px 20px rgba(26,115,255,.3)" }}>
                    <Zap size={14} strokeWidth={2.5} />{isPro ? "Upgrade to Pro" : "Go Fan — $4.99/mo"}
                  </Link>
                )}
                <Link href="/settings" onClick={() => setOpen(false)} className="press flex items-center gap-3 px-4 py-3 rounded-2xl font-medium" style={{ color: "#4b515c" }}>
                  <Settings size={18} strokeWidth={1.7} /><span>Settings</span>
                </Link>
                <button onClick={() => { setOpen(false); signOut({ redirectUrl: "/" }); }} className="press w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium" style={{ color: "#d6303d" }}>
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
