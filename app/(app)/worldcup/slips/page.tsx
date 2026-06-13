"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Check, X, Ticket, ChevronDown, DollarSign,
  Trophy, Zap, RotateCcw, ArrowLeft, Target,
} from "lucide-react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WCBetLeg {
  id: string;
  description: string;
  propType: WCPropType;
  teamOrPlayer: string;
  matchLabel: string;
  odds: string;
  probability: number;
}

interface WCBetSlip {
  id: string;
  createdAt: string;
  legs: WCBetLeg[];
  wager: number;
  status: "pending" | "won" | "lost";
  settledAt?: string;
  toWin?: number;
}

type WCPropType =
  | "Match Result (1X2)"
  | "Both Teams to Score"
  | "Over/Under Goals"
  | "First Goalscorer"
  | "Anytime Goalscorer"
  | "Correct Score"
  | "Half-Time Result"
  | "Double Chance"
  | "Asian Handicap"
  | "Tournament Winner"
  | "Group Winner"
  | "Golden Boot";

// ── Prop type options for quick-add ───────────────────────────────────────────

const QUICK_PROPS: { type: WCPropType; label: string; examples: string[]; color: string }[] = [
  { type: "Match Result (1X2)",  label: "1X2",         examples: ["France Win", "Draw", "Brazil Win"],             color: "#FBBF24" },
  { type: "Both Teams to Score", label: "BTTS",         examples: ["Yes (+BTTS)", "No (-BTTS)"],                   color: "#34D399" },
  { type: "Over/Under Goals",    label: "O/U Goals",    examples: ["Over 2.5", "Under 2.5", "Over 1.5"],           color: "#38BDF8" },
  { type: "First Goalscorer",    label: "1st Scorer",   examples: ["Mbappe", "Vinicius Jr.", "Morata"],             color: "#FF7828" },
  { type: "Anytime Goalscorer",  label: "Anytime GS",   examples: ["Neymar to Score", "Lewandowski to Score"],     color: "#818CF8" },
  { type: "Correct Score",       label: "Exact Score",  examples: ["2-1 France", "1-0 Brazil"],                    color: "#F472B6" },
  { type: "Half-Time Result",    label: "HT Result",    examples: ["HT France Lead", "HT Draw"],                   color: "#A78BFA" },
  { type: "Double Chance",       label: "Dbl Chance",   examples: ["France or Draw", "Brazil or Draw"],            color: "#60A5FA" },
  { type: "Tournament Winner",   label: "Winner",       examples: ["France +450", "Brazil +600", "Spain +700"],    color: "#FBBF24" },
  { type: "Group Winner",        label: "Group Win",    examples: ["Group A Winner", "Group B Winner"],            color: "#34D399" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function americanToDecimal(odds: string): number {
  const n = parseInt(odds.replace("+", ""), 10);
  if (isNaN(n)) return 2;
  return n > 0 ? n / 100 + 1 : 100 / Math.abs(n) + 1;
}

function parlayDecimal(legs: WCBetLeg[]): number {
  return legs.reduce((acc, l) => acc * americanToDecimal(l.odds || "+100"), 1);
}

function calcToWin(wager: number, legs: WCBetLeg[]): number {
  return Math.round((wager * parlayDecimal(legs) - wager) * 100) / 100;
}

function impliedProb(odds: string): number {
  const n = parseInt(odds.replace("+", ""), 10);
  if (isNaN(n)) return 50;
  return n > 0
    ? Math.round(100 / (n + 100) * 100)
    : Math.round(Math.abs(n) / (Math.abs(n) + 100) * 100);
}

function combinedProb(legs: WCBetLeg[]): number {
  return Math.round(legs.reduce((acc, l) => acc * (l.probability / 100), 1) * 100);
}

const STORAGE_KEY = "wc-bet-slips";
function loadSlips(): WCBetSlip[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}
function saveSlips(slips: WCBetSlip[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(slips)); } catch {}
}

function uid() { return Math.random().toString(36).slice(2, 10); }

// ── Add Leg Modal ─────────────────────────────────────────────────────────────

function AddLegModal({ onAdd, onClose }: { onAdd: (leg: WCBetLeg) => void; onClose: () => void }) {
  const [step, setStep] = useState<"type" | "detail">("type");
  const [selectedType, setSelectedType] = useState<WCPropType | null>(null);
  const [desc, setDesc] = useState("");
  const [match, setMatch] = useState("");
  const [teamOrPlayer, setTeamOrPlayer] = useState("");
  const [odds, setOdds] = useState("+100");

  function submit() {
    if (!selectedType || !desc.trim()) return;
    const prob = impliedProb(odds);
    onAdd({
      id: uid(),
      description: desc.trim(),
      propType: selectedType,
      teamOrPlayer: teamOrPlayer.trim() || desc.trim(),
      matchLabel: match.trim() || "WC 2026",
      odds: odds.trim() || "+100",
      probability: prob,
    });
    onClose();
  }

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
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.09)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/[0.07] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#FBBF24] tracking-widest uppercase">WC 2026</p>
            <p className="text-base font-black text-white">{step === "type" ? "Pick a Bet Type" : "Add Leg Details"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white/50 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        {step === "type" && (
          <div className="p-4 grid grid-cols-2 gap-2">
            {QUICK_PROPS.map((p) => (
              <button
                key={p.type}
                onClick={() => { setSelectedType(p.type); setStep("detail"); }}
                className="text-left rounded-xl border border-white/[0.07] p-3 hover:border-white/20 transition-colors"
                style={{ background: `${p.color}08` }}
              >
                <p className="text-[10px] font-black tracking-wider uppercase mb-0.5" style={{ color: p.color }}>{p.label}</p>
                <p className="text-[10px] text-white/40 leading-tight">{p.examples[0]}</p>
              </button>
            ))}
          </div>
        )}

        {step === "detail" && selectedType && (
          <div className="p-5 space-y-4">
            <button onClick={() => setStep("type")} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
              <ArrowLeft size={12} /> Back
            </button>
            <div className="rounded-xl bg-[#FBBF24]/[0.08] border border-[#FBBF24]/20 px-3 py-2">
              <p className="text-[10px] font-black text-[#FBBF24] tracking-wider uppercase">{selectedType}</p>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Bet Description *</p>
                <input
                  placeholder={QUICK_PROPS.find(p => p.type === selectedType)?.examples[0] ?? "e.g. France Win"}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#FBBF24]/40"
                />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Match / Context</p>
                <input
                  placeholder="e.g. France vs Brazil"
                  value={match}
                  onChange={(e) => setMatch(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#FBBF24]/40"
                />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">American Odds</p>
                <input
                  placeholder="+150 or -110"
                  value={odds}
                  onChange={(e) => setOdds(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#FBBF24]/40"
                />
                {odds && <p className="text-[10px] text-white/30 mt-1">Implied: {impliedProb(odds)}%</p>}
              </div>
            </div>

            <button
              onClick={submit}
              disabled={!desc.trim()}
              className="w-full h-11 rounded-xl font-bold text-sm text-white disabled:opacity-40 transition-opacity"
              style={{ background: "linear-gradient(135deg, #FBBF24, #F59E0B)" }}
            >
              Add Leg
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Slip Card ─────────────────────────────────────────────────────────────────

function SlipCard({ slip, onSettle, onDelete }: {
  slip: WCBetSlip;
  onSettle: (id: string, status: "won" | "lost") => void;
  onDelete: (id: string) => void;
}) {
  const isPending = slip.status === "pending";
  const toWin = slip.toWin ?? calcToWin(slip.wager, slip.legs);
  const prob = combinedProb(slip.legs);
  const statusColor = slip.status === "won" ? "#34D399" : slip.status === "lost" ? "#EB505A" : "#FBBF24";
  const decimal = parlayDecimal(slip.legs);
  const isParlay = slip.legs.length > 1;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: `${statusColor}25`, background: `${statusColor}05` }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isParlay && (
            <div className="flex items-center gap-1 rounded-full border border-[#FBBF24]/30 bg-[#FBBF24]/10 px-2 py-0.5">
              <Zap size={9} className="text-[#FBBF24]" />
              <span className="text-[9px] font-black text-[#FBBF24] uppercase tracking-wider">{slip.legs.length}-Leg Parlay</span>
            </div>
          )}
          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border`}
            style={{ color: statusColor, borderColor: `${statusColor}40`, background: `${statusColor}15` }}>
            {slip.status}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isPending && (
            <>
              <button onClick={() => onSettle(slip.id, "won")} className="w-6 h-6 rounded-lg bg-[#34D399]/15 border border-[#34D399]/30 flex items-center justify-center text-[#34D399] hover:bg-[#34D399]/25 transition-colors">
                <Check size={10} strokeWidth={3} />
              </button>
              <button onClick={() => onSettle(slip.id, "lost")} className="w-6 h-6 rounded-lg bg-[#EB505A]/15 border border-[#EB505A]/30 flex items-center justify-center text-[#EB505A] hover:bg-[#EB505A]/25 transition-colors">
                <X size={10} strokeWidth={3} />
              </button>
            </>
          )}
          <button onClick={() => onDelete(slip.id)} className="w-6 h-6 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/30 hover:text-white/60 transition-colors">
            <Trash2 size={10} />
          </button>
        </div>
      </div>

      {/* Legs */}
      <div className="divide-y divide-white/[0.04]">
        {slip.legs.map((leg) => (
          <div key={leg.id} className="px-4 py-2.5 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{leg.description}</p>
              <p className="text-[10px] text-white/30 truncate">{leg.propType} · {leg.matchLabel}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-black" style={{ color: parseInt(leg.odds) > 0 ? "#34D399" : "#FF7828" }}>{leg.odds}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/[0.05] flex items-center justify-between">
        <div>
          <p className="text-[9px] text-white/25 uppercase tracking-widest">Wager</p>
          <p className="text-sm font-black text-white">${slip.wager}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-white/25 uppercase tracking-widest">To Win</p>
          <p className="text-sm font-black" style={{ color: statusColor }}>${toWin.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-white/25 uppercase tracking-widest">{isParlay ? "Parlay" : "Odds"}</p>
          <p className="text-xs font-bold text-white/60">{isParlay ? `${decimal.toFixed(2)}x` : slip.legs[0]?.odds}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-white/25 uppercase tracking-widest">Win Prob</p>
          <p className="text-xs font-bold text-white/60">{prob}%</p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Builder ───────────────────────────────────────────────────────────────────

function SlipBuilder({ onSave }: { onSave: (slip: WCBetSlip) => void }) {
  const [legs, setLegs] = useState<WCBetLeg[]>([]);
  const [wager, setWager] = useState("10");
  const [showAdd, setShowAdd] = useState(false);

  const toWin = calcToWin(Number(wager) || 10, legs);
  const prob = combinedProb(legs);

  function addLeg(leg: WCBetLeg) { setLegs((prev) => [...prev, leg]); }
  function removeLeg(id: string) { setLegs((prev) => prev.filter(l => l.id !== id)); }

  function save() {
    if (!legs.length) return;
    const w = Number(wager) || 10;
    onSave({
      id: uid(),
      createdAt: new Date().toISOString(),
      legs,
      wager: w,
      status: "pending",
      toWin: calcToWin(w, legs),
    });
    setLegs([]);
    setWager("10");
  }

  return (
    <>
      <AnimatePresence>{showAdd && <AddLegModal onAdd={addLeg} onClose={() => setShowAdd(false)} />}</AnimatePresence>

      <div className="rounded-2xl border border-[#FBBF24]/20 bg-[#FBBF24]/[0.03] overflow-hidden">
        <div className="px-4 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FBBF24]/15 border border-[#FBBF24]/25 flex items-center justify-center">
              <Ticket size={14} className="text-[#FBBF24]" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-[#FBBF24] tracking-widest uppercase">WC 2026</p>
              <p className="text-sm font-black text-white">Build a Slip</p>
            </div>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 rounded-xl bg-[#FBBF24] px-3 py-2 text-xs font-black text-black hover:bg-[#F59E0B] transition-colors">
            <Plus size={12} strokeWidth={3} />
            Add Leg
          </button>
        </div>

        {legs.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Target size={28} className="mx-auto mb-2 text-white/10" strokeWidth={1.5} />
            <p className="text-sm text-white/25">No legs yet — add a bet to build your slip</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {legs.map((leg) => (
              <div key={leg.id} className="px-4 py-2.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{leg.description}</p>
                  <p className="text-[10px] text-white/30">{leg.propType} · {leg.matchLabel}</p>
                </div>
                <p className="text-xs font-black shrink-0" style={{ color: parseInt(leg.odds) > 0 ? "#34D399" : "#FF7828" }}>{leg.odds}</p>
                <button onClick={() => removeLeg(leg.id)} className="shrink-0 text-white/25 hover:text-[#EB505A] transition-colors">
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {legs.length > 0 && (
          <div className="px-4 pt-3 pb-4 border-t border-white/[0.06] space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Wager ($)</p>
                <div className="relative">
                  <DollarSign size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="number"
                    value={wager}
                    onChange={(e) => setWager(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.10] bg-white/[0.04] pl-7 pr-3 py-2 text-sm text-white outline-none focus:border-[#FBBF24]/40"
                  />
                </div>
              </div>
              <div className="flex gap-1.5 mt-4">
                {["5","10","25","50"].map(v => (
                  <button key={v} onClick={() => setWager(v)}
                    className="px-2.5 py-1.5 rounded-lg border border-white/[0.08] text-[10px] font-bold text-white/50 hover:text-white hover:border-[#FBBF24]/30 transition-colors">
                    ${v}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/40">To Win</span>
              <span className="font-black text-[#34D399]">${toWin.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/40">Win Probability</span>
              <span className="font-bold text-white/60">{prob}%</span>
            </div>
            {legs.length > 1 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">Parlay Odds</span>
                <span className="font-bold text-white/60">{parlayDecimal(legs).toFixed(2)}x</span>
              </div>
            )}
            <button
              onClick={save}
              className="w-full h-10 rounded-xl font-black text-sm text-black"
              style={{ background: "linear-gradient(135deg, #FBBF24, #F59E0B)" }}
            >
              Save Slip
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────

function StatsBar({ slips }: { slips: WCBetSlip[] }) {
  const settled = slips.filter(s => s.status !== "pending");
  const won = slips.filter(s => s.status === "won");
  const wagered = slips.reduce((a, s) => a + s.wager, 0);
  const returned = won.reduce((a, s) => a + s.wager + (s.toWin ?? 0), 0);
  const profit = returned - slips.filter(s => s.status !== "pending").reduce((a, s) => a + s.wager, 0);

  return (
    <div className="grid grid-cols-4 gap-2 mb-5">
      {[
        { label: "Total Slips", value: String(slips.length), color: "#FBBF24" },
        { label: "Won", value: String(won.length), color: "#34D399" },
        { label: "Win Rate", value: settled.length ? `${Math.round(won.length / settled.length * 100)}%` : "—", color: "#818CF8" },
        { label: "Net P/L", value: `${profit >= 0 ? "+" : ""}$${profit.toFixed(0)}`, color: profit >= 0 ? "#34D399" : "#EB505A" },
      ].map(({ label, value, color }) => (
        <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-center">
          <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-base font-black" style={{ color }}>{value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WCSlipsPage() {
  const [slips, setSlips] = useState<WCBetSlip[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "won" | "lost">("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSlips(loadSlips());
    setMounted(true);
  }, []);

  const persist = useCallback((next: WCBetSlip[]) => {
    setSlips(next);
    saveSlips(next);
  }, []);

  function addSlip(slip: WCBetSlip) { persist([slip, ...slips]); }
  function settle(id: string, status: "won" | "lost") {
    persist(slips.map(s => s.id === id ? { ...s, status, settledAt: new Date().toISOString() } : s));
  }
  function remove(id: string) { persist(slips.filter(s => s.id !== id)); }

  const filtered = filter === "all" ? slips : slips.filter(s => s.status === filter);

  if (!mounted) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-[#FBBF24]/70 tracking-widest uppercase mb-1">WC 2026</p>
          <h1 className="text-2xl font-black text-white">Bet Slips</h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-[#FBBF24]/25 bg-[#FBBF24]/[0.06] px-3 py-1.5">
          <Trophy size={12} className="text-[#FBBF24]" />
          <span className="text-xs font-black text-[#FBBF24]">World Cup</span>
        </div>
      </div>

      {slips.length > 0 && <StatsBar slips={slips} />}

      {/* Builder */}
      <SlipBuilder onSave={addSlip} />

      {/* Filter */}
      {slips.length > 0 && (
        <div className="flex items-center gap-1.5">
          {(["all", "pending", "won", "lost"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${
                filter === f
                  ? "bg-[#FBBF24] text-black"
                  : "border border-white/[0.08] text-white/40 hover:text-white/70"
              }`}
            >
              {f}
            </button>
          ))}
          {slips.length > 0 && (
            <button onClick={() => persist([])} className="ml-auto text-[10px] text-white/25 hover:text-white/50 transition-colors flex items-center gap-1">
              <RotateCcw size={10} /> Clear all
            </button>
          )}
        </div>
      )}

      {/* Slips list */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-10 text-center">
            <Ticket size={32} className="mx-auto mb-3 text-white/10" strokeWidth={1.2} />
            <p className="text-sm text-white/30">
              {slips.length === 0 ? "No slips yet — build your first World Cup parlay above" : `No ${filter} slips`}
            </p>
          </motion.div>
        ) : (
          filtered.map(slip => (
            <SlipCard key={slip.id} slip={slip} onSettle={settle} onDelete={remove} />
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
