"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  deleteLeg, deleteSlip, updateLeg, updateSlip, useSavedSlips,
  type SavedSlip, type SlipLeg, type SlipSport, type SlipStatus,
} from "@/lib/saved-slips";
import { settlePendingSlips } from "@/lib/slip-settle";
import { computeRecord, parseAmerican, slipReturn, type TrackRecord } from "@/lib/track-record";

const BLUE = "#1a73ff";
const GOOD = "#12a150";
const BAD = "#e5484d";
const SPORT_COLOR: Record<SlipSport, string> = { MLB: "#ea6a0a", NFL: "#6d4fe0", NBA: "#1a73ff", WNBA: "#0f9d8e", Soccer: "#12a150", Mixed: "#6d4fe0" };
const STATUS: Record<SlipStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "#d49a06" }, won: { label: "Won", color: GOOD }, lost: { label: "Lost", color: BAD }, push: { label: "Push", color: "#8a93a6" },
};
const usd = (n: number, sign = false) => `${sign ? (n > 0 ? "+" : n < 0 ? "−" : "") : n < 0 ? "−" : ""}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: Math.abs(n) >= 1000 ? 0 : 2, maximumFractionDigits: Math.abs(n) >= 1000 ? 0 : 2 })}`;
const dateStr = (t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/* ───────────────────────── Track record ───────────────────────── */

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl px-3.5 py-3" style={{ background: "var(--wash-1)", border: "1px solid var(--hairline)" }}>
      <p className="font-spot-sans font-extrabold text-[8.5px] uppercase tracking-[.12em]" style={{ color: "var(--text-faint)" }}>{label}</p>
      <p className="mt-1 font-spot-mono font-black text-[21px] leading-none" style={{ color: color ?? "var(--text)" }}>{value}</p>
      {sub && <p className="mt-1.5 font-spot-sans text-[10px]" style={{ color: "var(--text-faint)" }}>{sub}</p>}
    </div>
  );
}

