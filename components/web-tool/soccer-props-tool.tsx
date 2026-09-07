"use client";

import { useState, useMemo } from "react";
import { BookmarkPlus, Check, Target } from "lucide-react";
import type { SoccerPlayerProp, SoccerPropType, SoccerPosition, SoccerLeagueKey } from "@/lib/soccer/types";
import { soccerGradeColor, getSoccerPlayerProps } from "@/lib/soccer/analytics";
import { soccerHeadshotUrl, leagueDef } from "@/lib/soccer/leagues";
import { saveSlip } from "@/lib/saved-slips";

const POS_TABS: SoccerPosition[] = ["All", "ST", "MF", "DF"];
const PROP_TABS: { key: SoccerPropType | "all"; label: string }[] = [
  { key: "all",     label: "All Props"  },
  { key: "goals",   label: "Goals"      },
  { key: "shots",   label: "Shots"      },
  { key: "assists", label: "Assists"    },
  { key: "cards",   label: "Cards"      },
];
const LEAGUE_TABS: { key: SoccerLeagueKey | "all"; label: string }[] = [
  { key: "all",         label: "All"       },
  { key: "epl",         label: "EPL"       },
  { key: "laliga",      label: "La Liga"   },
  { key: "seriea",      label: "Serie A"   },
  { key: "bundesliga",  label: "Bundesliga"},
  { key: "ligue1",      label: "Ligue 1"   },
  { key: "mls",         label: "MLS"       },
];

function GradeBadge({ grade }: { grade: string }) {
  const color = soccerGradeColor(grade);
  return (
    <span className="rounded-lg px-2 py-0.5 font-spot-sans font-black text-[11px]"
      style={{ color, background: `${color}1a`, border: `1px solid ${color}40` }}>
      {grade}
    </span>
  );
}

