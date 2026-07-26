"use client";

import { useMemo, useState } from "react";
import { wnbaTeamHex, wnbaLogoUrl, wnbaHeadshotUrl } from "@/lib/wnba/teams";
import { LogoPlate, WnbaHeadshot, gradeColor, alpha } from "@/components/web-tool/spotlight";
import type { WnbaPlayerProp, WnbaPropPosition } from "@/lib/wnba/types";

const POSITIONS: (WnbaPropPosition | "All")[] = ["All", "PG", "SG", "SF", "PF", "C"];

function propViz(p: WnbaPlayerProp) {
  const side = p.over ? "OVER" : "UNDER";
  const sideGreen = p.over;
  const maxScale = p.line * 1.8;
  const linePct = Math.min(88, (p.line / maxScale) * 100);
  const modelPct = Math.min(96, (p.model / maxScale) * 100);
  const barLeft = Math.min(linePct, modelPct);
  const barW = Math.max(4, Math.abs(modelPct - linePct));
  return { side, sideGreen, linePct, barLeft, barW };
}

export function WnbaPropsTool({ props }: { props: WnbaPlayerProp[] }) {
  const [pos, setPos] = useState<WnbaPropPosition | "All">("All");
  const [slip, setSlip] = useState<string[]>([]);

  const filtered = pos === "All" ? props : props.filter((p) => p.pos === pos);
  const slipProps = props.filter((p) => slip.includes(p.id));
  const slipEdge = slipProps.length ? Math.round(slipProps.reduce((a, p) => a + p.edge, 0) / slipProps.length) : 0;
  const slipPayout = useMemo(() => (slipProps.length ? slipProps.reduce((a) => a * 1.72, 1).toFixed(2) + "x" : "—"), [slipProps.length]);

  const toggle = (id: string) => setSlip((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6" style={{ paddingBottom: slip.length ? 96 : 24 }}>
        <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
          <div>
            <p className="spot-label" style={{ color: "#2dd4bf" }}>Prop Projections</p>
            <h1 className="font-spot-sans text-3xl sm:text-4xl font-black leading-tight mt-1" style={{ color: "var(--text)" }}>Today&rsquo;s WNBA Props</h1>
            <p className="mt-1.5 font-spot-sans text-[13px]" style={{ color: "var(--text-muted)" }}>
              Model projection vs the book. Green bar = value on the over, red = under.
            </p>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {POSITIONS.map((label) => {
              const active = label === pos;
              return (
                <button
                  key={label}
                  onClick={() => setPos(label)}
                  className="rounded-full px-3.5 py-1.5 font-spot-sans font-extrabold text-[11px] tracking-[.06em]"
                  style={active ? { background: "linear-gradient(135deg,#2dd4bf,#5eead4)", color: "#06070d" } : { color: "var(--text-muted)", border: "1px solid var(--hairline)" }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <p className="font-spot-sans text-sm" style={{ color: "var(--text-muted)" }}>No props for this position yet.</p>
          </div>
        ) : (
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))" }}>
            {filtered.map((p) => {
              const viz = propViz(p);
              const gc = gradeColor(p.grade);
              const inSlip = slip.includes(p.id);
              return (
                <div key={p.id} className="rounded-[18px] overflow-hidden" style={{ background: "var(--panel)", border: "1px solid var(--hairline)", boxShadow: "var(--shadow-card)" }}>
                  <div className="relative flex items-center gap-3.5 px-4 pt-4 pb-3.5 overflow-hidden" style={{ background: `linear-gradient(135deg, ${alpha(wnbaTeamHex(p.team), "22")}, transparent 68%)` }}>
                    <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${wnbaTeamHex(p.team)}, transparent)` }} />
                    <div className="relative shrink-0">
                      <WnbaHeadshot hex={wnbaTeamHex(p.team)} src={wnbaHeadshotUrl(p.espnId)} name={p.player} size={72} />
                      <div className="absolute -bottom-1.5 -right-1.5">
                        <LogoPlate hex={wnbaTeamHex(p.team)} src={wnbaLogoUrl(p.team)} code={p.team} size={26} radius={8} variant="clean" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-spot-sans font-black text-[17px] leading-tight truncate" style={{ color: "var(--text)" }}>{p.player}</p>
                      <p className="mt-1 font-spot-sans font-semibold text-[11px]" style={{ color: "var(--text-3)" }}>{p.pos} &middot; {p.team} &middot; {p.matchup}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block font-spot-sans font-black text-xl" style={{ color: gc }}>{p.grade}</span>
                      <span className="block font-spot-sans font-bold text-[9px] uppercase tracking-[.1em]" style={{ color: "var(--text-faint)" }}>Edge {p.edge}</span>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col gap-3.5">
                    <p className="font-spot-sans font-bold text-xs" style={{ color: "var(--text-2)" }}>{p.market}</p>
                    <div className="relative h-11 rounded-xl" style={{ background: "rgba(255,255,255,.05)", border: "1px solid var(--hairline)" }}>
                      <div className="absolute top-0 bottom-0 z-[2]" style={{ left: `${viz.linePct}%`, width: 2, background: "rgba(255,255,255,.5)" }} />
                      <div className="absolute z-[3] whitespace-nowrap rounded px-1.5 py-0.5 font-spot-mono font-extrabold text-[9px]" style={{ top: -8, left: `${viz.linePct}%`, transform: "translateX(-50%)", color: "var(--text-2)", background: "var(--panel)", border: "1px solid rgba(255,255,255,.12)" }}>
                        Line {p.line}
                      </div>
                      <div
                        className="absolute flex items-center justify-end rounded-lg overflow-hidden"
                        style={{
                          top: 6, bottom: 6, left: `${viz.barLeft}%`, width: `${viz.barW}%`,
                          background: viz.sideGreen ? "var(--green)" : "#f87171",
                          boxShadow: `0 0 16px ${viz.sideGreen ? "rgba(52,211,153,.4)" : "rgba(248,113,113,.4)"}`,
                          paddingRight: 9,
                          ["--bar-target-width" as string]: `${viz.barW}%`,
                          animation: "bar-grow-w .9s cubic-bezier(.22,1,.36,1) .1s both",
                        }}
                      >
                        <span className="font-spot-mono font-extrabold text-[11px]" style={{ color: "#06070d" }}>{p.model}</span>
                      </div>
                      <span className="absolute font-spot-sans font-extrabold text-[8px] uppercase tracking-[.1em]" style={{ bottom: 6, left: 8, color: "rgba(255,255,255,.3)" }}>Model proj.</span>
                    </div>
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="rounded-lg px-2.5 py-1 font-spot-sans font-extrabold text-[11px]"
                          style={viz.sideGreen
                            ? { color: "var(--green)", background: "var(--green-bg)", border: "1px solid rgba(52,211,153,.3)" }
                            : { color: "#fda4a4", background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.3)" }}
                        >
                          {viz.side}
                        </span>
                        <span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-muted)" }}>{p.odds}</span>
                      </div>
                      <button
                        onClick={() => toggle(p.id)}
                        className="rounded-xl px-3.5 py-2 font-spot-sans font-extrabold text-[11px] whitespace-nowrap"
                        style={inSlip
                          ? { color: "var(--green)", background: "var(--green-bg)", border: "1px solid rgba(52,211,153,.32)" }
                          : { color: "var(--purple-soft)", background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}
                      >
                        {inSlip ? "✓ In slip" : "+ Add to Slip"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {slip.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-5 pb-4" style={{ pointerEvents: "none" }}>
          <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-3.5 rounded-2xl px-4.5 py-3.5" style={{ background: "rgba(17,15,30,.94)", border: "1px solid var(--purple-line)", backdropFilter: "blur(14px)", boxShadow: "0 20px 60px rgba(0,0,0,.6)", pointerEvents: "auto" }}>
            <span className="font-spot-sans font-bold text-[13px]" style={{ color: "var(--text-2)" }}>
              <span className="font-black" style={{ color: "var(--purple-2)" }}>{slip.length}</span>-leg parlay &middot; avg edge{" "}
              <span className="font-spot-mono font-extrabold" style={{ color: "var(--green)" }}>{slipEdge}</span> &middot; est. payout{" "}
              <span className="font-spot-mono font-extrabold" style={{ color: "var(--text)" }}>{slipPayout}</span>
            </span>
            <button onClick={() => setSlip([])} className="font-spot-sans font-bold text-xs" style={{ color: "var(--text-muted)" }}>Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}
