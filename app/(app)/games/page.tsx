"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, RefreshCw, Cloud,
  Wind, Thermometer, CircleDot,
} from "lucide-react";
import {
  fetchGamesByDate, gameStatusLabel, getStadiumImageUrl,
  getScore, playerHeadshotUrl, teamLogoDarkUrl, teamLogoUrl,
  TEAM_ABBR, TEAM_COLORS, type Game,
} from "@/lib/mlb/api";
import { TeamLogoImg } from "@/components/web-tool/team-logo-img";

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().slice(0, 10); }
function addDays(d: string, n: number) {
  const dt = new Date(d + "T12:00:00"); dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
}
function labelFor(d: string) {
  const dt = new Date(d + "T12:00:00");
  const today = todayStr();
  if (d === today) return "Today";
  const yest = addDays(today, -1); if (d === yest) return "Yesterday";
  const tom  = addDays(today,  1); if (d === tom)  return "Tomorrow";
  return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// ── Date picker ───────────────────────────────────────────────────────────────

function DatePicker({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  const isToday = date === todayStr();
  // Build 7-day strip centered on selected date
  const days = Array.from({ length: 7 }, (_, i) => addDays(date, i - 3));

  return (
    <div className="flex items-center gap-2 mb-6 sm:mb-8">
      <button
        onClick={() => onChange(addDays(date, -1))}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-white/35 hover:text-white hover:bg-white/[0.07] transition-colors shrink-0"
      >
        <ChevronLeft size={16} strokeWidth={2} />
      </button>

      <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar flex-1">
        {days.map((d) => {
          const active = d === date;
          const dt = new Date(d + "T12:00:00");
          const dayName = dt.toLocaleDateString("en-US", { weekday: "short" });
          const dayNum  = dt.getDate();
          return (
            <button
              key={d}
              onClick={() => onChange(d)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs shrink-0 transition-colors ${
                active
                  ? "bg-[#FF7828] text-white font-bold"
                  : "text-white/35 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <span className="font-semibold uppercase">{dayName}</span>
              <span className={`text-base font-black leading-tight ${active ? "text-white" : ""}`}>{dayNum}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onChange(addDays(date, 1))}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-white/35 hover:text-white hover:bg-white/[0.07] transition-colors shrink-0"
      >
        <ChevronRight size={16} strokeWidth={2} />
      </button>

      {!isToday && (
        <button
          onClick={() => onChange(todayStr())}
          className="text-xs font-bold text-[#FF7828] hover:text-[#FFA550] transition-colors shrink-0 ml-1"
        >
          Today
        </button>
      )}
    </div>
  );
}

// ── Featured game card (stadium hero) ─────────────────────────────────────────

function FeaturedGameCard({ game }: { game: Game }) {
  const away    = game.teams.away;
  const home    = game.teams.home;
  const status  = gameStatusLabel(game);
  const isLive  = game.status.detailedState === "In Progress";
  const isFinal = ["Final", "Game Over"].includes(game.status.detailedState);
  const awayScore = getScore(away, game.linescore, "away");
  const homeScore = getScore(home, game.linescore, "home");
  const stadiumUrl = getStadiumImageUrl(game.venue.id);
  const awayColor = TEAM_COLORS[away.team.id] ?? "#FF7828";
  const homeColor = TEAM_COLORS[home.team.id] ?? "#818cf8";

  return (
    <div className="relative rounded-2xl overflow-hidden mb-8 group cursor-pointer h-[280px] sm:h-[320px]">
      {/* Stadium image */}
      {stadiumUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={stadiumUrl}
          alt={game.venue.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${awayColor}40, ${homeColor}40)` }}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

      {/* Live badge + venue */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <span className="text-[10px] font-bold text-white/50 tracking-widest uppercase">{game.venue.name}</span>
        <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${
          isLive
            ? "bg-red-500/20 border-red-500/30 text-red-400"
            : isFinal
            ? "bg-white/8 border-white/10 text-white/40"
            : "bg-[#FF7828]/15 border-[#FF7828]/30 text-[#FF7828]"
        }`}>
          {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
          {status}
        </span>
      </div>

      {/* Teams */}
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 flex items-end gap-6">
        {/* Away */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="w-14 h-14 sm:w-16 sm:h-16">
            <TeamLogoImg teamId={away.team.id} name={away.team.name} size={64} />
          </div>
          <div className="text-center">
            <p className="text-white font-black text-lg sm:text-xl">{TEAM_ABBR[away.team.id] ?? away.team.name.split(" ").pop()}</p>
            {away.probablePitcher && (
              <p className="text-white/35 text-[10px] mt-0.5">{away.probablePitcher.fullName.split(" ").pop()}</p>
            )}
          </div>
          {(isLive || isFinal) && awayScore !== undefined && (
            <p className="text-white text-3xl font-black">{awayScore}</p>
          )}
        </div>

        {/* Center */}
        <div className="flex flex-col items-center pb-2">
          {!isLive && !isFinal && (
            <p className="text-white/25 text-xs font-semibold mb-1">
              {new Date(game.gameDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          )}
          <p className="text-white/50 font-black text-sm">VS</p>
        </div>

        {/* Home */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="w-14 h-14 sm:w-16 sm:h-16">
            <TeamLogoImg teamId={home.team.id} name={home.team.name} size={64} />
          </div>
          <div className="text-center">
            <p className="text-white font-black text-lg sm:text-xl">{TEAM_ABBR[home.team.id] ?? home.team.name.split(" ").pop()}</p>
            {home.probablePitcher && (
              <p className="text-white/35 text-[10px] mt-0.5">{home.probablePitcher.fullName.split(" ").pop()}</p>
            )}
          </div>
          {(isLive || isFinal) && homeScore !== undefined && (
            <p className="text-white text-3xl font-black">{homeScore}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Pitcher headshot row ──────────────────────────────────────────────────────

function PitcherRow({ pitcherId, name, side }: { pitcherId?: number; name?: string; side: "away" | "home" }) {
  if (!name) return <span className="text-white/20 text-[10px]">TBD</span>;
  return (
    <div className={`flex items-center gap-1.5 ${side === "home" ? "flex-row-reverse" : ""}`}>
      {pitcherId && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={playerHeadshotUrl(pitcherId)}
          alt={name}
          className="w-7 h-7 rounded-full object-cover bg-white/5 border border-white/10"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      )}
      <span className="text-[11px] text-white/45 font-medium">{name.split(" ").pop()}</span>
    </div>
  );
}

// ── Standard game card ────────────────────────────────────────────────────────

function GameCard({ game }: { game: Game }) {
  const away    = game.teams.away;
  const home    = game.teams.home;
  const status  = gameStatusLabel(game);
  const isLive  = game.status.detailedState === "In Progress";
  const isFinal = ["Final", "Game Over"].includes(game.status.detailedState);
  const awayScore = getScore(away, game.linescore, "away");
  const homeScore = getScore(home, game.linescore, "home");
  const stadiumUrl = getStadiumImageUrl(game.venue.id);
  const awayColor = TEAM_COLORS[away.team.id] ?? "#333";
  const homeColor = TEAM_COLORS[home.team.id] ?? "#333";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-white/[0.07] bg-[#111622] overflow-hidden hover:border-white/[0.14] transition-colors"
    >
      {/* Stadium mini-banner */}
      <div className="relative h-16 overflow-hidden">
        {stadiumUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={stadiumUrl} alt="" className="w-full h-full object-cover object-top opacity-40" />
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${awayColor}20, ${homeColor}20)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111622] to-transparent" />
        <div className="absolute top-2 left-3 right-3 flex items-center justify-between">
          <span className="text-[9px] text-white/30 font-semibold uppercase tracking-wider truncate mr-2">{game.venue.name}</span>
          <span className={`text-[9px] font-bold tracking-wide px-2 py-0.5 rounded-full shrink-0 ${
            isLive ? "bg-red-500/20 text-red-400" : isFinal ? "bg-white/5 text-white/30" : "bg-[#FF7828]/15 text-[#FF7828]"
          }`}>
            {isLive && <span className="inline-block w-1 h-1 rounded-full bg-red-400 animate-pulse mr-1" />}
            {status}
          </span>
        </div>
      </div>

      {/* Teams */}
      <div className="px-4 pb-4 pt-1">
        <div className="flex items-center justify-between">
          {/* Away */}
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <div className="w-10 h-10"><TeamLogoImg teamId={away.team.id} name={away.team.name} size={40} /></div>
            <p className="text-sm font-black text-white">{TEAM_ABBR[away.team.id] ?? away.team.name.split(" ").pop()}</p>
            <PitcherRow pitcherId={away.probablePitcher?.id} name={away.probablePitcher?.fullName} side="away" />
            {(isLive || isFinal) && awayScore !== undefined && (
              <p className="text-xl font-black text-white mt-1">{awayScore}</p>
            )}
          </div>

          <span className="text-white/15 font-black text-xs mb-4">VS</span>

          {/* Home */}
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <div className="w-10 h-10"><TeamLogoImg teamId={home.team.id} name={home.team.name} size={40} /></div>
            <p className="text-sm font-black text-white">{TEAM_ABBR[home.team.id] ?? home.team.name.split(" ").pop()}</p>
            <PitcherRow pitcherId={home.probablePitcher?.id} name={home.probablePitcher?.fullName} side="home" />
            {(isLive || isFinal) && homeScore !== undefined && (
              <p className="text-xl font-black text-white mt-1">{homeScore}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────

function StatsBar({ games, date }: { games: Game[]; date: string }) {
  const live     = games.filter((g) => g.status.detailedState === "In Progress").length;
  const final    = games.filter((g) => ["Final","Game Over"].includes(g.status.detailedState)).length;
  const upcoming = games.filter((g) => g.status.abstractGameState === "Preview").length;

  return (
    <div className="flex items-center gap-5 mb-6 text-sm">
      <span className="text-white/25">{games.length} games</span>
      {live > 0     && <span className="flex items-center gap-1.5 text-red-400 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />{live} live</span>}
      {upcoming > 0 && <span className="text-white/35">{upcoming} upcoming</span>}
      {final > 0    && <span className="text-white/25">{final} final</span>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GamesPage() {
  const [date, setDate]   = useState(todayStr());
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchGamesByDate(date)
      .then(setGames)
      .catch(() => setGames([]))
      .finally(() => setLoading(false));
  }, [date]);

  const live     = games.filter((g) => g.status.detailedState === "In Progress");
  const upcoming = games.filter((g) => g.status.abstractGameState === "Preview");
  const final    = games.filter((g) => ["Final","Game Over"].includes(g.status.detailedState));

  // Pick featured game: first live, else first upcoming, else first final
  const featured = live[0] ?? upcoming[0] ?? final[0];
  const rest = games.filter((g) => g.gamePk !== featured?.gamePk);

  return (
    <div className="px-5 sm:px-8 py-6 max-w-screen-xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-1">Schedule</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          {labelFor(date)}
          {date === todayStr() && (
            <span className="ml-3 text-base font-normal text-white/30">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </span>
          )}
        </h1>
      </div>

      {/* Date picker */}
      <DatePicker date={date} onChange={setDate} />

      {/* Loading */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 py-20 text-white/25">
            <RefreshCw size={18} className="animate-spin" strokeWidth={1.5} />
            <span className="text-sm">Loading games…</span>
          </motion.div>
        ) : games.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center py-24 text-center">
            <CircleDot size={44} className="text-white/10 mb-4" strokeWidth={1.2} />
            <p className="text-white/35">No games scheduled for {labelFor(date)}</p>
          </motion.div>
        ) : (
          <motion.div key={date} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {/* Stats bar */}
            <StatsBar games={games} date={date} />

            {/* Featured game */}
            {featured && <FeaturedGameCard game={featured} />}

            {/* Remaining games grid */}
            {rest.length > 0 && (
              <>
                <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-4">
                  {featured ? "More Games" : "All Games"} — {rest.length}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {rest.map((g) => <GameCard key={g.gamePk} game={g} />)}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-10 text-xs text-white/12 flex items-center gap-1.5">
        <Cloud size={11} strokeWidth={1.5} />
        MLB Stats API · Refreshes every 60 seconds
      </p>
    </div>
  );
}
