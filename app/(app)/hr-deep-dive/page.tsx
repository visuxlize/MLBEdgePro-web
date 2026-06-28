"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, RefreshCw, Plus, Check, Flame, Clock } from "lucide-react";
import {
  fetchPitcherStats,
  fetchTeamBatters,
  fetchTodaysGames,
  type Game,
  type PitcherSeasonStats,
  type RosterBatter,
} from "@/lib/mlb/api";
import { PaywallGate } from "@/components/web-tool/paywall-gate";
import { Headshot } from "@/components/web-tool/headshot";
import { LogoBadge, SectionLabel, GradePill, teamHex, teamCode, alpha } from "@/components/web-tool/spotlight";

const AI_SLIP_KEY = "edge-ai-pending-picks";

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

function isHotCard(c: BatterCard) { return c.matchupGrade === "A+" || c.matchupGrade === "A"; }
function isDueCard(c: BatterCard) { return !isHotCard(c) && c.hrProbability >= 14; }

// ── Analysis builder (unchanged model) ─────────────────────────────────────────

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

// ── Add-to-slip handoff (read by Prop Builder's pending-picks banner) ──────────

function addHrToSlip(card: BatterCard, pitcherName: string) {
  try {
    const pick = {
      playerId: card.playerId,
      playerName: card.playerName,
      teamId: card.teamId,
      propType: "HR",
      probability: card.hrProbability,
      description: `${card.playerName} HR vs ${pitcherName.split(" ").pop()}`,
      odds: "",
    };
    const stored = JSON.parse(localStorage.getItem(AI_SLIP_KEY) || "[]") as Array<{ description: string }>;
    if (!stored.some((p) => p.description === pick.description)) {
      localStorage.setItem(AI_SLIP_KEY, JSON.stringify([...stored, pick]));
      window.dispatchEvent(new Event("ai-picks-updated"));
    }
  } catch { /* noop */ }
}

// ── HR ring (conic) ─────────────────────────────────────────────────────────────

function HRRing({ pct, size = 58 }: { pct: number; size?: number }) {
  return (
    <div className="spot-ring" style={{ width: size, height: size, ["--grade" as string]: "var(--purple)", ["--edge" as string]: Math.min(100, pct * 3) }}>
      <div className="flex flex-col items-center leading-none">
        <span className="font-spot-mono font-extrabold" style={{ fontSize: size * 0.28, color: "var(--purple-soft)" }}>{pct}</span>
        <span className="spot-label-sm" style={{ fontSize: size * 0.13, color: "var(--text-muted)" }}>HR%</span>
      </div>
    </div>
  );
}

function HotDueTag({ card }: { card: BatterCard }) {
  if (isHotCard(card)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 spot-label-sm" style={{ color: "var(--orange-2)", background: "var(--orange-tint)", border: "1px solid var(--orange-line)" }}>
        <Flame size={9} strokeWidth={2.5} /> HOT
      </span>
    );
  }
  if (isDueCard(card)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 spot-label-sm" style={{ color: "var(--purple-2)", background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>
        <Clock size={9} strokeWidth={2.5} /> DUE
      </span>
    );
  }
  return null;
}

