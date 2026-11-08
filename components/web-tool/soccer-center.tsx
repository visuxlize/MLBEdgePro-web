"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Plus, Search, Sparkles, X, Play } from "lucide-react";
import { SOCCER_LEAGUES, leagueLogoUrl, soccerHeadshotUrl } from "@/lib/soccer/leagues";
import type { SoccerLeagueKey, SoccerMatch } from "@/lib/soccer/types";
import type { TableRow } from "@/lib/soccer/model";
import type { LineupPlayer, SoccerMatchCenter } from "@/lib/soccer/match-center";

/* ───────────────────────── helpers ───────────────────────── */

const BLUE = "#1a73ff", YELLOW = "#fbbf24", GREEN = "#15c43a", INK = "#14161b", INK2 = "#4b515c", INK3 = "#8a909b";

function lum(hex: string) {
  const c = hex.replace("#", "");
  if (c.length < 6) return 0.5;
  const f = (i: number) => parseInt(c.slice(i, i + 2), 16) / 255;
  return 0.2126 * f(0) + 0.7152 * f(2) + 0.0722 * f(4);
}
/** Team colour that stays readable on a white card. */
function ink(hex: string) {
  const c = hex.replace("#", "");
  if (c.length < 6) return BLUE;
  const l = lum(hex);
  if (l < 0.78) return hex;
  const k = 0.55;
  const ch = (i: number) => Math.round(parseInt(c.slice(i, i + 2), 16) * k).toString(16).padStart(2, "0");
  return `#${ch(0)}${ch(2)}${ch(4)}`;
}
function pickPair(home: string, away: string): [string, string] {
  const a = ink(home), b = ink(away);
  const d = (x: string, y: string) => Math.abs(lum(x) - lum(y));
  return d(a, b) < 0.12 ? [a, YELLOW] : [a, b];
}

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const dayLong = (iso: string) => new Date(iso).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short" });

function ymd(d: Date) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function Ball({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10.5" fill="#fff" stroke="#c9ccd3" />
      <path d="M12 6.5l3.6 2.6-1.4 4.2H9.8L8.4 9.1 12 6.5z" fill="#2b2f38" />
      <path d="M12 6.5V3M15.6 9.1l3.3-1M14.2 13.3l2 3M9.8 13.3l-2 3M8.4 9.1l-3.3-1" stroke="#2b2f38" strokeWidth="1" fill="none" />
    </svg>
  );
}

function Crest({ src, name, size = 44 }: { src: string; name: string; size?: number }) {
  const [bad, setBad] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => { if (ref.current?.complete && ref.current.naturalWidth === 0) setBad(true); }, []);
  if (bad) {
    return <span className="inline-flex items-center justify-center rounded-full font-black shrink-0" style={{ width: size, height: size, background: "#eef0f4", color: INK2, fontSize: size * 0.32 }}>{name.slice(0, 3).toUpperCase()}</span>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src} alt={name} width={size} height={size} onError={() => setBad(true)} className="object-contain shrink-0" style={{ width: size, height: size }} />;
}

function Card({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={`m-card ${className}`} style={style}>{children}</div>;
}

function CardTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-[17px] font-semibold tracking-tight" style={{ color: INK }}>{children}</p>
      {right}
    </div>
  );
}

/* ───────────────────────── lineup layout ───────────────────────── */

function depthOf(pos: string): number {
  const p = pos.toUpperCase();
  if (p === "G" || p === "GK") return 0;
  if (/^(CD|CB|SW)/.test(p)) return 1;
  if (/^(LB|RB)$/.test(p)) return 1.05;
  if (/WB$/.test(p)) return 1.6;
  if (/^DM/.test(p)) return 2;
  if (/^CM/.test(p)) return 2.5;
  if (/^(LM|RM)$/.test(p)) return 2.6;
  if (/^AM/.test(p)) return 3;
  if (/^(LW|RW)$/.test(p)) return 3.2;
  return 4;
}
function lateral(pos: string): number {
  const p = pos.toUpperCase();
  if (/-L$|^L/.test(p)) return -1;
  if (/-R$|^R/.test(p)) return 1;
  return 0;
}

function layoutLineup(players: LineupPlayer[], formation: string) {
  const starters = players.filter((p) => p.starter);
  const gk = starters.find((p) => depthOf(p.pos) === 0) ?? starters[0];
  const field = starters.filter((p) => p !== gk).sort((a, b) => depthOf(a.pos) - depthOf(b.pos) || lateral(a.pos) - lateral(b.pos) || a.place - b.place);
  const counts = formation.split("-").map((n) => parseInt(n)).filter((n) => n > 0);
  const rows: LineupPlayer[][] = [];
  if (counts.reduce((a, b) => a + b, 0) === field.length) {
    let i = 0;
    for (const c of counts) { rows.push(field.slice(i, i + c)); i += c; }
  } else {
    rows.push(field.slice(0, 4), field.slice(4, 8), field.slice(8));
  }
  const out: { p: LineupPlayer; x: number; y: number }[] = [];
  if (gk) out.push({ p: gk, x: 50, y: 91 });
  rows.forEach((row, ri) => {
    const y = 76 - (ri * (60 / Math.max(1, rows.length - 1 || 1)));
    const sorted = [...row].sort((a, b) => lateral(a.pos) - lateral(b.pos) || a.place - b.place);
    sorted.forEach((p, i) => out.push({ p, x: ((i + 1) / (sorted.length + 1)) * 100, y: rows.length === 1 ? 50 : y }));
  });
  return out;
}

/* ───────────────────────── cards ───────────────────────── */

