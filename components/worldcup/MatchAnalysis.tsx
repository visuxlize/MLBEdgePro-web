"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, TrendingUp, Target, RefreshCw, Clock, Trophy,
  ChevronDown, ChevronUp, Shield, Flame, CheckCircle2, MapPin,
} from "lucide-react";
import { WC_GROUPS, WC_TEAMS, eloWinProb } from "@/lib/worldcup/data";
import type { TodayMatch } from "@/app/api/worldcup/today/route";

const GOLD   = "#FBBF24";
const GREEN  = "#4ADE80";
const BLUE   = "#38BDF8";
const RED    = "#F87171";
const ORANGE = "#FF7828";
const INDIGO = "#818CF8";

// ── Stadium images (Wikimedia Commons free images) ────────────────────────────

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
  "Estadio BBVA":          "https://commons.wikimedia.org/wiki/Special:FilePath/Estadio_BBVA.jpg?width=800",
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

function probToAmerican(prob: number, vig = 1.045): string {
  const adj = Math.min(prob * vig, 0.97);
  const dec = 1 / adj;
  if (dec >= 2) return `+${Math.round((dec - 1) * 100)}`;
  return `-${Math.round(100 / (dec - 1))}`;
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

// ── Betting edges ─────────────────────────────────────────────────────────────

interface MatchEdge {
  label: string;
  detail: string;
  color: string;
  icon: "fire" | "target" | "zap" | "shield";
  confidence: "Strong" | "Moderate" | "Lean";
}

function deriveEdges(
  homeName: string,
  awayName: string,
  homeElo: number,
  awayElo: number,
  [hw, dw, aw]: [number, number, number],
  homeXG: number,
  awayXG: number,
): MatchEdge[] {
  const eloDiff = homeElo - awayElo;
  const edges: MatchEdge[] = [];

  if (Math.abs(eloDiff) >= 80) {
    const favTeam = eloDiff > 0 ? homeName : awayName;
    const favProb = eloDiff > 0 ? hw : aw;
    const favOdds = probToAmerican(favProb);
    edges.push({
      label: `${favTeam} ML`,
      detail: `ELO gap ${Math.abs(eloDiff)} pts → ${Math.round(favProb * 100)}% win probability. Model line: ${favOdds}`,
      color: GREEN,
      icon: "target",
      confidence: Math.abs(eloDiff) >= 150 ? "Strong" : "Moderate",
    });
  } else {
    edges.push({
      label: "Draw / DNB",
      detail: `Within ${Math.abs(eloDiff)} ELO pts — draw at ${Math.round(dw * 100)}% is high value in this range.`,
      color: GOLD,
      icon: "zap",
      confidence: "Moderate",
    });
  }

  const totalXG = homeXG + awayXG;
  const overProb = Math.max(0.35, Math.min(0.68, totalXG / 5.0));
  if (overProb >= 0.52) {
    edges.push({
      label: `Over 2.5 Goals`,
      detail: `Combined xG ${totalXG.toFixed(1)} — model gives ${Math.round(overProb * 100)}% chance of 3+ goals.`,
      color: ORANGE,
      icon: "fire",
      confidence: overProb >= 0.58 ? "Strong" : "Moderate",
    });
  } else {
    edges.push({
      label: `Under 2.5 Goals`,
      detail: `Low xG game — ${totalXG.toFixed(1)} combined. Tight match expected. ${Math.round((1 - overProb) * 100)}% model chance.`,
      color: BLUE,
      icon: "shield",
      confidence: overProb <= 0.44 ? "Moderate" : "Lean",
    });
  }

  const bttsProb = Math.max(0.30, Math.min(0.65, (homeXG * awayXG) / 3.2));
  if (bttsProb >= 0.50) {
    edges.push({
      label: "Both Teams to Score",
      detail: `Both sides carry attack threat (${homeXG.toFixed(1)} vs ${awayXG.toFixed(1)} xG). BTTS at ${Math.round(bttsProb * 100)}%.`,
      color: INDIGO,
      icon: "fire",
      confidence: bttsProb >= 0.56 ? "Moderate" : "Lean",
    });
  } else {
    const cleanSheetTeam = eloDiff > 50 ? homeName : awayName;
    edges.push({
      label: `${cleanSheetTeam} Clean Sheet`,
      detail: `Weaker attack on other side (${Math.min(homeXG, awayXG).toFixed(1)} xG). Clean sheet at ${Math.round((1 - bttsProb) * 55)}%.`,
      color: GREEN,
      icon: "shield",
      confidence: "Lean",
    });
  }

  return edges.slice(0, 3);
}

const CONF_COLOR: Record<string, string> = { Strong: GREEN, Moderate: GOLD, Lean: BLUE };

function EdgeIcon({ type, color }: { type: MatchEdge["icon"]; color: string }) {
  const props = { size: 12, strokeWidth: 2.5, style: { color } };
  if (type === "fire")   return <Flame   {...props} />;
  if (type === "target") return <Target  {...props} />;
  if (type === "shield") return <Shield  {...props} />;
  return <Zap {...props} />;
}

// ── Stadium Image component with fallback ──────────────────────────────────

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
      {/* Color gradient overlay — always present, blends with photo if loaded */}
      <div
        className="absolute inset-0"
        style={{
          background: imgFailed || !imgUrl
            ? `linear-gradient(135deg, ${homeColor}35 0%, rgba(9,13,20,0.7) 50%, ${awayColor}30 100%)`
            : `linear-gradient(135deg, ${homeColor}28 0%, rgba(9,13,20,0.55) 40%, ${awayColor}20 100%)`,
        }}
      />
      {/* Bottom fade to card body */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#090d14] to-transparent" />
    </>
  );
}

