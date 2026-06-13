"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Zap, RefreshCw, Target, Plus,
  ChevronRight, BarChart3, DollarSign, Trash2, CheckCircle2,
  ShoppingCart, X, Trophy, Flame, Clock,
} from "lucide-react";
import { WC_TEAMS, eloWinProb } from "@/lib/worldcup/data";
import type { TodayMatch } from "@/app/api/worldcup/today/route";

// ── Constants ─────────────────────────────────────────────────────────────────

const GOLD   = "#FBBF24";
const BLUE   = "#38BDF8";
const GREEN  = "#4ADE80";
const RED    = "#F87171";
const ORANGE = "#FF7828";

// ── Key players per team for dynamic prop generation ──────────────────────────

interface KnownPlayer { name: string; scorerRate: number; }
const TEAM_PLAYERS: Record<string, KnownPlayer[]> = {
  usa: [
    { name: "Christian Pulisic",  scorerRate: 0.35 },
    { name: "Folarin Balogun",    scorerRate: 0.30 },
    { name: "Gio Reyna",          scorerRate: 0.20 },
    { name: "Weston McKennie",    scorerRate: 0.15 },
    { name: "Tyler Adams",        scorerRate: 0.08 },
  ],
  arg: [
    { name: "Lionel Messi",       scorerRate: 0.55 },
    { name: "Julián Álvarez",     scorerRate: 0.40 },
    { name: "Lautaro Martínez",   scorerRate: 0.38 },
    { name: "Di María",           scorerRate: 0.22 },
  ],
  fra: [
    { name: "Kylian Mbappé",      scorerRate: 0.50 },
    { name: "Antoine Griezmann",  scorerRate: 0.30 },
    { name: "Olivier Giroud",     scorerRate: 0.28 },
  ],
  bra: [
    { name: "Vinícius Jr.",       scorerRate: 0.45 },
    { name: "Richarlison",        scorerRate: 0.35 },
    { name: "Rodrygo",            scorerRate: 0.28 },
    { name: "Raphinha",           scorerRate: 0.26 },
  ],
  eng: [
    { name: "Harry Kane",         scorerRate: 0.48 },
    { name: "Marcus Rashford",    scorerRate: 0.30 },
    { name: "Bukayo Saka",        scorerRate: 0.28 },
    { name: "Phil Foden",         scorerRate: 0.25 },
  ],
  esp: [
    { name: "Álvaro Morata",      scorerRate: 0.35 },
    { name: "Ferrán Torres",      scorerRate: 0.28 },
    { name: "Pedri",              scorerRate: 0.18 },
    { name: "Dani Olmo",          scorerRate: 0.22 },
  ],
  por: [
    { name: "Cristiano Ronaldo",  scorerRate: 0.50 },
    { name: "Bruno Fernandes",    scorerRate: 0.32 },
    { name: "Rafael Leão",        scorerRate: 0.28 },
    { name: "Diogo Jota",         scorerRate: 0.30 },
  ],
  ger: [
    { name: "Kai Havertz",        scorerRate: 0.35 },
    { name: "Jamal Musiala",      scorerRate: 0.32 },
    { name: "Florian Wirtz",      scorerRate: 0.30 },
    { name: "Leroy Sané",         scorerRate: 0.25 },
  ],
  ned: [
    { name: "Memphis Depay",      scorerRate: 0.38 },
    { name: "Cody Gakpo",         scorerRate: 0.32 },
    { name: "Wout Weghorst",      scorerRate: 0.25 },
  ],
  mex: [
    { name: "Hirving Lozano",     scorerRate: 0.30 },
    { name: "Raúl Jiménez",       scorerRate: 0.35 },
    { name: "Henry Martín",       scorerRate: 0.25 },
  ],
  par: [
    { name: "Miguel Almirón",     scorerRate: 0.25 },
    { name: "Julio Enciso",       scorerRate: 0.22 },
    { name: "Antonio Sanabria",   scorerRate: 0.28 },
  ],
  ecu: [
    { name: "Enner Valencia",     scorerRate: 0.35 },
    { name: "Gonzalo Plata",      scorerRate: 0.22 },
    { name: "Moisés Caicedo",     scorerRate: 0.10 },
  ],
  col: [
    { name: "Luis Díaz",          scorerRate: 0.32 },
    { name: "James Rodríguez",    scorerRate: 0.25 },
    { name: "Radamel Falcao",     scorerRate: 0.30 },
  ],
  cro: [
    { name: "Andrej Kramarić",    scorerRate: 0.35 },
    { name: "Ivan Perišić",       scorerRate: 0.28 },
    { name: "Luka Modrić",        scorerRate: 0.15 },
  ],
  uru: [
    { name: "Darwin Núñez",       scorerRate: 0.40 },
    { name: "Luis Suárez",        scorerRate: 0.35 },
    { name: "Federico Valverde",  scorerRate: 0.18 },
  ],
  bel: [
    { name: "Romelu Lukaku",      scorerRate: 0.42 },
    { name: "Kevin De Bruyne",    scorerRate: 0.25 },
    { name: "Dries Mertens",      scorerRate: 0.28 },
  ],
  sui: [
    { name: "Breel Embolo",       scorerRate: 0.32 },
    { name: "Xherdan Shaqiri",    scorerRate: 0.25 },
    { name: "Granit Xhaka",       scorerRate: 0.12 },
  ],
  mor: [
    { name: "Youssef En-Nesyri",  scorerRate: 0.35 },
    { name: "Hakim Ziyech",       scorerRate: 0.22 },
    { name: "Sofiane Boufal",     scorerRate: 0.20 },
  ],
  jpn: [
    { name: "Kaoru Mitoma",       scorerRate: 0.30 },
    { name: "Ritsu Doan",         scorerRate: 0.25 },
    { name: "Takumi Minamino",    scorerRate: 0.22 },
  ],
  kor: [
    { name: "Son Heung-min",      scorerRate: 0.40 },
    { name: "Hwang Hee-chan",     scorerRate: 0.28 },
  ],
  sen: [
    { name: "Sadio Mané",         scorerRate: 0.42 },
    { name: "Ismaïla Sarr",       scorerRate: 0.28 },
    { name: "Boulaye Dia",        scorerRate: 0.30 },
  ],
  can: [
    { name: "Jonathan David",     scorerRate: 0.40 },
    { name: "Cyle Larin",         scorerRate: 0.28 },
    { name: "Alphonso Davies",    scorerRate: 0.12 },
  ],
  nor: [
    { name: "Erling Haaland",     scorerRate: 0.62 },
    { name: "Martin Ødegaard",    scorerRate: 0.28 },
  ],
  pol: [
    { name: "Robert Lewandowski", scorerRate: 0.52 },
    { name: "Piotr Zieliński",    scorerRate: 0.20 },
  ],
  srb: [
    { name: "Aleksandar Mitrović",scorerRate: 0.48 },
    { name: "Dušan Vlahović",     scorerRate: 0.42 },
  ],
  tur: [
    { name: "Hakan Çalhanoğlu",   scorerRate: 0.25 },
    { name: "Burak Yılmaz",       scorerRate: 0.32 },
  ],
  aut: [
    { name: "Marko Arnautovic",   scorerRate: 0.35 },
    { name: "Marcel Sabitzer",    scorerRate: 0.20 },
  ],
  den: [
    { name: "Christian Eriksen",  scorerRate: 0.22 },
    { name: "Kasper Dolberg",     scorerRate: 0.30 },
  ],
  swe: [
    { name: "Viktor Gyökeres",    scorerRate: 0.42 },
    { name: "Dejan Kulusevski",   scorerRate: 0.28 },
  ],
  civ: [
    { name: "Sébastien Haller",   scorerRate: 0.38 },
    { name: "Nicolas Pépé",       scorerRate: 0.28 },
  ],
  nga: [
    { name: "Victor Osimhen",     scorerRate: 0.45 },
    { name: "Kelechi Iheanacho",  scorerRate: 0.28 },
  ],
};

