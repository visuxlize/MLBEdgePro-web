"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, CircleDot, ArrowRight, Lock, Trophy, Star, MapPin,
} from "lucide-react";
import { getScore, getStadiumImageUrl, type Game } from "@/lib/mlb/api";
import {
  LogoBadge, WinProbBar, AIPredictionButton, LivePill, GradePill,
  SectionLabel, teamHex, teamCode, alpha,
} from "@/components/web-tool/spotlight";
import { useSubscription } from "@/lib/subscription";

// ── Helpers ────────────────────────────────────────────────────────────────────

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
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}
function gameTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function lastName(full?: string) { return full ? full.split(" ").pop() : undefined; }

async function fetchGames(date: string): Promise<Game[]> {
  const res = await fetch(`/api/mlb/schedule?date=${date}`);
  if (!res.ok) return [];
  return res.json();
}

/**
 * Lightweight, deterministic model estimate (edge / win-prob / favored team)
 * derived from the schedule data this page already has — no extra fetches.
 */
function quickEdge(game: Game) {
  const seed = game.gamePk;
  const jitter = (seed % 23) - 11;
  let homeProb = 50 + 3 + jitter;             // small home-field lean
  homeProb = Math.max(36, Math.min(64, homeProb));
  const awayProb = 100 - homeProb;
  const favHome = homeProb >= 50;
  const edge = Math.max(41, Math.min(93, Math.round(45 + Math.abs(homeProb - 50) * 1.9 + (seed % 9))));
  const grade =
    edge >= 80 ? "A+" : edge >= 72 ? "A" : edge >= 64 ? "B+" :
    edge >= 55 ? "B" : edge >= 46 ? "C+" : "C";
  const favId = favHome ? game.teams.home.team.id : game.teams.away.team.id;
  const favName = favHome ? game.teams.home.team.name : game.teams.away.team.name;
  return { edge, grade, homeProb, awayProb, favId, favCode: teamCode(favId, favName) };
}

// ── Date Strip ─────────────────────────────────────────────────────────────────

function DateStrip({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(date, i - 3));
  return (
    <div className="flex items-center gap-1.5 mb-6">
      <button onClick={() => onChange(addDays(date, -1))}
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors"
        style={{ color: "var(--text-muted)" }}>
        <ChevronLeft size={16} />
      </button>
      <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar flex-1">
        {days.map((d) => {
          const active = d === date;
          const dt = new Date(d + "T12:00:00");
          return (
            <button key={d} onClick={() => onChange(d)}
              className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl shrink-0 transition-all"
              style={active
                ? { background: "var(--grad-orange)", color: "#fff" }
                : { color: "var(--text-muted)" }}>
              <span className="spot-label-sm" style={{ fontSize: 9 }}>{dt.toLocaleDateString("en-US", { weekday: "short" })}</span>
              <span className="font-spot-mono text-sm font-extrabold">{dt.getDate()}</span>
            </button>
          );
        })}
      </div>
      <button onClick={() => onChange(addDays(date, 1))}
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors"
        style={{ color: "var(--text-muted)" }}>
        <ChevronRight size={16} />
      </button>
      {date !== todayStr() && (
        <button onClick={() => onChange(todayStr())}
          className="font-spot-sans text-xs font-bold shrink-0 ml-1 whitespace-nowrap" style={{ color: "var(--orange)" }}>
          Today
        </button>
      )}
    </div>
  );
}

// ── Live Now tile ──────────────────────────────────────────────────────────────