// ── Single Match Card ─────────────────────────────────────────────────────────

function MatchCard({ match }: { match: TodayMatch }) {
  const [expanded, setExpanded] = useState(true);

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

  const edges = deriveEdges(match.home, match.away, homeElo, awayElo, [hw, dw, aw], homeXG, awayXG);

  const homeColor = homeTeam?.color ?? "#1E3A8A";
  const awayColor = awayTeam?.color ?? "#065F46";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/[0.08] overflow-hidden flex flex-col"
      style={{ background: "#090d14" }}
    >
      {/* ── Stadium hero image ── */}
      <div className="relative h-44 overflow-hidden">
        <StadiumBg venue={match.venue} homeColor={homeColor} awayColor={awayColor} />

        <div className="relative z-10 p-4 h-full flex flex-col justify-between">
          {/* Top row: group badge + status */}
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

          {/* Teams + score row */}
          <div className="flex items-end gap-2">
            {/* Home */}
            <div className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-14 h-10 rounded-lg overflow-hidden border-2 shadow-lg"
                style={{ borderColor: `${homeColor}60` }}>
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
              <div className="w-14 h-10 rounded-lg overflow-hidden border-2 shadow-lg"
                style={{ borderColor: `${awayColor}60` }}>
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

      {/* ── Venue label ── */}
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

      {/* ── xG Projection ── */}
      <div className="px-4 py-3 border-b border-white/[0.05]">
        <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-2.5">xG Projection · ELO Model</p>
        <div className="space-y-2">
          {/* Home xG */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black w-8 text-right shrink-0" style={{ color: BLUE }}>{homeXG.toFixed(1)}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: BLUE }}
                initial={{ width: 0 }}
                animate={{ width: `${(homeXG / maxXG) * 100}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            </div>
            <span className="text-[9px] text-white/35 w-14 truncate shrink-0">{match.home}</span>
          </div>
          {/* Away xG */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black w-8 text-right shrink-0" style={{ color: RED }}>{awayXG.toFixed(1)}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: RED }}
                initial={{ width: 0 }}
                animate={{ width: `${(awayXG / maxXG) * 100}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
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

      {/* ── Win Probability ── */}
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

      {/* ── Bet Analysis toggle ── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={12} className="text-[#FBBF24]" strokeWidth={2.5} />
          <span className="text-xs font-black text-white">Bet Analysis</span>
          <span className="text-[9px] text-white/30">{edges.length} picks</span>
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
            <div className="px-4 pb-4 space-y-2 border-t border-white/[0.05] pt-3">
              {edges.map((edge, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-xl border p-3"
                  style={{ background: `${edge.color}08`, borderColor: `${edge.color}22` }}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${edge.color}15`, border: `1px solid ${edge.color}25` }}>
                      <EdgeIcon type={edge.icon} color={edge.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <p className="text-[11px] font-black text-white">{edge.label}</p>
                        <span className="text-[8px] font-black rounded-full px-1.5 py-0.5 shrink-0"
                          style={{ background: `${CONF_COLOR[edge.confidence]}15`, color: CONF_COLOR[edge.confidence], border: `1px solid ${CONF_COLOR[edge.confidence]}30` }}>
                          {edge.confidence}
                        </span>
                      </div>
                      <p className="text-[9px] text-white/40 leading-relaxed">{edge.detail}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              <p className="text-[8px] text-white/15 text-center pt-0.5">
                ELO model estimates · For analysis only · Not financial advice
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Upcoming fallback ─────────────────────────────────────────────────────────

function getUpcomingMatches(count = 6): TodayMatch[] {
  const results: TodayMatch[] = [];
  for (const group of WC_GROUPS) {
    for (const m of group.matches) {
      if (m.status === "completed") continue;
      const homeTeam = WC_TEAMS[m.home];
      const awayTeam = WC_TEAMS[m.away];
      results.push({
        groupId: group.id,
        home:    homeTeam?.name ?? m.home,
        away:    awayTeam?.name ?? m.away,
        homeId:  m.home,
        awayId:  m.away,
        date:    m.date,
        time:    m.time,
        venue:   m.venue,
        homeScore: null,
        awayScore: null,
        status: "scheduled",
        homeFlagUrl: homeTeam ? `https://flagcdn.com/w80/${homeTeam.countryCode}.png` : "",
        awayFlagUrl: awayTeam ? `https://flagcdn.com/w80/${awayTeam.countryCode}.png` : "",
      });
      if (results.length >= count) break;
    }
    if (results.length >= count) break;
  }
  return results;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function MatchAnalysis() {
  const [matches,   setMatches]   = useState<TodayMatch[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/worldcup/today");
      if (res.ok) {
        const { matches: m } = await res.json();
        setMatches(Array.isArray(m) && m.length > 0 ? m : getUpcomingMatches());
      } else {
        setMatches(getUpcomingMatches());
      }
    } catch {
      setMatches(getUpcomingMatches());
    } finally {
      setLoading(false);
      setLastFetch(new Date());
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasLive = matches.some((m) => m.status === "live");
  const heading = matches.some((m) => m.status !== "scheduled") ? "Today's Matches" : "Upcoming Matches";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-[#FBBF24]" strokeWidth={2} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">{heading}</h2>
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
            <p className="text-[11px] text-white/30">xG + ELO analysis · WC 2026</p>
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
      ) : matches.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-10 text-center">
          <Clock size={28} className="text-white/20 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-white/40 text-sm font-bold">No matches scheduled today</p>
          <p className="text-white/20 text-xs mt-1">Check back closer to the next match day</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {matches.map((m, i) => (
            <MatchCard key={`${m.homeId}-${m.awayId}-${i}`} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}
