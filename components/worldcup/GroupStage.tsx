"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { WC_GROUPS, WC_TEAMS } from "@/lib/worldcup/data";
import type { WCGroup, GSTeam } from "@/lib/worldcup/types";

const GOLD = "#FBBF24";

function flagUrl(countryCode: string) {
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
}

function sortedStandings(teams: GSTeam[]): GSTeam[] {
  return [...teams].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdA = a.gf - a.ga;
    const gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    return b.gf - a.gf;
  });
}

function GroupCard({ group }: { group: WCGroup }) {
  const [expanded, setExpanded] = useState(false);
  const sorted = sortedStandings(group.teams);
  const completedMatches = group.matches.filter((m) => m.status === "completed");
  const upcomingMatches = group.matches.filter((m) => m.status !== "completed");
  const displayMatches = expanded ? group.matches : [...completedMatches, ...upcomingMatches].slice(0, 3);
  const hasMore = group.matches.length > 3;

  const groupColors: Record<string, string> = {
    A: "#FF7828", B: "#38BDF8", C: "#34D399", D: "#F472B6",
    E: "#818CF8", F: "#FBBF24", G: "#60A5FA", H: "#A78BFA",
    I: "#F97316", J: "#4ADE80", K: "#22D3EE", L: "#FB7185",
  };
  const accentColor = groupColors[group.id] ?? GOLD;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/[0.07] bg-[#0D1420] overflow-hidden"
    >
      {/* Group header */}
      <div className="px-4 py-3 border-b border-white/[0.07]" style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: accentColor }}>
              GROUP {group.id}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-white/30">
            <CheckCircle2 size={10} />
            <span>{completedMatches.length}/6</span>
          </div>
        </div>
      </div>

      {/* Standings table */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-1 px-1 mb-1">
          <span className="flex-1 text-[8px] text-white/25 uppercase tracking-wider">Team</span>
          {["P","W","D","L","GF","GA","Pts"].map((h) => (
            <span key={h} className="w-5 text-center text-[8px] text-white/25 uppercase">{h}</span>
          ))}
        </div>
        {sorted.map((standing, idx) => {
          const team = WC_TEAMS[standing.teamId];
          if (!team) return null;
          const isQualifying = idx < 2;
          return (
            <div
              key={standing.teamId}
              className={`flex items-center gap-1 px-1 py-1.5 rounded-lg mb-0.5 ${
                isQualifying ? "bg-white/[0.03]" : ""
              }`}
            >
              {isQualifying && (
                <div className="w-0.5 h-4 rounded-full mr-0.5" style={{ background: accentColor }} />
              )}
              {!isQualifying && <div className="w-1 mr-0.5" />}
              <div className="w-4 h-4 rounded-full overflow-hidden border border-white/10 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={flagUrl(team.countryCode)} alt={team.shortName}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              </div>
              <span className="flex-1 text-[11px] font-bold text-white/80 truncate min-w-0 ml-1">{team.shortName}</span>
              {[standing.p, standing.w, standing.d, standing.l, standing.gf, standing.ga].map((val, i) => (
                <span key={i} className="w-5 text-center text-[11px] text-white/50">{val}</span>
              ))}
              <span className={`w-5 text-center text-[11px] font-black ${standing.pts > 0 ? "text-white" : "text-white/40"}`}>
                {standing.pts}
              </span>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.05] mx-3" />

      {/* Matches */}
      <div className="px-3 py-2 space-y-1.5">
        {displayMatches.map((match, i) => {
          const home = WC_TEAMS[match.home];
          const away = WC_TEAMS[match.away];
          if (!home || !away) return null;
          const isDone = match.status === "completed";
          return (
            <div key={i}>
              <div className="flex items-center gap-2">
                {/* Home */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                  <span className={`text-[10px] font-bold truncate ${
                    isDone && match.homeScore! > match.awayScore! ? "text-white" :
                    isDone ? "text-white/35" : "text-white/70"
                  }`}>
                    {home.shortName}
                  </span>
                  <div className="w-4 h-4 rounded-full overflow-hidden border border-white/10 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={flagUrl(home.countryCode)} alt={home.shortName} className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  </div>
                </div>

                {/* Score / time */}
                <div className="flex items-center justify-center shrink-0 min-w-[52px]">
                  {isDone ? (
                    <span className="text-xs font-black text-white">
                      {match.homeScore} &ndash; {match.awayScore}
                    </span>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-bold text-white/35">{match.date}</span>
                      <span className="text-[8px] text-white/20">{match.time}</span>
                    </div>
                  )}
                </div>

                {/* Away */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div className="w-4 h-4 rounded-full overflow-hidden border border-white/10 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={flagUrl(away.countryCode)} alt={away.shortName} className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  </div>
                  <span className={`text-[10px] font-bold truncate ${
                    isDone && match.awayScore! > match.homeScore! ? "text-white" :
                    isDone ? "text-white/35" : "text-white/70"
                  }`}>
                    {away.shortName}
                  </span>
                </div>
              </div>

              {/* Goalscorers */}
              {isDone && match.goals.length > 0 && (
                <div className="mt-0.5 px-1 flex flex-wrap gap-x-3 gap-y-0.5">
                  {match.goals.map((g, gi) => {
                    const isHome = g.teamId === match.home;
                    return (
                      <span key={gi} className={`text-[8px] text-white/30 ${isHome ? "" : "ml-auto"}`}>
                        {"⚽"} {g.scorer} {g.min}&apos;
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show more/less */}
      {hasMore && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full py-2 text-[9px] font-bold text-white/25 hover:text-white/50 transition-colors flex items-center justify-center gap-1 border-t border-white/[0.05]"
        >
          {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          {expanded ? "Show less" : `+${group.matches.length - 3} more matches`}
        </button>
      )}
    </motion.div>
  );
}

export function GroupStage() {
  const [filterGroup, setFilterGroup] = useState<string | null>(null);

  const displayed = filterGroup
    ? WC_GROUPS.filter((g) => g.id === filterGroup)
    : WC_GROUPS;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-[#FBBF24]" strokeWidth={2.2} />
          <h2 className="text-lg font-black text-white">Group Stage</h2>
          <span className="text-xs text-white/30 font-medium">June 11 &ndash; 27, 2026</span>
        </div>
        {/* Group filter pills */}
        <div className="flex items-center gap-1 flex-wrap ml-auto">
          <button
            onClick={() => setFilterGroup(null)}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase transition-colors ${
              !filterGroup ? "bg-[#FBBF24]/15 text-[#FBBF24]" : "text-white/30 hover:text-white border border-white/[0.07]"
            }`}
          >
            All
          </button>
          {WC_GROUPS.map((g) => (
            <button
              key={g.id}
              onClick={() => setFilterGroup(g.id === filterGroup ? null : g.id)}
              className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-colors ${
                filterGroup === g.id ? "bg-[#FBBF24]/15 text-[#FBBF24]" : "text-white/30 hover:text-white border border-white/[0.07]"
              }`}
            >
              {g.id}
            </button>
          ))}
        </div>
      </div>

      {/* Group grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {displayed.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </AnimatePresence>
      </div>

      <p className="mt-6 text-[10px] text-white/15">
        Groups A&ndash;L &middot; 48 teams &middot; Top 2 advance + 8 best 3rd place teams
      </p>
    </div>
  );
}
