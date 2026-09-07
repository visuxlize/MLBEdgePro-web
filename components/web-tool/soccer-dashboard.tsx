"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { SoccerMatch, SoccerLeagueKey } from "@/lib/soccer/types";
import { SOCCER_LEAGUES, leagueDef } from "@/lib/soccer/leagues";
import { soccerMatchEdge, soccerGradeColor } from "@/lib/soccer/analytics";

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit", timeZone: "America/New_York",
    }) + " ET";
  } catch { return "TBD"; }
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch { return ""; }
}

function GradeBadge({ grade }: { grade: string }) {
  const color = soccerGradeColor(grade);
  return (
    <span className="rounded-lg px-2 py-0.5 font-spot-sans font-black text-[11px]"
      style={{ color, background: `${color}1a`, border: `1px solid ${color}40` }}>
      {grade}
    </span>
  );
}

function MatchCard({ match }: { match: SoccerMatch }) {
  const edge = soccerMatchEdge(match);
  const def = leagueDef(match.league);
  const isLive = match.status === "live";
  const isFinal = match.status === "final";

  const totalProb = edge.homeWinProb + edge.drawProb + edge.awayWinProb;
  const hPct = Math.round((edge.homeWinProb / totalProb) * 100);
  const dPct = Math.round((edge.drawProb / totalProb) * 100);
  const aPct = 100 - hPct - dPct;

  return (
    <div className="rounded-[18px] overflow-hidden flex flex-col"
      style={{ background: "var(--panel)", border: isLive ? `1px solid rgba(239,68,68,.35)` : "1px solid var(--hairline)" }}>

      {/* Top accent bar */}
      <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${match.homeTeam.hex}, ${match.awayTeam.hex})` }} />

      <div className="p-4 flex-1 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.12em] px-2 py-0.5 rounded-full"
              style={{ color: def.color === "#38003c" ? "#e5e7ff" : "#fff", background: def.color, opacity: 0.9 }}>
              {def.shortLabel}
            </span>
            {isLive && (
              <span className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.10em] px-1.5 py-0.5 rounded-full"
                style={{ color: "var(--red)", background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.3)" }}>
                {match.minute ? `${match.minute}′` : "LIVE"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-spot-mono font-bold text-[10px]" style={{ color: "var(--text-muted)" }}>
              {isFinal ? "FINAL" : isLive ? "LIVE" : fmtTime(match.date)}
            </span>
            <GradeBadge grade={edge.grade} />
          </div>
        </div>

        {/* Teams */}
        {[
          { team: match.homeTeam, score: match.homeScore, prob: hPct },
          { team: match.awayTeam, score: match.awayScore, prob: aPct },
        ].map(({ team, score, prob }, i) => (
          <div key={i} className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={team.logo} alt={team.shortName} className="w-7 h-7 object-contain shrink-0"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            <span className="flex-1 font-spot-sans font-extrabold text-sm truncate" style={{ color: "var(--text)" }}>
              {team.shortName}
            </span>
            {(isLive || isFinal) && score != null ? (
              <span className="font-spot-mono font-black text-[18px]" style={{ color: "var(--text)" }}>{score}</span>
            ) : (
              <span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-3)" }}>{prob}%</span>
            )}
          </div>
        ))}

        {/* Win prob bar (3-way) */}
        {!isFinal && (
          <div className="flex h-1.5 rounded-full overflow-hidden gap-px" style={{ background: "rgba(255,255,255,.06)" }}>
            <div style={{ width: `${hPct}%`, background: match.homeTeam.hex, borderRadius: "99px 0 0 99px" }} />
            <div style={{ width: `${dPct}%`, background: "rgba(255,255,255,.2)" }} />
            <div style={{ flex: 1, background: match.awayTeam.hex, borderRadius: "0 99px 99px 0" }} />
          </div>
        )}

        {/* xG + PPDA strip */}
        <div className="flex items-center gap-3 pt-0.5">
          <div className="flex items-center gap-1 flex-1">
            <span className="font-spot-mono font-bold text-[9px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>xG</span>
            <span className="font-spot-mono font-extrabold text-[11px]" style={{ color: "var(--green)" }}>{edge.homeXg}</span>
            <span className="font-spot-mono text-[9px]" style={{ color: "var(--text-dim)" }}>–</span>
            <span className="font-spot-mono font-extrabold text-[11px]" style={{ color: "var(--text-3)" }}>{edge.awayXg}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-spot-mono font-bold text-[9px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>PPDA</span>
            <span className="font-spot-mono font-extrabold text-[11px]" style={{ color: "var(--text-3)" }}>{edge.homePpda}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-spot-mono font-bold text-[9px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>POSS</span>
            <span className="font-spot-mono font-extrabold text-[11px]" style={{ color: "var(--text-3)" }}>{edge.possession}%</span>
          </div>
        </div>

        {/* Model pick */}
        <div className="rounded-xl px-3 py-2" style={{ background: `${soccerGradeColor(edge.grade)}10`, border: `1px solid ${soccerGradeColor(edge.grade)}22` }}>
          <p className="font-spot-sans font-extrabold text-[10px] uppercase tracking-[.08em]" style={{ color: soccerGradeColor(edge.grade) }}>
            MODEL: {edge.pick}
          </p>
          <p className="font-spot-sans text-[10px] mt-0.5 leading-snug" style={{ color: "var(--text-muted)" }}>
            {edge.pickReason}
          </p>
        </div>
      </div>
    </div>
  );
}

type Tab = SoccerLeagueKey | "all";

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: "all",         label: "All",      emoji: "🌍" },
  { key: "epl",         label: "EPL",      emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { key: "laliga",      label: "La Liga",  emoji: "🇪🇸" },
  { key: "seriea",      label: "Serie A",  emoji: "🇮🇹" },
  { key: "bundesliga",  label: "Bundesliga", emoji: "🇩🇪" },
  { key: "ligue1",      label: "Ligue 1",  emoji: "🇫🇷" },
  { key: "ucl",         label: "UCL",      emoji: "⭐" },
  { key: "europa",      label: "UEL",      emoji: "🟠" },
  { key: "mls",         label: "MLS",      emoji: "🇺🇸" },
  { key: "ligamx",      label: "Liga MX",  emoji: "🇲🇽" },
  { key: "brasileirao", label: "Brasileirão", emoji: "🇧🇷" },
];

export function SoccerDashboard({ matches }: { matches: SoccerMatch[] }) {
  const [tab, setTab] = useState<Tab>("all");

  const filtered = useMemo(
    () => (tab === "all" ? matches : matches.filter((m) => m.league === tab)),
    [matches, tab]
  );

  const live     = filtered.filter((m) => m.status === "live");
  const upcoming = filtered.filter((m) => m.status === "pre");
  const finals   = filtered.filter((m) => m.status === "final");

  const statTiles = [
    { label: "Matches",  value: filtered.length, color: "var(--text)" },
    { label: "Live",     value: live.length,      color: "var(--red)" },
    { label: "Upcoming", value: upcoming.length,  color: "var(--green)" },
    { label: "Final",    value: finals.length,    color: "var(--text-muted)" },
  ];

  return (
    <div className="spotlight min-h-screen">
      {/* Header */}
      <div style={{ background: "var(--panel)", borderBottom: "1px solid var(--hairline)" }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="spot-label mb-0.5" style={{ color: "var(--green)" }}>FOOTBALL</p>
              <h1 className="font-spot-sans font-black text-2xl sm:text-3xl uppercase" style={{ color: "var(--text)", letterSpacing: "-.01em" }}>
                ⚽ Today&apos;s Fixtures
              </h1>
            </div>
            <Link href="/soccer/props"
              className="hidden sm:flex items-center gap-1.5 rounded-xl px-4 py-2 font-spot-sans font-extrabold text-[12px] transition-all hover:opacity-80"
              style={{ background: "var(--green-bg)", color: "var(--green)", border: "1px solid rgba(52,211,153,.3)" }}>
              Player Props →
            </Link>
          </div>

          {/* League tabs */}
          <div className="flex gap-1.5 mt-4 overflow-x-auto pb-1 scrollbar-none">
            {TABS.map((t) => {
              const count = t.key === "all" ? matches.length : matches.filter((m) => m.league === t.key).length;
              if (t.key !== "all" && count === 0) return null;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 font-spot-sans font-bold text-[11px] transition-all whitespace-nowrap"
                  style={tab === t.key
                    ? { background: "var(--green-bg)", color: "var(--green)", border: "1px solid rgba(52,211,153,.3)" }
                    : { background: "var(--panel-2)", color: "var(--text-muted)", border: "1px solid var(--hairline)" }}>
                  <span>{t.emoji}</span>
                  <span>{t.label}</span>
                  {count > 0 && <span className="opacity-60 font-spot-mono text-[9px]">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5 space-y-6">
        {/* Stat strip */}
        <div className="grid grid-cols-4 gap-2">
          {statTiles.map((s) => (
            <div key={s.label} className="rounded-2xl px-3 py-2.5 text-center"
              style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
              <p className="font-spot-mono font-black text-xl leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="font-spot-sans font-semibold text-[9px] uppercase tracking-wider mt-1" style={{ color: "var(--text-faint)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Live */}
        {live.length > 0 && (
          <section>
            <p className="spot-label mb-3" style={{ color: "var(--red)" }}>Live Now · {live.length}</p>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
              {live.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          </section>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section>
            <p className="spot-label mb-3" style={{ color: "var(--green)" }}>Upcoming · {upcoming.length}</p>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
              {upcoming.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          </section>
        )}

        {/* Final */}
        {finals.length > 0 && (
          <section>
            <p className="spot-label mb-3" style={{ color: "var(--text-faint)" }}>Final · {finals.length}</p>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
              {finals.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          </section>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">⚽</p>
            <p className="font-spot-sans font-bold text-sm" style={{ color: "var(--text-muted)" }}>No fixtures scheduled today</p>
            <p className="font-spot-sans text-[12px] mt-1" style={{ color: "var(--text-faint)" }}>Check back tomorrow for matchday data</p>
          </div>
        )}
      </div>
    </div>
  );
}
