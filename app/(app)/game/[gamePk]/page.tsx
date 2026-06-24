import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Zap } from "lucide-react";
import {
  fetchPitcherStats,
  fetchTeamBatters,
  fetchTeamLastGameHRHitters,
  getStadiumImageUrl,
  computeWinProbability,
  computeNRFI,
  fetchH2HHistory,
  fetchFirstInningScores,
  teamLogoUrl,
  TEAM_ABBR,
  TEAM_COLORS,
  type Game,
  type PitcherSeasonStats,
  type RosterBatter,
} from "@/lib/mlb/api";
import { PlayerImg } from "@/components/web-tool/player-img";
import { Headshot } from "@/components/web-tool/headshot";
import { GameTimeBadge } from "@/components/web-tool/game-time-badge";
import { GameHero } from "./game-client";
import {
  GatedPropList,
  GatedWinProb,
  NRFICard,
  GatedH2HHistory,
  GatedLineups,
} from "./gated-props";

export const dynamic = "force-dynamic";

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchGame(gamePk: number): Promise<Game | null> {
  try {
    const hydrate = "probablePitcher,linescore(teams),team";
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/schedule?gamePk=${gamePk}&hydrate=${hydrate}`,
      { cache: "no-store", signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data.dates ?? []).flatMap((d: any) => d.games ?? [])[0] ?? null;
  } catch {
    return null;
  }
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function StatBox({
  label,
  value,
  color = "#FF7828",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3 text-center">
      <p className="text-[9px] text-white/25 tracking-widest uppercase mb-1">{label}</p>
      <p className="text-sm font-black tabular-nums" style={{ color }}>
        {value}
      </p>
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
  const accentColor = TEAM_COLORS[teamId] ?? "#FF7828";
  const isRight = side === "home";

  if (!pitcher) {
    return (
      <div className={`flex flex-col items-center gap-3 flex-1 ${isRight ? "items-end" : "items-start"}`}>
        <div className="w-20 h-20 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
          <span className="text-white/20 text-2xl font-black">?</span>
        </div>
        <div className={isRight ? "text-right" : ""}>
          <p className="text-sm font-black text-white">TBD</p>
          <p className="text-[10px] text-white/30">{teamName.split(" ").pop()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 flex-1 ${isRight ? "items-end" : "items-start"}`}>
      {/* Headshot — client component handles onError, masked edges fade to card bg */}
      <div className="relative flex flex-col items-center">
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-15 scale-125 -z-10"
          style={{ background: accentColor }}
        />
        <Headshot id={pitcher.id} name={pitcher.fullName} size={96} variant="lg" />
        {/* Team logo badge */}
        <div
          className="absolute bottom-0 right-0 w-6 h-6 rounded-full overflow-hidden border bg-[#0D1320]"
          style={{ borderColor: `${accentColor}40` }}
        >
          <PlayerImg
            src={teamLogoUrl(teamId)}
            alt=""
            className="w-full h-full object-contain p-0.5"
          />
        </div>
      </div>

      <div className={isRight ? "text-right" : ""}>
        <p className="text-sm font-black text-white">{pitcher.fullName}</p>
        <p className="text-[10px] text-white/35">{teamName.split(" ").pop()}</p>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-1.5 w-full">
          <StatBox label="ERA"  value={stats.era.toFixed(2)}               color="#FF7828" />
          <StatBox label="WHIP" value={stats.whip.toFixed(2)}              color="#818cf8" />
          <StatBox label="K/9"  value={stats.strikeoutsPer9Inn.toFixed(1)} color="#50C882" />
          <StatBox label="W-L"  value={`${stats.wins}-${stats.losses}`}    color="#2dd4bf" />
        </div>
      )}
    </div>
  );
}

// ── Post-game prediction verdict ──────────────────────────────────────────────

