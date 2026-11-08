"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Lock, Zap, Check, ArrowRight, TrendingUp, TrendingDown, Minus, Star } from "lucide-react";
import { playerHeadshotUrl, teamLogoUrl, TEAM_ABBR, TEAM_COLORS } from "@/lib/mlb/api";
import { PlayerImg } from "@/components/web-tool/player-img";
import { useSubscription } from "@/lib/subscription";
import type { H2HGame, NRFIPrediction, RosterBatter } from "@/lib/mlb/api";

// ── Animation variants ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] },
  }),
};

// ── Shared helpers ────────────────────────────────────────────────────────────

function pctColor(pct: number) {
  if (pct >= 65) return "#12a150";
  if (pct >= 40) return "#1a73ff";
  return "#ef3b4a";
}

// Masked headshot — fades the grey MLB image background to transparent
// so the player floats cleanly on any dark surface.
function Headshot({
  id,
  name,
  size = 80,
  maskStyle = "radial-gradient(ellipse 78% 82% at 50% 32%, black 42%, transparent 100%)",
  className = "",
}: {
  id: number;
  name: string;
  size?: number;
  maskStyle?: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={playerHeadshotUrl(id)}
      alt={name}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{
        objectPosition: "top center",
        maskImage: maskStyle,
        WebkitMaskImage: maskStyle,
      }}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
    />
  );
}

