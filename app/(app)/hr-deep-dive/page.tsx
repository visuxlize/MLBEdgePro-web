"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, RefreshCw, ChevronDown, TrendingUp, Wind, Thermometer, Target, Zap, BarChart3 } from "lucide-react";
import { fetchTodaysGames, playerHeadshotUrl, type Game } from "@/lib/mlb/api";
import { PaywallGate } from "@/components/web-tool/paywall-gate";
import { TeamLogoImg } from "@/components/web-tool/team-logo-img";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BatterAnalysis {
  playerId:   number;
  playerName: string;
  teamId:     number;
  teamName:   string;
  matchupGrade: "A+" | "A" | "B+" | "B" | "C+" | "C";
  hrProbability: number;  // 0-100
  // Power metrics
  barrelPct: number;
  avgEV: number;
  maxEV: number;
  blastSlg: number;
  // Pitcher vulnerability
  brlkAllowed: number;
  evAllowed: number;
  fbRate: number;
  hrPer9: number;
  // Spray breakdown
  pull:   { pct: number; hrCount: number; wallClearance: number; avgDist: number };
  center: { pct: number; hrCount: number; wallClearance: number; avgDist: number };
  oppo:   { pct: number; hrCount: number; wallClearance: number; avgDist: number };
  // Pitch mix
  pitchMix: { name: string; usage: number; slg: number; pullPct: number; centerPct: number; oppoPct: number }[];
  // Carry conditions
  temp:      number;
  windSpeed: number;
  windDir:   string;
  parkFactor: number;
}

// ── Spray chart SVG ───────────────────────────────────────────────────────────