function PredictionVerdict({
  winProb,
  awayTeamId,
  homeTeamId,
  awayScore,
  homeScore,
}: {
  winProb: { home: number; away: number };
  awayTeamId: number;
  homeTeamId: number;
  awayScore: number;
  homeScore: number;
}) {
  const awayAbbr = TEAM_ABBR[awayTeamId] ?? "Away";
  const homeAbbr = TEAM_ABBR[homeTeamId] ?? "Home";
  const predictedWinner = winProb.away > winProb.home ? "away" : "home";
  const actualWinner    = awayScore > homeScore ? "away" : "home";
  const correct = predictedWinner === actualWinner;

  const awayColor = TEAM_COLORS[awayTeamId] ?? "#818cf8";
  const homeColor = TEAM_COLORS[homeTeamId] ?? "#FF7828";
  const predictedColor = predictedWinner === "away" ? awayColor : homeColor;
  const predictedAbbr  = predictedWinner === "away" ? awayAbbr : homeAbbr;
  const predictedPct   = predictedWinner === "away" ? winProb.away : winProb.home;

  return (
    <div
      className="rounded-xl border px-4 py-3 flex items-center justify-between"
      style={{
        background: correct ? "#50C88210" : "#EB505A10",
        borderColor: correct ? "#50C88230" : "#EB505A30",
      }}
    >
      <div>
        <p className="text-[10px] text-white/30 tracking-widest uppercase mb-1">Model Prediction</p>
        <p className="text-sm font-black" style={{ color: predictedColor }}>
          {predictedAbbr} wins ({predictedPct}%)
        </p>
      </div>
      <div
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 border text-xs font-black"
        style={{
          background: correct ? "#50C88220" : "#EB505A20",
          borderColor: correct ? "#50C88240" : "#EB505A40",
          color: correct ? "#50C882" : "#EB505A",
        }}
      >
        {correct ? "✓ Correct" : "✗ Missed"}
      </div>
    </div>
  );
}

// ── Main content ──────────────────────────────────────────────────────────────

