"use client";

import { useMemo, useState } from "react";
import type { ElementType } from "react";
import {
  Check, Flame, Layers, Plus, Receipt, Trash2, X,
  Zap, TrendingUp, TrendingDown, Wind, Thermometer,
  Activity, ChevronRight, BookOpen,
} from "lucide-react";
import { playerHeadshotUrl, teamLogoUrl } from "@/lib/mlb/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PropType = "HR" | "Hit" | "2+ Hits" | "2+ Bases" | "Pitcher K's" | "Total Runs";

export interface PropRow {
  id: number;
  playerName: string;
  position: string;
  teamId: number;
  pct: number;
  pitcherName: string;
  subStats: string;
}

export interface PitcherProp {
  id: number;
  name: string;
  teamName: string;
  opponent: string;
  era: string;
  whip: string;
  wins: number;
  losses: number;
  k9: string;
  projectedKs: number;
  line: number;
  overPct: number;
  underPct: number;
}

export interface TotalRunsProp {
  line: number;
  expectedRuns: number;
  expectedHome: number;
  expectedAway: number;
  overPct: number;
  underPct: number;
  awayTeam: string;
  homeTeam: string;
  homeLineupOPS: number;
  awayLineupOPS: number;
  pitchingFactor: number;
  weatherFactor: number;
  lineupFactor: number;
  factors: Array<{ label: string; impact: "over" | "under" | "neutral"; description: string }>;
  awayPitcher: { name: string; era: number | null; whip: number | null; k9: number | null; wins: number; losses: number };
  homePitcher: { name: string; era: number | null; whip: number | null; k9: number | null; wins: number; losses: number };
  venue: string;
  weather: { tempF: number; windMph: number; windDirection: string; conditions: string; humidity: number } | null;
}

export interface PropGame {
  gamePk: number;
  gameDate: string;
  status: string;
  venue: string;
  away: { id: number; name: string; pitcher: string };
  home: { id: number; name: string; pitcher: string };
  props: Record<"HR" | "Hit" | "2+ Hits" | "2+ Bases", PropRow[]>;
  pitchers: PitcherProp[];
  totalRuns: TotalRunsProp;
}