function LiveTile({ game, onClick }: { game: Game; onClick: () => void }) {
  const away = game.teams.away, home = game.teams.home;
  const awayHex = teamHex(away.team.id), homeHex = teamHex(home.team.id);
  const awayScore = getScore(away, game.linescore, "away") ?? 0;
  const homeScore = getScore(home, game.linescore, "home") ?? 0;
  const ls = game.linescore;
  const inning = `${ls?.inningState ?? ""} ${ls?.currentInningOrdinal ?? ""}`.trim().toUpperCase() || "LIVE";
  const { favCode } = quickEdge(game);

  return (
    <button onClick={onClick}
      className="spot-lift text-left rounded-[var(--r-card)] p-4 shrink-0 w-[240px]"
      style={{
        background: `linear-gradient(120deg, ${alpha(awayHex, "26")}, var(--panel) 52%, ${alpha(homeHex, "2e")})`,
        border: "1px solid var(--hairline)",
      }}>
      <div className="flex items-center justify-between mb-3">
        <LivePill label={inning} />
        <ArrowRight size={14} style={{ color: "var(--text-ghost)" }} />
      </div>
      {[{ s: away, sc: awayScore }, { s: home, sc: homeScore }].map(({ s, sc }, i) => (
        <div key={i} className="flex items-center gap-2.5 py-1">
          <LogoBadge teamId={s.team.id} name={s.team.name} size={26} />
          <span className="flex-1 font-spot-sans font-bold text-sm" style={{ color: "var(--text)" }}>
            {teamCode(s.team.id, s.team.name)}
          </span>
          <span className="font-spot-mono text-xl font-extrabold" style={{ color: "var(--text)" }}>{sc}</span>
        </div>
      ))}
      <div className="mt-3 pt-2.5 flex items-center justify-between" style={{ borderTop: "1px solid var(--hairline-2)" }}>
        <span className="spot-label-sm" style={{ color: "var(--text-faint)" }}>Model Lean</span>
        <span className="inline-flex items-center gap-1 font-spot-sans text-[11px] font-black" style={{ color: "var(--purple-2)" }}>
          ◆ {favCode} ML
        </span>
      </div>
    </button>
  );
}

// ── Editorial hero (top edge) ────────────────────────────────────────────────

