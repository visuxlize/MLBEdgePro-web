"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, RefreshCw, Clock, Trophy,
  ChevronDown, ChevronUp, CheckCircle2, MapPin,
  Brain, Users, Calendar, BarChart3, Sparkles,
  TrendingUp, DollarSign, Goal, Crosshair,
} from "lucide-react";
import { WC_GROUPS, WC_TEAMS, eloWinProb } from "@/lib/worldcup/data";
import type { TodayMatch } from "@/app/api/worldcup/today/route";
import type { WCGroup, GSTeam } from "@/lib/worldcup/types";

const GOLD   = "#FBBF24";
const GREEN  = "#4ADE80";
const BLUE   = "#38BDF8";
const RED    = "#F87171";
const ORANGE = "#FF7828";
const INDIGO = "#818CF8";

// ── Stadium images ────────────────────────────────────────────────────────────

const VENUE_IMAGES: Record<string, string> = {
  "MetLife Stadium":       "https://commons.wikimedia.org/wiki/Special:FilePath/MetLife_Stadium.jpg?width=800",
  "SoFi Stadium":          "https://commons.wikimedia.org/wiki/Special:FilePath/SoFi_Stadium_aerial_view.jpg?width=800",
  "AT&T Stadium":          "https://commons.wikimedia.org/wiki/Special:FilePath/AT%26T_Stadium.jpg?width=800",
  "Estadio Azteca":        "https://commons.wikimedia.org/wiki/Special:FilePath/Azteca_Stadium.jpg?width=800",
  "Levi's Stadium":        "https://commons.wikimedia.org/wiki/Special:FilePath/Levi%27s_Stadium.jpg?width=800",
  "NRG Stadium":           "https://commons.wikimedia.org/wiki/Special:FilePath/NRG_Stadium.jpg?width=800",
  "Lumen Field":           "https://commons.wikimedia.org/wiki/Special:FilePath/Lumen_Field.jpg?width=800",
  "BMO Field":             "https://commons.wikimedia.org/wiki/Special:FilePath/BMO_Field.jpg?width=800",
  "BC Place":              "https://commons.wikimedia.org/wiki/Special:FilePath/BC_Place.jpg?width=800",
  "Gillette Stadium":      "https://commons.wikimedia.org/wiki/Special:FilePath/Gillette_Stadium.jpg?width=800",
  "Lincoln Financial":     "https://commons.wikimedia.org/wiki/Special:FilePath/Lincoln_Financial_Field.jpg?width=800",
  "Hard Rock Stadium":     "https://commons.wikimedia.org/wiki/Special:FilePath/Hard_Rock_Stadium.jpg?width=800",
  "Mercedes-Benz Stadium": "https://commons.wikimedia.org/wiki/Special:FilePath/Mercedes-Benz_Stadium.jpg?width=800",
  "Estadio Akron":         "https://commons.wikimedia.org/wiki/Special:FilePath/Estadio_Akron.jpg?width=800",
  "Estadio BBVA":          "https://commons.wikimedia.org/wiki/Special:FilePath/Estadio_BBVA.jpg?width=400",
  "Arrowhead Stadium":     "https://commons.wikimedia.org/wiki/Special:FilePath/Arrowhead_Stadium.jpg?width=800",
};

function getVenueImage(venue: string): string | null {
  const part = venue.split(",")[0].trim();
  for (const [key, url] of Object.entries(VENUE_IMAGES)) {
    if (part.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(part.toLowerCase())) {
      return url;
    }
  }
  return null;
}

// ── Top players per team for prop predictions ──────────────────────────────────

const TEAM_STARS: Record<string, { name: string; pos: string; trait: string }[]> = {
  bra: [
    { name: "Vinícius Jr.",  pos: "FW", trait: "elite dribbler + UCL pedigree" },
    { name: "Rodrygo",       pos: "FW", trait: "explosive off the bench" },
    { name: "Endrick",       pos: "FW", trait: "teenage phenom + high pressing" },
  ],
  fra: [
    { name: "Kylian Mbappé",    pos: "FW", trait: "tournament top scorer threat" },
    { name: "Antoine Griezmann", pos: "MF", trait: "creative assist machine" },
    { name: "Ousmane Dembélé",  pos: "FW", trait: "pace + direct running" },
  ],
  esp: [
    { name: "Lamine Yamal",  pos: "FW", trait: "youngest WC star, high dribbles" },
    { name: "Pedri",         pos: "MF", trait: "possession maestro + key passes" },
    { name: "Álvaro Morata", pos: "FW", trait: "clinical in big games" },
  ],
  eng: [
    { name: "Jude Bellingham", pos: "MF", trait: "box-to-box goals & assists" },
    { name: "Harry Kane",      pos: "FW", trait: "all-time England scorer" },
    { name: "Bukayo Saka",     pos: "FW", trait: "high shot volume + pens" },
  ],
  arg: [
    { name: "Lionel Messi",   pos: "FW", trait: "defending champion captain" },
    { name: "Lautaro Martínez", pos: "FW", trait: "clinical finisher" },
    { name: "Rodrigo De Paul",  pos: "MF", trait: "midfield engine" },
  ],
  ger: [
    { name: "Florian Wirtz", pos: "MF", trait: "creative burst + high xG" },
    { name: "Kai Havertz",   pos: "FW", trait: "penalty box presence" },
    { name: "Jamal Musiala", pos: "MF", trait: "dribble master + key passes" },
  ],
  por: [
    { name: "Cristiano Ronaldo", pos: "FW", trait: "all-time WC goals record" },
    { name: "Bruno Fernandes",   pos: "MF", trait: "set pieces + long shots" },
    { name: "Rafael Leão",       pos: "FW", trait: "pace + direct chance creation" },
  ],
  ned: [
    { name: "Cody Gakpo",   pos: "FW", trait: "WC 2022 scored every game" },
    { name: "Memphis Depay", pos: "FW", trait: "veteran free-kick taker" },
    { name: "Virgil van Dijk", pos: "DF", trait: "aerials + set piece goals" },
  ],
  uru: [
    { name: "Darwin Núñez",    pos: "FW", trait: "aggressive presser + headers" },
    { name: "Federico Valverde", pos: "MF", trait: "long-range shots" },
    { name: "Rodrigo Bentancur", pos: "MF", trait: "defensive contributions" },
  ],
  usa: [
    { name: "Christian Pulisic", pos: "FW", trait: "USA captain, high shot vol" },
    { name: "Folarin Balogun",   pos: "FW", trait: "aerial threat" },
    { name: "Tyler Adams",       pos: "MF", trait: "defensive workrate" },
  ],
  mex: [
    { name: "Hirving Lozano",  pos: "FW", trait: "pace + dribbles on wing" },
    { name: "Raúl Jiménez",    pos: "FW", trait: "target man + aerials" },
    { name: "Edson Álvarez",   pos: "MF", trait: "defensive midfielder" },
  ],
  mor: [
    { name: "Achraf Hakimi",   pos: "DF", trait: "marauding fullback + crosses" },
    { name: "Hakim Ziyech",    pos: "FW", trait: "set piece specialist" },
    { name: "Youssef En-Nesyri", pos: "FW", trait: "physical aerial threat" },
  ],
};

