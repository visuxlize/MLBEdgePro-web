"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { CircleDot, BarChart3, Layers, TrendingUp, Target, Settings, Lock, BookOpen } from "lucide-react";
import { useSubscription } from "@/lib/subscription";

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
  const pathname = usePathname();
  const { isPro, isSuperPro } = useSubscription();
  const { user } = useUser();

  function isLocked(requiredTier: "fan" | "pro" | null): boolean {
    if (!requiredTier) return false;
    if (requiredTier === "fan") return !isPro;
    return !isSuperPro;
  }

  return (
    <header className="h-14 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#0A0E14]/95 backdrop-blur-xl sticky top-0 z-40">
      {/* Logo */}
      <Link href="/games" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
        <DiamondLogo />
        <span className="text-[15px] font-bold text-white">
          MLB Edge<span className="text-[#FF7828]"> Pro</span>
        </span>
      </Link>

      {/* Center nav */}
      <nav className="hidden sm:flex items-center gap-0.5">
        {NAV.map(({ href, icon: Icon, label, requiredTier }) => {
          const active = pathname.startsWith(href);
          const locked = isLocked(requiredTier);
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

      {/* Right — upgrade pill + settings + user */}
      <div className="flex items-center gap-2">
        {/* Smart upgrade pill */}
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

        <Link
          href="/settings"
          aria-label="Open settings"
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
            pathname === "/settings"
              ? "bg-[#FF7828]/12 text-[#FF7828]"
              : "text-white/35 hover:text-white hover:bg-white/[0.06]"
          }`}
        >
          <Settings size={17} strokeWidth={1.7} />
        </Link>
        <Link
          href="/settings"
          aria-label="Open account settings"
          className="h-9 w-9 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04] transition hover:border-white/15"
        >
          {user?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-black text-white/45">
              {user?.firstName?.[0] ?? user?.emailAddresses[0]?.emailAddress[0] ?? "M"}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