function PropCard({ prop, inSlip, onToggle }: {
  prop: SoccerPlayerProp;
  inSlip: boolean;
  onToggle: () => void;
}) {
  const gc = soccerGradeColor(prop.grade);
  const barPct = Math.min(98, Math.max(2, Math.round((prop.modelProj / (prop.line * 2)) * 100)));
  const linePct = 50;
  const sideGreen = prop.side === "OVER" || prop.side === "YES";
  const def = leagueDef(prop.league);

  return (
    <div className="rounded-[18px] overflow-hidden flex flex-col"
      style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>

      {/* Top accent */}
      <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${prop.teamHex}, ${gc})` }} />

      {/* Player header */}
      <div className="px-4 pt-3.5 pb-3 flex items-center gap-3"
        style={{ background: `linear-gradient(135deg, ${prop.teamHex}18, transparent 60%)` }}>
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={soccerHeadshotUrl(prop.espnPlayerId)}
            alt={prop.playerName}
            className="w-16 h-16 rounded-2xl object-cover object-top"
            style={{ background: `${prop.teamHex}30` }}
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              el.style.display = "none";
              const fb = el.nextElementSibling as HTMLElement | null;
              if (fb) fb.style.display = "flex";
            }}
          />
          <div className="w-16 h-16 rounded-2xl items-center justify-center font-spot-sans font-black text-[15px] text-white"
            style={{ display: "none", background: prop.teamHex }}>
            {prop.playerName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={prop.teamLogo} alt="" className="absolute -bottom-1 -right-1 w-6 h-6 object-contain rounded-lg"
            style={{ background: "var(--panel)", padding: "1px" }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-spot-sans font-black text-[14px] truncate" style={{ color: "var(--text)" }}>{prop.playerName}</p>
            <GradeBadge grade={prop.grade} />
          </div>
          <p className="font-spot-sans text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            {prop.position} · {prop.teamAbbr} · {prop.matchup}
          </p>
          <span className="inline-block mt-1 font-spot-sans font-extrabold text-[9px] uppercase tracking-[.10em] px-1.5 py-0.5 rounded-full"
            style={{ color: "#fff", background: def.color, opacity: 0.85 }}>
            {def.shortLabel}
          </span>
        </div>
      </div>

      {/* Market + bar */}
      <div className="px-4 py-3 border-t border-white/[0.05]">
        <p className="font-spot-sans font-extrabold text-[11px] uppercase tracking-[.08em] mb-2.5" style={{ color: "var(--text-muted)" }}>
          {prop.market}
        </p>

        <div className="relative h-9 rounded-xl overflow-hidden mb-1"
          style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)" }}>
          {/* Bar fill */}
          <div className="absolute inset-y-0 left-0 rounded-xl"
            style={{ width: `${barPct}%`, background: `${gc}28`, transition: "width 0.4s ease" }} />
          {/* Line marker */}
          <div className="absolute inset-y-0 w-px" style={{ left: `${linePct}%`, background: "rgba(255,255,255,.25)" }} />
          {/* Line label */}
          <div className="absolute top-1" style={{ left: `${linePct}%`, transform: "translateX(-50%)" }}>
            <span className="font-spot-mono font-bold text-[9px] px-1 rounded" style={{ color: "var(--text-dim)", background: "rgba(11,13,21,.7)" }}>
              Line {prop.line}
            </span>
          </div>
          {/* Model proj label */}
          <div className="absolute inset-y-0 flex items-center" style={{ left: `${barPct}%`, transform: "translateX(-110%)" }}>
            <span className="font-spot-mono font-black text-[13px]" style={{ color: gc }}>{prop.modelProj}</span>
          </div>
          {/* Proj label bottom */}
          <div className="absolute bottom-1 left-2">
            <span className="font-spot-mono font-bold text-[8px] uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
              MODEL PROJ.
            </span>
          </div>
        </div>
      </div>

      {/* Bottom action row */}
      <div className="px-4 pb-4 flex items-center justify-between gap-3">
        <span className="rounded-lg px-3 py-1.5 font-spot-sans font-extrabold text-[11px]"
          style={sideGreen
            ? { color: "var(--green)", background: "var(--green-bg)", border: "1px solid rgba(52,211,153,.3)" }
            : { color: "#fda4a4", background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.3)" }}>
          {prop.side} {prop.line}
        </span>
        <span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-muted)" }}>{prop.odds}</span>
        <button onClick={onToggle}
          className="flex-1 rounded-xl py-2 font-spot-sans font-extrabold text-[11px] text-center transition-all"
          style={inSlip
            ? { color: "var(--green)", background: "var(--green-bg)", border: "1px solid rgba(52,211,153,.32)" }
            : { color: "var(--purple-soft)", background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>
          {inSlip ? "✓ In Slip" : "+ Add to Slip"}
        </button>
      </div>
    </div>
  );
}

export function SoccerPropsTool() {
  const allProps = useMemo(() => getSoccerPlayerProps(), []);
  const [pos, setPos] = useState<SoccerPosition>("All");
  const [propType, setPropType] = useState<SoccerPropType | "all">("all");
  const [league, setLeague] = useState<SoccerLeagueKey | "all">("all");
  const [slip, setSlip] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const filtered = useMemo(() => allProps.filter((p) => {
    if (pos !== "All" && p.position !== pos) return false;
    if (propType !== "all" && p.propType !== propType) return false;
    if (league !== "all" && p.league !== league) return false;
    return true;
  }), [allProps, pos, propType, league]);

  const slipProps = useMemo(() => allProps.filter((p) => slip.includes(p.id)), [allProps, slip]);
  const slipEdge = slipProps.length
    ? Math.round(slipProps.reduce((s, p) => s + p.edge, 0) / slipProps.length)
    : 0;
  const slipPayout = slipProps.length ? `${(Math.pow(1.72, slipProps.length)).toFixed(2)}x` : "0x";

  function toggle(id: string) {
    setSlip((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function handleSave() {
    const legs = slipProps.map((p) => ({
      id: p.id, player: p.playerName, team: p.teamAbbr,
      market: p.market, side: p.side, line: p.line,
      model: p.modelProj, grade: p.grade, odds: p.odds,
    }));
    saveSlip({ sport: "MLB", legs, combinedPayout: slipPayout, avgEdge: slipEdge });
    setSaved(true);
    setTimeout(() => { setSaved(false); setSlip([]); }, 2000);
  }

  return (
    <div className="spotlight min-h-screen">
      {/* Header */}
      <div style={{ background: "var(--panel)", borderBottom: "1px solid var(--hairline)" }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5">
          <p className="spot-label mb-0.5" style={{ color: "var(--green)" }}>PROP PROJECTIONS</p>
          <h1 className="font-spot-sans font-black text-2xl sm:text-3xl uppercase leading-tight" style={{ color: "var(--text)", letterSpacing: "-.01em" }}>
            Soccer Props
          </h1>
          <p className="mt-1 font-spot-sans text-[12px]" style={{ color: "var(--text-muted)" }}>
            Model vs the book — goals, shots, assists & cards across Europe &amp; Americas
          </p>

          {/* Filters */}
          <div className="flex flex-wrap gap-y-2 gap-x-3 mt-4">
            {/* League */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {LEAGUE_TABS.map((t) => (
                <button key={t.key} onClick={() => setLeague(t.key)}
                  className="shrink-0 rounded-full px-3 py-1.5 font-spot-sans font-bold text-[11px] transition-all"
                  style={league === t.key
                    ? { background: "var(--green-bg)", color: "var(--green)", border: "1px solid rgba(52,211,153,.3)" }
                    : { background: "var(--panel-2)", color: "var(--text-muted)", border: "1px solid var(--hairline)" }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Prop type */}
            <div className="flex items-center gap-1">
              {PROP_TABS.map((t) => (
                <button key={t.key} onClick={() => setPropType(t.key)}
                  className="shrink-0 rounded-full px-3 py-1.5 font-spot-sans font-bold text-[11px] transition-all"
                  style={propType === t.key
                    ? { background: "var(--purple-tint)", color: "var(--purple-2)", border: "1px solid var(--purple-line)" }
                    : { background: "var(--panel-2)", color: "var(--text-muted)", border: "1px solid var(--hairline)" }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Position */}
            <div className="flex items-center gap-1">
              {POS_TABS.map((p) => (
                <button key={p} onClick={() => setPos(p)}
                  className="rounded-full px-3 py-1.5 font-spot-sans font-bold text-[11px] transition-all"
                  style={pos === p
                    ? { background: "rgba(52,211,153,.18)", color: "var(--green)", border: "1px solid rgba(52,211,153,.3)" }
                    : { background: "var(--panel-2)", color: "var(--text-muted)", border: "1px solid var(--hairline)" }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Props grid */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5">
        {filtered.length > 0 ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
            {filtered.map((p) => (
              <PropCard key={p.id} prop={p} inSlip={slip.includes(p.id)} onToggle={() => toggle(p.id)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="flex justify-center mb-3"><Target size={36} style={{ color: "var(--text-dim)" }} /></div>
            <p className="font-spot-sans font-bold text-sm" style={{ color: "var(--text-muted)" }}>No props match your filters</p>
          </div>
        )}
      </div>

      {/* Slip bar */}
      {slip.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-4" style={{ pointerEvents: "none" }}>
          <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-3 rounded-2xl px-5 py-3.5"
            style={{ background: "rgba(11,13,21,.96)", border: "1px solid rgba(52,211,153,.3)", backdropFilter: "blur(16px)", boxShadow: "0 20px 60px rgba(0,0,0,.65)", pointerEvents: "auto" }}>
            <div>
              <span className="font-spot-sans font-black text-[13px]" style={{ color: "var(--text)" }}>
                <span style={{ color: "var(--green)" }}>{slip.length}</span>-leg parlay
              </span>
              <span className="ml-2.5 font-spot-sans font-semibold text-[12px]" style={{ color: "var(--text-muted)" }}>
                Avg edge <span className="font-spot-mono font-extrabold" style={{ color: "var(--green)" }}>{slipEdge}</span>
                {" "}· Payout <span className="font-spot-mono font-extrabold" style={{ color: "var(--text)" }}>{slipPayout}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSave}
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-spot-sans font-extrabold text-[11px] transition-all"
                style={{ background: saved ? "var(--green-bg)" : "rgba(52,211,153,.12)", color: saved ? "var(--green)" : "#34d399", border: `1px solid ${saved ? "rgba(52,211,153,.4)" : "rgba(52,211,153,.28)"}` }}>
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
