"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, ChevronRight, X, Star, Shield, Zap, Target, Clock,
  BarChart3, Minus, ChevronDown, Check,
} from "lucide-react";
import { WC_TEAMS } from "@/lib/worldcup/data";
import type { WCPlayer, WCTeam } from "@/lib/worldcup/types";

const GOLD  = "#FBBF24";
const BLUE  = "#38BDF8";
const CORAL = "#FF7828";

// ── Static mock player data (replaced by API-Football in production) ──────────

function mockPlayers(teamId: string, side: "home" | "away"): WCPlayer[] {
  const positionGroups: Array<[WCPlayer["position"], number, number[]]> = [
    ["Goalkeeper", 1, [50]],
    ["Defender",   4, [25, 38, 62, 75]],
    ["Midfielder", 3, [33, 50, 67]],
    ["Attacker",   3, [25, 50, 75]],
  ];

  const players: WCPlayer[] = [];
  let jersey = 1;

  positionGroups.forEach(([pos, count, xPositions]) => {
    const depthMap: Record<WCPlayer["position"], number> = {
      Goalkeeper: 8, Defender: 28, Midfielder: 55, Attacker: 80,
    };
    const baseDepth = depthMap[pos];
    const pitchDepth = side === "home" ? baseDepth : 100 - baseDepth;

    for (let i = 0; i < count; i++) {
      const goals   = pos === "Attacker" ? Math.floor(Math.random() * 6) : 0;
      const assists = Math.floor(Math.random() * 4);
      players.push({
        id: jersey + (side === "away" ? 100 : 0),
        name: `Player ${jersey}`,
        firstname: "Player",
        lastname: `${jersey}`,
        age: 24 + Math.floor(Math.random() * 8),
        nationality: teamId.toUpperCase(),
        teamId: 0,
        teamName: WC_TEAMS[teamId]?.name ?? teamId,
        position: pos,
        pitchX: xPositions[i] ?? 50,
        pitchY: pitchDepth,
        jerseyNumber: jersey,
        stats: {
          goals,
          assists,
          appearances: 5 + Math.floor(Math.random() * 5),
          minutesPlayed: 400 + Math.floor(Math.random() * 200),
          yellowCards: Math.floor(Math.random() * 3),
          redCards: 0,
          shotsTotal: goals * 4 + Math.floor(Math.random() * 6),
          shotsOnTarget: goals * 2 + Math.floor(Math.random() * 3),
          passAccuracy: 70 + Math.floor(Math.random() * 20),
          rating: 6 + Math.random() * 2.5,
        },
      });
      jersey++;
    }
  });
  return players;
}

// ── Position color ────────────────────────────────────────────────────────────

function posColor(pos: WCPlayer["position"]): string {
  const map: Record<WCPlayer["position"], string> = {
    Goalkeeper: "#FBBF24",
    Defender:   "#60A5FA",
    Midfielder: "#818CF8",
    Attacker:   "#F87171",
  };
  return map[pos];
}

// ── Player Dot on pitch ───────────────────────────────────────────────────────