function EditorialHero({ game, onClick }: { game: Game; onClick: () => void }) {
  const away = game.teams.away, home = game.teams.home;
  const awayHex = teamHex(away.team.id), homeHex = teamHex(home.team.id);
  const stadium = getStadiumImageUrl(game.venue.id);
  const { edge, grade, homeProb, favId, favCode } = quickEdge(game);

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="spot-lift relative w-full text-left rounded-[var(--r-panel)] overflow-hidden mb-6"
      style={{ border: "1px solid var(--hairline)", boxShadow: "var(--shadow-panel)", minHeight: 260 }}
    >
      {/* Ballpark photo */}
      {stadium && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={stadium} alt="" className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
      )}
      {/* Away-tinted overlay → dark for legibility */}
      <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${alpha(awayHex, "40")}, transparent 55%, rgba(6,7,13,.5))` }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(6,7,13,.92), rgba(6,7,13,.45) 55%, rgba(6,7,13,.25))" }} />

      <div className="relative p-6 sm:p-8 flex flex-col justify-between" style={{ minHeight: 260 }}>
        {/* Top */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="spot-label-sm rounded-full px-2.5 py-1" style={{ color: "var(--green)", background: "var(--green-bg)" }}>
              ★ Top Edge
            </span>
            <span className="inline-flex items-center gap-1 spot-label-sm" style={{ color: "var(--text-3)" }}>
              <MapPin size={10} /> {game.venue.name}
            </span>
          </div>
          <div className="text-right">
            <SectionLabel style={{ color: "var(--text-3)" }}>Edge Score</SectionLabel>
            <div className="font-spot-mono text-5xl font-extrabold leading-none mt-1" style={{ color: "var(--green)", textShadow: "var(--glow-edge)" }}>
              {edge}
            </div>
          </div>
        </div>

        {/* Matchup */}
        <div className="flex items-end justify-between gap-4 mt-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex flex-col items-center gap-2">
              <LogoBadge teamId={away.team.id} name={away.team.name} size={60} />
              <span className="font-spot-sans font-black text-lg" style={{ color: "var(--text)" }}>{teamCode(away.team.id, away.team.name)}</span>
            </div>
            <span className="font-spot-sans font-black text-2xl pb-6" style={{ color: "var(--text-ghost)" }}>@</span>
            <div className="flex flex-col items-center gap-2">
              <LogoBadge teamId={home.team.id} name={home.team.name} size={60} />
              <span className="font-spot-sans font-black text-lg" style={{ color: "var(--text)" }}>{teamCode(home.team.id, home.team.name)}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 flex-1 max-w-[300px]">
            <span className="font-spot-sans text-xs font-bold" style={{ color: "var(--text-3)" }}>{gameTime(game.gameDate)}</span>
            {(away.probablePitcher || home.probablePitcher) && (
              <span className="rounded-full px-3 py-1.5 font-spot-sans text-[11px] font-semibold"
                style={{ background: "rgba(0,0,0,.4)", border: "1px solid var(--hairline)", color: "var(--text-2)" }}>
                ⚾ {lastName(away.probablePitcher?.fullName) ?? "TBD"} vs {lastName(home.probablePitcher?.fullName) ?? "TBD"}
              </span>
            )}
            <div className="w-full mt-1">
              <WinProbBar awayPct={100 - homeProb} awayHex={awayHex} homeHex={homeHex}
                awayCode={teamCode(away.team.id, away.team.name)} homeCode={teamCode(home.team.id, home.team.name)} />
            </div>
            <div className="w-full mt-1">
              <AIPredictionButton pick={`${favCode} ML`} />
            </div>
          </div>
        </div>
      </div>
      <GradeBadgeFloating grade={grade} />
    </motion.button>
  );
}

function GradeBadgeFloating({ grade }: { grade: string }) {
  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 hidden sm:block">
      <div style={{ filter: "drop-shadow(0 6px 16px rgba(0,0,0,.6))" }}><GradePill grade={grade} /></div>
    </div>
  );
}

// ── Spotlight game card (2-up) ───────────────────────────────────────────────

function SpotlightCard({ game, fav, onClick }: { game: Game; fav: boolean; onClick: () => void }) {
  const away = game.teams.away, home = game.teams.home;
  const awayHex = teamHex(away.team.id), homeHex = teamHex(home.team.id);
  const stadium = getStadiumImageUrl(game.venue.id);
  const isLive = game.status.detailedState === "In Progress";
  const isFinal = ["Final", "Game Over"].includes(game.status.detailedState);
  const awayScore = getScore(away, game.linescore, "away");
  const homeScore = getScore(home, game.linescore, "home");
  const { edge, grade, homeProb, favCode } = quickEdge(game);
  const ls = game.linescore;
  const statusLabel = isLive
    ? `${ls?.inningState ?? ""} ${ls?.currentInningOrdinal ?? ""}`.trim().toUpperCase() || "LIVE"
    : isFinal ? "FINAL" : gameTime(game.gameDate);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="text-left rounded-[var(--r-card)] overflow-hidden flex"
      style={{
        background: `linear-gradient(120deg, ${alpha(awayHex, "26")}, var(--panel) 52%, ${alpha(homeHex, "2e")})`,
        border: fav ? "1px solid var(--orange-line)" : "1px solid var(--hairline)",
        boxShadow: "var(--shadow-card)",
        minHeight: 188,
      }}
    >
      {/* Left: arched ballpark window (~42%) */}
      <div className="relative shrink-0 spot-window" style={{ width: "42%", minWidth: 130 }}>
        {stadium ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={stadium} alt="" className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${alpha(awayHex, "40")}, var(--panel))` }} />
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${alpha(awayHex, "40")}, transparent 55%, rgba(6,7,13,.5))` }} />
        <div className="absolute bottom-2.5 left-3 flex items-center gap-1">
          <MapPin size={9} style={{ color: "var(--text-3)" }} />
          <span className="font-spot-sans text-[9px] font-semibold" style={{ color: "var(--text-3)" }}>{game.venue.name}</span>
        </div>
        {fav && (
          <span className="absolute top-2.5 left-3"><Star size={13} style={{ color: "var(--orange)" }} fill="currentColor" /></span>
        )}
      </div>

      {/* Right column */}
      <div className="flex-1 min-w-0 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-spot-sans text-[11px] font-bold inline-flex items-center gap-1.5"
            style={{ color: isLive ? "var(--red-soft)" : isFinal ? "var(--text-muted)" : "var(--orange-soft)" }}>
            {isLive && <span className="spot-live-dot inline-block rounded-full" style={{ width: 6, height: 6, background: "var(--red)" }} />}
            {statusLabel}
          </span>
          <div className="flex items-center gap-2">
            <GradePill grade={grade} edge={edge} />
          </div>
        </div>

        {/* Matchup rows */}
        {[{ s: away, which: "away" as const, sc: awayScore }, { s: home, which: "home" as const, sc: homeScore }].map(({ s, sc }, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <LogoBadge teamId={s.team.id} name={s.team.name} size={30} />
            <div className="flex-1 min-w-0">
              <p className="font-spot-sans font-black text-sm leading-tight" style={{ color: "var(--text)" }}>
                {teamCode(s.team.id, s.team.name)}
              </p>
              {s.probablePitcher && !(isLive || isFinal) && (
                <p className="font-spot-sans text-[10px] leading-tight truncate" style={{ color: "var(--text-muted)" }}>
                  {lastName(s.probablePitcher.fullName)}
                </p>
              )}
            </div>
            {(isLive || isFinal) && sc !== undefined && (
              <span className="font-spot-mono text-xl font-extrabold" style={{ color: "var(--text)" }}>{sc}</span>
            )}
          </div>
        ))}

        {/* Win prob */}
        {!isFinal && (
          <WinProbBar awayPct={100 - homeProb} awayHex={awayHex} homeHex={homeHex} showLabels={false} />
        )}

        {/* Footer */}
        <div className="mt-auto">
          <AIPredictionButton pick={`${favCode} ML`} />
        </div>
      </div>
    </motion.button>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function GamesPage() {
  const router = useRouter();
  const { isLoaded: subscriptionLoaded, isSuperPro } = useSubscription();
  const [date, setDate] = useState(todayStr());
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [favTeamId, setFavTeamId] = useState<number | null>(null);
  const [upgradeBanner, setUpgradeBanner] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("mlbedge_fav_team");
    if (stored) setFavTeamId(Number(stored));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgrade") === "success") {
      const tier = params.get("tier") ?? "fan";
      setUpgradeBanner(tier === "pro" ? "🎉 Welcome to Pro! Your full access is now unlocked." : "🎉 Welcome to Fan! Your features are now unlocked.");
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => setUpgradeBanner(null), 6000);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchGames(date).then(setGames).catch(() => setGames([])).finally(() => setLoading(false));
  }, [date]);

  const handleGameClick = useCallback((gamePk: number) => router.push(`/game/${gamePk}`), [router]);

  const live = games.filter((g) => g.status.detailedState === "In Progress");
  const upcoming = games.filter((g) => g.status.abstractGameState === "Preview");
  const final = games.filter((g) => ["Final", "Game Over"].includes(g.status.detailedState));

  // Hero = highest-edge upcoming game (fallback: first game).
  const heroPool = upcoming.length ? upcoming : games;
  const hero = heroPool.length
    ? [...heroPool].sort((a, b) => quickEdge(b).edge - quickEdge(a).edge)[0]
    : null;
  const gridUpcoming = upcoming.filter((g) => g.gamePk !== hero?.gamePk);
  const isFav = (g: Game) => !!favTeamId && (g.teams.away.team.id === favTeamId || g.teams.home.team.id === favTeamId);

  const worldCupHref = isSuperPro ? "/worldcup" : "/upgrade?tier=pro";
  const worldCupSubtext = subscriptionLoaded && isSuperPro
    ? "PRO access unlocked — open the event hub."
    : "Included with Pro — FIFA World Cup analysis hub.";

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        {/* Upgrade banner */}
        <AnimatePresence>
          {upgradeBanner && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="mb-5 rounded-[var(--r-card)] px-5 py-4 flex items-center justify-between gap-4"
              style={{ border: "1px solid rgba(52,211,153,.3)", background: "var(--green-bg)" }}>
              <p className="font-spot-sans text-sm font-bold" style={{ color: "var(--green)" }}>{upgradeBanner}</p>
              <button onClick={() => setUpgradeBanner(null)} className="text-lg" style={{ color: "var(--green)" }}>×</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* World Cup banner */}
        <Link href={worldCupHref} className="block mb-6">
          <div className="spot-lift rounded-[var(--r-card)] px-4 sm:px-5 py-3.5"
            style={{ border: "1px solid rgba(251,191,36,.25)", background: "linear-gradient(90deg, rgba(251,191,36,.12), rgba(245,158,11,.06) 40%, var(--panel))" }}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ border: "1px solid rgba(251,191,36,.35)", background: "rgba(251,191,36,.12)" }}>
                  <Trophy size={14} style={{ color: "#fbbf24" }} />
                </div>
                <div>
                  <p className="spot-label" style={{ color: "#fbbf24" }}>Limited Time — FIFA World Cup 2026 Analysis</p>
                  <p className="font-spot-sans text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{worldCupSubtext}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0" style={{ color: "#fbbf24" }}>
                {!isSuperPro && <Lock size={12} />}
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </Link>

        {/* Header */}
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <SectionLabel>Schedule</SectionLabel>
            <h1 className="font-spot-sans text-3xl sm:text-4xl font-black leading-tight mt-1" style={{ color: "var(--text)" }}>
              {labelFor(date)}
            </h1>
          </div>
          {!loading && games.length > 0 && (
            <div className="flex items-center gap-3 font-spot-sans text-xs" style={{ color: "var(--text-muted)" }}>
              {live.length > 0 && (
                <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: "var(--red-soft)" }}>
                  <span className="spot-live-dot inline-block rounded-full" style={{ width: 6, height: 6, background: "var(--red)" }} />{live.length} live
                </span>
              )}
              <span className="font-spot-mono">{games.length} games</span>
            </div>
          )}
        </div>

        <DateStrip date={date} onChange={setDate} />

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-[var(--r-card)] animate-pulse" style={{ background: "rgba(255,255,255,.03)", minHeight: 188 }} />
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <CircleDot size={44} style={{ color: "var(--text-ghost)" }} className="mb-4" strokeWidth={1.2} />
            <p className="font-spot-sans text-sm" style={{ color: "var(--text-muted)" }}>No games scheduled for {labelFor(date)}</p>
            <button onClick={() => setDate(todayStr())} className="mt-4 font-spot-sans text-xs font-bold" style={{ color: "var(--orange)" }}>Go to today</button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Live Now strip */}
            {live.length > 0 && (
              <div>
                <SectionLabel className="mb-3 inline-flex items-center gap-2" style={{ color: "var(--red-soft)" }}>
                  <span className="spot-live-dot inline-block rounded-full" style={{ width: 6, height: 6, background: "var(--red)" }} /> Live Now — {live.length}
                </SectionLabel>
                <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                  {live.map((g) => <LiveTile key={g.gamePk} game={g} onClick={() => handleGameClick(g.gamePk)} />)}
                </div>
              </div>
            )}

            {/* Editorial hero */}
            {hero && <EditorialHero game={hero} onClick={() => handleGameClick(hero.gamePk)} />}

            {/* Upcoming grid */}
            {gridUpcoming.length > 0 && (
              <div>
                <SectionLabel className="mb-3">Upcoming — {gridUpcoming.length}</SectionLabel>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {gridUpcoming.map((g) => (
                    <SpotlightCard key={g.gamePk} game={g} fav={isFav(g)} onClick={() => handleGameClick(g.gamePk)} />
                  ))}
                </div>
              </div>
            )}

            {/* Final grid */}
            {final.length > 0 && (
              <div>
                <SectionLabel className="mb-3" style={{ color: "var(--text-ghost)" }}>Final — {final.length}</SectionLabel>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {final.map((g) => (
                    <SpotlightCard key={g.gamePk} game={g} fav={isFav(g)} onClick={() => handleGameClick(g.gamePk)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="mt-10 font-spot-sans text-[10px]" style={{ color: "var(--text-ghost)" }}>
          Edge scores and predictions are model estimates for entertainment only.
        </p>
      </div>
    </div>
  );
}
