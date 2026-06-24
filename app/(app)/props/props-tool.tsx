"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { refreshPropsAction } from "./actions";
import type { ElementType } from "react";
import {
  Check, Flame, Layers, Plus, Receipt, Trash2, X,
  Zap, TrendingUp, TrendingDown,
  Activity, ChevronRight, RefreshCw,
  Clock, Trophy, Shield, Target, LayoutDashboard, Settings2, Bot,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { playerHeadshotUrl, teamLogoUrl } from "@/lib/mlb/api";
import { lookupOdds, type FanDuelOddsMap } from "@/lib/odds";
import type { AIPick } from "@/app/(app)/ai/page";

const AI_SLIP_KEY = "edge-ai-pending-picks";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PropType = "HR" | "Hit" | "2+ Hits" | "2+ Bases" | "Pitcher K's" | "Total Runs" | "1st Inn O/U" | "Moneyline";

export interface PropRow {
  id: number;
  playerName: string;
  position: string;
  teamId: number;
  pct: number;
  pitcherName: string;
  subStats: string;
  isHot?: boolean;
  isDue?: boolean;
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
  bookLine?: number;
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
  lineupFactor: number;
  factors: Array<{ label: string; impact: "over" | "under" | "neutral"; description: string }>;
  awayPitcher: { name: string; era: number | null; whip: number | null; k9: number | null; wins: number; losses: number };
  homePitcher: { name: string; era: number | null; whip: number | null; k9: number | null; wins: number; losses: number };
  venue: string;
  bookLine?: number;
}

export interface FirstInningPropData {
  gamePk: number;
  awayTeam: string;
  awayTeamId: number;
  homeTeam: string;
  homeTeamId: number;
  awayPitcherName: string;
  homePitcherName: string;
  awayPitcherEra: string;
  homePitcherEra: string;
  overPct: number;
  underPct: number;
}

export interface MoneylinePropData {
  homeTeam: string;
  awayTeam: string;
  homeTeamId: number;
  awayTeamId: number;
  homeWinPct: number;
  awayWinPct: number;
  confidence: "High" | "Medium" | "Low";
  predictedWinner: string;
  keyFactor: string;
}

export interface DailySlipLeg {
  id: string;
  description: string;
  playerName?: string;
  probability: number;
  playerId?: number;
  teamId?: number;
  propType?: string;
}

export interface DailySlip {
  id: string;
  label: string;
  tier: "safe" | "longshot";
  legs: DailySlipLeg[];
  combinedPct: number;
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
  firstInning: FirstInningPropData | null;
  moneyline: MoneylinePropData | null;
}

interface SlipEntry {
  id: string;
  description: string;
  probability: number;
  odds: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PROP_TABS: Array<{ id: PropType; label: string; icon: ElementType; color: string }> = [
  { id: "HR",           label: "Home Run",   icon: Flame,           color: "#FF7828" },
  { id: "Hit",          label: "1+ Hit",     icon: Receipt,         color: "#50C882" },
  { id: "2+ Hits",      label: "2+ Hits",    icon: Layers,          color: "#818cf8" },
  { id: "2+ Bases",     label: "2+ Bases",   icon: Activity,        color: "#2dd4bf" },
  { id: "Pitcher K's",  label: "Pitcher Ks", icon: Zap,             color: "#fbbf24" },
  { id: "Total Runs",   label: "Total Runs", icon: TrendingUp,      color: "#60B4F0" },
  { id: "1st Inn O/U",  label: "1st Inn O/U",icon: Clock,           color: "#a78bfa" },
  { id: "Moneyline",    label: "Moneyline",  icon: Trophy,          color: "#f472b6" },
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
function formatCombinedPct(pct: number): string {
  if (pct >= 10)   return `${pct.toFixed(0)}%`;
  if (pct >= 1)    return `${pct.toFixed(1)}%`;
  if (pct >= 0.01) return `${pct.toFixed(2)}%`;
  return "< 0.01%";
}
function gameTimeLabel(game: PropGame) {
  if (game.status === "Final" || game.status === "Game Over") return "Final";
  if (game.status === "In Progress") return "Live";
  return new Date(game.gameDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function abbr(name: string) { return name.split(" ").pop() ?? name; }

// ── Game selector ─────────────────────────────────────────────────────────────

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
        <img src={teamLogoUrl(selected.away.id)} alt="" className="w-7 h-7 object-contain shrink-0" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
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
          <img src={teamLogoUrl(selected.home.id)} alt="" className="w-7 h-7 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
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
                <img src={teamLogoUrl(g.away.id)} alt="" className="w-6 h-6 object-contain shrink-0" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
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
                  <img src={teamLogoUrl(g.home.id)} alt="" className="w-6 h-6 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
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

// ── Batter prop card ──────────────────────────────────────────────────────────

function BatterCard({ rank, row, propType, inSlip, onAdd }: {
  rank: number; row: PropRow; propType: PropType; inSlip: boolean;
  onAdd: (e: SlipEntry) => void;
}) {
  const color = propColor(row.pct);
  const label = propLabel(row.pct);

  return (
    <div className={`relative rounded-2xl border bg-[#111622] overflow-hidden transition-all ${
      row.isHot ? "border-[#FF7828]/20" : "border-white/[0.07]"
    }`}>
      {/* Rank badge */}
      <div className="absolute top-3 left-3 w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center">
        <span className="text-[9px] font-black text-white/30">{rank}</span>
      </div>

      {/* HOT badge */}
      {row.isHot && (
        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full border border-[#FF7828]/40 bg-[#FF7828]/15 px-1.5 py-0.5">
          <Flame size={9} color="#FF7828" strokeWidth={2.5} />
          <span className="text-[8px] font-black text-[#FF7828] tracking-wider">HOT</span>
        </div>
      )}

      {/* DUE badge — only if not hot */}
      {row.isDue && !row.isHot && (
        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full border border-[#a78bfa]/40 bg-[#a78bfa]/15 px-1.5 py-0.5">
          <Clock size={9} color="#a78bfa" strokeWidth={2.5} />
          <span className="text-[8px] font-black text-[#a78bfa] tracking-wider">DUE</span>
        </div>
      )}

      {/* Player info */}
      <div className="pt-6 pb-3 px-4 flex flex-col items-center text-center">
        {/* Headshot — no circle, masked to blend with card bg */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={playerHeadshotUrl(row.id)}
          alt={row.playerName}
          width={80}
          height={80}
          className="object-contain mb-1"
          style={{
            objectPosition: "top center",
            maskImage: "radial-gradient(ellipse 80% 85% at 50% 32%, black 42%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 85% at 50% 32%, black 42%, transparent 100%)",
          }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
        <div className="px-2.5 py-1 rounded-full text-[10px] font-black border mb-2"
          style={{ color, borderColor: `${color}50`, backgroundColor: `${color}18` }}>
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
        <div className="flex-1 mx-3">
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${row.pct}%`, backgroundColor: color }} />
          </div>
        </div>
        <button
          onClick={() => onAdd({ id: `${row.id}-${propType}`, description: `${row.playerName} ${propType} vs ${row.pitcherName.split(" ").pop()}`, probability: row.pct, odds: "" })}
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

// ── HR legend ─────────────────────────────────────────────────────────────────

function HRLegend() {
  return (
    <div className="flex items-center gap-4 px-1">
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 rounded-full border border-[#FF7828]/40 bg-[#FF7828]/15 px-1.5 py-0.5">
          <Flame size={9} color="#FF7828" strokeWidth={2.5} />
          <span className="text-[8px] font-black text-[#FF7828]">HOT</span>
        </div>
        <span className="text-[10px] text-white/30">A+/A matchup grade</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 rounded-full border border-[#a78bfa]/40 bg-[#a78bfa]/15 px-1.5 py-0.5">
          <Clock size={9} color="#a78bfa" strokeWidth={2.5} />
          <span className="text-[8px] font-black text-[#a78bfa]">DUE</span>
        </div>
        <span className="text-[10px] text-white/30">overdue by power model</span>
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
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.05]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-black text-white">{pitcher.name}</p>
            <p className="text-xs text-white/35">{pitcher.teamName} vs {pitcher.opponent}</p>
          </div>
          <div className="flex gap-3 text-center shrink-0">
            {[
              { v: pitcher.k9,                          l: "K/9",  c: "#fbbf24" },
              { v: pitcher.era,                         l: "ERA",  c: "#FF7828" },
              { v: `${pitcher.wins}-${pitcher.losses}`, l: "W-L",  c: "#50C882" },
            ].map(({ v, l, c }) => (
              <div key={l}>
                <p className="text-sm font-black" style={{ color: c }}>{v}</p>
                <p className="text-[9px] font-bold text-white/25 uppercase tracking-wider">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-[#fbbf24]/20 bg-[#fbbf24]/[0.06] px-4 py-3">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase">
              {pitcher.bookLine !== undefined ? "FanDuel Line" : "Projected Line"}
            </p>
            <p className="text-3xl font-black text-[#fbbf24] mt-0.5">
              {pitcher.bookLine !== undefined ? pitcher.bookLine : pitcher.line} Ks
            </p>
            {pitcher.bookLine !== undefined && (
              <p className="text-[9px] text-white/25 mt-0.5">Model proj: {pitcher.projectedKs} Ks</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase">K/9 Rate</p>
            <p className="text-xl font-black text-white mt-0.5">{pitcher.k9}</p>
          </div>
        </div>
      </div>
      <div className="p-5 space-y-3">
        {[
          { id: overId,  label: `Over ${pitcher.bookLine ?? pitcher.line} Ks`,  pct: pitcher.overPct,  color: "#50C882", inSlip: overIn,  Icon: TrendingUp  },
          { id: underId, label: `Under ${pitcher.bookLine ?? pitcher.line} Ks`, pct: pitcher.underPct, color: "#EB505A", inSlip: underIn, Icon: TrendingDown },
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
                  onClick={() => onAdd({ id: item.id, description: `${pitcher.name} ${item.label}`, probability: item.pct, odds: "" })}
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

// ── First Inning O/U card ─────────────────────────────────────────────────────

function FirstInningCard({ data, slip, onAdd }: {
  data: FirstInningPropData; slip: SlipEntry[]; onAdd: (e: SlipEntry) => void;
}) {
  const overId  = `${data.gamePk}-1st-over`;
  const underId = `${data.gamePk}-1st-under`;
  const overIn  = slip.some((e) => e.id === overId);
  const underIn = slip.some((e) => e.id === underId);

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111622] overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-[#a78bfa]/35 bg-[#a78bfa]/12 px-2 py-0.5 text-[9px] font-black text-[#a78bfa] tracking-wider uppercase">
                <Clock size={8} strokeWidth={2.5} />
                1st Inning O/U
              </span>
            </div>
            <p className="text-base font-black text-white">
              {abbr(data.awayTeam)} <span className="text-white/30 font-normal">@</span> {abbr(data.homeTeam)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase mb-1">Line</p>
            <p className="text-2xl font-black text-[#a78bfa]">0.5</p>
            <p className="text-[10px] text-white/30">runs</p>
          </div>
        </div>

        {/* Both pitchers side by side */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { pitcher: data.awayPitcherName, era: data.awayPitcherEra, team: abbr(data.awayTeam), label: "Away starter" },
            { pitcher: data.homePitcherName, era: data.homePitcherEra, team: abbr(data.homeTeam), label: "Home starter" },
          ].map(({ pitcher, era, team, label }) => (
            <div key={team} className="rounded-xl border border-white/[0.05] bg-[#0D1117] p-3">
              <p className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-xs font-black text-white truncate">{pitcher}</p>
              <p className="text-[10px] text-white/35 mb-2">{team}</p>
              <div className="flex items-center gap-1">
                <span className="text-sm font-black" style={{ color: era === "—" ? "rgba(255,255,255,0.3)" : "#FF7828" }}>{era}</span>
                <span className="text-[9px] font-bold text-white/25">ERA</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-3">
        {[
          { id: overId,  label: "Over 0.5 Runs",  pct: data.overPct,  color: "#50C882", inSlip: overIn,  Icon: TrendingUp,  desc: `${abbr(data.awayTeam)} @ ${abbr(data.homeTeam)} Over 0.5 1st Inn` },
          { id: underId, label: "Under 0.5 Runs", pct: data.underPct, color: "#EB505A", inSlip: underIn, Icon: TrendingDown, desc: `${abbr(data.awayTeam)} @ ${abbr(data.homeTeam)} Under 0.5 1st Inn` },
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
                  onClick={() => onAdd({ id: item.id, description: item.desc, probability: item.pct, odds: "" })}
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

// ── Moneyline card ────────────────────────────────────────────────────────────

function MoneylineCard({ data, slip, onAdd }: {
  data: MoneylinePropData; slip: SlipEntry[]; onAdd: (e: SlipEntry) => void;
}) {
  const homeId  = `${data.homeTeamId}-ml-home`;
  const awayId  = `${data.awayTeamId}-ml-away`;
  const homeIn  = slip.some((e) => e.id === homeId);
  const awayIn  = slip.some((e) => e.id === awayId);
  const confColor = data.confidence === "High" ? "#50C882" : data.confidence === "Medium" ? "#FF7828" : "rgba(255,255,255,0.35)";

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111622] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 rounded-full border border-[#f472b6]/35 bg-[#f472b6]/12 px-2 py-0.5 text-[9px] font-black text-[#f472b6] tracking-wider uppercase">
                <Trophy size={8} strokeWidth={2.5} />
                Moneyline
              </span>
            </div>
            <p className="text-base font-black text-white">
              {abbr(data.awayTeam)} <span className="text-white/30 font-normal">@</span> {abbr(data.homeTeam)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border"
            style={{ borderColor: `${confColor}30`, backgroundColor: `${confColor}10` }}>
            <span className="text-xs font-black" style={{ color: confColor }}>{data.confidence}</span>
            <span className="text-[10px] text-white/30">conf.</span>
          </div>
        </div>
        {/* Key factor */}
        <p className="mt-3 text-[11px] text-white/40 leading-relaxed bg-white/[0.03] rounded-xl px-3 py-2 border border-white/[0.05]">
          {data.keyFactor}
        </p>
      </div>

      {/* Team win % bars */}
      <div className="p-5 space-y-4">
        {[
          { id: awayId, team: data.awayTeam, teamId: data.awayTeamId, pct: data.awayWinPct, inSlip: awayIn, isWinner: data.predictedWinner === data.awayTeam },
          { id: homeId, team: data.homeTeam, teamId: data.homeTeamId, pct: data.homeWinPct, inSlip: homeIn, isWinner: data.predictedWinner === data.homeTeam },
        ].map((t) => {
          const color = t.isWinner ? "#50C882" : "rgba(255,255,255,0.40)";
          return (
            <div key={t.id}>
              <div className="flex items-center gap-3 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={teamLogoUrl(t.teamId)} alt="" className="w-7 h-7 object-contain shrink-0" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                <p className="flex-1 text-sm font-black text-white">{abbr(t.team)}</p>
                {t.isWinner && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full border border-[#50C882]/35 bg-[#50C882]/12 text-[#50C882]">
                    PICK
                  </span>
                )}
                <span className="text-xl font-black mr-1" style={{ color }}>{t.pct}%</span>
                <button
                  onClick={() => onAdd({ id: t.id, description: `${t.team} Moneyline Win`, probability: t.pct, odds: "" })}
                  disabled={t.inSlip}
                  className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all shrink-0 ${
                    t.inSlip
                      ? "border-[#50C882]/40 bg-[#50C882]/10 text-[#50C882]"
                      : "border-white/[0.08] bg-white/[0.04] text-white/50 hover:bg-white/[0.08]"
                  }`}
                >
                  {t.inSlip ? <><Check size={10} className="mr-0.5" />Added</> : "Add Slip"}
                </button>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full transition-all" style={{ width: `${t.pct}%`, backgroundColor: t.isWinner ? "#50C882" : "rgba(255,255,255,0.18)" }} />
              </div>
            </div>
          );
        })}
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
            <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase mb-1">
              {data.bookLine !== undefined ? "FanDuel Line" : "O/U Line"}
            </p>
            <p className="text-4xl font-black text-white">{data.bookLine ?? data.line}</p>
            {data.bookLine !== undefined && (
              <p className="text-[9px] text-white/25 mt-0.5">Model: {data.line}</p>
            )}
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full border"
              style={{ color: leanClr, borderColor: `${leanClr}40`, backgroundColor: `${leanClr}15` }}>
              <span className="text-xs font-black">LEAN {lean}</span>
            </div>
          </div>
        </div>
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


      <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5">
        <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-0.5">Why the Model Leans {lean}</p>
        <p className="text-[11px] text-white/30 mb-3">Key factors driving this total</p>
        {data.factors.map((f, i) => <FactorRow key={i} f={f} />)}
      </div>

      <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5 space-y-3">
        <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase">Add to Slip</p>
        {[
          { id: overId,  label: `Over ${data.bookLine ?? data.line}`,  pct: data.overPct,  color: "#50C882", inSlip: overIn,  Icon: TrendingUp  },
          { id: underId, label: `Under ${data.bookLine ?? data.line}`, pct: data.underPct, color: "#EB505A", inSlip: underIn, Icon: TrendingDown },
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
                  onClick={() => onAdd({ id: item.id, description: `${awAbbr} @ ${hmAbbr} ${item.label} Total Runs`, probability: item.pct, odds: "" })}
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

// ── Parlay math helpers ───────────────────────────────────────────────────────

function americanToDecimal(odds: string): number {
  const n = parseInt(odds.replace("+", ""), 10);
  if (isNaN(n) || n === 0) return 1;
  return n > 0 ? n / 100 + 1 : 100 / Math.abs(n) + 1;
}

function parlayToWin(wager: number, legs: SlipEntry[]): number {
  const decimal = legs.reduce((acc, l) => acc * americanToDecimal(l.odds), 1);
  return Math.round((wager * decimal - wager) * 100) / 100;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

// ── Animated pick slot (handles swipe-out / swipe-in on save) ────────────────

function AnimatedCardSlot({
  variants,
  exitDirection,
  tier,
}: {
  variants: DailySlip[];
  exitDirection: "left" | "right";
  tier: "safe" | "longshot";
}) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"visible" | "exiting" | "reset" | "entering">("visible");
  const hasAlternates     = variants.length > 1;

  const isSafe      = tier === "safe";
  const headerColor = isSafe ? "#50C882" : "#FF7828";
  const HeaderIcon  = isSafe ? Shield : Target;
  const headerLabel = isSafe ? "Safe Pick" : "Long Shot";
  const headerSub   = isSafe ? "High-probability" : "Higher risk, higher reward";

  const currentSlip = variants.length > 0 ? variants[index % variants.length] : null;

  const wrapStyle: React.CSSProperties = {
    transform:
      phase === "exiting"
        ? exitDirection === "left" ? "translateX(-115%)" : "translateX(115%)"
        : phase === "reset"
        ? exitDirection === "left" ? "translateX(115%)"  : "translateX(-115%)"
        : "translateX(0)",
    opacity:    phase === "exiting" || phase === "reset" ? 0 : 1,
    transition: phase === "reset"
      ? "none"
      : "transform 0.34s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease",
  };

  function cycleNext() {
    if (!hasAlternates || phase !== "visible") return;
    setPhase("exiting");
    setTimeout(() => {
      setIndex((i) => (i + 1) % variants.length);
      setPhase("reset");
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setPhase("entering");
          setTimeout(() => setPhase("visible"), 360);
        }),
      );
    }, 340);
  }

  if (!currentSlip) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-0.5 h-4 rounded-full" style={{ backgroundColor: headerColor }} />
        <HeaderIcon size={11} strokeWidth={2.5} style={{ color: headerColor }} />
        <p className="text-[10px] font-black tracking-wider uppercase" style={{ color: headerColor }}>{headerLabel}</p>
        <p className="text-[10px] text-white/20">{headerSub}</p>
        {hasAlternates && (
          <button onClick={cycleNext} className="ml-auto text-[9px] text-white/30 hover:text-white/60 transition-colors tabular-nums">
            {(index % variants.length) + 1}/{variants.length} · next →
          </button>
        )}
      </div>
      <div style={{ overflow: "hidden", borderRadius: "1rem" }}>
        <div style={wrapStyle}>
          <DailySlipCard slip={currentSlip} />
        </div>
      </div>
    </div>
  );
}

// ── Daily slip card ───────────────────────────────────────────────────────────

function DailySlipCard({ slip }: { slip: DailySlip }) {
  const isSafe    = slip.tier === "safe";
  const tierColor = isSafe ? "#50C882" : "#FF7828";
  const TierIcon  = isSafe ? Shield : Target;

  return (
    <div className="rounded-2xl border bg-[#0D1117] overflow-hidden flex flex-col"
      style={{ borderColor: `${tierColor}22` }}>

      {/* Header */}
      <div className="px-5 pt-4 pb-3.5 border-b"
        style={{ borderBottomColor: `${tierColor}14`, backgroundColor: `${tierColor}06` }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-white">{slip.label}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <TierIcon size={10} style={{ color: tierColor }} strokeWidth={2.5} />
              <span className="text-[10px] font-bold" style={{ color: tierColor }}>
                {isSafe ? "Safe Pick" : "Long Shot"}
              </span>
              <span className="text-white/20 text-[10px]">· {slip.legs.length} legs</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black leading-none" style={{ color: tierColor }}>{slip.combinedPct.toFixed(1)}%</p>
            <p className="text-[9px] text-white/25 uppercase tracking-wider mt-0.5">combined</p>
          </div>
        </div>
      </div>

      {/* Legs — fills remaining space so cards in a grid stay equal height */}
      <div className="flex-1 divide-y divide-white/[0.04]">
        {slip.legs.map((leg) => {
          const color = propColor(leg.probability);
          return (
            <div key={leg.id} className="flex items-center gap-3 px-4 py-3.5">
              {/* Avatar */}
              <div className="shrink-0 w-9 h-9 rounded-full overflow-hidden bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                {leg.playerId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={playerHeadshotUrl(leg.playerId)}
                    alt=""
                    className="w-full h-full object-contain"
                    style={{
                      objectPosition: "top center",
                      maskImage: "radial-gradient(ellipse 80% 85% at 50% 30%, black 40%, transparent 100%)",
                      WebkitMaskImage: "radial-gradient(ellipse 80% 85% at 50% 30%, black 40%, transparent 100%)",
                    }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0"; }}
                  />
                ) : leg.teamId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={teamLogoUrl(leg.teamId)} alt="" className="w-5 h-5 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                )}
              </div>
              {/* Two-line text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white leading-tight truncate">
                  {leg.playerName ?? leg.description}
                </p>
                <p className="text-[11px] mt-0.5 font-medium truncate" style={{ color: `${color}b0` }}>
                  {leg.propType ?? leg.description}
                </p>
              </div>
              <span className="text-sm font-black shrink-0" style={{ color }}>{leg.probability}%</span>
            </div>
          );
        })}
      </div>

      {/* Save button — always at the bottom, visually separated */}
      <div className="px-4 py-3.5 border-t border-white/[0.06] shrink-0">
      </div>
    </div>
  );
}

function DashboardView({
  slips,
  onSwitchBuilder,
  isRefreshing = false,
}: {
  slips: DailySlip[];
  onSwitchBuilder: () => void;
  isRefreshing?: boolean;
}) {
  const availableCounts = useMemo(
    () => [...new Set(slips.map((s) => s.legs.length))].sort((a, b) => a - b),
    [slips],
  );
  const [legCount, setLegCount] = useState<number>(2);

  const effectiveLegCount = availableCounts.includes(legCount) ? legCount : (availableCounts[0] ?? 2);
  const safeVariants      = slips.filter((s) => s.tier === "safe"     && s.legs.length === effectiveLegCount);
  const longshotVariants  = slips.filter((s) => s.tier === "longshot" && s.legs.length === effectiveLegCount);


  if (slips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-2xl border border-white/[0.07] bg-white/[0.04] flex items-center justify-center mb-4">
          <LayoutDashboard size={22} className="text-white/20" strokeWidth={1.5} />
        </div>
        <p className="text-white/35 text-sm font-bold mb-1">Not enough data yet</p>
        <p className="text-white/22 text-xs">Check back once starting pitchers are confirmed</p>
        <button onClick={onSwitchBuilder} className="mt-5 flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/50 hover:text-white hover:border-white/[0.14] transition-colors">
          <Settings2 size={12} strokeWidth={2} />
          Open Builder
        </button>
      </div>
    );
  }

  return (
    <div
      className="space-y-5 transition-opacity duration-500"
      style={{ opacity: isRefreshing ? 0.35 : 1, pointerEvents: isRefreshing ? "none" : undefined }}
    >
      {/* Parlay size selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase shrink-0">Parlay size</p>
        <div className="flex items-center gap-1.5">
          {[2, 3, 4, 5, 6].map((n) => {
            const avail  = availableCounts.includes(n);
            const active = n === effectiveLegCount;
            return (
              <button
                key={n}
                onClick={() => avail && setLegCount(n)}
                disabled={!avail}
                className={`w-10 h-8 rounded-xl text-xs font-black transition-all border ${
                  active
                    ? "border-[#FF7828]/50 bg-[#FF7828]/15 text-[#FF7828]"
                    : avail
                    ? "border-white/[0.07] bg-[#111622] text-white/50 hover:text-white hover:border-white/[0.14]"
                    : "border-white/[0.03] bg-transparent text-white/15 cursor-not-allowed"
                }`}
              >
                {n}
              </button>
            );
          })}
          <span className="text-[11px] text-white/25 ml-1">legs</span>
        </div>
      </div>

      {/* Picks grid — animated slots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
        {safeVariants.length > 0 ? (
          <AnimatedCardSlot
            key={`safe-${effectiveLegCount}`}
            variants={safeVariants}
            exitDirection="left"
            tier="safe"
          />
        ) : null}
        {longshotVariants.length > 0 ? (
          <AnimatedCardSlot
            key={`longshot-${effectiveLegCount}`}
            variants={longshotVariants}
            exitDirection="right"
            tier="longshot"
          />
        ) : null}
        {safeVariants.length === 0 && longshotVariants.length === 0 && (
          <div className="sm:col-span-2 rounded-2xl border border-white/[0.06] bg-[#111622] py-12 text-center">
            <p className="text-white/30 text-sm">No {effectiveLegCount}-leg picks available today</p>
          </div>
        )}
      </div>

      <p className="text-[11px] text-white/15 text-center pt-2">
        Parlays built from model probabilities · For educational use only
      </p>
    </div>
  );
}

// ── Slip panel ────────────────────────────────────────────────────────────────

function SlipPanel({ slip, onRemove, onClear, onOddsChange }: {
  slip: SlipEntry[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onOddsChange: (id: string, odds: string) => void;
}) {
  const combined = combinedProbability(slip);
  const [wager, setWager] = useState("10");

  const wagerNum = parseFloat(wager) || 0;
  const hasOdds  = slip.some((e) => e.odds);
  const toWin    = wagerNum > 0 ? parlayToWin(wagerNum, slip) : 0;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111622] overflow-hidden lg:sticky lg:top-20 flex flex-col max-h-[calc(100vh-6rem)]">
      <div className="px-4 py-3.5 border-b border-white/[0.05] flex items-center justify-between shrink-0">
        <div>
          <p className="text-sm font-black text-white">Your Slip</p>
          <p className="text-[11px] text-white/30">{slip.length} leg{slip.length === 1 ? "" : "s"}</p>
        </div>
        {slip.length > 0 && (
          <button onClick={onClear} className="flex items-center gap-1 rounded-lg border border-[#EB505A]/25 bg-[#EB505A]/10 px-2.5 py-1.5 text-xs font-bold text-[#EB505A]">
            <Trash2 size={11} />Clear
          </button>
        )}
      </div>

      {slip.length === 0 ? (
        <div className="py-10 text-center px-5">
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
            <Receipt size={17} className="text-white/15" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-white/25 font-bold mb-1">Slip is empty</p>
          <p className="text-xs text-white/18">Tap &ldquo;Slip&rdquo; on any prop to add a leg</p>
        </div>
      ) : (
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {slip.map((entry) => {
            const sign   = entry.odds.startsWith("-") ? "-" : "+";
            const numStr = entry.odds.replace(/[^0-9]/g, "");
            const color  = propColor(entry.probability);
            return (
              <div key={entry.id} className="rounded-xl border border-white/[0.05] bg-[#0D1117] p-2.5">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: color }} />
                  <p className="text-[11px] font-bold text-white leading-snug flex-1 min-w-0">{entry.description}</p>
                  <button onClick={() => onRemove(entry.id)} className="text-white/20 hover:text-white/50 shrink-0 ml-1">
                    <X size={12} />
                  </button>
                </div>
                <div className="flex items-center gap-2 pl-3">
                  <span className="text-[10px] text-white/30 shrink-0 w-7">Odds</span>
                  <div className="flex items-center rounded-lg border border-white/[0.08] bg-white/[0.04] overflow-hidden h-7">
                    <button
                      onClick={() => { const ns = sign === "+" ? "-" : "+"; onOddsChange(entry.id, numStr ? `${ns}${numStr}` : ""); }}
                      className="w-7 h-full flex items-center justify-center text-xs font-black border-r border-white/[0.08] transition-colors shrink-0"
                      style={{ color: sign === "+" ? "#50C882" : "#EB505A", backgroundColor: sign === "+" ? "rgba(80,200,130,0.10)" : "rgba(235,80,90,0.10)" }}
                    >
                      {sign}
                    </button>
                    <input
                      type="text" inputMode="numeric" placeholder="110" value={numStr}
                      onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ""); onOddsChange(entry.id, v ? `${sign}${v}` : ""); }}
                      className="w-14 bg-transparent text-xs font-black text-center outline-none px-1"
                      style={{ color: numStr ? (sign === "+" ? "#50C882" : "#EB505A") : "rgba(255,255,255,0.25)" }}
                    />
                  </div>
                  <span className="text-[10px] font-black shrink-0" style={{ color }}>{entry.probability}%</span>
                </div>
              </div>
            );
          })}

          {slip.length > 1 && (
            <div className="rounded-xl border border-white/[0.07] bg-[#0D1117] p-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold text-white/35 uppercase tracking-wider">Combined</p>
                <p className="text-base font-black" style={{ color: combined >= 20 ? "#50C882" : combined >= 5 ? "#FF7828" : "#EB505A" }}>
                  {formatCombinedPct(combined)}
                </p>
              </div>
              <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(combined * 3, 100)}%`, backgroundColor: combined >= 20 ? "#50C882" : combined >= 5 ? "#FF7828" : "#EB505A" }} />
              </div>
            </div>
          )}

          <div className="rounded-xl border border-white/[0.07] bg-[#0D1117] p-3">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">Wager</p>
            <div className="flex items-center rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 h-9">
              <span className="text-white/40 text-sm mr-1 shrink-0">$</span>
              <input
                type="text" inputMode="decimal" placeholder="10" value={wager}
                onChange={(e) => setWager(e.target.value.replace(/[^0-9.]/g, ""))}
                className="flex-1 bg-transparent text-sm font-black text-white outline-none"
              />
            </div>
            {hasOdds && toWin > 0 && (
              <div className="flex items-center justify-between mt-2 px-1">
                <p className="text-[10px] text-white/30">To win</p>
                <p className="text-sm font-black text-[#50C882]">${toWin.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────

export function PropsTool({ games, dailySlips, fanDuelOdds = {} }: { games: PropGame[]; dailySlips: DailySlip[]; fanDuelOdds?: FanDuelOddsMap }) {
  const router = useRouter();
  const [view, setView]               = useState<"dashboard" | "builder">("dashboard");
  const [selectedPk, setSelectedPk]   = useState(games[0]?.gamePk);
  const [activeProp, setActiveProp]   = useState<PropType>("HR");
  const [slip, setSlip]               = useState<SlipEntry[]>([]);
  const [aiPicks, setAiPicks]         = useState<AIPick[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshPropsAction();
      router.refresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 1500);
    }
  }, [router, isRefreshing]);

  // Load AI pending picks from localStorage
  useEffect(() => {
    function load() {
      try {
        const stored = JSON.parse(localStorage.getItem(AI_SLIP_KEY) || "[]") as AIPick[];
        setAiPicks(stored);
      } catch { setAiPicks([]); }
    }
    load();
    window.addEventListener("ai-picks-updated", load);
    return () => window.removeEventListener("ai-picks-updated", load);
  }, []);

  function importAiPicks() {
    aiPicks.forEach((p, i) => {
      const entry: SlipEntry = {
        id: `ai-${p.playerId}-${p.propType}-${i}`,
        description: p.description,
        probability: p.probability,
        odds: p.odds || "",
      };
      setSlip((cur) => cur.some((e) => e.description === entry.description) ? cur : [...cur, entry]);
    });
    localStorage.removeItem(AI_SLIP_KEY);
    setAiPicks([]);
    setView("builder");
  }

  const selected = useMemo(
    () => games.find((g) => g.gamePk === selectedPk) ?? games[0],
    [games, selectedPk],
  );

  function addToSlip(entry: SlipEntry) {
    // Enrich with real FanDuel odds if we have them and the entry has no odds yet
    const enriched: SlipEntry = entry.odds
      ? entry
      : (() => {
          // Extract player/team name from the description for odds lookup
          // Description format: "Player Name PropType vs Pitcher" or "Team Moneyline Win"
          const namePart = entry.description.split(" vs ")[0]
            .replace(/ HR$| Hit$| 1\+ Hit$| 2\+ Hits$| 2\+ Bases$| Moneyline Win$/, "")
            .trim();
          const propType = entry.id.includes("-k-") ? "Pitcher K's"
            : entry.id.includes("-runs-") ? "Total Runs"
            : entry.id.includes("-1st-") ? "1st Inn O/U"
            : entry.id.includes("-ml-") ? "Moneyline"
            : (entry.description.match(/HR|Hit|2\+ Hits|2\+ Bases/) ?? [""])[0] || "";
          const realOdds = lookupOdds(fanDuelOdds, namePart, propType);
          return realOdds ? { ...entry, odds: realOdds } : entry;
        })();
    setSlip((cur) => cur.some((e) => e.id === enriched.id) ? cur : [...cur, enriched]);
  }

  const updateOdds = useCallback((id: string, odds: string) => {
    setSlip((cur) => cur.map((e) => e.id === id ? { ...e, odds } : e));
  }, []);

  const isBatterProp = ["HR","Hit","2+ Hits","2+ Bases"].includes(activeProp);
  const rows = isBatterProp ? selected.props[activeProp as "HR" | "Hit" | "2+ Hits" | "2+ Bases"] : [];
  const activeTab = PROP_TABS.find((t) => t.id === activeProp)!;

  return (
    <div className="space-y-5">
      {/* AI pending picks banner */}
      {aiPicks.length > 0 && (
        <button
          onClick={importAiPicks}
          className="w-full flex items-center gap-3 rounded-2xl border border-[#818cf8]/30 bg-[#818cf8]/08 px-4 py-3 hover:bg-[#818cf8]/14 transition-colors"
        >
          <Bot size={16} className="text-[#818cf8] shrink-0" strokeWidth={2} />
          <div className="flex-1 text-left">
            <p className="text-sm font-black text-white">Edge AI suggested {aiPicks.length} pick{aiPicks.length > 1 ? "s" : ""}</p>
            <p className="text-[10px] text-white/40 mt-0.5">{aiPicks.map(p => p.playerName).join(", ")}</p>
          </div>
          <span className="text-xs font-bold text-[#818cf8] shrink-0">Add all to slip →</span>
        </button>
      )}

      {/* View toggle + refresh */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-2xl border border-white/[0.07] bg-[#0D1117] p-1 w-full sm:w-80">
          {(["dashboard", "builder"] as const).map((v) => {
            const isActive = view === v;
            const Icon = v === "dashboard" ? LayoutDashboard : Settings2;
            return (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-4 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#FF7828] text-white shadow-sm"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                <Icon size={12} strokeWidth={2.5} />
                {v === "dashboard" ? "Predicted Picks" : "Builder"}
              </button>
            );
          })}
        </div>
        {view === "dashboard" && (
          <button
            onClick={handleRefresh}
            title="Refresh picks"
            className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-colors shrink-0 ${
              isRefreshing
                ? "border-[#FF7828]/40 bg-[#FF7828]/08"
                : "border-white/[0.07] bg-[#0D1117] hover:border-white/[0.14]"
            }`}
          >
            <RefreshCw
              size={15}
              strokeWidth={2}
              className={isRefreshing ? "text-[#FF7828] animate-spin" : "text-white/40"}
            />
          </button>
        )}
      </div>

      {/* Dashboard view */}
      {view === "dashboard" && (
        <DashboardView
          slips={dailySlips}
          onSwitchBuilder={() => setView("builder")}
          isRefreshing={isRefreshing}
        />
      )}

      {/* Builder view */}
      {view === "builder" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Left: Content */}
          <div className="space-y-5 min-w-0">
            <GameSelector games={games} selectedPk={selectedPk} onSelect={setSelectedPk} />
            <PropTabs active={activeProp} onChange={setActiveProp} />

            {/* Section label */}
            <div className="flex items-center gap-2">
              <activeTab.icon size={14} strokeWidth={2.5} style={{ color: activeTab.color }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: activeTab.color }}>
                {activeTab.label}
              </p>
              {isBatterProp && <span className="text-xs text-white/20">· {rows.length} players</span>}
            </div>

            {/* HR legend */}
            {activeProp === "HR" && <HRLegend />}

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
                    {selected.pitchers.map((p) => <PitcherKCard key={p.id} pitcher={p} slip={slip} onAdd={addToSlip} />)}
                  </div>
            )}

            {/* Total Runs */}
            {activeProp === "Total Runs" && (
              <TotalRunsCard data={selected.totalRuns} slip={slip} onAdd={addToSlip} />
            )}

            {/* 1st Inning O/U */}
            {activeProp === "1st Inn O/U" && (
              !selected.firstInning
                ? <div className="rounded-2xl border border-white/[0.07] bg-[#111622] py-16 text-center">
                    <p className="text-sm text-white/30">No confirmed pitchers for this matchup.</p>
                  </div>
                : <FirstInningCard data={selected.firstInning} slip={slip} onAdd={addToSlip} />
            )}

            {/* Moneyline */}
            {activeProp === "Moneyline" && (
              !selected.moneyline
                ? <div className="rounded-2xl border border-white/[0.07] bg-[#111622] py-16 text-center flex flex-col items-center gap-3">
                    <p className="text-sm text-white/30">Prediction unavailable for this matchup.</p>
                    <button
                      onClick={handleRefresh}
                      className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/50 hover:text-white hover:border-white/[0.14] transition-colors"
                    >
                      <RefreshCw size={12} strokeWidth={2} />
                      Refresh to load
                    </button>
                  </div>
                : <MoneylineCard data={selected.moneyline} slip={slip} onAdd={addToSlip} />
            )}
          </div>

          {/* Right: Slip panel */}
          <SlipPanel
            slip={slip}
            onRemove={(id) => setSlip((cur) => cur.filter((e) => e.id !== id))}
            onClear={() => setSlip([])}
            onOddsChange={updateOdds}
          />
        </div>
      )}
    </div>
  );
}
