import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Cloud, Wind, Thermometer, Droplets, RefreshCw, Zap, Star, TrendingUp } from "lucide-react";
import {
  fetchGamesByDate,
  fetchPitcherStats,
  fetchTeamBatters,
  fetchVenueWeather,
  getStadiumImageUrl,
  playerHeadshotUrl,
  computeWinProbability,
  teamLogoUrl,
  TEAM_ABBR,
  TEAM_COLORS,
  type Game,
  type PitcherSeasonStats,
  type RosterBatter,
} from "@/lib/mlb/api";
import { PlayerImg } from "@/components/web-tool/player-img";
import { GatedPropList, GatedWinProb } from "./gated-props";

export const dynamic = "force-dynamic";

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchGame(gamePk: number): Promise<Game | null> {
  try {
    const today  = new Date().toISOString().slice(0, 10);
    const dates  = [today, addDays(today, -1), addDays(today, 1)];
    for (const d of dates) {
      const games = await fetchGamesByDate(d);
      const found = games.find((g) => g.gamePk === gamePk);
      if (found) return found;
    }
    return null;
  } catch {
    return null;
  }
}

function addDays(date: string, n: number): string {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function StatBox({ label, value, color = "#FF7828" }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0D1117] p-3 text-center">
      <p className="text-[9px] text-white/25 tracking-widest uppercase mb-1">{label}</p>
      <p className="text-base font-black" style={{ color }}>{value}</p>
    </div>
  );
}

function PitcherCard({
  pitcher,
  stats,
  teamName,
  teamId,
  side,
}: {
  pitcher: { id: number; fullName: string } | undefined;
  stats: PitcherSeasonStats | null;
  teamName: string;
  teamId: number;
  side: "away" | "home";
}) {
  if (!pitcher) {
    return (
      <div className={`flex flex-col items-center gap-3 flex-1 ${side === "home" ? "items-end" : "items-start"}`}>
        <div className="w-16 h-16 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
          <span className="text-white/20 text-lg font-black">?</span>
        </div>
        <div className={side === "home" ? "text-right" : ""}>
          <p className="text-sm font-bold text-white">TBD</p>
          <p className="text-[10px] text-white/30">{teamName.split(" ").pop()}</p>
        </div>
      </div>
    );
  }
  return (
    <div className={`flex flex-col items-center gap-3 flex-1 ${side === "home" ? "items-end" : "items-start"}`}>
      <div className="relative">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/15 bg-white/5">
          <PlayerImg
            src={playerHeadshotUrl(pitcher.id)}
            alt={pitcher.fullName}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full overflow-hidden border border-[#0D1117]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={teamLogoUrl(teamId)} alt="" className="w-full h-full object-contain bg-white/5" />
        </div>
      </div>
      <div className={side === "home" ? "text-right" : ""}>
        <p className="text-sm font-black text-white">{pitcher.fullName}</p>
        <p className="text-[10px] text-white/30">{teamName.split(" ").pop()}</p>
      </div>
      {stats && (
        <div className={`grid grid-cols-4 gap-1.5 w-full`}>
          <StatBox label="ERA"  value={stats.era.toFixed(2)}                  color="#FF7828" />
          <StatBox label="WHIP" value={stats.whip.toFixed(2)}                 color="#818cf8" />
          <StatBox label="K/9"  value={stats.strikeoutsPer9Inn.toFixed(1)}    color="#50C882" />
          <StatBox label="W-L"  value={`${stats.wins}-${stats.losses}`}       color="#2dd4bf" />
        </div>
      )}
    </div>
  );
}

// WinProbBar replaced by GatedWinProb client component

function WeatherCard({ temp, wind, direction, conditions, humidity }: {
  temp: number; wind: number; direction: string; conditions: string; humidity: number;
}) {
  const windImpact = wind >= 12 ? (direction.includes("out") || direction === "S" || direction === "SW" ? "HR Boost" : "HR Suppress") : "Neutral";
  const windColor  = windImpact === "HR Boost" ? "#50C882" : windImpact === "HR Suppress" ? "#EB505A" : "rgba(255,255,255,0.35)";
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5">
      <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-4">Stadium Weather</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex flex-col gap-1 items-start">
          <Thermometer size={14} className="text-[#FF7828]" strokeWidth={1.5} />
          <p className="text-xl font-black text-white">{temp}°F</p>
          <p className="text-[10px] text-white/30">Temperature</p>
        </div>
        <div className="flex flex-col gap-1 items-start">
          <Wind size={14} className="text-[#818cf8]" strokeWidth={1.5} />
          <p className="text-xl font-black text-white">{wind} mph</p>
          <p className="text-[10px] text-white/30">{direction} wind</p>
        </div>
        <div className="flex flex-col gap-1 items-start">
          <Cloud size={14} className="text-[#2dd4bf]" strokeWidth={1.5} />
          <p className="text-base font-black text-white capitalize">{conditions}</p>
          <p className="text-[10px] text-white/30">Conditions</p>
        </div>
        <div className="flex flex-col gap-1 items-start">
          <Droplets size={14} className="text-[#60B4F0]" strokeWidth={1.5} />
          <p className="text-xl font-black text-white">{humidity}%</p>
          <p className="text-[10px] text-white/30">Humidity</p>
        </div>
      </div>
      {wind >= 8 && (
        <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center gap-2">
          <Wind size={11} strokeWidth={2} style={{ color: windColor }} />
          <p className="text-[11px]" style={{ color: windColor }}>
            {wind}mph {direction} — {windImpact}
          </p>
        </div>
      )}
    </div>
  );
}

