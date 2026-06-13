"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, TrendingUp, Target, RefreshCw, Clock, Trophy,
  ChevronDown, ChevronUp, Shield, Flame, CheckCircle2,
} from "lucide-react";
import { WC_GROUPS, WC_TEAMS, eloWinProb } from "@/lib/worldcup/data";
import type { TodayMatch } from "@/app/api/worldcup/today/route";

const GOLD    = "#FBBF24";
const GREEN   = "#4ADE80";
const BLUE    = "#38BDF8";
const RED     = "#F87171";
const ORANGE  = "#FF7828";
const INDIGO  = "#818CF8";

// ── Helpers ───────────────────────────────────────────────────────────────────

function flagUrl(cc: string) { return `https://flagcdn.com/w80/${cc.toLowerCase()}.png`; }

function FlagImg({ cc, name, className }: { cc: string; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`${className ?? ""} flex items-center justify-center bg-white/[0.12] text-white/60 font-black`}
        style={{ fontSize: "9px" }}>
        {name.slice(0, 3).toUpperCase()}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={flagUrl(cc)} alt={name} className={`${className ?? ""} object-cover`} onError={() => setFailed(true)} />
  );
}

// Convert ELO win probability to American odds with bookmaker vig
function probToAmerican(prob: number, vig = 1.045): string {
  const adj = Math.min(prob * vig, 0.97);
  const dec = 1 / adj;
  if (dec >= 2) return `+${Math.round((dec - 1) * 100)}`;
  return `-${Math.round(100 / (dec - 1))}`;
}

// Draw probability estimate: higher when teams are more evenly matched
function drawProb(homeWin: number, awayWin: number): number {
  const rawDraw = 1 - homeWin - awayWin;
  // ELO formula overstates win probs; normalize to ~25% avg draw rate
  return Math.max(rawDraw * 0.9, 0.10);
}

function normalizeProbs(hw: number, aw: number): [number, number, number] {
  const d = drawProb(hw, aw);
  const total = hw + d + aw;
  return [hw / total, d / total, aw / total];
}

interface MatchEdge {
  label: string;
  detail: string;
  color: string;
  icon: "fire" | "target" | "zap" | "shield";
  confidence: "Strong" | "Moderate" | "Lean";
}

function deriveEdges(
  homeName: string,
  awayName: string,
  homeElo: number,
  awayElo: number,
  [hw, dw, aw]: [number, number, number]
): MatchEdge[] {
  const eloDiff = homeElo - awayElo;
  const edges: MatchEdge[] = [];

  // 1. Moneyline edge
  if (Math.abs(eloDiff) >= 80) {
    const favTeam  = eloDiff > 0 ? homeName : awayName;
    const favProb  = eloDiff > 0 ? hw : aw;
    const favOdds  = probToAmerican(favProb);
    const conf: MatchEdge["confidence"] = Math.abs(eloDiff) >= 150 ? "Strong" : "Moderate";
    edges.push({
      label: `${favTeam} ML`,
      detail: `ELO gap of ${Math.abs(eloDiff)} pts → model gives ${Math.round(favProb * 100)}% win probability. Line: ${favOdds}`,
      color: GREEN,
      icon: "target",
      confidence: conf,
    });
  } else {
    // Closely matched — lean toward draw
    edges.push({
      label: "Draw / DNB",
      detail: `Teams are within ${Math.abs(eloDiff)} ELO pts — model gives draw ${Math.round(dw * 100)}% probability. High value.`,
      color: GOLD,
      icon: "zap",
      confidence: "Moderate",
    });
  }

  // 2. Total goals angle
  const avgXG = ((homeElo + awayElo) / 2 - 1600) / 400 + 2.5;
  const overProb = Math.max(0.35, Math.min(0.65, avgXG / 4.5));
  if (overProb >= 0.52) {
    edges.push({
      label: `Over 2.5 Goals`,
      detail: `Combined attack rating projects ${avgXG.toFixed(1)} expected goals. ${Math.round(overProb * 100)}% model chance.`,
      color: ORANGE,
      icon: "fire",
      confidence: overProb >= 0.58 ? "Strong" : "Moderate",
    });
  } else {
    edges.push({
      label: `Under 2.5 Goals`,
      detail: `Defensive match-up. Model projects ${avgXG.toFixed(1)} xG total — tight game expected.`,
      color: BLUE,
      icon: "shield",
      confidence: overProb <= 0.44 ? "Moderate" : "Lean",
    });
  }

  // 3. BTTS / clean sheet angle
  const bttsProb = Math.max(0.30, Math.min(0.65, (homeElo + awayElo - 3100) / 600 + 0.45));
  if (bttsProb >= 0.50) {
    edges.push({
      label: "Both Teams to Score",
      detail: `Both sides carry attack threat. Model: ${Math.round(bttsProb * 100)}% BTTS probability.`,
      color: INDIGO,
      icon: "fire",
      confidence: bttsProb >= 0.56 ? "Moderate" : "Lean",
    });
  } else {
    const cleanSheetTeam = eloDiff > 50 ? homeName : awayName;
    edges.push({
      label: `${cleanSheetTeam} Clean Sheet`,
      detail: `Weaker attack on other side. Model: ${Math.round((1 - bttsProb) * 60)}% chance of clean sheet.`,
      color: GREEN,
      icon: "shield",
      confidence: "Lean",
    });
  }

  return edges.slice(0, 3);
}

