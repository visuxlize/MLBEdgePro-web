"use client";

import { useMemo, useState } from "react";
import { nflTeamHex, nflLogoUrl } from "@/lib/nfl/teams";
import { LogoPlate, gradeColor } from "@/components/web-tool/spotlight";
import type { NflPlayerProp, NflPropPosition, NflWeekKey } from "@/lib/nfl/types";
import { saveSlip, calcPayout } from "@/lib/saved-slips";
import type { SlipLeg } from "@/lib/saved-slips";
import { Check, BookmarkPlus, ChevronRight } from "lucide-react";

const POSITIONS: (NflPropPosition | "All")[] = ["All", "QB", "RB", "WR", "TE"];

const WEEK_LABELS: Record<NflWeekKey, string> = {
  HOF_PRE1: "HOF + Preseason Wk 1",
  PRE2:     "Preseason Wk 2",
  PRE3:     "Preseason Wk 3",
  WK1:      "Regular Season · Wk 1",
};

// Silhouette SVG shown when headshot fails to load
function PlayerSilhouette({ hex }: { hex: string }) {
  return (
    <svg viewBox="0 0 60 72" width="100%" height="100%" fill="none" aria-hidden="true">
      <circle cx="30" cy="20" r="13" fill={hex} opacity="0.55" />
      <path d="M6 72c0-15.464 10.745-28 24-28s24 12.536 24 28" fill={hex} opacity="0.35" />
    </svg>
  );
}

function propViz(p: NflPlayerProp) {
  const isTD = p.market === "Anytime TD";
  const lineVal = isTD ? "TD" : String(p.line);
  const modelVal = isTD ? `${Math.round(p.model * 100)}%` : String(p.model);
  const side = isTD ? "YES" : p.over ? "OVER" : "UNDER";
  const sideGreen = p.over || isTD;
  const maxScale = isTD ? 1 : p.line * 1.8;
  const linePct = isTD ? 50 : Math.min(85, (p.line / maxScale) * 100);
  const modelPct = isTD ? Math.round(p.model * 100) : Math.min(94, (p.model / maxScale) * 100);
  const barLeft = Math.min(linePct, modelPct);
  const barW = Math.max(5, Math.abs(modelPct - linePct));
  return { lineVal, modelVal, side, sideGreen, linePct, barLeft, barW };
}

// Derive home/away from matchup string and return a stable game key
function parseGame(team: string, matchup: string) {
  const isAway = matchup.startsWith("@");
  const opp = matchup.replace(/^(vs |@ )/, "").trim();
  const home = isAway ? opp : team;
  const away = isAway ? team : opp;
  const gameKey = [away, home].sort().join("-");
  return { home, away, gameKey };
}

// Position-coloured dot
function PosDot({ pos }: { pos: NflPropPosition }) {
  const colors: Record<NflPropPosition, string> = {
    QB: "#a78bfa", RB: "#34d399", WR: "#60a5fa", TE: "#fb923c",
  };
  return (
    <span className="inline-flex items-center justify-center rounded-full font-spot-sans font-black text-[9px] uppercase"
      style={{ width: 22, height: 22, background: `${colors[pos]}22`, color: colors[pos], border: `1px solid ${colors[pos]}44`, flexShrink: 0 }}>
      {pos}
    </span>
  );
}

interface GameGroup {
  gameKey: string;
  home: string;
  away: string;
  gameDate?: string;
  week?: NflWeekKey;
  props: NflPlayerProp[];
}