function getDefaultPlayers(teamId: string): KnownPlayer[] {
  return TEAM_PLAYERS[teamId] ?? [
    { name: `${WC_TEAMS[teamId]?.name ?? teamId} Striker`, scorerRate: 0.30 },
    { name: `${WC_TEAMS[teamId]?.name ?? teamId} Forward`,  scorerRate: 0.22 },
  ];
}

// ── Odds helpers ──────────────────────────────────────────────────────────────

function probToAmerican(prob: number, vig = 1.04): string {
  const adj = Math.min(prob * vig, 0.96);
  const dec = 1 / adj;
  if (dec >= 2) return `+${Math.round((dec - 1) * 100)}`;
  return `-${Math.round(100 / (dec - 1))}`;
}

function americanToDecimal(odds: string): number {
  const n = parseInt(odds.replace("+", ""));
  return n > 0 ? n / 100 + 1 : 100 / Math.abs(n) + 1;
}

function combinedDecimal(legs: SlipLeg[]): number {
  return legs.reduce((acc, l) => acc * americanToDecimal(l.odds), 1);
}

function decimalToAmerican(dec: number): string {
  if (dec >= 2) return `+${Math.round((dec - 1) * 100)}`;
  return `-${Math.round(100 / (dec - 1))}`;
}

// ELO → win/draw/away probs (normalised)
function matchProbs(homeElo: number, awayElo: number): { hw: number; dw: number; aw: number } {
  const rawHW = eloWinProb(homeElo, awayElo);
  const rawAW = eloWinProb(awayElo, homeElo);
  const rawD  = Math.max(1 - rawHW - rawAW, 0.1) * 0.9;
  const total = rawHW + rawD + rawAW;
  return { hw: rawHW / total, dw: rawD / total, aw: rawAW / total };
}