interface SlipEntry {
  id: string;
  description: string;
  probability: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PROP_TABS: Array<{ id: PropType; label: string; icon: ElementType; color: string }> = [
  { id: "HR",          label: "Home Run",   icon: Flame,       color: "#FF7828" },
  { id: "Hit",         label: "1+ Hit",     icon: Receipt,     color: "#50C882" },
  { id: "2+ Hits",     label: "2+ Hits",    icon: Layers,      color: "#818cf8" },
  { id: "2+ Bases",    label: "2+ Bases",   icon: Activity,    color: "#2dd4bf" },
  { id: "Pitcher K's", label: "Pitcher Ks", icon: Zap,         color: "#fbbf24" },
  { id: "Total Runs",  label: "Total Runs", icon: TrendingUp,  color: "#60B4F0" },
];

function propColor(pct: number) {
  if (pct >= 65) return "#50C882";
  if (pct >= 40) return "#FF7828";
  return "#EB505A";
}
function propLabel(pct: number) {
  if (pct >= 70) return "Strong";
  if (pct >= 55) return "Value";
  if (pct >= 40) return "Possible";
  if (pct >= 25) return "Risky";
  return "Long Shot";
}
function combinedProbability(slip: SlipEntry[]) {
  return slip.reduce((a, e) => a * (e.probability / 100), 1) * 100;
}
function gameTimeLabel(game: PropGame) {
  if (game.status === "Final" || game.status === "Game Over") return "Final";
  if (game.status === "In Progress") return "Live";
  return new Date(game.gameDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function abbr(name: string) { return name.split(" ").pop() ?? name; }

// ── Game selector dropdown ────────────────────────────────────────────────────

function GameSelector({ games, selectedPk, onSelect }: {
  games: PropGame[]; selectedPk: number; onSelect: (pk: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = games.find((g) => g.gamePk === selectedPk) ?? games[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#111622] px-4 py-3.5 hover:border-white/[0.12] transition-colors"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={teamLogoUrl(selected.away.id)} alt="" className="w-7 h-7 object-contain shrink-0" />
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-black text-white">
            {abbr(selected.away.name)} <span className="text-white/30 font-normal">@</span> {abbr(selected.home.name)}
          </p>
          <p className="text-[11px] text-white/35 truncate">
            {selected.away.pitcher.split(" ").pop()} vs {selected.home.pitcher.split(" ").pop()} · {selected.venue}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            selected.status === "In Progress" ? "bg-red-500/15 text-red-400" :
            selected.status === "Final" ? "bg-white/5 text-white/30" :
            "bg-[#FF7828]/15 text-[#FF7828]"
          }`}>{gameTimeLabel(selected)}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={teamLogoUrl(selected.home.id)} alt="" className="w-7 h-7 object-contain" />
          <ChevronRight size={14} className={`text-white/30 transition-transform ${open ? "rotate-90" : ""}`} strokeWidth={2} />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 rounded-2xl border border-white/[0.07] bg-[#111622] shadow-2xl overflow-hidden">
          {games.map((g) => {
            const active = g.gamePk === selectedPk;
            const isLive = g.status === "In Progress";
            return (
              <button
                key={g.gamePk}
                onClick={() => { onSelect(g.gamePk); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.04] transition-colors text-left border-b border-white/[0.04] last:border-0 ${active ? "bg-[#FF7828]/[0.06]" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={teamLogoUrl(g.away.id)} alt="" className="w-6 h-6 object-contain shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${active ? "text-[#FF7828]" : "text-white"}`}>
                    {abbr(g.away.name)} @ {abbr(g.home.name)}
                  </p>
                  <p className="text-[10px] text-white/30 truncate">{g.venue}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isLive ? "bg-red-500/15 text-red-400" :
                    g.status === "Final" ? "bg-white/5 text-white/25" :
                    "bg-[#FF7828]/15 text-[#FF7828]"
                  }`}>
                    {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse mr-1" />}
                    {gameTimeLabel(g)}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={teamLogoUrl(g.home.id)} alt="" className="w-6 h-6 object-contain" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Prop type tabs ────────────────────────────────────────────────────────────

function PropTabs({ active, onChange }: { active: PropType; onChange: (t: PropType) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {PROP_TABS.map(({ id, label, icon: Icon, color }) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
              isActive
                ? "border-transparent text-white shadow-sm"
                : "border-white/[0.07] text-white/40 hover:text-white hover:border-white/[0.14] bg-[#111622]"
            }`}
            style={isActive ? { backgroundColor: `${color}20`, borderColor: `${color}40`, color } : {}}
          >
            <Icon size={12} strokeWidth={2.5} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Batter prop card (grid) ───────────────────────────────────────────────────

function BatterCard({ rank, row, propType, inSlip, onAdd }: {
  rank: number; row: PropRow; propType: PropType; inSlip: boolean;
  onAdd: (e: SlipEntry) => void;
}) {
  const color = propColor(row.pct);
  const label = propLabel(row.pct);
  const isHot = row.pct >= 65;

  return (
    <div className={`relative rounded-2xl border bg-[#111622] overflow-hidden transition-all ${
      isHot ? "border-white/[0.12]" : "border-white/[0.07]"
    }`}>
      {/* Rank badge */}
      <div className="absolute top-3 left-3 w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center">
        <span className="text-[9px] font-black text-white/30">{rank}</span>
      </div>

      {/* Hot indicator */}
      {isHot && (
        <div className="absolute top-3 right-3">
          <Flame size={13} style={{ color }} strokeWidth={2} />
        </div>
      )}

      {/* Player info */}
      <div className="pt-10 pb-3 px-4 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 bg-white/5 mb-2"
          style={{ borderColor: `${color}40` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={playerHeadshotUrl(row.id)}
            alt={row.playerName}
            className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </div>

        {/* Probability badge — clearly below the photo */}
        <div
          className="px-2.5 py-1 rounded-full text-[10px] font-black border mb-2"
          style={{ color, borderColor: `${color}50`, backgroundColor: `${color}18` }}
        >
          {row.pct}%
        </div>

        <p className="text-sm font-black text-white leading-tight">{row.playerName}</p>
        <p className="text-[10px] text-white/30 mt-0.5">{row.position}</p>
        <p className="text-[10px] text-white/40 mt-1.5 leading-snug">{row.subStats}</p>
        <p className="text-[10px] text-white/25 mt-0.5">vs {row.pitcherName.split(" ").pop()}</p>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.05] px-4 py-3 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-base font-black" style={{ color }}>{row.pct}%</span>
          <span className="text-[9px] font-bold" style={{ color: color + "80" }}>{label}</span>
        </div>

        {/* Progress arc */}
        <div className="flex-1 mx-3">
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${row.pct}%`, backgroundColor: color }} />
          </div>
        </div>

        <button
          onClick={() => onAdd({ id: `${row.id}-${propType}`, description: `${row.playerName} ${propType} vs ${row.pitcherName.split(" ").pop()}`, probability: row.pct })}
          disabled={inSlip}
          className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all shrink-0 ${
            inSlip
              ? "border-[#50C882]/40 bg-[#50C882]/10 text-[#50C882]"
              : "border-[#FF7828]/30 bg-[#FF7828]/10 text-[#FF7828] hover:bg-[#FF7828]/18"
          }`}
        >
          {inSlip ? <Check size={11} /> : <Plus size={11} />}
          {inSlip ? "Added" : "Slip"}
        </button>
      </div>
    </div>
  );
}

// ── Pitcher K card ────────────────────────────────────────────────────────────

function PitcherKCard({ pitcher, slip, onAdd }: {
  pitcher: PitcherProp; slip: SlipEntry[]; onAdd: (e: SlipEntry) => void;
}) {
  const overId  = `${pitcher.id}-k-over`;
  const underId = `${pitcher.id}-k-under`;
  const overIn  = slip.some((e) => e.id === overId);
  const underIn = slip.some((e) => e.id === underId);

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111622] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.05]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-black text-white">{pitcher.name}</p>
            <p className="text-xs text-white/35">{pitcher.teamName} vs {pitcher.opponent}</p>
          </div>
          <div className="flex gap-3 text-center shrink-0">
            {[
              { v: pitcher.k9,                     l: "K/9",  c: "#fbbf24" },
              { v: pitcher.era,                    l: "ERA",  c: "#FF7828" },
              { v: `${pitcher.wins}-${pitcher.losses}`, l: "W-L", c: "#50C882" },
            ].map(({ v, l, c }) => (
              <div key={l}>
                <p className="text-sm font-black" style={{ color: c }}>{v}</p>
                <p className="text-[9px] font-bold text-white/25 uppercase tracking-wider">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Projected line hero */}
        <div className="mt-4 flex items-center justify-between rounded-xl border border-[#fbbf24]/20 bg-[#fbbf24]/[0.06] px-4 py-3">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase">Projected Line</p>
            <p className="text-3xl font-black text-[#fbbf24] mt-0.5">{pitcher.line} Ks</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase">Avg / Start</p>
            <p className="text-xl font-black text-white mt-0.5">{pitcher.projectedKs}</p>
          </div>
        </div>
      </div>

      {/* O/U options */}
      <div className="p-5 space-y-3">
        {[
          { id: overId,  label: `Over ${pitcher.line} Ks`,  pct: pitcher.overPct,  color: "#50C882", inSlip: overIn,  Icon: TrendingUp  },
          { id: underId, label: `Under ${pitcher.line} Ks`, pct: pitcher.underPct, color: "#EB505A", inSlip: underIn, Icon: TrendingDown },
        ].map((item) => (
          <div key={item.id} className="rounded-xl border border-white/[0.05] bg-[#0D1117] p-3.5">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <item.Icon size={13} style={{ color: item.color }} strokeWidth={2.5} />
                <p className="text-sm font-bold text-white">{item.label}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-black" style={{ color: item.color }}>{item.pct}%</span>
                <button
                  onClick={() => onAdd({ id: item.id, description: `${pitcher.name} ${item.label}`, probability: item.pct })}
                  disabled={item.inSlip}
                  className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all ${
                    item.inSlip
                      ? "border-[#50C882]/40 bg-[#50C882]/10 text-[#50C882]"
                      : "border-white/[0.08] bg-white/[0.04] text-white/50 hover:bg-white/[0.08]"
                  }`}
                >
                  {item.inSlip ? <><Check size={10} className="mr-0.5" />Added</> : "Add Slip"}
                </button>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Total Runs full breakdown card ────────────────────────────────────────────

function FactorRow({ f }: { f: { label: string; impact: "over" | "under" | "neutral"; description: string } }) {
  const colors = { over: "#50C882", under: "#EB505A", neutral: "#818cf8" };
  const Icons  = { over: TrendingUp, under: TrendingDown, neutral: Activity };
  const color  = colors[f.impact];
  const Icon   = Icons[f.impact];
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/[0.04] last:border-0">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center mt-0.5 shrink-0"
        style={{ backgroundColor: `${color}15` }}>
        <Icon size={11} style={{ color }} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="text-xs font-black text-white">{f.label}</p>
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full border"
            style={{ color, borderColor: `${color}30`, backgroundColor: `${color}10` }}>
            {f.impact.toUpperCase()}
          </span>
        </div>
        <p className="text-[11px] text-white/40 leading-relaxed">{f.description}</p>
      </div>
    </div>
  );
}

function TotalRunsCard({ data, slip, onAdd }: {
  data: TotalRunsProp; slip: SlipEntry[]; onAdd: (e: SlipEntry) => void;
}) {
  const key     = `${data.awayTeam}-${data.homeTeam}`;
  const overId  = `${key}-runs-over`;
  const underId = `${key}-runs-under`;
  const overIn  = slip.some((e) => e.id === overId);
  const underIn = slip.some((e) => e.id === underId);
  const lean    = data.overPct >= 54 ? "OVER" : data.underPct >= 54 ? "UNDER" : "PUSH";
  const leanClr = lean === "OVER" ? "#50C882" : lean === "UNDER" ? "#EB505A" : "#818cf8";
  const awAbbr  = abbr(data.awayTeam);
  const hmAbbr  = abbr(data.homeTeam);

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: `${leanClr}25` }}>
        <div className="px-6 py-5 flex items-center justify-between" style={{ backgroundColor: `${leanClr}08` }}>
          <div>
            <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase mb-1">Model Total</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black" style={{ color: leanClr }}>{data.expectedRuns}</span>
              <span className="text-white/30">runs</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase mb-1">O/U Line</p>
            <p className="text-4xl font-black text-white">{data.line}</p>
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full border"
              style={{ color: leanClr, borderColor: `${leanClr}40`, backgroundColor: `${leanClr}15` }}>
              <span className="text-xs font-black">LEAN {lean}</span>
            </div>
          </div>
        </div>

        {/* Per-team split */}
        <div className="grid grid-cols-2 divide-x divide-white/[0.05] border-t border-white/[0.05] bg-[#111622]">
          <div className="px-5 py-4 text-center">
            <p className="text-[10px] text-white/30 mb-1">{awAbbr} Expected</p>
            <p className="text-2xl font-black text-[#818cf8]">{data.expectedAway}</p>
            <p className="text-[9px] text-white/20 mt-0.5">vs {data.homePitcher.name.split(" ").pop()}</p>
          </div>
          <div className="px-5 py-4 text-center">
            <p className="text-[10px] text-white/30 mb-1">{hmAbbr} Expected</p>
            <p className="text-2xl font-black text-[#FF7828]">{data.expectedHome}</p>
            <p className="text-[9px] text-white/20 mt-0.5">vs {data.awayPitcher.name.split(" ").pop()}</p>
          </div>
        </div>
      </div>

      {/* Pitchers */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5">
        <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-4">Starting Pitchers</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[{ s: awAbbr, p: data.awayPitcher }, { s: hmAbbr, p: data.homePitcher }].map(({ s, p }) => (
            <div key={s} className="rounded-xl border border-white/[0.06] bg-[#0D1117] p-3">
              <p className="text-xs font-black text-white truncate">{p.name}</p>
              <p className="text-[10px] text-white/25 mb-2">{s} · {p.wins}-{p.losses}</p>
              <div className="grid grid-cols-3 gap-1 text-center">
                {[
                  { v: p.era  !== null ? p.era.toFixed(2)  : "—", l: "ERA",  c: "#FF7828" },
                  { v: p.whip !== null ? p.whip.toFixed(2) : "—", l: "WHIP", c: "#818cf8" },
                  { v: p.k9   !== null ? p.k9.toFixed(1)   : "—", l: "K/9",  c: "#50C882" },
                ].map(({ v, l, c }) => (
                  <div key={l}>
                    <p className="text-sm font-black" style={{ color: c }}>{v}</p>
                    <p className="text-[8px] text-white/25 uppercase tracking-wider">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Lineup OPS */}
        <div className="space-y-2">
          {[
            { label: `${awAbbr} lineup`, ops: data.awayLineupOPS, color: "#818cf8" },
            { label: `${hmAbbr} lineup`, ops: data.homeLineupOPS, color: "#FF7828" },
          ].map(({ label, ops, color }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/35">{label} OPS</span>
                <span className="text-xs font-black text-white">.{Math.round(ops * 1000)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (ops / 0.9) * 100)}%`, backgroundColor: color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weather */}
      {data.weather && (
        <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5">
          <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-3">Conditions</p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { icon: Thermometer, v: `${data.weather.tempF}°`, l: "Temp",  c: "#FF7828" },
              { icon: Wind,        v: `${data.weather.windMph}`, l: "Wind mph", c: "#818cf8" },
              { icon: Wind,        v: data.weather.windDirection, l: "Direction", c: "#2dd4bf" },
              { icon: Activity,    v: data.weather.conditions.slice(0,8), l: "Sky", c: "#60B4F0" },
            ].map(({ icon: Icon, v, l, c }) => (
              <div key={l} className="rounded-xl border border-white/[0.05] bg-[#0D1117] p-2.5 text-center">
                <Icon size={12} style={{ color: c }} strokeWidth={1.8} className="mx-auto mb-1" />
                <p className="text-sm font-black text-white">{v}</p>
                <p className="text-[8px] text-white/25 uppercase tracking-wider mt-0.5">{l}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs">
            {data.weatherFactor > 1.02
              ? <><TrendingUp size={11} className="text-[#50C882]" /><span className="text-[#50C882] font-bold">Weather boosts offense</span></>
              : data.weatherFactor < 0.98
              ? <><TrendingDown size={11} className="text-[#EB505A]" /><span className="text-[#EB505A] font-bold">Weather suppresses offense</span></>
              : <><Activity size={11} className="text-[#818cf8]" /><span className="text-[#818cf8]">Weather is neutral</span></>
            }
            <span className="text-white/20">· {((data.weatherFactor - 1) * 100).toFixed(1)}% adjustment</span>
          </div>
        </div>
      )}

      {/* Why this lean */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5">
        <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-0.5">Why the Model Leans {lean}</p>
        <p className="text-[11px] text-white/30 mb-3">Key factors driving this total</p>
        {data.factors.map((f, i) => <FactorRow key={i} f={f} />)}
      </div>

      {/* Bet buttons */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5 space-y-3">
        <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase">Add to Slip</p>
        {[
          { id: overId,  label: `Over ${data.line}`,  pct: data.overPct,  color: "#50C882", inSlip: overIn,  Icon: TrendingUp  },
          { id: underId, label: `Under ${data.line}`, pct: data.underPct, color: "#EB505A", inSlip: underIn, Icon: TrendingDown },
        ].map((item) => (
          <div key={item.id} className="rounded-xl border border-white/[0.05] bg-[#0D1117] p-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <item.Icon size={13} style={{ color: item.color }} strokeWidth={2.5} />
                <p className="text-sm font-bold text-white">{item.label} Total Runs</p>
                {lean === (item.id.includes("over") ? "OVER" : "UNDER") && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full border"
                    style={{ color: item.color, borderColor: `${item.color}35`, backgroundColor: `${item.color}12` }}>
                    MODEL LEAN
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xl font-black" style={{ color: item.color }}>{item.pct}%</span>
                <button
                  onClick={() => onAdd({ id: item.id, description: `${awAbbr} @ ${hmAbbr} ${item.label} Total Runs`, probability: item.pct })}
                  disabled={item.inSlip}
                  className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                    item.inSlip
                      ? "border-[#50C882]/40 bg-[#50C882]/10 text-[#50C882]"
                      : "border-white/[0.08] bg-white/[0.04] text-white/50 hover:bg-white/[0.08]"
                  }`}
                >
                  {item.inSlip ? <><Check size={10} className="mr-0.5" />Added</> : "Add Slip"}
                </button>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Slip panel ────────────────────────────────────────────────────────────────

const BET_TRACKER_KEY = "mlbedge_bet_tracker_v1";

function saveToTracker(slip: SlipEntry[]) {
  try {
    const existing = JSON.parse(localStorage.getItem(BET_TRACKER_KEY) ?? "[]");
    const newSlip = {
      id:          crypto.randomUUID(),
      createdAt:   new Date().toISOString(),
      status:      "pending",
      wager:       10,
      legs: slip.map((s) => ({
        id:          s.id,
        description: s.description,
        probability: s.probability,
        odds:        "",  // to be filled in bet tracker
      })),
    };
    localStorage.setItem(BET_TRACKER_KEY, JSON.stringify([newSlip, ...existing]));
    return true;
  } catch { return false; }
}

function SlipPanel({ slip, onRemove, onClear }: {
  slip: SlipEntry[]; onRemove: (id: string) => void; onClear: () => void;
}) {
  const combined = combinedProbability(slip);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (saveToTracker(slip)) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111622] overflow-hidden lg:sticky lg:top-20">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
        <div>
          <p className="text-base font-black text-white">Your Slip</p>
          <p className="text-xs text-white/30">{slip.length} leg{slip.length === 1 ? "" : "s"}</p>
        </div>
        {slip.length > 0 && (
          <button onClick={onClear}
            className="flex items-center gap-1 rounded-xl border border-[#EB505A]/25 bg-[#EB505A]/10 px-2.5 py-1.5 text-xs font-bold text-[#EB505A]">
            <Trash2 size={12} />
            Clear
          </button>
        )}
      </div>

      {slip.length === 0 ? (
        <div className="py-12 text-center px-5">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
            <Receipt size={20} className="text-white/15" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-white/25 font-bold mb-1">Slip is empty</p>
          <p className="text-xs text-white/18">Tap &ldquo;Slip&rdquo; on any prop to add a leg</p>
        </div>
      ) : (
        <div className="p-4 space-y-2">
          {slip.map((entry) => (
            <div key={entry.id}
              className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-[#0D1117] p-3">
              <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: propColor(entry.probability) }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white leading-snug">{entry.description}</p>
                <p className="text-[10px] font-black mt-1" style={{ color: propColor(entry.probability) }}>
                  {entry.probability}% · {propLabel(entry.probability)}
                </p>
              </div>
              <button onClick={() => onRemove(entry.id)} className="text-white/20 hover:text-white/50 mt-0.5 shrink-0">
                <X size={14} />
              </button>
            </div>
          ))}

          {slip.length > 1 && (
            <div className="rounded-xl border border-[#50C882]/20 bg-[#50C882]/[0.06] p-4 mt-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-white/40">Combined probability</p>
                <p className="text-2xl font-black text-[#50C882]">{combined.toFixed(combined < 10 ? 1 : 0)}%</p>
              </div>
              <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                <div className="h-full rounded-full bg-[#50C882]" style={{ width: `${Math.min(combined * 4, 100)}%` }} />
              </div>
              <p className="text-[10px] text-white/25 mt-2">
                {combined >= 30 ? "Solid multi-leg" : combined >= 15 ? "Moderate parlay" : "High-risk parlay"}
              </p>
            </div>
          )}
        </div>
      )}

      {slip.length > 0 && (
        <div className="px-4 pb-4 space-y-2">
          {/* Save to Bet Tracker */}
          <button
            onClick={handleSave}
            className={`w-full h-11 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all border ${
              saved
                ? "border-[#50C882]/40 bg-[#50C882]/10 text-[#50C882]"
                : "border-[#FF7828]/30 bg-[#FF7828]/10 text-[#FF7828] hover:bg-[#FF7828]/18"
            }`}
          >
            {saved ? (
              <><Check size={15} strokeWidth={2.5} />Saved to Bet Tracker!</>
            ) : (
              <><BookOpen size={15} strokeWidth={2} />Save to Bet Tracker</>
            )}
          </button>

          {saved && (
            <p className="text-[10px] text-white/30 text-center">
              Open Bet Tracker to enter FanDuel odds &amp; wager
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────

export function PropsTool({ games }: { games: PropGame[] }) {
  const [selectedPk, setSelectedPk]   = useState(games[0]?.gamePk);
  const [activeProp, setActiveProp]   = useState<PropType>("HR");
  const [slip, setSlip]               = useState<SlipEntry[]>([]);

  const selected = useMemo(
    () => games.find((g) => g.gamePk === selectedPk) ?? games[0],
    [games, selectedPk],
  );

  function addToSlip(entry: SlipEntry) {
    setSlip((cur) => cur.some((e) => e.id === entry.id) ? cur : [...cur, entry]);
  }

  const isBatterProp = ["HR","Hit","2+ Hits","2+ Bases"].includes(activeProp);
  const rows = isBatterProp ? selected.props[activeProp as "HR" | "Hit" | "2+ Hits" | "2+ Bases"] : [];
  const activeTab = PROP_TABS.find((t) => t.id === activeProp)!;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      {/* ── Left: Content ──────────────────────────────────────────────── */}
      <div className="space-y-5 min-w-0">
        {/* Game tiles */}
        <GameSelector games={games} selectedPk={selectedPk} onSelect={setSelectedPk} />

        {/* Prop type tabs */}
        <PropTabs active={activeProp} onChange={setActiveProp} />

        {/* Section label */}
        <div className="flex items-center gap-2">
          <activeTab.icon size={14} strokeWidth={2.5} style={{ color: activeTab.color }} />
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: activeTab.color }}>
            {activeTab.label}
          </p>
          {isBatterProp && <span className="text-xs text-white/20">· {rows.length} players</span>}
        </div>

        {/* Batter grid */}
        {isBatterProp && (
          rows.length === 0
            ? <div className="rounded-2xl border border-white/[0.07] bg-[#111622] py-16 text-center">
                <p className="text-sm text-white/30">No data for this matchup yet.</p>
              </div>
            : <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {rows.map((row, i) => (
                  <BatterCard
                    key={`${row.id}-${activeProp}`}
                    rank={i + 1}
                    row={row}
                    propType={activeProp}
                    inSlip={slip.some((e) => e.id === `${row.id}-${activeProp}`)}
                    onAdd={addToSlip}
                  />
                ))}
              </div>
        )}

        {/* Pitcher K's */}
        {activeProp === "Pitcher K's" && (
          selected.pitchers.length === 0
            ? <div className="rounded-2xl border border-white/[0.07] bg-[#111622] py-16 text-center">
                <p className="text-sm text-white/30">No confirmed pitchers for this matchup.</p>
              </div>
            : <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {selected.pitchers.map((p) => (
                  <PitcherKCard key={p.id} pitcher={p} slip={slip} onAdd={addToSlip} />
                ))}
              </div>
        )}

        {/* Total Runs */}
        {activeProp === "Total Runs" && (
          <TotalRunsCard data={selected.totalRuns} slip={slip} onAdd={addToSlip} />
        )}
      </div>

      {/* ── Right: Slip panel ──────────────────────────────────────────── */}
      <SlipPanel
        slip={slip}
        onRemove={(id) => setSlip((cur) => cur.filter((e) => e.id !== id))}
        onClear={() => setSlip([])}
      />
    </div>
  );
}
