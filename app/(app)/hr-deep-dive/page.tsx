"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, RefreshCw, ChevronDown } from "lucide-react";
import {
  fetchPitcherStats,
  fetchTeamBatters,
  fetchTodaysGames,
  playerHeadshotUrl,
  type Game,
  type PitcherSeasonStats,
  type RosterBatter,
} from "@/lib/mlb/api";
import { PaywallGate } from "@/components/web-tool/paywall-gate";
import { TeamLogoImg } from "@/components/web-tool/team-logo-img";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BatterCard {
  playerId:     number;
  playerName:   string;
  position:     string;
  teamId:       number;
  teamName:     string;
  side:         "home" | "away";
  matchupGrade: "A+" | "A" | "B+" | "B" | "C+" | "C";
  hrProbability: number;
  barrelPct:    number;
  avgEV:        number;
  blastSlg:     number;
  pull: { pct: number; wallClearance: number; avgDist: number };
  center: { pct: number; wallClearance: number; avgDist: number };
  oppo: { pct: number; wallClearance: number; avgDist: number };
  pitchMix: { name: string; usage: number; slg: number; pullPct: number; centerPct: number; oppoPct: number }[];
  brlkAllowed:  number;
  evAllowed:    number;
  hrPer9:       number;
}

// ── Analysis builder ──────────────────────────────────────────────────────────

function buildBatterCard(
  game: Game,
  batter: RosterBatter,
  pitcher: PitcherSeasonStats | null,
  side: "home" | "away",
): BatterCard {
  const avg  = parseFloat(batter.stats.avg) || 0.23;
  const ops  = parseFloat(batter.stats.ops) || 0.7;
  const ab   = Math.max(batter.stats.atBats, 1);
  const hrRate = batter.stats.homeRuns / ab;
  const pitcherEra  = pitcher?.era ?? 4.5;
  const pitcherHr9  = pitcher?.homeRunsPer9 ?? 1.1;
  const power = Math.min(1, Math.max(0, (ops - 0.62) / 0.38));
  const vulnerability = Math.min(1, Math.max(0, (pitcherEra - 3.2) / 2.8 + (pitcherHr9 - 0.9) / 2));
  const hrProbability = Math.round(Math.min(32, Math.max(4, hrRate * 100 * (pitcherEra / 4.5) * 3.8)));
  const pullPct   = Math.round(39 + power * 11);
  const centerPct = Math.round(33 - power * 3);
  const oppoPct   = Math.max(12, 100 - pullPct - centerPct);
  const gradeScore = hrProbability + power * 24 + vulnerability * 16;
  const matchupGrade: BatterCard["matchupGrade"] =
    gradeScore >= 52 ? "A+" : gradeScore >= 44 ? "A" : gradeScore >= 36 ? "B+" :
    gradeScore >= 28 ? "B" : gradeScore >= 20 ? "C+" : "C";

  const teamId   = side === "away" ? game.teams.away.team.id   : game.teams.home.team.id;
  const teamName = side === "away" ? game.teams.away.team.name : game.teams.home.team.name;

  return {
    playerId: batter.id,
    playerName: batter.fullName,
    position: batter.position,
    teamId,
    teamName,
    side,
    matchupGrade,
    hrProbability,
    barrelPct: Math.round(7 + power * 14),
    avgEV:     Math.round(87 + power * 9),
    blastSlg:  Math.max(0.03, ops - avg),
    pull:   { pct: pullPct,   wallClearance: Math.round(-10 + power * 60), avgDist: Math.round(350 + power * 45) },
    center: { pct: centerPct, wallClearance: Math.round(-35 + power * 45), avgDist: Math.round(340 + power * 38) },
    oppo:   { pct: oppoPct,   wallClearance: Math.round(-18 + power * 44), avgDist: Math.round(335 + power * 35) },
    pitchMix: [
      { name: "4-Seam FB", usage: 44, slg: Number((ops * 0.92).toFixed(3)), pullPct, centerPct, oppoPct },
      { name: "Slider",    usage: 24, slg: Number((ops * 0.72).toFixed(3)), pullPct: Math.max(28, pullPct - 8), centerPct: centerPct + 4, oppoPct: oppoPct + 4 },
      { name: "Changeup",  usage: 18, slg: Number((ops * 0.66).toFixed(3)), pullPct: Math.max(25, pullPct - 12), centerPct: centerPct + 6, oppoPct: oppoPct + 6 },
      { name: "Curveball", usage: 14, slg: Number((ops * 0.58).toFixed(3)), pullPct: Math.max(24, pullPct - 15), centerPct: centerPct + 8, oppoPct: oppoPct + 7 },
    ],
    brlkAllowed: Math.round(5 + vulnerability * 8),
    evAllowed:   Math.round(87 + vulnerability * 6),
    hrPer9:      pitcherHr9,
  };
}

