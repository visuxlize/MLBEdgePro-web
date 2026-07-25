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

// ── Preferences (NFL + MLB alerts) ───────────────────────────────────────────

interface Preferences {
  notif: boolean;
  autoRefresh: boolean;
  redZone: boolean;
  injuryAlerts: boolean;
}

const DEFAULT_PREFS: Preferences = { notif: true, autoRefresh: true, redZone: true, injuryAlerts: false };

function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(() => {
    if (typeof window === "undefined") return DEFAULT_PREFS;
    try {
      const raw = localStorage.getItem("mlbedge_preferences");
      return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  });

  const toggle = (key: keyof Preferences) => {
    setPrefs((p) => {
      const next = { ...p, [key]: !p[key] };
      localStorage.setItem("mlbedge_preferences", JSON.stringify(next));
      return next;
    });
  };

  return { prefs, toggle };
}

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-[46px] h-[26px] shrink-0 rounded-full relative transition-colors ${on ? "bg-[#FF7828]" : "bg-white/10"}`}
    >
      <span
        className="absolute top-[3px] w-5 h-5 rounded-full bg-white shadow transition-all"
        style={{ left: on ? 23 : 3 }}
      />
    </button>
  );
}

const TOGGLE_DEFS: { key: keyof Preferences; label: string; desc: string }[] = [
  { key: "notif",        label: "Kickoff & game alerts",     desc: "Push me when a tracked game starts or an edge shifts." },
  { key: "autoRefresh",  label: "Auto-refresh live data",     desc: "Pull fresh odds, injuries & scores every 5–10 minutes." },
  { key: "redZone",      label: "Red-zone & big-play pings",  desc: "Only the moments that move win probability." },
  { key: "injuryAlerts", label: "Injury / inactive alerts",   desc: "Notify me the second a starter is downgraded." },
];

function PreferencesCard() {
  const { prefs, toggle } = usePreferences();
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#111622] overflow-hidden">
      {TOGGLE_DEFS.map((t, i) => (
        <div key={t.key} className={`flex items-center gap-4 p-4 ${i > 0 ? "border-t border-white/[0.05]" : ""}`}>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">{t.label}</p>
            <p className="text-white/35 text-xs mt-0.5 leading-relaxed">{t.desc}</p>
          </div>
          <Switch on={prefs[t.key]} onClick={() => toggle(t.key)} />
        </div>
      ))}
    </div>
  );
}

// ── Odds format ───────────────────────────────────────────────────────────────

const ODDS_FORMATS = ["American", "Decimal", "Fractional"] as const;

function useOddsFormat() {
  const [format, setFormatState] = useState<string>(() => {
    if (typeof window === "undefined") return "American";
    return localStorage.getItem("mlbedge_odds_format") ?? "American";
  });
  const setFormat = (f: string) => {
    setFormatState(f);
    localStorage.setItem("mlbedge_odds_format", f);
  };
  return { format, setFormat };
}

function OddsFormatCard() {
  const { format, setFormat } = useOddsFormat();
  return (
    <div className="flex gap-2">
      {ODDS_FORMATS.map((f) => (
        <button
          key={f}
          onClick={() => setFormat(f)}
          className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors ${
            f === format
              ? "bg-[#7c5cfa] text-white"
              : "border border-white/[0.08] bg-white/[0.03] text-white/50 hover:text-white/80"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}

// ── Responsible gaming ────────────────────────────────────────────────────────

function ResponsibleGamingCard() {
  return (
    <div className="rounded-xl border border-[#34d399]/20 bg-[#34d399]/[0.06] p-5">
      <div className="flex items-center gap-2 mb-2.5">
        <Check size={16} className="text-[#34d399]" strokeWidth={2.5} />
        <p className="text-[#a7f3d0] font-bold text-sm">Responsible Gaming</p>
      </div>
      <p className="text-white/40 text-xs leading-relaxed mb-3.5">
        Set a weekly reminder and session limits. We&rsquo;ll nudge you &mdash; this is analysis, not a guarantee.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link href="/responsible-gambling" className="rounded-lg px-3.5 py-2 text-xs font-bold text-white/60 bg-white/[0.04] border border-white/[0.08] hover:text-white transition-colors">
          Set limits
        </Link>
        <Link href="/responsible-gambling" className="rounded-lg px-3.5 py-2 text-xs font-bold text-white/60 bg-white/[0.04] border border-white/[0.08] hover:text-white transition-colors">
          Take a break
        </Link>
        <span className="rounded-lg px-3.5 py-2 text-xs font-bold text-white/35 border border-white/[0.06]">Helpline: 1-800-522-4700</span>
      </div>
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

          <section>
            <h2 className="text-xs font-bold text-white/30 tracking-widest uppercase mb-4">Preferences</h2>
            <PreferencesCard />
          </section>

          <section>
            <h2 className="text-xs font-bold text-white/30 tracking-widest uppercase mb-4">Odds Format</h2>
            <OddsFormatCard />
          </section>

          <section>
            <ResponsibleGamingCard />
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
