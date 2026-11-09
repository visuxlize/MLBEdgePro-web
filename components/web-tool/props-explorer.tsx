"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { LogoPlate, WnbaHeadshot, alpha, gradeColor } from "@/components/web-tool/spotlight";
import { Chip, EmptyState, SportHeader, useCountUp } from "@/components/web-tool/sport-ui";
import { AddDot, SlipPanel } from "@/components/web-tool/slip-panel";
import { slip, useSlip } from "@/lib/slip";
import { researchFor } from "@/lib/picks/research";

/* ───────────────────────── Unified prop shape (all sports) ───────────────────────── */

export type { PropItem } from "@/lib/picks/types";
import type { PropItem } from "@/lib/picks/types";

export interface ExplorerGame { id: string; label: string; sub?: string }

const BLUE = "#1a73ff";
const GOOD = "#12a150";
const BAD = "#e5484d";
const fmtPrice = (p: number) => (p > 0 ? `+${p}` : String(p));
const edgeTone = (e: number) => (e >= 8 ? GOOD : e >= 3 ? BLUE : e >= 0 ? "#8a93a6" : BAD);

/* ───────────────────────── Small pieces ───────────────────────── */

function Search({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="relative flex-1 min-w-[200px]">
      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input
        value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search player or team"
        className="w-full rounded-2xl pl-10 pr-9 py-2.5 font-spot-sans font-semibold text-[13px] outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(26,115,255,.18)]"
        style={{ background: "var(--panel)", border: "1px solid var(--hairline)", color: "var(--text)" }}
      />
      {value && <button onClick={() => onChange("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black" style={{ background: "var(--wash-3)", color: "var(--text-3)" }}>×</button>}
    </label>
  );
}

function Pills<T extends string>({ value, onChange, options, id, tone = BLUE }: { value: T; onChange: (v: T) => void; options: { key: T; label: string; count?: number }[]; id: string; tone?: string }) {
  return (
    <div className="snap-row rounded-2xl p-1 max-w-full" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button key={o.key} onClick={() => onChange(o.key)} className="relative px-3 py-1.5 rounded-xl font-spot-sans font-extrabold text-[11.5px] whitespace-nowrap press" style={{ color: on ? "#fff" : "var(--text-muted)" }}>
            {on && <motion.span layoutId={`pill-${id}`} className="absolute inset-0 rounded-xl" style={{ background: tone }} transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className="relative">{o.label}{o.count != null && <span className="ml-1 opacity-60 font-bold">{o.count}</span>}</span>
          </button>
        );
      })}
    </div>
  );
}

function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: { key: string; label: string }[]; label: string }) {
  return (
    <label className="relative shrink-0">
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}
        className="appearance-none rounded-2xl pl-3.5 pr-8 py-[9px] font-spot-sans font-extrabold text-[11.5px] outline-none cursor-pointer max-w-[190px] truncate" style={{ background: "var(--panel)", border: "1px solid var(--hairline)", color: "var(--text-2)" }}>
        {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
    </label>
  );
}

