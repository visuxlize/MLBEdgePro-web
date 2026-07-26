"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { wnbaTeamHex, wnbaLogoUrl, wnbaHeadshotUrl } from "@/lib/wnba/teams";
import { LogoPlate, WnbaHeadshot, gradeColor, alpha } from "@/components/web-tool/spotlight";
import { PaywallGate } from "@/components/web-tool/paywall-gate";
import type { WnbaEdgeFactor, WnbaGame, WnbaH2HStat, WnbaPlayerProp } from "@/lib/wnba/types";

/** Eased count-up from 0 to target — used so the edge score reads as freshly computed, not static. */
function useCountUp(target: number, durationMs = 1100) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

/** Edge score as an animated SVG ring — sweeps in on mount instead of appearing as a static conic-gradient. */
function AnimatedEdgeRing({ value, grade, color, size = 96 }: { value: number; grade: string; color: string; size?: number }) {
  const strokeWidth = 7;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const shown = useCountUp(value);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-spot-mono font-extrabold text-[27px]">{shown}</span>
        <span className="mt-1 font-spot-sans font-black text-[13px]" style={{ color }}>{grade}</span>
      </div>
    </div>
  );
}

interface Props {
  game: WnbaGame;
  h2h: WnbaH2HStat[];
  factors: WnbaEdgeFactor[];
  narrativeText: string;
  narrativeTags: string[];
  wpLine: string;
  wpArea: string;
  gameProps: WnbaPlayerProp[];
}