function getTeamStars(teamId: string) {
  return TEAM_STARS[teamId] ?? [];
}

// ── Historical WC context ─────────────────────────────────────────────────────

const WC_HISTORY: Record<string, { titles: number; finals: number; lastTitle: number; quote: string }> = {
  bra: { titles: 5, finals: 7, lastTitle: 2002, quote: "5-time champions — most WC titles ever" },
  fra: { titles: 2, finals: 3, lastTitle: 2018, quote: "Defending runners-up, 2-time champions" },
  esp: { titles: 1, finals: 1, lastTitle: 2010, quote: "2010 champions with tiki-taka pedigree" },
  ger: { titles: 4, finals: 8, lastTitle: 2014, quote: "4-time champions — most successful European side" },
  arg: { titles: 3, finals: 5, lastTitle: 2022, quote: "Reigning World Cup champions" },
  ita: { titles: 4, finals: 6, lastTitle: 2006, quote: "4-time champions, missed WC 2018 & 2022" },
  eng: { titles: 1, finals: 1, lastTitle: 1966, quote: "1966 hosts & champions, 60-year drought" },
  por: { titles: 0, finals: 0, lastTitle: 0,    quote: "Never won — Ronaldo's last WC shot" },
  ned: { titles: 0, finals: 3, lastTitle: 0,    quote: "3-time finalist, still chasing first title" },
  uru: { titles: 2, finals: 2, lastTitle: 1950, quote: "2-time champions, legends of the early era" },
  usa: { titles: 0, finals: 0, lastTitle: 0,    quote: "Host nation — historic best: QF in 2002" },
  mex: { titles: 0, finals: 0, lastTitle: 0,    quote: "Host nation — has never passed QF" },
  mor: { titles: 0, finals: 0, lastTitle: 0,    quote: "WC 2022 semifinalists — Africa's finest" },
  cro: { titles: 0, finals: 1, lastTitle: 0,    quote: "WC 2022 3rd place, 1998 runners-up" },
  bel: { titles: 0, finals: 0, lastTitle: 0,    quote: "Ranked World #1 in 2018 golden generation" },
  jpn: { titles: 0, finals: 0, lastTitle: 0,    quote: "WC 2022 upset Germany & Spain in groups" },
};

function getHistory(teamId: string) {
  return WC_HISTORY[teamId] ?? null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function flagUrl(cc: string) { return `https://flagcdn.com/w80/${cc.toLowerCase()}.png`; }

function FlagImg({ cc, name, className }: { cc: string; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`${className ?? ""} flex items-center justify-center bg-white/[0.12] text-white/60 font-black`}
        style={{ fontSize: "9px" }}>
        {name.slice(0, 3).toUpperCase()}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={flagUrl(cc)} alt={name} className={`${className ?? ""} object-cover`} onError={() => setFailed(true)} />
  );
}

function drawProb(homeWin: number, awayWin: number): number {
  const rawDraw = 1 - homeWin - awayWin;
  return Math.max(rawDraw * 0.9, 0.10);
}

function normalizeProbs(hw: number, aw: number): [number, number, number] {
  const d = drawProb(hw, aw);
  const total = hw + d + aw;
  return [hw / total, d / total, aw / total];
}

function calcXG(elo: number, isHome: boolean): number {
  const base = 1.3 + (elo - 1600) / 500;
  return Math.max(0.5, Math.min(3.5, base + (isHome ? 0.15 : 0)));
}

// ── AI Analysis generation ────────────────────────────────────────────────────

type ConfidenceLevel = "Strong" | "Moderate" | "Low";

interface AIMatchPrediction {
  winner: string;
  scorePrediction: string;
  confidence: ConfidenceLevel;
  confidenceColor: string;
  reasons: string[];
  historicalContext: string | null;
}

interface PlayerPropPrediction {
  player: string;
  teamShort: string;
  prop: string;
  confidence: ConfidenceLevel;
  confidenceColor: string;
  reason: string;
  icon: "goal" | "assist" | "shot" | "card";
}

function confidenceColor(c: ConfidenceLevel): string {
  return c === "Strong" ? GREEN : c === "Moderate" ? GOLD : BLUE;
}

function buildHistoricalContext(match: TodayMatch): string | null {
  const homeHist = getHistory(match.homeId);
  const awayHist = getHistory(match.awayId);

  if (homeHist?.quote && awayHist?.quote) return `${match.home}: ${homeHist.quote}. ${match.away}: ${awayHist.quote}.`;
  if (homeHist?.quote) return `${match.home}: ${homeHist.quote}`;
  if (awayHist?.quote) return `${match.away}: ${awayHist.quote}`;
  return null;
}

function deriveAIAnalysis(
  match: TodayMatch,
  hw: number,
  dw: number,
  aw: number,
  homeElo: number,
  awayElo: number,
  homeXG: number,
  awayXG: number,
): AIMatchPrediction {
  const eloDiff   = homeElo - awayElo;
  const homeTeam  = WC_TEAMS[match.homeId];
  const awayTeam  = WC_TEAMS[match.awayId];
  const absDiff   = Math.abs(eloDiff);
  const isHomeAdv = eloDiff > 0;

  const favTeam     = isHomeAdv ? homeTeam : awayTeam;
  const favName     = favTeam?.name ?? (isHomeAdv ? match.home : match.away);
  const favWinProb  = Math.round((isHomeAdv ? hw : aw) * 100);
  const favXG       = isHomeAdv ? homeXG.toFixed(1) : awayXG.toFixed(1);
  const dogXG       = isHomeAdv ? awayXG.toFixed(1) : homeXG.toFixed(1);
  const underdogTeam = isHomeAdv ? awayTeam : homeTeam;

  // Score prediction
  const predictedHome = Math.max(0, Math.round(homeXG - 0.3 + (isHomeAdv ? 0.2 : -0.1)));
  const predictedAway = Math.max(0, Math.round(awayXG - 0.3 + (!isHomeAdv ? 0.2 : -0.1)));

  // Strong favourite — clear ELO gap
  if (absDiff >= 150) {
    const favHistory = isHomeAdv ? getHistory(match.homeId) : getHistory(match.awayId);
    const reasons = [
      `${absDiff}-point ELO advantage — among the largest gaps in this tournament`,
      `${favWinProb}% win probability driven by superior squad depth`,
      `xG model projects ${favXG} goals vs ${dogXG} — significant attacking edge`,
    ];
    if (favHistory?.titles) {
      reasons.push(`${favName} have ${favHistory.titles} World Cup title${favHistory.titles > 1 ? "s" : ""} — proven big-game mentality`);
    }
    return {
      winner: favName,
      scorePrediction: `${predictedHome}–${predictedAway}`,
      confidence: "Strong",
      confidenceColor: confidenceColor("Strong"),
      reasons,
      historicalContext: buildHistoricalContext(match),
    };
  }

  // Moderate favourite — meaningful but not decisive gap
  if (absDiff >= 60) {
    const underdogHistory = isHomeAdv ? getHistory(match.awayId) : getHistory(match.homeId);
    const reasons = [
      `${absDiff}-point ELO edge — meaningful but not decisive`,
      `${favWinProb}% win probability; draw still possible at ${Math.round(dw * 100)}%`,
      `Combined xG ${(homeXG + awayXG).toFixed(1)} suggests an open, goalful game`,
    ];
    if (underdogHistory?.titles) {
      reasons.push(`${underdogTeam?.name ?? ""} carry WC pedigree (${underdogHistory.titles} title${underdogHistory.titles > 1 ? "s" : ""}) — never count them out`);
    }
    return {
      winner: favName,
      scorePrediction: `${predictedHome}–${predictedAway}`,
      confidence: "Moderate",
      confidenceColor: confidenceColor("Moderate"),
      reasons,
      historicalContext: buildHistoricalContext(match),
    };
  }

  // Even match — draw is the highest-value call
  return {
    winner: "Draw",
    scorePrediction: `${predictedHome}–${predictedAway}`,
    confidence: "Low",
    confidenceColor: confidenceColor("Low"),
    reasons: [
      `Only ${absDiff} ELO points separate these sides — essentially a coin flip`,
      `Draw probability at ${Math.round(dw * 100)}% — the highest-value outcome in this range`,
      `Tight xG (${homeXG.toFixed(1)} vs ${awayXG.toFixed(1)}) supports a cagey, low-scoring game`,
      `Group-stage stakes often encourage cautious play when neither side can afford a loss`,
    ],
    historicalContext: buildHistoricalContext(match),
  };
}

