"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { LogoPlate } from "@/components/web-tool/spotlight";
import { useCountUp } from "@/components/web-tool/sport-ui";
import type { NflGameDetail } from "@/lib/nfl/types";
import type { NbaGameDetail } from "@/lib/nba/types";
import type { SoccerMatchCenter } from "@/lib/soccer/match-center";

/* Live game analysis — light theme, fully self-contained colours so it renders the same in every page scope. */

const INK = "#14161b", INK2 = "#4b515c", INK3 = "#8a909b", BLUE = "#1a73ff", RED = "#ef3b4a", GREEN = "#12a150", LINE = "#eceef2";
const SHADOW = "0 1px 2px rgba(20,22,27,.04), 0 8px 24px rgba(20,22,27,.05)";

function rgbOf(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  return [parseInt(c.slice(0, 2), 16) || 0, parseInt(c.slice(2, 4), 16) || 0, parseInt(c.slice(4, 6), 16) || 0];
}
/** Two team colours that stay distinguishable on the same chart (e.g. two red teams). */
function distinct(a: string, b: string): [string, string] {
  const [r1, g1, b1] = rgbOf(a), [r2, g2, b2] = rgbOf(b);
  const dist = Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
  if (dist >= 120) return [a, b];
  const blueish = b2 > r2 && b2 > g2;
  return [a, blueish ? "#ea6a0a" : BLUE];
}

function LCard({ children, className = "", style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={`rounded-[22px] bg-white ${className}`} style={{ boxShadow: SHADOW, ...style }}>{children}</div>;
}
function LTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <p className="text-[15px] font-semibold tracking-tight" style={{ color: INK }}>{children}</p>
      {right}
    </div>
  );
}
function Pill({ children, color = INK2, bg = "#f3f4f7" }: { children: ReactNode; color?: string; bg?: string }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap" style={{ color, background: bg }}>{children}</span>;
}
function LivePulse({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-extrabold text-white" style={{ background: RED, boxShadow: "0 4px 14px rgba(239,59,74,.35)" }}>
      <span className="spot-live-dot inline-block rounded-full bg-white" style={{ width: 6, height: 6 }} />{label}
    </span>
  );
}
function ScoreNum({ value, color = INK }: { value: number; color?: string }) {
  const shown = useCountUp(value, 700);
  return <span className="font-spot-mono font-black tabular-nums" style={{ color }}>{shown}</span>;
}

/* ───────────────────────── Live strip (all live games, like a scoreboard ticker) ───────────────────────── */

export interface StripItem {
  id: string;
  href: string;
  status: "live" | "final" | "pre";
  label: string;
  away: { abbr: string; score?: number; logo: string; hex: string };
  home: { abbr: string; score?: number; logo: string; hex: string };
}

