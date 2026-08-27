"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, TrendingUp, Users, BarChart2, Zap } from "lucide-react";
import { useSubscription } from "@/lib/subscription";
import type { NflGame, NflWeekKey } from "@/lib/nfl/types";
import { nflTeamHex, nflLogoUrl } from "@/lib/nfl/teams";
import { LogoPlate, SectionLabel, gradeColor, alpha } from "@/components/web-tool/spotlight";
import { NflTeaser } from "@/components/web-tool/nfl-teaser";

const WEEKS: { key: NflWeekKey; label: string; range: string }[] = [
  { key: "HOF_PRE1", label: "HOF + PRE 1", range: "AUG 6–15" },
  { key: "PRE2",     label: "PRE 2",       range: "AUG 20–23" },
  { key: "PRE3",     label: "PRE 3",       range: "AUG 27–29" },
  { key: "WK1",      label: "WK 1",        range: "SEP 9" },
];

async function fetchWeek(week: NflWeekKey): Promise<NflGame[]> {
  const res = await fetch(`/api/nfl/schedule?week=${week}`);
  if (!res.ok) return [];
  return res.json();
}

// ── Week pills ─────────────────────────────────────────────────────────────────

function WeekPills({ week, onChange }: { week: NflWeekKey; onChange: (w: NflWeekKey) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {WEEKS.map((w) => {
        const active = w.key === week;
        return (
          <button
            key={w.key}
            onClick={() => onChange(w.key)}
            className="rounded-xl px-4 py-2 text-center transition-all"
            style={active
              ? { background: "#0f172a", color: "#fff" }
              : { background: "#fff", border: "1px solid var(--hairline)", color: "var(--text-muted)" }}
          >
            <span className="block font-spot-sans font-extrabold text-[11px] tracking-[.06em]">{w.label}</span>
            <span className="block mt-0.5 font-spot-mono font-semibold text-[9px]" style={{ color: active ? "rgba(255,255,255,.6)" : "var(--text-dim)" }}>{w.range}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Odds chip ──────────────────────────────────────────────────────────────────

function OddsChip({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg px-2.5 py-1.5 min-w-[52px]"
      style={accent
        ? { background: "#009688", color: "#fff" }
        : { background: "var(--panel-2)", border: "1px solid var(--hairline)", color: "var(--text)" }}
    >
      <span className="font-spot-mono font-black text-[13px] leading-tight">{value}</span>
      <span className="font-spot-sans font-semibold text-[9px] uppercase tracking-[.08em] mt-0.5"
        style={{ color: accent ? "rgba(255,255,255,.75)" : "var(--text-muted)" }}>{label}</span>
    </div>
  );
}

// ── Public betting bar ─────────────────────────────────────────────────────────

function PublicBettingBar({ awayPct, awayCode, homeCode }: { awayPct: number; awayCode: string; homeCode: string }) {
  const homePct = 100 - awayPct;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-muted)" }}>{awayPct}%</span>
        <span className="font-spot-sans font-semibold text-[9px] uppercase tracking-[.10em]" style={{ color: "var(--text-dim)" }}>Public Money</span>
        <span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-muted)" }}>{homePct}%</span>
      </div>
      <div className="flex w-full overflow-hidden rounded-full" style={{ height: 6, background: "var(--hairline)" }}>
        <div style={{ width: `${awayPct}%`, background: "#ef4444", transition: "width .4s ease" }} />
        <div style={{ flex: 1, background: "#009688" }} />
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="font-spot-sans font-black text-[10px]" style={{ color: "var(--text-3)" }}>{awayCode}</span>
        <span className="font-spot-sans font-black text-[10px]" style={{ color: "var(--text-3)" }}>{homeCode}</span>
      </div>
    </div>
  );
}

// ── Win prob bar (teal branded) ────────────────────────────────────────────────

function WinProbBar({ awayPct, awayHex, homeHex, awayCode, homeCode }: { awayPct: number; awayHex: string; homeHex: string; awayCode: string; homeCode: string }) {
  const homePct = 100 - awayPct;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-spot-mono font-bold text-sm" style={{ color: "var(--text)" }}>{awayPct}%</span>
          <span className="font-spot-sans font-semibold text-[10px]" style={{ color: "var(--text-muted)" }}>{awayCode}</span>
        </div>
        <span className="font-spot-sans font-semibold text-[9px] uppercase tracking-[.10em]" style={{ color: "var(--text-dim)" }}>Win Prediction</span>
        <div className="flex items-center gap-1.5">
          <span className="font-spot-sans font-semibold text-[10px]" style={{ color: "var(--text-muted)" }}>{homeCode}</span>
          <span className="font-spot-mono font-bold text-sm" style={{ color: "var(--text)" }}>{homePct}%</span>
        </div>
      </div>
      <div className="flex w-full overflow-hidden rounded-full" style={{ height: 8, background: "var(--hairline)" }}>
        <div style={{ width: `${awayPct}%`, background: awayHex, transition: "width .4s ease" }} />
        <div style={{ flex: 1, background: homeHex }} />
      </div>
    </div>
  );
}

// ── LIVE tile ──────────────────────────────────────────────────────────────────

function LiveTile({ game, onClick }: { game: NflGame; onClick: () => void }) {
  const awayHex = nflTeamHex(game.away);
  const homeHex = nflTeamHex(game.home);
  const awayPct = 100 - game.homeWinProb;

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full text-left rounded-[16px] overflow-hidden mb-4"
      style={{ background: "#fff", border: "2px solid rgba(220,38,38,.35)", boxShadow: "0 0 0 4px rgba(220,38,38,.05), var(--shadow-panel)" }}
    >
      {/* Live header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--hairline)" }}>
        <span className="inline-flex items-center gap-1.5 font-spot-sans font-extrabold text-[11px] uppercase tracking-[.14em]" style={{ color: "var(--red)" }}>
          <span className="spot-live-dot inline-block rounded-full" style={{ width: 7, height: 7, background: "var(--red)" }} />
          Live Now
        </span>
        <span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-muted)" }}>{game.dateLabel} · {game.statusDetail}</span>
      </div>

      {/* Teams + score */}
      <div className="grid grid-cols-3 items-center gap-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <LogoPlate hex={awayHex} src={nflLogoUrl(game.away)} code={game.away} size={44} radius={12} />
          <div>
            <p className="font-spot-sans font-black text-base" style={{ color: "var(--text)" }}>{game.away}</p>
            <p className="font-spot-sans text-[10px]" style={{ color: "var(--text-muted)" }}>Away</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          {game.awayScore !== undefined && game.homeScore !== undefined ? (
            <>
              <div className="flex items-center gap-3">
                <span className="font-spot-mono font-black text-3xl" style={{ color: "var(--text)" }}>{game.awayScore}</span>
                <span className="font-spot-sans font-black text-lg" style={{ color: "var(--text-ghost)" }}>—</span>
                <span className="font-spot-mono font-black text-3xl" style={{ color: "var(--text)" }}>{game.homeScore}</span>
              </div>
              <span className="font-spot-sans font-bold text-[10px] uppercase tracking-[.12em]" style={{ color: "var(--red)" }}>{game.statusDetail}</span>
            </>
          ) : (
            <span className="font-spot-sans font-bold text-[11px]" style={{ color: "var(--red)" }}>{game.timeLabel}</span>
          )}
        </div>
        <div className="flex items-center gap-3 justify-end">
          <div className="text-right">
            <p className="font-spot-sans font-black text-base" style={{ color: "var(--text)" }}>{game.home}</p>
            <p className="font-spot-sans text-[10px]" style={{ color: "var(--text-muted)" }}>Home</p>
          </div>
          <LogoPlate hex={homeHex} src={nflLogoUrl(game.home)} code={game.home} size={44} radius={12} />
        </div>
      </div>

      {/* Win prob + odds */}
      <div className="px-5 pb-5 flex flex-col gap-3">
        <WinProbBar awayPct={awayPct} awayHex={awayHex} homeHex={homeHex} awayCode={game.away} homeCode={game.home} />
        <div className="flex items-center gap-2 justify-center">
          <OddsChip label="ML" value={`${awayPct >= 50 ? "−137" : "+124"}`} />
          <OddsChip label="Spread" value={`${awayPct >= 50 ? "−4.5" : "+4.5"}`} accent />
          <OddsChip label="Total" value="O 48.5" />
          <OddsChip label="Edge" value={`${game.edge}`} />
        </div>
      </div>
    </motion.button>
  );
}

// ── Matchup card (BestOdds style) ─────────────────────────────────────────────

type MatchupTab = "moneyline" | "spread" | "total";

function MatchupCard({ game, onClick }: { game: NflGame; onClick: () => void }) {
  const [tab, setTab] = useState<MatchupTab>("moneyline");
  const awayHex = nflTeamHex(game.away);
  const homeHex = nflTeamHex(game.home);
  const awayPct = 100 - game.homeWinProb;
  const homePct = game.homeWinProb;
  const gc = gradeColor(game.grade);
  const isFinal = game.status === "final";

  const tabs: { key: MatchupTab; label: string }[] = [
    { key: "moneyline", label: "Moneyline" },
    { key: "spread",    label: "Spread" },
    { key: "total",     label: "Total" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col rounded-[16px] overflow-hidden"
      style={{ background: "#fff", border: "1px solid var(--hairline)", boxShadow: "var(--shadow-card)" }}
    >
      {/* Card header — date + status */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2" style={{ borderBottom: "1px solid var(--hairline)" }}>
        <span className="font-spot-mono font-bold text-[10px] uppercase tracking-[.08em]" style={{ color: "var(--text-muted)" }}>
          {game.dateLabel} · {game.timeLabel}
        </span>
        <div className="flex items-center gap-2">
          {isFinal && (
            <span className="font-spot-sans font-extrabold text-[10px] uppercase tracking-[.10em]" style={{ color: "var(--text-muted)" }}>Final</span>
          )}
          <span
            className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-spot-sans font-black text-[11px]"
            style={{ color: gc, background: `color-mix(in srgb, ${gc} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${gc} 25%, transparent)` }}
          >
            <span className="font-spot-mono">{game.edge}</span>
            <span>{game.grade}</span>
          </span>
        </div>
      </div>

      {/* Teams */}
      <button onClick={onClick} className="w-full text-left">
        <div className="grid grid-cols-3 items-center gap-3 px-4 py-4">
          {/* Away */}
          <div className="flex items-center gap-3">
            <LogoPlate hex={awayHex} src={nflLogoUrl(game.away)} code={game.away} size={40} radius={11} />
            <div>
              <p className="font-spot-sans font-black text-[15px]" style={{ color: "var(--text)" }}>{game.away}</p>
              <p className="font-spot-sans text-[10px]" style={{ color: "var(--text-muted)" }}>{game.qbAway ?? "Away"}</p>
            </div>
          </div>

          {/* Center — win prob + score */}
          <div className="flex flex-col items-center gap-1">
            {isFinal && game.awayScore !== undefined ? (
              <div className="flex items-center gap-3">
                <span className="font-spot-mono font-black text-2xl" style={{ color: awayPct > homePct ? "var(--green)" : "var(--text)" }}>{game.awayScore}</span>
                <span className="font-spot-sans font-bold text-base" style={{ color: "var(--text-ghost)" }}>–</span>
                <span className="font-spot-mono font-black text-2xl" style={{ color: homePct >= awayPct ? "var(--green)" : "var(--text)" }}>{game.homeScore}</span>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="font-spot-mono font-black text-xl" style={{ color: "var(--text)" }}>{awayPct}%</span>
                  <span className="font-spot-sans font-bold text-xs" style={{ color: "var(--text-ghost)" }}>–</span>
                  <span className="font-spot-mono font-black text-xl" style={{ color: "var(--text)" }}>{homePct}%</span>
                </div>
                <span className="font-spot-sans font-semibold text-[9px] uppercase tracking-[.10em]" style={{ color: "var(--text-dim)" }}>Win Pred.</span>
              </>
            )}
          </div>

          {/* Home */}
          <div className="flex items-center gap-3 justify-end">
            <div className="text-right">
              <p className="font-spot-sans font-black text-[15px]" style={{ color: "var(--text)" }}>{game.home}</p>
              <p className="font-spot-sans text-[10px]" style={{ color: "var(--text-muted)" }}>{game.qbHome ?? "Home"}</p>
            </div>
            <LogoPlate hex={homeHex} src={nflLogoUrl(game.home)} code={game.home} size={40} radius={11} />
          </div>
        </div>

        {/* Win prob bar */}
        <div className="px-4 pb-3">
          <div className="flex w-full overflow-hidden rounded-full" style={{ height: 6, background: "var(--hairline)" }}>
            <div style={{ width: `${awayPct}%`, background: awayHex }} />
            <div style={{ flex: 1, background: homeHex }} />
          </div>
        </div>
      </button>

      {/* Moneyline / Spread / Total tabs */}
      <div style={{ borderTop: "1px solid var(--hairline)" }}>
        <div className="flex" style={{ borderBottom: "1px solid var(--hairline)" }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 py-2.5 font-spot-sans font-extrabold text-[11px] uppercase tracking-[.08em] transition-colors"
              style={tab === t.key
                ? { color: "#009688", borderBottom: "2px solid #009688", background: "rgba(0,150,136,.04)" }
                : { color: "var(--text-muted)", borderBottom: "2px solid transparent" }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Odds row */}
        <div className="flex items-stretch" style={{ minHeight: 52 }}>
          {/* Away odds */}
          <button
            onClick={onClick}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 transition-colors hover:bg-gray-50"
            style={{ borderRight: "1px solid var(--hairline)" }}
          >
            <span className="font-spot-sans font-black text-[11px] uppercase tracking-[.06em]" style={{ color: "var(--text-muted)" }}>{game.away}</span>
            <span className="font-spot-mono font-black text-[15px]" style={{ color: awayPct > 50 ? "#009688" : "var(--text)" }}>
              {tab === "moneyline"
                ? (awayPct > 50 ? `−${Math.round(awayPct * 2.2)}` : `+${Math.round((100 - awayPct) * 1.6)}`)
                : tab === "spread"
                ? (awayPct > 50 ? `−${((awayPct - 50) / 5).toFixed(1)}` : `+${((50 - awayPct) / 5).toFixed(1)}`)
                : `O ${(48 + (game.edge % 7)).toFixed(1)}`}
            </span>
          </button>

          {/* Home odds */}
          <button
            onClick={onClick}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 transition-colors hover:bg-gray-50"
          >
            <span className="font-spot-sans font-black text-[11px] uppercase tracking-[.06em]" style={{ color: "var(--text-muted)" }}>{game.home}</span>
            <span className="font-spot-mono font-black text-[15px]" style={{ color: homePct > 50 ? "#009688" : "var(--text)" }}>
              {tab === "moneyline"
                ? (homePct > 50 ? `−${Math.round(homePct * 2.2)}` : `+${Math.round((100 - homePct) * 1.6)}`)
                : tab === "spread"
                ? (homePct > 50 ? `−${((homePct - 50) / 5).toFixed(1)}` : `+${((50 - homePct) / 5).toFixed(1)}`)
                : `U ${(48 + (game.edge % 7)).toFixed(1)}`}
            </span>
          </button>
        </div>
      </div>

      {/* Public betting + venue */}
      <div className="px-4 pb-4 pt-3 flex flex-col gap-3" style={{ borderTop: "1px solid var(--hairline)" }}>
        <PublicBettingBar awayPct={awayPct} awayCode={game.away} homeCode={game.home} />
        {game.venue && (
          <div className="flex items-center gap-1.5">
            <MapPin size={10} style={{ color: "var(--text-dim)" }} />
            <span className="font-spot-sans text-[10px]" style={{ color: "var(--text-dim)" }}>{game.venue}</span>
          </div>
        )}
      </div>

      {/* AI prediction footer */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-b-[16px]"
        style={{ background: "rgba(124,92,250,.05)", borderTop: "1px solid rgba(124,92,250,.12)" }}>
        <span className="inline-flex items-center gap-1.5 font-spot-sans font-extrabold text-[10px] uppercase tracking-[.10em]" style={{ color: "var(--purple-2)" }}>
          <Zap size={10} /> AI Edge Pick
        </span>
        <button onClick={onClick} className="font-spot-sans font-black text-[12px]" style={{ color: "var(--purple-soft)" }}>
          {game.homeWinProb >= 50 ? game.home : game.away} ML ↗
        </button>
      </div>
    </motion.div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

function Dashboard() {
  const router = useRouter();
  const [week, setWeek] = useState<NflWeekKey>("HOF_PRE1");
  const [games, setGames] = useState<NflGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchWeek(week)
      .then((g) => { if (!cancelled) setGames(g); })
      .catch(() => { if (!cancelled) setGames([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [week]);

  const openGame = useCallback((id: string) => router.push(`/nfl/game/${id}`), [router]);

  const live     = games.filter((g) => g.status === "live");
  const upcoming = games.filter((g) => g.status !== "final");
  const finals   = games.filter((g) => g.status === "final");
  const activeWeek = WEEKS.find((w) => w.key === week)!;

  return (
    <div className="spotlight min-h-screen">
      {/* ── Page header ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid var(--hairline)" }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
          {/* Sport badge + title */}
          <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 mb-3"
                style={{ background: "var(--panel-2)", border: "1px solid var(--hairline)" }}>
                <span className="font-spot-sans font-black text-[11px] uppercase tracking-[.12em]" style={{ color: "var(--text-muted)" }}>🏈 NFL</span>
                <span style={{ color: "var(--hairline)", fontSize: 10 }}>·</span>
                <span className="font-spot-sans font-bold text-[11px]" style={{ color: "var(--text-muted)" }}>2026 Preseason</span>
              </div>
              <h1 className="font-spot-sans font-black text-3xl sm:text-4xl uppercase leading-tight" style={{ color: "var(--text)", letterSpacing: "-.01em" }}>
                NFL Schedule
              </h1>
              <p className="mt-1.5 font-spot-sans text-sm" style={{ color: "var(--text-muted)" }}>
                {activeWeek.label} · {activeWeek.range} · Edge model live on every matchup
              </p>
            </div>

            {/* Stat strip */}
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { icon: BarChart2, label: "Games",    value: games.length,  color: "var(--text)" },
                { icon: TrendingUp, label: "Live",   value: live.length,    color: "var(--red)" },
                { icon: Users,      label: "Finals",  value: finals.length,  color: "var(--green)" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2.5 rounded-xl px-4 py-2.5"
                  style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
                  <s.icon size={14} style={{ color: s.color }} />
                  <div>
                    <p className="font-spot-mono font-black text-lg leading-none" style={{ color: s.color }}>{s.value}</p>
                    <p className="font-spot-sans font-bold text-[9px] uppercase tracking-[.10em] mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Week selector */}
          <WeekPills week={week} onChange={setWeek} />
        </div>
      </div>

      {/* ── Games grid ── */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))" }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-[16px] animate-pulse" style={{ background: "var(--panel)", height: 320, border: "1px solid var(--hairline)" }} />
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center rounded-[16px]"
            style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
            <span style={{ fontSize: 40 }}>🏈</span>
            <p className="mt-4 font-spot-sans font-black text-lg" style={{ color: "var(--text)" }}>No games scheduled</p>
            <p className="mt-1 font-spot-sans text-sm" style={{ color: "var(--text-muted)" }}>Check back closer to kickoff for this week&apos;s slate.</p>
          </div>
        ) : (
          <>
            {/* Live games first */}
            {live.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="spot-live-dot inline-block rounded-full" style={{ width: 8, height: 8, background: "var(--red)" }} />
                  <SectionLabel style={{ color: "var(--red)" }}>Live Now</SectionLabel>
                </div>
                {live.map((g) => <LiveTile key={g.id} game={g} onClick={() => openGame(g.id)} />)}
              </div>
            )}

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div className="mb-6">
                {live.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <SectionLabel>Upcoming</SectionLabel>
                  </div>
                )}
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))" }}>
                  {upcoming.map((g) => <MatchupCard key={g.id} game={g} onClick={() => openGame(g.id)} />)}
                </div>
              </div>
            )}

            {/* Finals */}
            {finals.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <SectionLabel style={{ color: "var(--text-muted)" }}>Final Results</SectionLabel>
                </div>
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))" }}>
                  {finals.map((g) => <MatchupCard key={g.id} game={g} onClick={() => openGame(g.id)} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function NflPage() {
  const { isSuperPro } = useSubscription();
  return isSuperPro ? <Dashboard /> : <NflTeaser />;
}