// PropRow moved to gated-props.tsx as GatedPropList

// ── Main content ──────────────────────────────────────────────────────────────

async function GameDetailContent({ gamePk }: { gamePk: number }) {
  const game = await fetchGame(gamePk);
  if (!game) notFound();

  const away = game.teams.away;
  const home = game.teams.home;
  const isLive  = game.status.detailedState === "In Progress";
  const isFinal = ["Final", "Game Over"].includes(game.status.detailedState);
  const stadiumUrl = getStadiumImageUrl(game.venue.id);
  const awayColor = TEAM_COLORS[away.team.id] ?? "#818cf8";
  const homeColor = TEAM_COLORS[home.team.id] ?? "#FF7828";

  const [homePStats, awayPStats, homeBatters, awayBatters, weather] = await Promise.allSettled([
    home.probablePitcher ? fetchPitcherStats(home.probablePitcher.id) : Promise.resolve(null),
    away.probablePitcher ? fetchPitcherStats(away.probablePitcher.id) : Promise.resolve(null),
    fetchTeamBatters(home.team.id),
    fetchTeamBatters(away.team.id),
    fetchVenueWeather(game.venue.id),
  ]);

  const homeP = homePStats.status === "fulfilled" ? homePStats.value : null;
  const awayP = awayPStats.status === "fulfilled" ? awayPStats.value : null;
  const homeBats = homeBatters.status === "fulfilled" ? homeBatters.value : [];
  const awayBats = awayBatters.status === "fulfilled" ? awayBatters.value : [];
  const wx = weather.status === "fulfilled" ? weather.value : null;

  const winProb = computeWinProbability(homeP, awayP);

  // Build prop signals (free — based on batter avg vs pitcher)
  function hrProb(b: RosterBatter, pitcher: PitcherSeasonStats | null): number {
    const ab  = Math.max(b.stats.atBats, 1);
    const era = pitcher?.era ?? 4.5;
    return Math.round(Math.min(30, Math.max(4, (b.stats.homeRuns / ab) * 100 * (era / 4.5) * 3.8)));
  }
  function hitProb(b: RosterBatter, pitcher: PitcherSeasonStats | null): number {
    const avg  = parseFloat(b.stats.avg) || 0.22;
    const adj  = 1.3 / Math.max(0.8, pitcher?.whip ?? 1.3);
    const aAvg = Math.min(0.38, Math.max(0.15, avg * adj));
    return Math.round((1 - Math.pow(1 - aAvg, 4)) * 100);
  }

  function toRowData(b: RosterBatter, pct: number, label: string, pitcherName: string) {
    return {
      batterId:    b.id,
      batterName:  b.fullName,
      batterAvg:   b.stats.avg,
      batterHr:    b.stats.homeRuns,
      pct,
      label,
      pitcherName,
    };
  }

  const hrRows = [
    ...awayBats.slice(0, 9).map((b) => toRowData(b, hrProb(b, homeP), "HR Prob", home.probablePitcher?.fullName ?? "TBD")),
    ...homeBats.slice(0, 9).map((b) => toRowData(b, hrProb(b, awayP), "HR Prob", away.probablePitcher?.fullName ?? "TBD")),
  ].sort((a, b) => b.pct - a.pct).slice(0, 10);

  const hitRows = [
    ...awayBats.slice(0, 9).map((b) => toRowData(b, hitProb(b, homeP), "Hit Prob", home.probablePitcher?.fullName ?? "TBD")),
    ...homeBats.slice(0, 9).map((b) => toRowData(b, hitProb(b, awayP), "Hit Prob", away.probablePitcher?.fullName ?? "TBD")),
  ].sort((a, b) => b.pct - a.pct).slice(0, 10);

  const gameTime = isLive ? "LIVE" : isFinal ? "Final" :
    new Date(game.gameDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-background">
      {/* Stadium hero */}
      <div className="relative h-[260px] sm:h-[320px] overflow-hidden">
        {stadiumUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={stadiumUrl} alt={game.venue.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${awayColor}40, ${homeColor}40)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/50 to-black/30" />

        {/* Back nav */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <Link href="/games" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5">
            <ArrowLeft size={14} strokeWidth={2} />
            Games
          </Link>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border backdrop-blur-sm ${
            isLive
              ? "bg-red-500/20 border-red-500/30 text-red-400"
              : isFinal
              ? "bg-white/10 border-white/15 text-white/50"
              : "bg-[#FF7828]/20 border-[#FF7828]/30 text-[#FF7828]"
          }`}>
            {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse mr-1.5" />}
            {gameTime}
          </span>
        </div>

        {/* Teams overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 flex items-end justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={teamLogoUrl(away.team.id)} alt="" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-white font-black text-xl">{TEAM_ABBR[away.team.id] ?? away.team.name.split(" ").pop()}</p>
              <p className="text-white/40 text-xs">{away.probablePitcher?.fullName ?? "TBD"}</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-white/30 text-sm font-black">@</p>
            <p className="text-xs text-white/20 mt-1">{game.venue.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-white font-black text-xl">{TEAM_ABBR[home.team.id] ?? home.team.name.split(" ").pop()}</p>
              <p className="text-white/40 text-xs">{home.probablePitcher?.fullName ?? "TBD"}</p>
            </div>
            <div className="w-12 h-12">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={teamLogoUrl(home.team.id)} alt="" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8 space-y-5">
        {/* ── Pitcher duel ───────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5">
          <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-5 text-center">Starting Pitchers</p>
          <div className="flex items-start gap-4 justify-between">
            <PitcherCard pitcher={away.probablePitcher} stats={awayP} teamName={away.team.name} teamId={away.team.id} side="away" />
            <div className="flex flex-col items-center gap-1 pt-10 shrink-0">
              <span className="text-white/15 font-black text-lg">VS</span>
            </div>
            <PitcherCard pitcher={home.probablePitcher} stats={homeP} teamName={home.team.name} teamId={home.team.id} side="home" />
          </div>
        </div>

        {/* ── Win probability — FAN tier ─────────────────────────────────── */}
        <GatedWinProb homeProb={winProb.home} awayTeam={away.team.name} homeTeam={home.team.name} />

        {/* ── Weather (FREE) ──────────────────────────────────────────────── */}
        {wx ? (
          <WeatherCard
            temp={wx.tempF}
            wind={wx.windMph}
            direction={wx.windDirection}
            conditions={wx.conditions}
            humidity={wx.humidity}
          />
        ) : (
          <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5 flex items-center gap-3">
            <Cloud size={18} className="text-white/20" strokeWidth={1.5} />
            <p className="text-sm text-white/30">Weather unavailable — add <code className="text-white/50 bg-white/[0.06] px-1 rounded">OPENWEATHER_API_KEY</code> to enable</p>
          </div>
        )}

        {/* ── Prop signals — 2 free, rest gated behind FAN ───────────────── */}
        <GatedPropList title="Top HR Candidates" rows={hrRows} freeCount={2} />
        <GatedPropList title="Most Likely to Get a Hit" rows={hitRows} freeCount={2} />

        {/* ── Fan / Pro upsell cards ──────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/analysis" className="block group">
            <div className="rounded-2xl border border-[#FF7828]/20 bg-[#FF7828]/[0.04] p-5 hover:border-[#FF7828]/35 transition-colors h-full">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-[#FF7828]/15 flex items-center justify-center">
                  <Zap size={14} className="text-[#FF7828]" strokeWidth={2} />
                </div>
                <span className="text-[9px] font-black text-[#FF7828] tracking-widest uppercase">Fan — $4.99/mo</span>
              </div>
              <p className="text-sm font-black text-white mb-1">Edge Report</p>
              <p className="text-xs text-white/35">AI-ranked value bets, pitcher grades & today&apos;s strong picks across all games</p>
            </div>
          </Link>
          <Link href="/hr-deep-dive" className="block group">
            <div className="rounded-2xl border border-[#818cf8]/20 bg-[#818cf8]/[0.04] p-5 hover:border-[#818cf8]/35 transition-colors h-full">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-[#818cf8]/15 flex items-center justify-center">
                  <Star size={14} className="text-[#818cf8]" strokeWidth={2} />
                </div>
                <span className="text-[9px] font-black text-[#818cf8] tracking-widest uppercase">Pro — $14.99/mo</span>
              </div>
              <p className="text-sm font-black text-white mb-1">HR Deep Dive</p>
              <p className="text-xs text-white/35">Spray charts, wall clearance, carry conditions & pitch→spray for all batters</p>
            </div>
          </Link>
        </div>

        <p className="text-xs text-white/15 text-center pb-4">
          Win probability and prop signals are model estimates based on 2025 season stats. For educational use only.
        </p>
      </div>
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────

// Next.js 15: params is a Promise
export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ gamePk: string }>;
}) {
  const { gamePk: gamePkStr } = await params;
  const gamePk = parseInt(gamePkStr, 10);
  if (isNaN(gamePk)) notFound();

  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-3 py-32 justify-center text-white/30">
          <RefreshCw size={18} className="animate-spin" strokeWidth={1.5} />
          <span className="text-sm">Loading game data…</span>
        </div>
      }
    >
      <GameDetailContent gamePk={gamePk} />
    </Suspense>
  );
}
