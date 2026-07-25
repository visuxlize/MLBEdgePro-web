"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { nflTeamHex, nflLogoUrl } from "@/lib/nfl/teams";
import { LogoPlate, gradeColor, alpha } from "@/components/web-tool/spotlight";
import type { NflDriveState, NflEdgeFactor, NflGame, NflH2HStat, NflPlayerProp } from "@/lib/nfl/types";

interface Props {
  game: NflGame;
  drive?: NflDriveState;
  venueImage: string | null;
  h2h: NflH2HStat[];
  factors: NflEdgeFactor[];
  narrativeText: string;
  narrativeTags: string[];
  wpLine: string;
  wpArea: string;
  gameProps: NflPlayerProp[];
}

export function GameDeepDive({ game, drive, venueImage, h2h, factors, narrativeText, narrativeTags, wpLine, wpArea, gameProps }: Props) {
  const [slip, setSlip] = useState<string[]>([]);
  const awayHex = nflTeamHex(game.away), homeHex = nflTeamHex(game.home);
  const gc = gradeColor(game.grade);
  const favHome = game.homeWinProb >= 50;
  const toggleSlip = (id: string) => setSlip((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const slipEdge = slip.length
    ? Math.round(gameProps.filter((p) => slip.includes(p.id)).reduce((a, p) => a + p.edge, 0) / slip.length)
    : 0;

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6" style={{ paddingBottom: slip.length ? 96 : 24 }}>
        <Link href="/nfl" className="inline-flex items-center gap-1.5 mb-4 font-spot-sans font-bold text-xs" style={{ color: "var(--text-muted)" }}>
          &larr; Back to the slate
        </Link>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[22px] overflow-hidden mb-4"
          style={{ border: "1px solid var(--hairline)", boxShadow: "var(--shadow-panel)" }}
        >
          {venueImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={venueImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${alpha(awayHex, "40")}, #0b0d15 52%, ${alpha(homeHex, "40")})` }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(6,7,13,.92), rgba(6,7,13,.5) 55%, rgba(6,7,13,.38))" }} />
          <div className="relative p-6 sm:p-7 flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-spot-mono font-extrabold text-[10px] tracking-[.08em]" style={{ color: "var(--orange-soft)" }}>{game.dateLabel} &middot; {game.timeLabel}</span>
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
                  <LogoPlate hex={awayHex} src={nflLogoUrl(game.away)} code={game.away} size={64} radius={19} />
                  <span className="font-spot-sans font-black text-lg" style={{ color: "var(--text)" }}>{game.away}</span>
                  <span className="font-spot-sans text-[11px]" style={{ color: "var(--text-muted)" }}>{game.qbAway}</span>
                </div>
                <span className="font-spot-mono font-extrabold text-2xl" style={{ color: "var(--text-ghost)" }}>
                  {game.status !== "pre" ? `${game.awayScore ?? 0} – ${game.homeScore ?? 0}` : "@"}
                </span>
                <div className="flex flex-col items-center gap-2">
                  <LogoPlate hex={homeHex} src={nflLogoUrl(game.home)} code={game.home} size={64} radius={19} />
                  <span className="font-spot-sans font-black text-lg" style={{ color: "var(--text)" }}>{game.home}</span>
                  <span className="font-spot-sans text-[11px]" style={{ color: "var(--text-muted)" }}>{game.qbHome}</span>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="relative" style={{ width: 96, height: 96, borderRadius: "50%", background: `conic-gradient(${gc} ${game.edge}%, rgba(255,255,255,.08) 0)`, display: "grid", placeItems: "center" }}>
                  <div className="absolute rounded-full" style={{ inset: 7, background: "var(--panel)" }} />
                  <div className="relative flex flex-col items-center leading-none">
                    <span className="font-spot-mono font-extrabold text-[27px]">{game.edge}</span>
                    <span className="mt-1 font-spot-sans font-black text-[13px]" style={{ color: gc }}>{game.grade}</span>
                  </div>
                </div>
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
            {drive && (
              <div className="flex items-center gap-2.5 rounded-xl px-4 py-2.5" style={{ background: "var(--orange-tint)", border: "1px solid var(--orange-line)" }}>
                <span className="font-spot-mono font-bold text-xs" style={{ color: "var(--orange-soft)" }}>
                  {drive.possession} ball &middot; {drive.downDistance} at {drive.spot}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* AI narrative + win-prob timeline */}
        <div className="grid gap-3.5 mb-3.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="rounded-[18px] p-5" style={{ background: "linear-gradient(160deg, rgba(124,92,250,.10), #0b0d15 62%)", border: "1px solid var(--purple-line)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-[26px] h-[26px] rounded-lg flex items-center justify-center" style={{ color: "var(--purple-2)", background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>◆</span>
              <span className="font-spot-sans font-extrabold text-xs tracking-[.06em]" style={{ color: "var(--purple-soft)" }}>Edge AI Breakdown</span>
            </div>
            <p className="font-spot-sans font-medium text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}>{narrativeText}</p>
            <div className="flex flex-wrap gap-1.5 mt-3.5">
              {narrativeTags.map((t) => (
                <span key={t} className="rounded-full px-2.5 py-1 font-spot-sans font-bold text-[10px]" style={{ color: "var(--purple-soft)", background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>{t}</span>
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
                <linearGradient id="wpArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={homeHex} stopOpacity={0.35} />
                  <stop offset="1" stopColor={homeHex} stopOpacity={0} />
                </linearGradient>
              </defs>
              <line x1="0" y1="60" x2="320" y2="60" stroke="rgba(255,255,255,.12)" strokeWidth="1" strokeDasharray="3 4" />
              <path d={wpArea} fill="url(#wpArea)" />
              <path d={wpLine} fill="none" stroke={homeHex} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" style={{ strokeDasharray: 1000, strokeDashoffset: 1000, animation: "draw 2s ease .2s forwards" }} />
            </svg>
          </div>
        </div>

        {/* H2H + edge factors */}
        <div className="grid gap-3.5 mb-3.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="rounded-[18px] p-5" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
            <p className="spot-label mb-4" style={{ color: "var(--text-faint)" }}>Head to Head</p>
            <div className="flex flex-col gap-3.5">
              {h2h.map((h) => (
                <div key={h.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-spot-mono font-extrabold text-xs" style={{ color: "var(--text-2)" }}>{h.awayVal}</span>
                    <span className="font-spot-sans font-bold text-[10px] uppercase tracking-[.06em]" style={{ color: "var(--text-muted)" }}>{h.label}</span>
                    <span className="font-spot-mono font-extrabold text-xs" style={{ color: "var(--text-2)" }}>{h.homeVal}</span>
                  </div>
                  <div className="flex items-center gap-1 h-2">
                    <div className="flex-1 flex justify-end h-full rounded overflow-hidden" style={{ background: "rgba(255,255,255,.05)" }}>
                      <div className="h-full rounded" style={{ width: `${h.awayPct}%`, background: awayHex }} />
                    </div>
                    <div className="flex-1 h-full rounded overflow-hidden" style={{ background: "rgba(255,255,255,.05)" }}>
                      <div className="h-full rounded" style={{ width: `${h.homePct}%`, background: homeHex }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[18px] p-5" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
            <p className="spot-label mb-4" style={{ color: "var(--text-faint)" }}>Edge Factors</p>
            <div className="flex flex-col gap-3">
              {factors.map((f) => (
                <div key={f.label}>
                  <div className="flex justify-between mb-1">
                    <span className="font-spot-sans text-xs" style={{ color: "var(--text-2)" }}>{f.label}</span>
                    <span className="font-spot-mono font-extrabold text-[11px]" style={{ color: f.color }}>{f.value}</span>
                  </div>
                  <div className="h-1.5 rounded overflow-hidden" style={{ background: "rgba(255,255,255,.08)" }}>
                    <div className="h-full rounded" style={{ width: `${f.pct}%`, background: f.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Best props */}
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
                  <div key={p.id} className="flex items-center gap-2.5 rounded-[13px] px-3.5 py-2.5" style={{ background: "var(--panel-2)", border: "1px solid var(--hairline)" }}>
                    <LogoPlate hex={nflTeamHex(p.team)} src={nflLogoUrl(p.team)} code={p.team} size={32} radius={9} />
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
