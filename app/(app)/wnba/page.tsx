"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CircleDot, ArrowRight } from "lucide-react";
import type { WnbaGame } from "@/lib/wnba/types";
import { wnbaTeamHex, wnbaLogoUrl } from "@/lib/wnba/teams";
import { LogoPlate, WinProbBar, GradePill, AIPredictionButton, LivePill, SectionLabel, gradeColor, alpha } from "@/components/web-tool/spotlight";

function localDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function todayStr() { return localDateStr(); }
function addDays(d: string, n: number) {
  const dt = new Date(`${d}T12:00:00`);
  dt.setDate(dt.getDate() + n);
  return localDateStr(dt);
}
function labelFor(d: string) {
  const today = todayStr();
  if (d === today) return "Today";
  if (d === addDays(today, -1)) return "Yesterday";
  if (d === addDays(today, 1)) return "Tomorrow";
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

async function fetchGames(date: string): Promise<WnbaGame[]> {
  const res = await fetch(`/api/wnba/schedule?date=${date}`);
  if (!res.ok) return [];
  return res.json();
}

function DateStrip({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(date, i - 3));
  return (
    <div className="flex items-center gap-1.5 mb-6">
      <button onClick={() => onChange(addDays(date, -1))} className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ color: "var(--text-muted)" }}>
        <ChevronLeft size={16} />
      </button>
      <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar flex-1">
        {days.map((d) => {
          const active = d === date;
          const dt = new Date(d + "T12:00:00");
          return (
            <button key={d} onClick={() => onChange(d)} className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl shrink-0 transition-all"
              style={active ? { background: "linear-gradient(135deg,#2dd4bf,#5eead4)", color: "#06070d" } : { color: "var(--text-muted)" }}>
              <span className="spot-label-sm" style={{ fontSize: 9 }}>{dt.toLocaleDateString("en-US", { weekday: "short" })}</span>
              <span className="font-spot-mono text-sm font-extrabold">{dt.getDate()}</span>
            </button>
          );
        })}
      </div>
      <button onClick={() => onChange(addDays(date, 1))} className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ color: "var(--text-muted)" }}>
        <ChevronRight size={16} />
      </button>
      {date !== todayStr() && (
        <button onClick={() => onChange(todayStr())} className="font-spot-sans text-xs font-bold shrink-0 ml-1 whitespace-nowrap" style={{ color: "#2dd4bf" }}>Today</button>
      )}
    </div>
  );
}

function LiveTile({ game, onClick }: { game: WnbaGame; onClick: () => void }) {
  const awayHex = wnbaTeamHex(game.away), homeHex = wnbaTeamHex(game.home);
  return (
    <button onClick={onClick} className="spot-lift text-left rounded-[var(--r-card)] p-4 shrink-0 w-[240px]"
      style={{ background: `linear-gradient(120deg, ${alpha(awayHex, "26")}, var(--panel) 52%, ${alpha(homeHex, "2e")})`, border: "1px solid var(--hairline)" }}>
      <div className="flex items-center justify-between mb-3">
        <LivePill label={game.statusDetail} />
        <ArrowRight size={14} style={{ color: "var(--text-ghost)" }} />
      </div>
      {[{ abbr: game.away, sc: game.awayScore }, { abbr: game.home, sc: game.homeScore }].map(({ abbr, sc }, i) => (
        <div key={i} className="flex items-center gap-2.5 py-1">
          <LogoPlate hex={wnbaTeamHex(abbr)} src={wnbaLogoUrl(abbr)} code={abbr} size={26} />
          <span className="flex-1 font-spot-sans font-bold text-sm" style={{ color: "var(--text)" }}>{abbr}</span>
          <span className="font-spot-mono text-xl font-extrabold" style={{ color: "var(--text)" }}>{sc ?? 0}</span>
        </div>
      ))}
      <div className="mt-3 pt-2.5 flex items-center justify-between" style={{ borderTop: "1px solid var(--hairline-2)" }}>
        <span className="spot-label-sm" style={{ color: "var(--text-faint)" }}>Model Lean</span>
        <span className="inline-flex items-center gap-1 font-spot-sans text-[11px] font-black" style={{ color: "var(--purple-2)" }}>
          ◆ {game.homeWinProb >= 50 ? game.home : game.away} ML
        </span>
      </div>
    </button>
  );
}