// Expected goals estimate from ELO
function teamXG(elo: number): number {
  return Math.max(0.6, 1.3 + (elo - 1600) / 500);
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SlipProp {
  id:          string;
  matchLabel:  string;
  playerName:  string;
  teamId:      string;
  propType:    string;
  odds:        string;
  modelProb:   number;
  impliedProb: number;
  edge:        number;
  hot?:        boolean;
  value?:      boolean;
}

interface SlipLeg {
  prop: SlipProp;
  pick: string;
  odds: string;
}

interface DynamicMatch {
  id:         string;
  home:       string;
  homeId:     string;
  homeFlag:   string;
  away:       string;
  awayId:     string;
  awayFlag:   string;
  date:       string;
  time:       string;
  venue:      string;
  groupId:    string;
  homeElo:    number;
  awayElo:    number;
  status:     string;
  homeScore:  number | null;
  awayScore:  number | null;
}

// ── Prop generator ────────────────────────────────────────────────────────────

function generateProps(match: DynamicMatch): SlipProp[] {
  const props: SlipProp[] = [];
  const { homeId, awayId, homeElo, awayElo } = match;
  const { hw, dw, aw } = matchProbs(homeElo, awayElo);

  const pairs: Array<[string, number]> = [
    [homeId, homeElo],
    [awayId, awayElo],
  ];

  let idCounter = 0;
  for (const [teamId, elo] of pairs) {
    const players = getDefaultPlayers(teamId);
    const xg = teamXG(elo);
    const teamScoreProb = 1 - Math.exp(-xg);

    // Anytime goalscorer props for top 3 players
    for (const player of players.slice(0, 3)) {
      const modelProb = Math.round(teamScoreProb * player.scorerRate * 100);
      const odds = probToAmerican(modelProb / 100);
      const impliedProb = Math.round(100 / (americanToDecimal(odds) * 1.04));
      const edge = modelProb - impliedProb;
      props.push({
        id:          `${match.id}_scorer_${teamId}_${idCounter++}`,
        matchLabel:  `${match.home} vs ${match.away}`,
        playerName:  player.name,
        teamId,
        propType:    "Anytime Goalscorer",
        odds,
        modelProb,
        impliedProb,
        edge,
        hot:   edge >= 4,
        value: edge >= 8,
      });
    }
  }

  // Total Goals O/U 2.5
  const totalXG = teamXG(homeElo) + teamXG(awayElo);
  const overProb = Math.round(Math.min(70, Math.max(30, 50 + (totalXG - 2.5) * 15)));
  const overOdds = probToAmerican(overProb / 100);
  const overEdge = overProb - Math.round(100 / (americanToDecimal(overOdds) * 1.04));
  props.push({
    id:          `${match.id}_total_over`,
    matchLabel:  `${match.home} vs ${match.away}`,
    playerName:  `${match.home} vs ${match.away}`,
    teamId:      homeId,
    propType:    "Total Goals Over 2.5",
    odds:        overOdds,
    modelProb:   overProb,
    impliedProb: Math.round(100 / (americanToDecimal(overOdds) * 1.04)),
    edge:        overEdge,
    hot:         overEdge >= 4,
    value:       overEdge >= 8,
  });

  return props;
}

// ── Badge components ──────────────────────────────────────────────────────────

function EdgeBadge({ edge }: { edge: number }) {
  const color = edge >= 8 ? GREEN : edge >= 4 ? GOLD : edge >= 1 ? BLUE : RED;
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black"
      style={{ background: `${color}15`, color }}
    >
      <Zap size={7} strokeWidth={3} />{edge >= 0 ? `+${edge}` : edge}%
    </span>
  );
}

