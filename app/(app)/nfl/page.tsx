"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, TrendingUp, Users, BarChart2, Zap, Shield } from "lucide-react";
import { useSubscription } from "@/lib/subscription";
import type { NflGame, NflWeekKey } from "@/lib/nfl/types";
import { nflTeamHex, nflLogoUrl } from "@/lib/nfl/teams";
import { LogoPlate, SectionLabel, gradeColor, alpha } from "@/components/web-tool/spotlight";
import { NflTeaser } from "@/components/web-tool/nfl-teaser";
import { SeasonTimeline, NFL_2026_PHASES } from "@/components/web-tool/season-timeline";

// ── Week config ────────────────────────────────────────────────────────────────

interface WeekDef { key: NflWeekKey; label: string; range: string; type: "pre" | "reg" }

const WEEKS: WeekDef[] = [
  { key: "HOF_PRE1", label: "HOF + Pre 1", range: "AUG 6–15",   type: "pre" },
  { key: "PRE2",     label: "Pre 2",       range: "AUG 20–23",  type: "pre" },
  { key: "PRE3",     label: "Pre 3",       range: "AUG 27–29",  type: "pre" },
  { key: "WK1",      label: "Week 1",      range: "SEP 9",      type: "reg" },
];

const PRESEASON = WEEKS.filter((w) => w.type === "pre");
const REGULAR   = WEEKS.filter((w) => w.type === "reg");

async function fetchWeek(week: NflWeekKey): Promise<NflGame[]> {
  const res = await fetch(`/api/nfl/schedule?week=${week}`);
  if (!res.ok) return [];
  return res.json();
}

// ── Week selector (split preseason / regular) ─────────────────────────────────