function derivePlayerProps(
  match: TodayMatch,
  homeElo: number,
  awayElo: number,
  homeXG: number,
  awayXG: number,
): PlayerPropPrediction[] {
  const homeStars = getTeamStars(match.homeId);
  const awayStars = getTeamStars(match.awayId);
  const props: PlayerPropPrediction[] = [];

  // Home team top scorer prop
  if (homeStars[0]) {
    const xgAdv = homeXG > 1.5;
    const conf: ConfidenceLevel = homeElo - awayElo >= 100 ? "Strong" : xgAdv ? "Moderate" : "Low";
    props.push({
      player: homeStars[0].name,
      teamShort: WC_TEAMS[match.homeId]?.shortName ?? match.home.slice(0, 3).toUpperCase(),
      prop: "Anytime Goalscorer",
      confidence: conf,
      confidenceColor: confidenceColor(conf),
      icon: "goal",
      reason: `${homeStars[0].name} (${homeStars[0].trait}) — home side projects ${homeXG.toFixed(1)} xG; primary striker in a high-volume attack.`,
    });
  }

  // Away team top scorer prop
  if (awayStars[0]) {
    const conf: ConfidenceLevel = awayElo - homeElo >= 100 ? "Strong" : awayXG > 1.4 ? "Moderate" : "Low";
    props.push({
      player: awayStars[0].name,
      teamShort: WC_TEAMS[match.awayId]?.shortName ?? match.away.slice(0, 3).toUpperCase(),
      prop: "Anytime Goalscorer",
      confidence: conf,
      confidenceColor: confidenceColor(conf),
      icon: "goal",
      reason: `${awayStars[0].name} (${awayStars[0].trait}) — away side projects ${awayXG.toFixed(1)} xG. Elite finisher with WC track record.`,
    });
  }

  // Creative midfield / assist prop — prefer home team's #2 player, fall back to away
  const [creativeMid, creativeMidTeamId] = homeStars[1]
    ? [homeStars[1], match.homeId]
    : [awayStars[1], match.awayId];

  if (creativeMid) {
    const combined = homeXG + awayXG;
    const conf: ConfidenceLevel = combined > 3.0 ? "Moderate" : "Low";
    const teamShort = WC_TEAMS[creativeMidTeamId]?.shortName ?? creativeMidTeamId.slice(0, 3).toUpperCase();
    props.push({
      player: creativeMid.name,
      teamShort,
      prop: "1+ Key Passes / Assist",
      confidence: conf,
      confidenceColor: confidenceColor(conf),
      icon: "assist",
      reason: `${creativeMid.name} (${creativeMid.trait}) is the primary chance-creator. Open game (${combined.toFixed(1)} total xG) maximizes his involvement.`,
    });
  }

  // Over/Under goals prop
  const totalXG = homeXG + awayXG;
  const overProb = Math.min(0.70, Math.max(0.35, totalXG / 5.0));
  const isOver = overProb >= 0.52;
  const overConf: ConfidenceLevel = overProb >= 0.60 ? "Strong" : overProb >= 0.50 ? "Moderate" : "Low";
  props.push({
    player: isOver ? "Over 2.5 Goals" : "Under 2.5 Goals",
    teamShort: "MATCH",
    prop: "Goals Total",
    confidence: overConf,
    confidenceColor: confidenceColor(overConf),
    icon: "shot",
    reason: `Combined xG: ${totalXG.toFixed(1)}. ELO model gives ${Math.round(overProb * 100)}% chance of 3+ goals — ${isOver ? "both sides carry attacking threat" : "defensive setup expected from one or both teams"}.`,
  });

  return props.slice(0, 4);
}

// ── Betting lines ─────────────────────────────────────────────────────────────

interface BettingLine {
  market:          string;
  pick:            string;
  confidence:      ConfidenceLevel;
  confidenceColor: string;
  probability:     number;    // 0-100 integer
  odds:            string;    // American format e.g. "+150" or "-200"
  reason:          string;
}

function toAmericanOdds(p: number): string {
  if (p <= 0 || p >= 1) return "N/A";
  if (p >= 0.5) return `-${Math.round((p / (1 - p)) * 100)}`;
  return `+${Math.round(((1 - p) / p) * 100)}`;
}