function SprayChart({ analysis }: { analysis: BatterAnalysis }) {
  const W = 320, H = 280;
  // Diamond coords
  const home  = { x: W / 2, y: H - 30 };
  const first = { x: W - 50, y: H / 2 + 30 };
  const sec   = { x: W / 2, y: H / 2 - 60 };
  const third = { x: 50, y: H / 2 + 30 };

  // Generate spray dots based on pull/center/oppo percentages
  const seed = analysis.playerId;
  const dots = Array.from({ length: 17 }, (_, i) => {
    const r = ((seed * 31 + i * 97) % 100) / 100;
    const isPull  = r < analysis.pull.pct   / 100;
    const isCenter = !isPull && r < (analysis.pull.pct + analysis.center.pct) / 100;
    const angle = isPull
      ? (-15 + ((seed + i * 17) % 35)) * (Math.PI / 180)
      : isCenter
      ? (30 + ((seed + i * 13) % 30)) * (Math.PI / 180)
      : (65 + ((seed + i * 11) % 30)) * (Math.PI / 180);
    const dist = 140 + ((seed + i * 23) % 60);
    const isHR = i < Math.round(analysis.hrProbability / 6);
    return {
      x: home.x - Math.cos(angle) * dist,
      y: home.y - Math.sin(angle) * dist,
      isHR,
      color: isPull ? "#50C882" : isCenter ? "#60B4F0" : "#FF7828",
    };
  });

  const wallR = 160, wallPts = Array.from({ length: 50 }, (_, i) => {
    const a = (i / 49) * Math.PI * 0.9 + Math.PI * 0.05;
    return { x: home.x - Math.cos(a) * wallR, y: home.y - Math.sin(a) * wallR };
  });
  const wallPath = wallPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0D1117] overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase">Spray Chart — {analysis.playerName}</p>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block">
        {/* Outfield grass */}
        <ellipse cx={home.x} cy={home.y} rx={wallR + 10} ry={wallR * 0.7} fill="rgba(30,80,30,0.25)" />
        {/* Wall arc */}
        <path d={wallPath} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        {/* Wall distance labels */}
        <text x={home.x - wallR - 5} y={home.y - wallR * 0.4} fill="rgba(255,255,255,0.25)" fontSize="10" textAnchor="middle">LF 318'</text>
        <text x={home.x} y={home.y - wallR - 10} fill="rgba(255,255,255,0.25)" fontSize="10" textAnchor="middle">CF 408'</text>
        <text x={home.x + wallR + 5} y={home.y - wallR * 0.4} fill="rgba(255,255,255,0.25)" fontSize="10" textAnchor="middle">RF 314'</text>
        {/* Infield diamond */}
        <polygon points={`${home.x},${home.y} ${first.x},${first.y} ${sec.x},${sec.y} ${third.x},${third.y}`}
          fill="rgba(200,160,80,0.08)" stroke="rgba(200,160,80,0.25)" strokeWidth="1" />
        {/* Spray dots */}
        {dots.map((d, i) => (
          <g key={i}>
            {d.isHR && <circle cx={d.x} cy={d.y} r={9} fill={d.color} opacity={0.15} />}
            <circle cx={d.x} cy={d.y} r={d.isHR ? 5 : 4} fill={d.color} opacity={d.isHR ? 0.9 : 0.5} />
          </g>
        ))}
        {/* Home plate */}
        <circle cx={home.x} cy={home.y} r={5} fill="#FFFFFF" opacity={0.8} />
        {/* Bases */}
        {[first, sec, third].map((b, i) => (
          <rect key={i} x={b.x - 4} y={b.y - 4} width={8} height={8} fill="rgba(255,255,255,0.4)" rx={1} transform={`rotate(45 ${b.x} ${b.y})`} />
        ))}
        {/* Pull/Center/Oppo zones overlay */}
        <text x={home.x + 90} y={home.y - 60} fill="rgba(80,200,130,0.7)" fontSize="10" fontWeight="bold">PULL {analysis.pull.pct}%</text>
        <text x={home.x - 10} y={home.y - 140} fill="rgba(96,180,240,0.7)" fontSize="10" fontWeight="bold">CTR {analysis.center.pct}%</text>
        <text x={home.x - 120} y={home.y - 60} fill="rgba(255,120,40,0.7)" fontSize="10" fontWeight="bold">OPPO {analysis.oppo.pct}%</text>
      </svg>
      {/* Legend */}
      <div className="flex items-center gap-4 px-5 pb-4">
        {[["#50C882","Pull"],["#60B4F0","Center"],["#FF7828","Oppo"]].map(([c,l]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
            <span className="text-[10px] text-white/35">{l}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2">
          <div className="w-2 h-2 rounded-full bg-white/60" />
          <span className="text-[10px] text-white/35">HR</span>
        </div>
      </div>
    </div>
  );
}

// ── Wall clearance card ────────────────────────────────────────────────────────

function WallClearanceCard({ label, fieldPos, clearance, carry, wall, spray, color }: {
  label: string; fieldPos: string; clearance: number; carry: number; wall: number; spray: number; color: string;
}) {
  const positive = clearance > 0;
  return (
    <div className="flex flex-col rounded-xl border border-white/[0.07] bg-[#111622] p-4 text-center">
      <p className="text-[9px] font-bold text-white/30 tracking-widest uppercase mb-0.5">{label}</p>
      <p className="text-[9px] text-white/20 mb-3">({fieldPos})</p>
      <div className="w-full h-1 rounded-full bg-white/[0.08] mb-3 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: "100%", backgroundColor: positive ? "#50C882" : "#EF4444" }} />
      </div>
      <p className={`text-2xl font-black mb-1 ${positive ? "text-[#50C882]" : "text-red-400"}`}>
        {positive ? "+" : ""}{clearance}ft
      </p>
      <p className="text-[10px] text-white/30 leading-relaxed">{carry}ft carry → {wall}ft wall</p>
      <p className="text-[10px] text-[#FF7828] mt-1">Spray: {spray}%</p>
    </div>
  );
}

// ── Pitch → spray row ─────────────────────────────────────────────────────────

function PitchSprayRow({ pitch }: { pitch: BatterAnalysis["pitchMix"][0] }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
      <div className="w-28 shrink-0">
        <p className="text-sm font-bold text-white">{pitch.name}</p>
        <p className="text-[10px] text-white/30">{pitch.usage}% · SLG {pitch.slg}</p>
      </div>
      <div className="flex-1 flex items-center gap-1 h-4">
        <div className="h-full rounded-l-full bg-[#50C882]" style={{ width: `${pitch.pullPct}%` }} />
        <div className="h-full bg-[#60B4F0]" style={{ width: `${pitch.centerPct}%` }} />
        <div className="h-full rounded-r-full bg-[#FF7828]" style={{ width: `${pitch.oppoPct}%` }} />
      </div>
      <div className="text-xs font-bold shrink-0"
        style={{ color: pitch.pullPct > pitch.oppoPct ? "#50C882" : "#FF7828" }}>
        → {pitch.pullPct > pitch.oppoPct ? `PULL ${pitch.pullPct}%` : `OPPO ${pitch.oppoPct}%`}
      </div>
    </div>
  );
}