const CONF_COLOR: Record<string, string> = {
  Strong: GREEN,
  Moderate: GOLD,
  Lean: BLUE,
};

function EdgeIcon({ type, color }: { type: MatchEdge["icon"]; color: string }) {
  const props = { size: 12, strokeWidth: 2.5, style: { color } };
  if (type === "fire")   return <Flame   {...props} />;
  if (type === "target") return <Target  {...props} />;
  if (type === "shield") return <Shield  {...props} />;
  return <Zap {...props} />;
}

// ── Single Match Card ─────────────────────────────────────────────────────────

function MatchCard({ match }: { match: TodayMatch }) {
  const [expanded, setExpanded] = useState(true);

  const homeTeam = WC_TEAMS[match.homeId];
  const awayTeam = WC_TEAMS[match.awayId];
  const homeElo  = homeTeam?.strength ?? 1650;
  const awayElo  = awayTeam?.strength ?? 1650;

  const rawHW  = eloWinProb(homeElo, awayElo);
  const rawAW  = eloWinProb(awayElo, homeElo);
  const [hw, dw, aw] = normalizeProbs(rawHW, rawAW);

  const isDone = match.status === "completed";
  const isLive = match.status === "live";

  const edges = deriveEdges(match.home, match.away, homeElo, awayElo, [hw, dw, aw]);

  const homeColor = homeTeam?.color ?? "#3C3B6E";
  const awayColor = awayTeam?.color ?? "#006847";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/[0.08] overflow-hidden"
      style={{ background: "linear-gradient(160deg, #10161f, #090d14)" }}
    >
      {/* Match hero */}
      <div
        className="relative px-5 pt-5 pb-4"
        style={{
          background: `linear-gradient(135deg, ${homeColor}18 0%, transparent 40%, ${awayColor}18 100%)`,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Group + time badges */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-[#FBBF24] border border-[#FBBF24]/25 rounded-full px-2 py-0.5">
              GROUP {match.groupId}
            </span>
            {isDone && (
              <span className="text-[9px] font-black text-white/30 border border-white/10 rounded-full px-2 py-0.5 flex items-center gap-1">
                <CheckCircle2 size={8} />FT
              </span>
            )}
            {isLive && (
              <motion.span
                className="text-[9px] font-black text-red-400 border border-red-400/25 bg-red-400/10 rounded-full px-2 py-0.5"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                LIVE
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-white/30">
            <Clock size={10} />
            <span>{match.time}</span>
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center gap-3">
          {/* Home */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="w-16 h-11 rounded-xl overflow-hidden border-2 border-white/10 shadow-lg">
              {homeTeam ? (
                <FlagImg cc={homeTeam.countryCode} name={homeTeam.shortName} className="w-full h-full" />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/30 text-xs font-black">
                  {match.home.slice(0, 3).toUpperCase()}
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-white">{match.home}</p>
              {homeTeam && <p className="text-[9px] text-white/30">ELO {homeTeam.strength}</p>}
            </div>
          </div>

          {/* Score / VS */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            {isDone || isLive ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.07] border border-white/[0.1]">
                <span className="text-2xl font-black text-white">{match.homeScore}</span>
                <span className="text-white/30">–</span>
                <span className="text-2xl font-black text-white">{match.awayScore}</span>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-lg font-black text-white/20">vs</p>
                <p className="text-[9px] text-white/25">{match.date}</p>
              </div>
            )}
            <p className="text-[8px] text-white/20 text-center max-w-[80px] truncate">{match.venue.split(",")[0]}</p>
          </div>

          {/* Away */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="w-16 h-11 rounded-xl overflow-hidden border-2 border-white/10 shadow-lg">
              {awayTeam ? (
                <FlagImg cc={awayTeam.countryCode} name={awayTeam.shortName} className="w-full h-full" />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/30 text-xs font-black">
                  {match.away.slice(0, 3).toUpperCase()}
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-white">{match.away}</p>
              {awayTeam && <p className="text-[9px] text-white/30">ELO {awayTeam.strength}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Win probability bar */}
      {!isDone && (
        <div className="px-5 py-3.5 border-b border-white/[0.05]">
          <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-2">Win Probability · ELO Model</p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black w-10 text-right" style={{ color: BLUE }}>{Math.round(hw * 100)}%</span>
            <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-white/[0.06] flex">
              <motion.div
                className="h-full"
                style={{ background: BLUE }}
                initial={{ width: 0 }}
                animate={{ width: `${hw * 100}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
              <motion.div
                className="h-full"
                style={{ background: "rgba(255,255,255,0.12)" }}
                initial={{ width: 0 }}
                animate={{ width: `${dw * 100}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
              <motion.div
                className="h-full"
                style={{ background: RED }}
                initial={{ width: 0 }}
                animate={{ width: `${aw * 100}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            </div>
            <span className="text-xs font-black w-10" style={{ color: RED }}>{Math.round(aw * 100)}%</span>
          </div>
          <div className="flex justify-between text-[8px] text-white/20 mt-1 px-12">
            <span>{match.home}</span>
            <span>Draw {Math.round(dw * 100)}%</span>
            <span>{match.away}</span>
          </div>
        </div>
      )}

      {/* Edge Picks toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={13} className="text-[#FBBF24]" strokeWidth={2.5} />
          <span className="text-xs font-black text-white">Bet Analysis</span>
          <span className="text-[9px] text-white/30">{edges.length} picks</span>
        </div>
        {expanded ? <ChevronUp size={13} className="text-white/30" /> : <ChevronDown size={13} className="text-white/30" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2.5 border-t border-white/[0.05] pt-3">
              {edges.map((edge, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-xl border p-3.5"
                  style={{
                    background: `${edge.color}08`,
                    borderColor: `${edge.color}22`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${edge.color}15`, border: `1px solid ${edge.color}25` }}
                    >
                      <EdgeIcon type={edge.icon} color={edge.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-black text-white">{edge.label}</p>
                        <span
                          className="text-[8px] font-black rounded-full px-1.5 py-0.5 shrink-0"
                          style={{
                            background: `${CONF_COLOR[edge.confidence]}15`,
                            color: CONF_COLOR[edge.confidence],
                            border: `1px solid ${CONF_COLOR[edge.confidence]}30`,
                          }}
                        >
                          {edge.confidence}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/45 leading-relaxed">{edge.detail}</p>
                    </div>
                  </div>
                </motion.div>
              ))}

              <p className="text-[9px] text-white/20 text-center pt-1">
                Odds estimates via ELO model · For analysis only · Not financial advice
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Upcoming fallback ─────────────────────────────────────────────────────────

function getUpcomingMatches(count = 4): TodayMatch[] {
  const results: TodayMatch[] = [];
  const today = new Date();

  for (const group of WC_GROUPS) {
    for (const m of group.matches) {
      if (m.status === "completed") continue;
      const homeTeam = WC_TEAMS[m.home];
      const awayTeam = WC_TEAMS[m.away];
      results.push({
        groupId: group.id,
        home:    homeTeam?.name ?? m.home,
        away:    awayTeam?.name ?? m.away,
        homeId:  m.home,
        awayId:  m.away,
        date:    m.date,
        time:    m.time,
        venue:   m.venue,
        homeScore: null,
        awayScore: null,
        status: "scheduled",
        homeFlagUrl: homeTeam ? `https://flagcdn.com/w80/${homeTeam.countryCode}.png` : "",
        awayFlagUrl: awayTeam ? `https://flagcdn.com/w80/${awayTeam.countryCode}.png` : "",
      });
      if (results.length >= count) break;
    }
    if (results.length >= count) break;
  }

  return results;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function MatchAnalysis() {
  const [matches,   setMatches]   = useState<TodayMatch[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/worldcup/today");
      if (res.ok) {
        const { matches: m } = await res.json();
        setMatches(Array.isArray(m) && m.length > 0 ? m : getUpcomingMatches());
      } else {
        setMatches(getUpcomingMatches());
      }
    } catch {
      setMatches(getUpcomingMatches());
    } finally {
      setLoading(false);
      setLastFetch(new Date());
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isToday = matches.some((m) => m.status !== "scheduled");
  const heading = isToday ? "Today's Matches" : "Upcoming Matches";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-[#FBBF24]" strokeWidth={2} />
          <div>
            <h2 className="text-xl font-black text-white">{heading}</h2>
            <p className="text-[11px] text-white/30">ELO-powered analysis · WC 2026</p>
          </div>
        </div>

        <button
          onClick={() => load()}
          disabled={loading}
          className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-white/30 hover:text-white/60 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
          {lastFetch
            ? lastFetch.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-56 rounded-2xl bg-white/[0.04] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-10 text-center">
          <Clock size={28} className="text-white/20 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-white/40 text-sm font-bold">No matches scheduled today</p>
          <p className="text-white/20 text-xs mt-1">Check back closer to the next match day</p>
        </div>
      ) : (
        <div className="space-y-5">
          {matches.map((m, i) => (
            <MatchCard key={`${m.homeId}-${m.awayId}-${i}`} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}
