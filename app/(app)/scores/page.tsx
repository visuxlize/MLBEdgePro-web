"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, RefreshCw, MapPin, ChevronRight as Arrow, Check, X, Trophy } from "lucide-react";
import { fetchGamesByDate, getScore, type Game } from "@/lib/mlb/api";
import {
  LogoBadge, WinProbBar, LivePill, BaseDiamond, GradePill,
  SectionLabel, teamHex, teamCode, alpha, modelEdge,
} from "@/components/web-tool/spotlight";

/** Did the model's pick win this final game? */
function pickResult(game: Game) {
  const awayScore = getScore(game.teams.away, game.linescore, "away") ?? 0;
  const homeScore = getScore(game.teams.home, game.linescore, "home") ?? 0;
  const winnerId = awayScore > homeScore ? game.teams.away.team.id : game.teams.home.team.id;
  const { favId, favCode } = modelEdge(game);
  return { hit: favId === winnerId, favCode, favId, winnerId };
}

function todayStr() { return new Date().toISOString().slice(0, 10); }
function addDays(d: string, n: number) {
  const dt = new Date(d + "T12:00:00"); dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
}
function labelFor(d: string) {
  const today = todayStr();
  if (d === today) return "Today";
  if (d === addDays(today, -1)) return "Yesterday";
  if (d === addDays(today, 1)) return "Tomorrow";
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
function gameTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function lastName(full?: string) { return full ? full.split(" ").pop() : "TBD"; }

// ── Live card ──────────────────────────────────────────────────────────────────

function LiveCard({ game }: { game: Game }) {
  const away = game.teams.away, home = game.teams.home;
  const awayHex = teamHex(away.team.id), homeHex = teamHex(home.team.id);
  const awayScore = getScore(away, game.linescore, "away") ?? 0;
  const homeScore = getScore(home, game.linescore, "home") ?? 0;
  const ls = game.linescore;
  const inning = `${ls?.inningState ?? ""} ${ls?.currentInningOrdinal ?? ""}`.trim().toUpperCase() || "LIVE";
  const { homeProb, favCode } = modelEdge(game);
  const off = ls?.offense;
  const situation = [
    ls?.outs !== undefined ? `${ls.outs} out` : null,
    ls?.balls !== undefined && ls?.strikes !== undefined ? `${ls.balls}-${ls.strikes} count` : null,
  ].filter(Boolean).join(" · ");

  return (
    <Link href={`/game/${game.gamePk}`}
      className="spot-lift block rounded-[var(--r-card)] overflow-hidden"
      style={{
        background: `linear-gradient(120deg, ${alpha(awayHex, "26")}, var(--panel) 52%, ${alpha(homeHex, "2e")})`,
        border: "1px solid var(--hairline)", boxShadow: "var(--shadow-card)",
      }}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <LivePill label={inning} />
          <span className="inline-flex items-center gap-1 spot-label-sm" style={{ color: "var(--text-3)" }}>
            <MapPin size={10} /> {game.venue.name}
          </span>
        </div>

        <div className="flex items-stretch gap-4">
          {/* Team rows */}
          <div className="flex-1 min-w-0 space-y-3">
            {[{ s: away, sc: awayScore }, { s: home, sc: homeScore }].map(({ s, sc }, i) => (
              <div key={i} className="flex items-center gap-3">
                <LogoBadge teamId={s.team.id} name={s.team.name} size={32} />
                <span className="flex-1 font-spot-sans font-black text-base" style={{ color: "var(--text)" }}>
                  {teamCode(s.team.id, s.team.name)}
                </span>
                <span className="font-spot-mono text-3xl font-extrabold leading-none" style={{ color: "var(--text)" }}>{sc}</span>
              </div>
            ))}
          </div>

          {/* Base diamond */}
          <div className="flex flex-col items-center justify-center px-2" style={{ borderLeft: "1px solid var(--hairline-2)" }}>
            <BaseDiamond
              first={!!off?.first?.id} second={!!off?.second?.id} third={!!off?.third?.id}
              outs={ls?.outs}
            />
          </div>
        </div>

        {/* Win prob */}
        <div className="mt-4">
          <WinProbBar awayPct={100 - homeProb} awayHex={awayHex} homeHex={homeHex}
            awayCode={teamCode(away.team.id, away.team.name)} homeCode={teamCode(home.team.id, home.team.name)} />
        </div>

        {/* Situation / lean line */}
        <div className="mt-3 pt-3 flex items-center justify-between gap-2" style={{ borderTop: "1px solid var(--hairline-2)" }}>
          <span className="font-spot-sans text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
            <span style={{ color: "var(--text-faint)" }} className="spot-label-sm mr-1.5">Live</span>
            {situation || inning}
          </span>
          <span className="inline-flex items-center gap-1 font-spot-sans text-[11px] font-black shrink-0" style={{ color: "var(--purple-2)" }}>
            ◆ {favCode} ML
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Final row ──────────────────────────────────────────────────────────────────

function FinalRow({ game }: { game: Game }) {
  const away = game.teams.away, home = game.teams.home;
  const awayScore = getScore(away, game.linescore, "away") ?? 0;
  const homeScore = getScore(home, game.linescore, "home") ?? 0;
  const awayWin = awayScore > homeScore;
  const winner = awayWin ? away : home;

  const Side = ({ s, sc, win }: { s: typeof away; sc: number; win: boolean }) => (
    <div className="flex items-center gap-2.5 flex-1 min-w-0" style={{ opacity: win ? 1 : 0.45 }}>
      <LogoBadge teamId={s.team.id} name={s.team.name} size={28} />
      <span className="font-spot-sans font-bold text-sm truncate" style={{ color: "var(--text)" }}>{teamCode(s.team.id, s.team.name)}</span>
      <span className="font-spot-mono text-xl font-extrabold ml-auto" style={{ color: "var(--text)" }}>{sc}</span>
    </div>
  );

  return (
    <Link href={`/game/${game.gamePk}`}
      className="flex items-center gap-4 rounded-[var(--r-tile)] px-4 py-3 spot-lift"
      style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
      <span className="spot-label-sm shrink-0 w-10" style={{ color: "var(--text-ghost)" }}>Final</span>
      <Side s={away} sc={awayScore} win={awayWin} />
      <span className="font-spot-mono text-sm shrink-0" style={{ color: "var(--text-ghost)" }}>–</span>
      <Side s={home} sc={homeScore} win={!awayWin} />
      <span className="hidden sm:inline-flex items-center gap-1 font-spot-sans text-[11px] font-semibold shrink-0" style={{ color: "var(--text-muted)" }}>
        {teamCode(winner.team.id, winner.team.name)} win · box score <Arrow size={12} />
      </span>
    </Link>
  );
}

// ── Final result card (day-complete grid) ──────────────────────────────────────

function FinalResultCard({ game }: { game: Game }) {
  const away = game.teams.away, home = game.teams.home;
  const awayHex = teamHex(away.team.id), homeHex = teamHex(home.team.id);
  const awayScore = getScore(away, game.linescore, "away") ?? 0;
  const homeScore = getScore(home, game.linescore, "home") ?? 0;
  const awayWin = awayScore > homeScore;
  const { hit, favCode } = pickResult(game);

  const Row = ({ s, sc, win }: { s: typeof away; sc: number; win: boolean }) => (
    <div className="flex items-center gap-2.5" style={{ opacity: win ? 1 : 0.5 }}>
      <LogoBadge teamId={s.team.id} name={s.team.name} size={30} />
      <span className="flex-1 font-spot-sans font-black text-sm" style={{ color: "var(--text)" }}>{teamCode(s.team.id, s.team.name)}</span>
      {win && <span className="spot-label-sm rounded-full px-1.5 py-0.5" style={{ color: "var(--green)", background: "var(--green-bg)" }}>WIN</span>}
      <span className="font-spot-mono text-2xl font-extrabold" style={{ color: "var(--text)" }}>{sc}</span>
    </div>
  );

  return (
    <Link href={`/game/${game.gamePk}`}
      className="spot-lift block rounded-[var(--r-card)] p-4"
      style={{
        background: `linear-gradient(120deg, ${alpha(awayHex, "1c")}, var(--panel) 55%, ${alpha(homeHex, "1c")})`,
        border: "1px solid var(--hairline)", boxShadow: "var(--shadow-card)",
      }}>
      <div className="flex items-center justify-between mb-3">
        <span className="spot-label-sm" style={{ color: "var(--text-ghost)" }}>Final</span>
        <span className="inline-flex items-center gap-1 spot-label-sm rounded-full px-2 py-0.5"
          style={hit
            ? { color: "var(--green)", background: "var(--green-bg)", border: "1px solid rgba(52,211,153,.35)" }
            : { color: "var(--red-soft)", background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.35)" }}>
          {hit ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
          {hit ? "Hit" : "Miss"}
        </span>
      </div>

      <div className="space-y-2.5">
        <Row s={away} sc={awayScore} win={awayWin} />
        <Row s={home} sc={homeScore} win={!awayWin} />
      </div>

      <div className="mt-3 pt-3 flex items-center justify-between gap-2" style={{ borderTop: "1px solid var(--hairline-2)" }}>
        <span className="font-spot-sans text-[11px]" style={{ color: "var(--text-muted)" }}>
          Model took <span className="font-black" style={{ color: "var(--purple-2)" }}>◆ {favCode}</span>
        </span>
        <span className="inline-flex items-center gap-1 font-spot-sans text-[11px] font-semibold" style={{ color: "var(--text-3)" }}>
          Box score &amp; recap <Arrow size={12} />
        </span>
      </div>
    </Link>
  );
}

// ── Upcoming row ───────────────────────────────────────────────────────────────

function UpcomingRow({ game }: { game: Game }) {
  const away = game.teams.away, home = game.teams.home;
  const { grade, edge, favCode } = modelEdge(game);
  return (
    <Link href={`/game/${game.gamePk}`}
      className="flex items-center gap-4 rounded-[var(--r-tile)] px-4 py-3 spot-lift"
      style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
      <span className="font-spot-mono text-xs font-bold shrink-0 w-14" style={{ color: "var(--orange-soft)" }}>{gameTime(game.gameDate)}</span>
      <div className="flex items-center gap-2 shrink-0">
        <LogoBadge teamId={away.team.id} name={away.team.name} size={26} />
        <span className="font-spot-sans font-black text-sm" style={{ color: "var(--text)" }}>{teamCode(away.team.id, away.team.name)}</span>
        <span className="font-spot-sans text-xs" style={{ color: "var(--text-ghost)" }}>@</span>
        <span className="font-spot-sans font-black text-sm" style={{ color: "var(--text)" }}>{teamCode(home.team.id, home.team.name)}</span>
        <LogoBadge teamId={home.team.id} name={home.team.name} size={26} />
      </div>
      <span className="hidden md:block flex-1 min-w-0 font-spot-sans text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
        {lastName(away.probablePitcher?.fullName)} vs {lastName(home.probablePitcher?.fullName)}
      </span>
      <div className="flex items-center gap-2 ml-auto shrink-0">
        <span className="inline-flex items-center gap-1 font-spot-sans text-[11px] font-black" style={{ color: "var(--purple-2)" }}>◆ {favCode} ML</span>
        <GradePill grade={grade} edge={edge} />
      </div>
    </Link>
  );
}

export default function ScoresPage() {
  const [date, setDate] = useState(todayStr());
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchGamesByDate(date).then(setGames).catch(() => setGames([])).finally(() => setLoading(false));
  }, [date]);

  const live = games.filter((g) => g.status.detailedState === "In Progress");
  const final = games.filter((g) => ["Final", "Game Over"].includes(g.status.detailedState));
  const upcoming = games.filter((g) => g.status.abstractGameState === "Preview");

  const slateComplete = final.length > 0 && live.length === 0 && upcoming.length === 0;
  const aiHits = final.reduce((n, g) => (pickResult(g).hit ? n + 1 : n), 0);

  return (
    <div className="spotlight min-h-screen">
      <div className="px-4 sm:px-8 py-6 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="mb-5">
          <SectionLabel>Today</SectionLabel>
          <h1 className="font-spot-sans text-3xl sm:text-4xl font-black mt-1" style={{ color: "var(--text)" }}>Live Scores</h1>
          <p className="font-spot-sans text-sm mt-1" style={{ color: "var(--text-muted)" }}>Live games, final results & upcoming for {labelFor(date)}</p>
        </div>

        {/* Date nav */}
        <div className="flex items-center gap-3 mb-7">
          <button onClick={() => setDate(addDays(date, -1))} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
            <ChevronLeft size={16} />
          </button>
          <h2 className="font-spot-sans text-lg font-bold" style={{ color: "var(--text)" }}>{labelFor(date)}</h2>
          <button onClick={() => setDate(addDays(date, 1))} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
            <ChevronRight size={16} />
          </button>
          {date !== todayStr() && (
            <button onClick={() => setDate(todayStr())} className="font-spot-sans text-xs font-bold" style={{ color: "var(--orange)" }}>Today</button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 py-20" style={{ color: "var(--text-muted)" }}>
              <RefreshCw size={18} className="animate-spin" />
              <span className="font-spot-sans text-sm">Loading scores…</span>
            </motion.div>
          ) : games.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-24">
              <p className="font-spot-sans" style={{ color: "var(--text-muted)" }}>No games for {labelFor(date)}</p>
            </motion.div>
          ) : (
            <motion.div key={date} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
              {slateComplete ? (
                <>
                  {/* Slate-complete banner */}
                  <div className="rounded-[var(--r-panel)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    style={{ background: "linear-gradient(120deg, var(--purple-tint), var(--panel) 60%)", border: "1px solid var(--purple-line)", boxShadow: "var(--shadow-card)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>
                        <Trophy size={18} style={{ color: "var(--purple-2)" }} strokeWidth={2} />
                      </div>
                      <div>
                        <p className="font-spot-sans text-lg font-black" style={{ color: "var(--text)" }}>Slate complete · {labelFor(date)}</p>
                        <p className="font-spot-sans text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                          Live games appear pinned at the top here while in progress.
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <SectionLabel style={{ color: "var(--text-faint)" }}>Model record</SectionLabel>
                      <p className="font-spot-mono text-2xl font-extrabold mt-0.5" style={{ color: aiHits * 2 >= final.length ? "var(--green)" : "var(--orange-2)" }}>
                        {aiHits} / {final.length} <span className="font-spot-sans text-sm font-bold" style={{ color: "var(--text-muted)" }}>hit</span>
                      </p>
                    </div>
                  </div>

                  {/* Final result grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {final.map((g) => <FinalResultCard key={g.gamePk} game={g} />)}
                  </div>
                </>
              ) : (
                <>
                  {/* Live (pinned above) */}
                  {live.length > 0 && (
                    <div>
                      <SectionLabel className="mb-3 inline-flex items-center gap-2" style={{ color: "var(--red-soft)" }}>
                        <span className="spot-live-dot inline-block rounded-full" style={{ width: 6, height: 6, background: "var(--red)" }} /> Live · {live.length} {live.length === 1 ? "game" : "games"}
                      </SectionLabel>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {live.map((g) => <LiveCard key={g.gamePk} game={g} />)}
                      </div>
                    </div>
                  )}

                  {/* Final */}
                  {final.length > 0 && (
                    <div>
                      <SectionLabel className="mb-3" style={{ color: "var(--text-ghost)" }}>Final — {final.length}</SectionLabel>
                      <div className="space-y-2">
                        {final.map((g) => <FinalRow key={g.gamePk} game={g} />)}
                      </div>
                    </div>
                  )}

                  {/* Upcoming */}
                  {upcoming.length > 0 && (
                    <div>
                      <SectionLabel className="mb-3">Upcoming — {upcoming.length}</SectionLabel>
                      <div className="space-y-2">
                        {upcoming.map((g) => <UpcomingRow key={g.gamePk} game={g} />)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
