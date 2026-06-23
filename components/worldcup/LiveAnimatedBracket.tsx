"use client";

import { useState, useRef, useLayoutEffect, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import {
  Trophy, Cpu, Settings, X, ChevronRight, Zap, RotateCcw,
  Clock, MapPin, Play, Check, Minus,
} from "lucide-react";
import { INITIAL_BRACKET, WC_TEAMS, eloWinProb } from "@/lib/worldcup/data";
import type { BracketState, BracketMatch, RoundKey } from "@/lib/worldcup/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const CARD_W   = 162;   // match card width (px)
const CARD_H   = 70;    // match card height (px)
const COL_GAP  = 40;    // horizontal gap between rounds
const BRACKET_H = 700; // total bracket height (px)

// Round columns in display order (left-to-right for upper half, mirrored right for lower)
const UPPER_ROUNDS: RoundKey[] = ["r32", "r16", "qf", "sf"];
const LOWER_ROUNDS: RoundKey[] = ["r32", "r16", "qf", "sf"];

const ROUND_LABELS: Record<RoundKey, string> = {
  r32:   "Round of 32",
  r16:   "Round of 16",
  qf:    "Quarter-Final",
  sf:    "Semi-Final",
  final: "Final",
  "3rd": "3rd Place",
};

// Accent colors
const GOLD   = "#FBBF24";
const BLUE   = "#38BDF8";
const CORAL  = "#FF7828";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt12h(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

function flagUrl(countryCode: string) {
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
}

function fmtOddsFromProb(prob: number): string {
  if (prob <= 0 || prob >= 1) return "—";
  if (prob >= 0.5) return `-${Math.round(prob / (1 - prob) * 100)}`;
  return `+${Math.round((1 - prob) / prob * 100)}`;
}

/** Advance winner in bracket state — propagates through rounds */
function advanceWinner(state: BracketState, matchId: string, winner: "top" | "bottom"): BracketState {
  const match = state.matches[matchId];
  if (!match || match.status === "completed") return state;

  const winnerTeamId = winner === "top" ? match.topTeamId : match.bottomTeamId;
  const loserTeamId  = winner === "top" ? match.bottomTeamId : match.topTeamId;

  const updated = {
    ...state.matches,
    [matchId]: {
      ...match,
      winner,
      status: "completed" as const,
      topScore:    match.topScore    ?? (winner === "top" ? 2 : 1),
      bottomScore: match.bottomScore ?? (winner === "top" ? 1 : 2),
    },
  };

  // Propagate to next match
  if (match.nextMatchId && match.nextSlot && winnerTeamId) {
    const nextMatch = updated[match.nextMatchId];
    updated[match.nextMatchId] = {
      ...nextMatch,
      topTeamId:    match.nextSlot === "top"    ? winnerTeamId : nextMatch.topTeamId,
      bottomTeamId: match.nextSlot === "bottom" ? winnerTeamId : nextMatch.bottomTeamId,
      topWinProb: (() => {
        const topT  = match.nextSlot === "top"    ? WC_TEAMS[winnerTeamId]  : (nextMatch.topTeamId    ? WC_TEAMS[nextMatch.topTeamId]    : null);
        const botT  = match.nextSlot === "bottom" ? WC_TEAMS[winnerTeamId]  : (nextMatch.bottomTeamId ? WC_TEAMS[nextMatch.bottomTeamId] : null);
        return topT && botT ? eloWinProb(topT.strength, botT.strength) : 0.5;
      })(),
    };
  }

  // Handle SF losers going to 3rd-place match
  if (match.round === "sf") {
    const thirdMatch = updated["3rd_0"];
    if (loserTeamId) {
      const isUpperSF = match.id === "sf_0";
      updated["3rd_0"] = {
        ...thirdMatch,
        topTeamId:    isUpperSF ? loserTeamId  : thirdMatch.topTeamId,
        bottomTeamId: !isUpperSF ? loserTeamId : thirdMatch.bottomTeamId,
      };
    }
  }

  const champion = match.round === "final" && winnerTeamId ? winnerTeamId : state.championId;

  return { ...state, matches: updated, championId: champion };
}

/** Run ELO-based simulation through the whole bracket */
function runPredictor(state: BracketState): BracketState {
  let s = state;
  const roundOrder: RoundKey[] = ["r32", "r16", "qf", "sf", "final"];

  for (const round of roundOrder) {
    const matchIds = s.rounds[round];
    for (const id of matchIds) {
      const m = s.matches[id];
      if (m.status === "completed") continue;
      if (!m.topTeamId || !m.bottomTeamId) continue;

      const topT  = WC_TEAMS[m.topTeamId];
      const botT  = WC_TEAMS[m.bottomTeamId];
      if (!topT || !botT) continue;

      const prob = eloWinProb(topT.strength, botT.strength);
      const winner: "top" | "bottom" = Math.random() < prob ? "top" : "bottom";
      s = advanceWinner(s, id, winner);
    }
  }
  return s;
}

// ── Team Slot ─────────────────────────────────────────────────────────────────

function TeamSlot({
  teamId, score, pens, isWinner, isLoser, isTop, showProb, prob, onSetWinner,
}: {
  teamId: string | null;
  score: number | null;
  pens: number | null;
  isWinner: boolean;
  isLoser: boolean;
  isTop: boolean;
  showProb?: boolean;
  prob?: number;
  onSetWinner?: () => void;
}) {
  const team = teamId ? WC_TEAMS[teamId] : null;
  const controls = useAnimationControls();

  useEffect(() => {
    if (isWinner) {
      controls.start({ x: [0, -2, 2, -1, 1, 0], transition: { duration: 0.4 } });
    }
  }, [isWinner, controls]);

  return (
    <motion.div
      animate={controls}
      onClick={() => team && onSetWinner?.()}
      className={`flex items-center gap-2 px-2.5 py-1.5 relative transition-colors group ${
        team ? "cursor-pointer" : "cursor-default"
      } ${isTop ? "rounded-t-[10px]" : "rounded-b-[10px]"}`}
      style={{
        background: isWinner
          ? `linear-gradient(90deg, ${GOLD}15, transparent)`
          : isLoser
          ? "rgba(0,0,0,0.2)"
          : undefined,
      }}
      whileHover={team ? { backgroundColor: "rgba(255,255,255,0.03)" } : {}}
    >
      {/* Flag */}
      <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/10">
        {team ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={flagUrl(team.countryCode)}
            alt={team.shortName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-white/[0.05] flex items-center justify-center">
            <span className="text-[8px] text-white/20">?</span>
          </div>
        )}
      </div>

      {/* Name */}
      <span
        className={`flex-1 text-[11px] font-bold truncate ${
          isWinner ? "text-[#FBBF24]"
          : isLoser ? "text-white/25"
          : team    ? "text-white/80"
          : "text-white/25 italic"
        }`}
      >
        {team?.shortName ?? "TBD"}
      </span>

      {/* Win probability badge */}
      {showProb && prob !== undefined && team && !isWinner && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: `${BLUE}15`, color: BLUE }}
        >
          {Math.round(prob * 100)}%
        </motion.span>
      )}

      {/* Score */}
      {score !== null && (
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-sm font-black min-w-[18px] text-center ${
            isWinner ? "text-[#FBBF24]" : isLoser ? "text-white/25" : "text-white/70"
          }`}
        >
          {score}
          {pens !== null && (
            <span className="text-[9px] font-normal text-white/40 ml-0.5">({pens})</span>
          )}
        </motion.span>
      )}

      {/* Winner check */}
      {isWinner && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-4 h-4 rounded-full bg-[#FBBF24]/20 flex items-center justify-center shrink-0"
        >
          <Check size={9} className="text-[#FBBF24]" strokeWidth={3} />
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Match Card ────────────────────────────────────────────────────────────────

function MatchCard({
  match, showProb, onSetWinner, cardRef,
}: {
  match: BracketMatch;
  showProb?: boolean;
  onSetWinner: (matchId: string, side: "top" | "bottom") => void;
  cardRef: (el: HTMLDivElement | null) => void;
}) {
  const isLive      = match.status === "live";
  const isCompleted = match.status === "completed";
  const isFinal     = match.round === "final";

  const borderColor = isLive ? BLUE : isFinal ? GOLD : "rgba(255,255,255,0.07)";

  return (
    <div
      ref={cardRef}
      style={{ width: CARD_W, minHeight: CARD_H }}
      className="relative flex flex-col rounded-xl overflow-hidden"
    >
      {/* Border glow for live / final */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        animate={{
          boxShadow: isLive
            ? `0 0 12px ${BLUE}40, inset 0 0 0 1px ${BLUE}40`
            : isFinal
            ? `0 0 16px ${GOLD}30, inset 0 0 0 1px ${GOLD}30`
            : `inset 0 0 0 1px rgba(255,255,255,0.07)`,
        }}
        transition={{ duration: 0.4 }}
      />

      {/* Background */}
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          background: isFinal
            ? `linear-gradient(135deg, #1A1505, #0E0E16)`
            : "#0D1420",
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Live badge */}
        {isLive && (
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="absolute -top-0.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-[#38BDF8]/15 border border-[#38BDF8]/30 rounded-full px-2 py-px text-[8px] font-black text-[#38BDF8] uppercase tracking-wider"
          >
            <span className="w-1 h-1 rounded-full bg-[#38BDF8] animate-pulse" />
            LIVE
          </motion.div>
        )}

        {/* Top team */}
        <TeamSlot
          teamId={match.topTeamId}
          score={match.topScore}
          pens={match.topPens}
          isWinner={match.winner === "top"}
          isLoser={match.winner === "bottom"}
          isTop
          showProb={showProb}
          prob={match.topWinProb}
          onSetWinner={() => onSetWinner(match.id, "top")}
        />

        {/* Divider */}
        <div className="relative flex items-center px-2.5">
          <div className="flex-1 h-px bg-white/[0.06]" />
          {/* Match info */}
          <div className="flex items-center gap-1 px-1.5">
            <Clock size={7} className="text-white/20" strokeWidth={2} />
            <span className="text-[8px] text-white/25">{fmt12h(match.time)}</span>
          </div>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* Bottom team */}
        <TeamSlot
          teamId={match.bottomTeamId}
          score={match.bottomScore}
          pens={match.bottomPens}
          isWinner={match.winner === "bottom"}
          isLoser={match.winner === "top"}
          isTop={false}
          showProb={showProb}
          prob={match.topWinProb !== undefined ? 1 - match.topWinProb : undefined}
          onSetWinner={() => onSetWinner(match.id, "bottom")}
        />

        {/* Venue (shown only in larger rounds) */}
        {(match.round === "sf" || match.round === "final" || match.round === "3rd") && (
          <div className="flex items-center gap-1 px-2.5 pb-1.5 mt-0.5">
            <MapPin size={7} className="text-white/20" strokeWidth={2} />
            <span className="text-[8px] text-white/25 truncate">{match.city}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SVG Bracket Connectors ────────────────────────────────────────────────────

function BracketConnectors({
  containerRef, matchRefs, matches, isRight,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  matchRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  matches: Record<string, BracketMatch>;
  isRight: boolean;
}) {
  const [paths, setPaths] = useState<Array<{ d: string; id: string; isCompleted: boolean }>>([]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newPaths: Array<{ d: string; id: string; isCompleted: boolean }> = [];

    // Group matches by their destination
    const byDest = new Map<string, BracketMatch[]>();
    Object.values(matches).forEach((m) => {
      if (!m.nextMatchId) return;
      const existing = byDest.get(m.nextMatchId) ?? [];
      byDest.set(m.nextMatchId, [...existing, m]);
    });

    byDest.forEach((sources, destId) => {
      const destEl = matchRefs.current.get(destId);
      if (!destEl) return;

      const sortedSources = [...sources].sort((a, b) => a.position - b.position);
      const destRect = destEl.getBoundingClientRect();
      const destCY = destRect.top + destRect.height / 2 - containerRect.top;

      sortedSources.forEach((src, i) => {
        const srcEl = matchRefs.current.get(src.id);
        if (!srcEl) return;

        const srcRect = srcEl.getBoundingClientRect();
        const srcCY = srcRect.top + srcRect.height / 2 - containerRect.top;

        const srcX = isRight
          ? srcRect.left - containerRect.left
          : srcRect.right - containerRect.left;
        const destX = isRight
          ? destRect.right - containerRect.left
          : destRect.left - containerRect.left;

        const midX = isRight
          ? srcX - (srcX - destX) / 2
          : srcX + (destX - srcX) / 2;

        let d: string;
        if (i === 0) {
          // Top source: full path (horizontal → vertical → horizontal to dest)
          d = isRight
            ? `M ${srcX} ${srcCY} H ${midX} V ${destCY} H ${destX}`
            : `M ${srcX} ${srcCY} H ${midX} V ${destCY} H ${destX}`;
        } else {
          // Bottom source: short horizontal to midX (meets vertical from top path)
          d = `M ${srcX} ${srcCY} H ${midX}`;
        }

        const isCompleted = src.status === "completed";
        newPaths.push({ d, id: `${src.id}->${destId}`, isCompleted });
      });
    });

    const key = newPaths.map((p) => `${p.d}|${p.isCompleted}`).join(";");
    setPaths((prev) => {
      const prevKey = prev.map((p) => `${p.d}|${p.isCompleted}`).join(";");
      return prevKey === key ? prev : newPaths;
    });
  });

  return (
    <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 1 }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {paths.map(({ d, id, isCompleted }) => (
        <motion.path
          key={id}
          d={d}
          fill="none"
          stroke={isCompleted ? `${GOLD}60` : "rgba(255,255,255,0.1)"}
          strokeWidth={isCompleted ? 1.5 : 1}
          strokeDasharray={isCompleted ? undefined : "3 3"}
          filter={isCompleted ? "url(#glow)" : undefined}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
    </svg>
  );
}

// ── Bracket Column ────────────────────────────────────────────────────────────

function BracketColumn({
  roundKey, matchIds, matches, showProb, onSetWinner, matchRefs, isRight,
}: {
  roundKey: RoundKey;
  matchIds: string[];
  matches: Record<string, BracketMatch>;
  showProb: boolean;
  onSetWinner: (matchId: string, side: "top" | "bottom") => void;
  matchRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  isRight?: boolean;
}) {
  const roundMatches = matchIds.map((id) => matches[id]).filter(Boolean);

  return (
    <div className="flex flex-col items-center" style={{ width: CARD_W }}>
      {/* Round label */}
      <div className="mb-3 h-6">
        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">
          {ROUND_LABELS[roundKey]}
        </span>
      </div>

      {/* Match cards — use justify-around in fixed-height container for perfect alignment */}
      <div
        className="flex flex-col justify-around w-full"
        style={{ height: BRACKET_H - 36 }}
      >
        {roundMatches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            showProb={showProb}
            onSetWinner={onSetWinner}
            cardRef={(el) => {
              if (el) matchRefs.current.set(match.id, el);
              else matchRefs.current.delete(match.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Settings Panel ────────────────────────────────────────────────────────────

function BracketSettings({
  showProb, onToggleProb, onClose,
}: {
  showProb: boolean;
  onToggleProb: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="absolute top-12 right-0 z-30 w-52 rounded-2xl border border-white/[0.1] bg-[#0D1420]/95 backdrop-blur-xl shadow-2xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Bracket Settings</p>
        <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-xs text-white/60">Show Win %</span>
        <button
          onClick={onToggleProb}
          className={`relative w-9 h-5 rounded-full transition-colors ${showProb ? "bg-[#FBBF24]" : "bg-white/10"}`}
        >
          <motion.div
            animate={{ x: showProb ? 16 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
          />
        </button>
      </label>
    </motion.div>
  );
}

// ── Champion Banner ───────────────────────────────────────────────────────────

function ChampionBanner({ teamId, onDismiss }: { teamId: string; onDismiss: () => void }) {
  const team = WC_TEAMS[teamId];
  if (!team) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-[#060C18]/80 backdrop-blur-sm rounded-3xl"
    >
      <div className="relative rounded-3xl border border-[#FBBF24]/30 bg-[#0D1008] p-10 text-center max-w-sm shadow-2xl overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(251,191,36,0.15), transparent)" }} />
        <Trophy size={48} className="text-[#FBBF24] mx-auto mb-4" strokeWidth={1.5} />
        <p className="text-xs font-black text-[#FBBF24] tracking-widest uppercase mb-2">🏆 World Cup Champion</p>
        <div className="flex items-center justify-center gap-3 mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={flagUrl(team.countryCode)} alt={team.shortName} className="w-10 h-10 rounded-full object-cover border-2 border-[#FBBF24]/40" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          <p className="text-3xl font-black text-white">{team.name}</p>
        </div>
        <p className="text-sm text-white/40 mb-6">Prediction based on ELO ratings</p>
        <button onClick={onDismiss} className="text-xs text-white/30 hover:text-white transition-colors">Dismiss</button>
      </div>
    </motion.div>
  );
}

// ── useIsMobile ───────────────────────────────────────────────────────────────

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

// ── Mobile Match Card (full-width) ────────────────────────────────────────────

function MobileMatchCard({
  match, showProb, onSetWinner,
}: {
  match: BracketMatch;
  showProb: boolean;
  onSetWinner: (id: string, side: "top" | "bottom") => void;
}) {
  const topTeam    = match.topTeamId    ? WC_TEAMS[match.topTeamId]    : null;
  const bottomTeam = match.bottomTeamId ? WC_TEAMS[match.bottomTeamId] : null;
  const isLive     = match.status === "live";
  const isCompleted = match.status === "completed";
  const isFinal    = match.round === "final";

  const TeamRow = ({
    team, score, pens, isWinner, isLoser, side, prob,
  }: {
    team: typeof topTeam;
    score: number | null;
    pens: number | null;
    isWinner: boolean;
    isLoser: boolean;
    side: "top" | "bottom";
    prob?: number;
  }) => (
    <button
      onClick={() => team && !isCompleted && onSetWinner(match.id, side)}
      disabled={!team || isCompleted}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
        isWinner ? "bg-[#FBBF24]/10" : isLoser ? "opacity-40" : "hover:bg-white/[0.04] active:bg-white/[0.06]"
      } disabled:cursor-default`}
    >
      <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0 bg-white/5">
        {team ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={flagUrl(team.countryCode)} alt={team.shortName} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[9px] text-white/20 font-bold">TBD</span>
          </div>
        )}
      </div>
      <span className={`flex-1 text-sm font-bold text-left truncate ${isWinner ? "text-[#FBBF24]" : isLoser ? "text-white/30" : team ? "text-white/85" : "text-white/25 italic"}`}>
        {team?.name ?? "TBD"}
      </span>
      {showProb && prob !== undefined && team && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: `${BLUE}15`, color: BLUE }}>
          {Math.round(prob * 100)}%
        </span>
      )}
      {score !== null && (
        <span className={`text-lg font-black min-w-[24px] text-center shrink-0 ${isWinner ? "text-[#FBBF24]" : "text-white/50"}`}>
          {score}{pens !== null ? <span className="text-xs text-white/30">({pens})</span> : null}
        </span>
      )}
      {isWinner && <Check size={14} className="text-[#FBBF24] shrink-0" strokeWidth={2.5} />}
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden border"
      style={{
        borderColor: isLive ? `${BLUE}50` : isFinal ? `${GOLD}50` : "rgba(255,255,255,0.07)",
        background: isFinal ? "linear-gradient(135deg, #1A1505, #0E0E16)" : "#0D1420",
        boxShadow: isLive ? `0 0 16px ${BLUE}25` : isFinal ? `0 0 16px ${GOLD}20` : "none",
      }}
    >
      {(isLive || match.city) && (
        <div className="flex items-center gap-2 px-4 pt-2.5 pb-1">
          {isLive && (
            <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
              className="flex items-center gap-1 text-[10px] font-black text-[#38BDF8]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />LIVE
            </motion.span>
          )}
          {match.city && (
            <span className="text-[10px] text-white/25 flex items-center gap-1 ml-auto">
              <MapPin size={9} strokeWidth={2} />{match.city} · {fmt12h(match.time)}
            </span>
          )}
        </div>
      )}
      <TeamRow team={topTeam} score={match.topScore} pens={match.topPens}
        isWinner={match.winner === "top"} isLoser={match.winner === "bottom"}
        side="top" prob={match.topWinProb} />
      <div className="h-px bg-white/[0.06] mx-4" />
      <TeamRow team={bottomTeam} score={match.bottomScore} pens={match.bottomPens}
        isWinner={match.winner === "bottom"} isLoser={match.winner === "top"}
        side="bottom" prob={match.topWinProb !== undefined ? 1 - match.topWinProb : undefined} />
    </motion.div>
  );
}

// ── Mobile Bracket View ───────────────────────────────────────────────────────

const MOBILE_ROUNDS: { key: RoundKey; label: string; short: string }[] = [
  { key: "r32",   label: "Round of 32",   short: "R32"   },
  { key: "r16",   label: "Round of 16",   short: "R16"   },
  { key: "qf",    label: "Quarter-Final", short: "QF"    },
  { key: "sf",    label: "Semi-Final",    short: "SF"    },
  { key: "final", label: "Final",         short: "Final" },
];

function MobileBracketView({
  bracket, showProb, onSetWinner,
}: {
  bracket: BracketState;
  showProb: boolean;
  onSetWinner: (id: string, side: "top" | "bottom") => void;
}) {
  const [activeRound, setActiveRound] = useState<RoundKey>("r32");

  const matchIds = bracket.rounds[activeRound] ?? [];
  const matches  = matchIds.map((id) => bracket.matches[id]).filter(Boolean);

  return (
    <div className="space-y-3">
      {/* Round tabs — scrollable */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
        {MOBILE_ROUNDS.map(({ key, short }) => {
          const roundMatchIds = bracket.rounds[key] ?? [];
          const done = roundMatchIds.filter((id) => bracket.matches[id]?.status === "completed").length;
          const total = roundMatchIds.length;
          const isActive = activeRound === key;
          return (
            <button
              key={key}
              onClick={() => setActiveRound(key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30"
                  : "text-white/35 border border-white/[0.08] hover:text-white"
              }`}
            >
              {short}
              {total > 0 && (
                <span className={`text-[9px] font-normal ${isActive ? "text-[#FBBF24]/60" : "text-white/25"}`}>
                  {done}/{total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Round title */}
      <p className="text-[10px] text-white/25 uppercase tracking-widest font-bold">
        {ROUND_LABELS[activeRound]}
      </p>

      {/* Match cards */}
      <div className="space-y-2.5">
        {matches.length > 0 ? (
          matches.map((match) => (
            <MobileMatchCard
              key={match.id}
              match={match}
              showProb={showProb}
              onSetWinner={onSetWinner}
            />
          ))
        ) : (
          <div className="text-center py-10">
            <Trophy size={32} className="text-white/10 mx-auto mb-3" strokeWidth={1.2} />
            <p className="text-sm text-white/30">Advance teams to see this round</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function LiveAnimatedBracket() {
  const [bracket, setBracket] = useState<BracketState>(INITIAL_BRACKET);
  const [predictorMode, setPredictorMode] = useState(false);
  const [showProb, setShowProb]           = useState(false);
  const [settingsOpen, setSettingsOpen]   = useState(false);
  const [isPredicting, setIsPredicting]   = useState(false);
  const [showChampion, setShowChampion]   = useState(false);
  const [view, setView] = useState<"full" | "upper" | "lower">("full");
  const isMobile = useIsMobile(900);

  const containerRef = useRef<HTMLDivElement>(null);
  const matchRefs    = useRef(new Map<string, HTMLDivElement>());

  // Fetch live bracket (with group advancement) on mount
  useEffect(() => {
    fetch("/api/worldcup/bracket")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.matches) setBracket(data);
      })
      .catch(() => {});
  }, []);

  // Show champion banner when bracket is complete
  useEffect(() => {
    if (bracket.championId) setShowChampion(true);
  }, [bracket.championId]);

  const handleSetWinner = useCallback((matchId: string, side: "top" | "bottom") => {
    setBracket((prev) => advanceWinner(prev, matchId, side));
  }, []);

  const handlePredict = useCallback(async () => {
    setIsPredicting(true);
    // Animate delay before auto-advancing all matches
    await new Promise((r) => setTimeout(r, 300));
    setBracket((prev) => runPredictor(prev));
    setIsPredicting(false);
  }, []);

  const handleReset = useCallback(() => {
    fetch("/api/worldcup/bracket")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        setBracket(data?.matches ? data : INITIAL_BRACKET);
      })
      .catch(() => setBracket(INITIAL_BRACKET));
    setShowChampion(false);
  }, []);

  const handleTogglePredictorMode = useCallback(() => {
    setPredictorMode((v) => !v);
    setShowProb((v) => !v);
  }, []);

  // Which rounds to show for each half
  const upperMatchIds = (roundKey: RoundKey) =>
    bracket.rounds[roundKey].filter((id) => bracket.matches[id]?.side === "upper" || bracket.matches[id]?.side === "center");
  const lowerMatchIds = (roundKey: RoundKey) =>
    bracket.rounds[roundKey].filter((id) => bracket.matches[id]?.side === "lower");

  const completedCount = Object.values(bracket.matches).filter((m) => m.status === "completed").length;
  const totalMatches   = Object.keys(bracket.matches).length - 1; // excl 3rd place for progress

  return (
    <div className="relative">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-[#FBBF24]/25 bg-[#FBBF24]/[0.08] px-3 py-1.5">
            <Trophy size={11} className="text-[#FBBF24]" strokeWidth={2.5} />
            <span className="text-[10px] font-black text-[#FBBF24] tracking-widest uppercase">
              WC 2026 Bracket
            </span>
          </div>
          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#FBBF24]"
                animate={{ width: `${(completedCount / totalMatches) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-[10px] text-white/35">{completedCount}/{totalMatches}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle — desktop only */}
          {!isMobile && (
            <div className="flex items-center gap-0.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-0.5">
              {(["full", "upper", "lower"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors ${
                    view === v
                      ? "bg-[#FBBF24]/15 text-[#FBBF24]"
                      : "text-white/30 hover:text-white"
                  }`}
                >
                  {v === "full" ? "Full" : v === "upper" ? "Half A" : "Half B"}
                </button>
              ))}
            </div>
          )}

          {/* Predictor toggle */}
          <motion.button
            onClick={handleTogglePredictorMode}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              predictorMode
                ? "bg-[#818CF8]/15 border border-[#818CF8]/30 text-[#818CF8]"
                : "bg-white/[0.04] border border-white/[0.08] text-white/45"
            }`}
          >
            <Cpu size={12} strokeWidth={2} />
            Predictor
          </motion.button>

          {/* Simulate button */}
          <AnimatePresence>
            {predictorMode && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, width: 0 }}
                animate={{ opacity: 1, scale: 1, width: "auto" }}
                exit={{ opacity: 0, scale: 0.8, width: 0 }}
                onClick={handlePredict}
                disabled={isPredicting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#818CF8]/20 border border-[#818CF8]/40 text-[#818CF8] hover:bg-[#818CF8]/30 transition-colors disabled:opacity-50"
              >
                {isPredicting ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
                    <Zap size={12} />
                  </motion.div>
                ) : (
                  <Play size={12} strokeWidth={2} fill="currentColor" />
                )}
                {isPredicting ? "Simulating…" : "Simulate"}
              </motion.button>
            )}
          </AnimatePresence>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="w-8 h-8 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/30 hover:text-white flex items-center justify-center transition-colors"
            title="Reset bracket"
          >
            <RotateCcw size={12} strokeWidth={2} />
          </button>

          {/* Settings gear */}
          <div className="relative">
            <button
              onClick={() => setSettingsOpen((o) => !o)}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
                settingsOpen
                  ? "bg-[#FBBF24]/15 border-[#FBBF24]/40 text-[#FBBF24]"
                  : "bg-white/[0.03] border-white/[0.08] text-white/30 hover:text-white"
              }`}
            >
              <Settings size={13} strokeWidth={1.8} />
            </button>
            <AnimatePresence>
              {settingsOpen && (
                <BracketSettings
                  showProb={showProb}
                  onToggleProb={() => setShowProb((v) => !v)}
                  onClose={() => setSettingsOpen(false)}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Predictor mode banner ────────────────────────────────────────────── */}
      <AnimatePresence>
        {predictorMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="flex items-center gap-2 rounded-xl border border-[#818CF8]/20 bg-[#818CF8]/[0.06] px-4 py-2.5">
              <Cpu size={13} className="text-[#818CF8]" strokeWidth={2} />
              <p className="text-xs text-[#818CF8]/80">
                <span className="font-bold text-[#818CF8]">Predictor mode</span> — Win % shown per team. Hit &ldquo;Simulate&rdquo; to auto-advance all unresolved matches via ELO ratings. Click any team slot manually to override.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile bracket view ─────────────────────────────────────────────── */}
      {isMobile && (
        <MobileBracketView
          bracket={bracket}
          showProb={showProb}
          onSetWinner={handleSetWinner}
        />
      )}

      {/* ── Desktop bracket container ────────────────────────────────────────── */}
      {!isMobile && <div className="overflow-x-auto pb-4 rounded-2xl -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div
          ref={containerRef}
          className="relative inline-flex items-start gap-0"
          style={{ minHeight: BRACKET_H + 60 }}
        >
          {/* SVG connector layer */}
          <BracketConnectors
            containerRef={containerRef}
            matchRefs={matchRefs}
            matches={bracket.matches}
            isRight={false}
          />

          {/* ── Upper bracket (left side) ─────────────────────────────────── */}
          {(view === "full" || view === "upper") && (
            <>
              {UPPER_ROUNDS.map((round, i) => (
                <div key={`upper-${round}`} className="flex items-start" style={{ gap: 0 }}>
                  {i > 0 && <div style={{ width: COL_GAP }} />}
                  <BracketColumn
                    roundKey={round}
                    matchIds={upperMatchIds(round)}
                    matches={bracket.matches}
                    showProb={showProb}
                    onSetWinner={handleSetWinner}
                    matchRefs={matchRefs}
                  />
                </div>
              ))}
            </>
          )}

          {/* ── Final & 3rd Place (center) ───────────────────────────────── */}
          {view === "full" && (
            <div className="flex flex-col items-center" style={{ width: CARD_W + COL_GAP * 2 }}>
              <div style={{ height: 30 }} />
              {/* Final column label */}
              <div className="mb-3 flex items-center gap-1">
                <Trophy size={11} className="text-[#FBBF24]" />
                <span className="text-[9px] font-black text-[#FBBF24] uppercase tracking-widest">Final</span>
              </div>
              {/* Final match card centered */}
              <div
                className="flex items-center justify-center"
                style={{ height: BRACKET_H - 36 }}
              >
                <MatchCard
                  match={bracket.matches["final_0"]}
                  showProb={showProb}
                  onSetWinner={handleSetWinner}
                  cardRef={(el) => {
                    if (el) matchRefs.current.set("final_0", el);
                    else matchRefs.current.delete("final_0");
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Lower bracket (right side, mirrored) ─────────────────────── */}
          {(view === "full" || view === "lower") && (
            <>
              {[...LOWER_ROUNDS].reverse().map((round, i, arr) => (
                <div key={`lower-${round}`} className="flex items-start" style={{ gap: 0 }}>
                  {i > 0 && <div style={{ width: COL_GAP }} />}
                  <BracketColumn
                    roundKey={round}
                    matchIds={lowerMatchIds(round)}
                    matches={bracket.matches}
                    showProb={showProb}
                    onSetWinner={handleSetWinner}
                    matchRefs={matchRefs}
                    isRight
                  />
                </div>
              ))}
            </>
          )}
        </div>
      </div>}

      {/* ── 3rd Place match ──────────────────────────────────────────────────── */}
      <div className="mt-4 flex items-center gap-4">
        <div className="flex-1 h-px bg-white/[0.05]" />
        <span className="text-[9px] text-white/25 uppercase tracking-widest">3rd Place Match</span>
        <div className="flex-1 h-px bg-white/[0.05]" />
      </div>
      <div className="mt-3">
        {isMobile ? (
          <MobileMatchCard
            match={bracket.matches["3rd_0"]}
            showProb={showProb}
            onSetWinner={handleSetWinner}
          />
        ) : (
          <div className="flex justify-center">
            <MatchCard
              match={bracket.matches["3rd_0"]}
              showProb={showProb}
              onSetWinner={handleSetWinner}
              cardRef={(el) => {
                if (el) matchRefs.current.set("3rd_0", el);
                else matchRefs.current.delete("3rd_0");
              }}
            />
          </div>
        )}
      </div>

      {/* ── Champion overlay ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showChampion && bracket.championId && (
          <ChampionBanner teamId={bracket.championId} onDismiss={() => setShowChampion(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
