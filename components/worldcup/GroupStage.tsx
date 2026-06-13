"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ChevronDown, ChevronUp, CheckCircle2, X, TrendingUp, Shield, Target, Clock, Cpu } from "lucide-react";
import { WC_GROUPS, WC_TEAMS, eloWinProb } from "@/lib/worldcup/data";
import type { WCGroup, GSTeam, GSMatch } from "@/lib/worldcup/types";
import type { GroupPrediction, MatchPrediction } from "@/app/api/worldcup/predictions/route";

const GOLD = "#FBBF24";

const GROUP_COLORS: Record<string, string> = {
  A: "#FF7828", B: "#38BDF8", C: "#34D399", D: "#F472B6",
  E: "#818CF8", F: "#FBBF24", G: "#60A5FA", H: "#A78BFA",
  I: "#F97316", J: "#4ADE80", K: "#22D3EE", L: "#FB7185",
};

function flagUrl(countryCode: string) {
  return `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
}
function flagSmUrl(countryCode: string) {
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
}

function FlagImg({ code, name, className, small = false }: { code: string; name: string; className?: string; small?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`${className ?? ""} flex items-center justify-center bg-white/[0.12] text-white/60 font-black select-none`}
           style={{ fontSize: "7px", letterSpacing: "-0.3px" }}>
        {name.slice(0, 3).toUpperCase()}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={small ? flagSmUrl(code) : flagUrl(code)}
      alt={name}
      className={`${className ?? ""} object-cover`}
      onError={() => setFailed(true)}
    />
  );
}

function sortedStandings(teams: GSTeam[]): GSTeam[] {
  return [...teams].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdA = a.gf - a.ga, gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    return b.gf - a.gf;
  });
}

// ── Team Detail Modal ─────────────────────────────────────────────────────────

function TeamModal({
  teamId,
  group,
  onClose,
}: {
  teamId: string;
  group: WCGroup;
  onClose: () => void;
}) {
  const team = WC_TEAMS[teamId];
  if (!team) return null;

  const sorted = sortedStandings(group.teams);
  const standing = group.teams.find((t) => t.teamId === teamId)!;
  const rank = sorted.findIndex((t) => t.teamId === teamId) + 1;
  const accentColor = GROUP_COLORS[group.id] ?? GOLD;

  const teamMatches = group.matches.filter(
    (m) => m.home === teamId || m.away === teamId
  );

  const otherTeams = group.teams.filter((t) => t.teamId !== teamId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{
          background: "#0D1117",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero */}
        <div className="relative h-36 overflow-hidden flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${team.color}30, ${team.color}10, #0D1117)` }}>
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, ${team.color}20 0%, transparent 70%)` }} />
          {/* Close */}
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
            <X size={14} strokeWidth={2} />
          </button>
          {/* Group badge */}
          <div className="absolute top-4 left-4 rounded-full px-2.5 py-1 text-[9px] font-black tracking-widest"
            style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}40`, color: accentColor }}>
            GROUP {group.id}
          </div>
          {/* Flag + name */}
          <div className="flex flex-col items-center gap-3 z-10">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl">
              <FlagImg code={team.countryCode} name={team.shortName} className="w-full h-full" />
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-white leading-tight">{team.name}</p>
              <p className="text-xs text-white/40">{team.shortName} · ELO {team.strength}</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Standing summary */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Position", value: `#${rank}`, color: rank <= 2 ? "#4ADE80" : rank === 3 ? GOLD : "rgba(255,255,255,0.4)" },
              { label: "Points",   value: `${standing.pts}`, color: standing.pts > 0 ? "#FBBF24" : "rgba(255,255,255,0.4)" },
              { label: "GF–GA",    value: `${standing.gf}–${standing.ga}`, color: "rgba(255,255,255,0.7)" },
              { label: "Record",   value: `${standing.w}W ${standing.d}D ${standing.l}L`, color: "rgba(255,255,255,0.5)" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-2.5 text-center">
                <p className="text-[8px] text-white/30 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-xs font-black leading-tight" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Qualification status */}
          <div className={`rounded-xl px-3 py-2.5 flex items-center gap-2.5 border ${
            rank <= 2
              ? "border-emerald-500/25 bg-emerald-500/8"
              : rank === 3
              ? "border-[#FBBF24]/25 bg-[#FBBF24]/8"
              : "border-red-500/20 bg-red-500/5"
          }`}>
            <div className={`w-2 h-2 rounded-full shrink-0 ${rank <= 2 ? "bg-emerald-400" : rank === 3 ? "bg-[#FBBF24]" : "bg-red-400"}`} />
            <p className="text-xs text-white/70">
              {rank <= 2
                ? "Currently qualifying for Round of 32"
                : rank === 3
                ? "3rd place — may advance as best 3rd"
                : "Outside qualifying positions"}
            </p>
          </div>

          {/* Group matches */}
          <div>
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2">Group Matches</p>
            <div className="space-y-2">
              {teamMatches.map((match, i) => {
                const isHome = match.home === teamId;
                const opponentId = isHome ? match.away : match.home;
                const opponent = WC_TEAMS[opponentId];
                if (!opponent) return null;
                const isDone = match.status === "completed";
                const teamScore = isHome ? match.homeScore : match.awayScore;
                const oppScore = isHome ? match.awayScore : match.homeScore;
                const result = isDone
                  ? teamScore! > oppScore! ? "W" : teamScore! < oppScore! ? "L" : "D"
                  : null;
                const resultColor = result === "W" ? "#4ADE80" : result === "L" ? "#F87171" : result === "D" ? GOLD : undefined;

                return (
                  <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 flex items-center gap-3">
                    {/* Opponent flag + name */}
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0">
                      <FlagImg code={opponent.countryCode} name={opponent.shortName} className="w-full h-full" small />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white">
                        {isHome ? "vs" : "@"} {opponent.name}
                      </p>
                      <p className="text-[9px] text-white/30">{match.date} · {match.time} · {match.venue.split(",")[0]}</p>
                    </div>
                    {isDone ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-black text-white">
                          {teamScore}–{oppScore}
                        </span>
                        {result && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                            style={{ background: `${resultColor}20`, color: resultColor, border: `1px solid ${resultColor}30` }}>
                            {result}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-white/30 shrink-0">
                        <Clock size={10} />
                        <span className="text-[9px]">Upcoming</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Win probability vs group opponents */}
          <div>
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <TrendingUp size={9} />
              ELO Win Probability vs Group
            </p>
            <div className="space-y-2">
              {otherTeams.map((opp) => {
                const oppTeam = WC_TEAMS[opp.teamId];
                if (!oppTeam) return null;
                const prob = Math.round(eloWinProb(team.strength, oppTeam.strength) * 100);
                return (
                  <div key={opp.teamId} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded overflow-hidden border border-white/10 shrink-0">
                      <FlagImg code={oppTeam.countryCode} name={oppTeam.shortName} className="w-full h-full" small />
                    </div>
                    <span className="text-[10px] text-white/50 w-8">{oppTeam.shortName}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${prob}%`,
                          background: prob >= 60 ? "#4ADE80" : prob >= 45 ? GOLD : "#F87171",
                        }} />
                    </div>
                    <span className="text-[10px] font-black text-white/70 w-8 text-right">{prob}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ELO strength vs world */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 flex items-center gap-3">
            <Shield size={18} className="text-white/30 shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-xs font-black text-white">ELO Strength: {team.strength}</p>
              <p className="text-[10px] text-white/35">
                {team.strength >= 1900 ? "World class — top 5 team" :
                 team.strength >= 1800 ? "Elite — top 10 contender" :
                 team.strength >= 1700 ? "Strong — legitimate threat" :
                 team.strength >= 1600 ? "Competitive — can cause upsets" :
                 "Underdog — group stage focus"}
              </p>
            </div>
          </div>

          {/* Goalscorer goals from team matches */}
          {(() => {
            const goals = teamMatches.flatMap((m) =>
              m.goals.filter((g) => g.teamId === teamId).map((g) => ({ ...g, matchDate: m.date }))
            );
            if (!goals.length) return null;
            return (
              <div>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Target size={9} />
                  Goalscorers
                </p>
                <div className="flex flex-wrap gap-2">
                  {goals.map((g, i) => (
                    <div key={i} className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-2.5 py-1.5 flex items-center gap-1.5">
                      <span className="text-sm">⚽</span>
                      <div>
                        <p className="text-[10px] font-bold text-white leading-tight">{g.scorer}</p>
                        <p className="text-[8px] text-white/30">{g.min}&apos; · {g.matchDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Group Card ────────────────────────────────────────────────────────────────

function GroupCard({
  group,
  onTeamClick,
  predictions,
}: {
  group: WCGroup;
  onTeamClick: (teamId: string, group: WCGroup) => void;
  predictions?: GroupPrediction;
}) {
  const [expanded, setExpanded] = useState(false);
  const sorted = sortedStandings(group.teams);
  const completedMatches = group.matches.filter((m) => m.status === "completed");
  const upcomingMatches  = group.matches.filter((m) => m.status !== "completed");
  const displayMatches   = expanded ? group.matches : [...completedMatches, ...upcomingMatches].slice(0, 3);
  const hasMore          = group.matches.length > 3;
  const accentColor      = GROUP_COLORS[group.id] ?? GOLD;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/[0.07] bg-[#0D1420] overflow-hidden"
    >
      {/* Group header */}
      <div className="px-4 py-3 border-b border-white/[0.07]" style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: accentColor }}>
            GROUP {group.id}
          </span>
          <div className="flex items-center gap-1.5 text-[9px] text-white/30">
            <CheckCircle2 size={10} />
            <span>{completedMatches.length}/6</span>
          </div>
        </div>
      </div>

      {/* Standings — clickable rows */}
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
            <button
              key={standing.teamId}
              onClick={() => onTeamClick(standing.teamId, group)}
              className={`w-full flex items-center gap-1 px-1 py-1.5 rounded-lg mb-0.5 text-left transition-colors hover:bg-white/[0.06] active:scale-[0.98] ${
                isQualifying ? "bg-white/[0.03]" : ""
              }`}
            >
              {isQualifying && (
                <div className="w-0.5 h-4 rounded-full mr-0.5 shrink-0" style={{ background: accentColor }} />
              )}
              {!isQualifying && <div className="w-1 mr-0.5 shrink-0" />}
              <div className="w-4 h-4 rounded-full overflow-hidden border border-white/10 shrink-0">
                <FlagImg code={team.countryCode} name={team.shortName} className="w-full h-full" small />
              </div>
              <span className="flex-1 text-[11px] font-bold text-white/80 truncate min-w-0 ml-1">{team.shortName}</span>
              {[standing.p, standing.w, standing.d, standing.l, standing.gf, standing.ga].map((val, i) => (
                <span key={i} className="w-5 text-center text-[11px] text-white/50">{val}</span>
              ))}
              <span className={`w-5 text-center text-[11px] font-black ${standing.pts > 0 ? "text-white" : "text-white/40"}`}>
                {standing.pts}
              </span>
            </button>
          );
        })}
      </div>

      <div className="h-px bg-white/[0.05] mx-3" />

      {/* Matches */}
      <div className="px-3 py-2 space-y-1.5">
        {displayMatches.map((match: GSMatch, i: number) => {
          const home = WC_TEAMS[match.home];
          const away = WC_TEAMS[match.away];
          if (!home || !away) return null;
          const isDone = match.status === "completed";
          const isLive = match.status === "live";

          const pred: MatchPrediction | undefined = !isDone
            ? predictions?.matches.find((p) => p.home === match.home && p.away === match.away)
            : undefined;

          return (
            <div key={i}>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                  <span className={`text-[10px] font-bold truncate ${
                    isDone && match.homeScore! > match.awayScore! ? "text-white" :
                    isDone ? "text-white/35" : "text-white/70"
                  }`}>{home.shortName}</span>
                  <div className="w-4 h-4 rounded-full overflow-hidden border border-white/10 shrink-0">
                    <FlagImg code={home.countryCode} name={home.shortName} className="w-full h-full" small />
                  </div>
                </div>
                <div className="flex items-center justify-center shrink-0 min-w-[52px]">
                  {isDone || isLive ? (
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-black text-white">
                        {match.homeScore} – {match.awayScore}
                      </span>
                      {isLive && (
                        <motion.span
                          className="text-[8px] font-black text-red-400 uppercase"
                          animate={{ opacity: [1, 0.4, 1] }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                        >
                          LIVE
                        </motion.span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-bold text-white/35">{match.date}</span>
                      <span className="text-[8px] text-white/20">{match.time}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div className="w-4 h-4 rounded-full overflow-hidden border border-white/10 shrink-0">
                    <FlagImg code={away.countryCode} name={away.shortName} className="w-full h-full" small />
                  </div>
                  <span className={`text-[10px] font-bold truncate ${
                    isDone && match.awayScore! > match.homeScore! ? "text-white" :
                    isDone ? "text-white/35" : "text-white/70"
                  }`}>{away.shortName}</span>
                </div>
              </div>
              {isDone && match.goals.length > 0 && (
                <div className="mt-0.5 px-1 flex flex-wrap gap-x-3 gap-y-0.5">
                  {match.goals.map((g, gi) => (
                    <span key={gi} className={`text-[8px] text-white/30 ${g.teamId === match.home ? "" : "ml-auto"}`}>
                      ⚽ {g.scorer} {g.min}&apos;
                    </span>
                  ))}
                </div>
              )}
              {!isDone && pred && (
                <div className="mt-0.5 flex justify-center">
                  <div className="inline-flex items-center gap-1 rounded-full bg-[#818CF8]/[0.10] border border-[#818CF8]/20 px-2 py-0.5">
                    <Cpu size={7} className="text-[#818CF8]" />
                    <span className="text-[8px] font-bold text-[#818CF8]">
                      AI Pick: {pred.predictedHome}–{pred.predictedAway}
                    </span>
                    <span className="text-[7px] text-[#818CF8]/50">({pred.confidence}%)</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

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

// ── Main component ────────────────────────────────────────────────────────────

export function GroupStage() {
  const [filterGroup, setFilterGroup] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<{ teamId: string; group: WCGroup } | null>(null);
  const [groups, setGroups] = useState<WCGroup[]>(WC_GROUPS);
  const [predictions, setPredictions] = useState<GroupPrediction[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [groupsRes, predsRes] = await Promise.all([
          fetch("/api/worldcup/groups"),
          fetch("/api/worldcup/predictions"),
        ]);
        if (groupsRes.ok) {
          const { groups: g } = await groupsRes.json();
          if (g?.length) setGroups(g);
        }
        if (predsRes.ok) {
          const { predictions: p } = await predsRes.json();
          if (p?.length) setPredictions(p);
        }
      } catch {
        // keep static fallback
      }
    }

    loadData();
    pollRef.current = setInterval(loadData, 60_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const displayed = filterGroup
    ? groups.filter((g) => g.id === filterGroup)
    : groups;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-[#FBBF24]" strokeWidth={2.2} />
          <h2 className="text-lg font-black text-white">Group Stage</h2>
          <span className="text-xs text-white/30 font-medium">June 11 – 27, 2026</span>
        </div>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {displayed.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onTeamClick={(teamId, grp) => setSelectedTeam({ teamId, group: grp })}
              predictions={predictions.find((p) => p.groupId === group.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      <p className="mt-6 text-[10px] text-white/15">
        Groups A–L · 48 teams · Top 2 advance + 8 best 3rd place teams · Tap a team for details
      </p>

      {/* Team detail modal */}
      <AnimatePresence>
        {selectedTeam && (
          <TeamModal
            teamId={selectedTeam.teamId}
            group={groups.find((g) => g.id === selectedTeam.group.id) ?? selectedTeam.group}
            onClose={() => setSelectedTeam(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