function WeekPills({ week, onChange }: { week: NflWeekKey; onChange: (w: NflWeekKey) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Preseason */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.10em] w-20 shrink-0"
          style={{ color: "var(--orange)" }}>Preseason</span>
        {PRESEASON.map((w) => {
          const active = w.key === week;
          return (
            <button key={w.key} onClick={() => onChange(w.key)}
              className="rounded-xl px-4 py-2.5 text-center transition-all"
              style={active
                ? { background: "var(--orange)", color: "#000", boxShadow: "0 4px 14px rgba(251,146,60,.35)" }
                : { background: "var(--panel)", border: "1px solid var(--hairline)", color: "var(--text-muted)" }}>
              <span className="block font-spot-sans font-extrabold text-[11px] tracking-[.06em]">{w.label}</span>
              <span className="block mt-0.5 font-spot-mono font-semibold text-[9px]"
                style={{ color: active ? "rgba(0,0,0,.55)" : "var(--text-dim)" }}>{w.range}</span>
            </button>
          );
        })}
      </div>

      {/* Regular season */}
      {REGULAR.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.10em] w-20 shrink-0"
            style={{ color: "var(--purple-2)" }}>Regular</span>
          {REGULAR.map((w) => {
            const active = w.key === week;
            return (
              <button key={w.key} onClick={() => onChange(w.key)}
                className="rounded-xl px-4 py-2.5 text-center transition-all"
                style={active
                  ? { background: "var(--grad-purple)", color: "#fff", boxShadow: "0 4px 14px rgba(124,92,250,.35)" }
                  : { background: "var(--panel)", border: "1px solid var(--hairline)", color: "var(--text-muted)" }}>
                <span className="block font-spot-sans font-extrabold text-[11px] tracking-[.06em]">{w.label}</span>
                <span className="block mt-0.5 font-spot-mono font-semibold text-[9px]"
                  style={{ color: active ? "rgba(255,255,255,.6)" : "var(--text-dim)" }}>{w.range}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Stat chip ──────────────────────────────────────────────────────────────────

function OddsChip({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl px-3 py-2 min-w-[58px]"
      style={accent
        ? { background: "var(--green)", color: "#06070d" }
        : { background: "var(--panel-2)", border: "1px solid var(--hairline)", color: "var(--text)" }}>
      <span className="font-spot-mono font-black text-[13px] leading-tight">{value}</span>
      <span className="font-spot-sans font-semibold text-[9px] uppercase tracking-[.08em] mt-0.5"
        style={{ color: accent ? "rgba(0,0,0,.6)" : "var(--text-muted)" }}>{label}</span>
    </div>
  );
}

// ── Win prob bar ───────────────────────────────────────────────────────────────

function WinProbBar({ awayPct, awayHex, homeHex, awayCode, homeCode }: {
  awayPct: number; awayHex: string; homeHex: string; awayCode: string; homeCode: string;
}) {
  const homePct = 100 - awayPct;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-spot-mono font-black text-sm" style={{ color: "var(--text)" }}>{awayPct}%</span>
          <span className="font-spot-sans font-semibold text-[10px]" style={{ color: "var(--text-muted)" }}>{awayCode}</span>
        </div>
        <span className="font-spot-sans font-semibold text-[9px] uppercase tracking-[.10em]" style={{ color: "var(--text-dim)" }}>Win Prediction</span>
        <div className="flex items-center gap-1.5">
          <span className="font-spot-sans font-semibold text-[10px]" style={{ color: "var(--text-muted)" }}>{homeCode}</span>
          <span className="font-spot-mono font-black text-sm" style={{ color: "var(--text)" }}>{homePct}%</span>
        </div>
      </div>
      <div className="flex w-full overflow-hidden rounded-full" style={{ height: 8, background: "var(--hairline)" }}>
        <div style={{ width: `${awayPct}%`, background: awayHex, transition: "width .4s ease" }} />
        <div style={{ flex: 1, background: homeHex }} />
      </div>
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

// ── Live tile (bold, prominent) ────────────────────────────────────────────────

function LiveTile({ game, onClick }: { game: NflGame; onClick: () => void }) {
  const awayHex = nflTeamHex(game.away);
  const homeHex = nflTeamHex(game.home);
  const awayPct = 100 - game.homeWinProb;

  return (
    <motion.button onClick={onClick} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="w-full text-left rounded-[20px] overflow-hidden mb-4"
      style={{ background: "var(--panel)", border: "2px solid rgba(239,68,68,.35)", boxShadow: "0 0 0 4px rgba(239,68,68,.06), var(--shadow-panel)" }}>
      <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #ef4444, #f97316)" }} />

      <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--hairline)" }}>
        <span className="inline-flex items-center gap-1.5 font-spot-sans font-extrabold text-[11px] uppercase tracking-[.14em]" style={{ color: "var(--red)" }}>
          <span className="spot-live-dot inline-block rounded-full" style={{ width: 7, height: 7, background: "var(--red)" }} />
          Live Now
        </span>
        <span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-muted)" }}>{game.dateLabel} · {game.statusDetail}</span>
      </div>

      <div className="grid grid-cols-3 items-center gap-4 px-5 py-5">
        <div className="flex items-center gap-3">
          <LogoPlate hex={awayHex} src={nflLogoUrl(game.away)} code={game.away} size={48} radius={14} />
          <div>
            <p className="font-spot-sans font-black text-lg leading-tight" style={{ color: "var(--text)" }}>{game.away}</p>
            <p className="font-spot-sans text-[10px]" style={{ color: "var(--text-muted)" }}>{game.qbAway ?? "Away"}</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          {game.awayScore !== undefined ? (
            <>
              <div className="flex items-center gap-3">
                <span className="font-spot-mono font-black text-3xl" style={{ color: "var(--text)" }}>{game.awayScore}</span>
                <span className="font-spot-sans font-black text-xl" style={{ color: "var(--text-ghost)" }}>—</span>
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
            <p className="font-spot-sans font-black text-lg leading-tight" style={{ color: "var(--text)" }}>{game.home}</p>
            <p className="font-spot-sans text-[10px]" style={{ color: "var(--text-muted)" }}>{game.qbHome ?? "Home"}</p>
          </div>
          <LogoPlate hex={homeHex} src={nflLogoUrl(game.home)} code={game.home} size={48} radius={14} />
        </div>
      </div>

      <div className="px-5 pb-5 flex flex-col gap-3">
        <WinProbBar awayPct={awayPct} awayHex={awayHex} homeHex={homeHex} awayCode={game.away} homeCode={game.home} />
        <div className="flex items-center gap-2 justify-center flex-wrap">
          <OddsChip label="ML"     value={`${awayPct >= 50 ? "−137" : "+124"}`} />
          <OddsChip label="Spread" value={`${awayPct >= 50 ? "−4.5" : "+4.5"}`} accent />
          <OddsChip label="Total"  value="O 48.5" />
          <OddsChip label="Edge"   value={`${game.edge}`} />
        </div>
      </div>
    </motion.button>
  );
}

// ── Fantasy-style matchup card ─────────────────────────────────────────────────

type MatchupTab = "moneyline" | "spread" | "total";

function MatchupCard({ game, onClick, isPreseason }: { game: NflGame; onClick: () => void; isPreseason: boolean }) {
  const [tab, setTab] = useState<MatchupTab>("moneyline");
  const awayHex = nflTeamHex(game.away);
  const homeHex = nflTeamHex(game.home);
  const awayPct = 100 - game.homeWinProb;
  const homePct = game.homeWinProb;
  const gc = gradeColor(game.grade);
  const isFinal = game.status === "final";

  const tabs: { key: MatchupTab; label: string }[] = [
    { key: "moneyline", label: "Moneyline" },
    { key: "spread",    label: "Spread"    },
    { key: "total",     label: "Total"     },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col rounded-[20px] overflow-hidden"
      style={{ background: "var(--panel)", border: "1px solid var(--hairline)", boxShadow: "var(--shadow-card)" }}>

      {/* Colored accent top line */}
      <div style={{ height: 3, background: isPreseason ? `linear-gradient(90deg, ${awayHex}, ${homeHex})` : `linear-gradient(90deg, var(--purple-2), #60a5fa)` }} />

      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2" style={{ borderBottom: "1px solid var(--hairline)" }}>
        <div className="flex items-center gap-2">
          <span className="font-spot-mono font-bold text-[10px] uppercase tracking-[.08em]" style={{ color: "var(--text-muted)" }}>
            {game.dateLabel} · {game.timeLabel}
          </span>
          {isPreseason && (
            <span className="font-spot-sans font-extrabold text-[9px] px-2 py-0.5 rounded-full"
              style={{ color: "var(--orange)", background: "rgba(251,146,60,.12)", border: "1px solid rgba(251,146,60,.28)" }}>
              Preseason
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isFinal && (
            <span className="font-spot-sans font-extrabold text-[10px] uppercase tracking-[.10em]" style={{ color: "var(--text-muted)" }}>Final</span>
          )}
          <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-spot-sans font-black text-[11px]"
            style={{ color: gc, background: `color-mix(in srgb, ${gc} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${gc} 25%, transparent)` }}>
            <span className="font-spot-mono">{game.edge}</span>
            <span>{game.grade}</span>
          </span>
        </div>
      </div>

      {/* Fantasy-style matchup block — click to open detail */}
      <button onClick={onClick} className="w-full text-left">
        {/* Team row with gradient bg */}
        <div className="px-4 py-4" style={{ background: `linear-gradient(120deg, ${awayHex}0f 0%, transparent 45%, ${homeHex}0c 100%)` }}>
          <div className="flex items-center justify-between gap-4">
            {/* Away */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <LogoPlate hex={awayHex} src={nflLogoUrl(game.away)} code={game.away} size={52} radius={15} />
              <div className="text-center">
                <p className="font-spot-sans font-black text-[17px] leading-tight" style={{ color: "var(--text)" }}>{game.away}</p>
                <p className="font-spot-sans text-[10px]" style={{ color: "var(--text-muted)" }}>{game.qbAway ?? "Away"}</p>
              </div>
              <span className="font-spot-mono font-black text-[11px]" style={{ color: awayPct >= homePct ? "var(--green)" : "var(--text-faint)" }}>{awayPct}%</span>
            </div>

            {/* Center */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              {isFinal && game.awayScore !== undefined ? (
                <div className="flex items-center gap-2.5">
                  <span className="font-spot-mono font-black text-2xl" style={{ color: awayPct >= homePct ? "var(--green)" : "var(--text)" }}>{game.awayScore}</span>
                  <span className="font-spot-sans font-bold text-base" style={{ color: "var(--text-ghost)" }}>–</span>
                  <span className="font-spot-mono font-black text-2xl" style={{ color: homePct > awayPct ? "var(--green)" : "var(--text)" }}>{game.homeScore}</span>
                </div>
              ) : (
                <span className="font-spot-sans font-black text-[13px] uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>VS</span>
              )}
              {isFinal && (
                <span className="font-spot-sans font-bold text-[9px] uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Final</span>
              )}
            </div>

            {/* Home */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <LogoPlate hex={homeHex} src={nflLogoUrl(game.home)} code={game.home} size={52} radius={15} />
              <div className="text-center">
                <p className="font-spot-sans font-black text-[17px] leading-tight" style={{ color: "var(--text)" }}>{game.home}</p>
                <p className="font-spot-sans text-[10px]" style={{ color: "var(--text-muted)" }}>{game.qbHome ?? "Home"}</p>
              </div>
              <span className="font-spot-mono font-black text-[11px]" style={{ color: homePct > awayPct ? "var(--green)" : "var(--text-faint)" }}>{homePct}%</span>
            </div>
          </div>
        </div>

        {/* Win prob thin bar */}
        <div className="px-4 pb-3">
          <div className="flex w-full overflow-hidden rounded-full" style={{ height: 5, background: "var(--hairline)" }}>
            <div style={{ width: `${awayPct}%`, background: awayHex }} />
            <div style={{ flex: 1, background: homeHex }} />
          </div>
        </div>
      </button>

      {/* Betting tabs */}
      <div style={{ borderTop: "1px solid var(--hairline)" }}>
        <div className="flex" style={{ borderBottom: "1px solid var(--hairline)" }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 py-2.5 font-spot-sans font-extrabold text-[11px] uppercase tracking-[.08em] transition-colors"
              style={tab === t.key
                ? { color: isPreseason ? "var(--orange)" : "var(--purple-2)", borderBottom: `2px solid ${isPreseason ? "var(--orange)" : "var(--purple-2)"}`, background: isPreseason ? "rgba(251,146,60,.04)" : "rgba(124,92,250,.04)" }
                : { color: "var(--text-muted)", borderBottom: "2px solid transparent" }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-stretch" style={{ minHeight: 52 }}>
          <button onClick={onClick} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3"
            style={{ borderRight: "1px solid var(--hairline)" }}>
            <span className="font-spot-sans font-black text-[11px] uppercase tracking-[.06em]" style={{ color: "var(--text-muted)" }}>{game.away}</span>
            <span className="font-spot-mono font-black text-[15px]" style={{ color: awayPct > 50 ? (isPreseason ? "var(--orange)" : "var(--purple-2)") : "var(--text)" }}>
              {tab === "moneyline" ? (awayPct > 50 ? `−${Math.round(awayPct * 2.2)}` : `+${Math.round((100 - awayPct) * 1.6)}`)
                : tab === "spread" ? (awayPct > 50 ? `−${((awayPct - 50) / 5).toFixed(1)}` : `+${((50 - awayPct) / 5).toFixed(1)}`)
                : `O ${(48 + (game.edge % 7)).toFixed(1)}`}
            </span>
          </button>
          <button onClick={onClick} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3">
            <span className="font-spot-sans font-black text-[11px] uppercase tracking-[.06em]" style={{ color: "var(--text-muted)" }}>{game.home}</span>
            <span className="font-spot-mono font-black text-[15px]" style={{ color: homePct > 50 ? (isPreseason ? "var(--orange)" : "var(--purple-2)") : "var(--text)" }}>
              {tab === "moneyline" ? (homePct > 50 ? `−${Math.round(homePct * 2.2)}` : `+${Math.round((100 - homePct) * 1.6)}`)
                : tab === "spread" ? (homePct > 50 ? `−${((homePct - 50) / 5).toFixed(1)}` : `+${((50 - homePct) / 5).toFixed(1)}`)
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

      {/* AI footer */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-b-[20px]"
        style={{ background: isPreseason ? "rgba(251,146,60,.05)" : "rgba(124,92,250,.05)", borderTop: `1px solid ${isPreseason ? "rgba(251,146,60,.15)" : "rgba(124,92,250,.12)"}` }}>
        <span className="inline-flex items-center gap-1.5 font-spot-sans font-extrabold text-[10px] uppercase tracking-[.10em]"
          style={{ color: isPreseason ? "var(--orange)" : "var(--purple-2)" }}>
          <Zap size={10} /> AI Edge Pick
        </span>
        <button onClick={onClick} className="font-spot-sans font-black text-[12px]"
          style={{ color: isPreseason ? "var(--orange)" : "var(--purple-soft)" }}>
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

  const activeWeekDef = WEEKS.find((w) => w.key === week)!;
  const isPreseason = activeWeekDef.type === "pre";

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

  const accentColor = isPreseason ? "var(--orange)" : "var(--purple-2)";
  const accentBg    = isPreseason ? "rgba(251,146,60,.12)" : "var(--purple-tint)";
  const accentBorder = isPreseason ? "rgba(251,146,60,.3)" : "var(--purple-line)";

  return (
    <div className="spotlight min-h-screen">
      {/* ── Page header ── */}
      <div style={{ background: "var(--panel)", borderBottom: "1px solid var(--hairline)" }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 mb-3"
                style={{ background: accentBg, border: `1px solid ${accentBorder}` }}>
                <Shield size={12} style={{ color: accentColor }} />
                <span className="font-spot-sans font-black text-[11px] uppercase tracking-[.12em]" style={{ color: accentColor }}>
                  NFL · {isPreseason ? "2026 Preseason" : "2026 Regular Season"}
                </span>
              </div>
              <h1 className="font-spot-sans font-black text-3xl sm:text-4xl uppercase leading-tight"
                style={{ color: "var(--text)", letterSpacing: "-.01em" }}>
                {isPreseason ? "Preseason" : "Regular Season"}
              </h1>
              <p className="mt-1.5 font-spot-sans text-sm" style={{ color: "var(--text-muted)" }}>
                {activeWeekDef.label} · {activeWeekDef.range} · Edge model live on every matchup
              </p>
            </div>

            {/* Stat strip */}
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { icon: BarChart2,  label: "Games",  value: games.length,  color: "var(--text)" },
                { icon: TrendingUp, label: "Live",   value: live.length,   color: "var(--red)"  },
                { icon: Users,      label: "Finals", value: finals.length, color: "var(--green)" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2.5 rounded-xl px-4 py-2.5"
                  style={{ background: "var(--panel-2)", border: "1px solid var(--hairline)" }}>
                  <s.icon size={14} style={{ color: s.color }} />
                  <div>
                    <p className="font-spot-mono font-black text-lg leading-none" style={{ color: s.color }}>{s.value}</p>
                    <p className="font-spot-sans font-bold text-[9px] uppercase tracking-[.10em] mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <WeekPills week={week} onChange={setWeek} />
        </div>
      </div>

      {/* Season timeline */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-6">
        <SeasonTimeline
          title="NFL 2026 Season"
          subtitle="Preseason Aug 6 · Regular Season Sep 10 · Super Bowl Feb 9, 2027"
          phases={NFL_2026_PHASES}
          sport="nfl"
        />
      </div>

      {/* ── Games ── */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">

        {/* Preseason / Regular section label */}
        <div className="flex items-center gap-2.5 mb-5 pb-3" style={{ borderBottom: `2px solid ${isPreseason ? "rgba(251,146,60,.25)" : "rgba(124,92,250,.25)"}` }}>
          <div className="w-1.5 h-6 rounded-full" style={{ background: accentColor }} />
          <span className="font-spot-sans font-black text-lg uppercase" style={{ color: accentColor }}>
            {isPreseason ? "Preseason" : "Regular Season"}
          </span>
          <span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-muted)" }}>
            · {activeWeekDef.label}
          </span>
        </div>

        {loading ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))" }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-[20px] animate-pulse" style={{ background: "var(--panel)", height: 340, border: "1px solid var(--hairline)" }} />
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center rounded-[20px]"
            style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: accentBg, border: `1px solid ${accentBorder}` }}>
              <Shield size={28} style={{ color: accentColor }} />
            </div>
            <p className="font-spot-sans font-black text-lg" style={{ color: "var(--text)" }}>No games scheduled</p>
            <p className="mt-1 font-spot-sans text-sm" style={{ color: "var(--text-muted)" }}>Check back closer to kickoff for this week&apos;s slate.</p>
          </div>
        ) : (
          <>
            {/* Live games */}
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
                  {upcoming.map((g) => <MatchupCard key={g.id} game={g} onClick={() => openGame(g.id)} isPreseason={isPreseason} />)}
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
                  {finals.map((g) => <MatchupCard key={g.id} game={g} onClick={() => openGame(g.id)} isPreseason={isPreseason} />)}
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