async function GameDetailContent({ game }: { game: Game }) {
  try {
    const away = game.teams.away;
    const home = game.teams.home;
    const isLive  = game.status.detailedState === "In Progress";
    const isFinal = ["Final", "Game Over"].includes(game.status.detailedState);
    const stadiumUrl = getStadiumImageUrl(game.venue.id);
    const awayColor = TEAM_COLORS[away.team.id] ?? "#818cf8";
    const homeColor = TEAM_COLORS[home.team.id] ?? "#FF7828";
    const awayAbbr = TEAM_ABBR[away.team.id] ?? away.team.name.split(" ").pop() ?? "";
    const homeAbbr = TEAM_ABBR[home.team.id] ?? home.team.name.split(" ").pop() ?? "";

    const [homePRes, awayPRes, homeBatRes, awayBatRes, h2hRes, firstInnRes, awayHRRes, homeHRRes] =
      await Promise.allSettled([
        home.probablePitcher ? fetchPitcherStats(home.probablePitcher.id) : Promise.resolve(null),
        away.probablePitcher ? fetchPitcherStats(away.probablePitcher.id) : Promise.resolve(null),
        fetchTeamBatters(home.team.id),
        fetchTeamBatters(away.team.id),
        fetchH2HHistory(away.team.id, home.team.id, 5),
        isFinal ? fetchFirstInningScores(game.gamePk) : Promise.resolve(null),
        fetchTeamLastGameHRHitters(away.team.id),
        fetchTeamLastGameHRHitters(home.team.id),
      ]);

    const homeP      = homePRes.status    === "fulfilled" ? homePRes.value    : null;
    const awayP      = awayPRes.status    === "fulfilled" ? awayPRes.value    : null;
    const homeBats   = homeBatRes.status  === "fulfilled" ? homeBatRes.value  : [];
    const awayBats   = awayBatRes.status  === "fulfilled" ? awayBatRes.value  : [];
    const h2hGames   = h2hRes.status      === "fulfilled" ? h2hRes.value      : [];
    const firstInn   = firstInnRes.status === "fulfilled" ? firstInnRes.value : null;
    const awayHRSet  = awayHRRes.status   === "fulfilled" ? awayHRRes.value   : new Set<number>();
    const homeHRSet  = homeHRRes.status   === "fulfilled" ? homeHRRes.value   : new Set<number>();
    const recentHRs  = new Set([...awayHRSet, ...homeHRSet]);

    const winProb = computeWinProbability(homeP, awayP);
    const nrfi    = computeNRFI(awayP, homeP);

    // ── Prop signal computation ──────────────────────────────────────────────

    function hrProb(b: RosterBatter, opp: PitcherSeasonStats | null): number {
      const ab  = Math.max(b.stats.atBats, 1);
      const era = opp?.era ?? 4.5;
      return Math.round(Math.min(35, Math.max(4, (b.stats.homeRuns / ab) * 100 * (era / 4.5) * 3.8)));
    }

    function hitProb(b: RosterBatter, opp: PitcherSeasonStats | null): number {
      const avg  = parseFloat(b.stats.avg) || 0.22;
      const adj  = 1.3 / Math.max(0.8, opp?.whip ?? 1.3);
      const aAvg = Math.min(0.38, Math.max(0.15, avg * adj));
      return Math.round((1 - Math.pow(1 - aAvg, 4)) * 100);
    }

    function toRow(b: RosterBatter, pct: number, label: string, pitcherName: string, teamId: number) {
      const hitHRLastGame = recentHRs.has(b.id);
      const isDue = !hitHRLastGame && b.stats.homeRuns >= 8;
      return {
        batterId:    b.id,
        batterName:  b.fullName,
        batterAvg:   b.stats.avg,
        batterHr:    b.stats.homeRuns,
        batterOps:   b.stats.ops,
        pct,
        label,
        pitcherName,
        teamId,
        position:    b.position,
        isHot:       hitHRLastGame,
        isDue,
      };
    }

    const hrRows = [
      ...awayBats.slice(0, 9).map((b) => toRow(b, hrProb(b, homeP), "HR Prob", home.probablePitcher?.fullName ?? "TBD", away.team.id)),
      ...homeBats.slice(0, 9).map((b) => toRow(b, hrProb(b, awayP), "HR Prob", away.probablePitcher?.fullName ?? "TBD", home.team.id)),
    ].sort((a, b) => b.pct - a.pct);

    // Balanced hit rows: take top 6 from each team, merge, then sort
    const awayHitTop = awayBats.slice(0, 9)
      .map((b) => toRow(b, hitProb(b, homeP), "Hit Prob", home.probablePitcher?.fullName ?? "TBD", away.team.id))
      .sort((a, b) => b.pct - a.pct).slice(0, 6);
    const homeHitTop = homeBats.slice(0, 9)
      .map((b) => toRow(b, hitProb(b, awayP), "Hit Prob", away.probablePitcher?.fullName ?? "TBD", home.team.id))
      .sort((a, b) => b.pct - a.pct).slice(0, 6);
    const hitRows = [...awayHitTop, ...homeHitTop].sort((a, b) => b.pct - a.pct);

    // Post-game scores
    const awayFinalScore = game.teams.away.score;
    const homeFinalScore = game.teams.home.score;

    return (
      <div className="min-h-screen bg-[#080C14]">
        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <GameHero game={game} stadiumUrl={stadiumUrl} />

        {/* ── Body ──────────────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">

          {/* Post-game win prediction accuracy */}
          {isFinal &&
            awayFinalScore !== undefined &&
            homeFinalScore !== undefined && (
              <PredictionVerdict
                winProb={winProb}
                awayTeamId={away.team.id}
                homeTeamId={home.team.id}
                awayScore={awayFinalScore}
                homeScore={homeFinalScore}
              />
            )}

          {/* ── Pitcher Duel + Win Prob ──────────────────────────────────── */}
          <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
            {/* Pitcher duel card */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#0D1320] p-6">
              <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-6 text-center">
                Starting Pitchers
              </p>
              <div className="flex items-start gap-5 justify-between">
                <PitcherCard
                  pitcher={away.probablePitcher}
                  stats={awayP}
                  teamName={away.team.name}
                  teamId={away.team.id}
                  side="away"
                />
                {/* VS divider */}
                <div className="flex flex-col items-center gap-2 pt-8 shrink-0">
                  <div className="w-px h-10 bg-white/[0.06]" />
                  <span className="text-white/10 font-black text-sm">VS</span>
                  <div className="w-px h-10 bg-white/[0.06]" />
                </div>
                <PitcherCard
                  pitcher={home.probablePitcher}
                  stats={homeP}
                  teamName={home.team.name}
                  teamId={home.team.id}
                  side="home"
                />
              </div>

              {/* NRFI preview inside pitcher card */}
              {(awayP || homeP) && (
                <div className="mt-5 pt-4 border-t border-white/[0.05] grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3 text-center">
                    <p className="text-[9px] text-white/25 tracking-widest uppercase mb-1">Away ERA</p>
                    <p className="text-lg font-black text-[#FF7828] tabular-nums">
                      {awayP?.era.toFixed(2) ?? "—"}
                    </p>
                    <p className="text-[9px] text-white/25">{awayP ? `${awayP.wins}W ${awayP.losses}L` : "TBD"}</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3 text-center">
                    <p className="text-[9px] text-white/25 tracking-widest uppercase mb-1">Home ERA</p>
                    <p className="text-lg font-black text-[#818cf8] tabular-nums">
                      {homeP?.era.toFixed(2) ?? "—"}
                    </p>
                    <p className="text-[9px] text-white/25">{homeP ? `${homeP.wins}W ${homeP.losses}L` : "TBD"}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Win probability */}
            <GatedWinProb
              homeProb={winProb.home}
              awayTeam={away.team.name}
              homeTeam={home.team.name}
              awayTeamId={away.team.id}
              homeTeamId={home.team.id}
            />
          </div>

          {/* ── NRFI ──────────────────────────────────────────────────────── */}
          <NRFICard
            nrfi={nrfi}
            isFinal={isFinal}
            firstInningScore={firstInn}
            awayAbbr={awayAbbr}
            homeAbbr={homeAbbr}
          />

          {/* ── H2H History ───────────────────────────────────────────────── */}
          <GatedH2HHistory
            games={h2hGames}
            currentAwayTeamId={away.team.id}
            currentHomeTeamId={home.team.id}
          />

          {/* ── HR Candidates (≥25%) ──────────────────────────────────────── */}
          <GatedPropList
            title="HR Candidates"
            subtitle={`Players with ≥25% HR probability today`}
            rows={hrRows}
            variant="cards"
            freeCount={4}
            threshold={20}
          />

          {/* ── Top Hitters (≥65%) ────────────────────────────────────────── */}
          <GatedPropList
            title="Most Likely to Hit"
            subtitle="Hitters with highest probability of getting on base"
            rows={hitRows}
            variant="list"
            freeCount={3}
            threshold={65}
          />

          {/* ── Team Lineups ───────────────────────────────────────────────── */}
          <GatedLineups
            awayBatters={awayBats}
            homeBatters={homeBats}
            awayTeamId={away.team.id}
            homeTeamId={home.team.id}
          />

          {/* ── Upsell cards ──────────────────────────────────────────────── */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/analysis" className="block group">
              <div className="rounded-2xl border border-[#FF7828]/20 bg-[#FF7828]/[0.04] p-5 hover:border-[#FF7828]/35 transition-all hover:bg-[#FF7828]/[0.07] h-full">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-[#FF7828]/15 flex items-center justify-center">
                    <Zap size={14} className="text-[#FF7828]" strokeWidth={2} />
                  </div>
                  <span className="text-[9px] font-black text-[#FF7828] tracking-widest uppercase">Fan — $4.99/mo</span>
                </div>
                <p className="text-sm font-black text-white mb-1">Edge Report</p>
                <p className="text-xs text-white/35">AI-ranked value plays, pitcher grades & strong picks across all games today</p>
              </div>
            </Link>
            <Link href="/hr-deep-dive" className="block group">
              <div className="rounded-2xl border border-[#818cf8]/20 bg-[#818cf8]/[0.04] p-5 hover:border-[#818cf8]/35 transition-all hover:bg-[#818cf8]/[0.07] h-full">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-[#818cf8]/15 flex items-center justify-center">
                    <RefreshCw size={14} className="text-[#818cf8]" strokeWidth={2} />
                  </div>
                  <span className="text-[9px] font-black text-[#818cf8] tracking-widest uppercase">Pro — $14.99/mo</span>
                </div>
                <p className="text-sm font-black text-white mb-1">HR Deep Dive</p>
                <p className="text-xs text-white/35">Spray charts, wall clearance, carry conditions & pitch-to-spray for all batters</p>
              </div>
            </Link>
          </div>

          <p className="text-xs text-white/15 text-center pb-4">
            Predictions are model estimates based on 2025 season stats. For educational purposes only.
          </p>
        </div>
      </div>
    );
  } catch {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#FF7828]/10 border border-[#FF7828]/20 flex items-center justify-center mb-5">
          <RefreshCw size={22} className="text-[#FF7828]" strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-black text-white mb-2">Game data unavailable</h1>
        <p className="text-sm text-white/40 mb-6 max-w-xs">Stats are loading or temporarily unavailable. Try refreshing.</p>
        <Link
          href="/games"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF7828]/15 border border-[#FF7828]/30 text-sm font-bold text-[#FF7828] hover:bg-[#FF7828]/25 transition-colors"
        >
          <ArrowLeft size={13} strokeWidth={2} />
          Back to Games
        </Link>
      </div>
    );
  }
}

// ── Page export ───────────────────────────────────────────────────────────────

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ gamePk: string }>;
}) {
  const { gamePk: gamePkStr } = await params;
  const gamePk = parseInt(gamePkStr, 10);

  const notFoundUI = (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/[0.10] flex items-center justify-center mb-5">
        <Zap size={22} className="text-white/30" strokeWidth={1.5} />
      </div>
      <h1 className="text-xl font-black text-white mb-2">Game not found</h1>
      <p className="text-sm text-white/40 mb-6 max-w-xs">This game may have been postponed or the link is outdated.</p>
      <Link
        href="/games"
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.10] text-sm font-bold text-white/70 hover:text-white transition-colors"
      >
        <ArrowLeft size={13} strokeWidth={2} />
        Back to Games
      </Link>
    </div>
  );

  if (isNaN(gamePk)) return notFoundUI;
  const game = await fetchGame(gamePk);
  if (!game) return notFoundUI;

  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-3 py-32 justify-center text-white/30">
          <RefreshCw size={18} className="animate-spin" strokeWidth={1.5} />
          <span className="text-sm">Loading game breakdown…</span>
        </div>
      }
    >
      <GameDetailContent game={game} />
    </Suspense>
  );
}