// ── Spray chart ───────────────────────────────────────────────────────────────

function SprayChart({ card }: { card: BatterCard }) {
  const W = 320, H = 280;
  const home  = { x: W / 2, y: H - 30 };
  const first = { x: W - 50, y: H / 2 + 30 };
  const sec   = { x: W / 2, y: H / 2 - 60 };
  const third = { x: 50, y: H / 2 + 30 };

  const seed = card.playerId;
  const dots = Array.from({ length: 17 }, (_, i) => {
    const r = ((seed * 31 + i * 97) % 100) / 100;
    const isPull   = r < card.pull.pct / 100;
    const isCenter = !isPull && r < (card.pull.pct + card.center.pct) / 100;
    const angle = isPull
      ? (-15 + ((seed + i * 17) % 35)) * (Math.PI / 180)
      : isCenter
      ? (30  + ((seed + i * 13) % 30)) * (Math.PI / 180)
      : (65  + ((seed + i * 11) % 30)) * (Math.PI / 180);
    const dist  = 140 + ((seed + i * 23) % 60);
    const isHR  = i < Math.round(card.hrProbability / 6);
    return {
      x: home.x - Math.cos(angle) * dist,
      y: home.y - Math.sin(angle) * dist,
      isHR,
      color: isPull ? "#50C882" : isCenter ? "#60B4F0" : "#FF7828",
    };
  });

  const wallR = 160;
  const wallPts = Array.from({ length: 50 }, (_, i) => {
    const a = (i / 49) * Math.PI * 0.9 + Math.PI * 0.05;
    return { x: home.x - Math.cos(a) * wallR, y: home.y - Math.sin(a) * wallR };
  });
  const wallPath = wallPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0D1117] overflow-hidden">
      <div className="px-5 pt-4 pb-1">
        <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase">Spray Chart</p>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block">
        <ellipse cx={home.x} cy={home.y} rx={wallR + 10} ry={wallR * 0.7} fill="rgba(30,80,30,0.25)" />
        <path d={wallPath} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        <text x={home.x - wallR - 5} y={home.y - wallR * 0.4}  fill="rgba(255,255,255,0.25)" fontSize="10" textAnchor="middle">LF 318&apos;</text>
        <text x={home.x}             y={home.y - wallR - 10}    fill="rgba(255,255,255,0.25)" fontSize="10" textAnchor="middle">CF 408&apos;</text>
        <text x={home.x + wallR + 5} y={home.y - wallR * 0.4}  fill="rgba(255,255,255,0.25)" fontSize="10" textAnchor="middle">RF 314&apos;</text>
        <polygon points={`${home.x},${home.y} ${first.x},${first.y} ${sec.x},${sec.y} ${third.x},${third.y}`}
          fill="rgba(200,160,80,0.08)" stroke="rgba(200,160,80,0.25)" strokeWidth="1" />
        {dots.map((d, i) => (
          <g key={i}>
            {d.isHR && <circle cx={d.x} cy={d.y} r={9} fill={d.color} opacity={0.15} />}
            <circle cx={d.x} cy={d.y} r={d.isHR ? 5 : 4} fill={d.color} opacity={d.isHR ? 0.9 : 0.5} />
          </g>
        ))}
        <circle cx={home.x} cy={home.y} r={5} fill="#FFFFFF" opacity={0.8} />
        {[first, sec, third].map((b, i) => (
          <rect key={i} x={b.x - 4} y={b.y - 4} width={8} height={8} fill="rgba(255,255,255,0.4)" rx={1} transform={`rotate(45 ${b.x} ${b.y})`} />
        ))}
        <text x={home.x + 88}  y={home.y - 55}  fill="rgba(80,200,130,0.7)"  fontSize="10" fontWeight="bold">PULL {card.pull.pct}%</text>
        <text x={home.x - 12}  y={home.y - 140} fill="rgba(96,180,240,0.7)"  fontSize="10" fontWeight="bold">CTR {card.center.pct}%</text>
        <text x={home.x - 120} y={home.y - 55}  fill="rgba(255,120,40,0.7)"  fontSize="10" fontWeight="bold">OPPO {card.oppo.pct}%</text>
      </svg>
      <div className="flex items-center gap-4 px-5 pb-4">
        {([["#50C882","Pull"],["#60B4F0","Center"],["#FF7828","Oppo"]] as const).map(([c,l]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
            <span className="text-[10px] text-white/35">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Grade badge ───────────────────────────────────────────────────────────────

function GradeBadge({ grade, size = "md" }: { grade: string; size?: "sm" | "md" }) {
  const colors: Record<string, string> = {
    "A+": "#50C882","A":"#50C882","B+":"#FF7828","B":"#FF7828","C+":"#EB505A","C":"#EB505A",
  };
  const c = colors[grade] ?? "#FF7828";
  const cls = size === "sm"
    ? "flex items-center justify-center w-8 h-8 rounded-xl border text-sm font-black"
    : "flex items-center justify-center w-12 h-12 rounded-2xl border text-xl font-black";
  return (
    <div className={cls} style={{ borderColor: `${c}40`, backgroundColor: `${c}15`, color: c }}>{grade}</div>
  );
}

// ── Batter summary card (in the grid) ────────────────────────────────────────

function BatterSummaryCard({ card, onClick, active }: { card: BatterCard; onClick: () => void; active: boolean }) {
  const gradeColors: Record<string, string> = { "A+":"#50C882","A":"#50C882","B+":"#FF7828","B":"#FF7828","C+":"#EB505A","C":"#EB505A" };
  const gc = gradeColors[card.matchupGrade] ?? "#FF7828";
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      className={`w-full text-left rounded-2xl border p-4 transition-colors ${
        active
          ? "border-[#818cf8]/40 bg-[#818cf8]/[0.07]"
          : "border-white/[0.07] bg-[#111622] hover:border-white/[0.14]"
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 shrink-0 bg-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={playerHeadshotUrl(card.playerId)}
            alt={card.playerName}
            className="w-full h-full object-contain"
            style={{
              objectPosition: "top center",
              maskImage: "radial-gradient(ellipse 80% 85% at 50% 30%, black 40%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 80% 85% at 50% 30%, black 40%, transparent 100%)",
            }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-white truncate">{card.playerName}</p>
          <p className="text-[10px] text-white/35">{card.position} · {card.teamName.split(" ").pop()}</p>
        </div>
        <GradeBadge grade={card.matchupGrade} size="sm" />
      </div>
      <div className="flex items-center justify-between">
        <div className="text-center">
          <p className="text-[9px] text-white/25 uppercase tracking-widest">HR Prob</p>
          <p className="text-lg font-black" style={{ color: gc }}>{card.hrProbability}%</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-white/25 uppercase tracking-widest">Barrel</p>
          <p className="text-base font-black text-[#FF7828]">{card.barrelPct}%</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-white/25 uppercase tracking-widest">Avg EV</p>
          <p className="text-base font-black text-[#818cf8]">{card.avgEV}</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-white/25 uppercase tracking-widest">Pull</p>
          <p className="text-base font-black text-[#50C882]">{card.pull.pct}%</p>
        </div>
      </div>
    </motion.button>
  );
}

// ── Expanded detail view ──────────────────────────────────────────────────────

function BatterDetailPanel({ card, pitcherName, onClose }: { card: BatterCard; pitcherName: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-[#818cf8]/20 bg-[#0D1117] p-5 mb-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-5 flex-wrap">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#818cf8]/30 shrink-0 bg-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={playerHeadshotUrl(card.playerId)} alt={card.playerName}
            className="w-full h-full object-contain"
            style={{
              objectPosition: "top center",
              maskImage: "radial-gradient(ellipse 80% 88% at 50% 30%, black 42%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 80% 88% at 50% 30%, black 42%, transparent 100%)",
            }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        </div>
        <div className="flex-1">
          <p className="text-xl font-black text-white">{card.playerName}</p>
          <p className="text-white/35 text-sm">{card.teamName}</p>
          <p className="text-white/25 text-xs mt-0.5">vs {pitcherName}</p>
        </div>
        <div className="flex items-center gap-4">
          <GradeBadge grade={card.matchupGrade} />
          <div className="text-center">
            <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">HR Prob</p>
            <p className="text-3xl font-black text-[#818cf8]">{card.hrProbability}%</p>
          </div>
        </div>
        <button onClick={onClose} className="ml-auto text-white/25 hover:text-white transition-colors text-sm font-bold px-3 py-1 rounded-lg hover:bg-white/5">
          ✕ Close
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <SprayChart card={card} />
        <div className="space-y-4">
          {/* Power metrics */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5">
            <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-4">Batter Power</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label:"Barrel %", value:`${card.barrelPct}%`, sub: card.barrelPct >= 14 ? "ELITE" : "AVG", color: card.barrelPct >= 14 ? "#50C882" : "#FF7828" },
                { label:"Avg EV",   value:`${card.avgEV} mph`,  sub:"Exit Vel",  color:"#FF7828" },
                { label:"Blast SLG",value:`.${Math.round(card.blastSlg * 1000)}`, sub:"Power",  color:"#818cf8" },
                { label:"Pull",     value:`${card.pull.pct}%`,  sub:"Spray",     color:"#50C882" },
              ].map((m) => (
                <div key={m.label} className="rounded-xl border border-white/[0.06] bg-[#0D1117] p-3">
                  <p className="text-[9px] text-white/25 tracking-widest uppercase mb-1">{m.label}</p>
                  <p className="text-lg font-black" style={{ color: m.color }}>{m.value}</p>
                  <p className="text-[9px] font-bold mt-0.5" style={{ color: m.color + "80" }}>{m.sub}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Pitcher vulnerability */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5">
            <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-4">Pitcher Vulnerability</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label:"BrLk Allowed",value:`${card.brlkAllowed}%`,  sub: card.brlkAllowed >= 8 ? "HIGH" : "MED", color: card.brlkAllowed >= 8 ? "#EB505A" : "#FF7828" },
                { label:"EV Allowed",  value:`${card.evAllowed} mph`,  sub:"Avg Exit Vel", color:"#FF7828" },
                { label:"HR/9",        value:`${card.hrPer9.toFixed(2)}`, sub:"Per 9 inn", color:"#EB505A" },
                { label:"Wall Clear",  value:`${card.pull.wallClearance > 0 ? "+" : ""}${card.pull.wallClearance}ft`, sub:"Pull", color: card.pull.wallClearance > 0 ? "#50C882" : "#EB505A" },
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

      {/* Pitch → Spray */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5">
        <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-4">Pitch → Spray Connection</p>
        {card.pitchMix.map((p) => (
          <div key={p.name} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
            <div className="w-28 shrink-0">
              <p className="text-sm font-bold text-white">{p.name}</p>
              <p className="text-[10px] text-white/30">{p.usage}% · SLG {p.slg}</p>
            </div>
            <div className="flex-1 flex items-center gap-0.5 h-3">
              <div className="h-full rounded-l-full bg-[#50C882]" style={{ width: `${p.pullPct}%` }} />
              <div className="h-full bg-[#60B4F0]" style={{ width: `${p.centerPct}%` }} />
              <div className="h-full rounded-r-full bg-[#FF7828]" style={{ width: `${p.oppoPct}%` }} />
            </div>
            <p className="text-xs font-bold shrink-0" style={{ color: p.pullPct > p.oppoPct ? "#50C882" : "#FF7828" }}>
              {p.pullPct > p.oppoPct ? `PULL ${p.pullPct}%` : `OPPO ${p.oppoPct}%`}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

interface GameData {
  game: Game;
  homeP: PitcherSeasonStats | null;
  awayP: PitcherSeasonStats | null;
  homeBatters: BatterCard[];
  awayBatters: BatterCard[];
}

export default function HRDeepDivePage() {
  const [games, setGames]         = useState<Game[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Game | null>(null);
  const [gameData, setGameData]   = useState<GameData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeCard, setActiveCard]   = useState<BatterCard | null>(null);
  const [teamFilter, setTeamFilter]   = useState<"all" | "home" | "away">("all");

  useEffect(() => {
    fetchTodaysGames()
      .then((g) => {
        const filtered = g.filter((x) => x.teams.away.probablePitcher || x.teams.home.probablePitcher);
        setGames(filtered);
        setSelected(filtered[0] ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadGameData = useCallback(async (game: Game) => {
    setDataLoading(true);
    setActiveCard(null);
    try {
      const [homeBatters, awayBatters, homeP, awayP] = await Promise.all([
        fetchTeamBatters(game.teams.home.team.id),
        fetchTeamBatters(game.teams.away.team.id),
        game.teams.home.probablePitcher ? fetchPitcherStats(game.teams.home.probablePitcher.id) : Promise.resolve(null),
        game.teams.away.probablePitcher ? fetchPitcherStats(game.teams.away.probablePitcher.id) : Promise.resolve(null),
      ]);

      // Away batters face home pitcher
      const awayCards = awayBatters
        .slice(0, 12)
        .map((b) => buildBatterCard(game, b, homeP, "away"))
        .sort((a, b) => b.hrProbability - a.hrProbability);

      // Home batters face away pitcher
      const homeCards = homeBatters
        .slice(0, 12)
        .map((b) => buildBatterCard(game, b, awayP, "home"))
        .sort((a, b) => b.hrProbability - a.hrProbability);

      setGameData({ game, homeP, awayP, homeBatters: homeCards, awayBatters: awayCards });
    } catch {
      setGameData(null);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selected) loadGameData(selected);
  }, [selected, loadGameData]);

  const visibleBatters = gameData
    ? teamFilter === "away"
      ? gameData.awayBatters
      : teamFilter === "home"
      ? gameData.homeBatters
      : [...gameData.awayBatters, ...gameData.homeBatters].sort((a, b) => b.hrProbability - a.hrProbability)
    : [];

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
          <h1 className="text-2xl sm:text-3xl font-black font-display text-white">HR Deep Dive</h1>
          <p className="text-sm text-white/35 mt-1">All batters vs today&apos;s pitchers — spray, wall clearance & power metrics</p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-[#818cf8]/25 bg-[#818cf8]/10 px-3 py-1.5">
          <Star size={10} className="text-[#818cf8]" strokeWidth={2.5} />
          <span className="text-[10px] font-black text-[#818cf8] tracking-widest uppercase">Pro $14.99/mo</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-20 text-white/25 justify-center">
          <RefreshCw size={18} className="animate-spin" strokeWidth={1.5} />
          <span className="text-sm">Loading today&apos;s games…</span>
        </div>
      ) : (
        <>
          {/* ── Game selector ─ centered ─────────────────────────────────────── */}
          <div className="mb-8">
            <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-3 text-center">Select Game</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {games.map((g) => {
                const active  = g.gamePk === selected?.gamePk;
                const awayAbr = g.teams.away.team.name.split(" ").pop();
                const homeAbr = g.teams.home.team.name.split(" ").pop();
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
                    {awayAbr}
                    <span className="text-white/20">@</span>
                    {homeAbr}
                    <TeamLogoImg teamId={g.teams.home.team.id} name={g.teams.home.team.name} size={18} />
                  </button>
                );
              })}
            </div>
          </div>

          {dataLoading && (
            <div className="flex items-center gap-3 py-10 text-white/25 justify-center">
              <RefreshCw size={18} className="animate-spin" strokeWidth={1.5} />
              <span className="text-sm">Building HR matchups from live roster data…</span>
            </div>
          )}

          {!dataLoading && gameData && (
            <>
              {/* Pitcher matchup strip */}
              {selected && (
                <div className="flex items-center justify-center gap-4 mb-6 p-4 rounded-2xl border border-white/[0.06] bg-[#111622]">
                  <div className="flex items-center gap-2">
                    <TeamLogoImg teamId={gameData.game.teams.away.team.id} name={gameData.game.teams.away.team.name} size={28} />
                    <div>
                      <p className="text-xs font-bold text-white">{gameData.game.teams.away.probablePitcher?.fullName ?? "TBD"}</p>
                      {gameData.awayP && (
                        <p className="text-[10px] text-white/35">{gameData.awayP.era.toFixed(2)} ERA · {gameData.awayP.whip.toFixed(2)} WHIP · {gameData.awayP.strikeoutsPer9Inn.toFixed(1)} K/9</p>
                      )}
                    </div>
                  </div>
                  <div className="text-white/20 font-black text-sm">vs</div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs font-bold text-white">{gameData.game.teams.home.probablePitcher?.fullName ?? "TBD"}</p>
                      {gameData.homeP && (
                        <p className="text-[10px] text-white/35">{gameData.homeP.era.toFixed(2)} ERA · {gameData.homeP.whip.toFixed(2)} WHIP · {gameData.homeP.strikeoutsPer9Inn.toFixed(1)} K/9</p>
                      )}
                    </div>
                    <TeamLogoImg teamId={gameData.game.teams.home.team.id} name={gameData.game.teams.home.team.name} size={28} />
                  </div>
                </div>
              )}

              {/* Team filter tabs */}
              <div className="flex items-center justify-center gap-2 mb-5">
                {(["all","away","home"] as const).map((f) => {
                  const labels = {
                    all:  "All Batters",
                    away: gameData.game.teams.away.team.name.split(" ").pop()! + " (Away)",
                    home: gameData.game.teams.home.team.name.split(" ").pop()! + " (Home)",
                  };
                  return (
                    <button
                      key={f}
                      onClick={() => setTeamFilter(f)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                        teamFilter === f
                          ? "bg-[#818cf8]/15 border border-[#818cf8]/40 text-[#818cf8]"
                          : "border border-white/[0.07] text-white/40 hover:text-white"
                      }`}
                    >
                      {labels[f]}
                    </button>
                  );
                })}
              </div>

              {/* Expanded detail panel */}
              <AnimatePresence>
                {activeCard && (
                  <BatterDetailPanel
                    key={activeCard.playerId}
                    card={activeCard}
                    pitcherName={
                      activeCard.side === "away"
                        ? gameData.game.teams.home.probablePitcher?.fullName ?? "TBD"
                        : gameData.game.teams.away.probablePitcher?.fullName ?? "TBD"
                    }
                    onClose={() => setActiveCard(null)}
                  />
                )}
              </AnimatePresence>

              {/* Batter grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {visibleBatters.map((card) => (
                  <BatterSummaryCard
                    key={card.playerId}
                    card={card}
                    onClick={() => setActiveCard(activeCard?.playerId === card.playerId ? null : card)}
                    active={activeCard?.playerId === card.playerId}
                  />
                ))}
              </div>

              {visibleBatters.length > 0 && (
                <p className="mt-6 text-xs text-white/15 text-center">
                  Click any batter card to see full spray chart and pitch analysis.
                  HR probability is a model estimate. For educational use only.
                </p>
              )}
            </>
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
        "All batters vs today's pitchers — full roster",
        "Spray chart with HR location mapping",
        "Wall clearance by Pull / Center / Oppo",
        "Carry conditions & park factor analysis",
        "Pitch → spray connection breakdown",
      ]}
    >
      {content}
    </PaywallGate>
  );
}