function EditorialHero({ game, onClick }: { game: WnbaGame; onClick: () => void }) {
  const awayHex = wnbaTeamHex(game.away), homeHex = wnbaTeamHex(game.home);
  return (
    <motion.button onClick={onClick} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="spot-lift relative w-full text-left rounded-[var(--r-panel)] overflow-hidden mb-6"
      style={{ border: "1px solid var(--hairline)", boxShadow: "var(--shadow-panel)", background: `linear-gradient(120deg, ${alpha(awayHex, "30")}, var(--panel) 55%, ${alpha(homeHex, "34")})`, minHeight: 260 }}>
      <div className="relative p-6 sm:p-8 flex flex-col justify-between" style={{ minHeight: 260 }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="spot-label-sm rounded-full px-2.5 py-1" style={{ color: "var(--green)", background: "var(--green-bg)" }}>★ Top Edge</span>
            <span className="font-spot-sans text-[10px]" style={{ color: "var(--text-3)" }}>{game.venue}</span>
          </div>
          <div className="text-right">
            <SectionLabel style={{ color: "var(--text-3)" }}>Edge Score</SectionLabel>
            <div className="font-spot-mono text-5xl font-extrabold leading-none mt-1" style={{ color: "var(--green)", textShadow: "var(--glow-edge)" }}>{game.edge}</div>
          </div>
        </div>
        <div className="flex items-end justify-between gap-4 mt-6 flex-wrap">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex flex-col items-center gap-2">
              <LogoPlate hex={awayHex} src={wnbaLogoUrl(game.away)} code={game.away} size={60} />
              <span className="font-spot-sans font-black text-lg" style={{ color: "var(--text)" }}>{game.away}</span>
            </div>
            <span className="font-spot-sans font-black text-2xl pb-6" style={{ color: "var(--text-ghost)" }}>@</span>
            <div className="flex flex-col items-center gap-2">
              <LogoPlate hex={homeHex} src={wnbaLogoUrl(game.home)} code={game.home} size={60} />
              <span className="font-spot-sans font-black text-lg" style={{ color: "var(--text)" }}>{game.home}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-1" style={{ maxWidth: 300 }}>
            <span className="font-spot-sans text-xs font-bold" style={{ color: "var(--text-3)" }}>{game.timeLabel}</span>
            <div className="w-full mt-1">
              <WinProbBar awayPct={100 - game.homeWinProb} awayHex={awayHex} homeHex={homeHex} awayCode={game.away} homeCode={game.home} />
            </div>
            <div className="w-full mt-1">
              <AIPredictionButton pick={`${game.homeWinProb >= 50 ? game.home : game.away} ML`} teamId={undefined} />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute top-6 left-1/2 -translate-x-1/2 hidden sm:block" style={{ filter: "drop-shadow(0 6px 16px rgba(0,0,0,.6))" }}>
        <GradePill grade={game.grade} />
      </div>
    </motion.button>
  );
}

function GameCard({ game, onClick }: { game: WnbaGame; onClick: () => void }) {
  const awayHex = wnbaTeamHex(game.away), homeHex = wnbaTeamHex(game.home);
  const isLive = game.status === "live";
  const isFinal = game.status === "final";
  const gc = gradeColor(game.grade);
  return (
    <motion.button onClick={onClick} whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="text-left rounded-[var(--r-card)] overflow-hidden relative"
      style={{ background: `linear-gradient(135deg, ${alpha(awayHex, "40")} 0%, var(--panel) 50%, ${alpha(homeHex, "40")} 100%)`, border: "1px solid var(--hairline)", boxShadow: "var(--shadow-card)", minHeight: 188 }}>
      <div className="relative z-10 w-full p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-spot-sans text-[11px] font-bold inline-flex items-center gap-1.5"
            style={{ color: isLive ? "var(--red-soft)" : isFinal ? "var(--text-muted)" : "#2dd4bf" }}>
            {isLive && <span className="spot-live-dot inline-block rounded-full" style={{ width: 6, height: 6, background: "var(--red)" }} />}
            {isLive ? game.statusDetail : isFinal ? "FINAL" : game.timeLabel}
          </span>
          <GradePill grade={game.grade} edge={game.edge} />
        </div>
        {[{ abbr: game.away, sc: game.awayScore }, { abbr: game.home, sc: game.homeScore }].map(({ abbr, sc }, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <LogoPlate hex={wnbaTeamHex(abbr)} src={wnbaLogoUrl(abbr)} code={abbr} size={30} />
            <span className="flex-1 font-spot-sans font-black text-sm" style={{ color: "var(--text)" }}>{abbr}</span>
            {(isLive || isFinal) && sc !== undefined && <span className="font-spot-mono text-xl font-extrabold" style={{ color: "var(--text)" }}>{sc}</span>}
          </div>
        ))}
        {!isFinal && <WinProbBar awayPct={100 - game.homeWinProb} awayHex={awayHex} homeHex={homeHex} showLabels={false} />}
        <div className="mt-auto">
          <AIPredictionButton pick={`${game.homeWinProb >= 50 ? game.home : game.away} ML`} />
        </div>
      </div>
    </motion.button>
  );
}

export default function WnbaPage() {
  const router = useRouter();
  const [date, setDate] = useState(todayStr());
  const [games, setGames] = useState<WnbaGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchGames(date).then((g) => { if (!cancelled) setGames(g); }).catch(() => { if (!cancelled) setGames([]); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [date]);

  const openGame = useCallback((id: string) => router.push(`/wnba/game/${id}`), [router]);

  const live = games.filter((g) => g.status === "live");
  const upcoming = games.filter((g) => g.status === "pre");
  const final = games.filter((g) => g.status === "final");
  const heroPool = upcoming.length ? upcoming : games;
  const hero = heroPool.length ? [...heroPool].sort((a, b) => b.edge - a.edge)[0] : null;
  const gridUpcoming = upcoming.filter((g) => g.id !== hero?.id);

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <SectionLabel style={{ color: "#2dd4bf" }}>Schedule</SectionLabel>
            <h1 className="font-spot-sans text-3xl sm:text-4xl font-black leading-tight mt-1" style={{ color: "var(--text)" }}>{labelFor(date)}</h1>
          </div>
          {!loading && games.length > 0 && (
            <div className="flex items-center gap-3 font-spot-sans text-xs" style={{ color: "var(--text-muted)" }}>
              {live.length > 0 && (
                <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: "var(--red-soft)" }}>
                  <span className="spot-live-dot inline-block rounded-full" style={{ width: 6, height: 6, background: "var(--red)" }} />{live.length} live
                </span>
              )}
              <span className="font-spot-mono">{games.length} {games.length === 1 ? "game" : "games"}</span>
            </div>
          )}
        </div>

        <DateStrip date={date} onChange={setDate} />

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="rounded-[var(--r-card)] animate-pulse" style={{ background: "rgba(255,255,255,.03)", minHeight: 188 }} />)}
          </div>
        ) : games.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <CircleDot size={44} style={{ color: "var(--text-ghost)" }} className="mb-4" strokeWidth={1.2} />
            <p className="font-spot-sans text-sm" style={{ color: "var(--text-muted)" }}>No games scheduled for {labelFor(date)}</p>
            <button onClick={() => setDate(todayStr())} className="mt-4 font-spot-sans text-xs font-bold" style={{ color: "#2dd4bf" }}>Go to today</button>
          </div>
        ) : (
          <div className="space-y-8">
            {live.length > 0 && (
              <div>
                <SectionLabel className="mb-3 inline-flex items-center gap-2" style={{ color: "var(--red-soft)" }}>
                  <span className="spot-live-dot inline-block rounded-full" style={{ width: 6, height: 6, background: "var(--red)" }} /> Live Now — {live.length}
                </SectionLabel>
                <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                  {live.map((g) => <LiveTile key={g.id} game={g} onClick={() => openGame(g.id)} />)}
                </div>
              </div>
            )}

            {hero && <EditorialHero game={hero} onClick={() => openGame(hero.id)} />}

            {gridUpcoming.length > 0 && (
              <div>
                <SectionLabel className="mb-3">Upcoming — {gridUpcoming.length}</SectionLabel>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {gridUpcoming.map((g) => <GameCard key={g.id} game={g} onClick={() => openGame(g.id)} />)}
                </div>
              </div>
            )}

            {final.length > 0 && (
              <div>
                <SectionLabel className="mb-3" style={{ color: "var(--text-ghost)" }}>Final — {final.length}</SectionLabel>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {final.map((g) => <GameCard key={g.id} game={g} onClick={() => openGame(g.id)} />)}
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
