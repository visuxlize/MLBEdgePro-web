"use client";

import { useState } from "react";
import { UserProfile, useClerk, useAuth } from "@clerk/nextjs";
import { Check, Zap, ChevronDown, LogOut, Home } from "lucide-react";
import { useSubscription } from "@/lib/subscription";
import { TeamLogoImg } from "@/components/web-tool/team-logo-img";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Team list ─────────────────────────────────────────────────────────────────

const ALL_TEAMS = [
  { id: 108, name: "Los Angeles Angels" }, { id: 109, name: "Arizona Diamondbacks" },
  { id: 110, name: "Baltimore Orioles" },  { id: 111, name: "Boston Red Sox" },
  { id: 112, name: "Chicago Cubs" },       { id: 113, name: "Cincinnati Reds" },
  { id: 114, name: "Cleveland Guardians" },{ id: 115, name: "Colorado Rockies" },
  { id: 116, name: "Detroit Tigers" },     { id: 117, name: "Houston Astros" },
  { id: 118, name: "Kansas City Royals" }, { id: 119, name: "Los Angeles Dodgers" },
  { id: 120, name: "Washington Nationals" },{ id: 121, name: "New York Mets" },
  { id: 133, name: "Athletics" },           { id: 134, name: "Pittsburgh Pirates" },
  { id: 135, name: "San Diego Padres" },   { id: 136, name: "Seattle Mariners" },
  { id: 137, name: "San Francisco Giants" },{ id: 138, name: "St. Louis Cardinals" },
  { id: 139, name: "Tampa Bay Rays" },     { id: 140, name: "Texas Rangers" },
  { id: 141, name: "Toronto Blue Jays" },  { id: 142, name: "Minnesota Twins" },
  { id: 143, name: "Philadelphia Phillies" },{ id: 144, name: "Atlanta Braves" },
  { id: 145, name: "Chicago White Sox" },  { id: 146, name: "Miami Marlins" },
  { id: 147, name: "New York Yankees" },   { id: 158, name: "Milwaukee Brewers" },
].sort((a, b) => a.name.localeCompare(b.name));

// ── Favorite team hook ────────────────────────────────────────────────────────

function useFavoriteTeam() {
  const [teamId, setTeamIdState] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const v = localStorage.getItem("mlbedge_fav_team");
    return v ? parseInt(v) : null;
  });

  const set = (id: number | null) => {
    setTeamIdState(id);
    if (id) localStorage.setItem("mlbedge_fav_team", String(id));
    else    localStorage.removeItem("mlbedge_fav_team");
  };

  const name = ALL_TEAMS.find((t) => t.id === teamId)?.name;
  return { teamId, teamName: name, setTeam: set };
}

// ── Team picker ───────────────────────────────────────────────────────────────