function deriveBettingLines(
  match:   TodayMatch,
  hw:      number,
  dw:      number,
  aw:      number,
  homeElo: number,
  awayElo: number,
  homeXG:  number,
  awayXG:  number,
): BettingLine[] {
  const eloDiff  = homeElo - awayElo;
  const totalXG  = homeXG + awayXG;
  const homeStars = getTeamStars(match.homeId);
  const awayStars = getTeamStars(match.awayId);

  // ── Moneyline (best-value side only) ──────────────────────────────────────
  const favIsHome  = eloDiff >= 0;
  const favProb    = favIsHome ? hw : aw;
  const favName    = favIsHome ? match.home : match.away;
  const favConf: ConfidenceLevel = favProb >= 0.60 ? "Strong" : favProb >= 0.45 ? "Moderate" : "Low";
  const moneyline: BettingLine = {
    market:          "Moneyline",
    pick:            favName,
    confidence:      favConf,
    confidenceColor: confidenceColor(favConf),
    probability:     Math.round(favProb * 100),
    odds:            toAmericanOdds(favProb),
    reason:          `${favName} carry a ${Math.abs(Math.round(eloDiff))}-pt ELO edge. Win probability: ${Math.round(favProb * 100)}%.`,
  };

  // ── Draw ──────────────────────────────────────────────────────────────────
  const drawConf: ConfidenceLevel = dw >= 0.30 ? "Moderate" : "Low";
  const drawLine: BettingLine = {
    market:          "Draw",
    pick:            "Draw",
    confidence:      drawConf,
    confidenceColor: confidenceColor(drawConf),
    probability:     Math.round(dw * 100),
    odds:            toAmericanOdds(dw),
    reason:          Math.abs(eloDiff) < 60
      ? `Teams are closely matched — group-stage caution favours a draw (${Math.round(dw * 100)}%).`
      : `Underdog can absorb pressure and hold; draw at ${Math.round(dw * 100)}% is live.`,
  };

  // ── BTTS — Poisson P(score ≥ 1) = 1 − e^(−xG) ───────────────────────────
  const pHomeScores = 1 - Math.exp(-homeXG);
  const pAwayScores = 1 - Math.exp(-awayXG);
  const bttsProb    = pHomeScores * pAwayScores;
  const bttsPick    = bttsProb >= 0.50 ? "Yes" : "No";
  const bttsConf: ConfidenceLevel = bttsProb >= 0.55 ? "Strong" : bttsProb >= 0.40 ? "Moderate" : "Low";
  const btts: BettingLine = {
    market:          "BTTS",
    pick:            bttsPick,
    confidence:      bttsConf,
    confidenceColor: confidenceColor(bttsConf),
    probability:     Math.round(bttsProb * 100),
    odds:            toAmericanOdds(bttsProb >= 0.50 ? bttsProb : 1 - bttsProb),
    reason:          `${match.home} scores in ${Math.round(pHomeScores * 100)}% of games at ${homeXG.toFixed(1)} xG; ${match.away} in ${Math.round(pAwayScores * 100)}%. Combined BTTS probability: ${Math.round(bttsProb * 100)}%.`,
  };

  // ── Over/Under 2.5 ────────────────────────────────────────────────────────
  const overProb   = Math.min(0.72, Math.max(0.30, totalXG / 4.8));
  const isOver     = overProb >= 0.50;
  const ouConf: ConfidenceLevel = Math.abs(overProb - 0.5) >= 0.15 ? "Strong" : Math.abs(overProb - 0.5) >= 0.07 ? "Moderate" : "Low";
  const overUnder: BettingLine = {
    market:          "Over/Under",
    pick:            isOver ? "Over 2.5" : "Under 2.5",
    confidence:      ouConf,
    confidenceColor: confidenceColor(ouConf),
    probability:     Math.round((isOver ? overProb : 1 - overProb) * 100),
    odds:            toAmericanOdds(isOver ? overProb : 1 - overProb),
    reason:          `Combined xG ${totalXG.toFixed(1)} → ${Math.round(overProb * 100)}% chance of 3+ goals. ${isOver ? "Both sides carry attacking threat." : "Defensive setup expected from at least one side."}`,
  };

  // ── First goalscorer ──────────────────────────────────────────────────────
  // Pick the top striker from whichever team has the higher xG projection
  const fsTeamId  = homeXG >= awayXG ? match.homeId : match.awayId;
  const fsStars   = fsTeamId === match.homeId ? homeStars : awayStars;
  const fsXG      = fsTeamId === match.homeId ? homeXG : awayXG;
  const fsProb    = Math.min(0.42, fsXG / 2.4 * 0.65);
  const fsConf: ConfidenceLevel = fsProb >= 0.28 ? "Moderate" : "Low";
  const firstScorer: BettingLine | null = fsStars[0] ? {
    market:          "First Goalscorer",
    pick:            fsStars[0].name,
    confidence:      fsConf,
    confidenceColor: confidenceColor(fsConf),
    probability:     Math.round(fsProb * 100),
    odds:            toAmericanOdds(fsProb),
    reason:          `${fsStars[0].name} — ${fsStars[0].trait}. ${WC_TEAMS[fsTeamId]?.shortName ?? fsTeamId.toUpperCase()} project ${fsXG.toFixed(1)} xG; primary striker leads chance creation.`,
  } : null;

  // ── Corners Over/Under ────────────────────────────────────────────────────
  // Base ≈ 9.5 corners per game; each xG unit above 2.6 adds ~1.2 corners
  const cornersAdj   = (totalXG - 2.6) * 1.2;
  const projCorners  = 9.5 + cornersAdj;
  const cornersLine  = projCorners >= 10.5 ? "Over 10.5" : projCorners >= 9.5 ? "Over 9.5" : "Under 9.5";
  const cornersProb  = Math.min(0.68, Math.max(0.38, 0.5 + cornersAdj / 6));
  const cornersConf: ConfidenceLevel = Math.abs(cornersAdj) >= 2 ? "Moderate" : "Low";
  const corners: BettingLine = {
    market:          "Total Corners",
    pick:            cornersLine,
    confidence:      cornersConf,
    confidenceColor: confidenceColor(cornersConf),
    probability:     Math.round(cornersProb * 100),
    odds:            toAmericanOdds(cornersProb),
    reason:          `Projected ${projCorners.toFixed(1)} corners from combined xG (${totalXG.toFixed(1)}). High-tempo sides generate more wide play and set-piece situations.`,
  };

  const lines: BettingLine[] = [moneyline, drawLine, btts, overUnder, corners];
  if (firstScorer) lines.splice(4, 0, firstScorer);  // before corners
  return lines;
}

// ── Post-match recap ─────────────────────────────────────────────────────────

interface PostMatchRecap {
  predictionCorrect: boolean;
  resultLabel: string;       // e.g. "Correct call ✓" or "Upset — AI missed"
  resultColor: string;
  wasUpset: boolean;
  scoreDiff: string;         // e.g. "AI called 2–1, actual 3–0"
  narrative: string[];       // 3-4 sentences explaining what happened and why
  modelAdjustment: string;   // what the AI notes for future predictions
}