export function NflPropsTool({ props }: { props: NflPlayerProp[] }) {
  const [pos, setPos] = useState<NflPropPosition | "All">("All");
  const [activeWeek, setActiveWeek] = useState<NflWeekKey | "all">("all");
  const [slip, setSlip] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  // Collect unique weeks present in props
  const weeks = useMemo(() => {
    const seen = new Set<NflWeekKey>();
    for (const p of props) if (p.week) seen.add(p.week);
    return Array.from(seen);
  }, [props]);

  // Group props by game
  const gameGroups = useMemo<GameGroup[]>(() => {
    const filtered = props.filter((p) => {
      const posMatch = pos === "All" || p.pos === pos;
      const weekMatch = activeWeek === "all" || p.week === activeWeek;
      return posMatch && weekMatch;
    });

    const map = new Map<string, GameGroup>();
    for (const p of filtered) {
      const { home, away, gameKey } = parseGame(p.team, p.matchup);
      if (!map.has(gameKey)) {
        map.set(gameKey, { gameKey, home, away, gameDate: p.gameDate, week: p.week, props: [] });
      }
      map.get(gameKey)!.props.push(p);
    }
    return Array.from(map.values());
  }, [props, pos, activeWeek]);

  const slipProps = props.filter((p) => slip.includes(p.id));
  const slipEdge = slipProps.length ? Math.round(slipProps.reduce((a, p) => a + p.edge, 0) / slipProps.length) : 0;
  const slipPayout = calcPayout(slipProps.length);

  const toggle = (id: string) => setSlip((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  function handleSave() {
    const legs: SlipLeg[] = slipProps.map((p) => {
      const viz = propViz(p);
      return { id: p.id, player: p.player, team: p.team, market: p.market, side: viz.side, line: p.line, model: p.model, grade: p.grade, odds: p.odds };
    });
    saveSlip({ sport: "NFL", legs, combinedPayout: slipPayout, avgEdge: slipEdge });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSlip([]);
  }

  // Preseason vs regular week groups for the week pills
  const preseasonWeeks = weeks.filter((w) => w !== "WK1");
  const regularWeeks   = weeks.filter((w) => w === "WK1");

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6" style={{ paddingBottom: slip.length ? 96 : 24 }}>

        {/* ── Header ── */}
        <div className="mb-6">
          <p className="spot-label" style={{ color: "var(--purple-2)" }}>NFL Prop Projections</p>
          <h1 className="font-spot-sans text-3xl sm:text-4xl font-black leading-tight mt-1 uppercase" style={{ color: "var(--text)", letterSpacing: "-.01em" }}>
            Player Props
          </h1>
          <p className="mt-1.5 font-spot-sans text-[13px]" style={{ color: "var(--text-muted)" }}>
            Model projection vs the book — grouped by game and week
          </p>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Week filter — split preseason / regular */}
          <div className="flex flex-col gap-2">
            {preseasonWeeks.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.10em] w-20 shrink-0"
                  style={{ color: "var(--orange)" }}>PRESEASON</span>
                {preseasonWeeks.map((w) => {
                  const active = activeWeek === w;
                  return (
                    <button key={w} onClick={() => setActiveWeek(w)}
                      className="rounded-xl px-4 py-2 font-spot-sans font-extrabold text-[11px] tracking-[.06em] transition-all"
                      style={active
                        ? { background: "var(--orange)", color: "#000", boxShadow: "0 4px 14px rgba(251,146,60,.35)" }
                        : { background: "var(--panel)", border: "1px solid var(--hairline)", color: "var(--text-muted)" }}>
                      {WEEK_LABELS[w]}
                    </button>
                  );
                })}
              </div>
            )}
            {regularWeeks.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.10em] w-20 shrink-0"
                  style={{ color: "var(--purple-2)" }}>REGULAR</span>
                {regularWeeks.map((w) => {
                  const active = activeWeek === w;
                  return (
                    <button key={w} onClick={() => setActiveWeek(w)}
                      className="rounded-xl px-4 py-2 font-spot-sans font-extrabold text-[11px] tracking-[.06em] transition-all"
                      style={active
                        ? { background: "var(--grad-purple)", color: "#fff", boxShadow: "0 4px 14px rgba(124,92,250,.35)" }
                        : { background: "var(--panel)", border: "1px solid var(--hairline)", color: "var(--text-muted)" }}>
                      {WEEK_LABELS[w]}
                    </button>
                  );
                })}
              </div>
            )}
            {/* All weeks */}
            <div className="flex items-center gap-2">
              <span className="w-20 shrink-0" />
              <button onClick={() => setActiveWeek("all")}
                className="rounded-xl px-4 py-2 font-spot-sans font-extrabold text-[11px] tracking-[.06em] transition-all"
                style={activeWeek === "all"
                  ? { background: "rgba(255,255,255,.9)", color: "#0f172a", boxShadow: "0 2px 8px rgba(0,0,0,.3)" }
                  : { background: "var(--panel)", border: "1px solid var(--hairline)", color: "var(--text-muted)" }}>
                All Weeks
              </button>
            </div>
          </div>

          {/* Position filter */}
          <div className="flex gap-1.5 flex-wrap">
            {POSITIONS.map((label) => {
              const active = label === pos;
              return (
                <button key={label} onClick={() => setPos(label)}
                  className="rounded-full px-3.5 py-1.5 font-spot-sans font-extrabold text-[11px] tracking-[.06em] transition-all"
                  style={active
                    ? { background: "var(--grad-purple)", color: "#fff" }
                    : { color: "var(--text-muted)", border: "1px solid var(--hairline)" }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Game sections ── */}
        {gameGroups.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center rounded-[20px]"
            style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
            <p className="font-spot-sans text-sm" style={{ color: "var(--text-muted)" }}>No props for this selection.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {gameGroups.map((group) => {
              const awayHex = nflTeamHex(group.away);
              const homeHex = nflTeamHex(group.home);
              return (
                <section key={group.gameKey}>
                  {/* Game header */}
                  <div className="rounded-[18px] px-5 py-4 mb-4 flex items-center gap-4 flex-wrap"
                    style={{
                      background: `linear-gradient(120deg, ${awayHex}18 0%, rgba(255,255,255,.02) 50%, ${homeHex}14 100%)`,
                      border: "1px solid var(--hairline)",
                    }}>
                    {/* Away */}
                    <div className="flex items-center gap-2.5">
                      <LogoPlate hex={awayHex} src={nflLogoUrl(group.away)} code={group.away} size={40} radius={11} variant="clean" />
                      <span className="font-spot-sans font-black text-lg uppercase" style={{ color: "var(--text)" }}>{group.away}</span>
                    </div>
                    <span className="font-spot-sans font-extrabold text-[11px] uppercase tracking-widest px-3"
                      style={{ color: "var(--text-dim)" }}>AT</span>
                    {/* Home */}
                    <div className="flex items-center gap-2.5">
                      <LogoPlate hex={homeHex} src={nflLogoUrl(group.home)} code={group.home} size={40} radius={11} variant="clean" />
                      <span className="font-spot-sans font-black text-lg uppercase" style={{ color: "var(--text)" }}>{group.home}</span>
                    </div>
                    {/* Date + week */}
                    <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
                      {group.gameDate && (
                        <span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-muted)" }}>{group.gameDate}</span>
                      )}
                      {group.week && (
                        <span className="font-spot-sans font-extrabold text-[10px] px-2.5 py-1 rounded-full"
                          style={{
                            color: group.week === "WK1" ? "var(--purple-2)" : "var(--orange)",
                            background: group.week === "WK1" ? "var(--purple-tint)" : "rgba(251,146,60,.12)",
                            border: group.week === "WK1" ? "1px solid var(--purple-line)" : "1px solid rgba(251,146,60,.3)",
                          }}>
                          {WEEK_LABELS[group.week]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Player prop cards */}
                  <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
                    {group.props.map((p) => {
                      const viz = propViz(p);
                      const gc = gradeColor(p.grade);
                      const hex = nflTeamHex(p.team);
                      const inSlip = slip.includes(p.id);
                      return (
                        <div key={p.id} className="rounded-[18px] overflow-hidden"
                          style={{ background: "var(--panel)", border: `1px solid ${inSlip ? "rgba(167,139,250,.4)" : "var(--hairline)"}`, boxShadow: inSlip ? "0 0 20px rgba(124,92,250,.15)" : "var(--shadow-card)" }}>
                          {/* Accent bar */}
                          <div style={{ height: 3, background: `linear-gradient(90deg, ${hex}, transparent)` }} />

                          {/* Player header */}
                          <div className="flex items-center gap-3 px-4 py-3"
                            style={{ background: `linear-gradient(120deg, ${hex}18, transparent 70%)` }}>
                            {/* Headshot with silhouette fallback */}
                            <div className="relative shrink-0">
                              <div className="w-[56px] h-[56px] rounded-xl overflow-hidden relative"
                                style={{ background: `${hex}22`, border: `1px solid ${hex}40` }}>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <PlayerSilhouette hex={hex} />
                                </div>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={`https://a.espncdn.com/i/headshots/nfl/players/full/${p.player.toLowerCase().replace(/[^a-z ]/g, "").replace(/ /g, "-")}.png`}
                                  alt={p.player}
                                  className="absolute inset-0 w-full h-full object-cover object-top"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                                />
                              </div>
                              <div className="absolute -bottom-1.5 -right-1.5">
                                <LogoPlate hex={hex} src={nflLogoUrl(p.team)} code={p.team} size={22} radius={7} variant="clean" />
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <PosDot pos={p.pos} />
                                <p className="font-spot-sans font-black text-[15px] leading-tight truncate" style={{ color: "var(--text)" }}>{p.player}</p>
                              </div>
                              <p className="font-spot-sans font-semibold text-[10px]" style={{ color: "var(--text-3)" }}>
                                {p.team} · {p.matchup}
                              </p>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="block font-spot-sans font-black text-xl leading-tight" style={{ color: gc }}>{p.grade}</span>
                              <span className="block font-spot-mono font-bold text-[9px] uppercase tracking-[.10em]" style={{ color: "var(--text-faint)" }}>Edge {p.edge}</span>
                            </div>
                          </div>

                          {/* Body */}
                          <div className="px-4 pt-3 pb-4 flex flex-col gap-3">
                            <p className="font-spot-sans font-extrabold text-[11px] uppercase tracking-wider" style={{ color: "var(--text-2)" }}>{p.market}</p>

                            {/* Bar viz */}
                            <div className="relative h-10 rounded-xl" style={{ background: "rgba(255,255,255,.05)", border: "1px solid var(--hairline)" }}>
                              <div className="absolute top-0 bottom-0 z-[2]" style={{ left: `${viz.linePct}%`, width: 2, background: "rgba(255,255,255,.45)" }} />
                              <div className="absolute z-[3] whitespace-nowrap rounded px-1.5 py-0.5 font-spot-mono font-extrabold text-[9px]"
                                style={{ top: -8, left: `${viz.linePct}%`, transform: "translateX(-50%)", color: "var(--text-2)", background: "var(--panel)", border: "1px solid rgba(255,255,255,.12)" }}>
                                Line {viz.lineVal}
                              </div>
                              <div className="absolute flex items-center justify-end rounded-lg"
                                style={{
                                  top: 6, bottom: 6, left: `${viz.barLeft}%`, width: `${viz.barW}%`,
                                  background: viz.sideGreen ? "var(--green)" : "#f87171",
                                  boxShadow: `0 0 14px ${viz.sideGreen ? "rgba(52,211,153,.4)" : "rgba(248,113,113,.4)"}`,
                                  paddingRight: 8,
                                }}>
                                <span className="font-spot-mono font-extrabold text-[11px]" style={{ color: "#06070d" }}>{viz.modelVal}</span>
                              </div>
                              <span className="absolute font-spot-sans font-extrabold text-[8px] uppercase tracking-[.1em]"
                                style={{ bottom: 5, left: 8, color: "rgba(255,255,255,.28)" }}>Model proj.</span>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="rounded-lg px-2.5 py-1 font-spot-sans font-extrabold text-[11px]"
                                  style={viz.sideGreen
                                    ? { color: "var(--green)", background: "var(--green-bg)", border: "1px solid rgba(52,211,153,.28)" }
                                    : { color: "#fda4a4", background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.28)" }}>
                                  {viz.side}
                                </span>
                                <span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-muted)" }}>{p.odds}</span>
                              </div>
                              <button onClick={() => toggle(p.id)}
                                className="rounded-xl px-3 py-1.5 font-spot-sans font-extrabold text-[11px] whitespace-nowrap transition-all"
                                style={inSlip
                                  ? { color: "var(--purple-2)", background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }
                                  : { color: "var(--text-muted)", border: "1px solid var(--hairline)" }}>
                                {inSlip ? "In Slip" : "+ Add to Slip"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Parlay slip bar */}
      {slip.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-4" style={{ pointerEvents: "none" }}>
          <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-3 rounded-2xl px-5 py-3.5"
            style={{ background: "rgba(11,11,21,.96)", border: "1px solid var(--purple-line)", backdropFilter: "blur(16px)", boxShadow: "0 20px 60px rgba(0,0,0,.65)", pointerEvents: "auto" }}>
            <div>
              <span className="font-spot-sans font-black text-[13px]" style={{ color: "var(--text)" }}>
                <span style={{ color: "var(--purple-2)" }}>{slip.length}</span>-leg parlay
              </span>
              <span className="ml-2.5 font-spot-sans font-semibold text-[12px]" style={{ color: "var(--text-muted)" }}>
                Avg edge <span className="font-spot-mono font-extrabold" style={{ color: "var(--green)" }}>{slipEdge}</span>
                {" "}· Payout <span className="font-spot-mono font-extrabold" style={{ color: "var(--text)" }}>{slipPayout}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSave}
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-spot-sans font-extrabold text-[11px] transition-all"
                style={{ background: saved ? "var(--green-bg)" : "var(--purple-tint)", color: saved ? "var(--green)" : "var(--purple-2)", border: `1px solid ${saved ? "rgba(52,211,153,.32)" : "var(--purple-line)"}` }}>
                {saved ? <Check size={12} /> : <BookmarkPlus size={12} />}
                {saved ? "Saved!" : "Save Slip"}
              </button>
              <button onClick={() => setSlip([])} className="font-spot-sans font-bold text-xs" style={{ color: "var(--text-dim)" }}>Clear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
