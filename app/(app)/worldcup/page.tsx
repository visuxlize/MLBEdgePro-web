"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy, Map, BarChart3, Users, ArrowRight, Globe2, Clock,
  LayoutGrid, Zap, ChevronRight, Ticket,
} from "lucide-react";
import type { WCGroup } from "@/lib/worldcup/types";
import type { TodayMatch } from "@/app/api/worldcup/today/route";
import { WC_GROUPS, WC_TEAMS } from "@/lib/worldcup/data";

// ── Stadium Cards ─────────────────────────────────────────────────────────────

const STADIUMS = [
  { name: "MetLife Stadium",    city: "New York/NJ", capacity: "82,500", matches: 8, from: "#1B4D8E", to: "#0F2D56", country: "usa", isFinal: true },
  { name: "SoFi Stadium",       city: "Los Angeles", capacity: "70,240", matches: 7, from: "#002244", to: "#0085CA", country: "usa" },
  { name: "AT&T Stadium",       city: "Dallas",       capacity: "80,000", matches: 6, from: "#002647", to: "#869397", country: "usa" },
  { name: "Estadio Azteca",     city: "Mexico City",  capacity: "87,523", matches: 7, from: "#006341", to: "#004225", country: "mex" },
  { name: "Levi's Stadium",     city: "Bay Area",     capacity: "68,500", matches: 6, from: "#AA0000", to: "#890000", country: "usa" },
  { name: "NRG Stadium",        city: "Houston",      capacity: "72,220", matches: 6, from: "#03202F", to: "#0CA1D2", country: "usa" },
  { name: "Lumen Field",        city: "Seattle",      capacity: "69,000", matches: 6, from: "#002244", to: "#69BE28", country: "usa" },
  { name: "BMO Field",          city: "Toronto",      capacity: "45,000", matches: 6, from: "#231F20", to: "#BE0000", country: "can" },
];

// ── Nav Sections ──────────────────────────────────────────────────────────────