function PlayerDot({
  player, isSelected, onClick,
}: {
  player: WCPlayer;
  isSelected: boolean;
  onClick: (p: WCPlayer) => void;
}) {
  const color = posColor(player.position);
  const x = `${player.pitchX}%`;
  const y = `${player.pitchY}%`;

  return (
    <motion.button
      onClick={() => onClick(player)}
      className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 z-10"
      style={{ left: x, top: y }}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.95 }}
      animate={isSelected ? { scale: [1, 1.15, 1.05] } : { scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all ${
          isSelected ? "shadow-lg" : ""
        }`}
        style={{
          background: `${color}25`,
          borderColor: isSelected ? color : `${color}60`,
          color,
          boxShadow: isSelected ? `0 0 10px ${color}60` : undefined,
        }}
      >
        {player.jerseyNumber}
      </div>
      <span className="text-[8px] text-white/60 font-medium whitespace-nowrap bg-[#060C18]/80 px-1 rounded">
        {player.lastname}
      </span>
    </motion.button>
  );
}

// ── Pitch ─────────────────────────────────────────────────────────────────────

function VirtualPitch({
  homePlayers, awayPlayers, selectedPlayer, onSelect,
}: {
  homePlayers: WCPlayer[];
  awayPlayers: WCPlayer[];
  selectedPlayer: WCPlayer | null;
  onSelect: (p: WCPlayer) => void;
}) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "1.6 / 1" }}>
      {/* Pitch background */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #1a3a1a 0%, #164a16 50%, #1a3a1a 100%)",
        }}
      />

      {/* Pitch markings */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62.5" preserveAspectRatio="none">
        {/* Outer boundary */}
        <rect x="3" y="2" width="94" height="58.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
        {/* Center line */}
        <line x1="50" y1="2" x2="50" y2="60.5" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
        {/* Center circle */}
        <circle cx="50" cy="31.25" r="9.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
        <circle cx="50" cy="31.25" r="0.6" fill="rgba(255,255,255,0.3)" />
        {/* Left penalty box */}
        <rect x="3" y="14" width="17" height="34.5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.4" />
        <rect x="3" y="21" width="7" height="20.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.4" />
        <circle cx="14" cy="31.25" r="0.6" fill="rgba(255,255,255,0.2)" />
        {/* Right penalty box */}
        <rect x="80" y="14" width="17" height="34.5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.4" />
        <rect x="90" y="21" width="7" height="20.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.4" />
        <circle cx="86" cy="31.25" r="0.6" fill="rgba(255,255,255,0.2)" />
      </svg>

      {/* Home players */}
      {homePlayers.map((p) => (
        <PlayerDot
          key={p.id}
          player={p}
          isSelected={selectedPlayer?.id === p.id}
          onClick={onSelect}
        />
      ))}

      {/* Away players */}
      {awayPlayers.map((p) => (
        <PlayerDot
          key={p.id}
          player={p}
          isSelected={selectedPlayer?.id === p.id}
          onClick={onSelect}
        />
      ))}
    </div>
  );
}

// ── Player Stats Panel ────────────────────────────────────────────────────────

function PlayerPanel({ player, onClose }: { player: WCPlayer; onClose: () => void }) {
  const color = posColor(player.position);
  const stats = player.stats;

  const statItems = stats ? [
    { label: "Goals",       value: stats.goals,                icon: Target },
    { label: "Assists",     value: stats.assists,              icon: Zap },
    { label: "Appearances", value: stats.appearances,          icon: Users },
    { label: "Minutes",     value: stats.minutesPlayed,        icon: Clock },
    { label: "Shots",       value: stats.shotsTotal,           icon: BarChart3 },
    { label: "Acc%",        value: `${stats.passAccuracy}%`,   icon: Shield },
  ] : [];

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="absolute inset-y-0 right-0 w-56 rounded-r-2xl border-l border-white/[0.08] bg-[#0A1020]/95 backdrop-blur-xl z-20 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div>
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider mb-2"
            style={{ background: `${color}15`, color }}
          >
            {player.position}
          </div>
          <p className="text-sm font-black text-white">{player.name}</p>
          <p className="text-[10px] text-white/40 mt-0.5">{player.teamName} · #{player.jerseyNumber}</p>
        </div>
        <button onClick={onClose} className="text-white/25 hover:text-white transition-colors mt-0.5">
          <X size={14} strokeWidth={2} />
        </button>
      </div>

      {/* Rating */}
      {stats?.rating && (
        <div className="mx-4 mb-3 rounded-xl bg-white/[0.04] p-3 flex items-center justify-between">
          <span className="text-xs text-white/40">WC Rating</span>
          <div className="flex items-center gap-1">
            <Star size={11} className="text-[#FBBF24]" fill="currentColor" />
            <span className="text-sm font-black text-[#FBBF24]">{stats.rating.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-2 gap-2">
          {statItems.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl bg-white/[0.03] p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={9} className="text-white/25" strokeWidth={2} />
                <span className="text-[9px] text-white/30 uppercase tracking-wider">{label}</span>
              </div>
              <span className="text-sm font-black text-white/80">{value}</span>
            </div>
          ))}
        </div>

        {/* Cards */}
        {stats && (
          <div className="mt-2 flex gap-2">
            <div className="flex-1 rounded-xl bg-[#FBBF24]/[0.07] border border-[#FBBF24]/15 p-2.5 text-center">
              <p className="text-[9px] text-[#FBBF24]/60 uppercase tracking-wider">Yellow</p>
              <p className="text-sm font-black text-[#FBBF24]">{stats.yellowCards}</p>
            </div>
            <div className="flex-1 rounded-xl bg-[#F87171]/[0.07] border border-[#F87171]/15 p-2.5 text-center">
              <p className="text-[9px] text-[#F87171]/60 uppercase tracking-wider">Red</p>
              <p className="text-sm font-black text-[#F87171]">{stats.redCards}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Team Comparison Bar ───────────────────────────────────────────────────────

function ComparisonBar({ label, homeVal, awayVal, higherIsBetter = true }: {
  label: string;
  homeVal: number;
  awayVal: number;
  higherIsBetter?: boolean;
}) {
  const total = homeVal + awayVal;
  const homePct = total === 0 ? 50 : (homeVal / total) * 100;
  const homeBetter = higherIsBetter ? homeVal >= awayVal : homeVal <= awayVal;
  const awayBetter = !homeBetter;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[9px]">
        <span className={`font-bold ${homeBetter ? "text-[#38BDF8]" : "text-white/40"}`}>{homeVal}</span>
        <span className="text-white/30 uppercase tracking-wider">{label}</span>
        <span className={`font-bold ${awayBetter ? "text-[#F87171]" : "text-white/40"}`}>{awayVal}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-white/[0.05]">
        <motion.div
          className="h-full rounded-l-full bg-[#38BDF8]"
          initial={{ width: 0 }}
          animate={{ width: `${homePct}%` }}
          transition={{ duration: 0.7 }}
        />
        <motion.div
          className="h-full rounded-r-full bg-[#F87171]"
          initial={{ width: 0 }}
          animate={{ width: `${100 - homePct}%` }}
          transition={{ duration: 0.7 }}
        />
      </div>
    </div>
  );
}

// ── Team Selector ─────────────────────────────────────────────────────────────

function TeamSelector({
  value, onChange, exclude, label,
}: {
  value: string;
  onChange: (id: string) => void;
  exclude: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const teams = Object.values(WC_TEAMS).filter((t) => t.id !== exclude);
  const selected = WC_TEAMS[value];

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div className="flex-1 relative" ref={ref}>
      <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1.5">{label}</p>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 bg-[#0D1420] border border-white/[0.1] rounded-xl px-3 py-2.5 text-left hover:border-white/[0.22] transition-colors"
      >
        {selected && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`https://flagcdn.com/w40/${selected.countryCode.toLowerCase()}.png`}
            alt={selected.name}
            className="w-5 h-4 rounded object-cover shrink-0"
          />
        )}
        <span className="text-xs font-bold text-white/85 flex-1 truncate">{selected?.name ?? "Select team"}</span>
        <ChevronDown size={13} className={`text-white/30 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#0D1420] border border-white/[0.12] rounded-xl overflow-hidden shadow-2xl"
            style={{ maxHeight: 240 }}
          >
            <div className="overflow-y-auto" style={{ maxHeight: 240 }}>
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { onChange(t.id); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                    t.id === value ? "bg-[#38BDF8]/[0.08]" : "hover:bg-white/[0.05]"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/w40/${t.countryCode.toLowerCase()}.png`}
                    alt={t.name}
                    className="w-5 h-4 rounded object-cover shrink-0"
                  />
                  <span className="text-xs font-medium text-white/80 flex-1 truncate">{t.name}</span>
                  {t.id === value && <Check size={11} className="text-[#38BDF8] shrink-0" strokeWidth={2.5} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function H2HMatchup() {
  const teamIds = Object.keys(WC_TEAMS);
  const [homeId, setHomeId] = useState(teamIds[0] ?? "fra");
  const [awayId, setAwayId] = useState(teamIds[1] ?? "esp");
  const [selectedPlayer, setSelectedPlayer] = useState<WCPlayer | null>(null);

  const homeTeam = WC_TEAMS[homeId];
  const awayTeam = WC_TEAMS[awayId];

  const homePlayers = mockPlayers(homeId, "home");
  const awayPlayers = mockPlayers(awayId, "away");

  const homeGoals   = homePlayers.reduce((s, p) => s + (p.stats?.goals ?? 0), 0);
  const awayGoals   = awayPlayers.reduce((s, p) => s + (p.stats?.goals ?? 0), 0);
  const homeShots   = homePlayers.reduce((s, p) => s + (p.stats?.shotsOnTarget ?? 0), 0);
  const awayShots   = awayPlayers.reduce((s, p) => s + (p.stats?.shotsOnTarget ?? 0), 0);
  const homeAcc     = Math.round(homePlayers.reduce((s, p) => s + (p.stats?.passAccuracy ?? 0), 0) / homePlayers.length);
  const awayAcc     = Math.round(awayPlayers.reduce((s, p) => s + (p.stats?.passAccuracy ?? 0), 0) / awayPlayers.length);

  const handleSelectPlayer = useCallback((p: WCPlayer) => {
    setSelectedPlayer((prev) => (prev?.id === p.id ? null : p));
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-[#818CF8]/25 bg-[#818CF8]/[0.08] px-3 py-1.5">
          <Users size={11} className="text-[#818CF8]" strokeWidth={2.5} />
          <span className="text-[10px] font-black text-[#818CF8] tracking-widest uppercase">
            H2H Matchup
          </span>
        </div>
        <span className="text-[10px] text-white/30">Click a player for stats</span>
      </div>

      {/* Team selectors */}
      <div className="flex items-end gap-3">
        <TeamSelector value={homeId} onChange={setHomeId} exclude={awayId} label="Home" />
        <div className="pb-2 text-white/20 font-black text-sm">vs</div>
        <TeamSelector value={awayId} onChange={setAwayId} exclude={homeId} label="Away" />
      </div>

      {/* Team headers */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://flagcdn.com/w40/${homeTeam?.countryCode ?? "xx"}.png`}
            alt={homeTeam?.name}
            className="w-6 h-6 rounded-full object-cover border border-[#38BDF8]/30"
          />
          <span className="text-sm font-black text-[#38BDF8]">{homeTeam?.name}</span>
          <span className="text-[10px] text-white/30">ELO {homeTeam?.strength}</span>
        </div>
        <Minus size={12} className="text-white/20" />
        <div className="flex items-center gap-2 flex-row-reverse">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://flagcdn.com/w40/${awayTeam?.countryCode ?? "xx"}.png`}
            alt={awayTeam?.name}
            className="w-6 h-6 rounded-full object-cover border border-[#F87171]/30"
          />
          <span className="text-sm font-black text-[#F87171]">{awayTeam?.name}</span>
          <span className="text-[10px] text-white/30">ELO {awayTeam?.strength}</span>
        </div>
      </div>

      {/* Virtual pitch */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.07]">
        <VirtualPitch
          homePlayers={homePlayers}
          awayPlayers={awayPlayers}
          selectedPlayer={selectedPlayer}
          onSelect={handleSelectPlayer}
        />

        <AnimatePresence>
          {selectedPlayer && (
            <PlayerPanel player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
          )}
        </AnimatePresence>
      </div>

      {/* Stats comparison */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0D1420] p-4 space-y-3">
        <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-3">Tournament Stats Comparison</p>
        <ComparisonBar label="Goals"          homeVal={homeGoals}  awayVal={awayGoals}  />
        <ComparisonBar label="Shots on Target" homeVal={homeShots}  awayVal={awayShots}  />
        <ComparisonBar label="Pass Accuracy %"  homeVal={homeAcc}   awayVal={awayAcc}    />
        <ComparisonBar
          label="ELO Strength"
          homeVal={homeTeam?.strength ?? 0}
          awayVal={awayTeam?.strength ?? 0}
        />
      </div>

      <p className="text-[9px] text-white/20 text-center">
        Live lineup data via API-Football · Click player dots for individual stats
      </p>
    </div>
  );
}
