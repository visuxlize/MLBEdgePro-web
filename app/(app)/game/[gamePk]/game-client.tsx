"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PlayerImg } from "@/components/web-tool/player-img";
import { GameTimeBadge } from "@/components/web-tool/game-time-badge";
import { teamLogoUrl, TEAM_ABBR, TEAM_COLORS, getScore } from "@/lib/mlb/api";
import type { Game } from "@/lib/mlb/api";

interface GameHeroProps {
  game: Game;
  stadiumUrl: string;
}

export function GameHero({ game, stadiumUrl }: GameHeroProps) {
  const away = game.teams.away;
  const home = game.teams.home;
  const isLive  = game.status.detailedState === "In Progress";
  const isFinal = ["Final", "Game Over"].includes(game.status.detailedState);

  const awayScore = getScore(away, game.linescore, "away");
  const homeScore = getScore(home, game.linescore, "home");
  const inning      = game.linescore?.currentInningOrdinal ?? "";
  const inningState = game.linescore?.inningState ?? "";

  const awayAbbr = TEAM_ABBR[away.team.id] ?? away.team.name.split(" ").pop() ?? "";
  const homeAbbr = TEAM_ABBR[home.team.id] ?? home.team.name.split(" ").pop() ?? "";
  const awayColor = TEAM_COLORS[away.team.id] ?? "#818cf8";
  const homeColor = TEAM_COLORS[home.team.id] ?? "#FF7828";

  const showScore = (isLive || isFinal) && awayScore !== undefined && homeScore !== undefined;

  return (
    <div className="relative h-[340px] sm:h-[440px] overflow-hidden">
      {stadiumUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={stadiumUrl}
          alt={game.venue.name}
          className="absolute inset-0 w-full h-full object-cover scale-[1.04]"
          style={{ filter: "saturate(1.15) brightness(0.55)" }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${awayColor}80, ${homeColor}80)` }}
        />
      )}

      {/* Gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#080C14] via-[#080C14]/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#080C14]/70 via-transparent to-[#080C14]/70" />

      {/* Team color glow — bottom corners */}
      <div
        className="absolute -bottom-10 -left-10 w-72 h-40 rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: awayColor }}
      />
      <div
        className="absolute -bottom-10 -right-10 w-72 h-40 rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: homeColor }}
      />

      {/* Top nav */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
        <Link
          href="/games"
          className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors bg-black/40 backdrop-blur-md rounded-full px-3.5 py-2 border border-white/[0.12]"
        >
          <ArrowLeft size={13} strokeWidth={2.5} />
          <span className="font-semibold">Games</span>
        </Link>
        <GameTimeBadge gameDate={game.gameDate} isLive={isLive} isFinal={isFinal} />
      </div>

      {/* Main content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 gap-3">
        {showScore ? (
          /* Live / Final score display */
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-6 sm:gap-12"
          >
            {/* Away */}
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="w-14 h-14 sm:w-20 sm:h-20"
              >
                <PlayerImg
                  src={teamLogoUrl(away.team.id)}
                  alt={awayAbbr}
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              </motion.div>
              <span className="text-white/60 text-sm font-black tracking-wide">{awayAbbr}</span>
            </div>

            {/* Score */}
            <div className="flex items-center gap-4 sm:gap-7">
              <span
                className="text-6xl sm:text-8xl font-black text-white tabular-nums leading-none"
                style={{ textShadow: `0 0 40px ${awayColor}70` }}
              >
                {awayScore}
              </span>

              <div className="flex flex-col items-center gap-1 min-w-[40px]">
                {isLive ? (
                  <>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{inningState}</span>
                    <span className="text-base font-black text-[#FF7828]">{inning}</span>
                    <div className="w-2 h-2 rounded-full bg-red-400 animate-ping mt-0.5" />
                  </>
                ) : (
                  <span className="text-[10px] font-black text-white/25 tracking-widest uppercase">Final</span>
                )}
              </div>

              <span
                className="text-6xl sm:text-8xl font-black text-white tabular-nums leading-none"
                style={{ textShadow: `0 0 40px ${homeColor}70` }}
              >
                {homeScore}
              </span>
            </div>

            {/* Home */}
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="w-14 h-14 sm:w-20 sm:h-20"
              >
                <PlayerImg
                  src={teamLogoUrl(home.team.id)}
                  alt={homeAbbr}
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              </motion.div>
              <span className="text-white/60 text-sm font-black tracking-wide">{homeAbbr}</span>
            </div>
          </motion.div>
        ) : (
          /* Upcoming matchup */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-5 sm:gap-12"
          >
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-20 h-20 sm:w-28 sm:h-28 rounded-full flex items-center justify-center"
                style={{ background: `radial-gradient(circle, ${awayColor}25 0%, transparent 70%)` }}
              >
                <PlayerImg
                  src={teamLogoUrl(away.team.id)}
                  alt={awayAbbr}
                  className="w-16 h-16 sm:w-22 sm:h-22 object-contain drop-shadow-2xl"
                />
              </div>
              <span className="text-white font-black text-2xl sm:text-4xl tracking-tight font-display">{awayAbbr}</span>
              <span className="text-white/35 text-xs text-center max-w-[90px]">
                {away.probablePitcher?.fullName ?? "TBD"}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <span className="text-white/15 text-2xl font-black">@</span>
              <span className="text-white/15 text-[10px] text-center">{game.venue.name}</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div
                className="w-20 h-20 sm:w-28 sm:h-28 rounded-full flex items-center justify-center"
                style={{ background: `radial-gradient(circle, ${homeColor}25 0%, transparent 70%)` }}
              >
                <PlayerImg
                  src={teamLogoUrl(home.team.id)}
                  alt={homeAbbr}
                  className="w-16 h-16 sm:w-22 sm:h-22 object-contain drop-shadow-2xl"
                />
              </div>
              <span className="text-white font-black text-2xl sm:text-4xl tracking-tight font-display">{homeAbbr}</span>
              <span className="text-white/35 text-xs text-center max-w-[90px]">
                {home.probablePitcher?.fullName ?? "TBD"}
              </span>
            </div>
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-white/20 text-xs"
        >
          {game.venue.name}
        </motion.p>
      </div>
    </div>
  );
}
