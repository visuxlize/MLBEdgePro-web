"use client";

import { useMemo, useState } from "react";
import { nflTeamHex, nflLogoUrl } from "@/lib/nfl/teams";
import { LogoPlate, gradeColor } from "@/components/web-tool/spotlight";
import type { NflPlayerProp, NflPropPosition } from "@/lib/nfl/types";
import { saveSlip, calcPayout } from "@/lib/saved-slips";
import type { SlipLeg } from "@/lib/saved-slips";
import { Check, BookmarkPlus } from "lucide-react";

const POSITIONS: (NflPropPosition | "All")[] = ["All", "QB", "RB", "WR", "TE"];

// Determine the current week label from today's date
function currentWeekLabel(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth(); // 0-indexed
  const d = today.getDate();
  if (y === 2026) {
    if (m === 7 && d <= 15) return "HOF + Preseason Week 1";
    if (m === 7 && d <= 23) return "Preseason Week 2";
    if (m === 7 && d <= 29) return "Preseason Week 3";
    if (m >= 8 && m <= 11) return `Regular Season · Week ${Math.floor((d + (m - 8) * 31) / 7) + 1}`;
  }
  if (y === 2027) {
    if (m === 0 && d <= 12) return "Wild Card";
    if (m === 0 && d <= 19) return "Divisional Round";
    if (m === 0 && d <= 26) return "Conference Championships";
    if (m === 1 && d <= 9) return "Super Bowl LXI";
  }
  return "NFL Props";
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

// ESPN headshot from player name hash (best effort)
function nflHeadshotUrl(playerName: string): string {
  // Use ESPN's universal athlete search image format
  const slug = playerName.toLowerCase().replace(/[^a-z ]/g, "").replace(/ /g, "-");
  return `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${slug}.png&w=96&h=70&cb=1`;
}

export function NflPropsTool({ props }: { props: NflPlayerProp[] }) {
  const [pos, setPos] = useState<NflPropPosition | "All">("All");
  const [slip, setSlip] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const weekLabel = useMemo(() => currentWeekLabel(), []);
  const filtered = pos === "All" ? props : props.filter((p) => p.pos === pos);
  const slipProps = props.filter((p) => slip.includes(p.id));
  const slipEdge = slipProps.length ? Math.round(slipProps.reduce((a, p) => a + p.edge, 0) / slipProps.length) : 0;
  const slipPayout = calcPayout(slipProps.length);

  const toggle = (id: string) => setSlip((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  function handleSave() {
    const legs: SlipLeg[] = slipProps.map((p) => {
      const viz = propViz(p);
      return {
        id: p.id, player: p.player, team: p.team,
        market: p.market, side: viz.side, line: p.line,
        model: p.model, grade: p.grade, odds: p.odds,
      };
    });
    saveSlip({ sport: "NFL", legs, combinedPayout: slipPayout, avgEdge: slipEdge });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSlip([]);
  }

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6" style={{ paddingBottom: slip.length ? 96 : 24 }}>
        {/* Header */}
        <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
          <div>
            <p className="spot-label" style={{ color: "var(--purple-2)" }}>NFL Prop Projections</p>
            <h1 className="font-spot-sans text-3xl sm:text-4xl font-black leading-tight mt-1" style={{ color: "var(--text)" }}>
              {weekLabel} Props
            </h1>
            <p className="mt-1.5 font-spot-sans text-[13px]" style={{ color: "var(--text-muted)" }}>
              Model projection vs the book — build your parlay from the highest-edge picks
            </p>
          </div>
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

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center rounded-[20px]"
            style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
            <p className="font-spot-sans text-sm" style={{ color: "var(--text-muted)" }}>No props for this position yet.</p>
          </div>
        ) : (
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))" }}>
            {filtered.map((p) => {
              const viz = propViz(p);
              const gc = gradeColor(p.grade);
              const hex = nflTeamHex(p.team);
              const inSlip = slip.includes(p.id);
              return (
                <div key={p.id} className="rounded-[18px] overflow-hidden"
                  style={{ background: "var(--panel)", border: `1px solid ${inSlip ? "rgba(167,139,250,.4)" : "var(--hairline)"}`, boxShadow: inSlip ? `0 0 20px rgba(124,92,250,.15)` : "var(--shadow-card)" }}>
                  {/* Top accent line */}
                  <div style={{ height: 3, background: `linear-gradient(90deg, ${hex}, transparent)` }} />

                  {/* Player header */}
                  <div className="flex items-center gap-3 px-4 py-3" style={{ background: `linear-gradient(120deg, ${hex}1a, transparent 70%)` }}>
                    {/* Headshot */}
                    <div className="relative shrink-0">
                      <div className="w-[56px] h-[56px] rounded-xl overflow-hidden flex items-center justify-center"
                        style={{ background: `${hex}25`, border: `1px solid ${hex}40` }}>
                        <img
                          src={nflHeadshotUrl(p.player)}
                          alt={p.player}
                          className="w-full h-full object-cover object-top"
                          onError={(e) => {
                            const el = e.currentTarget;
                            el.style.display = "none";
                            const fallback = el.parentElement?.querySelector(".headshot-fallback") as HTMLElement | null;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                        <span className="headshot-fallback font-spot-sans font-black text-[18px] hidden w-full h-full items-center justify-center"
                          style={{ color: hex }}>
                          {p.player.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                      <div className="absolute -bottom-1.5 -right-1.5">
                        <LogoPlate hex={hex} src={nflLogoUrl(p.team)} code={p.team} size={22} radius={7} variant="clean" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-spot-sans font-black text-[16px] leading-tight truncate" style={{ color: "var(--text)" }}>{p.player}</p>
                      <p className="mt-0.5 font-spot-sans font-semibold text-[10px]" style={{ color: "var(--text-3)" }}>
                        {p.pos} · {p.team} · {p.matchup}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block font-spot-sans font-black text-xl" style={{ color: gc }}>{p.grade}</span>
                      <span className="block font-spot-sans font-bold text-[9px] uppercase tracking-[.10em]" style={{ color: "var(--text-faint)" }}>Edge {p.edge}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-4 pt-3 pb-4 flex flex-col gap-3">
                    <p className="font-spot-sans font-bold text-xs" style={{ color: "var(--text-2)" }}>{p.market}</p>

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

                    {/* Footer row */}
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
                        {inSlip ? "✓ In Slip" : "+ Add to Slip"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Parlay slip bar */}
      {slip.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-4" style={{ pointerEvents: "none" }}>
          <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-3 rounded-2xl px-5 py-3.5"
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