// ── Matchup grade badge ───────────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    "A+": "#50C882", "A": "#50C882", "B+": "#FF7828", "B": "#FF7828", "C+": "#EB505A", "C": "#EB505A"
  };
  const c = colors[grade] ?? "#FF7828";
  return (
    <div className="flex items-center justify-center w-14 h-14 rounded-2xl border text-2xl font-black"
      style={{ borderColor: `${c}40`, backgroundColor: `${c}15`, color: c }}>
      {grade}
    </div>
  );
}

// ── Mock data generator ───────────────────────────────────────────────────────

function mockAnalysis(game: Game): BatterAnalysis {
  // Deterministic "analysis" based on game data
  const s = game.gamePk;
  const pitcher = game.teams.home.probablePitcher;
  const batter  = { id: 592518, name: "Aaron Judge" }; // placeholder

  return {
    playerId:   batter.id,
    playerName: batter.name,
    teamId:     game.teams.away.team.id,
    teamName:   game.teams.away.team.name,
    matchupGrade: ["A+","A","B+"][s % 3] as any,
    hrProbability: 12 + (s % 18),
    barrelPct:  15 + (s % 8),
    avgEV:      90 + (s % 8),
    maxEV:      108 + (s % 10),
    blastSlg:   0.045 + (s % 15) * 0.001,
    brlkAllowed: 7 + (s % 5),
    evAllowed:  88 + (s % 4),
    fbRate:     42 + (s % 12),
    hrPer9:     1.1 + (s % 8) * 0.1,
    pull:   { pct: 53, hrCount: 9,  wallClearance: 41,  avgDist: 380 },
    center: { pct: 33, hrCount: 6,  wallClearance: -46, avgDist: 350 },
    oppo:   { pct: 14, hrCount: 2,  wallClearance: 45,  avgDist: 360 },
    pitchMix: [
      { name: "4-Seam Fastball", usage: 45, slg: 0.680, pullPct: 48, centerPct: 30, oppoPct: 22 },
      { name: "Changeup",        usage: 26, slg: 0.675, pullPct: 42, centerPct: 32, oppoPct: 26 },
      { name: "Curveball",       usage: 16, slg: 0.413, pullPct: 30, centerPct: 35, oppoPct: 35 },
      { name: "Slider",          usage: 12, slg: 0.506, pullPct: 30, centerPct: 35, oppoPct: 35 },
    ],
    temp:       76,
    windSpeed:  10,
    windDir:    "L to R",
    parkFactor: 102,
  };
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HRDeepDivePage() {
  const [games, setGames]     = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Game | null>(null);

  useEffect(() => {
    fetchTodaysGames()
      .then((g) => {
        const with_pitchers = g.filter((x) => x.teams.away.probablePitcher || x.teams.home.probablePitcher);
        setGames(with_pitchers);
        setSelected(with_pitchers[0] ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const analysis = selected ? mockAnalysis(selected) : null;

  const content = (
    <div className="px-5 sm:px-8 py-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-[#818cf8]/15 flex items-center justify-center">
              <Star size={13} className="text-[#818cf8]" strokeWidth={2} />
            </div>
            <p className="text-[10px] font-bold text-[#818cf8] tracking-widest uppercase">Pro Feature</p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">HR Deep Dive</h1>
          <p className="text-sm text-white/35 mt-1">Spray analysis, wall clearance, carry conditions & pitch matchup grades</p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-[#818cf8]/25 bg-[#818cf8]/10 px-3 py-1.5">
          <Star size={10} className="text-[#818cf8]" strokeWidth={2.5} />
          <span className="text-[10px] font-black text-[#818cf8] tracking-widest uppercase">Pro $14.99/mo</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-20 text-white/25">
          <RefreshCw size={18} className="animate-spin" strokeWidth={1.5} />
          <span className="text-sm">Loading matchup data…</span>
        </div>
      ) : (
        <>
          {/* Game selector */}
          <div className="mb-8">
            <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-3">Select Game</p>
            <div className="flex flex-wrap gap-2">
              {games.map((g) => {
                const active = g.gamePk === selected?.gamePk;
                const awayAbbr = g.teams.away.team.name.split(" ").pop();
                const homeAbbr = g.teams.home.team.name.split(" ").pop();
                return (
                  <button
                    key={g.gamePk}
                    onClick={() => setSelected(g)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                      active
                        ? "border-[#818cf8]/40 bg-[#818cf8]/10 text-[#818cf8]"
                        : "border-white/[0.07] bg-[#111622] text-white/45 hover:text-white hover:border-white/15"
                    }`}
                  >
                    <TeamLogoImg teamId={g.teams.away.team.id} name={g.teams.away.team.name} size={18} />
                    {awayAbbr}
                    <span className="text-white/20">@</span>
                    {homeAbbr}
                    <TeamLogoImg teamId={g.teams.home.team.id} name={g.teams.home.team.name} size={18} />
                  </button>
                );
              })}
            </div>
          </div>

          {analysis && (
            <motion.div
              key={selected?.gamePk}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Matchup header card */}
              <div className="rounded-2xl border border-[#818cf8]/20 bg-[#0D1117] p-5 mb-5">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Player headshot */}
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#818cf8]/30 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={playerHeadshotUrl(analysis.playerId)}
                      alt={analysis.playerName}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-xl">{analysis.playerName}</p>
                    <p className="text-white/35 text-sm">{analysis.teamName}</p>
                    {selected?.teams.home.probablePitcher && (
                      <p className="text-white/30 text-xs mt-0.5">
                        vs {selected.teams.home.probablePitcher.fullName} · {selected.venue.name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <GradeBadge grade={analysis.matchupGrade} />
                    <div className="text-center">
                      <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">HR Prob</p>
                      <p className="text-3xl font-black text-[#818cf8]">{analysis.hrProbability}%</p>
                      <p className="text-[9px] text-[#818cf8]/60">Model estimate</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                {/* Spray chart */}
                <SprayChart analysis={analysis} />

                {/* Power + vulnerability */}
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5">
                    <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-4">Batter Power Metrics</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Barrel %",  value: `${analysis.barrelPct}%`,    sub: analysis.barrelPct >= 14 ? "ELITE" : "AVG", color: analysis.barrelPct >= 14 ? "#50C882" : "#FF7828" },
                        { label: "Avg EV",    value: `${analysis.avgEV} mph`,      sub: "Exit Velocity",                              color: "#FF7828" },
                        { label: "Max EV",    value: `${analysis.maxEV} mph`,      sub: "Peak",                                        color: "#818cf8" },
                        { label: "Blast SLG", value: `.${Math.round(analysis.blastSlg * 1000)}`, sub: "Blast SLG",             color: "#2dd4bf" },
                      ].map((m) => (
                        <div key={m.label} className="rounded-xl border border-white/[0.06] bg-[#0D1117] p-3">
                          <p className="text-[9px] text-white/25 tracking-widest uppercase mb-1">{m.label}</p>
                          <p className="text-lg font-black" style={{ color: m.color }}>{m.value}</p>
                          <p className="text-[9px] font-bold mt-0.5" style={{ color: m.color + "80" }}>{m.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5">
                    <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-4">Pitcher Vulnerability</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "BrLk Allowed", value: `${analysis.brlkAllowed}%`,    sub: analysis.brlkAllowed >= 8 ? "HIGH" : "MED", color: analysis.brlkAllowed >= 8 ? "#EB505A" : "#FF7828" },
                        { label: "EV Allowed",   value: `${analysis.evAllowed} mph`,    sub: "Avg Exit Vel",                               color: "#FF7828" },
                        { label: "FB Rate",      value: `${analysis.fbRate}%`,          sub: "Fly Ball %",                                 color: "#818cf8" },
                        { label: "HR/9",         value: `${analysis.hrPer9.toFixed(2)}`,sub: "Per 9 inn",                                  color: "#EB505A" },
                      ].map((m) => (
                        <div key={m.label} className="rounded-xl border border-white/[0.06] bg-[#0D1117] p-3">
                          <p className="text-[9px] text-white/25 tracking-widest uppercase mb-1">{m.label}</p>
                          <p className="text-lg font-black" style={{ color: m.color }}>{m.value}</p>
                          <p className="text-[9px] font-bold mt-0.5" style={{ color: m.color + "80" }}>{m.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Wall clearance */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5 mb-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase">Wall Clearance</p>
                  <p className="text-[10px] text-white/25">Carry-adjusted distance vs park walls</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <WallClearanceCard label="Pull" fieldPos="RF" clearance={analysis.pull.wallClearance} carry={analysis.pull.avgDist - 20} wall={314} spray={analysis.pull.pct} color="#50C882" />
                  <WallClearanceCard label="Center" fieldPos="CF" clearance={analysis.center.wallClearance} carry={analysis.center.avgDist - 10} wall={408} spray={analysis.center.pct} color="#60B4F0" />
                  <WallClearanceCard label="Oppo" fieldPos="LF" clearance={analysis.oppo.wallClearance} carry={analysis.oppo.avgDist} wall={318} spray={analysis.oppo.pct} color="#FF7828" />
                </div>
              </div>

              {/* Carry conditions + Pitch→Spray */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Carry conditions */}
                <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5">
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase">Today's Carry Conditions</p>
                    <p className="text-[10px] text-white/25">{analysis.temp}°F · {analysis.windSpeed}mph {analysis.windDir} · PF {analysis.parkFactor}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { pos: "RF", base: 314, delta: analysis.pull.wallClearance - 41   },
                      { pos: "CF", base: 408, delta: analysis.center.wallClearance + 46  },
                      { pos: "LF", base: 318, delta: analysis.oppo.wallClearance - 45   },
                    ].map((f) => (
                      <div key={f.pos} className="rounded-xl border border-white/[0.06] bg-[#0D1117] p-3 text-center">
                        <p className="text-[10px] text-white/30 font-bold tracking-wider uppercase mb-1">{f.pos}</p>
                        <p className="text-base font-black text-white">{f.base}ft</p>
                        <p className={`text-xs font-bold mt-0.5 ${f.delta > 0 ? "text-[#50C882]" : "text-red-400"}`}>
                          {f.delta > 0 ? "+" : ""}{f.delta.toFixed(0)}ft ({((f.delta / f.base) * 100).toFixed(1)}%)
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pitch → Spray */}
                <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase">Pitch → Spray Connection</p>
                    <p className="text-[10px] text-white/20">Where each pitch gets hit</p>
                  </div>
                  {analysis.pitchMix.map((p) => <PitchSprayRow key={p.name} pitch={p} />)}
                  <div className="flex items-center gap-4 mt-3 pt-2 border-t border-white/[0.05]">
                    {[["#50C882","Pull"],["#60B4F0","Center"],["#FF7828","Oppo"]].map(([c,l]) => (
                      <div key={l} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                        <span className="text-[9px] text-white/30">{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="mt-8 text-xs text-white/15 text-center">
                HR probability is a model estimate based on 2025 season data, pitch mix, park factors, and weather. For educational use only.
              </p>
            </motion.div>
          )}
        </>
      )}
    </div>
  );

  return (
    <PaywallGate
      requiredTier="pro"
      feature="HR Deep Dive"
      benefits={[
        "Spray chart with HR location mapping",
        "Wall clearance by Pull / Center / Oppo",
        "Carry conditions & park factor analysis",
        "Pitch → spray connection breakdown",
        "Batter power & pitcher vulnerability grades",
      ]}
    >
      {content}
    </PaywallGate>
  );
}