function OddsPill({ odds, size = "sm" }: { odds: string; size?: "xs" | "sm" }) {
  const pos = odds.startsWith("+");
  const cls = size === "xs" ? "text-[9px] px-1.5 py-0.5" : "text-xs px-2 py-1";
  return (
    <span className={`font-black rounded-lg border ${cls} ${
      pos
        ? "text-[#4ADE80] border-[#4ADE80]/25 bg-[#4ADE80]/[0.06]"
        : "text-white/70 border-white/10 bg-white/[0.04]"
    }`}>
      {odds}
    </span>
  );
}

function FlagImg({ cc, name, className }: { cc: string; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`${className ?? ""} flex items-center justify-center bg-white/[0.12] text-white/50 font-black`}
        style={{ fontSize: "7px" }}>
        {name.slice(0, 3).toUpperCase()}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w40/${cc.toLowerCase()}.png`}
      alt={name}
      className={`${className ?? ""} object-cover`}
      onError={() => setFailed(true)}
    />
  );
}

// ── Match Card (Moneyline) ─────────────────────────────────────────────────────

function MatchCard({
  match,
  onAddLeg,
}: {
  match: DynamicMatch;
  onAddLeg: (leg: SlipLeg) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const { hw, dw, aw } = matchProbs(match.homeElo, match.awayElo);

  const isDone = match.status === "completed";
  const isLive = match.status === "live";

  const homeML = probToAmerican(hw);
  const drawML = probToAmerican(dw);
  const awayML = probToAmerican(aw);

  return (
    <motion.div
      className="rounded-2xl border border-white/[0.07] overflow-hidden"
      style={{ background: "linear-gradient(160deg, #10161f, #090d14)" }}
      layout
    >
      <button onClick={() => setExpanded((v) => !v)} className="w-full px-4 py-3.5 flex items-center gap-3 text-left">
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[9px] font-black text-[#FBBF24] border border-[#FBBF24]/25 rounded-full px-1.5 py-0.5">
            GRP {match.groupId}
          </span>
          {(isDone || isLive) ? (
            <span className={`text-[9px] font-black border rounded-full px-1.5 py-0.5 ${
              isLive
                ? "text-red-400 border-red-400/25 bg-red-400/10"
                : "text-white/30 border-white/10"
            }`}>
              {isLive ? "LIVE" : "FT"}
            </span>
          ) : (
            <span className="text-[9px] font-black text-[#4ADE80] border border-[#4ADE80]/25 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
              TODAY
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-4 rounded overflow-hidden border border-white/10 shrink-0">
            <FlagImg cc={match.homeFlag} name={match.home} className="w-full h-full" />
          </div>
          <span className="text-sm font-black text-white truncate">{match.home}</span>
          {(isDone || isLive) ? (
            <span className="text-sm font-black text-white/60 px-2">
              {match.homeScore} – {match.awayScore}
            </span>
          ) : (
            <span className="text-[10px] text-white/25">vs</span>
          )}
          <div className="w-6 h-4 rounded overflow-hidden border border-white/10 shrink-0">
            <FlagImg cc={match.awayFlag} name={match.away} className="w-full h-full" />
          </div>
          <span className="text-sm font-black text-white truncate">{match.away}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <OddsPill odds={homeML} size="xs" />
          <span className="text-[9px] text-white/20">/</span>
          <OddsPill odds={drawML} size="xs" />
          <span className="text-[9px] text-white/20">/</span>
          <OddsPill odds={awayML} size="xs" />
          <motion.div animate={{ rotate: expanded ? 90 : 0 }}>
            <ChevronRight size={13} className="text-white/25" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="px-4 pb-4 space-y-3 border-t border-white/[0.05] pt-3">
              <p className="text-[10px] text-white/25">
                <Clock size={9} className="inline mr-1" />
                {match.time} · {match.venue.split(",")[0]}
              </p>

              {/* Win probability bar */}
              <div className="space-y-1.5">
                <p className="text-[9px] text-white/25 uppercase tracking-widest font-bold">Win Probability (ELO)</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-[#38BDF8] w-8 text-right">{Math.round(hw * 100)}%</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden bg-white/[0.05] flex">
                    <motion.div className="h-full bg-[#38BDF8]" initial={{ width: 0 }} animate={{ width: `${hw * 100}%` }} transition={{ duration: 0.8 }} />
                    <motion.div className="h-full bg-white/15" initial={{ width: 0 }} animate={{ width: `${dw * 100}%` }} transition={{ duration: 0.8 }} />
                    <motion.div className="h-full bg-[#F87171]" initial={{ width: 0 }} animate={{ width: `${aw * 100}%` }} transition={{ duration: 0.8 }} />
                  </div>
                  <span className="text-[10px] font-black text-[#F87171] w-8">{Math.round(aw * 100)}%</span>
                </div>
                <div className="flex justify-between text-[9px] text-white/20">
                  <span>{match.home}</span>
                  <span>Draw {Math.round(dw * 100)}%</span>
                  <span>{match.away}</span>
                </div>
              </div>

              {/* Quick-add moneyline buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: match.home,  odds: homeML, pick: `${match.home} ML`,  teamId: match.homeId },
                  { label: "Draw",      odds: drawML, pick: "Draw",               teamId: match.homeId },
                  { label: match.away,  odds: awayML, pick: `${match.away} ML`,  teamId: match.awayId },
                ].map(({ label, odds, pick }) => (
                  <button
                    key={pick}
                    onClick={() => onAddLeg({
                      prop: { id: `ml_${match.id}_${pick}`, matchLabel: `${match.home} vs ${match.away}`, playerName: pick, teamId: match.homeId, propType: "Moneyline", odds, modelProb: 0, impliedProb: 0, edge: 0 },
                      pick,
                      odds,
                    })}
                    className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 px-2 hover:border-[#FBBF24]/30 hover:bg-[#FBBF24]/[0.05] transition-colors group"
                  >
                    <span className="text-[9px] text-white/40 group-hover:text-white/60 font-medium truncate w-full text-center">{label}</span>
                    <OddsPill odds={odds} size="xs" />
                    <span className="text-[8px] text-white/25 flex items-center gap-0.5"><Plus size={7} />Add</span>
                  </button>
                ))}
              </div>

              {/* Spread + Total */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                  <p className="text-[9px] text-white/30 uppercase tracking-wider mb-2">Handicap</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white/50">{match.homeElo > match.awayElo ? match.home : match.away} –0.5</span>
                      <OddsPill odds={probToAmerican(match.homeElo > match.awayElo ? hw + 0.05 : aw + 0.05)} size="xs" />
                    </div>
                  </div>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                  <p className="text-[9px] text-white/30 uppercase tracking-wider mb-2">Total Goals</p>
                  <div className="space-y-1.5">
                    {[
                      { label: "Over 2.5",  prob: Math.min(0.65, Math.max(0.3, 0.5 + (teamXG(match.homeElo) + teamXG(match.awayElo) - 2.5) * 0.2)) },
                      { label: "Under 2.5", prob: 0 },
                    ].map(({ label, prob }, i) => {
                      const p = i === 0 ? prob : 1 - prob;
                      return (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-[10px] text-white/50">{label}</span>
                          <OddsPill odds={probToAmerican(p)} size="xs" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Prop Row ──────────────────────────────────────────────────────────────────

function PropRow({ prop, inSlip, onToggle, index }: {
  prop: SlipProp;
  inSlip: boolean;
  onToggle: (p: SlipProp) => void;
  index: number;
}) {
  const team = WC_TEAMS[prop.teamId];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`rounded-xl border p-3 transition-all ${
        inSlip ? "border-[#FBBF24]/30 bg-[#FBBF24]/[0.05]"
        : prop.value ? "border-[#4ADE80]/20 bg-[#4ADE80]/[0.03]"
        : "border-white/[0.06] bg-[#0D1420]"
      }`}
    >
      <div className="flex items-start gap-3">
        {team && (
          <div className="w-6 h-4 rounded overflow-hidden border border-white/10 shrink-0 mt-0.5">
            <FlagImg cc={team.countryCode} name={team.shortName} className="w-full h-full" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-xs font-bold text-white/85">{prop.playerName}</p>
            {prop.hot   && <span className="text-[8px] font-black text-[#FF7828] bg-[#FF7828]/12 border border-[#FF7828]/20 rounded-full px-1.5 py-0.5 flex items-center gap-0.5"><Flame size={7} />HOT</span>}
            {prop.value && <span className="text-[8px] font-black text-[#4ADE80] bg-[#4ADE80]/12 border border-[#4ADE80]/20 rounded-full px-1.5 py-0.5 flex items-center gap-0.5"><Zap size={7} />VALUE</span>}
          </div>
          <p className="text-[10px] text-white/40 mb-2">{prop.propType}</p>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-[8px] text-white/25">Model</span>
                <span className="text-[8px] font-bold text-[#38BDF8]">{prop.modelProb}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                <motion.div className="h-full bg-[#38BDF8] rounded-full" initial={{ width: 0 }} animate={{ width: `${prop.modelProb}%` }} transition={{ duration: 0.6, delay: index * 0.03 }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-[8px] text-white/25">Implied</span>
                <span className="text-[8px] font-bold text-white/40">{prop.impliedProb}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                <motion.div className="h-full bg-white/20 rounded-full" initial={{ width: 0 }} animate={{ width: `${prop.impliedProb}%` }} transition={{ duration: 0.6, delay: index * 0.03 + 0.1 }} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <OddsPill odds={prop.odds} size="xs" />
          <EdgeBadge edge={prop.edge} />
          <button
            onClick={() => onToggle(prop)}
            className={`flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg border transition-all ${
              inSlip
                ? "border-[#FBBF24]/40 bg-[#FBBF24]/10 text-[#FBBF24]"
                : "border-white/[0.1] text-white/35 hover:text-white hover:border-white/25"
            }`}
          >
            {inSlip ? <><CheckCircle2 size={9} />Added</> : <><Plus size={9} />Add</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Slip Panel ────────────────────────────────────────────────────────────────

function PropSlip({ legs, onRemove, onClear }: {
  legs: SlipLeg[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const [stake, setStake] = useState("10");
  const [submitted, setSubmitted] = useState(false);

  const totalDecimal  = combinedDecimal(legs);
  const combinedOdds  = legs.length > 0 ? decimalToAmerican(totalDecimal) : null;
  const stakeNum      = parseFloat(stake) || 0;
  const payout        = (stakeNum * totalDecimal).toFixed(2);
  const profit        = (stakeNum * totalDecimal - stakeNum).toFixed(2);

  if (submitted) {
    return (
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl border border-[#4ADE80]/25 bg-[#4ADE80]/[0.05] p-5 text-center">
        <CheckCircle2 size={32} className="text-[#4ADE80] mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-sm font-black text-white mb-1">Slip Saved!</p>
        <p className="text-xs text-white/40 mb-4">Track your {legs.length}-leg parlay in Bet Tracker</p>
        <button onClick={() => { setSubmitted(false); onClear(); }} className="text-xs font-bold text-[#4ADE80]/70 hover:text-[#4ADE80]">New Slip</button>
      </motion.div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0A0E18] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <ShoppingCart size={13} className="text-[#FBBF24]" strokeWidth={2} />
          <p className="text-xs font-black text-white">Prop Slip</p>
          {legs.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#FBBF24] text-[#0A0E18] text-[9px] font-black flex items-center justify-center">{legs.length}</span>
          )}
        </div>
        {legs.length > 0 && (
          <button onClick={onClear} className="text-[10px] text-white/30 hover:text-[#F87171] transition-colors flex items-center gap-1">
            <Trash2 size={10} />Clear
          </button>
        )}
      </div>

      {legs.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <ShoppingCart size={28} className="text-white/10 mx-auto mb-2" strokeWidth={1.2} />
          <p className="text-xs text-white/25">Add props to build a parlay</p>
          <p className="text-[10px] text-white/15 mt-1">Click "Add" on any prop below</p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {legs.map((leg) => (
            <motion.div key={leg.prop.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-2 px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-white/80 truncate">{leg.prop.playerName}</p>
                <p className="text-[9px] text-white/35 truncate">{leg.prop.propType}</p>
              </div>
              <OddsPill odds={leg.odds} size="xs" />
              <button onClick={() => onRemove(leg.prop.id)} className="text-white/20 hover:text-[#F87171] transition-colors mt-0.5">
                <X size={12} strokeWidth={2} />
              </button>
            </motion.div>
          ))}

          {legs.length >= 2 && combinedOdds && (
            <div className="px-4 py-3 bg-[#FBBF24]/[0.04]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/40">{legs.length}-Leg Parlay</span>
                <span className="text-sm font-black text-[#FBBF24]">{combinedOdds}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-white/25">Decimal</span>
                <span className="text-[9px] text-white/40">{totalDecimal.toFixed(2)}x</span>
              </div>
            </div>
          )}

          <div className="px-4 py-3">
            <p className="text-[9px] text-white/30 uppercase tracking-widest mb-2">Stake (Units)</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 border border-white/[0.1] rounded-xl px-3 py-2 flex-1 bg-white/[0.03]">
                <DollarSign size={11} className="text-white/30" strokeWidth={2} />
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  min="1"
                  className="flex-1 bg-transparent text-sm font-bold text-white outline-none w-full"
                />
              </div>
              {[5, 10, 25].map((v) => (
                <button
                  key={v}
                  onClick={() => setStake(String(v))}
                  className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border transition-colors ${
                    stake === String(v)
                      ? "border-[#FBBF24]/40 bg-[#FBBF24]/10 text-[#FBBF24]"
                      : "border-white/[0.08] text-white/30 hover:text-white"
                  }`}
                >
                  {v}u
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-3 bg-white/[0.02]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-white/40">Potential Payout</span>
              <span className="text-sm font-black text-[#4ADE80]">${payout}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/25">Profit</span>
              <span className="text-[9px] text-white/50">+${profit}</span>
            </div>
          </div>

          <div className="px-4 py-3">
            <button
              onClick={() => setSubmitted(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition-colors bg-[#FBBF24]/15 border border-[#FBBF24]/30 text-[#FBBF24] hover:bg-[#FBBF24]/25"
            >
              <Trophy size={12} strokeWidth={2.5} />Save to Bet Tracker
            </button>
            <p className="text-[8px] text-white/15 text-center mt-2">
              For informational use only · Not a real wager
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Value Bets Section ────────────────────────────────────────────────────────

function ValueBetsSection({ props, slip, onToggle }: { props: SlipProp[]; slip: SlipLeg[]; onToggle: (p: SlipProp) => void }) {
  const valueBets = props.filter((p) => p.value || p.edge >= 8);
  if (valueBets.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.07] p-8 text-center">
        <TrendingUp size={24} className="text-white/15 mx-auto mb-2" />
        <p className="text-white/30 text-sm">No high-edge value bets detected today</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-xl border border-[#38BDF8]/15 bg-[#38BDF8]/[0.05] px-4 py-2.5 mb-3">
        <Target size={12} className="text-[#38BDF8]" />
        <p className="text-[11px] text-[#38BDF8]/80">
          <span className="font-bold text-[#38BDF8]">Value bets</span> — model probability exceeds implied by ≥8 points
        </p>
      </div>
      {valueBets.map((p, i) => (
        <PropRow key={p.id} prop={p} inSlip={slip.some((l) => l.prop.id === p.id)} onToggle={onToggle} index={i} />
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function BettingDashboard() {
  const [tab, setTab]             = useState<"markets" | "props" | "value">("markets");
  const [slip, setSlip]           = useState<SlipLeg[]>([]);
  const [showSlip, setShowSlip]   = useState(false);
  const [propFilter, setPropFilter] = useState<"all" | "scorer" | "total">("all");
  const [propMatchIdx, setPropMatchIdx] = useState(0);

  const [matches,  setMatches]  = useState<DynamicMatch[]>([]);
  const [allProps, setAllProps] = useState<SlipProp[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function loadMatches() {
      try {
        const res = await fetch("/api/worldcup/today");
        if (res.ok) {
          const { matches: raw } = await res.json();
          if (Array.isArray(raw) && raw.length > 0) {
            const mapped: DynamicMatch[] = (raw as TodayMatch[]).map((m) => {
              const ht = WC_TEAMS[m.homeId];
              const at = WC_TEAMS[m.awayId];
              return {
                id:         `${m.homeId}_${m.awayId}`,
                home:       m.home,
                homeId:     m.homeId,
                homeFlag:   ht?.countryCode ?? m.homeId,
                away:       m.away,
                awayId:     m.awayId,
                awayFlag:   at?.countryCode ?? m.awayId,
                date:       m.date,
                time:       m.time,
                venue:      m.venue,
                groupId:    m.groupId,
                homeElo:    ht?.strength ?? 1650,
                awayElo:    at?.strength ?? 1650,
                status:     m.status,
                homeScore:  m.homeScore,
                awayScore:  m.awayScore,
              };
            });
            setMatches(mapped);
            setAllProps(mapped.flatMap(generateProps));
          }
        }
      } catch {
        // leave empty
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, []);

  const toggleProp = (prop: SlipProp) => {
    setSlip((prev) => {
      const exists = prev.find((l) => l.prop.id === prop.id);
      if (exists) return prev.filter((l) => l.prop.id !== prop.id);
      return [...prev, { prop, pick: `${prop.playerName} — ${prop.propType}`, odds: prop.odds }];
    });
    setShowSlip(true);
  };

  const addLeg = (leg: SlipLeg) => {
    setSlip((prev) => prev.find((l) => l.prop.id === leg.prop.id) ? prev : [...prev, leg]);
    setShowSlip(true);
  };

  const currentMatch = matches[propMatchIdx];
  const matchProps   = currentMatch
    ? allProps.filter((p) => p.matchLabel === `${currentMatch.home} vs ${currentMatch.away}`)
    : [];
  const filteredProps = matchProps.filter((p) => {
    if (propFilter === "scorer") return p.propType.includes("Goalscorer");
    if (propFilter === "total")  return p.propType.includes("Total");
    return true;
  });

  return (
    <div className="flex flex-col xl:flex-row gap-5">
      {/* Left: main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-[#FF7828]/25 bg-[#FF7828]/[0.08] px-3 py-1.5">
              <BarChart3 size={11} className="text-[#FF7828]" strokeWidth={2.5} />
              <span className="text-[10px] font-black text-[#FF7828] tracking-widest uppercase">WC Odds</span>
            </div>
            <span className="text-[10px] text-white/30">ELO Model · WC 2026</span>
          </div>
          <button
            onClick={() => setShowSlip((v) => !v)}
            className="xl:hidden flex items-center gap-2 rounded-xl border border-[#FBBF24]/25 bg-[#FBBF24]/[0.08] px-3 py-1.5"
          >
            <ShoppingCart size={12} className="text-[#FBBF24]" />
            <span className="text-[10px] font-black text-[#FBBF24]">Slip</span>
            {slip.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#FBBF24] text-[#0A0E18] text-[9px] font-black flex items-center justify-center">{slip.length}</span>
            )}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-0.5 w-fit">
          {(["markets", "props", "value"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                tab === t ? "bg-[#FF7828]/15 text-[#FF7828]" : "text-white/30 hover:text-white"
              }`}
            >
              {t === "markets" ? "Moneylines" : t === "props" ? "Player Props" : "Value Bets"}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-white/[0.04] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-10 text-center">
            <Clock size={28} className="text-white/20 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-white/40 text-sm font-bold">No matches today</p>
            <p className="text-white/20 text-xs mt-1">Check back on the next match day</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {tab === "markets" && (
              <motion.div key="markets" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="space-y-3">
                {matches.map((m) => <MatchCard key={m.id} match={m} onAddLeg={addLeg} />)}
              </motion.div>
            )}

            {tab === "props" && (
              <motion.div key="props" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                {/* Match selector */}
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  {matches.map((m, i) => (
                    <button
                      key={m.id}
                      onClick={() => setPropMatchIdx(i)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                        propMatchIdx === i
                          ? "border-[#FBBF24]/30 bg-[#FBBF24]/[0.08] text-[#FBBF24]"
                          : "border-white/[0.08] text-white/35 hover:text-white"
                      }`}
                    >
                      <div className="w-5 h-3.5 rounded overflow-hidden border border-white/10 shrink-0">
                        <FlagImg cc={m.homeFlag} name={m.home} className="w-full h-full" />
                      </div>
                      {m.home} vs {m.away}
                    </button>
                  ))}
                </div>
                {/* Filter tabs */}
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  {(["all", "scorer", "total"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setPropFilter(f)}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-bold border transition-all ${
                        propFilter === f
                          ? "bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/25"
                          : "text-white/25 border-white/[0.07] hover:text-white"
                      }`}
                    >
                      {f === "all" ? "All" : f === "scorer" ? "Goalscorers" : "Totals"}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {filteredProps.map((p, i) => (
                    <PropRow key={p.id} prop={p} inSlip={slip.some((l) => l.prop.id === p.id)} onToggle={toggleProp} index={i} />
                  ))}
                  {filteredProps.length === 0 && (
                    <p className="text-center py-8 text-white/25 text-sm">No props in this filter</p>
                  )}
                </div>
              </motion.div>
            )}

            {tab === "value" && (
              <motion.div key="value" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                <ValueBetsSection props={allProps} slip={slip} onToggle={toggleProp} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Right: Slip */}
      <div className={`xl:w-72 shrink-0 ${showSlip ? "block" : "hidden xl:block"}`}>
        <div className="sticky top-4">
          <PropSlip
            legs={slip}
            onRemove={(id) => setSlip((prev) => prev.filter((l) => l.prop.id !== id))}
            onClear={() => setSlip([])}
          />
          <p className="text-[9px] text-white/15 text-center mt-3 px-2">
            Odds estimated via ELO model · For informational use only · Not financial advice
          </p>
        </div>
      </div>
    </div>
  );
}