function derivePostMatchRecap(
  match: TodayMatch,
  aiAnalysis: AIMatchPrediction,
  homeElo: number,
  awayElo: number,
  homeXG: number,
  awayXG: number,
): PostMatchRecap {
  const hs = match.homeScore ?? 0;
  const as = match.awayScore ?? 0;

  const actualWinner =
    hs > as ? match.home :
    as > hs ? match.away :
    "Draw";

  const predictionCorrect = actualWinner === aiAnalysis.winner;
  const wasUpset = !predictionCorrect && aiAnalysis.winner !== "Draw";
  const eloDiff  = homeElo - awayElo;
  const favName  = eloDiff >= 0 ? match.home : match.away;

  const totalActual   = hs + as;
  const totalExpected = homeXG + awayXG;
  const highScoring   = totalActual >= 4;
  const lowScoring    = totalActual <= 1;
  const overPerformed = totalActual > Math.round(totalExpected);
  const underPerformed = totalActual < Math.round(totalExpected);

  const homeOverXG = hs > Math.round(homeXG);
  const awayOverXG = as > Math.round(awayXG);

  const narrative: string[] = [];

  if (wasUpset) {
    narrative.push(
      `${actualWinner} pulled off an upset — the model gave them under a ${Math.round((eloDiff > 0 ? (1 - homeElo / (homeElo + awayElo)) : (homeElo / (homeElo + awayElo))) * 100)}% chance of winning.`
    );
    narrative.push(
      `${favName} were the ELO favourite but failed to convert their edge on the scoreboard.`
    );
  } else if (actualWinner === "Draw") {
    narrative.push(
      `The game ended level — both teams were well-matched and neither side could find a winning goal.`
    );
  } else {
    narrative.push(
      `${actualWinner} won as the model expected, validating the ELO gap between these two sides.`
    );
  }

  if (highScoring) {
    narrative.push(`It was a high-scoring affair (${hs}–${as}) — both defences were exposed and attacking transitions opened up frequently.`);
  } else if (lowScoring) {
    narrative.push(`A tight, low-scoring game (${hs}–${as}) — defences held firm and neither side created high-quality chances consistently.`);
  } else if (overPerformed) {
    narrative.push(`The actual goal total (${totalActual}) exceeded the model's xG projection of ${totalExpected.toFixed(1)} — clinical finishing or set-piece goals inflated the tally.`);
  } else if (underPerformed) {
    narrative.push(`Despite a combined xG of ${totalExpected.toFixed(1)}, only ${totalActual} goals were scored — keepers or wayward finishing kept the scoreline tight.`);
  }

  if (homeOverXG && !awayOverXG) {
    narrative.push(`${match.home} (${hs} goals vs ${homeXG.toFixed(1)} xG) were more clinical than expected — their strikers outperformed probability.`);
  } else if (awayOverXG && !homeOverXG) {
    narrative.push(`${match.away} (${as} goals vs ${awayXG.toFixed(1)} xG) were the more clinical side — converting chances at a higher rate than the model projects.`);
  }

  const modelAdjustment = wasUpset
    ? `AI note: ${actualWinner}'s performance suggests their ELO may be understated. This result slightly increases confidence in similar underdog picks for the rest of the group.`
    : predictionCorrect
    ? `AI note: Result matched the prediction. ELO model continues to be reliable for this type of gap (${Math.abs(eloDiff)} pts). Confidence holds for upcoming matches.`
    : `AI note: Draw result recorded. When ELO gaps are under 60 pts, group-stage caution makes draws more likely than the model accounts for.`;

  return {
    predictionCorrect,
    resultLabel:  wasUpset ? "Upset — AI missed ✗" : predictionCorrect ? "Correct call ✓" : "Draw correctly called ✓",
    resultColor:  wasUpset ? RED : GREEN,
    wasUpset,
    scoreDiff: `AI predicted ${aiAnalysis.winner} (${aiAnalysis.scorePrediction}) · Final: ${hs}–${as}`,
    narrative,
    modelAdjustment,
  };
}

// ── Stadium Background ────────────────────────────────────────────────────────

function StadiumBg({ venue, homeColor, awayColor }: { venue: string; homeColor: string; awayColor: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  const imgUrl = getVenueImage(venue);

  return (
    <>
      {imgUrl && !imgFailed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgUrl}
          alt={venue}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.35 }}
          onError={() => setImgFailed(true)}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: imgFailed || !imgUrl
            ? `linear-gradient(135deg, ${homeColor}35 0%, rgba(9,13,20,0.7) 50%, ${awayColor}30 100%)`
            : `linear-gradient(135deg, ${homeColor}28 0%, rgba(9,13,20,0.55) 40%, ${awayColor}20 100%)`,
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#090d14] to-transparent" />
    </>
  );
}

// ── Single Match Card ─────────────────────────────────────────────────────────

