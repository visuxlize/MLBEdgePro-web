"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { WnbaHeadshot } from "@/components/web-tool/spotlight";
import { fmtAmerican, slip, slipMath, toDecimal, useSlip } from "@/lib/slip";
import { adjustProb, computeRecord, parseAmerican } from "@/lib/track-record";
import { saveSlip, useSavedSlips, type SlipSport } from "@/lib/saved-slips";
import type { PropItem } from "@/lib/picks/types";

const BLUE = "#1a73ff";
const GOOD = "#12a150";
const money = (n: number) => `$${n >= 1000 ? n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : n.toFixed(2)}`;
const SPORT_LABEL = { nba: "NBA", nfl: "NFL", soccer: "Soccer" } as const;

/** Round quick-add button used on every prop row. */
export function AddDot({ item, inSlip }: { item: PropItem; inSlip: boolean }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); slip.toggle(item); try { navigator.vibrate?.(8); } catch { /* unsupported */ } }}
      aria-label={inSlip ? `Remove ${item.player} from slip` : `Add ${item.player} to slip`} aria-pressed={inSlip}
      className="press shrink-0 w-[34px] h-[34px] rounded-full flex items-center justify-center transition-colors"
      style={inSlip ? { background: GOOD, color: "#fff", boxShadow: "0 6px 14px rgba(18,161,80,.35)" } : { background: "var(--wash-2)", color: "var(--text-2)", border: "1px solid var(--hairline)" }}>
      <motion.svg key={String(inSlip)} initial={{ scale: 0.5, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 500, damping: 18 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {inSlip ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <path d="M12 5v14M5 12h14" />}
      </motion.svg>
    </button>
  );
}