export function WnbaGameDeepDive({ game, h2h, factors, narrativeText, narrativeTags, wpLine, wpArea, gameProps }: Props) {
  const [slip, setSlip] = useState<string[]>([]);
  const awayHex = wnbaTeamHex(game.away), homeHex = wnbaTeamHex(game.home);
  const gc = gradeColor(game.grade);
  const favHome = game.homeWinProb >= 50;
  const toggleSlip = (id: string) => setSlip((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const slipEdge = slip.length
    ? Math.round(gameProps.filter((p) => slip.includes(p.id)).reduce((a, p) => a + p.edge, 0) / slip.length)
    : 0;

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6" style={{ paddingBottom: slip.length ? 96 : 24 }}>
        <Link href="/wnba" className="inline-flex items-center gap-1.5 mb-4 font-spot-sans font-bold text-xs" style={{ color: "var(--text-muted)" }}>
          &larr; Back to the slate
        </Link>

        {/* Hero — free tier: score, teams, edge ring, win prob */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[22px] overflow-hidden mb-4"
          style={{ border: "1px solid var(--hairline)", boxShadow: "var(--shadow-panel)", background: `linear-gradient(120deg, ${alpha(awayHex, "34")}, var(--panel) 55%, ${alpha(homeHex, "34")})` }}
        >
          {game.venueImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={game.venueImage} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.28 }} />
          )}
          <div className="relative p-6 sm:p-7 flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-spot-mono font-extrabold text-[10px] tracking-[.08em]" style={{ color: "#5eead4" }}>{game.dateLabel} &middot; {game.timeLabel}</span>
                <span className="font-spot-sans text-[10px]" style={{ color: "var(--text-3)" }}>{game.venue}</span>
              </div>
              {game.status === "live" && (
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-spot-sans font-extrabold text-[10px] tracking-[.12em]" style={{ color: "var(--red-soft)", background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.3)" }}>
                  <span className="spot-live-dot inline-block rounded-full" style={{ width: 6, height: 6, background: "var(--red)" }} />{game.statusDetail}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-5 flex-wrap">
              <div className="flex items-center gap-5">
                <div className="flex flex-col items-center gap-2">
                  <LogoPlate hex={awayHex} src={wnbaLogoUrl(game.away)} code={game.away} size={76} radius={22} variant="clean" />
                  <span className="font-spot-sans font-black text-lg" style={{ color: "var(--text)" }}>{game.away}</span>
                </div>
                <span className="font-spot-mono font-extrabold text-2xl" style={{ color: "var(--text-ghost)" }}>
                  {game.status !== "pre" ? `${game.awayScore ?? 0} – ${game.homeScore ?? 0}` : "@"}
                </span>
                <div className="flex flex-col items-center gap-2">
                  <LogoPlate hex={homeHex} src={wnbaLogoUrl(game.home)} code={game.home} size={76} radius={22} variant="clean" />
                  <span className="font-spot-sans font-black text-lg" style={{ color: "var(--text)" }}>{game.home}</span>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <AnimatedEdgeRing value={game.edge} grade={game.grade} color={gc} />
                <div className="flex-1" style={{ minWidth: 230 }}>
                  <div className="flex justify-between mb-1">
                    <span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-3)" }}>{game.away} {100 - game.homeWinProb}%</span>
                    <span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-3)" }}>{game.home} {game.homeWinProb}%</span>
                  </div>
                  <div className="flex h-2 rounded overflow-hidden mb-2.5" style={{ background: "rgba(255,255,255,.12)" }}>
                    <div style={{ width: `${game.homeWinProb}%`, background: awayHex }} />
                    <div style={{ flex: 1, background: homeHex }} />
                  </div>
                  <div className="flex items-center justify-between gap-2.5 rounded-xl px-3.5 py-2.5" style={{ background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>
                    <span className="font-spot-sans font-extrabold text-[10px] uppercase tracking-[.12em]" style={{ color: "var(--purple-2)" }}>◆ AI Prediction</span>
                    <span className="font-spot-sans font-black text-[13px]" style={{ color: "var(--purple-soft)" }}>{favHome ? game.home : game.away} ML ↗</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Fan-gated: AI breakdown, win-prob timeline, H2H, edge factors, best props */}
        <PaywallGate
          requiredTier="fan"
          feature="WNBA Matchup Analysis"
          benefits={[
            "Edge AI breakdown for every game",
            "Live win-probability timeline",
            "Head-to-head splits & edge factors",
            "Best player props for this matchup",
          ]}
        >
          <div className="grid gap-3.5 mb-3.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="relative overflow-hidden rounded-[18px] p-5" style={{ background: "linear-gradient(160deg, rgba(45,212,191,.10), var(--panel) 62%)", border: "1px solid rgba(45,212,191,.24)" }}>
              <div className="absolute top-0 bottom-0 left-0 w-1/4 pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, rgba(45,212,191,.12), transparent)", animation: "scan 5.5s linear infinite" }} />
              <div className="relative flex items-center justify-between gap-2 mb-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: "#2dd4bf", background: "rgba(45,212,191,.14)", border: "1px solid rgba(45,212,191,.3)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2L12 2z" fill="currentColor" /></svg>
                  </span>
                  <span className="font-spot-sans font-extrabold text-xs tracking-[.06em]" style={{ color: "#5eead4" }}>Edge AI Breakdown</span>
                </div>
                <span className="rounded-full px-2.5 py-1 font-spot-mono font-extrabold text-[11px]" style={{ color: "#5eead4", background: "rgba(45,212,191,.12)", border: "1px solid rgba(45,212,191,.28)" }}>{game.edge} edge</span>
              </div>
              <div className="relative rounded-xl pl-3.5 pr-3.5 py-3" style={{ borderLeft: "2.5px solid rgba(45,212,191,.5)", background: "rgba(255,255,255,.025)" }}>
                <p className="font-spot-sans font-medium text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}>{narrativeText}</p>
              </div>
              <div className="relative flex flex-wrap gap-1.5 mt-3.5">
                {narrativeTags.map((t) => (
                  <span key={t} className="rounded-full px-2.5 py-1 font-spot-sans font-bold text-[10px]" style={{ color: "#5eead4", background: "rgba(45,212,191,.10)", border: "1px solid rgba(45,212,191,.26)" }}>{t}</span>
                ))}
              </div>
            </div>
            <div className="rounded-[18px] p-5" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="spot-label" style={{ color: "var(--text-faint)" }}>Win Probability</p>
                <span className="font-spot-mono font-bold text-[10px]" style={{ color: homeHex }}>{game.home} favored</span>
              </div>
              <svg viewBox="0 0 320 120" preserveAspectRatio="none" style={{ width: "100%", height: 130, display: "block" }}>
                <defs>
                  <linearGradient id="wpAreaWnba" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={homeHex} stopOpacity={0.35} />
                    <stop offset="1" stopColor={homeHex} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <line x1="0" y1="60" x2="320" y2="60" stroke="rgba(255,255,255,.12)" strokeWidth="1" strokeDasharray="3 4" />
                <path d={wpArea} fill="url(#wpAreaWnba)" />
                <path d={wpLine} fill="none" stroke={homeHex} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" style={{ strokeDasharray: 1000, strokeDashoffset: 1000, animation: "draw 2s ease .2s forwards" }} />
              </svg>
            </div>
          </div>

          <div className="grid gap-3.5 mb-3.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="rounded-[18px] p-5" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
              <div className="flex items-center justify-between mb-4">
                <LogoPlate hex={awayHex} src={wnbaLogoUrl(game.away)} code={game.away} size={22} radius={6} variant="clean" />
                <p className="spot-label" style={{ color: "var(--text-faint)" }}>Head to Head</p>
                <LogoPlate hex={homeHex} src={wnbaLogoUrl(game.home)} code={game.home} size={22} radius={6} variant="clean" />
              </div>
              <div className="flex flex-col gap-3.5">
                {h2h.map((h, i) => (
                  <div key={h.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-spot-mono font-extrabold text-xs" style={{ color: "var(--text-2)" }}>{h.awayVal}</span>
                      <span className="font-spot-sans font-bold text-[10px] uppercase tracking-[.06em]" style={{ color: "var(--text-muted)" }}>{h.label}</span>
                      <span className="font-spot-mono font-extrabold text-xs" style={{ color: "var(--text-2)" }}>{h.homeVal}</span>
                    </div>
                    <div className="flex items-center gap-1 h-2">
                      <div className="flex-1 flex justify-end h-full rounded overflow-hidden" style={{ background: "rgba(255,255,255,.05)" }}>
                        <div className="h-full rounded" style={{ width: `${h.awayPct}%`, background: awayHex, transformOrigin: "right", animation: `bar-grow .8s cubic-bezier(.22,1,.36,1) ${i * 0.08}s both` }} />
                      </div>
                      <div className="flex-1 h-full rounded overflow-hidden" style={{ background: "rgba(255,255,255,.05)" }}>
                        <div className="h-full rounded" style={{ width: `${h.homePct}%`, background: homeHex, transformOrigin: "left", animation: `bar-grow .8s cubic-bezier(.22,1,.36,1) ${i * 0.08}s both` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[18px] p-5" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
              <p className="spot-label mb-4" style={{ color: "var(--text-faint)" }}>Edge Factors</p>
              <div className="flex flex-col gap-3">
                {factors.map((f, i) => (
                  <div key={f.label}>
                    <div className="flex justify-between mb-1">
                      <span className="font-spot-sans text-xs" style={{ color: "var(--text-2)" }}>{f.label}</span>
                      <span className="font-spot-mono font-extrabold text-[11px]" style={{ color: f.color }}>{f.value}</span>
                    </div>
                    <div className="h-1.5 rounded overflow-hidden" style={{ background: "rgba(255,255,255,.08)" }}>
                      <div className="h-full rounded" style={{ width: `${f.pct}%`, background: f.color, transformOrigin: "left", animation: `bar-grow .8s cubic-bezier(.22,1,.36,1) ${i * 0.08}s both` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {gameProps.length > 0 && (
            <div className="rounded-[18px] p-5" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
              <div className="flex items-center justify-between mb-3.5">
                <p className="spot-label" style={{ color: "var(--text-faint)" }}>Best Props &middot; This Game</p>
                <span className="font-spot-sans text-xs" style={{ color: "var(--text-faint)" }}>Tap + to build a parlay</span>
              </div>
              <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
                {gameProps.map((p) => {
                  const inSlip = slip.includes(p.id);
                  const pgc = gradeColor(p.grade);
                  return (
                    <div key={p.id} className="flex items-center gap-3 rounded-[13px] px-3.5 py-3" style={{ background: "var(--panel-2)", border: "1px solid var(--hairline)" }}>
                      <WnbaHeadshot hex={wnbaTeamHex(p.team)} src={wnbaHeadshotUrl(p.espnId)} name={p.player} size={48} />
                      <div className="flex-1 min-w-0">
                        <p className="font-spot-sans font-extrabold text-[13px]" style={{ color: "var(--text)" }}>{p.player}</p>
                        <p className="font-spot-sans text-[10px]" style={{ color: "var(--text-muted)" }}>{p.market} &middot; {p.over ? "OVER" : "UNDER"} &middot; model {p.model}</p>
                      </div>
                      <span className="rounded-lg px-2 py-1 font-spot-sans font-black text-xs" style={{ color: pgc, background: `color-mix(in srgb, ${pgc} 16%, transparent)` }}>{p.grade}</span>
                      <button
                        onClick={() => toggleSlip(p.id)}
                        className="w-8 h-8 shrink-0 rounded-lg font-spot-sans font-black text-[15px] flex items-center justify-center"
                        style={inSlip
                          ? { color: "var(--green)", background: "var(--green-bg)", border: "1px solid rgba(52,211,153,.32)" }
                          : { color: "var(--purple-soft)", background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}
                      >
                        {inSlip ? "✓" : "+"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </PaywallGate>
      </div>

      {slip.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-5 pb-4" style={{ pointerEvents: "none" }}>
          <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-3.5 rounded-2xl px-4.5 py-3.5" style={{ background: "rgba(17,15,30,.94)", border: "1px solid var(--purple-line)", backdropFilter: "blur(14px)", boxShadow: "0 20px 60px rgba(0,0,0,.6)", pointerEvents: "auto" }}>
            <span className="font-spot-sans font-bold text-[13px]" style={{ color: "var(--text-2)" }}>
              <span className="font-black" style={{ color: "var(--purple-2)" }}>{slip.length}</span>-leg parlay &middot; avg edge <span className="font-spot-mono font-extrabold" style={{ color: "var(--green)" }}>{slipEdge}</span>
            </span>
            <button onClick={() => setSlip([])} className="font-spot-sans font-bold text-xs" style={{ color: "var(--text-muted)" }}>Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}
