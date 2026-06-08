"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Check, X, TrendingUp,
  BookOpen, Trophy, DollarSign, ChevronDown,
  BarChart3, Clock, Share2, Download, Zap,
} from "lucide-react";
import { PaywallGate } from "@/components/web-tool/paywall-gate";

// ── Player ID helper ──────────────────────────────────────────────────────────
function playerIdFromLegId(id: string): number | null {
  const n = parseInt(id.split("-")[0], 10);
  return isNaN(n) || n > 9999999 ? null : n;
}
const MLB_HEADSHOT = (id: number) =>
  `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${id}/headshot/67/current`;

// ── Types ─────────────────────────────────────────────────────────────────────

interface BetLeg {
  id: string;
  description: string;
  probability: number;
  odds: string; // American odds e.g. "+570" or "-110"
}

interface BetSlip {
  id: string;
  createdAt: string;
  legs: BetLeg[];
  wager: number;
  status: "pending" | "won" | "lost";
  settledAt?: string;
  toWin?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function americanToDecimal(odds: string): number {
  const n = parseInt(odds.replace("+", ""), 10);
  if (isNaN(n)) return 2;
  return n > 0 ? n / 100 + 1 : 100 / Math.abs(n) + 1;
}

function parlayDecimalOdds(legs: BetLeg[]): number {
  return legs.reduce((acc, l) => acc * americanToDecimal(l.odds || "+100"), 1);
}

function calcToWin(wager: number, legs: BetLeg[]): number {
  return Math.round((wager * parlayDecimalOdds(legs) - wager) * 100) / 100;
}

function impliedProbability(odds: string): number {
  const n = parseInt(odds.replace("+", ""), 10);
  if (isNaN(n)) return 50;
  return n > 0
    ? Math.round(100 / (n + 100) * 100)
    : Math.round(Math.abs(n) / (Math.abs(n) + 100) * 100);
}

function combinedProb(legs: BetLeg[]): number {
  return Math.round(legs.reduce((acc, l) => acc * (l.probability / 100), 1) * 100 * 10) / 10;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function colorFor(pct: number): string {
  if (pct >= 60) return "#50C882";
  if (pct >= 40) return "#FF7828";
  return "#EB505A";
}

// ── Supabase API helpers ──────────────────────────────────────────────────────

async function fetchSlips(): Promise<BetSlip[]> {
  const res = await fetch("/api/bet-slips");
  if (!res.ok) return [];
  const rows = await res.json();
  // Map snake_case DB columns → camelCase BetSlip
  return rows.map((r: any): BetSlip => ({
    id:         r.id,
    createdAt:  r.created_at,
    settledAt:  r.settled_at ?? undefined,
    legs:       r.legs,
    wager:      Number(r.wager),
    toWin:      r.to_win != null ? Number(r.to_win) : undefined,
    status:     r.status,
  }));
}

async function apiCreate(slip: BetSlip): Promise<void> {
  await fetch("/api/bet-slips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(slip),
  });
}

async function apiPatch(id: string, patch: Partial<BetSlip>): Promise<void> {
  await fetch(`/api/bet-slips/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

async function apiDelete(id: string): Promise<void> {
  await fetch(`/api/bet-slips/${id}`, { method: "DELETE" });
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string; sub?: string; color: string; icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon size={15} style={{ color }} strokeWidth={2} />
        </div>
        <p className="text-xs font-bold text-white/35 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-3xl font-black" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </div>
  );
}

// ── New slip form ─────────────────────────────────────────────────────────────

function NewSlipModal({ onSave, onClose }: { onSave: (slip: BetSlip) => void; onClose: () => void }) {
  const [legs, setLegs] = useState<BetLeg[]>([{ id: crypto.randomUUID(), description: "", probability: 50, odds: "+100" }]);
  const [wager, setWager] = useState("10");

  function addLeg() {
    setLegs((l) => [...l, { id: crypto.randomUUID(), description: "", probability: 50, odds: "+100" }]);
  }

  function updateLeg(id: string, field: keyof BetLeg, value: string | number) {
    setLegs((l) => l.map((leg) => leg.id === id ? { ...leg, [field]: value } : leg));
  }

  function removeLeg(id: string) {
    if (legs.length > 1) setLegs((l) => l.filter((leg) => leg.id !== id));
  }

  const toWin = calcToWin(parseFloat(wager) || 0, legs);
  const decOdds = parlayDecimalOdds(legs);
  const parlayOdds = decOdds >= 2
    ? `+${Math.round((decOdds - 1) * 100)}`
    : `-${Math.round(100 / (decOdds - 1))}`;

  function save() {
    const slip: BetSlip = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      legs,
      wager: parseFloat(wager) || 0,
      toWin,
      status: "pending",
    };
    onSave(slip);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-3xl border border-white/[0.08] bg-[#0D1117] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div>
            <p className="text-lg font-black text-white">Log a Slip</p>
            <p className="text-xs text-white/35">{legs.length}-Leg {legs.length > 1 ? "Parlay" : "Straight"}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Legs */}
          {legs.map((leg, i) => (
            <div key={leg.id} className="rounded-2xl border border-white/[0.06] bg-[#111622] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Leg {i + 1}</p>
                {legs.length > 1 && (
                  <button onClick={() => removeLeg(leg.id)} className="text-white/25 hover:text-[#EB505A] transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="e.g. Aaron Judge HR vs Cole"
                value={leg.description}
                onChange={(e) => updateLeg(leg.id, "description", e.target.value)}
                className="w-full rounded-xl border border-white/[0.07] bg-[#0D1117] px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-[#FF7828]/40"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Model Prob %</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={leg.probability}
                      onChange={(e) => updateLeg(leg.id, "probability", parseInt(e.target.value) || 50)}
                      className="w-full rounded-xl border border-white/[0.07] bg-[#0D1117] px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF7828]/40"
                    />
                    <span className="text-white/30 text-sm">%</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Odds (American)</p>
                  <input
                    type="text"
                    placeholder="+570"
                    value={leg.odds}
                    onChange={(e) => updateLeg(leg.id, "odds", e.target.value)}
                    className="w-full rounded-xl border border-white/[0.07] bg-[#0D1117] px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-[#FF7828]/40"
                  />
                  <p className="text-[9px] text-white/20 mt-1">Implied: {impliedProbability(leg.odds)}%</p>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addLeg}
            className="w-full rounded-2xl border border-dashed border-white/[0.12] py-3 flex items-center justify-center gap-2 text-sm text-white/35 hover:text-white hover:border-white/25 transition-colors"
          >
            <Plus size={14} />
            Add another leg
          </button>

          {/* Wager */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#111622] p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Wager ($)</p>
                <div className="flex items-center gap-2">
                  <DollarSign size={14} className="text-white/30 shrink-0" />
                  <input
                    type="number"
                    min="1"
                    value={wager}
                    onChange={(e) => setWager(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.07] bg-[#0D1117] px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF7828]/40"
                  />
                </div>
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">To Win (est.)</p>
                <div className="flex items-center h-10 px-3 rounded-xl border border-[#50C882]/20 bg-[#50C882]/[0.06]">
                  <span className="text-[#50C882] font-black text-sm">${toWin.toFixed(2)}</span>
                </div>
              </div>
            </div>
            {legs.length > 1 && (
              <div className="mt-3 flex items-center justify-between text-xs text-white/30">
                <span>Parlay odds</span>
                <span className="font-black text-[#FF7828]">{parlayOdds}</span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between text-xs text-white/30">
              <span>Combined model prob</span>
              <span className="font-black text-white">{combinedProb(legs)}%</span>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="px-6 py-5 border-t border-white/[0.06]">
          <button
            onClick={save}
            disabled={legs.some((l) => !l.description.trim())}
            className="w-full h-12 rounded-2xl bg-[#FF7828] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#FFA550] transition-colors disabled:opacity-40"
          >
            <BookOpen size={15} />
            Log Slip
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Share card (JPEG export) ──────────────────────────────────────────────────

function ShareModal({ slip, onClose }: { slip: BetSlip; onClose: () => void }) {
  const cardRef   = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const statusColor = slip.status === "won" ? "#50C882" : slip.status === "lost" ? "#EB505A" : "#FF7828";
  const hasOdds     = slip.legs.some((l) => l.odds && l.odds.length > 1);
  const decOdds     = parlayDecimalOdds(slip.legs);
  const toWinAmt    = hasOdds ? calcToWin(slip.wager, slip.legs) : null;
  const parlayOdds  = decOdds >= 2 ? `+${Math.round((decOdds - 1) * 100)}` : `-${Math.round(100 / (decOdds - 1))}`;
  const cp          = combinedProb(slip.legs);

  async function exportJpeg() {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const { toJpeg } = await import("html-to-image");
      const dataUrl = await toJpeg(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "#0A0E14",
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `mlbedgepro-slip-${slip.id.slice(0, 8)}.jpg`;
      link.click();

      // Also try Web Share API on mobile
      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "mlbedgepro-slip.jpg", { type: "image/jpeg" });
        await navigator.share({ files: [file], title: "My MLB Edge Pro Slip" }).catch(() => {});
      }
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0A0E14] overflow-hidden shadow-2xl"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <p className="text-sm font-black text-white">Share Slip</p>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* ── Share card — this exact div is exported as JPEG ── */}
        <div ref={cardRef} className="p-5 bg-[#0A0E14]" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>

          {/* Branding header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(255,120,40,0.15)", border: "1px solid rgba(255,120,40,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={13} style={{ color: "#FF7828" }} strokeWidth={2.5} />
              </div>
              <span style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 900 }}>
                MLB Edge<span style={{ color: "#FF7828" }}> Pro</span>
              </span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.30)", fontSize: 10 }}>{formatDate(slip.createdAt)}</span>
          </div>

          {/* Title + status */}
          <div className="flex items-center gap-2 mb-4">
            <span style={{ color: "#FFFFFF", fontSize: 15, fontWeight: 900 }}>
              {slip.legs.length}-Leg {slip.legs.length > 1 ? "Parlay" : "Straight"}
            </span>
            <span style={{
              color: statusColor, fontSize: 9, fontWeight: 900, padding: "2px 7px",
              borderRadius: 99, border: `1px solid ${statusColor}40`, background: `${statusColor}15`,
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              {slip.status}
            </span>
          </div>

          {/* Legs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {slip.legs.map((leg, i) => {
              const pid = playerIdFromLegId(leg.id);
              const legColor = leg.probability >= 65 ? "#50C882" : leg.probability >= 40 ? "#FF7828" : "#EB505A";
              return (
                <div key={leg.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "rgba(255,255,255,0.03)", borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.07)", padding: "10px 12px",
                }}>
                  {/* Number */}
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 900 }}>{i + 1}</span>
                  </div>

                  {/* Headshot */}
                  {pid && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={MLB_HEADSHOT(pid)}
                      alt=""
                      crossOrigin="anonymous"
                      style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(255,255,255,0.10)", flexShrink: 0 }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  )}

                  {/* Description */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "#FFFFFF", fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>{leg.description}</p>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 2 }}>
                      Model: {leg.probability}%
                      {leg.odds && leg.odds.length > 1 ? ` · ${leg.odds}` : ""}
                    </p>
                  </div>

                  {/* Prob badge */}
                  <div style={{
                    padding: "3px 8px", borderRadius: 8,
                    border: `1px solid ${legColor}40`, background: `${legColor}18`,
                    flexShrink: 0,
                  }}>
                    <span style={{ color: legColor, fontSize: 11, fontWeight: 900 }}>{leg.probability}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 14 }} />

          {/* Stats row */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
            {[
              { label: "WAGER",    value: `$${slip.wager}`,       color: "rgba(255,255,255,0.70)" },
              { label: "TO WIN",   value: toWinAmt ? `$${toWinAmt.toFixed(2)}` : "—",  color: "#50C882" },
              { label: "PARLAY",   value: hasOdds ? parlayOdds : "—", color: "#FF7828" },
              { label: "COMBINED", value: `${cp}%`,               color: colorFor(cp) },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ flex: 1, textAlign: "center" }}>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 8, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>{label}</p>
                <p style={{ color, fontSize: 13, fontWeight: 900 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 10 }}>
            <p style={{ color: "rgba(255,255,255,0.20)", fontSize: 9, textAlign: "center" }}>
              mlbedgepro.app · For educational use only · Not betting advice
            </p>
          </div>
        </div>
        {/* ── End share card ── */}

        {/* Actions */}
        <div className="px-5 pb-5 pt-4 border-t border-white/[0.06] flex gap-3">
          <button
            onClick={exportJpeg}
            disabled={saving}
            className="flex-1 h-11 rounded-2xl bg-[#FF7828] hover:bg-[#FFA550] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {saving
              ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : <Download size={15} strokeWidth={2.5} />
            }
            {saving ? "Exporting…" : "Save as JPEG"}
          </button>
          <button onClick={onClose} className="h-11 px-5 rounded-2xl border border-white/[0.08] text-white/40 hover:text-white text-sm font-bold transition-colors">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Slip card ─────────────────────────────────────────────────────────────────

function SlipCard({ slip, onSettle, onDelete, onUpdate, onShare }: {
  slip: BetSlip;
  onSettle: (id: string, status: "won" | "lost") => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updated: Partial<BetSlip>) => void;
  onShare: (slip: BetSlip) => void;
}) {
  const [expanded, setExpanded]   = useState(false);
  const [legs, setLegs]           = useState<BetLeg[]>(slip.legs);
  const [wager, setWager]         = useState(String(slip.wager || 10));
  const [dirty, setDirty]         = useState(false);

  const cp = combinedProb(legs);
  const isParlay    = legs.length > 1;
  const statusColor = slip.status === "won" ? "#50C882" : slip.status === "lost" ? "#EB505A" : "#FF7828";

  // Parlay math
  const decOdds   = parlayDecimalOdds(legs);
  const toWin     = calcToWin(parseFloat(wager) || 0, legs);
  const hasOdds   = legs.some((l) => l.odds && l.odds.length > 1);
  const parlayLine = decOdds >= 2
    ? `+${Math.round((decOdds - 1) * 100)}`
    : `-${Math.round(100 / (decOdds - 1))}`;

  function updateLegOdds(id: string, odds: string) {
    const next = legs.map((l) => l.id === id ? { ...l, odds } : l);
    setLegs(next);
    setDirty(true);
  }

  function saveChanges() {
    const updated: Partial<BetSlip> = {
      legs,
      wager: parseFloat(wager) || 10,
      toWin,
    };
    onUpdate(slip.id, updated);
    setDirty(false);
  }

  return (
    <div className={`rounded-2xl border overflow-hidden transition-colors ${
      slip.status === "won" ? "border-[#50C882]/20" :
      slip.status === "lost" ? "border-[#EB505A]/15" :
      "border-white/[0.07]"
    } bg-[#111622]`}>
      {/* Header row */}
      <button className="w-full px-5 py-4 flex items-start gap-4 text-left" onClick={() => setExpanded((v) => !v)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-black text-white">
              {legs.length}-Leg {isParlay ? "Parlay" : "Straight"}
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full border"
              style={{ color: statusColor, borderColor: `${statusColor}35`, backgroundColor: `${statusColor}12` }}>
              {slip.status.toUpperCase()}
            </span>
          </div>
          <p className="text-[11px] text-white/30 truncate">
            {legs.map((l) => l.description).join(" · ")}
          </p>
          <div className="flex items-center gap-4 mt-2 text-[10px] text-white/25">
            <span>${slip.wager} wager</span>
            {hasOdds && <span className="text-[#50C882]">→ ${toWin.toFixed(2)} to win</span>}
            {hasOdds && isParlay && <span className="text-[#FF7828] font-bold">{parlayLine}</span>}
            <span>{formatDate(slip.createdAt)}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-2">
            {/* Share button */}
            <button
              onClick={(e) => { e.stopPropagation(); onShare(slip); }}
              className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center text-white/30 hover:text-[#FF7828] hover:bg-[#FF7828]/10 transition-colors"
              title="Share as image"
            >
              <Share2 size={12} strokeWidth={2} />
            </button>
            <ChevronDown size={14} className={`text-white/20 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </div>
          <p className="text-xl font-black" style={{ color: colorFor(cp) }}>{cp}%</p>
          <p className="text-[9px] text-white/25">model prob</p>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {/* Legs with FanDuel odds input */}
            <div className="border-t border-white/[0.05] px-5 pt-4 pb-3 space-y-3">
              <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-1">
                Legs · Enter FanDuel odds per leg
              </p>
              {legs.map((leg, i) => (
                <div key={leg.id} className="rounded-xl border border-white/[0.06] bg-[#0D1117] p-3">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black bg-white/[0.06] text-white/30 shrink-0 mt-0.5">{i + 1}</div>
                    <p className="text-xs font-bold text-white flex-1">{leg.description}</p>
                    <p className="text-[10px] text-white/30 shrink-0">Model: {leg.probability}%</p>
                  </div>
                  <div className="flex items-center gap-3 pl-8">
                    <div className="flex-1">
                      <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">FanDuel Odds</p>
                      <input
                        type="text"
                        placeholder="+570"
                        value={leg.odds}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateLegOdds(leg.id, e.target.value)}
                        className="w-full rounded-lg border border-white/[0.08] bg-[#111622] px-2.5 py-1.5 text-sm font-black text-[#FF7828] placeholder-white/15 outline-none focus:border-[#FF7828]/40"
                      />
                    </div>
                    {leg.odds && leg.odds.length > 1 && (
                      <div className="text-center shrink-0">
                        <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">Implied</p>
                        <p className="text-sm font-black text-[#818cf8]">{impliedProbability(leg.odds)}%</p>
                      </div>
                    )}
                    {leg.odds && leg.odds.length > 1 && (
                      <div className="text-center shrink-0">
                        <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">Edge</p>
                        <p className={`text-sm font-black ${leg.probability - impliedProbability(leg.odds) > 0 ? "text-[#50C882]" : "text-[#EB505A]"}`}>
                          {leg.probability - impliedProbability(leg.odds) > 0 ? "+" : ""}{leg.probability - impliedProbability(leg.odds)}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Wager + parlay math */}
            {hasOdds && (
              <div className="px-5 pb-4">
                <div className="rounded-xl border border-[#FF7828]/20 bg-[#FF7828]/[0.05] p-4 space-y-3">
                  <p className="text-[10px] font-bold text-[#FF7828]/60 uppercase tracking-widest">
                    Parlay Payout Math — Matches FanDuel Exactly
                  </p>

                  {/* Steps */}
                  <div className="rounded-lg border border-white/[0.06] bg-[#0D1117] p-3 space-y-2 text-xs font-mono">
                    <p className="text-white/40">
                      <span className="text-[#2dd4bf] mr-2">01</span>
                      {legs.filter((l) => l.odds).map((l) => {
                        const dec = americanToDecimal(l.odds);
                        return `${l.odds}→${dec.toFixed(3)}`;
                      }).join(" × ")}
                    </p>
                    <p className="text-white/40">
                      <span className="text-[#2dd4bf] mr-2">02</span>
                      product = <span className="text-white">{decOdds.toFixed(4)}</span>
                    </p>
                    <p className="text-white/40">
                      <span className="text-[#2dd4bf] mr-2">03</span>
                      parlay line = <span className="text-[#FF7828] font-black">{parlayLine}</span>
                    </p>
                  </div>

                  {/* Wager */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1.5">Wager ($)</p>
                      <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#0D1117] px-3 py-2">
                        <DollarSign size={13} className="text-white/25 shrink-0" />
                        <input
                          type="number"
                          value={wager}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => { setWager(e.target.value); setDirty(true); }}
                          className="w-full bg-transparent text-sm font-black text-white outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1.5">To Win</p>
                      <div className="flex items-center h-10 px-3 rounded-xl border border-[#50C882]/25 bg-[#50C882]/[0.07]">
                        <span className="text-[#50C882] font-black">${toWin.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Example payout */}
                  <div className="rounded-lg border border-white/[0.05] bg-[#0D1117] px-4 py-2.5 flex items-center justify-between text-xs">
                    <span className="text-white/30">
                      {legs.filter((l) => l.odds).map((l) => l.odds).join(" · ")} →
                    </span>
                    <span className="font-black text-[#FF7828]">{parlayLine}</span>
                  </div>

                  {dirty && (
                    <button
                      onClick={(e) => { e.stopPropagation(); saveChanges(); }}
                      className="w-full h-9 rounded-xl bg-[#FF7828] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#FFA550] transition-colors"
                    >
                      <Check size={13} />
                      Save odds &amp; wager
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Settle / delete actions */}
            {slip.status === "pending" && (
              <div className="px-5 pb-5 flex items-center gap-2">
                <button onClick={() => onSettle(slip.id, "won")}
                  className="flex-1 h-10 rounded-xl border border-[#50C882]/30 bg-[#50C882]/10 text-[#50C882] text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#50C882]/18 transition-colors">
                  <Check size={14} /> Won
                </button>
                <button onClick={() => onSettle(slip.id, "lost")}
                  className="flex-1 h-10 rounded-xl border border-[#EB505A]/30 bg-[#EB505A]/10 text-[#EB505A] text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#EB505A]/18 transition-colors">
                  <X size={14} /> Lost
                </button>
                <button onClick={() => onDelete(slip.id)}
                  className="h-10 w-10 rounded-xl border border-white/[0.06] text-white/25 flex items-center justify-center hover:text-[#EB505A] transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
            {slip.status !== "pending" && (
              <div className="px-5 pb-4 flex items-center justify-between">
                <p className="text-xs text-white/25">Settled {formatDate(slip.settledAt ?? slip.createdAt)}</p>
                <button onClick={() => onDelete(slip.id)} className="text-white/20 hover:text-[#EB505A] transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Donut chart ───────────────────────────────────────────────────────────────

function DonutChart({ won, lost, pending }: { won: number; lost: number; pending: number }) {
  const total = won + lost + pending;
  if (total === 0) return (
    <div className="w-32 h-32 rounded-full border-4 border-white/[0.06] flex items-center justify-center">
      <span className="text-xs text-white/25">No data</span>
    </div>
  );

  const wonPct   = won / total;
  const lostPct  = lost / total;
  const r = 52, cx = 64, cy = 64, circ = 2 * Math.PI * r;

  const segments = [
    { pct: wonPct,              color: "#50C882", offset: 0 },
    { pct: lostPct,             color: "#EB505A", offset: wonPct },
    { pct: pending / total,     color: "#FF7828", offset: wonPct + lostPct },
  ];

  return (
    <div className="relative">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
        {segments.map((s, i) =>
          s.pct > 0 ? (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="12"
              strokeDasharray={`${s.pct * circ} ${circ}`}
              strokeDashoffset={`${-s.offset * circ}`}
              strokeLinecap="round"
              style={{ transform: "rotate(-90deg)", transformOrigin: "64px 64px" }}
            />
          ) : null
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xl font-black text-white">{total}</p>
        <p className="text-[9px] text-white/30 uppercase tracking-wider">slips</p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type TabType = "pending" | "won" | "lost";

export default function BetTrackerPage() {
  const [slips, setSlips]           = useState<BetSlip[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [activeTab, setActiveTab]   = useState<TabType>("pending");
  const [sharingSlip, setSharingSlip] = useState<BetSlip | null>(null);

  // Load from Supabase on mount
  useEffect(() => {
    fetchSlips().then((data) => { setSlips(data); setLoading(false); });
  }, []);

  async function addSlip(slip: BetSlip) {
    setSlips((prev) => [slip, ...prev]); // optimistic
    await apiCreate(slip);
  }

  async function settleSlip(id: string, status: "won" | "lost") {
    const settledAt = new Date().toISOString();
    setSlips((prev) => prev.map((s) => s.id === id ? { ...s, status, settledAt } : s));
    await apiPatch(id, { status, settledAt });
  }

  async function deleteSlip(id: string) {
    setSlips((prev) => prev.filter((s) => s.id !== id));
    await apiDelete(id);
  }

  async function updateSlip(id: string, updated: Partial<BetSlip>) {
    setSlips((prev) => prev.map((s) => s.id === id ? { ...s, ...updated } : s));
    await apiPatch(id, updated);
  }

  const won     = slips.filter((s) => s.status === "won");
  const lost    = slips.filter((s) => s.status === "lost");
  const pending = slips.filter((s) => s.status === "pending");
  const settled = [...won, ...lost];

  const winRate   = settled.length ? Math.round((won.length / settled.length) * 100) : 0;
  const totalWagered = slips.reduce((a, s) => a + s.wager, 0);
  const totalWon     = won.reduce((a, s) => a + (s.toWin ?? 0), 0);
  const totalLost    = lost.reduce((a, s) => a + s.wager, 0);
  const roi          = totalWagered > 0 ? Math.round(((totalWon - totalLost) / totalWagered) * 100) : 0;

  const tabs: Array<{ id: TabType; label: string; count: number; color: string }> = [
    { id: "pending", label: "Open",  count: pending.length, color: "#FF7828" },
    { id: "won",     label: "Won",   count: won.length,     color: "#50C882" },
    { id: "lost",    label: "Lost",  count: lost.length,    color: "#EB505A" },
  ];

  const visibleSlips = activeTab === "pending" ? pending : activeTab === "won" ? won : lost;

  if (loading) {
    return (
      <PaywallGate requiredTier="pro" feature="Bet Tracker" benefits={[]}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#FF7828]/30 border-t-[#FF7828] animate-spin" />
            <p className="text-sm text-white/30">Loading your slips…</p>
          </div>
        </div>
      </PaywallGate>
    );
  }

  return (
    <PaywallGate
      requiredTier="pro"
      feature="Bet Tracker"
      benefits={[
        "Log every slip with FanDuel odds per leg",
        "Exact parlay payout math — matches FanDuel",
        "Win rate, ROI, and P&L tracking over time",
        "Mark slips Won / Lost as results come in",
        "Full bet history with leg-by-leg breakdown",
      ]}
    >
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-screen-lg mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-1">Bet Tracker</p>
          <h1 className="text-3xl font-black text-white">My Slips</h1>
          <p className="text-sm text-white/35 mt-1">Build slips in Prop Builder → they appear here automatically</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] text-white/50 font-bold px-4 py-2.5 text-sm hover:bg-white/[0.07] hover:text-white transition-colors"
        >
          <Plus size={14} strokeWidth={2.5} />
          Manual entry
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Win Rate"    value={`${winRate}%`}  sub={`${settled.length} settled`}     color="#50C882" icon={Trophy} />
        <StatCard label="ROI"         value={`${roi > 0 ? "+" : ""}${roi}%`} sub="return on investment" color={roi >= 0 ? "#50C882" : "#EB505A"} icon={TrendingUp} />
        <StatCard label="Net P&L"     value={`${totalWon - totalLost >= 0 ? "+" : ""}$${(totalWon - totalLost).toFixed(0)}`} sub={`$${totalWagered.toFixed(0)} wagered`} color={totalWon - totalLost >= 0 ? "#50C882" : "#EB505A"} icon={DollarSign} />
        <StatCard label="Open Slips"  value={`${pending.length}`} sub="pending results"           color="#FF7828" icon={Clock} />
      </div>

      {/* Chart + breakdown */}
      <div className="grid sm:grid-cols-[auto_1fr] gap-5 mb-8">
        {/* Donut */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-6 flex flex-col items-center gap-4">
          <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase self-start">Slip Distribution</p>
          <DonutChart won={won.length} lost={lost.length} pending={pending.length} />
          <div className="flex items-center gap-5">
            {[
              { label: "Won",    n: won.length,     color: "#50C882" },
              { label: "Lost",   n: lost.length,    color: "#EB505A" },
              { label: "Open",   n: pending.length, color: "#FF7828" },
            ].map(({ label, n, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-white/40">{label} <span className="text-white font-bold">{n}</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Win rate bar breakdown */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-6">
          <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-5">Performance Breakdown</p>
          {settled.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-white/25">Settle some slips to see stats here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { label: "Win Rate",        val: winRate,                               color: "#50C882", pct: winRate },
                { label: "Slips Won",       val: won.length,    suffix: ` / ${settled.length}`, color: "#50C882", pct: (won.length / Math.max(settled.length, 1)) * 100 },
                { label: "Total Wagered",   val: `$${totalWagered.toFixed(0)}`,         color: "#818cf8", pct: 60 },
                { label: "Total Returned",  val: `$${totalWon.toFixed(0)}`,             color: "#2dd4bf", pct: Math.min(100, (totalWon / Math.max(totalWagered, 1)) * 100) },
              ].map(({ label, val, suffix, color, pct }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-white/40">{label}</span>
                    <span className="text-sm font-black" style={{ color }}>{typeof val === "number" ? `${val}%` : val}{suffix ?? ""}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.06]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-colors border ${
              activeTab === t.id
                ? "text-white border-transparent"
                : "text-white/35 border-white/[0.07] hover:text-white bg-[#111622]"
            }`}
            style={activeTab === t.id ? { backgroundColor: `${t.color}20`, borderColor: `${t.color}35`, color: t.color } : {}}
          >
            {t.label}
            <span className="rounded-full px-1.5 py-0.5 text-[10px] font-black min-w-[20px] text-center"
              style={{ backgroundColor: `${t.color}20`, color: t.color }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Slip list */}
      <AnimatePresence mode="popLayout">
        {visibleSlips.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-white/[0.07] bg-[#111622] py-20 flex flex-col items-center gap-3"
          >
            <BookOpen size={36} className="text-white/10" strokeWidth={1.2} />
            <p className="text-sm text-white/30 font-bold">
              {activeTab === "pending" ? "No open slips" : activeTab === "won" ? "No wins logged yet" : "No losses logged yet"}
            </p>
            {activeTab === "pending" && (
              <a
                href="/props"
                className="mt-2 flex items-center gap-2 rounded-xl border border-[#FF7828]/30 bg-[#FF7828]/10 px-4 py-2 text-sm font-bold text-[#FF7828] hover:bg-[#FF7828]/18 transition-colors"
              >
                <Plus size={14} />
                Build a slip in Prop Builder
              </a>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            {visibleSlips.map((slip) => (
              <motion.div
                key={slip.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
              >
                <SlipCard slip={slip} onSettle={settleSlip} onDelete={deleteSlip} onUpdate={updateSlip} onShare={setSharingSlip} />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <p className="mt-8 text-xs text-white/15 text-center">
        Bet history synced across all your devices via Supabase. For educational tracking only.
      </p>

      {/* Modals */}
      <AnimatePresence>
        {showModal && <NewSlipModal onSave={addSlip} onClose={() => setShowModal(false)} />}
        {sharingSlip && <ShareModal slip={sharingSlip} onClose={() => setSharingSlip(null)} />}
      </AnimatePresence>
    </div>
    </PaywallGate>
  );
}