export function SlipPanel({ onDone }: { onDone?: () => void }) {
  const { legs } = useSlip();
  const m = slipMath(legs);
  const [stake, setStake] = useState("10");
  const [odds, setOdds] = useState("");
  const saved$ = useSavedSlips();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator !== "undefined" && "share" in navigator), []);

  useEffect(() => { try { const s = localStorage.getItem("edgepro:stake"); if (s) setStake(s); } catch { /* storage blocked */ } }, []);
  useEffect(() => { try { localStorage.setItem("edgepro:stake", stake); } catch { /* storage blocked */ } }, [stake]);
  useEffect(() => { setSaved(false); }, [legs.length]);

  const amt = Math.max(0, parseFloat(stake) || 0);
  const yourOdds = parseAmerican(odds);
  const decimal = yourOdds ? toDecimal(yourOdds) : m.bookDecimal ?? m.fairDecimal;
  const rec = computeRecord(saved$);
  const adj = legs.map((p) => adjustProb(rec, p.sport, p.marketKey, p.prob));
  const adjCombined = adj.reduce((a, x) => a * (x.prob / 100), 1) * 100;
  const adjApplied = adj.some((x) => x.applied);
  const text = () => legs.map((p, i) => `${i + 1}. ${p.player} — ${p.pick} ${p.marketShort} (${p.gameLabel}, ${p.when})`).join("\n") + `\n\nModel chance ${m.combined.toFixed(1)}% · fair ${fmtAmerican(m.fair)}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(text()); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* clipboard blocked */ }
  };
  const share = async () => { try { await navigator.share({ title: "My Edge Pro slip", text: text() }); } catch { /* cancelled */ } };
  const save = () => {
    const sports = [...new Set(legs.map((l) => l.sport))];
    saveSlip({
      sport: (sports.length === 1 ? SPORT_LABEL[sports[0]] : "Mixed") as SlipSport,
      legs: legs.map((p) => ({
        id: p.id, player: p.player, team: p.team, market: p.marketShort, side: p.side ? p.side.toUpperCase() : "YES", line: p.line ?? p.pick, model: p.prob, grade: p.grade ?? "—", odds: p.price != null ? fmtAmerican(p.price) : "—",
        sport: p.sport, scope: p.scope === "game" ? "game" : undefined, pickText: p.scope === "game" ? p.pick : undefined, gameId: p.gameId, gameLabel: p.gameLabel, athleteId: p.athleteId, marketKey: p.marketKey, league: p.league, target: p.target, kind: p.kind, prob: p.prob,
      })),
      combinedPayout: `${decimal.toFixed(2)}x`,
      avgEdge: Math.round((legs.reduce((a, p) => a + p.edge, 0) / Math.max(1, legs.length)) * 10) / 10,
      stake: amt > 0 ? amt : undefined,
      oddsAmerican: yourOdds, estDecimal: decimal, estSource: yourOdds ? "your" : m.bookDecimal ? "book" : "fair", status: "pending",
    });
    setSaved(true);
  };

  if (!legs.length) {
    return (
      <div className="text-center py-10 px-5">
        <div className="mx-auto mb-3 w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--wash-2)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4h10a2 2 0 0 1 2 2v14l-3-2-2 2-2-2-2 2-2-2-3 2V6a2 2 0 0 1 2-2Z" /><path d="M9 9h6M9 13h4" /></svg>
        </div>
        <p className="font-spot-sans font-extrabold text-[14px]" style={{ color: "var(--text-2)" }}>Your slip is empty</p>
        <p className="mt-1 font-spot-sans text-[12px] leading-snug" style={{ color: "var(--text-muted)" }}>Tap the <b>+</b> on any prop. Your legs follow you across NBA, NFL and Soccer.</p>
        <div className="mt-4 flex justify-center gap-2">
          {[["NBA", "/nba/props"], ["NFL", "/nfl/props"], ["Soccer", "/soccer/props"]].map(([l, h]) => (
            <Link key={h} href={h} onClick={onDone} className="press rounded-full px-3.5 py-1.5 font-spot-sans font-extrabold text-[11.5px]" style={{ background: "rgba(26,115,255,.10)", color: BLUE, border: "1px solid rgba(26,115,255,.25)" }}>{l} props</Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col">
        <AnimatePresence initial={false}>
          {legs.map((p) => (
            <motion.div key={p.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0, x: 30 }} transition={{ duration: 0.22 }} className="overflow-hidden">
              <div className="flex items-center gap-2.5 py-2.5" style={{ borderTop: "1px solid var(--hairline)" }}>
                <WnbaHeadshot hex={p.hex} src={p.headshot} name={p.player} size={36} radius={11} />
                <div className="min-w-0 flex-1">
                  <p className="font-spot-sans font-extrabold text-[12.5px] truncate" style={{ color: "var(--text)" }}>{p.player}</p>
                  <p className="font-spot-sans font-bold text-[11px] truncate" style={{ color: p.side === "under" ? "#d6303d" : p.side === "over" ? GOOD : BLUE }}>{p.pick} <span style={{ color: "var(--text-3)" }}>{p.marketShort}</span></p>
                  <p className="font-spot-sans text-[10px] truncate" style={{ color: "var(--text-faint)" }}>{SPORT_LABEL[p.sport]} · {p.gameLabel} · {p.when}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-spot-mono font-black text-[13px]" style={{ color: "var(--text)" }}>{p.prob}%</p>
                  {p.price != null && p.kind === "market" && <p className="font-spot-mono font-bold text-[10px]" style={{ color: "var(--text-faint)" }}>{fmtAmerican(p.price)}</p>}
                </div>
                <button onClick={() => slip.remove(p.id)} aria-label={`Remove ${p.player}`} className="w-7 h-7 rounded-full text-[14px] font-black press shrink-0" style={{ background: "var(--wash-2)", color: "var(--text-3)" }}>×</button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-2 rounded-2xl p-4" style={{ background: "linear-gradient(135deg, rgba(26,115,255,.10), rgba(109,79,224,.08))", border: "1px solid rgba(26,115,255,.2)" }}>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.12em]" style={{ color: "var(--text-faint)" }}>Combined model chance</p>
            <p className="font-spot-mono font-black text-[30px] leading-tight" style={{ color: "var(--text)" }}>{m.combined.toFixed(1)}%</p>
          </div>
          <div className="text-right">
            <p className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.12em]" style={{ color: "var(--text-faint)" }}>Fair price</p>
            <p className="font-spot-mono font-black text-[20px] leading-tight" style={{ color: BLUE }}>{fmtAmerican(m.fair)}</p>
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <label className="flex items-center gap-1.5 rounded-xl px-3 py-2" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
            <span className="font-spot-sans font-extrabold text-[11px] whitespace-nowrap" style={{ color: "var(--text-faint)" }}>Stake $</span>
            <input value={stake} onChange={(e) => setStake(e.target.value.replace(/[^0-9.]/g, "").slice(0, 7))} inputMode="decimal" aria-label="Stake"
              className="w-full min-w-0 bg-transparent outline-none font-spot-mono font-black text-[14px]" style={{ color: "var(--text)" }} />
          </label>
          <label className="flex items-center gap-1.5 rounded-xl px-3 py-2" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
            <span className="font-spot-sans font-extrabold text-[11px] whitespace-nowrap" style={{ color: "var(--text-faint)" }}>Odds</span>
            <input value={odds} onChange={(e) => setOdds(e.target.value.replace(/[^0-9+-]/g, "").slice(0, 6))} inputMode="numeric" placeholder={m.bookDecimal ? "auto" : "+450"} aria-label="Your odds"
              className="w-full min-w-0 bg-transparent outline-none font-spot-mono font-black text-[14px]" style={{ color: "var(--text)" }} />
          </label>
        </div>
        <div className="mt-2.5 flex items-end justify-between">
          <div>
            <p className="font-spot-sans text-[10px]" style={{ color: "var(--text-faint)" }}>{yourOdds ? "At your odds" : m.bookDecimal ? "At DraftKings prices" : "At fair odds"} · profit {money(amt * (decimal - 1))}</p>
            <p className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.12em]" style={{ color: "var(--text-faint)" }}>Total payout</p>
          </div>
          <p className="font-spot-mono font-black text-[22px] leading-none" style={{ color: GOOD }}>{money(amt * decimal)}</p>
        </div>
        {adjApplied && (
          <p className="mt-2.5 rounded-lg px-2.5 py-1.5 font-spot-sans text-[10.5px] leading-snug" style={{ background: "rgba(109,79,224,.10)", color: "#5b3fd0" }}>
            <b>Adjusted for your results: {adjCombined.toFixed(1)}%</b> — based on how this model has actually hit for you on these markets.
          </p>
        )}
        {!m.bookDecimal && !yourOdds && <p className="mt-2 font-spot-sans text-[10px] leading-snug" style={{ color: "var(--text-faint)" }}>Fair odds are what the model thinks this is worth with no book margin — your sportsbook will pay less. Enter the odds you got to track real profit.</p>}
      </div>

      {m.sameGame.length > 0 && (
        <div className="mt-2.5 rounded-xl px-3 py-2.5 font-spot-sans text-[11px] leading-snug" style={{ background: "rgba(212,154,6,.10)", border: "1px solid rgba(212,154,6,.3)", color: "#8a6500" }}>
          <b>Same-game legs:</b> {m.sameGame.map((g) => `${g.n} from ${g.label}`).join(", ")}. Those outcomes tend to move together, so we adjust the combined chance for it — treat it as an estimate.
        </div>
      )}
      {m.weakest && legs.length > 2 && (
        <button onClick={() => slip.remove(m.weakest!.id)} className="mt-2.5 w-full text-left rounded-xl px-3 py-2.5 font-spot-sans text-[11px] leading-snug press" style={{ background: "var(--wash-1)", border: "1px solid var(--hairline)", color: "var(--text-muted)" }}>
          Weakest leg: <b style={{ color: "var(--text)" }}>{m.weakest.player}</b> ({m.weakest.prob}%). Tap to drop it and lift the slip to <b style={{ color: GOOD }}>{(m.combined / (m.weakest.prob / 100)).toFixed(1)}%</b>.
        </button>
      )}

      <div className="mt-3 flex gap-2">
        <button onClick={copy} className="press flex-1 rounded-xl py-2.5 font-spot-sans font-extrabold text-[12px]" style={{ color: "#fff", background: BLUE, boxShadow: "0 8px 18px rgba(26,115,255,.25)" }}>{copied ? "Copied ✓" : "Copy slip"}</button>
        {canShare && <button onClick={share} className="press rounded-xl px-4 py-2.5 font-spot-sans font-extrabold text-[12px]" style={{ color: "var(--text-2)", background: "var(--wash-2)" }}>Share</button>}
        <button onClick={save} disabled={saved} className="press rounded-xl px-4 py-2.5 font-spot-sans font-extrabold text-[12px]" style={{ color: saved ? GOOD : "var(--text-2)", background: "var(--wash-2)" }}>{saved ? "Saved ✓" : "Save"}</button>
      </div>
      <button onClick={() => { slip.clear(); onDone?.(); }} className="press mt-2 w-full rounded-xl py-2 font-spot-sans font-extrabold text-[11.5px]" style={{ color: "#d6303d" }}>Clear all</button>
      {saved && <p className="mt-2 font-spot-sans text-[10.5px] text-center" style={{ color: "var(--text-faint)" }}>Saved — we'll mark it won or lost after the games finish. <Link href="/slips" className="underline" onClick={onDone}>See your slips</Link>.</p>}
    </div>
  );
}

/** Global floating slip pill + drawer. Lives in the app shell so the slip is reachable from every page. */
export function SlipDock() {
  const { count, legs } = useSlip();
  const [open, setOpen] = useState(false);
  const [wide, setWide] = useState(false);
  const path = usePathname() ?? "";
  const m = slipMath(legs);
  const onProps = path.includes("/props");

  useEffect(() => { if (count === 0) setOpen(false); }, [count]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const openIt = () => { setWide(window.innerWidth >= 640); setOpen(true); };

  return (
    <>
      <AnimatePresence>
        {count > 0 && !open && (
          <motion.button key="dock" onClick={openIt} aria-label={`Open slip, ${count} legs`}
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
            className={`${onProps ? "lg:hidden" : ""} fixed z-30 left-4 right-4 sm:left-auto sm:right-5 sm:w-[300px] bottom-[calc(72px+env(safe-area-inset-bottom))] sm:bottom-5 rounded-2xl px-4 py-3 flex items-center justify-between press`}
            style={{ background: "#14161b", color: "#fff", boxShadow: "0 18px 44px rgba(20,22,27,.35)" }}>
            <span className="flex items-center gap-2.5 font-spot-sans font-extrabold text-[13px]">
              <motion.span key={count} initial={{ scale: 1.5 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 14 }} className="w-6 h-6 rounded-full flex items-center justify-center font-spot-mono font-black text-[12px]" style={{ background: BLUE }}>{count}</motion.span>
              View slip
            </span>
            <span className="flex items-baseline gap-2"><span className="font-spot-mono font-bold text-[11px] opacity-60">{fmtAmerican(m.fair)}</span><span className="font-spot-mono font-black text-[15px]">{m.combined.toFixed(1)}%</span></span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            <motion.div key="scrim" className="fixed inset-0 z-[60]" style={{ background: "rgba(20,22,27,.45)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.div key="sheet" role="dialog" aria-label="Your slip"
              className="fixed z-[61] left-0 right-0 bottom-0 sm:left-auto sm:top-0 sm:w-[400px] rounded-t-[26px] sm:rounded-none sm:rounded-l-[26px] p-4 overflow-y-auto max-h-[86vh] sm:max-h-none"
              style={{ background: "var(--panel, #fff)", paddingBottom: "calc(16px + env(safe-area-inset-bottom))", boxShadow: "0 -20px 60px rgba(20,22,27,.25)" }}
              initial={wide ? { x: "100%" } : { y: "100%" }} animate={wide ? { x: 0 } : { y: 0 }} exit={wide ? { x: "100%" } : { y: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 40 }}>
              <div className="sm:hidden mx-auto mb-3 h-1 w-10 rounded-full" style={{ background: "var(--wash-3)" }} />
              <div className="flex items-center justify-between mb-2">
                <p className="font-spot-sans font-black text-[17px]" style={{ color: "var(--text)" }}>Your slip <span className="ml-1 rounded-full px-2 py-0.5 font-spot-mono font-black text-[11px]" style={{ background: BLUE, color: "#fff" }}>{count}</span></p>
                <span className="flex items-center gap-4">
                  <Link href="/slips" onClick={() => setOpen(false)} className="font-spot-sans font-extrabold text-[12.5px] press" style={{ color: "var(--text-3)" }}>My slips</Link>
                  <button onClick={() => setOpen(false)} className="font-spot-sans font-extrabold text-[12.5px] press" style={{ color: BLUE }}>Done</button>
                </span>
              </div>
              <SlipPanel onDone={() => setOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
