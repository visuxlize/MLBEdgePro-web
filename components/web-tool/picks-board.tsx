"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { LogoPlate, WnbaHeadshot, alpha } from "@/components/web-tool/spotlight";
import { EmptyState, SportHeader } from "@/components/web-tool/sport-ui";
import { PropRow } from "@/components/web-tool/props-explorer";
import { slip, useSlip, fmtAmerican } from "@/lib/slip";
import { useSavedSlips } from "@/lib/saved-slips";
import { adjustProb, computeRecord } from "@/lib/track-record";
import { TIER_LABEL, buildPicks, type Parlay, type Single, type Tier } from "@/lib/picks/engine";
import { researchFor } from "@/lib/picks/research";
import type { PropItem } from "@/lib/picks/types";

const BLUE = "#1a73ff";
const GOOD = "#12a150";
const AMBER = "#d49a06";
const TIER_COLOR: Record<Tier, string> = { strong: GOOD, good: BLUE, lean: AMBER };
const TAG_COLOR: Record<Parlay["tag"], string> = { Safe: GOOD, Balanced: BLUE, Value: "#7c4dff", Longshot: "#e5484d" };
const SPORT_LABEL = { nba: "NBA", nfl: "NFL", soccer: "Soccer" } as const;

type SportFilter = "all" | "nba" | "nfl" | "soccer";
type View = "singles" | "sgp" | "multi";

interface Props {
  items: PropItem[];
  counts: { nba: number; nfl: number; soccer: number };
  liveLines: { nba: number; nfl: number };
  nbaDay: string;
  nflWeek: string;
}

function Pill({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: React.ReactNode; count?: number }) {
  return (
    <button onClick={onClick} aria-pressed={active}
      className="shrink-0 rounded-full px-3.5 py-[7px] font-spot-sans font-extrabold text-[11.5px] whitespace-nowrap transition-colors"
      style={{ background: active ? "var(--text)" : "var(--panel)", color: active ? "#fff" : "var(--text-muted)", border: `1px solid ${active ? "var(--text)" : "var(--hairline)"}` }}>
      {children}{count != null && <span className="ml-1.5 opacity-60">{count}</span>}
    </button>
  );
}

function TierBadge({ tier }: { tier: Tier }) {
  const c = TIER_COLOR[tier];
  return (
    <span className="rounded-full px-2.5 py-[3px] font-spot-sans font-black text-[9.5px] uppercase tracking-[.1em] whitespace-nowrap"
      style={{ color: `color-mix(in srgb, ${c} 80%, #14161b)`, background: `color-mix(in srgb, ${c} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${c} 32%, transparent)` }}>
      {TIER_LABEL[tier]}
    </span>
  );
}

/* ───────────────────────── Pick of the day ───────────────────────── */

