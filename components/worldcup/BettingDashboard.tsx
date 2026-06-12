"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Zap, AlertCircle, RefreshCw, Target, Minus, Plus,
  ChevronDown, BarChart3, DollarSign, Trash2, CheckCircle2,
  ShoppingCart, X, Trophy, Star, ChevronRight, Flame,
} from "lucide-react";
import type { WCOddsMarket, PlayerProp } from "@/lib/worldcup/types";
import { WC_TEAMS } from "@/lib/worldcup/data";

// ── Constants ─────────────────────────────────────────────────────────────────

const GOLD   = "#FBBF24";
const BLUE   = "#38BDF8";
const CORAL  = "#FF7828";
const GREEN  = "#4ADE80";
const RED    = "#F87171";
const INDIGO = "#818CF8";

// ── Today's Match Data ────────────────────────────────────────────────────────

const TODAY_MATCHES = [
  {
    id: "usa_par",
    home: "USA",       homeId: "usa",  homeFlag: "us",
    away: "Paraguay",  awayId: "par",  awayFlag: "py",
    date: "Jun 12 · 9:00 PM ET",
    venue: "SoFi Stadium, Los Angeles",
    group: "A",
    moneyline: { home: "+105", draw: "+235", away: "+270" },
    spread:    { homeTeam: "USA", line: -0.5, homeOdds: "-115", awayOdds: "+120" },
    total:     { line: 2.5, overOdds: "-130", underOdds: "+110" },
    homeElo: 1662, awayElo: 1638,
    featured: true,
  },
  {
    id: "mex_ecu",
    home: "Mexico",    homeId: "mex",  homeFlag: "mx",
    away: "Ecuador",   awayId: "ecu",  awayFlag: "ec",
    date: "Jun 12 · 6:00 PM ET",
    venue: "Estadio Azteca, Mexico City",
    group: "B",
    moneyline: { home: "+125", draw: "+200", away: "+230" },
    spread:    { homeTeam: "Mexico", line: -0.5, homeOdds: "-110", awayOdds: "+105" },
    total:     { line: 2.5, overOdds: "-120", underOdds: "+100" },
    homeElo: 1692, awayElo: 1622,
    featured: false,
  },
];

// ── Player Props for USA vs Paraguay ─────────────────────────────────────────