export function LiveStrip({ items, activeId, title = "Live now" }: { items: StripItem[]; activeId?: string; title?: string }) {
  const live = items.filter((i) => i.status === "live");
  if (live.length === 0) return null;
  return (
    <div className="mb-4">
      <p className="spot-label mb-2 flex items-center gap-2" style={{ color: RED }}>
        <span className="spot-live-dot inline-block rounded-full" style={{ width: 6, height: 6, background: RED }} />{title} · {live.length}
      </p>
      <div className="snap-row -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        {live.map((g) => (
          <Link key={g.id} href={g.href} className="press w-[148px] rounded-2xl bg-white px-3 py-2.5 flex flex-col gap-1.5"
            style={{ boxShadow: g.id === activeId ? `inset 0 0 0 1.5px ${BLUE}, ${SHADOW}` : SHADOW }}>
            <span className="text-[10.5px] font-extrabold flex items-center gap-1.5" style={{ color: RED }}>
              <span className="spot-live-dot inline-block rounded-full" style={{ width: 5, height: 5, background: RED }} />{g.label}
            </span>
            {([g.away, g.home] as const).map((t) => (
              <span key={t.abbr} className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.logo} alt="" width={20} height={20} className="w-5 h-5 object-contain" />
                <span className="flex-1 text-[13px] font-bold" style={{ color: INK }}>{t.abbr}</span>
                <span className="font-spot-mono font-extrabold text-[14px]" style={{ color: INK }}>{t.score ?? "–"}</span>
              </span>
            ))}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── Shared: win-probability / momentum chart ───────────────────────── */

function ProbChart({ series, awayHex, homeHex, away, home, height = 150 }: { series: number[]; awayHex: string; homeHex: string; away: string; home: string; height?: number }) {
  if (series.length < 3) return <p className="text-[12px] py-6 text-center" style={{ color: INK3 }}>Win probability builds as the game goes on.</p>;
  const pts = series.filter((_, i) => i % Math.max(1, Math.ceil(series.length / 140)) === 0);
  if (pts[pts.length - 1] !== series[series.length - 1]) pts.push(series[series.length - 1]);
  const W = 400, H = 120;
  const path = (f: (v: number) => number) => pts.map((v, i) => `${i === 0 ? "M" : "L"}${((i / (pts.length - 1)) * W).toFixed(1)},${(H - (f(v) / 100) * H).toFixed(1)}`).join(" ");
  const homeNow = series[series.length - 1], awayNow = 100 - homeNow;
  const lead = homeNow >= 50 ? home : away;
  return (
    <div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }} aria-label="Live win probability">
          <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="#d9dce3" strokeDasharray="3 4" />
          {[25, 75].map((y) => <line key={y} x1="0" y1={(y / 100) * H} x2={W} y2={(y / 100) * H} stroke="#eef0f4" />)}
          <motion.path d={path((v) => v)} fill="none" stroke={homeHex} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: "easeOut" }} vectorEffect="non-scaling-stroke" />
          <motion.path d={path((v) => 100 - v)} fill="none" stroke={awayHex} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: "easeOut", delay: 0.1 }} vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {[{ k: away, v: awayNow, c: awayHex }, { k: home, v: homeNow, c: homeHex }].map((t) => (
          <div key={t.k} className="rounded-2xl px-3.5 py-2.5 flex items-center gap-3" style={{ background: "#f6f7f9", boxShadow: t.k === lead ? `inset 0 0 0 1.5px ${t.c}55` : "none" }}>
            <span className="w-2.5 h-9 rounded-full" style={{ background: t.c }} />
            <div>
              <p className="font-spot-mono font-black text-[24px] leading-none" style={{ color: INK }}>{t.v}%</p>
              <p className="text-[11px] font-bold mt-0.5" style={{ color: INK3 }}>{t.k} win probability</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuarterTable({ away, home, awayAbbr, homeAbbr, awayScore, homeScore, labels }: { away: string[]; home: string[]; awayAbbr: string; homeAbbr: string; awayScore?: number; homeScore?: number; labels?: string[] }) {
  const n = Math.max(away.length, home.length, 4);
  const cols = labels ?? Array.from({ length: n }, (_, i) => (i < 4 ? `${i + 1}` : `OT${i - 3 > 1 ? i - 3 : ""}`));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-center">
        <thead>
          <tr className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: INK3 }}>
            <th className="text-left py-1.5 pr-2 w-16" />
            {cols.slice(0, n).map((c) => <th key={c} className="px-2">{c}</th>)}
            <th className="px-2" style={{ color: INK }}>T</th>
          </tr>
        </thead>
        <tbody>
          {[{ a: awayAbbr, q: away, t: awayScore }, { a: homeAbbr, q: home, t: homeScore }].map((r) => (
            <tr key={r.a} style={{ borderTop: `1px solid ${LINE}` }}>
              <td className="text-left py-2 pr-2 text-[13px] font-extrabold" style={{ color: INK }}>{r.a}</td>
              {Array.from({ length: n }).map((_, i) => <td key={i} className="px-2 font-spot-mono text-[13px]" style={{ color: INK2 }}>{r.q[i] ?? "–"}</td>)}
              <td className="px-2 font-spot-mono text-[14px] font-black" style={{ color: INK }}>{r.t ?? "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ───────────────────────── NFL ───────────────────────── */

function FootballIcon({ size = 16, color = "#8b5a2b" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(-35 12 12)" fill={color} stroke="#5a3a1a" strokeWidth="1" />
      <path d="M8 14.5l8-5M10.5 11.4l1 1M12.6 10l1 1" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

const YD = 10;           // px per yard in the field viewBox
const EZ = 100;          // end zone width
const fx = (x: number) => EZ + x * YD;

function Field({ d, awayHex, homeHex, away, home }: { d: NflGameDetail; awayHex: string; homeHex: string; away: string; home: string }) {
  const live = d.live!;
  const attacksRight = live.possession === away;
  const bx = fx(live.ballX);
  const fdYards = live.distance && live.downText && !/goal/i.test(live.downText) ? live.distance : 0;
  const fdx = fdYards ? fx(Math.max(0, Math.min(100, attacksRight ? live.ballX + fdYards : live.ballX - fdYards))) : null;
  const sx = live.driveStartX != null ? fx(live.driveStartX) : null;
  const arcPeak = sx != null ? Math.max(70, 190 - Math.abs(bx - sx) * 0.22) : 190;
  const driveYds = live.drive?.yards ?? 0;
  const numbers = [10, 20, 30, 40, 50, 40, 30, 20, 10];
  return (
    <svg viewBox="0 0 1200 460" className="w-full h-auto rounded-2xl" role="img" aria-label="Field position tracker" style={{ display: "block" }}>
      <defs>
        <linearGradient id="turf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#38b653" /><stop offset="1" stopColor="#2a9e45" /></linearGradient>
        <marker id="arrowhead" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#fff" /></marker>
      </defs>
      <rect x="0" y="20" width="1200" height="420" rx="16" fill="url(#turf)" />
      {Array.from({ length: 10 }).map((_, i) => <rect key={i} x={EZ + i * 100} y="20" width="100" height="420" fill={i % 2 ? "rgba(0,0,0,.05)" : "transparent"} />)}
      {/* end zones */}
      <rect x="0" y="20" width={EZ} height="420" rx="16" fill={awayHex} />
      <rect x={1100} y="20" width={EZ} height="420" rx="16" fill={homeHex} />
      <rect x="40" y="20" width="60" height="420" fill={awayHex} />
      <rect x="1100" y="20" width="60" height="420" fill={homeHex} />
      <text transform="translate(60 230) rotate(-90)" textAnchor="middle" fontSize="38" fontWeight="900" fill="#fff" letterSpacing="6" opacity=".92">{away}</text>
      <text transform="translate(1140 230) rotate(90)" textAnchor="middle" fontSize="38" fontWeight="900" fill="#fff" letterSpacing="6" opacity=".92">{home}</text>
      {/* yard lines */}
      {Array.from({ length: 21 }).map((_, i) => (
        <line key={i} x1={EZ + i * 50} y1="20" x2={EZ + i * 50} y2="440" stroke="#fff" strokeOpacity={i % 2 === 0 ? 0.75 : 0.38} strokeWidth={i % 2 === 0 ? 3 : 2} />
      ))}
      {numbers.map((n, i) => (
        <g key={i} fill="#fff" opacity=".78" fontWeight="800" fontSize="30" textAnchor="middle">
          <text x={EZ + (i + 1) * 100} y="86">{n}</text>
          <text x={EZ + (i + 1) * 100} y="400">{n}</text>
        </g>
      ))}
      {/* hash marks */}
      {Array.from({ length: 99 }).map((_, i) => (
        <g key={i} stroke="#fff" strokeOpacity=".55" strokeWidth="2"><line x1={EZ + (i + 1) * 10} y1="196" x2={EZ + (i + 1) * 10} y2="208" /><line x1={EZ + (i + 1) * 10} y1="252" x2={EZ + (i + 1) * 10} y2="264" /></g>
      ))}
      {/* red zone */}
      {live.redZone && live.possession && (
        <motion.rect x={attacksRight ? fx(80) : EZ} y="20" width="200" height="420" fill={RED} initial={{ opacity: 0.1 }} animate={{ opacity: [0.1, 0.28, 0.1] }} transition={{ duration: 1.8, repeat: Infinity }} />
      )}
      {/* drive */}
      {sx != null && Math.abs(bx - sx) > 14 && (
        <>
          <motion.path d={`M ${sx} 215 Q ${(sx + bx) / 2} ${arcPeak - 40} ${bx} 215`} fill="none" stroke="#fff" strokeWidth="5" strokeDasharray="2 12" strokeLinecap="round" markerEnd="url(#arrowhead)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
          <circle cx={sx} cy="215" r="9" fill="#fff" stroke={BLUE} strokeWidth="4" />
          {driveYds > 0 && (
            <g transform={`translate(${(sx + bx) / 2} ${arcPeak - 18})`}>
              <rect x="-44" y="-20" width="88" height="34" rx="17" fill="#fff" />
              <text textAnchor="middle" y="4" fontSize="20" fontWeight="900" fill={INK}>+{driveYds} yd</text>
            </g>
          )}
        </>
      )}
      {/* first down + LOS */}
      {fdx != null && <line x1={fdx} y1="20" x2={fdx} y2="440" stroke="#ffd21f" strokeWidth="6" />}
      <motion.line animate={{ x1: bx, x2: bx }} initial={false} transition={{ type: "spring", stiffness: 90, damping: 18 }} y1="20" y2="440" stroke="#2f7bff" strokeWidth="6" />
      {/* ball */}
      <motion.g animate={{ x: bx }} initial={false} transition={{ type: "spring", stiffness: 90, damping: 18 }}>
        <motion.circle cy="230" r="26" fill="#fff" initial={{ opacity: 0.5 }} animate={{ opacity: [0.55, 0.15, 0.55], r: [22, 34, 22] }} transition={{ duration: 1.8, repeat: Infinity }} />
        <g transform="translate(-26 204)"><FootballIcon size={52} /></g>
      </motion.g>
    </svg>
  );
}

export function NflLiveTracker({ detail, awayHex: aIn, homeHex: hIn }: { detail: NflGameDetail; awayHex: string; homeHex: string }) {
  const [awayHex, homeHex] = distinct(aIn, hIn);
  const { game: g, live } = detail;
  const [all, setAll] = useState(false);
  if (!live) return null;
  const isLive = g.status === "live";
  const periodLabel = live.period > 4 ? "OT" : `Q${live.period}`;
  const recent = all ? live.recent : live.recent.slice(0, 5);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] mb-4">
      <div className="flex flex-col gap-4 min-w-0">
        {/* Score banner */}
        <LCard className="p-4 sm:p-5">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            {([["away", g.away, g.awayScore, awayHex], ["home", g.home, g.homeScore, homeHex]] as const).map(([side, abbr, score, hex]) => (
              <div key={side} className={`flex items-center gap-3 ${side === "home" ? "flex-row-reverse text-right" : ""}`}>
                <div className="relative">
                  <LogoPlate hex={hex} src={`https://a.espncdn.com/i/teamlogos/nfl/500/${abbr.toLowerCase()}.png`} code={abbr} size={52} radius={16} variant="clean" />
                  {live.possession === abbr && isLive && <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center" style={{ boxShadow: SHADOW }}><FootballIcon size={15} /></span>}
                </div>
                <div>
                  <p className="text-[12px] font-extrabold tracking-wide" style={{ color: INK3 }}>{abbr}</p>
                  <p className="text-[38px] sm:text-[46px] leading-none"><ScoreNum value={score ?? 0} /></p>
                </div>
              </div>
            ))}
            <div className="order-none col-start-2 row-start-1 flex flex-col items-center gap-1.5 px-1">
              {isLive ? <LivePulse label={`${periodLabel} ${live.clock}`} /> : <Pill>Final</Pill>}
              {isLive && live.downText && <Pill color={INK} bg="#eef4ff">{live.downText}</Pill>}
              {isLive && live.redZone && <Pill color="#fff" bg={RED}>RED ZONE</Pill>}
            </div>
          </div>
        </LCard>

        {/* Field */}
        <LCard className="p-3 sm:p-4">
          <LTitle right={live.drive ? <Pill>{live.drive.team} · {live.drive.plays} plays · {live.drive.yards} yds · {live.drive.time}</Pill> : undefined}>Drive tracker</LTitle>
          <Field d={detail} awayHex={awayHex} homeHex={homeHex} away={g.away} home={g.home} />
          <div className="mt-3 flex items-center gap-4 flex-wrap text-[11px] font-semibold" style={{ color: INK3 }}>
            <span className="inline-flex items-center gap-1.5"><i className="w-3 h-1.5 rounded" style={{ background: "#2f7bff" }} />Line of scrimmage</span>
            <span className="inline-flex items-center gap-1.5"><i className="w-3 h-1.5 rounded" style={{ background: "#ffd21f" }} />First down</span>
            <span className="inline-flex items-center gap-1.5"><i className="w-3 h-1.5 rounded border border-dashed" style={{ borderColor: INK3 }} />Current drive</span>
          </div>
        </LCard>

        {/* Last play */}
        {live.lastPlay && (
          <LCard className="p-4 sm:p-5">
            <LTitle right={<Pill>{live.lastPlay.type || "Play"}</Pill>}>Last play</LTitle>
            <AnimatePresence mode="wait">
              <motion.div key={live.lastPlay.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <p className="text-[12px] font-bold mb-1" style={{ color: INK3 }}>Q{live.lastPlay.period} · {live.lastPlay.clock}{live.lastPlay.team ? ` · ${live.lastPlay.team}` : ""}</p>
                <p className="text-[15px] leading-snug font-medium" style={{ color: INK }}>{live.lastPlay.text}</p>
              </motion.div>
            </AnimatePresence>
          </LCard>
        )}
      </div>

      <div className="flex flex-col gap-4 min-w-0">
        <LCard className="p-4 sm:p-5">
          <LTitle right={isLive ? <Pill color={RED} bg="#fdecee">Live</Pill> : undefined}>Win probability</LTitle>
          <ProbChart series={detail.winProbSeries} awayHex={awayHex} homeHex={homeHex} away={g.away} home={g.home} />
        </LCard>

        <LCard className="p-4 sm:p-5">
          <LTitle>Scoring by quarter</LTitle>
          <QuarterTable away={live.quarters.away} home={live.quarters.home} awayAbbr={g.away} homeAbbr={g.home} awayScore={g.awayScore} homeScore={g.homeScore} />
          {live.scoring.length > 0 && (
            <div className="mt-3 pt-3 flex flex-col gap-2" style={{ borderTop: `1px solid ${LINE}` }}>
              {live.scoring.slice(-4).reverse().map((s, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Pill color={INK}>Q{s.period} {s.clock}</Pill>
                  <p className="text-[12px] leading-snug flex-1" style={{ color: INK2 }}><b style={{ color: INK }}>{s.team}</b> {s.text}</p>
                  <span className="font-spot-mono text-[11px] font-bold shrink-0" style={{ color: INK3 }}>{s.away}-{s.home}</span>
                </div>
              ))}
            </div>
          )}
        </LCard>

        <LCard className="p-4 sm:p-5">
          <LTitle right={live.recent.length > 5 ? <button onClick={() => setAll((v) => !v)} className="press text-[12px] font-bold" style={{ color: BLUE }}>{all ? "Show less" : "Show all"}</button> : undefined}>Play-by-play</LTitle>
          <div className="flex flex-col">
            {recent.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex gap-2.5 py-2" style={{ borderTop: i ? `1px solid ${LINE}` : undefined }}>
                <span className="font-spot-mono text-[11px] font-bold w-[52px] shrink-0 pt-0.5" style={{ color: p.scoring ? GREEN : INK3 }}>Q{p.period} {p.clock}</span>
                <p className="text-[12.5px] leading-snug" style={{ color: p.scoring ? INK : INK2, fontWeight: p.scoring ? 700 : 500 }}>{p.text}</p>
              </motion.div>
            ))}
          </div>
        </LCard>
      </div>
    </div>
  );
}

/* ───────────────────────── NBA ───────────────────────── */

function Court({ shots, awayHex, homeHex }: { shots: NbaGameDetail["live"] extends infer L ? (L extends { shots: infer S } ? S : never) : never; awayHex: string; homeHex: string }) {
  const hex = (s: "away" | "home") => (s === "away" ? awayHex : homeHex);
  return (
    <svg viewBox="0 0 500 480" className="w-full h-auto rounded-2xl" style={{ background: "#fbf3e6", display: "block" }} role="img" aria-label="Shot chart">
      <g fill="none" stroke="#c9b48c" strokeWidth="2.5">
        <rect x="4" y="4" width="492" height="472" rx="6" />
        <rect x="170" y="4" width="160" height="190" fill="rgba(26,115,255,.05)" />
        <rect x="200" y="4" width="100" height="190" />
        <path d="M190 194 A60 60 0 0 0 310 194" />
        <path d="M190 194 A60 60 0 0 1 310 194" strokeDasharray="6 8" />
        <path d="M210 52 A40 40 0 0 0 290 52" />
        <path d="M30 4 L30 142 A237.5 237.5 0 0 0 470 142 L470 4" />
        <line x1="220" y1="40" x2="280" y2="40" strokeWidth="4" />
        <circle cx="250" cy="52" r="8" stroke="#ef6a2b" strokeWidth="3" />
      </g>
      {shots.map((s, i) => {
        const cx = s.x * 10, cy = s.y * 10 + 2;
        return s.made ? (
          <circle key={i} cx={cx} cy={cy} r="8" fill={hex(s.side)} fillOpacity=".92" stroke="#fff" strokeWidth="2"><title>{s.player} · {s.pts}pt · Q{s.period} {s.clock}</title></circle>
        ) : (
          <g key={i} stroke={hex(s.side)} strokeWidth="3" strokeLinecap="round" opacity=".6"><line x1={cx - 5} y1={cy - 5} x2={cx + 5} y2={cy + 5} /><line x1={cx + 5} y1={cy - 5} x2={cx - 5} y2={cy + 5} /><title>{s.player} · miss · Q{s.period} {s.clock}</title></g>
        );
      })}
    </svg>
  );
}

function MarginChart({ margin, awayHex, homeHex, away, home }: { margin: number[]; awayHex: string; homeHex: string; away: string; home: string }) {
  if (margin.length < 3) return null;
  const W = 400, H = 120;
  const max = Math.max(8, ...margin.map(Math.abs));
  const y = (m: number) => H / 2 - (m / max) * (H / 2 - 6);
  const line = margin.map((m, i) => `${i === 0 ? "M" : "L"}${((i / (margin.length - 1)) * W).toFixed(1)},${y(m).toFixed(1)}`).join(" ");
  const last = margin[margin.length - 1];
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] font-bold mb-1.5"><span style={{ color: awayHex }}>▲ {away} lead</span><span style={{ color: homeHex }}>{home} lead ▼</span></div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 120, display: "block" }}>
        <defs>
          <clipPath id="above"><rect x="0" y="0" width={W} height={H / 2} /></clipPath>
          <clipPath id="below"><rect x="0" y={H / 2} width={W} height={H / 2} /></clipPath>
        </defs>
        <path d={`${line} L${W},${H / 2} L0,${H / 2} Z`} fill={awayHex} fillOpacity=".22" clipPath="url(#above)" />
        <path d={`${line} L${W},${H / 2} L0,${H / 2} Z`} fill={homeHex} fillOpacity=".22" clipPath="url(#below)" />
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="#c9cdd6" strokeDasharray="3 4" />
        <motion.path d={line} fill="none" stroke={last >= 0 ? awayHex : homeHex} strokeWidth="2.4" strokeLinejoin="round" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.3 }} />
      </svg>
    </div>
  );
}

export function NbaLiveTracker({ detail, awayHex: aIn, homeHex: hIn }: { detail: NbaGameDetail; awayHex: string; homeHex: string }) {
  const [awayHex, homeHex] = distinct(aIn, hIn);
  const { game: g, live } = detail;
  const [filter, setFilter] = useState<"all" | "away" | "home">("all");
  const shots = useMemo(() => (live ? live.shots.filter((s) => filter === "all" || s.side === filter) : []), [live, filter]);
  if (!live) return null;
  const isLive = g.status === "live";
  const stat = (side: "away" | "home") => {
    const s = live.shots.filter((x) => x.side === side);
    const made = s.filter((x) => x.made).length;
    return { made, att: s.length, three: s.filter((x) => x.made && x.pts === 3).length };
  };
  const as = stat("away"), hs = stat("home");
  const periodLabel = live.period > 4 ? `OT${live.period - 4 > 1 ? live.period - 4 : ""}` : `Q${live.period}`;
  const leader = (g.awayScore ?? 0) === (g.homeScore ?? 0) ? null : (g.awayScore ?? 0) > (g.homeScore ?? 0) ? g.away : g.home;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] mb-4">
      <div className="flex flex-col gap-4 min-w-0">
        <LCard className="p-4 sm:p-5">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            {([["away", g.away, g.awayScore, awayHex], ["home", g.home, g.homeScore, homeHex]] as const).map(([side, abbr, score, hex]) => (
              <div key={side} className={`flex items-center gap-3 ${side === "home" ? "flex-row-reverse text-right" : ""}`}>
                <LogoPlate hex={hex} src={`https://a.espncdn.com/i/teamlogos/nba/500/${abbr.toLowerCase()}.png`} code={abbr} size={52} radius={16} variant="clean" />
                <div>
                  <p className="text-[12px] font-extrabold tracking-wide" style={{ color: INK3 }}>{abbr}</p>
                  <p className="text-[38px] sm:text-[46px] leading-none"><ScoreNum value={score ?? 0} /></p>
                </div>
              </div>
            ))}
            <div className="flex flex-col items-center gap-1.5 px-1">
              {isLive ? <LivePulse label={`${periodLabel} ${live.clock}`} /> : <Pill>Final</Pill>}
              {live.run && isLive && <Pill color="#fff" bg={live.run.side === "away" ? awayHex : homeHex}>{(live.run.side === "away" ? g.away : g.home)} {live.run.pts}–0 run</Pill>}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[{ l: "Lead changes", v: String(live.leadChanges) }, { l: `${g.away} biggest lead`, v: `+${live.largestLead.away}` }, { l: `${g.home} biggest lead`, v: `+${live.largestLead.home}` }].map((x) => (
              <div key={x.l} className="rounded-2xl py-2.5" style={{ background: "#f6f7f9" }}>
                <p className="font-spot-mono font-black text-[18px]" style={{ color: INK }}>{x.v}</p>
                <p className="text-[10px] font-bold" style={{ color: INK3 }}>{x.l}</p>
              </div>
            ))}
          </div>
        </LCard>

        <LCard className="p-3 sm:p-4">
          <LTitle right={
            <div className="flex gap-1 p-0.5 rounded-xl" style={{ background: "#f3f4f7" }}>
              {(["all", "away", "home"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className="press px-3 py-1 rounded-lg text-[11px] font-bold" style={filter === f ? { background: "#fff", color: INK, boxShadow: "0 1px 3px rgba(0,0,0,.08)" } : { color: INK3 }}>{f === "all" ? "Both" : f === "away" ? g.away : g.home}</button>
              ))}
            </div>
          }>Shot chart</LTitle>
          <Court shots={shots} awayHex={awayHex} homeHex={homeHex} />
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {[{ t: g.away, s: as, c: awayHex }, { t: g.home, s: hs, c: homeHex }].map((x) => (
              <div key={x.t} className="rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5" style={{ background: "#f6f7f9" }}>
                <span className="w-2.5 h-8 rounded-full" style={{ background: x.c }} />
                <div>
                  <p className="font-spot-mono font-black text-[16px] leading-none" style={{ color: INK }}>{x.s.made}/{x.s.att} <span className="text-[11px]" style={{ color: INK3 }}>{x.s.att ? Math.round((x.s.made / x.s.att) * 100) : 0}%</span></p>
                  <p className="text-[10.5px] font-bold mt-0.5" style={{ color: INK3 }}>{x.t} FG · {x.s.three} threes</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10.5px]" style={{ color: INK3 }}>● made &nbsp; ✕ missed — field goals with tracked locations{leader ? ` · ${leader} leads` : ""}</p>
        </LCard>
      </div>

      <div className="flex flex-col gap-4 min-w-0">
        <LCard className="p-4 sm:p-5">
          <LTitle right={isLive ? <Pill color={RED} bg="#fdecee">Live</Pill> : undefined}>Win probability</LTitle>
          <ProbChart series={detail.winProbSeries} awayHex={awayHex} homeHex={homeHex} away={g.away} home={g.home} />
        </LCard>
        <LCard className="p-4 sm:p-5">
          <LTitle>Lead tracker</LTitle>
          <MarginChart margin={live.margin} awayHex={awayHex} homeHex={homeHex} away={g.away} home={g.home} />
          <div className="mt-3"><QuarterTable away={live.quarters.away} home={live.quarters.home} awayAbbr={g.away} homeAbbr={g.home} awayScore={g.awayScore} homeScore={g.homeScore} /></div>
        </LCard>
        <LCard className="p-4 sm:p-5">
          <LTitle>Latest plays</LTitle>
          <div className="flex flex-col">
            {live.recent.slice(0, 8).map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex gap-2.5 py-2" style={{ borderTop: i ? `1px solid ${LINE}` : undefined }}>
                <span className="font-spot-mono text-[11px] font-bold w-[50px] shrink-0 pt-0.5" style={{ color: p.scoring ? GREEN : INK3 }}>Q{p.period} {p.clock}</span>
                <p className="text-[12.5px] leading-snug flex-1" style={{ color: p.scoring ? INK : INK2, fontWeight: p.scoring ? 700 : 500 }}>{p.text}</p>
                {p.score && <span className="font-spot-mono text-[11px] font-bold shrink-0" style={{ color: INK3 }}>{p.score}</span>}
              </motion.div>
            ))}
          </div>
        </LCard>
      </div>
    </div>
  );
}

