"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useSubscription } from "@/lib/subscription";
import type { NflGame, NflWeekKey } from "@/lib/nfl/types";
import { nflTeamHex, nflLogoUrl } from "@/lib/nfl/teams";
import { LogoPlate, SectionLabel, gradeColor, alpha } from "@/components/web-tool/spotlight";
import { NflTeaser } from "@/components/web-tool/nfl-teaser";

const WEEKS: { key: NflWeekKey; label: string; range: string }[] = [
  { key: "HOF_PRE1", label: "HOF + PRE 1", range: "AUG 6–15" },
  { key: "PRE2", label: "PRE 2", range: "AUG 20–23" },
  { key: "PRE3", label: "PRE 3", range: "AUG 27–29" },
  { key: "WK1", label: "WK 1", range: "SEP 9" },
];

async function fetchWeek(week: NflWeekKey): Promise<NflGame[]> {
  const res = await fetch(`/api/nfl/schedule?week=${week}`);
  if (!res.ok) return [];
  return res.json();
}

function WeekPills({ week, onChange }: { week: NflWeekKey; onChange: (w: NflWeekKey) => void }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {WEEKS.map((w) => {
        const active = w.key === week;
        return (
          <button
            key={w.key}
            onClick={() => onChange(w.key)}
            className="rounded-xl px-3 py-1.5 text-center transition-colors"
            style={active
              ? { background: "var(--grad-orange)" }
              : { border: "1px solid var(--hairline)" }}
          >
            <span className="block font-spot-mono font-extrabold text-[10px] tracking-[.08em]" style={{ color: active ? "#fff" : "var(--text-muted)" }}>{w.label}</span>
            <span className="block mt-0.5 font-spot-mono font-semibold text-[9px]" style={{ color: active ? "rgba(255,255,255,.75)" : "var(--text-faint)" }}>{w.range}</span>
          </button>
        );
      })}
    </div>
  );
}

function TeamRow({ abbr, pct, score, showPct }: { abbr: string; pct?: number; score?: number; showPct: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoPlate hex={nflTeamHex(abbr)} src={nflLogoUrl(abbr)} code={abbr} size={30} radius={9} />
      <span className="flex-1 font-spot-sans font-black text-sm" style={{ color: "var(--text)" }}>{abbr}</span>
      {showPct && pct !== undefined && <span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-3)" }}>{pct}%</span>}
      {!showPct && score !== undefined && <span className="font-spot-mono font-extrabold text-xl" style={{ color: "var(--text)" }}>{score}</span>}
    </div>
  );
}