function MatchCard({ match, compact = false }: { match: TodayMatch; compact?: boolean }) {
  const [expanded, setExpanded] = useState(!compact);

  const homeTeam = WC_TEAMS[match.homeId];
  const awayTeam = WC_TEAMS[match.awayId];
  const homeElo  = homeTeam?.strength ?? 1650;
  const awayElo  = awayTeam?.strength ?? 1650;

  const homeXG = calcXG(homeElo, true);
  const awayXG = calcXG(awayElo, false);
  const maxXG  = Math.max(homeXG, awayXG, 1);

  const rawHW = eloWinProb(homeElo, awayElo);
  const rawAW = eloWinProb(awayElo, homeElo);
  const [hw, dw, aw] = normalizeProbs(rawHW, rawAW);

  const isDone = match.status === "completed";
  const isLive = match.status === "live";

  const aiAnalysis  = deriveAIAnalysis(match, hw, dw, aw, homeElo, awayElo, homeXG, awayXG);
  const playerProps = derivePlayerProps(match, homeElo, awayElo, homeXG, awayXG);
  const bettingLines = deriveBettingLines(match, hw, dw, aw, homeElo, awayElo, homeXG, awayXG);
  const postRecap   = isDone ? derivePostMatchRecap(match, aiAnalysis, homeElo, awayElo, homeXG, awayXG) : null;

  const homeColor = homeTeam?.color ?? "#1E3A8A";
  const awayColor = awayTeam?.color ?? "#065F46";

  if (compact) {
    // Compact card for upcoming matches
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/[0.07] overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0e1420, #090d14)" }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {homeTeam && (
              <div className="w-8 h-6 rounded overflow-hidden border border-white/10 shrink-0">
                <FlagImg cc={homeTeam.countryCode} name={homeTeam.shortName} className="w-full h-full" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-black text-white truncate">{match.home}</p>
              {homeTeam && <p className="text-[9px] text-white/35">ELO {homeTeam.strength}</p>}
            </div>
          </div>

          <div className="shrink-0 text-center px-2">
            <p className="text-[9px] font-bold text-white/30">{match.date}</p>
            <p className="text-[10px] font-bold text-white/50">{match.time}</p>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <div className="text-right min-w-0">
              <p className="text-xs font-black text-white truncate">{match.away}</p>
              {awayTeam && <p className="text-[9px] text-white/35">ELO {awayTeam.strength}</p>}
            </div>
            {awayTeam && (
              <div className="w-8 h-6 rounded overflow-hidden border border-white/10 shrink-0">
                <FlagImg cc={awayTeam.countryCode} name={awayTeam.shortName} className="w-full h-full" />
              </div>
            )}
          </div>
        </div>

        {/* Quick AI prediction strip */}
        <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold"
            style={{
              background: `${aiAnalysis.confidenceColor}12`,
              border: `1px solid ${aiAnalysis.confidenceColor}30`,
              color: aiAnalysis.confidenceColor,
            }}
          >
            <Brain size={8} />
            AI: {aiAnalysis.winner} ({aiAnalysis.scorePrediction}) · {aiAnalysis.confidence}
          </div>
          <span className="text-[9px] text-white/20 truncate flex items-center gap-1">
            <MapPin size={8} />
            {match.venue.split(",")[0]}
            <span className="text-white/10 mx-0.5">·</span>
            Group {match.groupId}
          </span>
        </div>
      </motion.div>
    );
  }

  // Full card for today/live matches
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/[0.08] overflow-hidden flex flex-col"
      style={{ background: "#090d14" }}
    >
      {/* Stadium hero */}
      <div className="relative h-44 overflow-hidden">
        <StadiumBg venue={match.venue} homeColor={homeColor} awayColor={awayColor} />
        <div className="relative z-10 p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-[#FBBF24] border border-[#FBBF24]/25 rounded-full px-2 py-0.5 bg-black/40 backdrop-blur-sm">
              GROUP {match.groupId}
            </span>
            <div className="flex items-center gap-1.5">
              {isDone && (
                <span className="text-[9px] font-black text-white/50 border border-white/15 rounded-full px-2 py-0.5 bg-black/40 backdrop-blur-sm flex items-center gap-1">
                  <CheckCircle2 size={8} /> FT
                </span>
              )}
              {isLive && (
                <motion.span
                  className="text-[9px] font-black text-red-400 border border-red-400/35 bg-red-400/15 backdrop-blur-sm rounded-full px-2 py-0.5"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  ● LIVE
                </motion.span>
              )}
            </div>
          </div>

          <div className="flex items-end gap-2">
            {/* Home */}
            <div className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-14 h-10 rounded-lg overflow-hidden border-2 shadow-lg" style={{ borderColor: `${homeColor}60` }}>
                {homeTeam ? (
                  <FlagImg cc={homeTeam.countryCode} name={homeTeam.shortName} className="w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/40 text-[9px] font-black">
                    {match.home.slice(0, 3).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-[11px] font-black text-white drop-shadow-lg">{match.home}</p>
                {homeTeam && <p className="text-[8px] text-white/40">ELO {homeTeam.strength}</p>}
              </div>
            </div>

            {/* Score / VS */}
            <div className="flex flex-col items-center gap-0.5 shrink-0 pb-0.5">
              {isDone || isLive ? (
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-black/60 border border-white/[0.15] backdrop-blur-sm">
                  <span className="text-2xl font-black text-white">{match.homeScore}</span>
                  <span className="text-white/30 text-lg">–</span>
                  <span className="text-2xl font-black text-white">{match.awayScore}</span>
                </div>
              ) : (
                <div className="text-center px-3">
                  <p className="text-base font-black text-white/25">vs</p>
                  <p className="text-[9px] text-white/30">{match.date}</p>
                </div>
              )}
            </div>

            {/* Away */}
            <div className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-14 h-10 rounded-lg overflow-hidden border-2 shadow-lg" style={{ borderColor: `${awayColor}60` }}>
                {awayTeam ? (
                  <FlagImg cc={awayTeam.countryCode} name={awayTeam.shortName} className="w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/40 text-[9px] font-black">
                    {match.away.slice(0, 3).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-[11px] font-black text-white drop-shadow-lg">{match.away}</p>
                {awayTeam && <p className="text-[8px] text-white/40">ELO {awayTeam.strength}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Venue */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.05] bg-white/[0.02]">
        <MapPin size={10} className="text-white/25 shrink-0" />
        <span className="text-[9px] text-white/30 truncate">{match.venue}</span>
        {!isDone && (
          <>
            <span className="text-white/15 mx-0.5">·</span>
            <Clock size={9} className="text-white/20 shrink-0" />
            <span className="text-[9px] text-white/25 shrink-0">{match.time}</span>
          </>
        )}
      </div>

      {/* xG Projection */}
      <div className="px-4 py-3 border-b border-white/[0.05]">
        <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-2.5">xG Projection · ELO Model</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black w-8 text-right shrink-0" style={{ color: BLUE }}>{homeXG.toFixed(1)}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: BLUE }}
                initial={{ width: 0 }} animate={{ width: `${(homeXG / maxXG) * 100}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }} />
            </div>
            <span className="text-[9px] text-white/35 w-14 truncate shrink-0">{match.home}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black w-8 text-right shrink-0" style={{ color: RED }}>{awayXG.toFixed(1)}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: RED }}
                initial={{ width: 0 }} animate={{ width: `${(awayXG / maxXG) * 100}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }} />
            </div>
            <span className="text-[9px] text-white/35 w-14 truncate shrink-0">{match.away}</span>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-[8px] text-white/20">
          <span>Total: {(homeXG + awayXG).toFixed(1)} xG</span>
          <span className="font-bold" style={{ color: homeXG + awayXG > 2.5 ? ORANGE : BLUE }}>
            {homeXG + awayXG > 2.5 ? "Over 2.5 leans" : "Under 2.5 leans"}
          </span>
        </div>
      </div>

      {/* Win Probability */}
      {!isDone && (
        <div className="px-4 py-3 border-b border-white/[0.05]">
          <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-2">Win Probability</p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black w-9 text-right shrink-0" style={{ color: BLUE }}>{Math.round(hw * 100)}%</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden bg-white/[0.06] flex">
              <motion.div className="h-full" style={{ background: BLUE }}
                initial={{ width: 0 }} animate={{ width: `${hw * 100}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }} />
              <motion.div className="h-full" style={{ background: "rgba(255,255,255,0.12)" }}
                initial={{ width: 0 }} animate={{ width: `${dw * 100}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }} />
              <motion.div className="h-full" style={{ background: RED }}
                initial={{ width: 0 }} animate={{ width: `${aw * 100}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }} />
            </div>
            <span className="text-xs font-black w-9 shrink-0" style={{ color: RED }}>{Math.round(aw * 100)}%</span>
          </div>
          <div className="flex justify-between text-[8px] text-white/20 mt-1 px-11">
            <span>{match.home}</span>
            <span>D {Math.round(dw * 100)}%</span>
            <span>{match.away}</span>
          </div>
        </div>
      )}

      {/* ── Post-match recap (completed games) ── */}
      {isDone && postRecap && (
        <>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Brain size={12} style={{ color: postRecap.resultColor }} strokeWidth={2.5} />
              <span className="text-xs font-black text-white">Match Recap</span>
              <span
                className="text-[8px] font-black rounded-full px-1.5 py-0.5"
                style={{ background: `${postRecap.resultColor}18`, color: postRecap.resultColor, border: `1px solid ${postRecap.resultColor}30` }}
              >
                {postRecap.resultLabel}
              </span>
            </div>
            {expanded ? <ChevronUp size={13} className="text-white/30" /> : <ChevronDown size={13} className="text-white/30" />}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 border-t border-white/[0.05] pt-3 space-y-3">

                  {/* Prediction vs actual */}
                  <div
                    className="rounded-xl border p-3"
                    style={{ background: `${postRecap.resultColor}08`, borderColor: `${postRecap.resultColor}22` }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={10} style={{ color: postRecap.resultColor }} />
                      <span className="text-[10px] font-black text-white uppercase tracking-wider">Prediction Review</span>
                    </div>
                    <p className="text-[9px] text-white/45 leading-relaxed">{postRecap.scoreDiff}</p>
                  </div>

                  {/* What happened and why */}
                  <div>
                    <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-2">What Happened & Why</p>
                    <div className="space-y-1.5">
                      {postRecap.narrative.map((line, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full mt-1.5 shrink-0 bg-white/20" />
                          <p className="text-[10px] text-white/55 leading-relaxed">{line}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI model adjustment note */}
                  <div className="rounded-xl bg-[#818CF8]/[0.06] border border-[#818CF8]/15 px-3 py-2.5 flex gap-2.5">
                    <Brain size={11} className="text-[#818CF8] shrink-0 mt-0.5" strokeWidth={1.5} />
                    <p className="text-[9px] text-white/40 leading-relaxed">{postRecap.modelAdjustment}</p>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ── AI pre-match analysis (upcoming / live games) ── */}
      {!isDone && (
        <>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Brain size={12} className="text-[#818CF8]" strokeWidth={2.5} />
              <span className="text-xs font-black text-white">AI Analysis</span>
              <span
                className="text-[8px] font-black rounded-full px-1.5 py-0.5"
                style={{ background: `${aiAnalysis.confidenceColor}15`, color: aiAnalysis.confidenceColor, border: `1px solid ${aiAnalysis.confidenceColor}30` }}
              >
                {aiAnalysis.confidence}
              </span>
            </div>
            {expanded ? <ChevronUp size={13} className="text-white/30" /> : <ChevronDown size={13} className="text-white/30" />}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 border-t border-white/[0.05] pt-3 space-y-4">

                  {/* Match Prediction */}
                  <div
                    className="rounded-xl border p-3.5"
                    style={{ background: `${aiAnalysis.confidenceColor}08`, borderColor: `${aiAnalysis.confidenceColor}22` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles size={11} style={{ color: aiAnalysis.confidenceColor }} />
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">Match Prediction</span>
                      </div>
                      <span
                        className="text-[8px] font-black rounded-full px-2 py-0.5"
                        style={{ background: `${aiAnalysis.confidenceColor}15`, color: aiAnalysis.confidenceColor, border: `1px solid ${aiAnalysis.confidenceColor}30` }}
                      >
                        {aiAnalysis.confidence} confidence
                      </span>
                    </div>
                    <p className="text-base font-black text-white mb-0.5">{aiAnalysis.winner}</p>
                    <p className="text-[10px] text-white/40 mb-3">
                      Predicted score: <span className="font-bold text-white/70">{aiAnalysis.scorePrediction}</span>
                    </p>
                    <div className="space-y-1.5">
                      {aiAnalysis.reasons.map((r, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: aiAnalysis.confidenceColor }} />
                          <p className="text-[10px] text-white/55 leading-relaxed">{r}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Historical Context */}
                  {aiAnalysis.historicalContext && (
                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 flex gap-2.5">
                      <Trophy size={13} className="text-[#FBBF24] shrink-0 mt-0.5" strokeWidth={1.5} />
                      <p className="text-[9px] text-white/45 leading-relaxed">{aiAnalysis.historicalContext}</p>
                    </div>
                  )}

                  {/* Player Props */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users size={10} className="text-[#38BDF8]" />
                      <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Player Props & Analysis</p>
                    </div>
                    <div className="space-y-2">
                      {playerProps.map((prop, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="rounded-xl border p-2.5"
                          style={{ background: `${prop.confidenceColor}06`, borderColor: `${prop.confidenceColor}1a` }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black text-white">{prop.player}</span>
                              <span className="text-[8px] text-white/30 font-medium">· {prop.teamShort}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] text-white/40">{prop.prop}</span>
                              <span
                                className="text-[7px] font-black rounded-full px-1.5 py-0.5 shrink-0"
                                style={{ background: `${prop.confidenceColor}15`, color: prop.confidenceColor, border: `1px solid ${prop.confidenceColor}30` }}
                              >
                                {prop.confidence}
                              </span>
                            </div>
                          </div>
                          <p className="text-[9px] text-white/40 leading-relaxed">{prop.reason}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Betting Lines */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <DollarSign size={10} className="text-[#4ADE80]" />
                      <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Single Bet Breakdown</p>
                    </div>
                    <div className="space-y-1.5">
                      {bettingLines.map((line, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="rounded-xl border p-2.5"
                          style={{ background: `${line.confidenceColor}05`, borderColor: `${line.confidenceColor}18` }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {/* Market label */}
                            <span className="text-[8px] font-bold text-white/30 uppercase tracking-wider shrink-0 w-24">
                              {line.market}
                            </span>

                            {/* Pick + odds */}
                            <span className="text-[10px] font-black text-white flex-1 truncate">{line.pick}</span>

                            {/* Odds pill */}
                            <span
                              className="text-[9px] font-black rounded-md px-1.5 py-0.5 shrink-0 tabular-nums"
                              style={{ background: `${line.confidenceColor}15`, color: line.confidenceColor }}
                            >
                              {line.odds}
                            </span>

                            {/* Probability */}
                            <span className="text-[8px] text-white/35 shrink-0 tabular-nums w-8 text-right">
                              {line.probability}%
                            </span>

                            {/* Confidence badge */}
                            <span
                              className="text-[7px] font-black rounded-full px-1.5 py-0.5 shrink-0"
                              style={{ background: `${line.confidenceColor}15`, color: line.confidenceColor, border: `1px solid ${line.confidenceColor}25` }}
                            >
                              {line.confidence}
                            </span>
                          </div>
                          <p className="text-[9px] text-white/35 leading-relaxed">{line.reason}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <p className="text-[8px] text-white/15 text-center">
                    ELO + xG model · Historical WC data · Odds are implied, not live lines
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}

// ── Tournament Winner Predictor ───────────────────────────────────────────────

function sortStandings(teams: GSTeam[]): GSTeam[] {
  return [...teams].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if ((b.gf - b.ga) !== (a.gf - a.ga)) return (b.gf - b.ga) - (a.gf - a.ga);
    return b.gf - a.gf;
  });
}

function TournamentPredictor({ groups }: { groups: WCGroup[] }) {
  // Calculate composite score: ELO (80%) + current form (20%)
  const teamScores: { teamId: string; score: number; elo: number; pts: number; gd: number }[] = [];

  for (const group of groups) {
    for (const standing of group.teams) {
      const team = WC_TEAMS[standing.teamId];
      if (!team) continue;
      const gd = standing.gf - standing.ga;
      const formBonus = standing.p > 0 ? (standing.pts / (standing.p * 3)) * 100 : 0;
      const score = team.strength * 0.8 + formBonus * 0.2;
      teamScores.push({ teamId: standing.teamId, score, elo: team.strength, pts: standing.pts, gd });
    }
  }

  teamScores.sort((a, b) => b.score - a.score);
  const top8 = teamScores.slice(0, 8);

  // Normalize to win probabilities
  const totalScore = top8.reduce((s, t) => s + t.score, 0);
  const withProbs = top8.map((t) => ({
    ...t,
    winProb: Math.round((t.score / totalScore) * 100),
  }));

  return (
    <div className="rounded-2xl border border-[#FBBF24]/15 overflow-hidden" style={{ background: "linear-gradient(160deg, #0d1220, #090d14)" }}>
      <div className="px-4 py-3.5 border-b border-white/[0.06] flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-[#FBBF24]/15 border border-[#FBBF24]/25 flex items-center justify-center">
          <Trophy size={14} className="text-[#FBBF24]" />
        </div>
        <div>
          <p className="text-xs font-black text-white">Tournament Winner Prediction</p>
          <p className="text-[9px] text-white/30">ELO model + current group stage form</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 rounded-full bg-[#FBBF24]/[0.08] border border-[#FBBF24]/20 px-2.5 py-1">
          <Brain size={9} className="text-[#FBBF24]" />
          <span className="text-[8px] font-black text-[#FBBF24]">AI SIM</span>
        </div>
      </div>

      <div className="p-4 space-y-2.5">
        {withProbs.map((t, i) => {
          const team = WC_TEAMS[t.teamId];
          if (!team) return null;
          const history = getHistory(t.teamId);
          const barColor = i === 0 ? GOLD : i === 1 ? "#C0C0C0" : i === 2 ? ORANGE : INDIGO;
          return (
            <div key={t.teamId} className="flex items-center gap-3">
              <span className="text-[9px] font-black text-white/20 w-4 shrink-0">#{i + 1}</span>
              <div className="w-8 h-5 rounded overflow-hidden border border-white/10 shrink-0">
                <FlagImg cc={team.countryCode} name={team.shortName} className="w-full h-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black text-white">{team.name}</span>
                  <span className="text-[10px] font-black" style={{ color: barColor }}>{t.winProb}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: barColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(t.winProb / withProbs[0].winProb) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.07, ease: "easeOut" }}
                  />
                </div>
                {history && (
                  <p className="text-[8px] text-white/25 mt-0.5 truncate">{history.quote}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[8px] text-white/25">ELO</p>
                <p className="text-[9px] font-black text-white/50">{t.elo}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 pb-3 text-[8px] text-white/15">
        Probability = ELO strength (80%) + group stage form rate (20%) · Updated from live standings
      </div>
    </div>
  );
}

// ── Date helpers ──────────────────────────────────────────────────────────────

// Static data uses "Jun 17" format — compare against 2026 calendar
function isMatchDatePast(dateStr: string): boolean {
  const parsed = new Date(`${dateStr.trim()} 2026`);
  if (isNaN(parsed.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);

  return parsed < today;
}

function isMatchDateToday(dateStr: string): boolean {
  const parsed = new Date(`${dateStr.trim()} 2026`);
  if (isNaN(parsed.getTime())) return false;

  const today = new Date();
  return (
    parsed.getFullYear() === today.getFullYear() &&
    parsed.getMonth()    === today.getMonth()    &&
    parsed.getDate()     === today.getDate()
  );
}

// ── Upcoming matches derived from groups ──────────────────────────────────────

function getUpcomingFromGroups(groups: WCGroup[], limit = 12): TodayMatch[] {
  const results: TodayMatch[] = [];

  for (const group of groups) {
    for (const m of group.matches) {
      // Skip games that are done (status updated by ESPN)
      if (m.status === "completed") continue;
      // Skip games that are live right now (they're in Today's section)
      if (m.status === "live") continue;
      // Skip games whose date has already passed — static data won't always
      // reflect completed status if ESPN doesn't recognise the team ID
      if (isMatchDatePast(m.date)) continue;
      // Skip today's games — they're fetched separately from ESPN
      if (isMatchDateToday(m.date)) continue;

      const homeTeam = WC_TEAMS[m.home];
      const awayTeam = WC_TEAMS[m.away];
      results.push({
        groupId:    group.id,
        home:       homeTeam?.name ?? m.home,
        away:       awayTeam?.name ?? m.away,
        homeId:     m.home,
        awayId:     m.away,
        date:       m.date,
        time:       m.time,
        venue:      m.venue,
        homeScore:  null,
        awayScore:  null,
        status:     "scheduled",
        homeFlagUrl: homeTeam ? `https://flagcdn.com/w80/${homeTeam.countryCode}.png` : "",
        awayFlagUrl: awayTeam ? `https://flagcdn.com/w80/${awayTeam.countryCode}.png` : "",
      });
      if (results.length >= limit) return results;
    }
  }
  return results;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function MatchAnalysis() {
  const [todayMatches,    setTodayMatches]    = useState<TodayMatch[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<TodayMatch[]>([]);
  const [groups,          setGroups]          = useState<WCGroup[]>(WC_GROUPS);
  const [loading,         setLoading]         = useState(true);
  const [lastFetch,       setLastFetch]       = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [todayRes, groupsRes] = await Promise.allSettled([
        fetch("/api/worldcup/today"),
        fetch("/api/worldcup/groups"),
      ]);

      let liveGroups = WC_GROUPS;
      if (groupsRes.status === "fulfilled" && groupsRes.value.ok) {
        const { groups: g } = await groupsRes.value.json();
        if (g?.length) {
          setGroups(g);
          liveGroups = g;
        }
      }

      if (todayRes.status === "fulfilled" && todayRes.value.ok) {
        const { matches: m } = await todayRes.value.json();
        setTodayMatches(Array.isArray(m) ? m : []);
      }

      // Build upcoming from groups data (exclude completed)
      setUpcomingMatches(getUpcomingFromGroups(liveGroups, 12));
    } catch {
      setUpcomingMatches(getUpcomingFromGroups(WC_GROUPS, 12));
    } finally {
      setLoading(false);
      setLastFetch(new Date());
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasLive = todayMatches.some((m) => m.status === "live");
  const hasTodayMatches = todayMatches.length > 0;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1 flex-wrap">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-[#818CF8]" strokeWidth={2} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">AI Match Analysis</h2>
              {hasLive && (
                <motion.span
                  className="text-[9px] font-black text-red-400 border border-red-400/30 bg-red-400/10 rounded-full px-2 py-0.5"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  ● LIVE
                </motion.span>
              )}
            </div>
            <p className="text-[11px] text-white/30">xG · ELO · Historical data · Player props · WC 2026</p>
          </div>
        </div>
        <button
          onClick={() => load()}
          disabled={loading}
          className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-white/30 hover:text-white/60 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
          {lastFetch ? lastFetch.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-96 rounded-2xl bg-white/[0.04] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* ── Today's Matches ── */}
          {hasTodayMatches && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Zap size={14} className="text-[#FF7828]" strokeWidth={2.5} />
                <h3 className="text-base font-black text-white">Today&apos;s Matches</h3>
                {hasLive && (
                  <motion.span
                    className="text-[9px] font-black text-red-400 border border-red-400/30 bg-red-400/10 rounded-full px-2 py-0.5"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    ● LIVE
                  </motion.span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {todayMatches.map((m, i) => (
                  <MatchCard key={`today-${m.homeId}-${m.awayId}-${i}`} match={m} compact={false} />
                ))}
              </div>
            </section>
          )}

          {/* ── Upcoming Matches ── */}
          {upcomingMatches.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={14} className="text-[#38BDF8]" strokeWidth={2} />
                <h3 className="text-base font-black text-white">
                  {hasTodayMatches ? "Upcoming Matches" : "Scheduled Matches"}
                </h3>
                <span className="text-[9px] font-bold text-white/30 border border-white/[0.08] rounded-full px-2 py-0.5">
                  {upcomingMatches.length} matches
                </span>
              </div>
              <div className="space-y-2">
                {upcomingMatches.map((m, i) => (
                  <MatchCard key={`upcoming-${m.homeId}-${m.awayId}-${i}`} match={m} compact={true} />
                ))}
              </div>
            </section>
          )}

          {/* No matches fallback */}
          {!hasTodayMatches && upcomingMatches.length === 0 && (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-10 text-center">
              <Clock size={28} className="text-white/20 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-white/40 text-sm font-bold">No matches found</p>
              <p className="text-white/20 text-xs mt-1">Check back when the tournament is underway</p>
            </div>
          )}

          {/* ── Tournament Winner Predictor ── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={14} className="text-[#FBBF24]" strokeWidth={2} />
              <h3 className="text-base font-black text-white">Tournament Simulator</h3>
            </div>
            <TournamentPredictor groups={groups} />
          </section>
        </>
      )}
    </div>
  );
}