/* ───────────────────────── Soccer (rendered inside the light match centre) ───────────────────────── */

export function SoccerLiveCard({ c }: { c: SoccerMatchCenter }) {
  const live = c.live;
  if (!live) return null;
  const m = c.match;
  const home = m.homeTeam, away = m.awayTeam;
  const ink = (h: string) => (h.length >= 7 ? h : BLUE);
  const hc = ink(home.hex), ac = ink(away.hex);
  const delta = (now: number, start: number) => now - start;
  const outcomes = [
    { k: home.shortName, v: live.prob.home, d: delta(live.prob.home, live.probStart.home), c: hc },
    { k: "Draw", v: live.prob.draw, d: delta(live.prob.draw, live.probStart.draw), c: "#9aa1ad" },
    { k: away.shortName, v: live.prob.away, d: delta(live.prob.away, live.probStart.away), c: ac },
  ];
  const marks = c.events.filter((e) => e.type === "goal" || e.type === "red" || e.type === "yellow");

  return (
    <div className="rounded-[22px] bg-white p-5 sm:p-6" style={{ boxShadow: SHADOW }}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <p className="text-[17px] font-semibold tracking-tight" style={{ color: INK }}>Live Analysis</p>
        <LivePulse label={m.statusDetail && /'|HT|\d/.test(m.statusDetail) ? m.statusDetail : `${live.clock}`} />
      </div>

      {/* Match timeline */}
      <div className="relative pt-9 pb-9 px-1">
        <div className="relative h-2.5 rounded-full" style={{ background: "#eef0f4" }}>
          <motion.div className="absolute left-0 top-0 h-full rounded-full" style={{ background: `linear-gradient(90deg, ${hc}, ${BLUE})` }} initial={{ width: 0 }} animate={{ width: `${live.progress}%` }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
          {[0, 15, 30, 45, 60, 75, 90].map((t) => (
            <span key={t} className="absolute top-3.5 -translate-x-1/2 text-[10px] font-semibold" style={{ left: `${(t / 90) * 100}%`, color: INK3 }}>{t === 45 ? "HT" : `${t}'`}</span>
          ))}
          <div className="absolute top-1/2" style={{ left: `${live.progress}%` }}>
            <motion.span className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white" style={{ boxShadow: `0 0 0 3px ${BLUE}` }} animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />
          </div>
          {marks.map((e, i) => {
            const left = `${Math.min(100, (e.sort / 90) * 100)}%`;
            const top = e.side === "home";
            return (
              <span key={i} className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left, [top ? "bottom" : "top"]: "calc(100% + 4px)" }} title={`${e.minute} ${e.player}`}>
                {e.type === "goal" ? (
                  <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10.5" fill="#fff" stroke="#c9ccd3" /><path d="M12 6.5l3.6 2.6-1.4 4.2H9.8L8.4 9.1 12 6.5z" fill="#2b2f38" /></svg>
                ) : (
                  <i className="block w-2.5 h-3.5 rounded-[2px]" style={{ background: e.type === "red" ? RED : "#fbbf24" }} />
                )}
              </span>
            );
          })}
        </div>
        <div className="absolute left-1 top-0 flex items-center gap-1.5 text-[11px] font-bold" style={{ color: INK2 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}<img src={home.logo} alt="" width={16} height={16} className="w-4 h-4 object-contain" />{home.abbr}
        </div>
        <div className="absolute left-1 bottom-0 flex items-center gap-1.5 text-[11px] font-bold" style={{ color: INK2 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}<img src={away.logo} alt="" width={16} height={16} className="w-4 h-4 object-contain" />{away.abbr}
        </div>
      </div>

      {/* Live probability */}
      <p className="mt-2 mb-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: INK3 }}>Win probability now</p>
      <div className="flex overflow-hidden rounded-full" style={{ height: 14, background: "#eef0f4" }}>
        {outcomes.map((o, i) => <motion.div key={o.k} animate={{ width: `${o.v}%` }} transition={{ type: "spring", stiffness: 90, damping: 20 }} style={{ background: o.c, marginLeft: i ? 2 : 0 }} />)}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {outcomes.map((o) => (
          <div key={o.k} className="rounded-2xl px-3 py-2.5 text-center" style={{ background: "#f6f7f9" }}>
            <p className="font-spot-mono font-black text-[22px] leading-none" style={{ color: INK }}>{o.v}%</p>
            <p className="text-[11px] font-bold mt-1 truncate" style={{ color: INK2 }}>{o.k}</p>
            <p className="text-[10px] font-bold" style={{ color: o.d > 0 ? GREEN : o.d < 0 ? RED : INK3 }}>{o.d > 0 ? "▲" : o.d < 0 ? "▼" : "•"} {Math.abs(o.d)} vs kickoff</p>
          </div>
        ))}
      </div>

      {/* Commentary */}
      {live.recent.length > 0 && (
        <>
          <p className="mt-5 mb-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: INK3 }}>Latest action</p>
          <div className="flex flex-col">
            {live.recent.slice(0, 6).map((r, i) => (
              <motion.div key={i + r.text} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex gap-2.5 py-2" style={{ borderTop: i ? `1px solid ${LINE}` : undefined }}>
                <span className="font-spot-mono text-[11px] font-bold w-10 shrink-0 pt-0.5" style={{ color: /goal/i.test(r.type) ? GREEN : INK3 }}>{r.minute}</span>
                <p className="text-[12.5px] leading-snug" style={{ color: /goal/i.test(r.type) ? INK : INK2, fontWeight: /goal/i.test(r.type) ? 700 : 500 }}>{r.text}</p>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