function LiveTile({ game, onClick }: { game: NflGame; onClick: () => void }) {
  const drive = game.drive;
  return (
    <div
      className="rounded-[20px] overflow-hidden mb-4"
      style={{ background: "var(--panel)", border: "1px solid rgba(239,68,68,.28)", boxShadow: "var(--shadow-panel), 0 0 48px rgba(239,68,68,.07)" }}
    >
      <div className="flex flex-wrap">
        <button
          onClick={onClick}
          className="text-left p-5 flex flex-col gap-3"
          style={{ flex: "1 1 270px", minWidth: 270, background: `linear-gradient(150deg, ${alpha(nflTeamHex(game.away), "40")}, transparent 55%)`, borderRight: "1px solid var(--hairline)" }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-spot-sans font-extrabold text-[10px] tracking-[.12em]" style={{ color: "var(--red-soft)", background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.3)" }}>
              <span className="spot-live-dot inline-block rounded-full" style={{ width: 6, height: 6, background: "var(--red)" }} />{game.statusDetail}
            </span>
            <span className="font-spot-mono font-extrabold text-[10px] tracking-[.08em]" style={{ color: "var(--text-muted)" }}>{game.dateLabel}</span>
          </div>
          <TeamRow abbr={game.away} score={game.awayScore} showPct={false} />
          <TeamRow abbr={game.home} score={game.homeScore} showPct={false} />
        </button>
        {drive && (
          <div className="p-5 flex flex-col gap-3 justify-center" style={{ flex: "2 1 400px", minWidth: 300 }}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="inline-flex items-center gap-2 font-spot-mono font-extrabold text-[13px]" style={{ color: "var(--orange-soft)" }}>
                🏈 {drive.possession} ball &middot; {drive.downDistance} at {drive.spot}
              </span>
            </div>
            <div className="flex h-[112px] rounded-xl overflow-hidden relative" style={{ border: "1px solid var(--hairline)" }}>
              <div className="w-[34px] flex items-center justify-center" style={{ background: nflTeamHex(game.home), opacity: 0.85 }}>
                <span className="font-spot-sans font-black text-[10px] tracking-[.2em]" style={{ color: "rgba(255,255,255,.85)", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{game.home}</span>
              </div>
              <div className="flex-1 relative" style={{ background: "linear-gradient(180deg, rgba(46,94,78,.30), rgba(46,94,78,.12))" }}>
                <div className="absolute top-0 bottom-0" style={{ left: `${drive.firstDownPct}%`, width: 2, background: "#fbbf24", boxShadow: "0 0 10px rgba(251,191,36,.6)" }} />
                <div className="absolute top-0 bottom-0" style={{ left: `${drive.ballPct}%`, width: 0 }}>
                  <div className="absolute" style={{ top: "50%", left: 0, transform: "translate(-50%,-50%)" }}>
                    <span className="absolute rounded-full" style={{ inset: -7, border: "2px solid rgba(249,115,22,.7)", animation: "spot-ping 1.4s ease-out infinite" }} />
                    <span className="block rounded-full" style={{ width: 12, height: 12, background: "#f97316", boxShadow: "0 0 14px rgba(249,115,22,.9)" }} />
                  </div>
                </div>
              </div>
              <div className="w-[34px] flex items-center justify-center" style={{ background: nflTeamHex(game.away), opacity: 0.85 }}>
                <span className="font-spot-sans font-black text-[10px] tracking-[.2em]" style={{ color: "rgba(255,255,255,.85)", writingMode: "vertical-rl" }}>{game.away}</span>
              </div>
            </div>
            {drive.lastPlay && (
              <div className="flex items-center gap-2">
                <span className="spot-live-dot inline-block rounded-full" style={{ width: 6, height: 6, background: "var(--green)" }} />
                <span className="font-spot-sans text-xs" style={{ color: "var(--text-2)" }}>Last play: <span className="font-bold" style={{ color: "var(--text)" }}>{drive.lastPlay}</span></span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EditorialHero({ game, onClick }: { game: NflGame; onClick: () => void }) {
  const awayHex = nflTeamHex(game.away), homeHex = nflTeamHex(game.home);
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="relative w-full text-left rounded-[20px] overflow-hidden mb-5"
      style={{ border: "1px solid var(--hairline)", boxShadow: "var(--shadow-panel)", minHeight: 220 }}
    >
      {game.venueImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={game.venueImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${alpha(awayHex, "40")}, transparent 50%, ${alpha(homeHex, "40")})` }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(6,7,13,.88), rgba(6,7,13,.35) 55%, rgba(6,7,13,.3))" }} />
      <div className="relative p-5 sm:p-6 flex flex-col gap-3.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-full px-2.5 py-1 font-spot-sans font-extrabold text-[10px] uppercase tracking-[.12em]" style={{ color: "var(--green)", background: "var(--green-bg)" }}>★ Top Edge</span>
            <span className="font-spot-mono font-extrabold text-[10px] tracking-[.08em]" style={{ color: "var(--orange-soft)" }}>{game.dateLabel} &middot; {game.timeLabel}</span>
            <span className="inline-flex items-center gap-1 font-spot-sans text-[10px]" style={{ color: "var(--text-3)" }}><MapPin size={10} />{game.venue}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="rounded-[11px] px-2.5 py-1 font-spot-sans font-black text-[13px]" style={{ color: "var(--green)", background: "var(--green-bg)", border: "1px solid rgba(52,211,153,.32)" }}>{game.grade}</span>
            <span className="font-spot-sans font-extrabold text-[10px] uppercase tracking-[.14em]" style={{ color: "var(--text-3)" }}>Edge</span>
            <span className="font-spot-mono font-extrabold text-[32px] leading-none" style={{ color: "var(--green)", textShadow: "var(--glow-edge)" }}>{game.edge}</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-5 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <LogoPlate hex={awayHex} src={nflLogoUrl(game.away)} code={game.away} size={44} radius={13} />
              <span className="font-spot-sans font-black text-base" style={{ color: "var(--text)" }}>{game.away}</span>
              <span className="font-spot-sans text-[10px]" style={{ color: "var(--text-muted)" }}>{game.qbAway}</span>
            </div>
            <span className="font-spot-sans font-black text-lg pb-5" style={{ color: "var(--text-ghost)" }}>@</span>
            <div className="flex flex-col items-center gap-2">
              <LogoPlate hex={homeHex} src={nflLogoUrl(game.home)} code={game.home} size={44} radius={13} />
              <span className="font-spot-sans font-black text-base" style={{ color: "var(--text)" }}>{game.home}</span>
              <span className="font-spot-sans text-[10px]" style={{ color: "var(--text-muted)" }}>{game.qbHome}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-1" style={{ maxWidth: 320, minWidth: 240 }}>
            <div className="flex justify-between">
              <span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-3)" }}>{100 - game.homeWinProb}%</span>
              <span className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.14em]" style={{ color: "var(--text-faint)" }}>Win Prob</span>
              <span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-3)" }}>{game.homeWinProb}%</span>
            </div>
            <div className="flex h-1.5 rounded overflow-hidden" style={{ background: "rgba(255,255,255,.12)" }}>
              <div style={{ width: `${100 - game.homeWinProb}%`, background: awayHex }} />
              <div style={{ flex: 1, background: homeHex }} />
            </div>
            <div className="flex items-center justify-between gap-2.5 rounded-xl px-3.5 py-2" style={{ background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>
              <span className="font-spot-sans font-extrabold text-[10px] uppercase tracking-[.12em]" style={{ color: "var(--purple-2)" }}>◆ AI Prediction</span>
              <span className="font-spot-sans font-black text-[13px]" style={{ color: "var(--purple-soft)" }}>{game.homeWinProb >= 50 ? game.home : game.away} ML ↗</span>
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function GameCard({ game, onClick }: { game: NflGame; onClick: () => void }) {
  const awayHex = nflTeamHex(game.away), homeHex = nflTeamHex(game.home);
  const gc = gradeColor(game.grade);
  return (
    <button
      onClick={onClick}
      className="text-left rounded-[18px] overflow-hidden relative"
      style={{ background: `linear-gradient(135deg, ${alpha(awayHex, "40")} 0%, #0b0d15 50%, ${alpha(homeHex, "40")} 100%)`, border: "1px solid var(--hairline)", boxShadow: "var(--shadow-card)", minHeight: 196 }}
    >
      {game.venueImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={game.venueImage} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ mixBlendMode: "luminosity", opacity: 0.4 }} />
      )}
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${alpha(awayHex, "40")} 0%, transparent 50%, ${alpha(homeHex, "40")} 100%)` }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(6,7,13,.5) 0%, rgba(6,7,13,.15) 40%, rgba(6,7,13,.15) 60%, rgba(6,7,13,.7) 100%)" }} />
      <div className="relative z-10 p-4 flex flex-col gap-2.5" style={{ minHeight: 196 }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="font-spot-mono font-extrabold text-[10px] tracking-[.08em]" style={{ color: "var(--orange-soft)" }}>{game.dateLabel}</span>
            <span className="font-spot-sans font-extrabold text-[15px]" style={{ color: "#fff" }}>{game.timeLabel}</span>
            <span className="inline-flex items-center gap-1 font-spot-sans text-[10px]" style={{ color: "var(--text-3)" }}><MapPin size={9} />{game.venue}</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-[11px] px-2.5 py-1 font-spot-sans font-black text-[13px]" style={{ color: gc, background: `color-mix(in srgb, ${gc} 16%, transparent)`, border: `1px solid color-mix(in srgb, ${gc} 32%, transparent)` }}>
            <span className="font-spot-mono">{game.edge}</span>{game.grade}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <LogoPlate hex={awayHex} src={nflLogoUrl(game.away)} code={game.away} size={30} radius={9} />
          <div className="flex-1 min-w-0">
            <p className="font-spot-sans font-black text-sm leading-tight" style={{ color: "var(--text)" }}>{game.away}</p>
            <p className="font-spot-sans text-[10px] leading-tight truncate" style={{ color: "var(--text-3)" }}>{game.qbAway}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <LogoPlate hex={homeHex} src={nflLogoUrl(game.home)} code={game.home} size={30} radius={9} />
          <div className="flex-1 min-w-0">
            <p className="font-spot-sans font-black text-sm leading-tight" style={{ color: "var(--text)" }}>{game.home}</p>
            <p className="font-spot-sans text-[10px] leading-tight truncate" style={{ color: "var(--text-3)" }}>{game.qbHome}</p>
          </div>
        </div>
        <div className="flex h-1.5 rounded overflow-hidden" style={{ background: "rgba(255,255,255,.12)" }}>
          <div style={{ width: `${100 - game.homeWinProb}%`, background: awayHex }} />
          <div style={{ flex: 1, background: homeHex }} />
        </div>
        <div className="mt-auto flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 backdrop-blur-sm" style={{ background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>
          <span className="font-spot-sans font-extrabold text-[10px] uppercase tracking-[.12em]" style={{ color: "var(--purple-2)" }}>◆ AI Prediction</span>
          <span className="font-spot-sans font-black text-xs" style={{ color: "var(--purple-soft)" }}>{game.homeWinProb >= 50 ? game.home : game.away} ML ↗</span>
        </div>
      </div>
    </button>
  );
}

function Dashboard() {
  const router = useRouter();
  const [week, setWeek] = useState<NflWeekKey>("HOF_PRE1");
  const [games, setGames] = useState<NflGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchWeek(week).then((g) => { if (!cancelled) setGames(g); }).catch(() => { if (!cancelled) setGames([]); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [week]);

  const openGame = useCallback((id: string) => router.push(`/nfl/game/${id}`), [router]);

  const live = games.filter((g) => g.status === "live");
  const upcoming = games.filter((g) => g.status !== "final");
  const hero = upcoming.length ? [...upcoming].sort((a, b) => b.edge - a.edge)[0] : null;
  const gridGames = games.filter((g) => g.id !== hero?.id);
  const activeWeek = WEEKS.find((w) => w.key === week)!;

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
          <div>
            <p className="spot-label" style={{ color: "var(--orange)" }}>2026 Preseason</p>
            <h1 className="font-spot-sans text-3xl sm:text-4xl font-black leading-tight mt-1" style={{ color: "var(--text)" }}>
              This Week <span className="font-spot-mono" style={{ color: "var(--orange)" }}>{games.length}</span>
            </h1>
            <p className="mt-1.5 font-spot-sans text-[13px]" style={{ color: "var(--text-muted)" }}>
              {activeWeek.label} &middot; {activeWeek.range} &middot; Edge model live on every matchup
            </p>
          </div>
          <WeekPills week={week} onChange={setWeek} />
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-3 gap-px rounded-[20px] overflow-hidden mb-5" style={{ background: "var(--hairline)", border: "1px solid var(--hairline)" }}>
          {[{ label: "Games", value: games.length, color: "var(--text)" }, { label: "Live", value: live.length, color: "var(--red-soft)" }, { label: "Analyzed", value: games.length, color: "var(--green)" }].map((s) => (
            <div key={s.label} className="text-center py-3.5 px-5" style={{ background: "var(--panel)" }}>
              <p className="font-spot-mono font-extrabold text-2xl" style={{ color: s.color }}>{s.value}</p>
              <p className="mt-0.5 font-spot-sans font-bold text-[10px] uppercase tracking-[.12em]" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
            {[1, 2, 3, 4].map((i) => <div key={i} className="rounded-[18px] animate-pulse" style={{ background: "rgba(255,255,255,.03)", minHeight: 196 }} />)}
          </div>
        ) : games.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <p className="font-spot-sans text-sm" style={{ color: "var(--text-muted)" }}>No games scheduled for this window yet.</p>
          </div>
        ) : (
          <>
            {live.length > 0 && (
              <div className="mb-1">
                <SectionLabel className="mb-2.5" style={{ color: "var(--red-soft)" }}>&#9679; Live Now</SectionLabel>
                {live.map((g) => <LiveTile key={g.id} game={g} onClick={() => openGame(g.id)} />)}
              </div>
            )}
            {hero && <EditorialHero game={hero} onClick={() => openGame(hero.id)} />}
            <SectionLabel className="mb-2.5" style={{ color: "var(--text-faint)" }}>All Games</SectionLabel>
            <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
              {gridGames.map((g) => <GameCard key={g.id} game={g} onClick={() => openGame(g.id)} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function NflPage() {
  const { isSuperPro, isLoaded } = useSubscription();
  if (!isLoaded) return null;
  return isSuperPro ? <Dashboard /> : <NflTeaser />;
}