function ProbBar({ prob, base, color }: { prob: number; base?: number; color: string }) {
  return (
    <div className="relative h-[6px] rounded-full overflow-visible" style={{ background: "var(--wash-3)" }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(3, prob))}%`, background: color, transformOrigin: "left", animation: "bar-grow .8s cubic-bezier(.22,1,.36,1) both" }} />
      {base != null && <span className="absolute top-[-3px] h-[12px] w-[2px] rounded" style={{ left: `${Math.min(99, base)}%`, background: "rgba(20,22,27,.45)" }} title={`Fair ${base}%`} />}
    </div>
  );
}

/** Line vs projection on one track — the whole prop in a single glance. */
function RangeViz({ p }: { p: PropItem }) {
  if (p.line == null || p.proj == null) return null;
  const vals = [p.line, p.proj, p.seasonAvg ?? p.line];
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = Math.max(0.6, (hi - lo) * 0.7, hi * 0.12);
  const min = Math.max(0, lo - pad), max = hi + pad;
  const pos = (v: number) => `${((v - min) / (max - min)) * 100}%`;
  const good = p.side ? (p.side === "over" ? p.proj >= p.line : p.proj <= p.line) : p.proj >= p.line;
  const c = good ? GOOD : BAD;
  const a = Math.min(p.line, p.proj), b = Math.max(p.line, p.proj);
  return (
    <div className="pt-6 pb-7 px-1">
      <div className="relative h-[8px] rounded-full" style={{ background: "var(--wash-3)" }}>
        <div className="absolute top-0 bottom-0 rounded-full" style={{ left: pos(a), width: `calc(${pos(b)} - ${pos(a)})`, background: `linear-gradient(90deg, ${alpha(c, "55")}, ${c})` }} />
        {p.seasonAvg != null && <span className="absolute top-1/2 w-[10px] h-[10px] rounded-full -translate-x-1/2 -translate-y-1/2" style={{ left: pos(p.seasonAvg), background: "var(--panel)", border: "2px solid #8a93a6" }} />}
        <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded" style={{ left: pos(p.line), background: "#14161b" }} />
        <span className="absolute -translate-x-1/2 font-spot-mono font-extrabold text-[10px] px-1.5 py-0.5 rounded-md whitespace-nowrap" style={{ left: pos(p.line), top: -26, color: "#14161b", background: "var(--wash-2)" }}>Line {p.line}</span>
        <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[16px] h-[16px] rounded-full" style={{ left: pos(p.proj), background: c, boxShadow: `0 0 0 4px ${alpha(c, "2e")}` }} />
        <span className="absolute -translate-x-1/2 font-spot-mono font-extrabold text-[10px] whitespace-nowrap" style={{ left: pos(p.proj), top: 16, color: c }}>Model {p.proj}</span>
      </div>
    </div>
  );
}

/* ───────────────────────── The row ───────────────────────── */

export function PropRow({ p, open, onOpen }: { p: PropItem; open: boolean; onOpen: () => void }) {
  const { ids } = useSlip();
  const inSlip = ids.has(p.id);
  const onToggle = () => slip.toggle(p);
  const tone = p.kind === "model" ? edgeTone(p.edge) : BLUE;
  const sideColor = p.side === "under" ? BAD : p.side === "over" ? GOOD : BLUE;
  return (
    <motion.div layout="position" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
      className="rounded-[20px] overflow-hidden transition-shadow"
      style={{ background: "var(--panel)", border: `1px solid ${inSlip ? alpha(GOOD, "70") : open ? alpha(BLUE, "55") : "var(--hairline)"}`, boxShadow: open ? "0 14px 36px rgba(20,22,27,.10)" : "var(--shadow-card)" }}>
      <div role="button" tabIndex={0} aria-expanded={open} onClick={onOpen} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
        className="flex items-center gap-3 px-3.5 py-3 cursor-pointer select-none">
        <div className="relative shrink-0">
          <WnbaHeadshot hex={p.hex} src={p.headshot} name={p.player} size={46} radius={14} />
          <div className="absolute -bottom-1 -right-1"><LogoPlate hex={p.hex} src={p.logo} code={p.team} size={19} radius={6} variant="clean" /></div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-spot-sans font-black text-[14px] leading-tight truncate" style={{ color: "var(--text)" }}>{p.player}</p>
            {p.lineSource === "draftkings" && <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ background: GOOD }} title="Real DraftKings line" />}
          </div>
          <p className="font-spot-sans font-semibold text-[10.5px] truncate" style={{ color: "var(--text-faint)" }}>{p.team}{p.pos ? ` · ${p.pos}` : ""} {p.home === false ? "@" : "vs"} {p.opp} · {p.when}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="rounded-lg px-2 py-[3px] font-spot-sans font-extrabold text-[10.5px] whitespace-nowrap" style={{ color: `color-mix(in srgb, ${sideColor} 80%, #14161b)`, background: `color-mix(in srgb, ${sideColor} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${sideColor} 28%, transparent)` }}>
              {p.pick} <span className="opacity-60 font-bold">{p.marketShort}</span>
            </span>
            {p.movement && <span className="font-spot-mono font-bold text-[10px]" style={{ color: p.movement === "shorter" ? "#d49a06" : "#3b82f6" }}>{p.movement === "shorter" ? "▲" : "▼"}</span>}
            {p.openLine != null && p.line != null && p.openLine !== p.line && <span className="font-spot-mono font-bold text-[10px]" style={{ color: "var(--text-faint)" }}>{p.openLine}→{p.line}</span>}
          </div>
        </div>

        <div className="hidden sm:block w-[150px] shrink-0">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="font-spot-mono font-black text-[15px]" style={{ color: "var(--text)" }}>{p.prob}%</span>
            <span className="font-spot-mono font-bold text-[10.5px]" style={{ color: tone }}>{p.kind === "model" ? `${p.edge >= 0 ? "+" : ""}${p.edge} edge` : "implied"}</span>
          </div>
          <ProbBar prob={p.prob} base={p.kind === "model" ? p.baseProb : undefined} color={tone} />
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1 w-[46px] sm:w-[60px]">
          {p.kind === "model" && p.grade ? (
            <span className="w-[40px] h-[40px] rounded-[13px] flex items-center justify-center font-spot-sans font-black text-[15px]" style={{ color: gradeColor(p.grade), background: `color-mix(in srgb, ${gradeColor(p.grade)} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${gradeColor(p.grade)} 32%, transparent)` }}>{p.grade}</span>
          ) : (
            <span className="font-spot-mono font-black text-[17px] leading-none" style={{ color: "var(--text)" }}>{p.price != null ? fmtPrice(p.price) : "—"}</span>
          )}
          <span className="sm:hidden font-spot-mono font-bold text-[10.5px]" style={{ color: tone }}>{p.prob}%</span>
        </div>

        <AddDot item={p} inSlip={inSlip} />
        <svg className="shrink-0 hidden sm:block transition-transform duration-300" style={{ transform: open ? "rotate(180deg)" : undefined }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-1" style={{ borderTop: "1px solid var(--hairline)", background: `linear-gradient(180deg, ${alpha(p.hex, "10")}, transparent 60%)` }}>
              <div className="flex items-center justify-between pt-3">
                <p className="font-spot-sans font-extrabold text-[12.5px]" style={{ color: "var(--text)" }}>{p.marketShort} · {p.lineSource === "draftkings" ? "DraftKings line" : p.kind === "model" ? "Reference line" : "DraftKings price"}</p>
                {p.tag && <Chip color={p.tag.tone === "good" ? GOOD : p.tag.tone === "bad" ? BAD : "#94a3b8"}>{p.tag.label}</Chip>}
              </div>

              <RangeViz p={p} />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                {[{ label: p.kind === "model" ? "Hit chance" : "Implied", value: `${p.prob}%` }, ...(p.kind === "model" && p.baseProb != null ? [{ label: p.lineSource === "draftkings" ? "Fair" : "Baseline", value: `${p.baseProb}%` }] : []), ...(p.price != null && p.kind === "model" ? [{ label: "DK price", value: fmtPrice(p.price) }] : []), ...p.stats].slice(0, 8).map((s) => (
                  <div key={s.label} className="rounded-xl px-3 py-2" style={{ background: "var(--wash-1)", border: "1px solid var(--hairline)" }}>
                    <p className="font-spot-sans font-extrabold text-[8.5px] uppercase tracking-[.1em]" style={{ color: "var(--text-faint)" }}>{s.label}</p>
                    <p className="font-spot-mono font-black text-[14px]" style={{ color: "var(--text)" }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {p.openPrice != null && p.price != null && (
                <p className="mt-3 font-spot-sans text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Price moved <b className="font-spot-mono">{fmtPrice(p.openPrice)} → {fmtPrice(p.price)}</b> since it opened{p.movement === "shorter" ? " — money is coming in on this." : p.movement === "longer" ? " — the market is drifting away." : "."}
                </p>
              )}
              {(() => {
                const r = researchFor(p);
                return (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {r.case.length > 0 && (
                      <div>
                        <p className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.12em] mb-1.5" style={{ color: GOOD }}>The case</p>
                        <ul className="flex flex-col gap-1.5">
                          {r.case.map((n) => <li key={n} className="flex gap-2 font-spot-sans text-[11.5px] leading-snug" style={{ color: "var(--text-muted)" }}><span className="mt-[5px] w-1 h-1 rounded-full shrink-0" style={{ background: GOOD }} />{n}</li>)}
                        </ul>
                      </div>
                    )}
                    {r.risks.length > 0 && (
                      <div>
                        <p className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.12em] mb-1.5" style={{ color: "#c2790a" }}>What could go wrong</p>
                        <ul className="flex flex-col gap-1.5">
                          {r.risks.map((n) => <li key={n} className="flex gap-2 font-spot-sans text-[11.5px] leading-snug" style={{ color: "var(--text-muted)" }}><span className="mt-[5px] w-1 h-1 rounded-full shrink-0" style={{ background: "#d49a06" }} />{n}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
              {onToggle && (
                <button onClick={onToggle} className="press mt-4 w-full rounded-xl py-2.5 font-spot-sans font-extrabold text-[12px]"
                  style={inSlip ? { color: GOOD, background: "rgba(18,161,80,.10)", border: "1px solid rgba(18,161,80,.35)" } : { color: "#fff", background: BLUE, boxShadow: "0 8px 20px rgba(26,115,255,.28)" }}>
                  {inSlip ? "✓ In your slip — tap to remove" : "+ Add to slip"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** Stand-alone list (used inside game pages) — rows only, one open at a time. */
export function PropList({ items }: { items: PropItem[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return <div className="flex flex-col gap-2.5">{items.map((p) => <PropRow key={p.id} p={p} open={open === p.id} onOpen={() => setOpen(open === p.id ? null : p.id)} />)}</div>;
}

/* ───────────────────────── Top edges ───────────────────────── */

function TopCard({ p, i, onPick }: { p: PropItem; i: number; onPick: () => void }) {
  const tone = p.kind === "model" ? edgeTone(p.edge) : BLUE;
  const n = useCountUp(p.prob);
  return (
    <motion.button onClick={onPick} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.4 }} whileHover={{ y: -3 }}
      className="text-left relative overflow-hidden rounded-[22px] p-4 w-[258px] sm:w-auto shrink-0"
      style={{ background: `linear-gradient(150deg, ${alpha(p.hex, "26")}, var(--panel) 62%)`, border: `1px solid ${alpha(p.hex, "44")}`, boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center gap-3">
        <WnbaHeadshot hex={p.hex} src={p.headshot} name={p.player} size={58} radius={17} />
        <div className="min-w-0">
          <p className="font-spot-sans font-black text-[14.5px] leading-tight truncate" style={{ color: "var(--text)" }}>{p.player}</p>
          <p className="font-spot-sans font-semibold text-[10.5px] truncate" style={{ color: "var(--text-faint)" }}>{p.team} {p.home === false ? "@" : "vs"} {p.opp}</p>
        </div>
      </div>
      <p className="mt-3 font-spot-sans font-black text-[17px] leading-none" style={{ color: p.side === "under" ? BAD : p.side === "over" ? GOOD : BLUE }}>{p.pick} <span className="text-[11px] font-extrabold" style={{ color: "var(--text-3)" }}>{p.marketShort}</span></p>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="font-spot-mono font-black text-[26px] leading-none" style={{ color: "var(--text)" }}>{n}<span className="text-[14px]">%</span></p>
          <p className="mt-1 font-spot-sans font-extrabold text-[9px] uppercase tracking-[.12em]" style={{ color: "var(--text-faint)" }}>{p.kind === "model" ? "model hit chance" : "implied chance"}</p>
        </div>
        {p.kind === "model" ? (
          <span className="rounded-full px-2.5 py-1 font-spot-mono font-black text-[11px]" style={{ color: tone, background: `color-mix(in srgb, ${tone} 13%, transparent)` }}>{p.edge >= 0 ? "+" : ""}{p.edge}</span>
        ) : (
          <span className="font-spot-mono font-black text-[18px]" style={{ color: "var(--text)" }}>{p.price != null ? fmtPrice(p.price) : ""}</span>
        )}
      </div>
    </motion.button>
  );
}

function SlipRail() {
  const { count } = useSlip();
  return (
    <aside className="hidden lg:block sticky top-20 rounded-[22px] p-4 max-h-[calc(100vh-110px)] overflow-y-auto" style={{ background: "var(--panel)", border: "1px solid var(--hairline)", boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between mb-2">
        <p className="font-spot-sans font-black text-[15px]" style={{ color: "var(--text)" }}>Your slip</p>
        <span className="flex items-center gap-2">
          {count > 0 && <span className="rounded-full px-2 py-0.5 font-spot-mono font-black text-[11px]" style={{ background: BLUE, color: "#fff" }}>{count}</span>}
          <Link href="/slips" className="font-spot-sans font-extrabold text-[11.5px]" style={{ color: "var(--text-3)" }}>My slips →</Link>
        </span>
      </div>
      <SlipPanel />
    </aside>
  );
}

/* ───────────────────────── The explorer ───────────────────────── */

type Sort = "top" | "prob" | "name";
type Side = "any" | "over" | "under";

export function PropsExplorer({
  sport, eyebrow, title, subtitle, items, games, markets, summary, footnote, backHref, defaultGroup = "ranked", topLabel,
}: {
  sport: "nba" | "nfl" | "soccer";
  eyebrow: string; title: string; subtitle: string;
  items: PropItem[]; games: ExplorerGame[];
  markets: { key: string; label: string }[];
  summary: { label: string; value: string }[];
  footnote: string; backHref: string;
  defaultGroup?: "ranked" | "game"; topLabel: string;
}) {
  const [q, setQ] = useState("");
  const [market, setMarket] = useState("all");
  const [side, setSide] = useState<Side>("any");
  const [gameId, setGameId] = useState("all");
  const [sort, setSort] = useState<Sort>("top");
  const [group, setGroup] = useState<"ranked" | "game">(defaultGroup);
  const [open, setOpen] = useState<string | null>(null);
  const [limit, setLimit] = useState(30);
  const listRef = useRef<HTMLDivElement>(null);
  const hasSides = items.some((p) => p.side);
  const kind = items[0]?.kind ?? "model";
  useEffect(() => setLimit(30), [q, market, side, gameId, sort, group]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    items.forEach((p) => m.set(p.marketKey, (m.get(p.marketKey) ?? 0) + 1));
    return m;
  }, [items]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = items.filter((p) =>
      (market === "all" || p.marketKey === market) &&
      (side === "any" || p.side === side) &&
      (gameId === "all" || p.gameId === gameId) &&
      (!needle || p.player.toLowerCase().includes(needle) || p.team.toLowerCase().includes(needle) || p.opp.toLowerCase().includes(needle)));
    const score = (p: PropItem) => (p.kind === "model" ? p.edge * 10 + p.prob / 10 : p.prob);
    return [...list].sort(sort === "name" ? (a, b) => a.player.localeCompare(b.player) : sort === "prob" ? (a, b) => b.prob - a.prob : (a, b) => score(b) - score(a));
  }, [items, q, market, side, gameId, sort]);

  const top = useMemo(() => {
    const seen = new Set<string>();
    return [...items].sort((a, b) => (b.kind === "model" ? b.edge * 10 + b.prob / 10 : b.prob) - (a.kind === "model" ? a.edge * 10 + a.prob / 10 : a.prob))
      .filter((p) => (seen.has(p.player) ? false : (seen.add(p.player), true))).slice(0, 3);
  }, [items]);

  const visible = filtered.slice(0, limit);

  const byGame = useMemo(() => {
    const m = new Map<string, PropItem[]>();
    visible.forEach((p) => m.set(p.gameId, [...(m.get(p.gameId) ?? []), p]));
    return [...m.entries()];
  }, [visible]);
  const gameOf = (id: string) => games.find((g) => g.id === id);

  const jumpTo = (p: PropItem) => {
    setQ(""); setMarket("all"); setSide("any"); setGameId("all"); setSort("top");
    setOpen(p.id);
    requestAnimationFrame(() => setTimeout(() => document.getElementById(`prop-${p.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80));
  };

  const row = (p: PropItem) => (
    <div key={p.id} id={`prop-${p.id}`}>
      <PropRow p={p} open={open === p.id} onOpen={() => setOpen(open === p.id ? null : p.id)} />
    </div>
  );

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-2xl mx-auto page-pad py-4 sm:py-6" style={{ paddingBottom: 110 }}>
        <SportHeader eyebrow={eyebrow} title={title} subtitle={subtitle} accent={BLUE} />

        {items.length === 0 ? (
          <EmptyState title="Nothing on the board yet" body="Props appear as soon as the next slate is posted." />
        ) : (
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-6 items-start">
            <div className="min-w-0">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-2.5 mb-4 stagger">
                {summary.map((s) => (
                  <div key={s.label} className="rounded-2xl px-3.5 py-3" style={{ background: "var(--panel)", border: "1px solid var(--hairline)", boxShadow: "var(--shadow-card)" }}>
                    <p className="font-spot-mono font-black text-[19px] sm:text-[22px] leading-none" style={{ color: "var(--text)" }}>{s.value}</p>
                    <p className="mt-1.5 font-spot-sans font-extrabold text-[8.5px] sm:text-[9px] uppercase tracking-[.11em]" style={{ color: "var(--text-faint)" }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Top picks */}
              <div className="mb-5">
                <p className="spot-label mb-2.5" style={{ color: "var(--text-faint)" }}>{topLabel}</p>
                <div className="snap-row -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-3 pb-1">
                  {top.map((p, i) => <TopCard key={p.id} p={p} i={i} onPick={() => jumpTo(p)} />)}
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex flex-col gap-2.5 mb-4">
                <Search value={q} onChange={setQ} />
                <div className="snap-row -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
                  <Pills id={`${sport}-market`} value={market} onChange={setMarket} options={[{ key: "all", label: "All", count: items.length }, ...markets.filter((m) => counts.get(m.key)).map((m) => ({ key: m.key, label: m.label, count: counts.get(m.key) }))]} />
                </div>
                <div className="snap-row -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible items-center">
                  <Pills id={`${sport}-group`} value={group} onChange={setGroup} options={[{ key: "ranked", label: "Ranked" }, { key: "game", label: "By game" }]} />
                  {hasSides && <Pills id={`${sport}-side`} tone="#6d4fe0" value={side} onChange={setSide} options={[{ key: "any", label: "Any side" }, { key: "over", label: "Over" }, { key: "under", label: "Under" }]} />}
                  <Select value={sort} onChange={(v) => setSort(v as Sort)} label="Sort" options={[{ key: "top", label: kind === "model" ? "Best edge" : "Most likely" }, { key: "prob", label: "Probability" }, { key: "name", label: "Player A–Z" }]} />
                  {games.length > 1 && <Select value={gameId} onChange={setGameId} label="Game" options={[{ key: "all", label: "All games" }, ...games.map((g) => ({ key: g.id, label: g.label }))]} />}
                </div>
              </div>

              {/* List */}
              <div ref={listRef}>
                {filtered.length === 0 ? (
                  <EmptyState title="No props match" body="Try clearing the search or switching markets." />
                ) : group === "ranked" ? (
                  <div className="flex flex-col gap-2.5">{visible.map(row)}</div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {byGame.map(([gid, list]) => {
                      const g = gameOf(gid);
                      return (
                        <section key={gid}>
                          <div className="flex items-baseline justify-between gap-3 mb-2.5 px-1">
                            <p className="font-spot-sans font-black text-[15px]" style={{ color: "var(--text)" }}>{g?.label ?? list[0].gameLabel}</p>
                            <p className="font-spot-mono font-bold text-[10.5px]" style={{ color: "var(--text-faint)" }}>{g?.sub ?? list[0].when} · {list.length}</p>
                          </div>
                          <div className="flex flex-col gap-2.5">{list.map(row)}</div>
                        </section>
                      );
                    })}
                  </div>
                )}
                {filtered.length > limit && (
                  <div className="mt-5 flex justify-center">
                    <button onClick={() => setLimit((l) => l + 30)} className="press rounded-xl px-5 py-2.5 font-spot-sans font-extrabold text-[12px]" style={{ color: BLUE, background: "rgba(26,115,255,.10)", border: "1px solid rgba(26,115,255,.28)" }}>Show more ({filtered.length - limit})</button>
                  </div>
                )}
              </div>
            </div>

            {/* Slip — desktop rail (phones & tablets use the floating slip pill) */}
            <SlipRail />
          </div>
        )}

        <p className="mt-8 font-spot-sans text-[10px] max-w-2xl" style={{ color: "var(--text-faint)" }}>{footnote} <Link href={backHref} className="underline">Back to games</Link></p>
      </div>

    </div>
  );
}