const WC_PLAYER_PROPS: SlipProp[] = [
  // USA Players
  { id: "p1",  matchId: "usa_par", playerName: "Christian Pulisic",  team: "USA", flag: "us", propType: "Anytime Goalscorer",    odds: "+175", modelProb: 38, impliedProb: 36, edge: 2  },
  { id: "p2",  matchId: "usa_par", playerName: "Christian Pulisic",  team: "USA", flag: "us", propType: "Shots on Target O1.5",  odds: "-130", modelProb: 62, impliedProb: 57, edge: 5, hot: true  },
  { id: "p3",  matchId: "usa_par", playerName: "Folarin Balogun",    team: "USA", flag: "us", propType: "Anytime Goalscorer",    odds: "+230", modelProb: 29, impliedProb: 30, edge: -1 },
  { id: "p4",  matchId: "usa_par", playerName: "Gio Reyna",          team: "USA", flag: "us", propType: "Anytime Goalscorer",    odds: "+290", modelProb: 24, impliedProb: 26, edge: -2 },
  { id: "p5",  matchId: "usa_par", playerName: "Weston McKennie",    team: "USA", flag: "us", propType: "Anytime Goalscorer",    odds: "+380", modelProb: 17, impliedProb: 21, edge: -4 },
  { id: "p6",  matchId: "usa_par", playerName: "Tyler Adams",        team: "USA", flag: "us", propType: "Pass Accuracy O/U 85.5",odds: "-110", modelProb: 68, impliedProb: 52, edge: 16, hot: true, value: true },
  { id: "p7",  matchId: "usa_par", playerName: "Yunus Musah",        team: "USA", flag: "us", propType: "Key Passes O/U 1.5",   odds: "+115", modelProb: 55, impliedProb: 47, edge: 8,  hot: true, value: true },
  { id: "p8",  matchId: "usa_par", playerName: "USA",                team: "USA", flag: "us", propType: "Total Goals O/U 2.5",  odds: "-130", modelProb: 58, impliedProb: 57, edge: 1  },
  // Paraguay Players
  { id: "p9",  matchId: "usa_par", playerName: "Miguel Almirón",     team: "PAR", flag: "py", propType: "Anytime Goalscorer",    odds: "+260", modelProb: 26, impliedProb: 28, edge: -2 },
  { id: "p10", matchId: "usa_par", playerName: "Julio Enciso",       team: "PAR", flag: "py", propType: "Anytime Goalscorer",    odds: "+310", modelProb: 22, impliedProb: 24, edge: -2 },
  { id: "p11", matchId: "usa_par", playerName: "Antonio Sanabria",   team: "PAR", flag: "py", propType: "Anytime Goalscorer",    odds: "+280", modelProb: 24, impliedProb: 26, edge: -2 },
  { id: "p12", matchId: "usa_par", playerName: "Miguel Almirón",     team: "PAR", flag: "py", propType: "Shots on Target O/U 1.5",odds: "+105",modelProb: 51, impliedProb: 49, edge: 2  },
  { id: "p13", matchId: "usa_par", playerName: "Gustavo Gómez",      team: "PAR", flag: "py", propType: "To Score/Assist",       odds: "+450", modelProb: 14, impliedProb: 18, edge: -4 },
  { id: "p14", matchId: "usa_par", playerName: "Paraguay",           team: "PAR", flag: "py", propType: "Total Goals O/U 0.5",   odds: "-200", modelProb: 78, impliedProb: 67, edge: 11, hot: true, value: true },
  // Mexico vs Ecuador
  { id: "p15", matchId: "mex_ecu", playerName: "Hirving Lozano",     team: "MEX", flag: "mx", propType: "Anytime Goalscorer",    odds: "+220", modelProb: 30, impliedProb: 31, edge: -1 },
  { id: "p16", matchId: "mex_ecu", playerName: "Raúl Jiménez",       team: "MEX", flag: "mx", propType: "Anytime Goalscorer",    odds: "+190", modelProb: 36, impliedProb: 34, edge: 2  },
  { id: "p17", matchId: "mex_ecu", playerName: "Enner Valencia",     team: "ECU", flag: "ec", propType: "Anytime Goalscorer",    odds: "+240", modelProb: 28, impliedProb: 29, edge: -1 },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface SlipProp {
  id: string;
  matchId: string;
  playerName: string;
  team: string;
  flag: string;
  propType: string;
  odds: string;
  modelProb: number;
  impliedProb: number;
  edge: number;
  hot?: boolean;
  value?: boolean;
}

interface SlipLeg {
  prop: SlipProp;
  pick: string; // the prop description
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function americanToDecimal(odds: string): number {
  const n = parseInt(odds.replace("+", ""));
  return n > 0 ? (n / 100) + 1 : (100 / Math.abs(n)) + 1;
}

function combinedDecimalOdds(legs: SlipLeg[]): number {
  return legs.reduce((acc, l) => acc * americanToDecimal(l.prop.odds), 1);
}

function decimalToAmerican(dec: number): string {
  if (dec >= 2) return `+${Math.round((dec - 1) * 100)}`;
  return `-${Math.round(100 / (dec - 1))}`;
}

// ── Edge Badge ────────────────────────────────────────────────────────────────

function EdgeBadge({ edge }: { edge: number }) {
  const color = edge >= 8 ? GREEN : edge >= 4 ? GOLD : edge >= 1 ? BLUE : RED;
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black" style={{ background: `${color}15`, color }}>
      <Zap size={7} strokeWidth={3} />{edge >= 0 ? `+${edge}` : edge}%
    </span>
  );
}

function OddsPill({ odds, size = "sm" }: { odds: string; size?: "xs" | "sm" }) {
  const pos = odds.startsWith("+");
  const cls = size === "xs" ? "text-[9px] px-1.5 py-0.5" : "text-xs px-2 py-1";
  return (
    <span className={`font-black rounded-lg border ${cls} ${pos ? "text-[#4ADE80] border-[#4ADE80]/25 bg-[#4ADE80]/[0.06]" : "text-white/70 border-white/10 bg-white/[0.04]"}`}>
      {odds}
    </span>
  );
}

// ── Match Moneyline Card ───────────────────────────────────────────────────────

function MatchCard({ match, onAddMoneyline }: { match: typeof TODAY_MATCHES[0]; onAddMoneyline: (leg: SlipLeg) => void }) {
  const [expanded, setExpanded] = useState(match.featured);

  const homeTeam = WC_TEAMS[match.homeId];
  const awayTeam = WC_TEAMS[match.awayId];
  const homeWinProb = Math.round(100 / (1 + (match.awayElo / match.homeElo) ** 10));

  return (
    <motion.div
      className={`rounded-2xl border overflow-hidden ${match.featured ? "border-[#FBBF24]/20" : "border-white/[0.07]"}`}
      style={match.featured ? { background: "linear-gradient(135deg, #151005, #0D1420)" } : { background: "#0D1420" }}
      layout
    >
      {/* Header */}
      <button onClick={() => setExpanded(v => !v)} className="w-full px-4 py-3.5 flex items-center gap-3 text-left">
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[9px] font-black text-[#FBBF24] border border-[#FBBF24]/25 rounded-full px-1.5 py-0.5">GRP {match.group}</span>
          {match.featured && (
            <span className="text-[9px] font-black text-[#4ADE80] border border-[#4ADE80]/25 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />TODAY
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://flagcdn.com/w40/${match.homeFlag}.png`} alt="" className="w-5 h-4 rounded object-cover shrink-0" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display="none"; }} />
          <span className="text-sm font-black text-white truncate">{match.home}</span>
          <span className="text-[10px] text-white/25">vs</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://flagcdn.com/w40/${match.awayFlag}.png`} alt="" className="w-5 h-4 rounded object-cover shrink-0" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display="none"; }} />
          <span className="text-sm font-black text-white truncate">{match.away}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <OddsPill odds={match.moneyline.home} size="xs" />
          <span className="text-[9px] text-white/20">/</span>
          <OddsPill odds={match.moneyline.draw} size="xs" />
          <span className="text-[9px] text-white/20">/</span>
          <OddsPill odds={match.moneyline.away} size="xs" />
          <motion.div animate={{ rotate: expanded ? 90 : 0 }}>
            <ChevronRight size={13} className="text-white/25" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="px-4 pb-4 space-y-3 border-t border-white/[0.05] pt-3">
              {/* Venue + time */}
              <p className="text-[10px] text-white/30">{match.date} · {match.venue}</p>

              {/* Win probability bar */}
              <div className="space-y-1.5">
                <p className="text-[9px] text-white/25 uppercase tracking-widest font-bold">Win Probability (ELO)</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-[#38BDF8] w-8 text-right">{homeWinProb}%</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden bg-white/[0.05] flex">
                    <motion.div className="h-full bg-[#38BDF8]" initial={{ width: 0 }} animate={{ width: `${homeWinProb}%` }} transition={{ duration: 0.8 }} />
                    <motion.div className="h-full bg-[#F87171]" initial={{ width: 0 }} animate={{ width: `${100 - homeWinProb}%` }} transition={{ duration: 0.8 }} />
                  </div>
                  <span className="text-[10px] font-black text-[#F87171] w-8">{100 - homeWinProb}%</span>
                </div>
                <div className="flex justify-between text-[9px] text-white/20">
                  <span>{match.home}</span><span>{match.away}</span>
                </div>
              </div>

              {/* Moneyline add buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: match.home, odds: match.moneyline.home, pick: `${match.home} ML` },
                  { label: "Draw",     odds: match.moneyline.draw,  pick: "Draw" },
                  { label: match.away, odds: match.moneyline.away,  pick: `${match.away} ML` },
                ].map(({ label, odds, pick }) => (
                  <button key={pick} onClick={() => onAddMoneyline({ prop: { id: `ml_${match.id}_${pick}`, matchId: match.id, playerName: pick, team: "", flag: "", propType: "Moneyline", odds, modelProb: 0, impliedProb: 0, edge: 0 }, pick })}
                    className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 px-2 hover:border-[#FBBF24]/30 hover:bg-[#FBBF24]/[0.05] transition-colors group">
                    <span className="text-[9px] text-white/40 group-hover:text-white/60 font-medium truncate w-full text-center">{label}</span>
                    <OddsPill odds={odds} size="xs" />
                    <span className="text-[8px] text-white/25 flex items-center gap-0.5"><Plus size={7} />Add</span>
                  </button>
                ))}
              </div>

              {/* Spread + Total row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                  <p className="text-[9px] text-white/30 uppercase tracking-wider mb-2">Handicap</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white/50">{match.spread.homeTeam} ({match.spread.line > 0 ? "+" : ""}{match.spread.line})</span>
                      <OddsPill odds={match.spread.homeOdds} size="xs" />
                    </div>
                  </div>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                  <p className="text-[9px] text-white/30 uppercase tracking-wider mb-2">Total Goals</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white/50">Over {match.total.line}</span>
                      <OddsPill odds={match.total.overOdds} size="xs" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white/50">Under {match.total.line}</span>
                      <OddsPill odds={match.total.underOdds} size="xs" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Player Prop Row ───────────────────────────────────────────────────────────

function PropRow({ prop, inSlip, onToggle, index }: {
  prop: SlipProp;
  inSlip: boolean;
  onToggle: (p: SlipProp) => void;
  index: number;
}) {
  const match = TODAY_MATCHES.find(m => m.id === prop.matchId);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`rounded-xl border p-3 transition-all ${
        inSlip ? "border-[#FBBF24]/30 bg-[#FBBF24]/[0.05]" :
        prop.value ? "border-[#4ADE80]/20 bg-[#4ADE80]/[0.03]" :
        "border-white/[0.06] bg-[#0D1420]"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Flag + player */}
        <div className="shrink-0 mt-0.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://flagcdn.com/w40/${prop.flag}.png`} alt="" className="w-5 h-4 rounded object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display="none"; }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-xs font-bold text-white/85">{prop.playerName}</p>
            {prop.hot && <span className="text-[8px] font-black text-[#FF7828] bg-[#FF7828]/12 border border-[#FF7828]/20 rounded-full px-1.5 py-0.5 flex items-center gap-0.5"><Flame size={7} />HOT</span>}
            {prop.value && <span className="text-[8px] font-black text-[#4ADE80] bg-[#4ADE80]/12 border border-[#4ADE80]/20 rounded-full px-1.5 py-0.5 flex items-center gap-0.5"><Zap size={7} />VALUE</span>}
          </div>
          <p className="text-[10px] text-white/40 mb-2">{prop.propType}</p>

          {/* Prob bars */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div>
              <div className="flex justify-between mb-0.5"><span className="text-[8px] text-white/25">Model</span><span className="text-[8px] font-bold text-[#38BDF8]">{prop.modelProb}%</span></div>
              <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                <motion.div className="h-full bg-[#38BDF8] rounded-full" initial={{ width: 0 }} animate={{ width: `${prop.modelProb}%` }} transition={{ duration: 0.6, delay: index * 0.03 }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-0.5"><span className="text-[8px] text-white/25">Implied</span><span className="text-[8px] font-bold text-white/40">{prop.impliedProb}%</span></div>
              <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                <motion.div className="h-full bg-white/20 rounded-full" initial={{ width: 0 }} animate={{ width: `${prop.impliedProb}%` }} transition={{ duration: 0.6, delay: index * 0.03 + 0.1 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Odds + add */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <OddsPill odds={prop.odds} size="xs" />
          <EdgeBadge edge={prop.edge} />
          <button onClick={() => onToggle(prop)}
            className={`flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg border transition-all ${
              inSlip ? "border-[#FBBF24]/40 bg-[#FBBF24]/10 text-[#FBBF24]" : "border-white/[0.1] text-white/35 hover:text-white hover:border-white/25"
            }`}>
            {inSlip ? <><CheckCircle2 size={9} />Added</> : <><Plus size={9} />Add</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Prop Slip Panel ───────────────────────────────────────────────────────────

function PropSlip({ legs, onRemove, onClear }: {
  legs: SlipLeg[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const [stake, setStake] = useState("10");
  const [submitted, setSubmitted] = useState(false);

  const totalDecimal = combinedDecimalOdds(legs);
  const combinedOdds = legs.length > 0 ? decimalToAmerican(totalDecimal) : null;
  const stakeNum     = parseFloat(stake) || 0;
  const payout       = legs.length > 0 ? (stakeNum * totalDecimal).toFixed(2) : "0.00";
  const profit       = legs.length > 0 ? (stakeNum * totalDecimal - stakeNum).toFixed(2) : "0.00";

  if (submitted) {
    return (
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl border border-[#4ADE80]/25 bg-[#4ADE80]/[0.05] p-5 text-center">
        <CheckCircle2 size={32} className="text-[#4ADE80] mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-sm font-black text-white mb-1">Slip Saved!</p>
        <p className="text-xs text-white/40 mb-4">Track your {legs.length}-leg parlay in Bet Tracker</p>
        <button onClick={() => { setSubmitted(false); onClear(); }} className="text-xs font-bold text-[#4ADE80]/70 hover:text-[#4ADE80]">New Slip</button>
      </motion.div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0A0E18] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <ShoppingCart size={13} className="text-[#FBBF24]" strokeWidth={2} />
          <p className="text-xs font-black text-white">Prop Slip</p>
          {legs.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#FBBF24] text-[#0A0E18] text-[9px] font-black flex items-center justify-center">{legs.length}</span>
          )}
        </div>
        {legs.length > 0 && (
          <button onClick={onClear} className="text-[10px] text-white/30 hover:text-[#F87171] transition-colors flex items-center gap-1">
            <Trash2 size={10} />Clear
          </button>
        )}
      </div>

      {legs.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <ShoppingCart size={28} className="text-white/10 mx-auto mb-2" strokeWidth={1.2} />
          <p className="text-xs text-white/25">Add props to build a parlay</p>
          <p className="text-[10px] text-white/15 mt-1">Click "Add" on any prop below</p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {/* Legs */}
          {legs.map((leg) => (
            <motion.div key={leg.prop.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-2 px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-white/80 truncate">{leg.prop.playerName}</p>
                <p className="text-[9px] text-white/35 truncate">{leg.prop.propType}</p>
              </div>
              <OddsPill odds={leg.prop.odds} size="xs" />
              <button onClick={() => onRemove(leg.prop.id)} className="text-white/20 hover:text-[#F87171] transition-colors mt-0.5">
                <X size={12} strokeWidth={2} />
              </button>
            </motion.div>
          ))}

          {/* Combined odds */}
          {legs.length >= 2 && combinedOdds && (
            <div className="px-4 py-3 bg-[#FBBF24]/[0.04]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/40">{legs.length}-Leg Parlay</span>
                <span className="text-sm font-black text-[#FBBF24]">{combinedOdds}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-white/25">Decimal</span>
                <span className="text-[9px] text-white/40">{totalDecimal.toFixed(2)}x</span>
              </div>
            </div>
          )}

          {/* Stake */}
          <div className="px-4 py-3">
            <p className="text-[9px] text-white/30 uppercase tracking-widest mb-2">Stake (Units)</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 border border-white/[0.1] rounded-xl px-3 py-2 flex-1 bg-white/[0.03]">
                <DollarSign size={11} className="text-white/30" strokeWidth={2} />
                <input
                  type="number" value={stake} onChange={(e) => setStake(e.target.value)} min="1"
                  className="flex-1 bg-transparent text-sm font-bold text-white outline-none w-full"
                />
              </div>
              {[5, 10, 25].map(v => (
                <button key={v} onClick={() => setStake(String(v))}
                  className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border transition-colors ${stake === String(v) ? "border-[#FBBF24]/40 bg-[#FBBF24]/10 text-[#FBBF24]" : "border-white/[0.08] text-white/30 hover:text-white"}`}>
                  {v}u
                </button>
              ))}
            </div>
          </div>

          {/* Payout */}
          <div className="px-4 py-3 bg-white/[0.02]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-white/40">Potential Payout</span>
              <span className="text-sm font-black text-[#4ADE80]">${payout}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/25">Profit</span>
              <span className="text-[9px] text-white/50">+${profit}</span>
            </div>
          </div>

          {/* Submit */}
          <div className="px-4 py-3">
            <button onClick={() => setSubmitted(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition-colors bg-[#FBBF24]/15 border border-[#FBBF24]/30 text-[#FBBF24] hover:bg-[#FBBF24]/25">
              <Trophy size={12} strokeWidth={2.5} />Save to Bet Tracker
            </button>
            <p className="text-[8px] text-white/15 text-center mt-2">
              For informational use only · Not a real wager
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Value Bets Section ────────────────────────────────────────────────────────

function ValueBetsSection({ onToggle, slip }: { onToggle: (p: SlipProp) => void; slip: SlipLeg[] }) {
  const valueBets = WC_PLAYER_PROPS.filter(p => p.value || p.edge >= 8);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-xl border border-[#38BDF8]/15 bg-[#38BDF8]/[0.05] px-4 py-2.5 mb-3">
        <Target size={12} className="text-[#38BDF8]" />
        <p className="text-[11px] text-[#38BDF8]/80">
          <span className="font-bold text-[#38BDF8]">Value bets</span> — model probability exceeds FanDuel implied by ≥8 points
        </p>
      </div>
      {valueBets.map((p, i) => (
        <PropRow key={p.id} prop={p} inSlip={slip.some(l => l.prop.id === p.id)} onToggle={onToggle} index={i} />
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function BettingDashboard() {
  const [tab, setTab]         = useState<"markets" | "props" | "value">("markets");
  const [slip, setSlip]       = useState<SlipLeg[]>([]);
  const [propMatch, setPropMatch] = useState<string>("usa_par");
  const [propFilter, setPropFilter] = useState<"all" | "scorer" | "shots" | "assists">("all");
  const [showSlip, setShowSlip] = useState(false);

  const toggleProp = (prop: SlipProp) => {
    setSlip(prev => {
      const exists = prev.find(l => l.prop.id === prop.id);
      if (exists) return prev.filter(l => l.prop.id !== prop.id);
      return [...prev, { prop, pick: `${prop.playerName} — ${prop.propType}` }];
    });
    setShowSlip(true);
  };

  const addMoneyline = (leg: SlipLeg) => {
    setSlip(prev => {
      const exists = prev.find(l => l.prop.id === leg.prop.id);
      if (exists) return prev;
      return [...prev, leg];
    });
    setShowSlip(true);
  };

  const filteredProps = WC_PLAYER_PROPS.filter(p => {
    const matchOk = p.matchId === propMatch;
    if (!matchOk) return false;
    if (propFilter === "scorer")  return p.propType.includes("Goalscorer");
    if (propFilter === "shots")   return p.propType.includes("Shots");
    if (propFilter === "assists") return p.propType.includes("Assist");
    return true;
  });

  return (
    <div className="flex flex-col xl:flex-row gap-5">
      {/* ── Left: main content ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-[#FF7828]/25 bg-[#FF7828]/[0.08] px-3 py-1.5">
              <BarChart3 size={11} className="text-[#FF7828]" strokeWidth={2.5} />
              <span className="text-[10px] font-black text-[#FF7828] tracking-widest uppercase">WC Odds</span>
            </div>
            <span className="text-[10px] text-white/30">FanDuel • WC 2026</span>
          </div>
          {/* Slip toggle (mobile) */}
          <button onClick={() => setShowSlip(v => !v)}
            className="xl:hidden flex items-center gap-2 rounded-xl border border-[#FBBF24]/25 bg-[#FBBF24]/[0.08] px-3 py-1.5">
            <ShoppingCart size={12} className="text-[#FBBF24]" />
            <span className="text-[10px] font-black text-[#FBBF24]">Slip</span>
            {slip.length > 0 && <span className="w-4 h-4 rounded-full bg-[#FBBF24] text-[#0A0E18] text-[9px] font-black flex items-center justify-center">{slip.length}</span>}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-0.5 w-fit">
          {(["markets", "props", "value"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${tab === t ? "bg-[#FF7828]/15 text-[#FF7828]" : "text-white/30 hover:text-white"}`}>
              {t === "markets" ? "Moneylines" : t === "props" ? "Player Props" : "Value Bets"}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {tab === "markets" && (
            <motion.div key="markets" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="space-y-3">
              {TODAY_MATCHES.map(m => <MatchCard key={m.id} match={m} onAddMoneyline={addMoneyline} />)}
            </motion.div>
          )}

          {tab === "props" && (
            <motion.div key="props" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
              {/* Match selector */}
              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                {TODAY_MATCHES.map(m => (
                  <button key={m.id} onClick={() => setPropMatch(m.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${propMatch === m.id ? "border-[#FBBF24]/30 bg-[#FBBF24]/[0.08] text-[#FBBF24]" : "border-white/[0.08] text-white/35 hover:text-white"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://flagcdn.com/w40/${m.homeFlag}.png`} alt="" className="w-4 h-3 rounded object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display="none"; }} />
                    {m.home} vs {m.away}
                  </button>
                ))}
              </div>
              {/* Prop type filters */}
              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                {(["all", "scorer", "shots", "assists"] as const).map(f => (
                  <button key={f} onClick={() => setPropFilter(f)}
                    className={`px-2.5 py-1 rounded-full text-[9px] font-bold border transition-all ${propFilter === f ? "bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/25" : "text-white/25 border-white/[0.07] hover:text-white"}`}>
                    {f === "all" ? "All" : f === "scorer" ? "Goalscorers" : f === "shots" ? "Shots" : "Assists"}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {filteredProps.map((p, i) => (
                  <PropRow key={p.id} prop={p} inSlip={slip.some(l => l.prop.id === p.id)} onToggle={toggleProp} index={i} />
                ))}
                {filteredProps.length === 0 && (
                  <div className="text-center py-8 text-white/25 text-sm">No props in this filter</div>
                )}
              </div>
            </motion.div>
          )}

          {tab === "value" && (
            <motion.div key="value" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
              <ValueBetsSection onToggle={toggleProp} slip={slip} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Right: Prop Slip ──────────────────────────────────────────────────── */}
      <div className={`xl:w-72 shrink-0 ${showSlip ? "block" : "hidden xl:block"}`}>
        <div className="sticky top-4">
          <PropSlip legs={slip} onRemove={(id) => setSlip(prev => prev.filter(l => l.prop.id !== id))} onClear={() => setSlip([])} />

          {/* Disclaimer */}
          <p className="text-[9px] text-white/15 text-center mt-3 px-2">
            Odds via FanDuel · For informational use only · Not financial advice
          </p>
        </div>
      </div>
    </div>
  );
}