function TeamPicker() {
  const { teamId, teamName, setTeam } = useFavoriteTeam();
  const [open, setOpen] = useState(false);

  return (
    <div>
      {teamId ? (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-[#FF7828]/25 bg-[#FF7828]/[0.05] mb-4">
          <TeamLogoImg teamId={teamId} name={teamName ?? ""} size={44} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#FF7828]/60 font-bold tracking-widest uppercase mb-0.5">Selected Team</p>
            <p className="text-white font-bold text-base truncate">{teamName}</p>
          </div>
          <button
            onClick={() => setTeam(null)}
            className="text-white/25 hover:text-white/50 text-xs transition-colors shrink-0"
          >
            Remove
          </button>
        </div>
      ) : (
        <p className="text-white/30 text-sm mb-4">No favorite team selected. Your team will be featured on the Today screen.</p>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-white transition-colors mb-4"
      >
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2} />
        {open ? "Hide teams" : "Choose team"}
      </button>

      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
          {ALL_TEAMS.map((team) => {
            const selected = team.id === teamId;
            return (
              <button
                key={team.id}
                onClick={() => { setTeam(team.id); setOpen(false); }}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                  selected
                    ? "border-[#FF7828]/40 bg-[#FF7828]/[0.08]"
                    : "border-white/[0.06] bg-[#111622] hover:border-white/[0.12]"
                }`}
              >
                <TeamLogoImg teamId={team.id} name={team.name} size={30} />
                <span className={`text-sm flex-1 min-w-0 truncate ${selected ? "text-white font-bold" : "text-white/60"}`}>
                  {team.name}
                </span>
                {selected && <Check size={13} className="text-[#FF7828] shrink-0" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Subscription card ─────────────────────────────────────────────────────────

function SubscriptionCard() {
  const { has } = useAuth();
  const { isPro, isSuperPro, expiresAt } = useSubscription();

  // Clerk Billing plan checks for display label
  const hasFan = has?.({ plan: "fan_subscription" }) ?? false;
  const hasPro = has?.({ plan: "pro_subscription" }) ?? false;
  const planLabel = hasPro || isSuperPro ? "Pro" : hasFan || (isPro && !isSuperPro) ? "Fan" : null;

  return (
    <div className={`rounded-xl border p-5 ${
      isPro ? "border-[#FF7828]/25 bg-[#FF7828]/[0.05]" : "border-white/[0.07] bg-[#111622]"
    }`}>
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-widest uppercase mb-1"
            style={{ color: isPro ? "#FF7828" : "rgba(255,255,255,0.30)" }}>
            Current Plan
          </p>
          <p className="text-white font-black text-xl">{planLabel ? `Edge ${planLabel}` : "Free Plan"}</p>
          {isPro && expiresAt && (
            <p className="text-white/30 text-xs mt-1">
              Renews {new Date(expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
        {isPro && (
          <div className="flex items-center gap-1.5 rounded-full border border-[#FF7828]/30 bg-[#FF7828]/10 px-2.5 py-1 shrink-0">
            <Zap size={10} className="text-[#FF7828]" strokeWidth={2.5} />
            <span className="text-[9px] font-black text-[#FF7828] tracking-widest uppercase">Active</span>
          </div>
        )}
      </div>

      {!isPro ? (
        <Link
          href="/upgrade"
          className="inline-flex items-center gap-2 bg-[#FF7828] hover:bg-[#FFA550] text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors shadow-[0_4px_16px_rgba(255,120,40,0.30)]"
        >
          <Zap size={13} strokeWidth={2.5} />
          Upgrade to Edge Pro — $4.99/mo
        </Link>
      ) : (
        <p className="text-white/30 text-sm">
          Manage your subscription in your App Store or Google Play settings.
        </p>
      )}
    </div>
  );
}

// ── Action buttons (Home + Sign Out) ─────────────────────────────────────────

function ActionButtons({ onSignOut, className = "" }: { onSignOut: () => void; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Link
        href="/"
        className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/45 hover:text-white hover:border-white/15 transition-colors font-medium"
      >
        <Home size={14} strokeWidth={1.7} />
        <span className="hidden sm:inline">Home</span>
      </Link>
      <button
        onClick={onSignOut}
        className="flex items-center gap-1.5 rounded-xl border border-[#EB505A]/25 bg-[#EB505A]/[0.06] px-3 py-2 text-sm text-[#EB505A] hover:bg-[#EB505A]/10 transition-colors font-bold"
      >
        <LogOut size={14} strokeWidth={1.7} />
        <span className="hidden sm:inline">Sign Out</span>
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { signOut } = useClerk();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <div className="px-4 sm:px-8 py-6 max-w-screen-xl mx-auto w-full">

      {/* Page header — title left, action buttons right on mobile; title only on desktop */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-1">Account</p>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Settings</h1>
        </div>
        {/* Mobile only — shown in header */}
        <ActionButtons onSignOut={handleSignOut} className="lg:hidden" />
      </div>

      {/* Two-column layout: stacks to single column on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 items-start">

        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div className="space-y-6 lg:space-y-8 lg:pr-8">

          <section>
            <h2 className="text-xs font-bold text-white/30 tracking-widest uppercase mb-4">Subscription</h2>
            <SubscriptionCard />
          </section>

          <section>
            <h2 className="text-xs font-bold text-white/30 tracking-widest uppercase mb-4">Favorite Team</h2>
            <div className="rounded-xl border border-white/[0.07] bg-[#111622] p-4 sm:p-5">
              <TeamPicker />
            </div>
          </section>

          {/* Desktop only — Home + Sign Out below Favorite Team */}
          <ActionButtons onSignOut={handleSignOut} className="hidden lg:flex pt-2" />
        </div>

        {/* ── Right column — Clerk UserProfile ────────────────────────────── */}
        <section className="lg:pl-8 lg:border-l lg:border-white/[0.06]">
          <h2 className="text-xs font-bold text-white/30 tracking-widest uppercase mb-4">Profile</h2>
          <UserProfile
            routing="hash"
            appearance={{
              variables: {
                colorPrimary:         "#FF7828",
                colorBackground:      "#111622",
                colorInputBackground: "#191C22",
                colorInputText:       "#ffffff",
                colorText:            "#ffffff",
                colorTextSecondary:   "rgba(255,255,255,0.45)",
                borderRadius:         "0.875rem",
              },
              elements: {
                card:          "shadow-none border-0 bg-transparent p-0",
                navbar:        "hidden",
                pageScrollBox: "p-0",
                rootBox:       "w-full max-w-full",
              },
            }}
          />
        </section>
      </div>
    </div>
  );
}