function LeagueList({
  league, setLeague, tables, counts,
}: { league: SoccerLeagueKey | "all"; setLeague: (l: SoccerLeagueKey | "all") => void; tables: Record<string, TableRow[]>; counts: Record<string, number> }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <>
      <Card className="px-4 py-2">
        <button onClick={() => { setLeague("all"); setOpen(null); }} className="press w-full flex items-center gap-3 py-3 text-left" style={{ borderBottom: `1px solid var(--m-line)` }}>
          <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: league === "all" ? BLUE : "#eef0f4", color: league === "all" ? "#fff" : INK2 }}><Ball size={16} /></span>
          <span className="flex-1 text-[15px] font-medium" style={{ color: league === "all" ? BLUE : INK }}>All leagues</span>
          <span className="text-[11px] font-semibold" style={{ color: INK3 }}>{counts.all ?? 0}</span>
        </button>
        {SOCCER_LEAGUES.map((l, i) => {
          const isOpen = open === l.key;
          const rows = (tables[l.key] ?? []).slice(0, 5);
          return (
            <div key={l.key} style={{ borderBottom: i < SOCCER_LEAGUES.length - 1 ? `1px solid var(--m-line)` : undefined }}>
              <button onClick={() => { setLeague(l.key); setOpen(isOpen ? null : l.key); }} className="press w-full flex items-center gap-3 py-3 text-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={leagueLogoUrl(l.espnLeagueId)} alt="" width={26} height={26} className="w-[26px] h-[26px] object-contain" onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = "hidden")} />
                <span className="flex-1 text-[15px] font-medium truncate" style={{ color: league === l.key ? BLUE : INK }}>{l.label}</span>
                {(counts[l.key] ?? 0) > 0 && <span className="text-[11px] font-semibold rounded-full px-1.5" style={{ color: BLUE, background: "#e8f0ff" }}>{counts[l.key]}</span>}
                <ChevronDown size={16} style={{ color: INK3, transform: isOpen ? "rotate(180deg)" : undefined, transition: "transform .25s" }} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="pb-3 flex flex-col gap-1">
                      {rows.length === 0 && <p className="text-xs px-1 pb-1" style={{ color: INK3 }}>Table unavailable</p>}
                      {rows.map((r) => (
                        <div key={r.id} className="flex items-center gap-2 text-[12px]">
                          <span className="w-4 text-center font-semibold" style={{ color: INK3 }}>{r.rank}</span>
                          <Crest src={r.logo} name={r.abbr} size={18} />
                          <span className="flex-1 truncate font-medium" style={{ color: INK }}>{r.name}</span>
                          <span className="w-6 text-right" style={{ color: INK3 }}>{r.gd > 0 ? "+" : ""}{r.gd}</span>
                          <span className="w-6 text-right font-bold" style={{ color: INK }}>{r.pts}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </Card>
      <Link href="/soccer/leagues" className="press m-card flex items-center justify-between px-5 py-4">
        <span className="text-[15px] font-medium" style={{ color: INK }}>Add Your League</span>
        <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#f3f4f7", color: INK }}><Plus size={18} /></span>
      </Link>
    </>
  );
}

function LeagueChips({ league, setLeague, counts }: { league: SoccerLeagueKey | "all"; setLeague: (l: SoccerLeagueKey | "all") => void; counts: Record<string, number> }) {
  return (
    <div className="snap-row -mx-1 px-1 pb-1">
      {[{ key: "all" as const, label: "All", logo: "" }, ...SOCCER_LEAGUES.map((l) => ({ key: l.key, label: l.shortLabel, logo: leagueLogoUrl(l.espnLeagueId) }))].map((l) => {
        const active = league === l.key;
        return (
          <button key={l.key} onClick={() => setLeague(l.key)} className="press inline-flex items-center gap-2 rounded-2xl px-3.5 py-2.5 m-pill text-[13px] font-semibold"
            style={active ? { background: BLUE, color: "#fff" } : { color: INK }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {l.logo && <img src={l.logo} alt="" width={18} height={18} className="w-[18px] h-[18px] object-contain" />}
            {l.label}
            {(counts[l.key] ?? 0) > 0 && <span className="text-[10px] rounded-full px-1.5" style={active ? { background: "rgba(255,255,255,.25)" } : { background: "#e8f0ff", color: BLUE }}>{counts[l.key]}</span>}
          </button>
        );
      })}
    </div>
  );
}

function LineupCard({ c }: { c: SoccerMatchCenter }) {
  const [side, setSide] = useState<"home" | "away">("home");
  const team = side === "home" ? c.match.homeTeam : c.match.awayTeam;
  const lu = c.lineups[side];
  const dots = useMemo(() => layoutLineup(lu.players, lu.formation), [lu]);
  const col = ink(team.hex);
  return (
    <Card className="p-5">
      <CardTitle right={<span className="text-[11px] font-bold rounded-full px-2.5 py-1" style={{ background: "#eef0f4", color: INK2 }}>{lu.formation || "—"}</span>}>{team.shortName} Lineup</CardTitle>
      <div className="flex gap-1 mt-3 mb-3 p-1 rounded-xl" style={{ background: "#f3f4f7" }}>
        {(["home", "away"] as const).map((s) => (
          <button key={s} onClick={() => setSide(s)} className="press flex-1 rounded-lg py-1.5 text-[12px] font-semibold" style={side === s ? { background: "#fff", color: INK, boxShadow: "0 1px 3px rgba(0,0,0,.08)" } : { color: INK3 }}>
            {s === "home" ? c.match.homeTeam.abbr : c.match.awayTeam.abbr}
          </button>
        ))}
      </div>
      {dots.length === 0 ? (
        <p className="text-sm py-10 text-center" style={{ color: INK3 }}>Lineups appear about an hour before kickoff.</p>
      ) : (
        <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "100 / 118", background: "repeating-linear-gradient(0deg,#2fbf4a 0 8.33%,#27b142 8.33% 16.66%)" }}>
          <svg viewBox="0 0 100 118" className="absolute inset-0 w-full h-full" aria-hidden>
            <g fill="none" stroke="rgba(255,255,255,.7)" strokeWidth=".5">
              <rect x="3" y="3" width="94" height="112" rx="1" />
              <line x1="3" y1="59" x2="97" y2="59" />
              <circle cx="50" cy="59" r="10" />
              <rect x="25" y="3" width="50" height="17" /><rect x="38" y="3" width="24" height="7" />
              <rect x="25" y="98" width="50" height="17" /><rect x="38" y="108" width="24" height="7" />
            </g>
          </svg>
          {dots.map(({ p, x, y }, i) => (
            <div key={p.id + side} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
              <motion.div initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.035, type: "spring", stiffness: 380, damping: 22 }} className="flex flex-col items-center">
                <span className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-black border-2 border-white" style={{ background: col, color: lum(col) > 0.6 ? "#14161b" : "#fff", boxShadow: "0 2px 6px rgba(0,0,0,.3)" }}>{p.jersey}</span>
                <span className="mt-0.5 text-[9px] font-bold text-white leading-none px-1 rounded whitespace-nowrap" style={{ textShadow: "0 1px 2px rgba(0,0,0,.6)" }}>{p.name.split(" ").slice(-1)[0]}</span>
              </motion.div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function NextFixture({ m, onPick }: { m?: SoccerMatch; onPick: (m: SoccerMatch) => void }) {
  if (!m) return null;
  return (
    <button onClick={() => onPick(m)} className="press m-card px-5 py-4 text-left w-full">
      <div className="flex items-center justify-between">
        <p className="text-[17px] font-semibold" style={{ color: INK }}>{dayLong(m.date)}</p>
        <span className="text-[11px] font-bold rounded-full px-2 py-0.5" style={{ background: "#e8f0ff", color: BLUE }}>Next up</span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Crest src={m.homeTeam.logo} name={m.homeTeam.abbr} size={46} />
        <span className="text-[18px] font-medium" style={{ color: INK }}>{timeOf(m.date)}</span>
        <Crest src={m.awayTeam.logo} name={m.awayTeam.abbr} size={46} />
      </div>
    </button>
  );
}

/* ── Hero ─────────────────────────────────────────────────────────────────── */

function Hero({ c }: { c: SoccerMatchCenter }) {
  const m = c.match;
  const [hc, ac] = pickPair(m.homeTeam.hex, m.awayTeam.hex);
  return (
    <div className="relative overflow-hidden rounded-[24px] min-h-[210px] sm:min-h-[260px] flex items-center justify-center" style={{ background: `linear-gradient(115deg, ${hc} 0%, #14161b 50%, ${ac} 100%)`, boxShadow: "var(--m-shadow)" }}>
      {c.video && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.video.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.85 }} />
      )}
      <div className="absolute inset-0" style={{ background: "radial-gradient(60% 80% at 50% 120%, rgba(0,0,0,.55), transparent)" }} />
      {!c.video && (
        <div className="relative flex items-center gap-6 sm:gap-12">
          <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 160, damping: 18 }} style={{ filter: "drop-shadow(0 10px 24px rgba(0,0,0,.45))" }}><Crest src={m.homeTeam.logo} name={m.homeTeam.abbr} size={112} /></motion.div>
          <span className="text-white/70 font-black text-xl">VS</span>
          <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 160, damping: 18 }} style={{ filter: "drop-shadow(0 10px 24px rgba(0,0,0,.45))" }}><Crest src={m.awayTeam.logo} name={m.awayTeam.abbr} size={112} /></motion.div>
        </div>
      )}
      {c.video && c.video.href && (
        <a href={c.video.href} target="_blank" rel="noopener noreferrer" aria-label="Watch highlights" className="press absolute w-[68px] h-[68px] rounded-full flex items-center justify-center" style={{ background: BLUE, boxShadow: "0 8px 30px rgba(26,115,255,.55)" }}>
          <Play size={26} fill="#fff" color="#fff" />
        </a>
      )}
      <div className="absolute left-4 top-4 flex items-center gap-2">
        <span className="text-[11px] font-bold rounded-full px-2.5 py-1 text-white" style={{ background: "rgba(0,0,0,.45)", backdropFilter: "blur(6px)" }}>{c.league.name}</span>
        {m.status === "live" && <span className="text-[11px] font-bold rounded-full px-2.5 py-1 text-white inline-flex items-center gap-1.5" style={{ background: "#ef3b4a" }}><span className="spot-live-dot w-1.5 h-1.5 rounded-full bg-white" />LIVE {m.clock}</span>}
      </div>
      {c.video && <span className="absolute left-4 bottom-4 right-4 text-white text-[13px] font-semibold truncate" style={{ textShadow: "0 1px 6px rgba(0,0,0,.6)" }}>{c.video.title}</span>}
    </div>
  );
}

/* ── Momentum ─────────────────────────────────────────────────────────────── */

function Momentum({ c }: { c: SoccerMatchCenter }) {
  const [hc, ac] = pickPair(c.match.homeTeam.hex, c.match.awayTeam.hex);
  const H = 70;
  const slot = (b: SoccerMatchCenter["momentum"][number], i: number) => (
    <div key={b.label} className="flex-1 flex flex-col items-center min-w-0">
      <div className="relative w-full flex flex-col items-center justify-end" style={{ height: H + 18 }}>
        {b.goalsHome > 0 && <span className="absolute -top-0.5">{Array.from({ length: b.goalsHome }).map((_, k) => <Ball key={k} size={16} />)}</span>}
        <motion.div initial={{ height: 0 }} animate={{ height: Math.max(6, (b.home / 100) * H) }} transition={{ delay: i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="w-[78%] max-w-[38px] rounded-[6px]" style={{ background: hc }} />
      </div>
      <span className="my-1.5 text-[12px] font-semibold px-1.5 rounded" style={{ background: "#f3f4f7", color: INK2 }}>{(i + 1) * 15}&apos;</span>
      <div className="relative w-full flex flex-col items-center justify-start" style={{ height: H + 18 }}>
        <motion.div initial={{ height: 0 }} animate={{ height: Math.max(6, (b.away / 100) * H) }} transition={{ delay: i * 0.06 + 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="w-[78%] max-w-[38px] rounded-[6px]" style={{ background: ac }} />
        {b.goalsAway > 0 && <span className="absolute -bottom-0.5">{Array.from({ length: b.goalsAway }).map((_, k) => <Ball key={k} size={16} />)}</span>}
      </div>
    </div>
  );
  return (
    <Card className="p-5 sm:p-6">
      <CardTitle right={<span className="text-[11px] font-medium" style={{ color: INK3 }}>shots · corners · goals by 15&apos;</span>}>Match Momentum</CardTitle>
      <div className="mt-3 pt-4 flex items-center gap-2" style={{ borderTop: "1px solid var(--m-line)" }}>
        <div className="flex flex-col items-center justify-between self-stretch py-3 gap-1 shrink-0 w-9">
          <Crest src={c.match.homeTeam.logo} name={c.match.homeTeam.abbr} size={30} />
          <span className="text-[12px] font-medium" style={{ color: INK2 }}>Vs</span>
          <Crest src={c.match.awayTeam.logo} name={c.match.awayTeam.abbr} size={30} />
        </div>
        <div className="flex-1 flex items-stretch gap-1 min-w-0">
          {c.momentum.slice(0, 3).map((b, i) => slot(b, i))}
          <div className="flex flex-col justify-center px-0.5"><span className="text-[12px] font-bold rounded px-1.5 py-1" style={{ background: "#f3f4f7", color: INK2 }}>H</span></div>
          {c.momentum.slice(3).map((b, i) => slot(b, i + 3))}
        </div>
      </div>
    </Card>
  );
}

/* ── Best player ──────────────────────────────────────────────────────────── */

function BestPlayerCard({ c }: { c: SoccerMatchCenter }) {
  const b = c.best;
  const [bad, setBad] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  // An image can fail (404) before React hydrates and attaches onError — re-check once mounted.
  useEffect(() => { setBad(!!imgRef.current?.complete && imgRef.current.naturalWidth === 0); }, [b?.id]);
  if (!b) return null;
  const team = b.side === "home" ? c.match.homeTeam : c.match.awayTeam;
  const col = ink(team.hex);
  const tiles = [
    b.goals > 0 || b.assists === 0 ? { n: b.goals, l: b.goals === 1 ? "Goal" : "Goals" } : null,
    { n: b.assists, l: b.assists === 1 ? "Assist" : "Assists" },
    b.sot > 0 ? { n: b.sot, l: "On target" } : b.saves > 0 ? { n: b.saves, l: "Saves" } : { n: b.shots, l: "Shots" },
  ].filter(Boolean) as { n: number; l: string }[];
  return (
    <Card className="relative overflow-hidden p-5 sm:p-6 min-h-[270px]">
      <span className="absolute right-3 top-2 font-black leading-none select-none" style={{ fontSize: 190, color: "#f1f2f5" }}>{b.jersey}</span>
      <div className="relative">
        <p className="text-[17px]" style={{ color: INK3 }}>{b.name} /{b.jersey}</p>
        <p className="mt-1 text-[32px] sm:text-[36px] font-semibold leading-[1.1] tracking-tight" style={{ color: INK }}>
          The best player<br />of the <span style={{ color: "#ef3b4a" }}>match</span>
        </p>
        <div className="mt-6 flex gap-3">
          {tiles.slice(0, 3).map((t, i) => (
            <motion.div key={t.l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }} className="rounded-2xl px-5 py-3 text-center min-w-[84px]" style={{ background: "#f3f4f7" }}>
              <p className="text-[32px] font-medium leading-none" style={{ color: INK }}>{t.n}</p>
              <p className="mt-1 text-[14px]" style={{ color: INK2 }}>{t.l}</p>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="absolute right-0 bottom-0 w-[46%] max-w-[260px] h-[88%] pointer-events-none flex items-end justify-center">
        {!bad ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img ref={imgRef} src={soccerHeadshotUrl(b.id)} alt={b.name} onError={() => setBad(true)} className="max-h-full max-w-full object-contain object-bottom" style={{ filter: "drop-shadow(0 10px 18px rgba(0,0,0,.18))" }} />
        ) : (
          <div className="mb-4 mr-4 w-28 h-28 rounded-full flex items-center justify-center text-4xl font-black" style={{ background: `${col}1a`, color: col }}>{b.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</div>
        )}
      </div>
    </Card>
  );
}

/* ── Pre-match preview (replaces Momentum / Best player before kickoff) ───── */

function ProbTriple({ c, compact }: { c: SoccerMatchCenter; compact?: boolean }) {
  const [hc, ac] = pickPair(c.match.homeTeam.hex, c.match.awayTeam.hex);
  const m = c.model;
  return (
    <div>
      <div className="flex items-center justify-between text-[13px] font-semibold mb-1.5" style={{ color: INK }}>
        <span>{c.match.homeTeam.shortName} <span style={{ color: hc }}>{m.home}%</span></span>
        <span style={{ color: INK3 }}>Draw {m.draw}%</span>
        <span><span style={{ color: ac }}>{m.away}%</span> {c.match.awayTeam.shortName}</span>
      </div>
      <div className="flex overflow-hidden rounded-full" style={{ height: compact ? 8 : 12, background: "#eef0f4" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${m.home}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} style={{ background: hc }} />
        <motion.div initial={{ width: 0 }} animate={{ width: `${m.draw}%` }} transition={{ duration: 0.8, delay: 0.05 }} style={{ background: "#c9ccd3" }} />
        <div style={{ flex: 1, background: ac }} />
      </div>
    </div>
  );
}

function PreviewCard({ c }: { c: SoccerMatchCenter }) {
  const m = c.model;
  return (
    <Card className="p-5 sm:p-6">
      <CardTitle right={<span className="text-[12px] font-bold rounded-full px-2.5 py-1" style={{ background: "#e8f0ff", color: BLUE }}>Model grade {m.grade}</span>}>Match Preview</CardTitle>
      <div className="mt-4"><ProbTriple c={c} /></div>
      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        {[{ l: "Expected goals", v: `${m.xgHome} – ${m.xgAway}` }, { l: "Over 2.5", v: `${m.over25}%` }, { l: "Both score", v: `${m.btts}%` }].map((s) => (
          <div key={s.l} className="rounded-2xl py-3" style={{ background: "#f3f4f7" }}>
            <p className="text-[20px] font-semibold" style={{ color: INK }}>{s.v}</p>
            <p className="text-[11px]" style={{ color: INK2 }}>{s.l}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: INK3 }}>Most likely scores</p>
      <div className="mt-2 flex gap-2 flex-wrap">
        {m.scorelines.map((s, i) => (
          <span key={s.score} className="rounded-full px-3.5 py-1.5 text-[14px] font-semibold" style={i === 0 ? { background: BLUE, color: "#fff" } : { background: "#f3f4f7", color: INK }}>{s.score} <span className="opacity-70 text-[11px]">{s.p}%</span></span>
        ))}
      </div>
    </Card>
  );
}

function FormTable({ c }: { c: SoccerMatchCenter }) {
  const chip = (r: string) => {
    const col = r === "W" ? GREEN : r === "L" ? "#ef3b4a" : "#9aa1ad";
    return <span key={Math.random()} className="w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center text-white" style={{ background: col }}>{r}</span>;
  };
  return (
    <Card className="p-5 sm:p-6">
      <CardTitle>Form & Table</CardTitle>
      <div className="mt-4 grid gap-3">
        {([["home", c.match.homeTeam], ["away", c.match.awayTeam]] as const).map(([k, t]) => (
          <div key={k} className="flex items-center gap-3">
            <Crest src={t.logo} name={t.abbr} size={28} />
            <span className="flex-1 text-[14px] font-medium truncate" style={{ color: INK }}>{t.shortName}</span>
            <div className="flex gap-1">{(c.form[k].length ? c.form[k] : ["–"]).map((r, i) => <span key={i}>{chip(r)}</span>)}</div>
          </div>
        ))}
      </div>
      {c.table.length > 0 && (
        <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--m-line)" }}>
          {c.table.map((r) => (
            <div key={r.id} className="flex items-center gap-2 py-1.5 text-[13px] rounded-lg px-1.5" style={r.isMatch ? { background: "#e8f0ff" } : undefined}>
              <span className="w-5 text-center font-semibold" style={{ color: INK3 }}>{r.rank}</span>
              <Crest src={r.logo} name={r.abbr} size={20} />
              <span className="flex-1 truncate font-medium" style={{ color: INK }}>{r.name}</span>
              <span className="w-8 text-right" style={{ color: INK3 }}>{r.gp}</span>
              <span className="w-8 text-right" style={{ color: INK3 }}>{r.gd > 0 ? "+" : ""}{r.gd}</span>
              <span className="w-8 text-right font-bold" style={{ color: INK }}>{r.pts}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ── Right column ─────────────────────────────────────────────────────────── */

function MatchCard({ c, onInsight }: { c: SoccerMatchCenter; onInsight: () => void }) {
  const m = c.match;
  const goals = c.events.filter((e) => e.type === "goal");
  const scorers = (side: "home" | "away") => goals.filter((g) => g.side === side);
  const label = m.status === "pre" ? timeOf(m.date) : m.status === "live" ? `${m.clock ?? ""}` : "Full-time";
  return (
    <Card className="p-5 sm:p-6">
      <CardTitle right={<span className="text-[12px] font-semibold rounded-full px-2.5 py-1" style={{ background: "#f3f4f7", color: INK2 }}>{c.league.season ?? "2026 - 2027"}</span>}>Matches</CardTitle>
      <p className="mt-4 text-[17px]" style={{ color: INK3 }}>{c.league.name}</p>
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center gap-2 justify-self-start"><Crest src={m.homeTeam.logo} name={m.homeTeam.abbr} size={54} /></div>
        <div className="flex items-center gap-3 sm:gap-4 justify-self-center">
          <span className="text-[46px] sm:text-[54px] font-medium leading-none" style={{ color: INK }}>{m.status === "pre" ? "–" : m.homeScore}</span>
          <span className="text-[15px] sm:text-[18px] font-medium text-center" style={{ color: INK3 }}>{label}</span>
          <span className="text-[46px] sm:text-[54px] font-medium leading-none" style={{ color: INK }}>{m.status === "pre" ? "–" : m.awayScore}</span>
        </div>
        <div className="flex items-center gap-2 justify-self-end"><Crest src={m.awayTeam.logo} name={m.awayTeam.abbr} size={54} /></div>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-start gap-2">
        <p className="text-[18px] sm:text-[20px] font-medium" style={{ color: INK }}>{m.homeTeam.shortName}</p>
        <span />
        <p className="text-[18px] sm:text-[20px] font-medium text-right" style={{ color: INK }}>{m.awayTeam.shortName}</p>
      </div>
      {m.status !== "pre" && (
        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] gap-2 items-start text-[14px] sm:text-[15px]" style={{ color: INK3 }}>
          <div className="flex flex-col gap-1">{scorers("home").map((g, i) => <span key={i}>{g.player.split(" ").slice(-1)[0]} {g.minute}</span>)}</div>
          <span className="pt-0.5"><Ball size={22} /></span>
          <div className="flex flex-col gap-1 text-right">{scorers("away").map((g, i) => <span key={i}>{g.player.split(" ").slice(-1)[0]} {g.minute}</span>)}</div>
        </div>
      )}
      {m.status === "pre" && <p className="mt-4 text-[14px]" style={{ color: INK3 }}>{dayLong(m.date)}{m.venue ? ` · ${m.venue}` : ""}</p>}

      <div className="mt-6 pt-5 flex items-center justify-between gap-3 flex-wrap" style={{ borderTop: "1px solid var(--m-line)" }}>
        <div>
          <p className="text-[18px] font-medium" style={{ color: INK }}>Get AI Match Insights</p>
          <p className="text-[14px]" style={{ color: INK3 }}>Analyse game predict outcome</p>
        </div>
        <button onClick={onInsight} className="press inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-[15px] font-medium text-white" style={{ background: BLUE, boxShadow: "0 8px 22px rgba(26,115,255,.35)" }}>
          AI Insight <Sparkles size={18} />
        </button>
      </div>
    </Card>
  );
}

function StatBar({ label, home, away, hp, ap, hc, ac, delay = 0, big }: { label: string; home: string; away: string; hp: number; ap: number; hc: string; ac: string; delay?: number; big?: boolean }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className={big ? "text-[26px]" : "text-[22px]"} style={{ color: INK }}>{home}</span>
        <span className="text-[14px] font-medium" style={{ color: INK }}>{label}</span>
        <span className={big ? "text-[26px]" : "text-[22px]"} style={{ color: INK }}>{away}</span>
      </div>
      {big ? (
        <div className="mt-2 flex overflow-hidden rounded-full" style={{ height: 22, background: "#eef0f4" }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${hp}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} style={{ background: hc }} />
          <div style={{ flex: 1, background: ac }} />
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-4">
          <div className="flex-1 h-[7px] rounded-full overflow-hidden" style={{ background: "#eef0f4" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${hp}%` }} transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }} className="h-full rounded-full" style={{ background: hc }} />
          </div>
          <div className="flex-1 h-[7px] rounded-full overflow-hidden" style={{ background: "#eef0f4" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${ap}%` }} transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }} className="h-full rounded-full" style={{ background: ac }} />
          </div>
        </div>
      )}
    </div>
  );
}

function Overview({ c }: { c: SoccerMatchCenter }) {
  const [hc, ac] = pickPair(c.match.homeTeam.hex, c.match.awayTeam.hex);
  const poss = c.stats.find((s) => s.label === "Possession");
  const xgTot = c.xg.home + c.xg.away || 1;
  const attack = c.stats.filter((s) => ["On target", "Shots", "Corners"].includes(s.label));
  const other = c.stats.filter((s) => ["Pass accuracy", "Fouls", "Saves", "Tackles won"].includes(s.label));
  const hasStats = c.stats.length > 0;
  return (
    <>
      <Card className="p-5 sm:p-6">
        <CardTitle>Matches Overview</CardTitle>
        <div className="mt-5 flex flex-col gap-6">
          {poss ? <StatBar label="Ball Possession" home={poss.home} away={poss.away} hp={poss.homePct} ap={poss.awayPct} hc={hc} ac={ac} big /> : (
            <p className="text-[13px]" style={{ color: INK3 }}>Live stats appear at kickoff.</p>
          )}
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-[24px]" style={{ color: INK }}>{c.xg.home.toFixed(2)}</span>
              <span className="text-[14px] font-medium" style={{ color: BLUE }}>Expected Goals - xG <span className="text-[10px] font-normal" style={{ color: INK3 }}>{c.xg.basis === "model" ? "(model)" : "(shot-based est.)"}</span></span>
              <span className="text-[24px]" style={{ color: INK }}>{c.xg.away.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex-1 h-[7px] rounded-full overflow-hidden" style={{ background: "#eef0f4" }}><motion.div initial={{ width: 0 }} animate={{ width: `${(c.xg.home / xgTot) * 100}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: YELLOW }} /></div>
              <div className="flex-1 h-[7px] rounded-full overflow-hidden" style={{ background: "#eef0f4" }}><motion.div initial={{ width: 0 }} animate={{ width: `${(c.xg.away / xgTot) * 100}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: GREEN }} /></div>
            </div>
          </div>
        </div>
      </Card>
      {hasStats && (
        <Card className="p-5 sm:p-6">
          <CardTitle>Attack Level</CardTitle>
          <div className="mt-5 flex flex-col gap-5">
            {attack.map((s, i) => <StatBar key={s.label} label={s.label} home={s.home} away={s.away} hp={s.homePct} ap={s.awayPct} hc={YELLOW} ac={GREEN} delay={i * 0.08} />)}
            {other.map((s, i) => <StatBar key={s.label} label={s.label} home={s.home} away={s.away} hp={s.homePct} ap={s.awayPct} hc={YELLOW} ac={GREEN} delay={0.3 + i * 0.08} />)}
          </div>
        </Card>
      )}
    </>
  );
}

/* ── AI insight sheet ─────────────────────────────────────────────────────── */

function InsightSheet({ c, onClose }: { c: SoccerMatchCenter; onClose: () => void }) {
  const m = c.model;
  const o = c.odds;
  const fmtML = (v?: number) => (v == null ? "—" : v > 0 ? `+${v}` : String(v));
  const finalNote = c.match.status === "final"
    ? `Result: ${c.match.homeTeam.shortName} ${c.match.homeScore}–${c.match.awayScore} ${c.match.awayTeam.shortName}. The model's pre-match read was ${m.home}% / ${m.draw}% / ${m.away}%.`
    : null;
  return (
    <motion.div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="relative w-full sm:max-w-[560px] max-h-[88vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] p-6" style={{ background: "#fff", color: INK, paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold rounded-full px-2.5 py-1" style={{ background: "#e8f0ff", color: BLUE }}><Sparkles size={13} /> AI Match Insight</span>
            <p className="mt-2 text-[22px] font-semibold leading-tight">{c.match.homeTeam.shortName} vs {c.match.awayTeam.shortName}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="press w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#f3f4f7" }}><X size={18} /></button>
        </div>

        <div className="mt-5 rounded-2xl p-4" style={{ background: "#f6f8ff", border: "1px solid #dbe6ff" }}>
          <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: BLUE }}>Model pick · grade {m.grade}</p>
          <p className="mt-1 text-[24px] font-semibold">{m.pick}</p>
          <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: INK2 }}>{m.reason}</p>
        </div>

        <p className="mt-5 mb-2 text-[12px] font-bold uppercase tracking-wider" style={{ color: INK3 }}>Win probability</p>
        <ProbTriple c={c} />

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          {[{ l: "Expected goals", v: `${m.xgHome} – ${m.xgAway}` }, { l: "Over 2.5 goals", v: `${m.over25}%` }, { l: "Both teams score", v: `${m.btts}%` }].map((s) => (
            <div key={s.l} className="rounded-2xl py-3" style={{ background: "#f3f4f7" }}><p className="text-[20px] font-semibold">{s.v}</p><p className="text-[11px]" style={{ color: INK2 }}>{s.l}</p></div>
          ))}
        </div>

        <p className="mt-5 mb-2 text-[12px] font-bold uppercase tracking-wider" style={{ color: INK3 }}>Most likely scorelines</p>
        <div className="flex gap-2 flex-wrap">{m.scorelines.map((s, i) => <span key={s.score} className="rounded-full px-3.5 py-1.5 text-[14px] font-semibold" style={i === 0 ? { background: BLUE, color: "#fff" } : { background: "#f3f4f7" }}>{s.score} <span className="opacity-70 text-[11px]">{s.p}%</span></span>)}</div>

        {o && (
          <>
            <p className="mt-5 mb-2 text-[12px] font-bold uppercase tracking-wider" style={{ color: INK3 }}>Market · {o.provider ?? "DraftKings"}</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[{ l: c.match.homeTeam.abbr, v: fmtML(o.homeML) }, { l: "Draw", v: fmtML(o.drawML) }, { l: c.match.awayTeam.abbr, v: fmtML(o.awayML) }].map((s) => (
                <div key={s.l} className="rounded-2xl py-2.5" style={{ background: "#f3f4f7" }}><p className="text-[17px] font-semibold">{s.v}</p><p className="text-[11px]" style={{ color: INK2 }}>{s.l}</p></div>
              ))}
            </div>
            {m.value && m.value.modelPct - m.value.marketPct >= 4 && (
              <p className="mt-3 text-[13px] rounded-xl px-3.5 py-2.5" style={{ background: "#eafaf0", color: "#0f7a2c" }}>
                Value spot: model {m.value.modelPct}% vs market {m.value.marketPct}% on {m.value.side === "draw" ? "the draw" : m.value.side === "home" ? c.match.homeTeam.shortName : c.match.awayTeam.shortName}.
              </p>
            )}
          </>
        )}
        {finalNote && <p className="mt-4 text-[13px]" style={{ color: INK2 }}>{finalNote}</p>}
        <p className="mt-5 text-[11px] leading-relaxed" style={{ color: INK3 }}>Model: Poisson goals from league-table scoring and conceding rates (shrunk for small samples) with home advantage. Estimates for entertainment only.</p>
      </motion.div>
    </motion.div>
  );
}

/* ── Match list ───────────────────────────────────────────────────────────── */

function MatchRow({ m, active, onPick }: { m: SoccerMatch; active: boolean; onPick: () => void }) {
  const [hc, ac] = pickPair(m.homeTeam.hex, m.awayTeam.hex);
  const live = m.status === "live";
  return (
    <button onClick={onPick} className="press w-full text-left grid grid-cols-[52px_1fr_auto_1fr] items-center gap-2.5 rounded-2xl px-3 py-2.5" style={{ background: active ? "#eef4ff" : "#fff", boxShadow: active ? `inset 0 0 0 1.5px ${BLUE}` : "inset 0 0 0 1px #eceef2" }}>
      <span className="text-[11px] font-bold" style={{ color: live ? "#ef3b4a" : INK3 }}>{live ? `${m.clock ?? "LIVE"}` : m.status === "final" ? "FT" : timeOf(m.date)}</span>
      <span className="flex items-center gap-2 min-w-0 justify-end"><span className="text-[13px] font-semibold truncate text-right" style={{ color: INK }}>{m.homeTeam.shortName}</span><Crest src={m.homeTeam.logo} name={m.homeTeam.abbr} size={24} /></span>
      <span className="text-[15px] font-bold tabular-nums px-1" style={{ color: INK, minWidth: 44, textAlign: "center" }}>{m.status === "pre" ? "v" : `${m.homeScore}–${m.awayScore}`}</span>
      <span className="flex items-center gap-2 min-w-0"><Crest src={m.awayTeam.logo} name={m.awayTeam.abbr} size={24} /><span className="text-[13px] font-semibold truncate" style={{ color: INK }}>{m.awayTeam.shortName}</span></span>
      {m.model && m.status === "pre" && (
        <span className="col-span-4 -mt-0.5 flex h-[4px] rounded-full overflow-hidden" style={{ background: "#eef0f4" }}>
          <span style={{ width: `${m.model.home}%`, background: hc }} /><span style={{ width: `${m.model.draw}%`, background: "#d3d6dd" }} /><span style={{ flex: 1, background: ac }} />
        </span>
      )}
    </button>
  );
}

/* ───────────────────────── main ───────────────────────── */

type Tab = "overview" | "live" | "all";

export function SoccerCenter({
  todayKey, initialMatches, initialCenter, tables,
}: { todayKey: string; initialMatches: SoccerMatch[]; initialCenter: SoccerMatchCenter | null; tables: Record<string, TableRow[]> }) {
  const [league, setLeague] = useState<SoccerLeagueKey | "all">("all");
  const [day, setDay] = useState(todayKey);
  const [matches, setMatches] = useState<SoccerMatch[]>(initialMatches);
  const [loadingDay, setLoadingDay] = useState(false);
  const [sel, setSel] = useState<{ league: SoccerLeagueKey; id: string } | null>(initialCenter ? { league: initialCenter.match.league, id: initialCenter.match.id } : null);
  const [center, setCenter] = useState<SoccerMatchCenter | null>(initialCenter);
  const [loadingCenter, setLoadingCenter] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [insight, setInsight] = useState(false);

  const dayCache = useRef<Map<string, SoccerMatch[]>>(new Map([[todayKey, initialMatches]]));
  const centerCache = useRef<Map<string, SoccerMatchCenter>>(new Map(initialCenter ? [[`${initialCenter.match.league}:${initialCenter.match.id}`, initialCenter]] : []));

  const days = useMemo(() => {
    const base = new Date(`${todayKey.slice(0, 4)}-${todayKey.slice(4, 6)}-${todayKey.slice(6, 8)}T12:00:00`);
    return Array.from({ length: 8 }, (_, i) => {
      const d = new Date(base); d.setDate(base.getDate() + i - 3);
      return { key: ymd(d), dow: d.toLocaleDateString("en-US", { weekday: "short" }), num: d.getDate() };
    });
  }, [todayKey]);

  useEffect(() => {
    const hit = dayCache.current.get(day);
    if (hit) { setMatches(hit); return; }
    let alive = true;
    setLoadingDay(true);
    fetch(`/api/soccer/fixtures?date=${day}`).then((r) => r.json()).then((d: SoccerMatch[]) => { if (alive) { dayCache.current.set(day, d); setMatches(d); } }).catch(() => alive && setMatches([])).finally(() => alive && setLoadingDay(false));
    return () => { alive = false; };
  }, [day]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return matches.filter((m) =>
      (league === "all" || m.league === league) &&
      (tab !== "live" || m.status === "live") &&
      (!needle || m.homeTeam.name.toLowerCase().includes(needle) || m.awayTeam.name.toLowerCase().includes(needle)));
  }, [matches, league, tab, q]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: matches.length };
    matches.forEach((m) => (c[m.league] = (c[m.league] ?? 0) + 1));
    return c;
  }, [matches]);
  const liveCount = matches.filter((m) => m.status === "live").length;

  const loadCenter = useCallback((lg: SoccerLeagueKey, id: string) => {
    setSel({ league: lg, id });
    const key = `${lg}:${id}`;
    const hit = centerCache.current.get(key);
    if (hit) { setCenter(hit); return; }
    setLoadingCenter(true);
    fetch(`/api/soccer/match?league=${lg}&id=${id}`).then((r) => (r.ok ? r.json() : null)).then((d: SoccerMatchCenter | null) => {
      if (d) { centerCache.current.set(key, d); setCenter((cur) => (cur === null || `${d.match.league}:${d.match.id}` === key ? d : cur)); }
    }).catch(() => {}).finally(() => setLoadingCenter(false));
  }, []);

  // keep selection valid when the visible list changes
  useEffect(() => {
    if (visible.length === 0) return;
    if (!sel || !visible.some((m) => m.id === sel.id)) loadCenter(visible[0].league, visible[0].id);
  }, [visible, sel, loadCenter]);

  // live refresh of the selected match
  useEffect(() => {
    if (center?.match.status !== "live" || !sel) return;
    const iv = setInterval(() => {
      fetch(`/api/soccer/match?league=${sel.league}&id=${sel.id}`).then((r) => r.json()).then((d: SoccerMatchCenter) => { if (d?.match) { centerCache.current.set(`${sel.league}:${sel.id}`, d); setCenter(d); } }).catch(() => {});
    }, 30_000);
    return () => clearInterval(iv);
  }, [center?.match.status, sel]);

  const nextUp = useMemo(() => visible.find((m) => m.status === "pre" && m.id !== sel?.id), [visible, sel]);
  const pre = center?.match.status === "pre";

  const TABS: { key: Tab; label: string; dot?: boolean }[] = [
    { key: "overview", label: "Overview" }, { key: "live", label: "Live", dot: liveCount > 0 }, { key: "all", label: "All Matches" },
  ];

  return (
    <div className="matchly min-h-screen overflow-x-clip">
      <div className="max-w-[1480px] mx-auto page-pad py-3 sm:py-5">
        <div className="rounded-[28px] sm:rounded-[34px] p-3.5 sm:p-6" style={{ background: "var(--m-shell)", boxShadow: "0 1px 0 #fff inset, 0 24px 60px rgba(20,22,27,.08)" }}>
          {/* Top bar */}
          <div className="flex items-center gap-3 sm:gap-5 flex-wrap mb-4 sm:mb-6">
            <div className="flex items-center gap-2.5 mr-1">
              <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: INK }}><Ball size={22} /></span>
              <span className="text-[20px] font-medium tracking-tight" style={{ color: INK }}>Edge Soccer</span>
            </div>
            <div className="snap-row order-3 sm:order-none w-full sm:w-auto sm:flex-1">
              {TABS.map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)} className="press m-pill px-5 py-3 text-[15px] font-medium inline-flex items-center gap-1.5"
                  style={{ color: tab === t.key ? (t.key === "live" ? "#ef3b4a" : BLUE) : INK, boxShadow: tab === t.key ? `inset 0 0 0 1.5px ${t.key === "live" ? "#ef3b4a55" : "#1a73ff55"}, var(--m-shadow)` : "var(--m-shadow)" }}>
                  {t.label}{t.dot && <span className="spot-live-dot w-1.5 h-1.5 rounded-full" style={{ background: "#ef3b4a" }} />}
                </button>
              ))}
              <Link href="/soccer/props" className="press m-pill px-5 py-3 text-[15px] font-medium" style={{ color: INK }}>Props</Link>
              <Link href="/soccer/leagues" className="press m-pill px-5 py-3 text-[15px] font-medium" style={{ color: INK }}>Leagues</Link>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <AnimatePresence>
                {searchOpen && (
                  <motion.input initial={{ width: 0, opacity: 0 }} animate={{ width: 170, opacity: 1 }} exit={{ width: 0, opacity: 0 }} autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search team"
                    className="m-pill h-11 px-4 text-[14px] outline-none" style={{ color: INK }} />
                )}
              </AnimatePresence>
              <button onClick={() => { setSearchOpen((v) => !v); if (searchOpen) setQ(""); }} aria-label="Search" className="press m-pill w-11 h-11 flex items-center justify-center" style={{ color: INK }}><Search size={19} /></button>
            </div>
          </div>

          {/* Phone league chips */}
          <div className="lg:hidden mb-4"><LeagueChips league={league} setLeague={setLeague} counts={counts} /></div>

          {/* Grid: 1 col phone · 2 col open-fold · 3 col desktop */}
          <div className="grid gap-4 grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[290px_minmax(0,1fr)_380px] items-start">
            {/* LEFT */}
            <div className="contents lg:flex lg:flex-col lg:gap-4">
              <div className="hidden lg:contents"><LeagueList league={league} setLeague={setLeague} tables={tables} counts={counts} /></div>
              {center && <div className="order-[8] md:order-none"><LineupCard c={center} key={center.match.id} /></div>}
              <div className="order-[9] md:order-none"><NextFixture m={nextUp} onPick={(m) => loadCenter(m.league, m.id)} /></div>
            </div>

            {/* CENTER */}
            <div className="contents lg:flex lg:flex-col lg:gap-4 lg:col-start-2 lg:row-start-1">
              {center ? (
                <>
                  <div className="order-[1] md:order-none lg:order-1"><motion.div key={center.match.id} initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}><Hero c={center} /></motion.div></div>
                  <div className="order-[3] md:order-none lg:order-4">
                    <Card className="p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <p className="text-[17px] font-semibold" style={{ color: INK }}>{tab === "live" ? "Live now" : "Matches"}</p>
                        <span className="text-[12px] font-medium" style={{ color: INK3 }}>{visible.length} {visible.length === 1 ? "game" : "games"}</span>
                      </div>
                      <div className="snap-row mb-3 -mx-1 px-1">
                        {days.map((d) => (
                          <button key={d.key} onClick={() => setDay(d.key)} className="press rounded-xl w-[50px] py-2 text-center" style={day === d.key ? { background: BLUE, color: "#fff" } : { background: "#f3f4f7", color: INK2 }}>
                            <span className="block text-[10px] font-semibold uppercase">{d.dow}</span><span className="block text-[16px] font-bold leading-tight">{d.num}</span>
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-0.5">
                        {loadingDay ? [0, 1, 2, 3].map((i) => <div key={i} className="h-[52px] rounded-2xl animate-pulse" style={{ background: "#eef0f4" }} />) :
                          visible.length === 0 ? <p className="text-sm text-center py-8" style={{ color: INK3 }}>No matches for this filter.</p> :
                            visible.map((m) => <MatchRow key={`${m.league}-${m.id}`} m={m} active={sel?.id === m.id} onPick={() => loadCenter(m.league, m.id)} />)}
                      </div>
                    </Card>
                  </div>
                  <div className="order-[4] md:order-none lg:order-2">{pre ? <PreviewCard c={center} /> : <Momentum c={center} />}</div>
                  <div className="order-[5] md:order-none lg:order-3">{pre ? <FormTable c={center} /> : <BestPlayerCard c={center} />}</div>
                </>
              ) : (
                <Card className="p-10 text-center"><p style={{ color: INK3 }}>{loadingCenter ? "Loading match…" : "No matches to show for this day — pick another date."}</p></Card>
              )}
            </div>

            {/* RIGHT */}
            <div className="contents lg:flex lg:flex-col lg:gap-4 lg:col-start-3 lg:row-start-1">
              {center && (
                <>
                  <div className="order-[2] md:order-none relative">
                    {loadingCenter && <div className="absolute inset-0 z-10 rounded-[22px] flex items-center justify-center" style={{ background: "rgba(255,255,255,.6)" }}><span className="text-sm font-medium" style={{ color: INK2 }}>Loading…</span></div>}
                    <MatchCard c={center} onInsight={() => setInsight(true)} />
                  </div>
                  <div className="order-[6] md:order-none flex flex-col gap-4"><Overview c={center} /></div>
                </>
              )}
            </div>
          </div>

          <p className="mt-6 text-[11px] text-center" style={{ color: INK3 }}>
            Data via ESPN · Odds from DraftKings · Model estimates are for entertainment only.
          </p>
        </div>
      </div>

      <AnimatePresence>{insight && center && <InsightSheet c={center} onClose={() => setInsight(false)} />}</AnimatePresence>
    </div>
  );
}
