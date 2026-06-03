"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { CircleDot, BarChart3, Layers, TrendingUp, Settings, Lock } from "lucide-react";
import { useSubscription } from "@/lib/subscription";

const NAV = [
  { href: "/games",    icon: CircleDot,  label: "Today's Games", pro: false },
  { href: "/scores",   icon: BarChart3,  label: "Live Scores",   pro: false },
  { href: "/analysis", icon: TrendingUp, label: "Edge Report",   pro: true  },
  { href: "/props",    icon: Layers,     label: "Prop Builder",  pro: true  },
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
  const { isPro } = useSubscription();

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
      <nav className="hidden sm:flex items-center gap-1">
        {NAV.map(({ href, icon: Icon, label, pro }) => {
          const active = pathname.startsWith(href);
          const locked = pro && !isPro;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors relative ${
                active
                  ? "bg-[#FF7828]/12 text-[#FF7828]"
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

      {/* Right — settings + user */}
      <div className="flex items-center gap-2">
        {/* Upgrade pill (free users only) */}
        {!isPro && (
          <Link
            href="/upgrade"
            className="hidden md:flex items-center gap-1.5 rounded-full border border-[#FF7828]/30 bg-[#FF7828]/10 px-3 py-1.5 text-[11px] font-bold text-[#FF7828] hover:bg-[#FF7828]/15 transition-colors"
          >
            Upgrade to Pro
          </Link>
        )}
        <Link
          href="/settings"
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
            pathname === "/settings"
              ? "bg-[#FF7828]/12 text-[#FF7828]"
              : "text-white/35 hover:text-white hover:bg-white/[0.06]"
          }`}
        >
          <Settings size={17} strokeWidth={1.7} />
        </Link>
        <UserButton
          appearance={{ elements: { avatarBox: "w-8 h-8 rounded-lg" } }}
        />
      </div>
    </header>
  );
}