function SlipButton({ onAdd, added }: { onAdd: () => void; added: boolean }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onAdd(); }}
      disabled={added}
      className="inline-flex items-center gap-1 rounded-[var(--r-chip)] px-2.5 py-1.5 font-spot-sans text-xs font-bold transition-all shrink-0"
      style={added
        ? { color: "var(--green)", background: "var(--green-bg)", border: "1px solid rgba(52,211,153,.4)" }
        : { color: "var(--purple-2)", background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}
    >
      {added ? <Check size={11} /> : <Plus size={11} />}
      {added ? "Added" : "Slip"}
    </button>
  );
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
      color: isPull ? "#34d399" : isCenter ? "#60a5fa" : "#f97316",
    };
  });

  const wallR = 160;
  const wallPts = Array.from({ length: 50 }, (_, i) => {
    const a = (i / 49) * Math.PI * 0.9 + Math.PI * 0.05;
    return { x: home.x - Math.cos(a) * wallR, y: home.y - Math.sin(a) * wallR };
  });
  const wallPath = wallPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div className="rounded-[var(--r-card)] overflow-hidden" style={{ background: "var(--panel-2)", border: "1px solid var(--hairline)" }}>
      <div className="px-5 pt-4 pb-1">
        <SectionLabel>Spray Chart</SectionLabel>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block">
        <ellipse cx={home.x} cy={home.y} rx={wallR + 10} ry={wallR * 0.7} fill="rgba(124,92,250,0.10)" />
        <path d={wallPath} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        <text x={home.x - wallR - 5} y={home.y - wallR * 0.4}  fill="rgba(255,255,255,0.25)" fontSize="10" textAnchor="middle">LF 318&apos;</text>
        <text x={home.x}             y={home.y - wallR - 10}    fill="rgba(255,255,255,0.25)" fontSize="10" textAnchor="middle">CF 408&apos;</text>
        <text x={home.x + wallR + 5} y={home.y - wallR * 0.4}  fill="rgba(255,255,255,0.25)" fontSize="10" textAnchor="middle">RF 314&apos;</text>
        <polygon points={`${home.x},${home.y} ${first.x},${first.y} ${sec.x},${sec.y} ${third.x},${third.y}`}
          fill="rgba(167,139,250,0.08)" stroke="rgba(167,139,250,0.25)" strokeWidth="1" />
        {dots.map((d, i) => (
          <g key={i}>
            {d.isHR && <circle cx={d.x} cy={d.y} r={9} fill={d.color} opacity={0.18} />}
            <circle cx={d.x} cy={d.y} r={d.isHR ? 5 : 4} fill={d.color} opacity={d.isHR ? 0.9 : 0.5} />
          </g>
        ))}
        <circle cx={home.x} cy={home.y} r={5} fill="#FFFFFF" opacity={0.8} />
        {[first, sec, third].map((b, i) => (
          <rect key={i} x={b.x - 4} y={b.y - 4} width={8} height={8} fill="rgba(255,255,255,0.4)" rx={1} transform={`rotate(45 ${b.x} ${b.y})`} />
        ))}
        <text x={home.x + 88}  y={home.y - 55}  fill="rgba(52,211,153,0.8)"  fontSize="10" fontWeight="bold">PULL {card.pull.pct}%</text>
        <text x={home.x - 12}  y={home.y - 140} fill="rgba(96,165,250,0.8)"  fontSize="10" fontWeight="bold">CTR {card.center.pct}%</text>
        <text x={home.x - 120} y={home.y - 55}  fill="rgba(249,115,22,0.8)"  fontSize="10" fontWeight="bold">OPPO {card.oppo.pct}%</text>
      </svg>
      <div className="flex items-center gap-4 px-5 pb-4">
        {([["#34d399","Pull"],["#60a5fa","Center"],["#f97316","Oppo"]] as const).map(([c,l]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="rounded-full" style={{ width: 8, height: 8, backgroundColor: c }} />
            <span className="font-spot-sans text-[10px]" style={{ color: "var(--text-muted)" }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Metric tile ─────────────────────────────────────────────────────────────────

function MetricTile({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-[var(--r-tile)] p-3" style={{ background: "var(--inset-soft)", border: "1px solid var(--hairline-2)" }}>
      <p className="spot-label-sm mb-1" style={{ color: "var(--text-faint)" }}>{label}</p>
      <p className="font-spot-mono text-lg font-extrabold" style={{ color }}>{value}</p>
      <p className="font-spot-sans text-[9px] font-bold mt-0.5" style={{ color: `color-mix(in srgb, ${color} 65%, transparent)` }}>{sub}</p>
    </div>
  );
}

// ── Batter rail card ──────────────────────────────────────────────────────────

function BatterRailCard({ card, onClick, active, onAdd, added }: {
  card: BatterCard; onClick: () => void; active: boolean; onAdd: () => void; added: boolean;
}) {
  const hex = teamHex(card.teamId);
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      className="w-full text-left rounded-[var(--r-card)] p-4 transition-colors"
      style={{
        background: active
          ? "var(--purple-tint)"
          : `linear-gradient(135deg, ${alpha(hex, "1c")}, var(--panel))`,
        border: active ? "1px solid var(--purple-line)" : "1px solid var(--hairline)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <HRRing pct={card.hrProbability} size={52} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <LogoBadge teamId={card.teamId} name={card.teamName} size={18} radius={5} />
            <HotDueTag card={card} />
            <GradePill grade={card.matchupGrade} />
          </div>
          <p className="font-spot-sans text-sm font-black truncate" style={{ color: "var(--text)" }}>{card.playerName}</p>
          <p className="font-spot-sans text-[10px]" style={{ color: "var(--text-muted)" }}>{card.position} · {card.teamName.split(" ").pop()}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {[
            { l: "Barrel", v: `${card.barrelPct}%`, c: "var(--orange-2)" },
            { l: "EV", v: `${card.avgEV}`, c: "var(--purple-2)" },
            { l: "Pull", v: `${card.pull.pct}%`, c: "var(--green)" },
          ].map((m) => (
            <div key={m.l} className="text-center">
              <p className="font-spot-mono text-sm font-black" style={{ color: m.c }}>{m.v}</p>
              <p className="spot-label-sm" style={{ color: "var(--text-faint)" }}>{m.l}</p>
            </div>
          ))}
        </div>
        <SlipButton onAdd={onAdd} added={added} />
      </div>
    </motion.button>
  );
}

// ── Batter spotlight (expanded) ────────────────────────────────────────────────

function BatterSpotlight({ card, pitcherName, onClose, onAdd, added }: {
  card: BatterCard; pitcherName: string; onClose: () => void; onAdd: () => void; added: boolean;
}) {
  const hex = teamHex(card.teamId);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.3 }}
      className="rounded-[var(--r-panel)] p-5 mb-6"
      style={{ background: "var(--panel)", border: "1px solid var(--purple-line)", boxShadow: "var(--shadow-panel)" }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: batter header + spray */}
        <div className="space-y-4">
          <div className="rounded-[var(--r-card)] p-5 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${alpha(hex, "2e")}, var(--panel-2))`, border: "1px solid var(--hairline)" }}>
            <button onClick={onClose} className="absolute top-3 right-3 font-spot-sans text-xs font-bold px-2 py-1 rounded-lg" style={{ color: "var(--text-muted)" }}>✕</button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 flex items-center justify-center shrink-0">
                <Headshot id={card.playerId} name={card.playerName} size={64} variant="md" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <LogoBadge teamId={card.teamId} name={card.teamName} size={20} radius={6} />
                  <span className="font-spot-sans text-xs font-bold" style={{ color: "var(--text-3)" }}>{card.teamName}</span>
                </div>
                <p className="font-spot-sans text-xl font-black leading-tight" style={{ color: "var(--text)" }}>{card.playerName}</p>
                <p className="font-spot-sans text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>vs {pitcherName}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: "1px solid var(--hairline-2)" }}>
              <div>
                <SectionLabel style={{ color: "var(--text-3)" }}>HR Probability</SectionLabel>
                <p className="font-spot-mono text-5xl font-extrabold leading-none mt-1" style={{ color: "var(--purple-2)" }}>{card.hrProbability}%</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <GradePill grade={card.matchupGrade} />
                <HotDueTag card={card} />
              </div>
            </div>
            <button
              onClick={onAdd} disabled={added}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-[var(--r-tile)] py-2.5 font-spot-sans text-sm font-black transition-all"
              style={added
                ? { color: "var(--green)", background: "var(--green-bg)", border: "1px solid rgba(52,211,153,.4)" }
                : { color: "#fff", background: "var(--grad-purple)", boxShadow: "0 6px 18px rgba(124,92,250,.35)" }}
            >
              {added ? <><Check size={14} /> Added to slip</> : <><Plus size={14} /> Add HR to slip</>}
            </button>
          </div>
          <SprayChart card={card} />
        </div>

        {/* Right: power tiles + vulnerability + pitch mix */}
        <div className="space-y-4">
          <div className="rounded-[var(--r-card)] p-5" style={{ background: "var(--panel-2)", border: "1px solid var(--hairline)" }}>
            <SectionLabel className="mb-4">Batter Power</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <MetricTile label="Barrel %" value={`${card.barrelPct}%`} sub={card.barrelPct >= 14 ? "ELITE" : "AVG"} color={card.barrelPct >= 14 ? "var(--green)" : "var(--orange-2)"} />
              <MetricTile label="Avg EV" value={`${card.avgEV} mph`} sub="Exit Vel" color="var(--orange-2)" />
              <MetricTile label="Blast SLG" value={`.${Math.round(card.blastSlg * 1000)}`} sub="Power" color="var(--purple-2)" />
              <MetricTile label="Pull %" value={`${card.pull.pct}%`} sub="Spray" color="var(--green)" />
            </div>
          </div>
          <div className="rounded-[var(--r-card)] p-5" style={{ background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>
            <SectionLabel className="mb-4" style={{ color: "var(--purple-soft)" }}>Pitcher Vulnerability</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <MetricTile label="Brl Allowed" value={`${card.brlkAllowed}%`} sub={card.brlkAllowed >= 8 ? "HIGH" : "MED"} color={card.brlkAllowed >= 8 ? "var(--red)" : "var(--orange-2)"} />
              <MetricTile label="EV Allowed" value={`${card.evAllowed} mph`} sub="Avg Exit Vel" color="var(--orange-2)" />
              <MetricTile label="HR/9" value={card.hrPer9.toFixed(2)} sub="Per 9 inn" color="var(--red)" />
              <MetricTile label="Wall Clear" value={`${card.pull.wallClearance > 0 ? "+" : ""}${card.pull.wallClearance}ft`} sub="Pull" color={card.pull.wallClearance > 0 ? "var(--green)" : "var(--red)"} />
            </div>
          </div>
          <div className="rounded-[var(--r-card)] p-5" style={{ background: "var(--panel-2)", border: "1px solid var(--hairline)" }}>
            <SectionLabel className="mb-3">Pitch → Spray Connection</SectionLabel>
            {card.pitchMix.map((p) => (
              <div key={p.name} className="flex items-center gap-3 py-2.5" style={{ borderBottom: "1px solid var(--hairline-2)" }}>
                <div className="w-24 shrink-0">
                  <p className="font-spot-sans text-sm font-bold" style={{ color: "var(--text)" }}>{p.name}</p>
                  <p className="font-spot-mono text-[10px]" style={{ color: "var(--text-muted)" }}>{p.usage}% · SLG {p.slg}</p>
                </div>
                <div className="flex-1 flex items-center gap-0.5 h-3">
                  <div className="h-full rounded-l-full" style={{ width: `${p.pullPct}%`, background: "#34d399" }} />
                  <div className="h-full" style={{ width: `${p.centerPct}%`, background: "#60a5fa" }} />
                  <div className="h-full rounded-r-full" style={{ width: `${p.oppoPct}%`, background: "#f97316" }} />
                </div>
                <p className="font-spot-sans text-xs font-bold shrink-0" style={{ color: p.pullPct > p.oppoPct ? "#34d399" : "#f97316" }}>
                  {p.pullPct > p.oppoPct ? `PULL ${p.pullPct}%` : `OPPO ${p.oppoPct}%`}
                </p>
              </div>
            ))}
          </div>
        </div>
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
  const [addedIds, setAddedIds]       = useState<Set<number>>(new Set());

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
      const awayCards = awayBatters.slice(0, 12).map((b) => buildBatterCard(game, b, homeP, "away")).sort((a, b) => b.hrProbability - a.hrProbability);
      const homeCards = homeBatters.slice(0, 12).map((b) => buildBatterCard(game, b, awayP, "home")).sort((a, b) => b.hrProbability - a.hrProbability);
      setGameData({ game, homeP, awayP, homeBatters: homeCards, awayBatters: awayCards });
    } catch {
      setGameData(null);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => { if (selected) loadGameData(selected); }, [selected, loadGameData]);

  const pitcherFor = useCallback((card: BatterCard) => {
    if (!gameData) return "TBD";
    return card.side === "away"
      ? gameData.game.teams.home.probablePitcher?.fullName ?? "TBD"
      : gameData.game.teams.away.probablePitcher?.fullName ?? "TBD";
  }, [gameData]);

  const handleAdd = useCallback((card: BatterCard) => {
    addHrToSlip(card, pitcherFor(card));
    setAddedIds((s) => new Set(s).add(card.playerId));
  }, [pitcherFor]);

  const visibleBatters = gameData
    ? teamFilter === "away" ? gameData.awayBatters
    : teamFilter === "home" ? gameData.homeBatters
    : [...gameData.awayBatters, ...gameData.homeBatters].sort((a, b) => b.hrProbability - a.hrProbability)
    : [];

  const content = (
    <div className="spotlight min-h-screen">
    <div className="px-4 sm:px-8 py-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>
              <Zap size={13} style={{ color: "var(--purple-2)" }} strokeWidth={2.4} />
            </div>
            <SectionLabel style={{ color: "var(--purple-2)" }}>Pro Feature</SectionLabel>
          </div>
          <h1 className="font-spot-sans text-3xl sm:text-4xl font-black" style={{ color: "var(--text)" }}>HR Nuke</h1>
          <p className="font-spot-sans text-sm mt-1" style={{ color: "var(--text-muted)" }}>Every batter vs today&apos;s pitchers — spray, power & vulnerability</p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 spot-label-sm" style={{ color: "var(--purple-2)", background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>
          <Zap size={10} strokeWidth={2.5} /> Pro $14.99/mo
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-20 justify-center" style={{ color: "var(--text-muted)" }}>
          <RefreshCw size={18} className="animate-spin" /><span className="font-spot-sans text-sm">Loading today&apos;s games…</span>
        </div>
      ) : (
        <>
          {/* Game selector chips */}
          <div className="mb-7">
            <SectionLabel className="mb-3 text-center">Select Game</SectionLabel>
            <div className="flex flex-wrap gap-2 justify-center">
              {games.map((g) => {
                const active = g.gamePk === selected?.gamePk;
                return (
                  <button key={g.gamePk} onClick={() => setSelected(g)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-[var(--r-tile)] font-spot-sans text-sm font-semibold transition-colors"
                    style={active
                      ? { color: "var(--purple-2)", background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }
                      : { color: "var(--text-muted)", background: "var(--panel)", border: "1px solid var(--hairline)" }}>
                    <LogoBadge teamId={g.teams.away.team.id} name={g.teams.away.team.name} size={18} radius={5} />
                    {teamCode(g.teams.away.team.id, g.teams.away.team.name)}
                    <span style={{ color: "var(--text-ghost)" }}>@</span>
                    {teamCode(g.teams.home.team.id, g.teams.home.team.name)}
                    <LogoBadge teamId={g.teams.home.team.id} name={g.teams.home.team.name} size={18} radius={5} />
                  </button>
                );
              })}
            </div>
          </div>

          {dataLoading && (
            <div className="flex items-center gap-3 py-10 justify-center" style={{ color: "var(--text-muted)" }}>
              <RefreshCw size={18} className="animate-spin" /><span className="font-spot-sans text-sm">Building HR matchups…</span>
            </div>
          )}

          {!dataLoading && gameData && (
            <>
              {/* Pitcher vs pitcher banner */}
              {selected && (
                <div className="flex items-center justify-center gap-4 sm:gap-8 mb-6 p-4 rounded-[var(--r-card)]" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
                  {[
                    { id: gameData.game.teams.away.team.id, name: gameData.game.teams.away.team.name, p: gameData.game.teams.away.probablePitcher?.fullName, st: gameData.awayP, align: "left" as const },
                    { id: gameData.game.teams.home.team.id, name: gameData.game.teams.home.team.name, p: gameData.game.teams.home.probablePitcher?.fullName, st: gameData.homeP, align: "right" as const },
                  ].map((side, i) => (
                    <div key={i} className={`flex items-center gap-3 ${side.align === "right" ? "flex-row-reverse text-right" : ""}`}>
                      <LogoBadge teamId={side.id} name={side.name} size={36} />
                      <div>
                        <p className="font-spot-sans text-sm font-bold" style={{ color: "var(--text)" }}>{side.p ?? "TBD"}</p>
                        {side.st && (
                          <p className="font-spot-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                            {side.st.era.toFixed(2)} ERA · {side.st.whip.toFixed(2)} WHIP · {side.st.strikeoutsPer9Inn.toFixed(1)} K/9
                          </p>
                        )}
                      </div>
                      {i === 0 && <span className="font-spot-sans font-black text-sm" style={{ color: "var(--text-ghost)" }}>vs</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Team filter */}
              <div className="flex items-center justify-center gap-2 mb-5">
                {(["all", "away", "home"] as const).map((f) => {
                  const labels = {
                    all: "All Batters",
                    away: gameData.game.teams.away.team.name.split(" ").pop()! + " (Away)",
                    home: gameData.game.teams.home.team.name.split(" ").pop()! + " (Home)",
                  };
                  const active = teamFilter === f;
                  return (
                    <button key={f} onClick={() => setTeamFilter(f)}
                      className="px-4 py-2 rounded-full font-spot-sans text-xs font-bold transition-colors"
                      style={active
                        ? { color: "var(--purple-2)", background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }
                        : { color: "var(--text-muted)", border: "1px solid var(--hairline)" }}>
                      {labels[f]}
                    </button>
                  );
                })}
              </div>

              {/* Spotlight */}
              <AnimatePresence>
                {activeCard && (
                  <BatterSpotlight
                    key={activeCard.playerId}
                    card={activeCard}
                    pitcherName={pitcherFor(activeCard)}
                    onClose={() => setActiveCard(null)}
                    onAdd={() => handleAdd(activeCard)}
                    added={addedIds.has(activeCard.playerId)}
                  />
                )}
              </AnimatePresence>

              {/* Batter rail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {visibleBatters.map((card) => (
                  <BatterRailCard
                    key={card.playerId}
                    card={card}
                    active={activeCard?.playerId === card.playerId}
                    onClick={() => setActiveCard(activeCard?.playerId === card.playerId ? null : card)}
                    onAdd={() => handleAdd(card)}
                    added={addedIds.has(card.playerId)}
                  />
                ))}
              </div>

              {visibleBatters.length > 0 && (
                <p className="mt-6 font-spot-sans text-xs text-center" style={{ color: "var(--text-ghost)" }}>
                  Tap any batter for full spray chart & pitch analysis. HR probability is a model estimate — for educational use only.
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
    </div>
  );

  return (
    <PaywallGate
      requiredTier="pro"
      feature="HR Nuke"
      benefits={[
        "All batters vs today's pitchers — full roster",
        "Spray chart with HR location mapping",
        "Wall clearance by Pull / Center / Oppo",
        "Pitcher vulnerability & power metrics",
        "Pitch → spray connection breakdown",
      ]}
    >
      {content}
    </PaywallGate>
  );
}