const SECTIONS = [
  { href: "/worldcup/groups",  icon: LayoutGrid, title: "Groups",   desc: "Live standings for all 12 groups",         accent: "#38BDF8" },
  { href: "/worldcup/bracket", icon: Trophy,     title: "Bracket",  desc: "32-team knockout with ELO simulation",     accent: "#FBBF24" },
  { href: "/worldcup/map",     icon: Map,        title: "Venues",   desc: "Interactive host city & stadium map",      accent: "#34D399" },
  { href: "/worldcup/props",   icon: BarChart3,  title: "Betting",  desc: "Live odds, props, and value bets",         accent: "#FF7828" },
  { href: "/worldcup/h2h",     icon: Users,      title: "H2H",      desc: "Starting lineups and player matchups",     accent: "#818CF8" },
  { href: "/worldcup/slips",   icon: Ticket,     title: "WC Slips", desc: "Track your World Cup parlay bets",        accent: "#F472B6" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function flagUrl(countryCode: string) {
  return `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
}

function sortedTeams(teams: WCGroup["teams"]) {
  return [...teams].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdA = a.gf - a.ga, gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    return b.gf - a.gf;
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function LiveBadge() {
  return (
    <div className="inline-flex items-center gap-1.5">
      <motion.span
        className="w-2 h-2 rounded-full bg-red-500"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      />
      <span className="text-red-400 text-[10px] font-black uppercase tracking-widest">Live Now</span>
    </div>
  );
}

function TodayMatchCard({ match }: { match: TodayMatch }) {
  const isLive = match.status === "live";
  const isDone = match.status === "completed";

  return (
    <div
      className="relative shrink-0 w-52 rounded-2xl border p-3.5 overflow-hidden"
      style={{
        borderColor: isLive ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.07)",
        background: isLive
          ? "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(13,17,23,0.95))"
          : "rgba(255,255,255,0.02)",
      }}
    >
      {isLive && (
        <div className="absolute top-2 right-2">
          <LiveBadge />
        </div>
      )}
      <div className="text-[9px] font-bold text-white/30 uppercase tracking-wider mb-2">
        Group {match.groupId}
      </div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <img src={match.homeFlagUrl} alt={match.home} className="w-5 h-5 rounded-full object-cover border border-white/10 shrink-0" />
          <span className="text-xs font-bold text-white truncate">{WC_TEAMS[match.homeId]?.shortName ?? match.home.slice(0,3).toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {(isLive || isDone) && match.homeScore !== null ? (
            <span className="text-sm font-black text-white">
              {match.homeScore} – {match.awayScore}
            </span>
          ) : (
            <span className="text-[10px] font-bold text-white/40">vs</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="text-xs font-bold text-white truncate text-right">{WC_TEAMS[match.awayId]?.shortName ?? match.away.slice(0,3).toUpperCase()}</span>
          <img src={match.awayFlagUrl} alt={match.away} className="w-5 h-5 rounded-full object-cover border border-white/10 shrink-0" />
        </div>
      </div>
      <div className="flex items-center gap-1 text-[9px] text-white/30">
        <Clock size={9} />
        <span>{match.time}</span>
        <span className="text-white/15">·</span>
        <span className="truncate">{match.venue.split(",")[0]}</span>
      </div>
    </div>
  );
}

function GroupMiniCard({ group }: { group: WCGroup }) {
  const top2 = sortedTeams(group.teams).slice(0, 2);
  return (
    <Link href="/worldcup/groups" className="block group">
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:border-white/[0.12] transition-colors">
        <div className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Group {group.id}</div>
        {top2.map((t, i) => {
          const team = WC_TEAMS[t.teamId];
          return (
            <div key={t.teamId} className="flex items-center gap-2 mb-1 last:mb-0">
              <span className="text-[9px] text-white/20 w-2.5">{i + 1}</span>
              <img src={flagUrl(team?.countryCode ?? t.teamId)} alt={team?.name ?? t.teamId} className="w-3.5 h-3.5 rounded-full object-cover border border-white/10" />
              <span className="text-[10px] font-bold text-white/80 flex-1 truncate">{team?.shortName ?? t.teamId.toUpperCase()}</span>
              <span className="text-[10px] font-black text-[#FBBF24]">{t.pts}pt</span>
            </div>
          );
        })}
      </div>
    </Link>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WorldCupHubPage() {
  const [todayMatches, setTodayMatches] = useState<TodayMatch[]>([]);
  const [groups, setGroups] = useState<WCGroup[]>(WC_GROUPS);
  const [hasLive, setHasLive] = useState(false);

  useEffect(() => {
    fetch("/api/worldcup/today")
      .then((r) => r.json())
      .then(({ matches }: { matches: TodayMatch[] }) => {
        setTodayMatches(matches ?? []);
        setHasLive((matches ?? []).some((m) => m.status === "live"));
      })
      .catch(() => {});

    fetch("/api/worldcup/groups")
      .then((r) => r.json())
      .then(({ groups: g }: { groups: WCGroup[] }) => {
        if (g?.length) setGroups(g);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">

      {/* ── Hero ── */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0A1628 0%, #1A2D5A 40%, #0F1E3C 70%, #1C1000 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 0%, #FBBF2430, transparent), radial-gradient(ellipse 60% 40% at 100% 100%, #1E3A5F50, transparent)",
          }}
        />
        <div className="relative px-8 py-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FBBF24]/20 bg-[#FBBF24]/[0.06] px-4 py-1.5 mb-5">
            <Globe2 size={11} className="text-[#FBBF24]" />
            <span className="text-[9px] font-black text-[#FBBF24] tracking-[0.2em] uppercase">FIFA World Cup 2026</span>
            {hasLive && (
              <>
                <span className="text-white/15 mx-1">·</span>
                <LiveBadge />
              </>
            )}
          </div>
          <h1 className="text-5xl font-black text-white mb-2 tracking-tight">
            WORLD CUP
            <span className="block text-[#FBBF24]">2026</span>
          </h1>
          <p className="text-white/40 text-sm max-w-sm mx-auto mb-6">
            USA · Canada · Mexico · 48 teams · Jun 11 – Jul 21, 2026
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/worldcup/groups"
              className="inline-flex items-center gap-2 rounded-xl bg-[#FBBF24] text-black text-xs font-black px-5 py-2.5 hover:bg-[#F59E0B] transition-colors"
            >
              <LayoutGrid size={13} />
              Live Groups
            </Link>
            <Link
              href="/worldcup/bracket"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] text-white text-xs font-black px-5 py-2.5 hover:bg-white/[0.10] transition-colors"
            >
              <Trophy size={13} />
              Bracket
            </Link>
          </div>
        </div>
      </div>

      {/* ── Today's Matches ── */}
      {todayMatches.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-[#FF7828]" />
              <span className="text-sm font-black text-white">Today&apos;s Matches</span>
              {hasLive && <LiveBadge />}
            </div>
            <Link href="/worldcup/groups" className="text-[10px] font-bold text-white/40 hover:text-white/70 flex items-center gap-1">
              All matches <ChevronRight size={10} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {todayMatches.map((m, i) => (
              <TodayMatchCard key={i} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* ── Stadiums ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Map size={14} className="text-[#34D399]" />
          <span className="text-sm font-black text-white">Host Stadiums</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {STADIUMS.map((s) => (
            <Link key={s.name} href="/worldcup/map" className="block shrink-0 group">
              <div
                className="relative w-44 h-28 rounded-2xl overflow-hidden border border-white/[0.06] group-hover:border-white/[0.15] transition-colors"
                style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}
              >
                {s.isFinal && (
                  <div className="absolute top-2 left-2">
                    <div className="flex items-center gap-1 rounded-full bg-[#FBBF24]/20 border border-[#FBBF24]/30 px-1.5 py-0.5">
                      <Trophy size={8} className="text-[#FBBF24]" />
                      <span className="text-[8px] font-black text-[#FBBF24]">FINAL</span>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <div className="text-[10px] font-black text-white leading-tight">{s.name}</div>
                  <div className="text-[9px] text-white/50 mt-0.5">{s.city} · {s.matches} matches</div>
                  <div className="text-[9px] text-white/35">{s.capacity} cap.</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Group Standings Preview ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <LayoutGrid size={14} className="text-[#38BDF8]" />
            <span className="text-sm font-black text-white">Group Standings</span>
          </div>
          <Link href="/worldcup/groups" className="text-[10px] font-bold text-white/40 hover:text-white/70 flex items-center gap-1">
            Full standings <ChevronRight size={10} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {groups.map((g) => (
            <GroupMiniCard key={g.id} group={g} />
          ))}
        </div>
      </section>

      {/* ── Navigation Tiles ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-black text-white">Explore</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SECTIONS.map(({ href, icon: Icon, title, desc, accent }) => (
            <Link key={href} href={href} className="group block">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 h-full hover:border-white/[0.13] transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}
                >
                  <Icon size={16} style={{ color: accent }} strokeWidth={2} />
                </div>
                <div className="text-sm font-black text-white mb-1">{title}</div>
                <p className="text-[10px] text-white/35 leading-relaxed mb-3">{desc}</p>
                <div className="flex items-center gap-1 text-[10px] font-bold" style={{ color: accent }}>
                  Open
                  <ArrowRight size={10} strokeWidth={2.5} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      <p className="text-center text-[10px] text-white/20">
        Data: API-Football · ELO ratings · The Odds API · Updated in real-time
      </p>
    </div>
  );
}