function UpsellBanner({
  tier,
  message,
  href,
  color,
}: {
  tier: string;
  message: string;
  href: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-6 gap-3">
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center border"
        style={{ background: `${color}15`, borderColor: `${color}30` }}
      >
        <Lock size={17} style={{ color }} strokeWidth={1.8} />
      </div>
      <p className="text-xs text-[#14161b]/56">{message}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 rounded-full text-[#14161b] text-xs font-black px-5 py-2.5 hover:opacity-90 transition-opacity shadow-lg"
        style={{ background: color, boxShadow: `0 6px 20px ${color}40` }}
      >
        <Zap size={12} strokeWidth={2.5} />
        Unlock {tier}
        <ArrowRight size={11} strokeWidth={2.5} />
      </Link>
    </div>
  );
}

// ── PropRow ───────────────────────────────────────────────────────────────────

interface PropRowData {
  batterId: number;
  batterName: string;
  batterAvg: string;
  batterHr: number;
  batterOps?: string;
  pct: number;
  label: string;
  pitcherName: string;
  teamId?: number;
  position?: string;
  isHot?: boolean;
  isDue?: boolean;
}

function PropCardLarge({ row, index }: { row: PropRowData; index: number }) {
  const c = pctColor(row.pct);
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="relative rounded-2xl border border-[#14161b]/[.09] bg-[#ffffff] overflow-hidden group hover:border-[#14161b]/[.09] transition-colors"
    >
      {/* Badges — top-right corner */}
      <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1 z-10">
        {row.isHot && (
          <div className="flex items-center gap-1 rounded-full bg-[#ef3b4a] px-2 py-0.5 shadow-sm">
            <span className="text-[9px] font-black text-[#14161b] tracking-widest">🔥 HOT</span>
          </div>
        )}
        {row.isDue && !row.isHot && (
          <div className="flex items-center gap-1 rounded-full bg-[#d49a06] px-2 py-0.5 shadow-sm">
            <span className="text-[9px] font-black text-black tracking-widest">⚡ DUE</span>
          </div>
        )}
      </div>

      {/* Headshot — no circle, masked edges blend into card bg */}
      <div className="flex justify-center pt-3">
        <Headshot id={row.batterId} name={row.batterName} size={88} />
      </div>

      <div className="px-3 pb-4 flex flex-col items-center gap-2 text-center -mt-2">
        {/* Pct badge — solid background, bold white text */}
        <div
          className="rounded-full px-3 py-1 text-[12px] font-black text-[#14161b]"
          style={{ background: c, boxShadow: `0 2px 10px ${c}50` }}
        >
          {row.pct}%
        </div>

        {/* Name + info */}
        <div>
          <p className="text-sm font-black text-[#14161b] leading-tight">{row.batterName}</p>
          <p className="text-[10px] text-[#14161b]/46 mt-0.5">
            {row.batterAvg} AVG · {row.batterHr} HR · vs {row.pitcherName.split(" ").pop()}
          </p>
        </div>

        {/* Probability bar */}
        <div className="w-full">
          <div className="h-1 rounded-full bg-[#14161b]/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: c }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, row.pct * 3.3)}%` }}
              transition={{ duration: 0.6, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p className="text-[9px] font-bold mt-1" style={{ color: `${c}70` }}>{row.label}</p>
        </div>
      </div>
    </motion.div>
  );
}

function PropRowSmall({ row, index }: { row: PropRowData; index: number }) {
  const c = pctColor(row.pct);
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="flex items-center gap-3 py-2.5 border-b border-[#14161b]/[.09] last:border-0"
    >
      {/* Headshot — no circle, masked */}
      <div className="w-11 h-11 shrink-0 flex items-center justify-center">
        <Headshot
          id={row.batterId}
          name={row.batterName}
          size={44}
          maskStyle="radial-gradient(ellipse 80% 88% at 50% 28%, black 38%, transparent 100%)"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-sm font-bold text-[#14161b] truncate">{row.batterName}</p>
          {row.isHot && (
            <span className="shrink-0 text-[8px] font-black text-white bg-[#ef3b4a] rounded-full px-1.5 py-0.5">🔥</span>
          )}
          {row.isDue && !row.isHot && (
            <span className="shrink-0 text-[8px] font-black text-black bg-[#d49a06] rounded-full px-1.5 py-0.5">⚡</span>
          )}
        </div>
        <p className="text-[10px] text-[#14161b]/46 truncate">
          {row.batterAvg} AVG · {row.batterHr} HR · vs {row.pitcherName.split(" ").pop()}
        </p>
      </div>
      <div className="text-right shrink-0">
        <div
          className="inline-block rounded-full px-2.5 py-0.5 text-[13px] font-black text-[#14161b] tabular-nums"
          style={{ background: c }}
        >
          {row.pct}%
        </div>
        <p className="text-[9px] font-bold mt-0.5" style={{ color: `${c}70` }}>{row.label}</p>
      </div>
    </motion.div>
  );
}

// ── GatedPropList ─────────────────────────────────────────────────────────────

interface PropListProps {
  title: string;
  subtitle?: string;
  rows: PropRowData[];
  variant?: "cards" | "list";
  freeCount?: number;
  threshold?: number;
}

export function GatedPropList({ title, subtitle, rows, variant = "list", freeCount = 2, threshold }: PropListProps) {
  const { isPro, isLoaded } = useSubscription();
  if (!isLoaded) return null;

  const filtered = threshold ? rows.filter((r) => r.pct >= threshold) : rows;
  const free   = filtered.slice(0, freeCount);
  const locked = filtered.slice(freeCount);

  if (filtered.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#14161b]/[.09] bg-[#ffffff] overflow-hidden">
      <div className="px-5 pt-5 pb-3 border-b border-[#14161b]/[.09] flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold text-[#14161b]/46 tracking-widest uppercase mb-1">Prop Signals</p>
          <p className="text-sm font-black text-[#14161b]">{title}</p>
          {subtitle && <p className="text-[10px] text-[#14161b]/46 mt-0.5">{subtitle}</p>}
        </div>
        {threshold && (
          <span className="text-[9px] font-black text-[#1a73ff] bg-[#1a73ff]/10 border border-[#1a73ff]/20 rounded-full px-2 py-0.5">
            ≥{threshold}% only
          </span>
        )}
      </div>

      {variant === "cards" ? (
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {free.map((r, i) => <PropCardLarge key={r.batterId} row={r} index={i} />)}
          </div>
          {locked.length > 0 && !isPro && (
            <div className="mt-3 rounded-xl border border-[#1a73ff]/20 bg-[#1a73ff]/[0.03]">
              <UpsellBanner
                tier="Fan — $4.99/mo"
                message={`+${locked.length} more players locked behind Fan plan`}
                href="/upgrade?tier=fan"
                color="#1a73ff"
              />
            </div>
          )}
          {isPro && locked.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
              {locked.map((r, i) => <PropCardLarge key={r.batterId} row={r} index={free.length + i} />)}
            </div>
          )}
        </div>
      ) : (
        <div className="px-5 py-1">
          {free.map((r, i) => <PropRowSmall key={r.batterId} row={r} index={i} />)}
          {locked.length > 0 && (
            isPro ? (
              locked.map((r, i) => <PropRowSmall key={r.batterId} row={r} index={free.length + i} />)
            ) : (
              <div className="relative">
                <div className="pointer-events-none select-none" style={{ filter: "blur(5px)", opacity: 0.3 }}>
                  {locked.slice(0, 3).map((r, i) => <PropRowSmall key={r.batterId} row={r} index={i} />)}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-[#ffffff]/80 backdrop-blur-[2px]">
                  <UpsellBanner
                    tier="Fan — $4.99/mo"
                    message={`+${locked.length} more players locked`}
                    href="/upgrade?tier=fan"
                    color="#1a73ff"
                  />
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ── GatedWinProb ──────────────────────────────────────────────────────────────

interface WinProbProps {
  homeProb: number;
  awayTeam: string;
  homeTeam: string;
  awayTeamId: number;
  homeTeamId: number;
}

export function GatedWinProb({ homeProb, awayTeam, homeTeam, awayTeamId, homeTeamId }: WinProbProps) {
  const { isPro, isLoaded } = useSubscription();
  const awayProb = 100 - homeProb;
  const awayColor = TEAM_COLORS[awayTeamId] ?? "#6d4fe0";
  const homeColor = TEAM_COLORS[homeTeamId] ?? "#1a73ff";

  if (!isLoaded) return null;

  if (!isPro) {
    return (
      <div className="rounded-2xl border border-[#1a73ff]/20 bg-[#ffffff] overflow-hidden h-full">
        <div className="px-5 py-4 border-b border-[#14161b]/[.09] flex items-center justify-between">
          <p className="text-sm font-black text-[#14161b]">Win Probability</p>
          <div className="flex items-center gap-1.5 rounded-full border border-[#1a73ff]/30 bg-[#1a73ff]/10 px-2.5 py-1">
            <Lock size={10} className="text-[#1a73ff]" strokeWidth={2.5} />
            <span className="text-[10px] font-black text-[#1a73ff]">FAN</span>
          </div>
        </div>
        <div className="px-5 py-5 flex flex-col items-center gap-4">
          <div className="w-full pointer-events-none select-none" style={{ filter: "blur(8px)", opacity: 0.3 }}>
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-2">
              <div className="h-full rounded-l-full" style={{ width: `${awayProb}%`, background: awayColor }} />
              <div className="h-full rounded-r-full" style={{ width: `${homeProb}%`, background: homeColor }} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xl font-black" style={{ color: awayColor }}>{awayProb}%</p>
              <p className="text-xl font-black" style={{ color: homeColor }}>{homeProb}%</p>
            </div>
          </div>
          <UpsellBanner tier="Fan — $4.99/mo" message="Win probability is a Fan feature" href="/upgrade?tier=fan" color="#1a73ff" />
        </div>
      </div>
    );
  }

  const awayAbbr = TEAM_ABBR[awayTeamId] ?? awayTeam.split(" ").pop() ?? "";
  const homeAbbr = TEAM_ABBR[homeTeamId] ?? homeTeam.split(" ").pop() ?? "";
  const leader = awayProb > homeProb ? awayAbbr : homeAbbr;
  const leaderPct = Math.max(awayProb, homeProb);

  return (
    <div className="rounded-2xl border border-[#14161b]/[.09] bg-[#ffffff] p-5 h-full">
      <p className="text-[10px] font-bold text-[#14161b]/46 tracking-widest uppercase mb-4">Win Probability</p>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PlayerImg src={teamLogoUrl(awayTeamId)} alt={awayAbbr} className="w-5 h-5 object-contain" />
          <span className="text-xs font-bold text-[#14161b]/74">{awayAbbr}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#14161b]/74">{homeAbbr}</span>
          <PlayerImg src={teamLogoUrl(homeTeamId)} alt={homeAbbr} className="w-5 h-5 object-contain" />
        </div>
      </div>

      <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-3">
        <motion.div
          className="h-full rounded-l-full"
          style={{ background: awayColor }}
          initial={{ width: 0 }}
          animate={{ width: `${awayProb}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          className="h-full rounded-r-full"
          style={{ background: homeColor }}
          initial={{ width: 0 }}
          animate={{ width: `${homeProb}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-center">
          <p className="text-2xl font-black tabular-nums" style={{ color: awayColor }}>{awayProb}%</p>
          <p className="text-[9px] text-[#14161b]/46">Away</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-[#14161b]/38">Model estimate</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black tabular-nums" style={{ color: homeColor }}>{homeProb}%</p>
          <p className="text-[9px] text-[#14161b]/46">Home</p>
        </div>
      </div>

      <div className="rounded-xl bg-[#14161b]/[0.03] border border-[#14161b]/[.09] px-3 py-2 text-center">
        <p className="text-[11px] text-[#14161b]/56">
          Model leans <span className="text-[#14161b] font-black">{leader}</span> ({leaderPct}% confidence)
        </p>
      </div>
    </div>
  );
}

// ── NRFI Card ─────────────────────────────────────────────────────────────────

interface NRFIProps {
  nrfi: NRFIPrediction;
  isFinal?: boolean;
  firstInningScore?: { away: number; home: number } | null;
  awayAbbr: string;
  homeAbbr: string;
}

export function NRFICard({ nrfi, isFinal, firstInningScore, awayAbbr, homeAbbr }: NRFIProps) {
  const { isPro, isLoaded } = useSubscription();
  if (!isLoaded) return null;

  if (!isPro) {
    return (
      <div className="rounded-2xl border border-[#1a73ff]/20 bg-[#ffffff] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#14161b]/[.09] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#14161b]/46 tracking-widest uppercase mb-1">1st Inning</p>
            <p className="text-sm font-black text-[#14161b]">NRFI Prediction</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-[#1a73ff]/30 bg-[#1a73ff]/10 px-2.5 py-1">
            <Lock size={10} className="text-[#1a73ff]" strokeWidth={2.5} />
            <span className="text-[10px] font-black text-[#1a73ff]">FAN</span>
          </div>
        </div>
        <UpsellBanner tier="Fan — $4.99/mo" message="NRFI prediction unlocks with Fan plan" href="/upgrade?tier=fan" color="#1a73ff" />
      </div>
    );
  }

  const verdictColor =
    nrfi.verdict === "YES" ? "#12a150" :
    nrfi.verdict === "NO"  ? "#ef3b4a" : "#d49a06";

  const verdictBg =
    nrfi.verdict === "YES" ? "#12a15015" :
    nrfi.verdict === "NO"  ? "#ef3b4a15" : "#d49a0615";

  const VerdictIcon = nrfi.verdict === "YES" ? TrendingDown : nrfi.verdict === "NO" ? TrendingUp : Minus;

  const actualNRFI = firstInningScore
    ? firstInningScore.away === 0 && firstInningScore.home === 0
    : null;

  const wasCorrect =
    actualNRFI !== null
      ? (nrfi.verdict === "YES" && actualNRFI) || (nrfi.verdict === "NO" && !actualNRFI)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      className="rounded-2xl border bg-[#ffffff] overflow-hidden"
      style={{ borderColor: `${verdictColor}30` }}
    >
      <div className="px-5 py-4 border-b border-[#14161b]/[.09] flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-[#14161b]/46 tracking-widest uppercase mb-1">1st Inning Analysis</p>
          <p className="text-sm font-black text-[#14161b]">NRFI Prediction</p>
        </div>

        {/* Post-game result badge */}
        {wasCorrect !== null && (
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1 border text-xs font-black"
            style={{
              background: wasCorrect ? "#12a15015" : "#ef3b4a15",
              borderColor: wasCorrect ? "#12a15030" : "#ef3b4a30",
              color: wasCorrect ? "#12a150" : "#ef3b4a",
            }}
          >
            {wasCorrect ? <Check size={11} strokeWidth={3} /> : <Minus size={11} strokeWidth={2} />}
            {wasCorrect ? "Correct" : "Missed"}
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Verdict */}
          <div
            className="shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 border"
            style={{ background: verdictBg, borderColor: `${verdictColor}30` }}
          >
            <VerdictIcon size={20} style={{ color: verdictColor }} strokeWidth={2} />
            <span className="text-[10px] font-black tracking-widest" style={{ color: verdictColor }}>
              {nrfi.verdict === "YES" ? "NRFI" : nrfi.verdict === "NO" ? "FRFI" : "PUSH"}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-base font-black text-[#14161b]">
                {nrfi.verdict === "YES"
                  ? "No Run First Inning — Likely"
                  : nrfi.verdict === "NO"
                  ? "First Run Expected — Likely"
                  : "First Inning — Coin Flip"}
              </p>
            </div>
            <p className="text-xs text-[#14161b]/56 mb-3">{nrfi.reason}</p>

            {/* Confidence */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full bg-[#14161b]/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: verdictColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${nrfi.confidence}%` }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <span className="text-xs font-black tabular-nums" style={{ color: verdictColor }}>
                {nrfi.confidence}%
              </span>
            </div>
          </div>
        </div>

        {/* Post-game first inning score */}
        {firstInningScore && (
          <div className="mt-4 rounded-xl bg-[#14161b]/[0.03] border border-[#14161b]/[.09] px-4 py-3">
            <p className="text-[10px] text-[#14161b]/46 tracking-widest uppercase mb-2">Actual 1st Inning</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#14161b]">{awayAbbr}</span>
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-[#14161b] tabular-nums">{firstInningScore.away}</span>
                <span className="text-[#14161b]/38">—</span>
                <span className="text-xl font-black text-[#14161b] tabular-nums">{firstInningScore.home}</span>
              </div>
              <span className="text-sm font-bold text-[#14161b]">{homeAbbr}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── H2H History ───────────────────────────────────────────────────────────────

interface H2HProps {
  games: H2HGame[];
  currentAwayTeamId: number;
  currentHomeTeamId: number;
}

export function GatedH2HHistory({ games, currentAwayTeamId, currentHomeTeamId }: H2HProps) {
  const { isPro, isLoaded } = useSubscription();
  if (!isLoaded) return null;

  if (!isPro) {
    return (
      <div className="rounded-2xl border border-[#1a73ff]/20 bg-[#ffffff] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#14161b]/[.09] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#14161b]/46 tracking-widest uppercase mb-1">History</p>
            <p className="text-sm font-black text-[#14161b]">Head-to-Head</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-[#1a73ff]/30 bg-[#1a73ff]/10 px-2.5 py-1">
            <Lock size={10} className="text-[#1a73ff]" strokeWidth={2.5} />
            <span className="text-[10px] font-black text-[#1a73ff]">FAN</span>
          </div>
        </div>
        <UpsellBanner tier="Fan — $4.99/mo" message="H2H history unlocks with Fan plan" href="/upgrade?tier=fan" color="#1a73ff" />
      </div>
    );
  }

  const awayAbbr = TEAM_ABBR[currentAwayTeamId] ?? "Away";
  const homeAbbr = TEAM_ABBR[currentHomeTeamId] ?? "Home";
  const awayColor = TEAM_COLORS[currentAwayTeamId] ?? "#6d4fe0";
  const homeColor = TEAM_COLORS[currentHomeTeamId] ?? "#1a73ff";

  // Filter out 0-0 ghost games (incomplete data)
  const validGames = games.filter((g) => !(g.awayScore === 0 && g.homeScore === 0));

  // Count wins from current matchup perspective
  const awayWins = validGames.filter((g) => g.winnerTeamId === currentAwayTeamId).length;
  const homeWins = validGames.filter((g) => g.winnerTeamId === currentHomeTeamId).length;

  if (validGames.length === 0) {
    return (
      <div className="rounded-2xl border border-[#14161b]/[.09] bg-[#ffffff] p-6 text-center">
        <p className="text-[#14161b]/46 text-sm">No recent H2H history found</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.2 }}
      className="rounded-2xl border border-[#14161b]/[.09] bg-[#ffffff] overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#14161b]/[.09]">
        <p className="text-[10px] font-bold text-[#14161b]/46 tracking-widest uppercase mb-2">History</p>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-black text-[#14161b]">Head-to-Head</p>
          {/* Series record pill */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-sm font-black tabular-nums" style={{ color: awayColor }}>{awayWins}</span>
            <span className="text-[#14161b]/46 text-xs font-bold mx-0.5">–</span>
            <span className="text-sm font-black tabular-nums" style={{ color: homeColor }}>{homeWins}</span>
            <span className="text-[10px] text-[#14161b]/46 ml-1">({validGames.length}g)</span>
          </div>
        </div>
        {/* Team labels under record */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5">
            <PlayerImg src={teamLogoUrl(currentAwayTeamId)} alt={awayAbbr} className="w-4 h-4 object-contain" />
            <span className="text-[10px] font-bold" style={{ color: awayColor }}>{awayAbbr}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold" style={{ color: homeColor }}>{homeAbbr}</span>
            <PlayerImg src={teamLogoUrl(currentHomeTeamId)} alt={homeAbbr} className="w-4 h-4 object-contain" />
          </div>
        </div>
      </div>

      <div className="divide-y divide-[#14161b]/[.09]">
        {validGames.map((g, i) => {
          const isAwayGame = g.awayTeamId === currentAwayTeamId;
          const awayScore = isAwayGame ? g.awayScore : g.homeScore;
          const homeScore = isAwayGame ? g.homeScore : g.awayScore;
          const awayWon  = awayScore > homeScore;
          const winColor = awayWon ? awayColor : homeColor;
          const winAbbr  = awayWon ? awayAbbr  : homeAbbr;
          const d = new Date(g.date);
          const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

          return (
            <motion.div
              key={g.gamePk}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="px-4 py-3 flex items-center gap-3"
            >
              {/* Date */}
              <p className="text-[10px] text-[#14161b]/56 font-medium w-12 shrink-0">{dateStr}</p>

              {/* Score block — always visible on mobile */}
              <div className="flex-1 flex items-center justify-center gap-0">
                {/* Away */}
                <div className={`flex items-center gap-1.5 flex-1 justify-end ${awayWon ? "" : "opacity-40"}`}>
                  <span className="text-xs font-black text-[#14161b]">{awayAbbr}</span>
                  <span
                    className="text-xl font-black tabular-nums min-w-[1.5rem] text-center"
                    style={{ color: awayWon ? awayColor : "white" }}
                  >
                    {awayScore}
                  </span>
                </div>

                <span className="text-[#14161b]/38 text-xs font-bold mx-2">:</span>

                {/* Home */}
                <div className={`flex items-center gap-1.5 flex-1 ${!awayWon ? "" : "opacity-40"}`}>
                  <span
                    className="text-xl font-black tabular-nums min-w-[1.5rem] text-center"
                    style={{ color: !awayWon ? homeColor : "white" }}
                  >
                    {homeScore}
                  </span>
                  <span className="text-xs font-black text-[#14161b]">{homeAbbr}</span>
                </div>
              </div>

              {/* Winner badge */}
              <div className="shrink-0">
                <span
                  className="text-[9px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: `${winColor}25`, color: winColor }}
                >
                  {winAbbr} W
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Lineups ───────────────────────────────────────────────────────────────────

interface LineupsProps {
  awayBatters: RosterBatter[];
  homeBatters: RosterBatter[];
  awayTeamId: number;
  homeTeamId: number;
}

export function GatedLineups({ awayBatters, homeBatters, awayTeamId, homeTeamId }: LineupsProps) {
  const { isSuperPro, isLoaded } = useSubscription();
  if (!isLoaded) return null;

  const awayAbbr = TEAM_ABBR[awayTeamId] ?? "Away";
  const homeAbbr = TEAM_ABBR[homeTeamId] ?? "Home";
  const awayColor = TEAM_COLORS[awayTeamId] ?? "#6d4fe0";
  const homeColor = TEAM_COLORS[homeTeamId] ?? "#1a73ff";

  if (!isSuperPro) {
    return (
      <div className="rounded-2xl border border-[#6d4fe0]/20 bg-[#ffffff] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#14161b]/[.09] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#14161b]/46 tracking-widest uppercase mb-1">Roster</p>
            <p className="text-sm font-black text-[#14161b]">Team Lineups</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-[#6d4fe0]/30 bg-[#6d4fe0]/10 px-2.5 py-1">
            <Star size={10} className="text-[#6d4fe0]" strokeWidth={2.5} />
            <span className="text-[10px] font-black text-[#6d4fe0]">PRO</span>
          </div>
        </div>
        <UpsellBanner tier="Pro — $14.99/mo" message="Full team lineups with stats unlock with Pro" href="/upgrade?tier=pro" color="#6d4fe0" />
      </div>
    );
  }

  function LineupCol({ batters, teamId, abbr, accentColor }: { batters: RosterBatter[]; teamId: number; abbr: string; accentColor: string }) {
    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#14161b]/[.09]">
          <PlayerImg src={teamLogoUrl(teamId)} alt={abbr} className="w-5 h-5 object-contain" />
          <p className="text-sm font-black text-[#14161b]">{abbr}</p>
        </div>
        <div className="divide-y divide-[#14161b]/[.09]">
          {batters.slice(0, 9).map((b, i) => (
            <motion.div
              key={b.id}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex items-center gap-2.5 px-4 py-2.5 group hover:bg-[#14161b]/[0.02] transition-colors"
            >
              <span className="text-[10px] font-black text-[#14161b]/38 w-4 shrink-0">{i + 1}</span>
              <div className="w-9 h-9 shrink-0 flex items-center justify-center">
                <Headshot
                  id={b.id}
                  name={b.fullName}
                  size={36}
                  maskStyle="radial-gradient(ellipse 82% 88% at 50% 26%, black 35%, transparent 100%)"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#14161b] truncate">{b.fullName}</p>
                <p className="text-[9px] text-[#14161b]/46">{b.position} · {b.stats.avg} AVG</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-black tabular-nums" style={{ color: accentColor }}>
                  {b.stats.ops}
                </p>
                <p className="text-[9px] text-[#14161b]/38">OPS</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.25 }}
      className="rounded-2xl border border-[#14161b]/[.09] bg-[#ffffff] overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-[#14161b]/[.09]">
        <p className="text-[10px] font-bold text-[#14161b]/46 tracking-widest uppercase mb-1">Roster</p>
        <p className="text-sm font-black text-[#14161b]">Expected Lineups</p>
        <p className="text-[10px] text-[#14161b]/46 mt-0.5">Sorted by season OPS — confirmed batting order may differ</p>
      </div>
      <div className="flex divide-x divide-[#14161b]/[.09]">
        <LineupCol batters={awayBatters} teamId={awayTeamId} abbr={awayAbbr} accentColor={awayColor} />
        <LineupCol batters={homeBatters} teamId={homeTeamId} abbr={homeAbbr} accentColor={homeColor} />
      </div>
    </motion.div>
  );
}
