"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import {
  fetchGamesByDate, gameStatusLabel, getStadiumImageUrl,
  getScore, playerHeadshotUrl, teamLogoDarkUrl,
  TEAM_ABBR, TEAM_COLORS, type Game,
} from "@/lib/mlb/api";
import { TeamLogoImg } from "@/components/web-tool/team-logo-img";

function todayStr()           { return new Date().toISOString().slice(0, 10); }
function addDays(d: string, n: number) {
  const dt = new Date(d + "T12:00:00"); dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
}
function labelFor(d: string) {
  const today = todayStr();
  if (d === today)              return "Today";
  if (d === addDays(today, -1)) return "Yesterday";
  if (d === addDays(today,  1)) return "Tomorrow";
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function ScoreCard({ game }: { game: Game }) {
  const away    = game.teams.away;
  const home    = game.teams.home;
  const status  = gameStatusLabel(game);
  const isLive  = game.status.detailedState === "In Progress";
  const isFinal = ["Final", "Game Over"].includes(game.status.detailedState);
  const awayScore = getScore(away, game.linescore, "away");
  const homeScore = getScore(home, game.linescore, "home");
  const awayWin   = isFinal && awayScore !== undefined && homeScore !== undefined && awayScore > homeScore;
  const homeWin   = isFinal && awayScore !== undefined && homeScore !== undefined && homeScore > awayScore;
  const stadiumUrl = getStadiumImageUrl(game.venue.id);

  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-[#111622] overflow-hidden hover:border-white/[0.12] transition-colors"
    >
      {/* Stadium strip */}
      <div className="w-2 self-stretch shrink-0"
        style={{ background: isLive ? "#EF4444" : isFinal ? "rgba(255,255,255,0.06)" : "rgba(255,120,40,0.35)" }} />

      <div className="flex-1 flex items-center gap-3 sm:gap-5 py-4 pr-4">
        {/* Status */}
        <div className="w-14 sm:w-20 shrink-0 text-center">
          {isLive && (
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />
              <span className="text-[9px] font-bold text-red-400 uppercase tracking-wide">Live</span>
            </div>
          )}
          <p className={`text-[10px] sm:text-xs font-bold ${isLive ? "text-red-400" : isFinal ? "text-white/30" : "text-[#FF7828]"}`}>
            {status}
          </p>
        </div>

        {/* Away team */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="shrink-0 w-8 h-8"><TeamLogoImg teamId={away.team.id} name={away.team.name} size={32} /></div>
          <div className="min-w-0">
            <p className={`font-bold truncate ${awayWin ? "text-white text-base" : isFinal ? "text-white/50 text-sm" : "text-white text-sm sm:text-base"}`}>
              {away.team.name.split(" ").pop()}
            </p>
            {away.probablePitcher && (
              <p className="text-[10px] text-white/25 truncate">{away.probablePitcher.fullName.split(" ").pop()}</p>
            )}
          </div>
        </div>

        {/* Scores */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {awayScore !== undefined ? (
            <span className={`text-2xl sm:text-3xl font-black tabular-nums ${awayWin ? "text-white" : "text-white/45"}`}>
              {awayScore}
            </span>
          ) : (
            <span className="text-white/15 text-sm font-medium">—</span>
          )}
          <span className="text-white/12 text-sm">—</span>
          {homeScore !== undefined ? (
            <span className={`text-2xl sm:text-3xl font-black tabular-nums ${homeWin ? "text-white" : "text-white/45"}`}>
              {homeScore}
            </span>
          ) : (
            <span className="text-white/15 text-sm font-medium">—</span>
          )}
        </div>

        {/* Home team */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
          <div className="min-w-0 text-right">
            <p className={`font-bold truncate ${homeWin ? "text-white text-base" : isFinal ? "text-white/50 text-sm" : "text-white text-sm sm:text-base"}`}>
              {home.team.name.split(" ").pop()}
            </p>
            {home.probablePitcher && (
              <p className="text-[10px] text-white/25 truncate">{home.probablePitcher.fullName.split(" ").pop()}</p>
            )}
          </div>
          <div className="shrink-0 w-8 h-8"><TeamLogoImg teamId={home.team.id} name={home.team.name} size={32} /></div>
        </div>

        {/* Venue */}
        <p className="text-[10px] text-white/18 hidden lg:block w-32 shrink-0 text-right truncate">{game.venue.name}</p>
      </div>
    </motion.div>
  );
}

export default function ScoresPage() {
  const [date, setDate]   = useState(todayStr());
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchGamesByDate(date)
      .then((all) => setGames(all.filter((g) => g.status.abstractGameState !== "Preview")))
      .catch(() => setGames([]))
      .finally(() => setLoading(false));
  }, [date]);

  const live  = games.filter((g) => g.status.detailedState === "In Progress");
  const final = games.filter((g) => ["Final","Game Over"].includes(g.status.detailedState));

  return (
    <div className="px-5 sm:px-8 py-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-1">Today</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Live Scores</h1>
        <p className="text-sm text-white/35 mt-1">Live games and final results for {labelFor(date)}</p>
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => setDate(addDays(date, -1))} className="w-8 h-8 rounded-xl flex items-center justify-center text-white/35 hover:text-white hover:bg-white/[0.07] transition-colors">
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
        <h2 className="text-lg font-bold text-white">{labelFor(date)}</h2>
        <button onClick={() => setDate(addDays(date, 1))} className="w-8 h-8 rounded-xl flex items-center justify-center text-white/35 hover:text-white hover:bg-white/[0.07] transition-colors">
          <ChevronRight size={16} strokeWidth={2} />
        </button>
        {date !== todayStr() && (
          <button onClick={() => setDate(todayStr())} className="text-xs font-bold text-[#FF7828] hover:text-[#FFA550] transition-colors">
            Today
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 py-20 text-white/25">
            <RefreshCw size={18} className="animate-spin" strokeWidth={1.5} />
            <span className="text-sm">Loading scores…</span>
          </motion.div>
        ) : games.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center py-24">
            <p className="text-white/35">No scores available for {labelFor(date)}</p>
          </motion.div>
        ) : (
          <motion.div key={date} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="space-y-6">
            {live.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-red-400/70 tracking-widest uppercase mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  Live Now — {live.length}
                </p>
                <div className="space-y-2">
                  {live.map((g) => <ScoreCard key={g.gamePk} game={g} />)}
                </div>
              </div>
            )}
            {final.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-3">
                  Final — {final.length}
                </p>
                <div className="space-y-2">
                  {final.map((g) => <ScoreCard key={g.gamePk} game={g} />)}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