function CalRow({ label, n, pred, actual }: { label: string; n: number; pred: number; actual: number }) {
  const diff = actual - pred;
  return (
    <div className="py-2" style={{ borderTop: "1px solid var(--hairline)" }}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-spot-sans font-extrabold text-[12px]" style={{ color: "var(--text)" }}>{label} <span className="font-spot-mono font-bold text-[10px]" style={{ color: "var(--text-faint)" }}>n={n}</span></p>
        <p className="font-spot-mono font-bold text-[11px]" style={{ color: n < 8 ? "var(--text-faint)" : Math.abs(diff) < 3 ? "var(--text-3)" : diff > 0 ? GOOD : BAD }}>
          {Math.round(pred)}% → {Math.round(actual)}% {n >= 8 && Math.abs(diff) >= 3 ? `(${diff > 0 ? "+" : ""}${Math.round(diff)})` : ""}
        </p>
      </div>
      <div className="relative mt-1.5 h-[6px] rounded-full" style={{ background: "var(--wash-3)" }}>
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.max(3, actual)}%`, background: diff >= 0 ? GOOD : BAD, opacity: 0.85 }} />
        <span className="absolute -top-[3px] w-[2px] h-[12px] rounded" style={{ left: `${Math.min(99, pred)}%`, background: "rgba(20,22,27,.55)" }} title={`Model said ${Math.round(pred)}%`} />
      </div>
    </div>
  );
}

export function TrackRecordCard({ rec }: { rec: TrackRecord }) {
  const settled = rec.slips.won + rec.slips.lost + rec.slips.push;
  const keys = Object.values(rec.byKey).sort((a, b) => b.n - a.n);
  const adjusting = keys.filter((k) => k.n >= 8).length;
  const gap = rec.legs.n ? rec.legs.hit - rec.legs.pred : 0;

  if (!settled && !rec.legs.n) {
    return (
      <div className="rounded-[20px] p-5" style={{ background: "var(--panel)", border: "1px dashed var(--hairline)" }}>
        <p className="font-spot-sans font-black text-[14px]" style={{ color: "var(--text)" }}>Your track record starts here</p>
        <p className="mt-1 font-spot-sans text-[12px] leading-snug max-w-xl" style={{ color: "var(--text-muted)" }}>
          Build a slip, enter your stake (and the odds you got), and tap <b>Save</b>. When the games finish we check the real box scores, mark every leg won or lost, and keep your running win/loss, profit and how often the model&rsquo;s chances actually hit.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] p-4 sm:p-5" style={{ background: "var(--panel)", border: "1px solid var(--hairline)", boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="font-spot-sans font-black text-[15px]" style={{ color: "var(--text)" }}>Track record</p>
        {rec.slips.pending > 0 && <span className="font-spot-sans font-bold text-[11px]" style={{ color: "#8a6500" }}>{rec.slips.pending} pending</span>}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <Stat label="Slips" value={`${rec.slips.won}-${rec.slips.lost}${rec.slips.push ? `-${rec.slips.push}` : ""}`} sub={settled ? `${Math.round((rec.slips.won / Math.max(1, rec.slips.won + rec.slips.lost)) * 100)}% win rate` : "none settled yet"} />
        <Stat label={rec.estimated ? "Profit (est.)" : "Profit"} value={rec.staked ? usd(rec.profit, true) : "—"} color={rec.profit > 0 ? GOOD : rec.profit < 0 ? BAD : undefined} sub={rec.roi != null ? `${rec.roi >= 0 ? "+" : ""}${rec.roi.toFixed(1)}% ROI on ${usd(rec.staked)}` : "add a stake to track"} />
        <Stat label="Leg hit rate" value={rec.legs.n ? `${Math.round(rec.legs.hit)}%` : "—"} sub={rec.legs.n ? `${rec.legs.wins} of ${rec.legs.n} legs` : undefined} />
        <Stat label="Model said" value={rec.legs.n ? `${Math.round(rec.legs.pred)}%` : "—"} color={rec.legs.n >= 8 ? (Math.abs(gap) < 3 ? undefined : gap > 0 ? GOOD : BAD) : undefined} sub={rec.legs.n >= 8 ? (Math.abs(gap) < 3 ? "well calibrated" : gap > 0 ? "beating the model" : "model running hot") : "needs 8+ legs"} />
      </div>
      {rec.estimated && rec.staked > 0 && <p className="mt-2 font-spot-sans text-[10px]" style={{ color: "var(--text-faint)" }}>Profit uses estimated odds for slips where you didn&rsquo;t enter the odds you got.</p>}

      {keys.length > 0 && (
        <div className="mt-5 grid gap-x-8 sm:grid-cols-2">
          <div>
            <p className="spot-label mb-1" style={{ color: "var(--text-faint)" }}>Model chance → actual, by market</p>
            {keys.slice(0, 8).map((k) => <CalRow key={k.label} label={k.label} n={k.n} pred={k.pred} actual={k.actual} />)}
          </div>
          <div className="mt-4 sm:mt-0">
            <p className="spot-label mb-1" style={{ color: "var(--text-faint)" }}>By grade</p>
            {rec.byGrade.map((g) => <CalRow key={g.grade} label={`Grade ${g.grade}`} n={g.n} pred={g.pred} actual={g.hit} />)}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-xl px-3.5 py-3 font-spot-sans text-[11px] leading-snug" style={{ background: "rgba(109,79,224,.08)", color: "#4c35b0" }}>
        <b>How it learns:</b> every settled leg compares what the model predicted with what happened. Once a market has 8+ settled legs, your slips show a chance <i>adjusted</i> toward your real results (shrunk hard until the sample is big).
        {adjusting > 0 ? ` Adjusting ${adjusting} market${adjusting > 1 ? "s" : ""} right now.` : " Nothing is being adjusted yet."} It&rsquo;s a personal calibration layer — the underlying projections don&rsquo;t change.
      </div>
    </div>
  );
}

/* ───────────────────────── One slip ───────────────────────── */

function LegIcon({ r }: { r?: SlipLeg["result"] }) {
  const c = r === "win" ? GOOD : r === "loss" ? BAD : r ? "#8a93a6" : "#d49a06";
  return (
    <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-black text-[12px]" style={{ background: `color-mix(in srgb, ${c} 14%, transparent)`, color: c }}>
      {r === "win" ? "✓" : r === "loss" ? "✕" : r ? "–" : "…"}
    </span>
  );
}

function LegRow({ slip, leg }: { slip: SavedSlip; leg: SlipLeg }) {
  const [edit, setEdit] = useState(false);
  const editable = String(leg.side).toUpperCase() === "OVER" || String(leg.side).toUpperCase() === "UNDER";
  const [side, setSide] = useState(String(leg.side).toUpperCase());
  const [line, setLine] = useState(String(leg.line));
  const resultText = leg.result === "void" ? "Void — didn't play" : leg.result === "push" ? `Push (${leg.actual})` : leg.result && leg.actual != null ? `Actual ${leg.actual}` : leg.result ? "Settled" : "";
  const apply = () => {
    const n = parseFloat(line);
    if (!Number.isFinite(n)) return;
    updateLeg(slip.id, leg.id, { side, line: n, result: undefined, actual: undefined });
    setEdit(false);
    void settlePendingSlips(true); // re-grade against the new number right away
  };
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ background: "var(--wash-1)", border: "1px solid var(--hairline)" }}>
      <div className="flex items-center gap-2.5">
        <LegIcon r={leg.result} />
        <div className="min-w-0 flex-1">
          <p className="font-spot-sans font-extrabold text-[12px] truncate" style={{ color: "var(--text)" }}>{leg.player}</p>
          <p className="font-spot-sans text-[10.5px] truncate" style={{ color: "var(--text-muted)" }}>
            <span style={{ color: String(leg.side).toUpperCase() === "UNDER" ? BAD : GOOD, fontWeight: 800 }}>{leg.pickText ?? `${leg.side} ${leg.line}`}</span> {leg.market} · {leg.team}{leg.gameLabel ? ` · ${leg.gameLabel}` : ""}
          </p>
          {resultText && <p className="font-spot-mono font-bold text-[10px]" style={{ color: leg.result === "win" ? GOOD : leg.result === "loss" ? BAD : "var(--text-faint)" }}>{resultText}</p>}
        </div>
        <span className="font-spot-sans font-extrabold text-[10.5px] shrink-0" style={{ color: "var(--text-3)" }}>{leg.grade}</span>
        {editable && <button onClick={() => setEdit((e) => !e)} aria-label="Edit leg" className="press w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: edit ? "rgba(26,115,255,.12)" : "var(--wash-2)", color: edit ? BLUE : "var(--text-3)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
        </button>}
        <button onClick={() => deleteLeg(slip.id, leg.id)} aria-label={`Remove ${leg.player} from slip`} className="press w-7 h-7 rounded-lg text-[14px] font-black shrink-0" style={{ background: "var(--wash-2)", color: "var(--text-3)" }}>×</button>
      </div>
      <AnimatePresence initial={false}>
        {edit && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-2 pt-2.5 flex-wrap">
              {["OVER", "UNDER"].map((s) => (
                <button key={s} onClick={() => setSide(s)} className="press rounded-lg px-3 py-1.5 font-spot-sans font-extrabold text-[11px]" style={side === s ? { background: s === "OVER" ? GOOD : BAD, color: "#fff" } : { background: "var(--wash-2)", color: "var(--text-3)" }}>{s === "OVER" ? "Over" : "Under"}</button>
              ))}
              <input value={line} onChange={(e) => setLine(e.target.value.replace(/[^0-9.]/g, "").slice(0, 6))} inputMode="decimal" aria-label="Line"
                className="w-[78px] rounded-lg px-2.5 py-1.5 font-spot-mono font-black text-[13px] outline-none" style={{ background: "var(--panel)", border: "1px solid var(--hairline)", color: "var(--text)" }} />
              <button onClick={apply} className="press rounded-lg px-3 py-1.5 font-spot-sans font-extrabold text-[11px]" style={{ background: BLUE, color: "#fff" }}>Save</button>
              <button onClick={() => setEdit(false)} className="font-spot-sans font-bold text-[11px]" style={{ color: "var(--text-faint)" }}>Cancel</button>
            </div>
            <p className="mt-1.5 font-spot-sans text-[10px]" style={{ color: "var(--text-faint)" }}>Bet it at a different number? Change it here and we&rsquo;ll grade the leg against that line.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SlipCard({ s, open, onOpen }: { s: SavedSlip; open: boolean; onOpen: () => void }) {
  const color = SPORT_COLOR[s.sport];
  const st = s.status ? STATUS[s.status] : undefined;
  const ret = slipReturn(s);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stake, setStake] = useState(s.stake ? String(s.stake) : "");
  const [odds, setOdds] = useState(s.oddsAmerican ? (s.oddsAmerican > 0 ? `+${s.oddsAmerican}` : String(s.oddsAmerican)) : "");
  const [label, setLabel] = useState(s.label ?? "");
  const tracked = s.legs.some((l) => l.sport && l.gameId);
  const names = s.legs.map((l) => l.player.split(" ").slice(-1)[0]).join(", ");

  const commitMoney = () => {
    const stk = parseFloat(stake);
    const a = parseAmerican(odds);
    updateSlip(s.id, {
      stake: Number.isFinite(stk) && stk > 0 ? stk : undefined, oddsAmerican: a,
      ...(a ? { estSource: "your" as const, estDecimal: a > 0 ? a / 100 + 1 : 100 / -a + 1 } : s.estSource === "your" ? { estSource: "fair" as const, estDecimal: undefined } : {}),
    });
  };
  const mark = (status: SlipStatus) => updateSlip(s.id, { status, manual: true, settledAt: Date.now() });

  return (
    <div className="rounded-[18px] overflow-hidden" style={{ background: "var(--panel)", border: `1px solid ${open ? "rgba(26,115,255,.4)" : "var(--hairline)"}`, boxShadow: open ? "0 12px 30px rgba(20,22,27,.08)" : "var(--shadow-card)" }}>
      <div role="button" tabIndex={0} aria-expanded={open} onClick={onOpen} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())} className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none">
        <span className="w-1.5 self-stretch rounded-full shrink-0" style={{ background: st?.color ?? color }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.1em] px-2 py-0.5 rounded-full" style={{ color, background: `${color}18`, border: `1px solid ${color}35` }}>{s.sport}</span>
            {st && <span className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.1em] px-2 py-0.5 rounded-full" style={{ color: st.color, background: `color-mix(in srgb, ${st.color} 14%, transparent)` }}>{st.label}{s.manual ? " · manual" : ""}</span>}
            <span className="font-spot-mono font-bold text-[10px]" style={{ color: "var(--text-faint)" }}>{s.legs.length}-leg · {dateStr(s.savedAt)}</span>
          </div>
          <p className="mt-1 font-spot-sans font-extrabold text-[13px] truncate" style={{ color: "var(--text)" }}>{s.label || names}</p>
        </div>
        <div className="text-right shrink-0">
          {ret ? (
            <>
              <p className="font-spot-mono font-black text-[15px]" style={{ color: s.status === "won" ? GOOD : s.status === "lost" ? BAD : "var(--text)" }}>
                {s.status === "won" ? usd(ret.profit, true) : s.status === "lost" ? usd(-s.stake!, true) : s.status === "push" ? "Refund" : usd(ret.returned - s.stake!)}
              </p>
              <p className="font-spot-sans text-[9.5px]" style={{ color: "var(--text-faint)" }}>{s.status === "pending" || !s.status ? "to win" : `stake ${usd(s.stake!)}`}</p>
            </>
          ) : <p className="font-spot-mono font-black text-[14px]" style={{ color }}>{s.combinedPayout}</p>}
        </div>
        <svg className="shrink-0 transition-transform duration-300" style={{ transform: open ? "rotate(180deg)" : undefined }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-1 flex flex-col gap-3" style={{ borderTop: "1px solid var(--hairline)" }}>
              {/* Slip details */}
              <div className="grid grid-cols-2 sm:grid-cols-[1.4fr_1fr_1fr_auto] gap-2 pt-3">
                <label className="col-span-2 sm:col-span-1 rounded-xl px-3 py-2" style={{ background: "var(--wash-1)", border: "1px solid var(--hairline)" }}>
                  <span className="block font-spot-sans font-extrabold text-[8.5px] uppercase tracking-[.1em]" style={{ color: "var(--text-faint)" }}>Name</span>
                  <input value={label} onChange={(e) => setLabel(e.target.value.slice(0, 40))} onBlur={() => updateSlip(s.id, { label: label.trim() || undefined })} placeholder="Add a name" className="w-full bg-transparent outline-none font-spot-sans font-bold text-[13px]" style={{ color: "var(--text)" }} />
                </label>
                <label className="rounded-xl px-3 py-2" style={{ background: "var(--wash-1)", border: "1px solid var(--hairline)" }}>
                  <span className="block font-spot-sans font-extrabold text-[8.5px] uppercase tracking-[.1em]" style={{ color: "var(--text-faint)" }}>Stake $</span>
                  <input value={stake} onChange={(e) => setStake(e.target.value.replace(/[^0-9.]/g, "").slice(0, 7))} onBlur={commitMoney} inputMode="decimal" placeholder="0" className="w-full bg-transparent outline-none font-spot-mono font-black text-[14px]" style={{ color: "var(--text)" }} />
                </label>
                <label className="rounded-xl px-3 py-2" style={{ background: "var(--wash-1)", border: "1px solid var(--hairline)" }}>
                  <span className="block font-spot-sans font-extrabold text-[8.5px] uppercase tracking-[.1em]" style={{ color: "var(--text-faint)" }}>Odds</span>
                  <input value={odds} onChange={(e) => setOdds(e.target.value.replace(/[^0-9+-]/g, "").slice(0, 6))} onBlur={commitMoney} inputMode="numeric" placeholder={s.estSource === "book" ? "auto" : "+450"} className="w-full bg-transparent outline-none font-spot-mono font-black text-[14px]" style={{ color: "var(--text)" }} />
                </label>
                {ret && (
                  <div className="col-span-2 sm:col-span-1 rounded-xl px-3 py-2 flex flex-col justify-center" style={{ background: "rgba(18,161,80,.08)", border: "1px solid rgba(18,161,80,.25)" }}>
                    <span className="font-spot-sans font-extrabold text-[8.5px] uppercase tracking-[.1em]" style={{ color: "var(--text-faint)" }}>Total payout</span>
                    <span className="font-spot-mono font-black text-[15px]" style={{ color: GOOD }}>{usd(s.stake! * ret.decimal)}</span>
                  </div>
                )}
              </div>
              {ret && ret.source === "fair" && <p className="-mt-1 font-spot-sans text-[10px]" style={{ color: "var(--text-faint)" }}>Payout uses the model&rsquo;s fair odds. Enter the odds you actually got for real profit.</p>}

              {/* Legs */}
              <div className="flex flex-col gap-1.5">{s.legs.map((l) => <LegRow key={l.id} slip={s} leg={l} />)}</div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 items-center">
                {tracked && s.status === "pending" && !s.manual && (
                  <button disabled={busy} onClick={async () => { setBusy(true); await settlePendingSlips(true); setBusy(false); }} className="press rounded-xl px-3.5 py-2 font-spot-sans font-extrabold text-[11.5px]" style={{ background: BLUE, color: "#fff" }}>{busy ? "Checking…" : "Check results"}</button>
                )}
                <span className="font-spot-sans font-bold text-[10.5px]" style={{ color: "var(--text-faint)" }}>Mark:</span>
                {(["won", "lost", "push"] as SlipStatus[]).map((x) => (
                  <button key={x} onClick={() => mark(x)} className="press rounded-lg px-2.5 py-1.5 font-spot-sans font-extrabold text-[11px]" style={s.status === x && s.manual ? { background: STATUS[x].color, color: "#fff" } : { background: "var(--wash-2)", color: "var(--text-3)" }}>{STATUS[x].label}</button>
                ))}
                {s.manual && tracked && <button onClick={() => updateSlip(s.id, { manual: false })} className="font-spot-sans font-bold text-[11px] underline" style={{ color: BLUE }}>Back to auto</button>}
                <span className="flex-1" />
                {confirm ? (
                  <span className="flex items-center gap-2 font-spot-sans font-bold text-[11.5px]">
                    <span style={{ color: BAD }}>Delete this slip?</span>
                    <button onClick={() => deleteSlip(s.id)} className="press rounded-lg px-3 py-1.5 font-extrabold" style={{ background: BAD, color: "#fff" }}>Delete</button>
                    <button onClick={() => setConfirm(false)} style={{ color: "var(--text-faint)" }}>Keep</button>
                  </span>
                ) : (
                  <button onClick={() => setConfirm(true)} className="press rounded-lg px-3 py-1.5 font-spot-sans font-extrabold text-[11.5px]" style={{ color: BAD, background: "rgba(229,72,77,.08)" }}>Delete slip</button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────────────────── Manager ───────────────────────── */

type Filter = "all" | "pending" | "won" | "lost";

export function SavedSlipsPanel({ mode = "compact" }: { mode?: "compact" | "full" }) {
  const slips = useSavedSlips();
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);
  const rec = useMemo(() => computeRecord(slips), [slips]);

  if (slips.length === 0) return mode === "full" ? <TrackRecordCard rec={rec} /> : null;

  const list = slips.filter((s) => filter === "all" || (filter === "pending" ? s.status === "pending" || !s.status : s.status === filter));
  const shown = mode === "compact" ? list.slice(0, 3) : list;
  const counts: Record<Filter, number> = { all: slips.length, pending: slips.filter((s) => s.status === "pending" || !s.status).length, won: rec.slips.won, lost: rec.slips.lost };
  const settled = rec.slips.won + rec.slips.lost;

  return (
    <div className="flex flex-col gap-4">
      {mode === "full" && <TrackRecordCard rec={rec} />}
      <div className="rounded-[20px] p-4" style={{ background: "var(--wash-1)", border: "1px solid var(--hairline)" }}>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <p className="font-spot-sans font-black text-[15px]" style={{ color: "var(--text)" }}>{mode === "full" ? "All slips" : "Your saved slips"}</p>
            {settled > 0 && (
              <span className="rounded-full px-2.5 py-0.5 font-spot-mono font-black text-[11px]" style={{ background: "var(--panel)", border: "1px solid var(--hairline)", color: "var(--text)" }}>
                {rec.slips.won}-{rec.slips.lost}{rec.staked ? ` · ${usd(rec.profit, true)}` : ""}
              </span>
            )}
          </div>
          {mode === "compact" ? (
            <Link href="/slips" className="font-spot-sans font-extrabold text-[12px]" style={{ color: BLUE }}>Track record & all slips →</Link>
          ) : (
            <div className="snap-row">
              {(["all", "pending", "won", "lost"] as Filter[]).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className="press rounded-full px-3 py-1.5 font-spot-sans font-extrabold text-[11px] capitalize whitespace-nowrap" style={filter === f ? { background: "#14161b", color: "#fff" } : { background: "var(--panel)", color: "var(--text-muted)", border: "1px solid var(--hairline)" }}>{f} {counts[f]}</button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2.5">
          {shown.map((s) => <SlipCard key={s.id} s={s} open={open === s.id} onOpen={() => setOpen(open === s.id ? null : s.id)} />)}
          {shown.length === 0 && <p className="py-6 text-center font-spot-sans text-[12px]" style={{ color: "var(--text-muted)" }}>No {filter} slips.</p>}
        </div>
      </div>
    </div>
  );
}