function Hero({ s }: { s: Single }) {
  const { ids } = useSlip();
  const p = s.item;
  const inSlip = ids.has(p.id);
  const r = researchFor(p);
  const game = p.scope === "game";
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[26px] p-4 sm:p-6 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${alpha(GOOD, "14")}, var(--panel) 55%)`, border: `1px solid ${alpha(GOOD, "40")}`, boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="spot-label" style={{ color: GOOD }}>Pick of the day</span>
        <TierBadge tier={s.tier} />
        <span className="font-spot-sans font-bold text-[10px] uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>{SPORT_LABEL[p.sport]}</span>
      </div>
      <div className="flex items-center gap-3.5">
        {!game && (
          <div className="relative shrink-0">
            <WnbaHeadshot hex={p.hex} src={p.headshot} name={p.player} size={52} radius={16} />
            <div className="absolute -bottom-1 -right-1"><LogoPlate hex={p.hex} src={p.logo} code={p.team} size={24} radius={8} variant="clean" /></div>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-spot-sans font-black text-[16.5px] sm:text-[24px] leading-tight" style={{ color: "var(--text)" }}>
            {game ? `${p.player} ${p.pick}` : `${p.player} — ${p.pick}`}
          </p>
          <p className="font-spot-sans font-semibold text-[11.5px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            {game ? p.gameLabel : `${p.marketShort} · ${p.team} ${p.home === false ? "@" : "vs"} ${p.opp}`} · {p.when}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-spot-mono font-black text-[24px] sm:text-[34px] leading-none tabular-nums" style={{ color: GOOD }}>{Math.round(p.prob)}%</p>
          <p className="font-spot-sans font-bold text-[9.5px] uppercase tracking-wider mt-1" style={{ color: "var(--text-faint)" }}>our chance · +{p.edge.toFixed(1)} edge</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.12em] mb-1.5" style={{ color: GOOD }}>Why it&apos;s a play</p>
          <ul className="flex flex-col gap-1.5">{r.case.slice(0, 4).map((n) => <li key={n} className="flex gap-2 font-spot-sans text-[12px] leading-snug" style={{ color: "var(--text-muted)" }}><span className="mt-[6px] w-1 h-1 rounded-full shrink-0" style={{ background: GOOD }} />{n}</li>)}</ul>
        </div>
        <div>
          <p className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.12em] mb-1.5" style={{ color: "#c2790a" }}>What could go wrong</p>
          <ul className="flex flex-col gap-1.5">{r.risks.slice(0, 3).map((n) => <li key={n} className="flex gap-2 font-spot-sans text-[12px] leading-snug" style={{ color: "var(--text-muted)" }}><span className="mt-[6px] w-1 h-1 rounded-full shrink-0" style={{ background: AMBER }} />{n}</li>)}</ul>
        </div>
      </div>
      <button onClick={() => slip.toggle(p)}
        className="mt-4 w-full sm:w-auto rounded-2xl px-5 py-3 font-spot-sans font-black text-[13px] transition-transform active:scale-[.98]"
        style={{ background: inSlip ? alpha(GOOD, "18") : GOOD, color: inSlip ? GOOD : "#fff", border: `1px solid ${GOOD}` }}>
        {inSlip ? "✓ In your slip — tap to remove" : "Add to slip"}
      </button>
    </motion.div>
  );
}

/* ───────────────────────── Parlay card ───────────────────────── */

function ParlayCard({ parlay }: { parlay: Parlay }) {
  const { ids } = useSlip();
  const [open, setOpen] = useState(false);
  const allIn = parlay.legs.every((l) => ids.has(l.id));
  const c = TAG_COLOR[parlay.tag];
  const pay10 = (10 * parlay.fairDecimal).toFixed(2);
  const [added, setAdded] = useState<number | null>(null);

  return (
    <div className="rounded-[22px] overflow-hidden" style={{ background: "var(--panel)", border: `1px solid ${allIn ? alpha(GOOD, "70") : "var(--hairline)"}`, boxShadow: "var(--shadow-card)" }}>
      <div className="p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full px-2.5 py-[3px] font-spot-sans font-black text-[9.5px] uppercase tracking-[.1em]" style={{ color: `color-mix(in srgb, ${c} 80%, #14161b)`, background: `color-mix(in srgb, ${c} 13%, transparent)`, border: `1px solid color-mix(in srgb, ${c} 30%, transparent)` }}>{parlay.tag}</span>
              {parlay.sports.map((s) => <span key={s} className="font-spot-sans font-bold text-[9.5px] uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>{SPORT_LABEL[s as keyof typeof SPORT_LABEL]}</span>)}
            </div>
            <p className="font-spot-sans font-black text-[15px] mt-1.5 leading-tight" style={{ color: "var(--text)" }}>{parlay.title}</p>
            <p className="font-spot-sans font-semibold text-[11px]" style={{ color: "var(--text-faint)" }}>{parlay.subtitle}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-spot-mono font-black text-[24px] leading-none tabular-nums" style={{ color: "var(--text)" }}>{Math.round(parlay.joint)}%</p>
            <p className="font-spot-sans font-bold text-[9px] uppercase tracking-wider mt-1" style={{ color: "var(--text-faint)" }}>all legs hit</p>
          </div>
        </div>

        <ol className="mt-3 flex flex-col gap-1.5">
          {parlay.legs.map((l, i) => (
            <li key={l.id} className="flex items-center gap-2.5 rounded-xl px-2.5 py-2" style={{ background: "var(--wash-1)" }}>
              <span className="w-5 h-5 rounded-full grid place-items-center font-spot-mono font-black text-[10px] shrink-0" style={{ background: "var(--panel)", color: "var(--text-muted)", border: "1px solid var(--hairline)" }}>{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-spot-sans font-extrabold text-[12.5px] truncate" style={{ color: "var(--text)" }}>{l.scope === "game" ? `${l.player} ${l.pick}` : `${l.player} ${l.pick}`}</p>
                <p className="font-spot-sans font-semibold text-[10px] truncate" style={{ color: "var(--text-faint)" }}>{l.scope === "game" ? l.gameLabel : `${l.marketShort} · ${l.team} ${l.home === false ? "@" : "vs"} ${l.opp}`}</p>
              </div>
              <span className="font-spot-mono font-black text-[12px] tabular-nums shrink-0" style={{ color: l.prob >= 65 ? GOOD : "var(--text-muted)" }}>{Math.round(l.prob)}%</span>
            </li>
          ))}
        </ol>

        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <p className="font-spot-sans text-[11.5px]" style={{ color: "var(--text-muted)" }}>
            Fair price <b className="font-spot-mono" style={{ color: "var(--text)" }}>{fmtAmerican(parlay.fair)}</b> · $10 pays <b className="font-spot-mono" style={{ color: "var(--text)" }}>${pay10}</b> at fair odds
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="rounded-xl px-3 py-2 font-spot-sans font-extrabold text-[11.5px]" style={{ color: "var(--text-muted)", border: "1px solid var(--hairline)", background: "var(--panel)" }}>
              {open ? "Hide research" : "Research"}
            </button>
            <button onClick={() => { if (allIn) { parlay.legs.forEach((l) => slip.remove(l.id)); setAdded(null); } else setAdded(slip.addMany(parlay.legs)); }}
              className="rounded-xl px-3.5 py-2 font-spot-sans font-black text-[11.5px] active:scale-[.98] transition-transform"
              style={{ background: allIn ? alpha(GOOD, "18") : BLUE, color: allIn ? GOOD : "#fff", border: `1px solid ${allIn ? GOOD : BLUE}` }}>
              {allIn ? "✓ In slip" : "Add all to slip"}
            </button>
          </div>
        </div>
        {added != null && added < parlay.legs.length && !allIn && <p className="mt-2 font-spot-sans text-[10.5px]" style={{ color: AMBER }}>Your slip is full — only {added} of {parlay.legs.length} legs fit.</p>}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-3.5 sm:px-4 pb-4 pt-1 flex flex-col gap-3.5" style={{ borderTop: "1px solid var(--hairline)" }}>
              {parlay.notes.length > 0 && (
                <ul className="flex flex-col gap-1.5 pt-3">
                  {parlay.notes.map((n) => <li key={n} className="flex gap-2 font-spot-sans text-[11.5px] leading-snug" style={{ color: "var(--text-muted)" }}><span className="mt-[5px] w-1 h-1 rounded-full shrink-0" style={{ background: BLUE }} />{n}</li>)}
                </ul>
              )}
              {parlay.legs.map((l) => {
                const r = researchFor(l);
                return (
                  <div key={l.id}>
                    <p className="font-spot-sans font-black text-[11.5px] mb-1" style={{ color: "var(--text)" }}>{l.player} {l.pick} <span className="font-semibold" style={{ color: "var(--text-faint)" }}>{l.marketShort}</span></p>
                    <ul className="flex flex-col gap-1">
                      {r.case.slice(0, 3).map((n) => <li key={n} className="flex gap-2 font-spot-sans text-[11px] leading-snug" style={{ color: "var(--text-muted)" }}><span className="mt-[5px] w-1 h-1 rounded-full shrink-0" style={{ background: GOOD }} />{n}</li>)}
                      {r.risks.slice(0, 2).map((n) => <li key={n} className="flex gap-2 font-spot-sans text-[11px] leading-snug" style={{ color: "var(--text-muted)" }}><span className="mt-[5px] w-1 h-1 rounded-full shrink-0" style={{ background: AMBER }} />{n}</li>)}
                    </ul>
                  </div>
                );
              })}
              <p className="font-spot-sans text-[10.5px] leading-snug" style={{ color: "var(--text-faint)" }}>
                Sportsbooks price parlays with built-in margin, so the book&apos;s real price will usually be shorter than the fair price shown. Compare before you bet.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────────────────── Board ───────────────────────── */

export function PicksBoard({ items, counts, liveLines, nbaDay, nflWeek }: Props) {
  const [sport, setSport] = useState<SportFilter>("all");
  const [view, setView] = useState<View>("singles");
  const [open, setOpen] = useState<string | null>(null);
  const saved = useSavedSlips();
  const record = useMemo(() => computeRecord(saved), [saved]);

  // Apply the user's own calibration, then recompute the edge against the same baseline.
  const { calibrated, adjustedCount } = useMemo(() => {
    let n = 0;
    const out = items.map((it) => {
      const a = adjustProb(record, it.sport, it.marketKey, it.prob);
      if (!a.applied) return it;
      n++;
      return { ...it, prob: Math.round(a.prob * 10) / 10, edge: Math.round((it.edge + (a.prob - it.prob)) * 10) / 10 };
    });
    return { calibrated: out, adjustedCount: n };
  }, [items, record]);

  const all = useMemo(() => buildPicks(calibrated), [calibrated]);
  const singles = useMemo(() => (sport === "all" ? all.singles : all.singles.filter((x) => x.item.sport === sport)), [all, sport]);
  const sgps = useMemo(() => (sport === "all" ? all.sgps : all.sgps.filter((x) => x.sports.length === 1 && x.sports[0] === sport)), [all, sport]);
  const multis = useMemo(() => (sport === "all" ? all.multis : all.multis.filter((m) => m.sports.length === 1 && m.sports[0] === sport)), [all, sport]);
  const totalSports = counts.nba + counts.nfl + counts.soccer;
  const hero = singles[0];
  const rest = hero ? singles.slice(1) : singles;
  const tierCounts = useMemo(() => ({ strong: singles.filter((s) => s.tier === "strong").length, good: singles.filter((s) => s.tier === "good").length, lean: singles.filter((s) => s.tier === "lean").length }), [singles]);

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-lg mx-auto page-pad py-4 sm:py-6" style={{ paddingBottom: 120 }}>
        <SportHeader eyebrow="Today's board" title="Picks" accent={BLUE}
          subtitle="Our best bets right now — singles, same-game parlays and multi-game parlays — each with the research behind it."
          right={<Link href="/slips" className="rounded-full px-3.5 py-2 font-spot-sans font-extrabold text-[11.5px]" style={{ color: BLUE, background: alpha(BLUE, "12"), border: `1px solid ${alpha(BLUE, "30")}` }}>My slips →</Link>} />

        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
          {(["all", "nba", "nfl", "soccer"] as const).map((s) => (
            <Pill key={s} active={sport === s} onClick={() => setSport(s)} count={s === "all" ? totalSports : counts[s]}>{s === "all" ? "All sports" : SPORT_LABEL[s]}</Pill>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-2xl p-1" style={{ background: "var(--wash-1)", border: "1px solid var(--hairline)" }}>
          {([["singles", "Single bets", singles.length], ["sgp", "Same-game parlays", sgps.length], ["multi", "Multi-game parlays", multis.length]] as const).map(([k, label, n]) => (
            <button key={k} onClick={() => setView(k)} aria-pressed={view === k}
              className="rounded-xl px-2 py-2.5 font-spot-sans font-extrabold text-[11.5px] sm:text-[12.5px] leading-tight transition-colors"
              style={{ background: view === k ? "var(--panel)" : "transparent", color: view === k ? "var(--text)" : "var(--text-muted)", boxShadow: view === k ? "var(--shadow-card)" : "none" }}>
              {label}<span className="block font-spot-mono text-[10px] opacity-60 mt-0.5">{n}</span>
            </button>
          ))}
        </div>

        {adjustedCount > 0 && (
          <p className="mt-3 font-spot-sans text-[11px] rounded-xl px-3 py-2" style={{ color: "var(--text-muted)", background: alpha(BLUE, "08"), border: `1px solid ${alpha(BLUE, "20")}` }}>
            Tuned to your results: {adjustedCount} legs on this board are adjusted using how your past picks in those markets actually landed.
          </p>
        )}

        <div className="mt-4">
          {view === "singles" && (
            singles.length === 0 ? (
              <EmptyState title="No strong plays right now" body={`We only list a bet when our number beats the market by a real margin. ${liveLines.nba + liveLines.nfl === 0 ? "No live lines are posted yet — check back closer to game time." : "Nothing clears the bar for this sport at the moment."}`} />
            ) : (
              <div className="flex flex-col gap-3">
                {hero && <Hero s={hero} />}
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span className="spot-label">All recommended bets</span>
                  {tierCounts.strong > 0 && <span className="font-spot-sans font-bold text-[10.5px]" style={{ color: GOOD }}>{tierCounts.strong} strong</span>}
                  {tierCounts.good > 0 && <span className="font-spot-sans font-bold text-[10.5px]" style={{ color: BLUE }}>{tierCounts.good} good</span>}
                  {tierCounts.lean > 0 && <span className="font-spot-sans font-bold text-[10.5px]" style={{ color: AMBER }}>{tierCounts.lean} lean</span>}
                </div>
                {rest.map((s) => {
                  const item: PropItem = { ...s.item, tag: { label: TIER_LABEL[s.tier], tone: s.tier === "lean" ? "neutral" : "good" } };
                  return <PropRow key={item.id} p={item} open={open === item.id} onOpen={() => setOpen(open === item.id ? null : item.id)} />;
                })}
              </div>
            )
          )}

          {view === "sgp" && (
            sgps.length === 0 ? <EmptyState title="No same-game parlays worth building" body="A same-game parlay needs two or more strong plays in one game that don't fight each other. None qualify right now." />
              : <div className="grid gap-3 md:grid-cols-2">{sgps.map((p) => <ParlayCard key={p.id} parlay={p} />)}</div>
          )}

          {view === "multi" && (
            multis.length === 0 ? <EmptyState title="Not enough games for a multi-game parlay" body="Multi-game parlays use one leg from each of several different games. We need more strong plays across more games." />
              : <div className="grid gap-3 md:grid-cols-2">{multis.map((p) => <ParlayCard key={p.id} parlay={p} />)}</div>
          )}
        </div>

        <div className="mt-8 rounded-2xl p-4 font-spot-sans text-[11px] leading-relaxed" style={{ background: "var(--wash-1)", border: "1px solid var(--hairline)", color: "var(--text-muted)" }}>
          <p className="font-extrabold mb-1" style={{ color: "var(--text)" }}>How to read this</p>
          <p>
            Every chance is a model estimate, blended with the market — not a guarantee. We rank bets by how far our number beats the book&apos;s, and we check correlation so parlay chances aren&apos;t just legs multiplied together.
            Parlays multiply risk: a 3-leg parlay with 70% legs still loses more often than it wins. Soccer player markets (shots, cards) show a posted price only and aren&apos;t recommended because we don&apos;t model them.
            {nbaDay ? ` NBA: ${nbaDay}.` : ""}{nflWeek ? ` NFL: ${nflWeek}.` : ""} Bet only what you can afford to lose.
          </p>
        </div>
      </div>
    </div>
  );
}
