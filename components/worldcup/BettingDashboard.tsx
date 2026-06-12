"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Zap, AlertCircle, RefreshCw, Target, Minus, Plus,
  ChevronRight, BarChart3, DollarSign,
} from "lucide-react";
import type { WCOddsMarket, PlayerProp } from "@/lib/worldcup/types";

const GOLD  = "#FBBF24";
const BLUE  = "#38BDF8";
const CORAL = "#FF7828";
const GREEN = "#4ADE80";
const RED   = "#F87171";

// ── Helpers ───────────────────────────────────────────────────────────────────

function EdgeBadge({ edge }: { edge: number }) {
  const color = edge >= 8 ? GREEN : edge >= 4 ? GOLD : BLUE;
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black"
      style={{ background: `${color}15`, color }}
    >
      <Zap size={7} strokeWidth={3} />
      +{edge}%
    </span>
  );
}

function OddsBadge({ odds }: { odds: string }) {
  const isPositive = odds.startsWith("+");
  return (
    <span
      className={`text-xs font-black ${isPositive ? "text-[#4ADE80]" : "text-white/70"}`}
    >
      {odds}
    </span>
  );
}

// ── Market Card (h2h / totals / spreads) ──────────────────────────────────────

function MarketCard({ market }: { market: WCOddsMarket }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      className="rounded-2xl border border-white/[0.07] bg-[#0D1420] overflow-hidden cursor-pointer"
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-xs font-bold text-white/80">
            {market.homeTeam} <span className="text-white/30">vs</span> {market.awayTeam}
          </p>
          <p className="text-[10px] text-white/30 mt-0.5">{market.matchDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <OddsBadge odds={market.moneyline.home} />
            <span className="text-[10px] text-white/20">/</span>
            <OddsBadge odds={market.moneyline.draw} />
            <span className="text-[10px] text-white/20">/</span>
            <OddsBadge odds={market.moneyline.away} />
          </div>
          <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight size={13} className="text-white/30" />
          </motion.div>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 grid grid-cols-2 gap-3 border-t border-white/[0.05] pt-3">
              {/* Totals */}
              {market.totals && (
                <div className="rounded-xl bg-white/[0.03] p-3">
                  <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider mb-2">
                    Total Goals
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white/50">
                        <Plus size={8} className="inline mr-0.5" />
                        Over {market.totals.over.line}
                      </span>
                      <OddsBadge odds={market.totals.over.odds} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white/50">
                        <Minus size={8} className="inline mr-0.5" />
                        Under {market.totals.under.line}
                      </span>
                      <OddsBadge odds={market.totals.under.odds} />
                    </div>
                  </div>
                </div>
              )}

              {/* Spread */}
              {market.spread && (
                <div className="rounded-xl bg-white/[0.03] p-3">
                  <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider mb-2">
                    Asian Handicap
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white/50 truncate max-w-[80px]">
                        {market.homeTeam.split(" ")[0]} ({market.spread.home.line > 0 ? "+" : ""}{market.spread.home.line})
                      </span>
                      <OddsBadge odds={market.spread.home.odds} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white/50 truncate max-w-[80px]">
                        {market.awayTeam.split(" ")[0]} ({market.spread.away.line > 0 ? "+" : ""}{market.spread.away.line})
                      </span>
                      <OddsBadge odds={market.spread.away.odds} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="px-4 pb-3">
              <p className="text-[9px] text-white/20">
                via {market.bookmaker} · Updated {new Date(market.lastUpdate).toLocaleTimeString()}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Player Prop Row ───────────────────────────────────────────────────────────

function PropRow({ prop, index }: { prop: PlayerProp; index: number }) {
  const barW = Math.round(prop.modelProb * 100);
  const implW = Math.round(prop.impliedProb * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`rounded-xl border p-3 ${
        prop.hasEdge
          ? "border-[#4ADE80]/20 bg-[#4ADE80]/[0.03]"
          : "border-white/[0.06] bg-[#0D1420]"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-bold text-white/80 truncate">{prop.playerName}</p>
            {prop.hasEdge && <EdgeBadge edge={prop.edgePct} />}
          </div>
          <p className="text-[10px] text-white/35 mt-0.5">{prop.propType}</p>
        </div>
        <div className="text-right shrink-0">
          {prop.yesOdds && <OddsBadge odds={prop.yesOdds} />}
          {prop.line !== undefined && (
            <p className="text-[9px] text-white/30 mt-0.5">line: {prop.line}</p>
          )}
        </div>
      </div>

      {/* Prob bar comparison */}
      <div className="space-y-1.5">
        <div>
          <div className="flex justify-between mb-0.5">
            <span className="text-[8px] text-white/30">Model</span>
            <span className="text-[8px] font-bold text-[#38BDF8]">{barW}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[#38BDF8]"
              initial={{ width: 0 }}
              animate={{ width: `${barW}%` }}
              transition={{ duration: 0.6, delay: index * 0.04 }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-0.5">
            <span className="text-[8px] text-white/30">Implied</span>
            <span className="text-[8px] font-bold text-white/40">{implW}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-white/20"
              initial={{ width: 0 }}
              animate={{ width: `${implW}%` }}
              transition={{ duration: 0.6, delay: index * 0.04 + 0.1 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Value Bets Panel ──────────────────────────────────────────────────────────

function ValueBetsPanel({ props }: { props: PlayerProp[] }) {
  const valueBets = props.filter((p) => p.hasEdge);

  if (valueBets.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-[#0D1420] p-6 text-center">
        <AlertCircle size={24} className="text-white/20 mx-auto mb-2" strokeWidth={1.5} />
        <p className="text-xs text-white/30">No value bets detected at ≥4% edge right now</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {valueBets.map((prop, i) => (
        <div key={prop.playerId} className="rounded-2xl border border-[#4ADE80]/15 bg-[#4ADE80]/[0.04] p-3.5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Zap size={11} className="text-[#4ADE80]" fill="currentColor" />
              <p className="text-xs font-bold text-white/80">{prop.playerName}</p>
            </div>
            <EdgeBadge edge={prop.edgePct} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-white/40">{prop.propType}</p>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-white/30">
                {Math.round(prop.impliedProb * 100)}% implied →
              </span>
              <span className="text-[9px] font-bold text-[#38BDF8]">
                {Math.round(prop.modelProb * 100)}% model
              </span>
              {prop.yesOdds && <OddsBadge odds={prop.yesOdds} />}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function BettingDashboard() {
  const [markets, setMarkets] = useState<WCOddsMarket[]>([]);
  const [props, setProps]     = useState<PlayerProp[]>([]);
  const [tab, setTab]         = useState<"markets" | "props" | "value">("markets");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [propFilter, setPropFilter] = useState<"all" | "goalscorer" | "shots">("all");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [mRes, pRes] = await Promise.all([
        fetch("/api/worldcup/odds?type=markets"),
        fetch("/api/worldcup/odds?type=props"),
      ]);
      if (mRes.ok) setMarkets(await mRes.json());
      if (pRes.ok) setProps(await pRes.json());
    } catch {
      setError("Failed to load odds — check API keys");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filteredProps = props.filter((p) => {
    if (propFilter === "goalscorer") return p.propType.includes("Goalscorer");
    if (propFilter === "shots")      return p.propType.includes("Shots");
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-[#FF7828]/25 bg-[#FF7828]/[0.08] px-3 py-1.5">
            <BarChart3 size={11} className="text-[#FF7828]" strokeWidth={2.5} />
            <span className="text-[10px] font-black text-[#FF7828] tracking-widest uppercase">
              WC Odds
            </span>
          </div>
          <span className="text-[10px] text-white/30">FanDuel • Live</span>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] text-white/40 hover:text-white text-xs transition-colors"
        >
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} strokeWidth={2} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-0.5 w-fit">
        {(["markets", "props", "value"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
              tab === t
                ? "bg-[#FF7828]/15 text-[#FF7828]"
                : "text-white/30 hover:text-white"
            }`}
          >
            {t === "markets" ? "Moneylines" : t === "props" ? "Player Props" : "Value Bets"}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3 flex items-center gap-2">
          <AlertCircle size={14} className="text-red-400" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <AnimatePresence mode="wait">
          {tab === "markets" && (
            <motion.div
              key="markets"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-2"
            >
              {markets.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.07] bg-[#0D1420] p-6 text-center">
                  <DollarSign size={24} className="text-white/20 mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-xs text-white/30">WC 2026 odds open closer to tournament start</p>
                </div>
              ) : (
                markets.map((m, i) => <MarketCard key={i} market={m} />)
              )}
            </motion.div>
          )}

          {tab === "props" && (
            <motion.div
              key="props"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              {/* Filter chips */}
              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                {(["all", "goalscorer", "shots"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setPropFilter(f)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                      propFilter === f
                        ? "bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/25"
                        : "text-white/30 border border-white/[0.08] hover:text-white"
                    }`}
                  >
                    {f === "all" ? "All" : f === "goalscorer" ? "Anytime Scorer" : "Shots on Target"}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredProps.map((p, i) => (
                  <PropRow key={p.playerId} prop={p} index={i} />
                ))}
              </div>
            </motion.div>
          )}

          {tab === "value" && (
            <motion.div
              key="value"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <div className="flex items-center gap-2 rounded-xl border border-[#38BDF8]/15 bg-[#38BDF8]/[0.05] px-4 py-2.5 mb-4">
                <Target size={12} className="text-[#38BDF8]" />
                <p className="text-[11px] text-[#38BDF8]/80">
                  <span className="font-bold text-[#38BDF8]">Value bets</span> — model probability exceeds implied by ≥4 percentage points (Kelly criterion applied)
                </p>
              </div>
              <ValueBetsPanel props={props} />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
