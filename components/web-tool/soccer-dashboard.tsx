"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CircleDot, ChevronRight } from "lucide-react";
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

function GradeBadge({ grade }: { grade: string }) {
  const color = soccerGradeColor(grade);
  return (
    <span className="rounded-lg px-2 py-0.5 font-spot-sans font-black text-[11px]"
      style={{ color, background: `${color}1a`, border: `1px solid ${color}40` }}>
      {grade}
    </span>
  );
}

function MatchCard({ match, variant = "default" }: { match: SoccerMatch; variant?: "live" | "default" }) {
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
      style={{
        background: "var(--panel)",
        border: isLive
          ? `1.5px solid rgba(239,68,68,.5)`
          : "1px solid var(--hairline)",
        boxShadow: isLive ? "0 0 24px rgba(239,68,68,.12)" : undefined,
      }}>
      <div className="h-[3px]" style={{ background: isLive
        ? "linear-gradient(90deg, #ef4444, #f97316)"
        : `linear-gradient(90deg, ${match.homeTeam.hex}, ${match.awayTeam.hex})` }} />

      <div className="p-4 flex-1 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {isLive ? (
              <span className="inline-flex items-center gap-1 font-spot-sans font-extrabold text-[9px] uppercase tracking-[.10em] px-1.5 py-0.5 rounded-full"
                style={{ color: "var(--red)", background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.3)" }}>
                <span className="spot-live-dot inline-block rounded-full shrink-0" style={{ width: 5, height: 5, background: "var(--red)" }} />
                {match.minute ? `${match.minute}′` : "LIVE"}
              </span>
            ) : (
              <span className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.12em] px-1.5 py-0.5 rounded-full"
                style={{ color: def.color === "#38003c" ? "#e5e7ff" : "#fff", background: def.color, opacity: 0.85 }}>
                {def.shortLabel}
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
              <span className="font-spot-mono font-black text-[20px] leading-none" style={{ color: "var(--text)" }}>{score}</span>
            ) : (
              <span className="font-spot-mono font-bold text-[12px]" style={{ color: "var(--text-3)" }}>{prob}%</span>
            )}
          </div>
        ))}

        {/* Win prob bar */}
        {!isFinal && (
          <div className="flex h-1.5 rounded-full overflow-hidden gap-px" style={{ background: "rgba(255,255,255,.06)" }}>
            <div style={{ width: `${hPct}%`, background: match.homeTeam.hex, borderRadius: "99px 0 0 99px" }} />
            <div style={{ width: `${dPct}%`, background: "rgba(255,255,255,.18)" }} />
            <div style={{ flex: 1, background: match.awayTeam.hex, borderRadius: "0 99px 99px 0" }} />
          </div>
        )}

        {/* xG + PPDA strip */}
        <div className="flex items-center gap-3 pt-0.5">
          <div className="flex items-center gap-1">
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

const TABS: { key: Tab; label: string; color?: string }[] = [
  { key: "all", label: "All" },
  ...SOCCER_LEAGUES.map((l) => ({ key: l.key as Tab, label: l.shortLabel, color: l.color })),
];

export function SoccerDashboard({ matches, initialLeague }: { matches: SoccerMatch[]; initialLeague?: string }) {
  const [tab, setTab] = useState<Tab>((initialLeague as Tab) ?? "all");

  const filtered = useMemo(
    () => (tab === "all" ? matches : matches.filter((m) => m.league === tab)),
    [matches, tab]
  );

  const live     = filtered.filter((m) => m.status === "live");
  const upcoming = filtered.filter((m) => m.status === "pre");
  const finals   = filtered.filter((m) => m.status === "final");

  // Group upcoming + finals by league for the organized view
  const nonLive = useMemo(() => {
    const groups = SOCCER_LEAGUES
      .map((league) => {
        const up = upcoming.filter((m) => m.league === league.key);
        const fin = finals.filter((m) => m.league === league.key);
        if (!up.length && !fin.length) return null;
        return { league, upcoming: up, finals: fin };
      })
      .filter(Boolean) as { league: typeof SOCCER_LEAGUES[0]; upcoming: SoccerMatch[]; finals: SoccerMatch[] }[];
    return groups;
  }, [upcoming, finals]);

  return (
    <div className="spotlight min-h-screen">
      {/* Header */}
      <div style={{ background: "var(--panel)", borderBottom: "1px solid var(--hairline)" }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="spot-label mb-0.5" style={{ color: "var(--green)" }}>FOOTBALL / SOCCER</p>
              <h1 className="font-spot-sans font-black text-2xl sm:text-3xl uppercase" style={{ color: "var(--text)", letterSpacing: "-.01em" }}>
                Today&apos;s Fixtures
              </h1>
            </div>
            <Link href="/soccer/props"
              className="hidden sm:flex items-center gap-1.5 rounded-xl px-4 py-2 font-spot-sans font-extrabold text-[12px] transition-all hover:opacity-80"
              style={{ background: "var(--green-bg)", color: "var(--green)", border: "1px solid rgba(52,211,153,.3)" }}>
              Player Props →
            </Link>
          </div>

          {/* Stat strip */}
          <div className="flex items-center gap-4 mt-3">
            <span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-muted)" }}>
              {matches.length} matches
            </span>
            {live.length > 0 && (
              <span className="inline-flex items-center gap-1.5 font-spot-mono font-extrabold text-[11px]" style={{ color: "var(--red)" }}>
                <span className="spot-live-dot inline-block rounded-full" style={{ width: 6, height: 6, background: "var(--red)" }} />
                {live.length} live now
              </span>
            )}
            <span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-faint)" }}>
              {upcoming.length} upcoming · {finals.length} final
            </span>
          </div>

          {/* League filter tabs */}
          <div className="flex gap-1.5 mt-4 overflow-x-auto pb-1 scrollbar-none">
            {TABS.map((t) => {
              const count = t.key === "all" ? matches.length : matches.filter((m) => m.league === t.key).length;
              if (t.key !== "all" && count === 0) return null;
              const label = t.key === "all" ? "All" : t.label;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 font-spot-sans font-bold text-[11px] transition-all whitespace-nowrap"
                  style={tab === t.key
                    ? { background: "var(--green-bg)", color: "var(--green)", border: "1px solid rgba(52,211,153,.3)" }
                    : { background: "var(--panel-2)", color: "var(--text-muted)", border: "1px solid var(--hairline)" }}>
                  {t.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} />}
                  {label}
                  {count > 0 && <span className="opacity-55 font-spot-mono text-[9px]">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5 space-y-6">

        {/* ── LIVE section — full-width, prominent ── */}
        {live.length > 0 && (
          <div className="rounded-[22px] overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(239,68,68,.08), rgba(11,13,21,0) 60%)", border: "1.5px solid rgba(239,68,68,.35)", boxShadow: "0 0 40px rgba(239,68,68,.08)" }}>
            <div className="flex items-center gap-3 px-5 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(239,68,68,.15)" }}>
              <span className="inline-flex items-center gap-1.5 font-spot-sans font-black text-[13px] uppercase tracking-[.06em]" style={{ color: "#ef4444" }}>
                <span className="spot-live-dot inline-block rounded-full" style={{ width: 8, height: 8, background: "#ef4444" }} />
                Live Now
              </span>
              <span className="font-spot-mono font-bold text-[11px] rounded-full px-2.5 py-0.5"
                style={{ color: "#ef4444", background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.25)" }}>
                {live.length} {live.length === 1 ? "match" : "matches"}
              </span>
            </div>
            <div className="p-4">
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
                {live.map((m) => <MatchCard key={m.id} match={m} variant="live" />)}
              </div>
            </div>
          </div>
        )}

        {/* ── By league sections ── */}
        {nonLive.length > 0 ? nonLive.map(({ league: def, upcoming: up, finals: fin }) => (
          <section key={def.key}>
            {/* League header */}
            <div className="flex items-center gap-3 mb-3.5">
              <div className="w-[3px] h-5 rounded-full" style={{ background: def.color }} />
              <span className="font-spot-sans font-black text-[14px] uppercase tracking-[-0.01em]" style={{ color: "var(--text)" }}>
                {def.label}
              </span>
              <span className="font-spot-sans text-[10px]" style={{ color: "var(--text-faint)" }}>{def.country}</span>
              <div className="flex-1 h-px" style={{ background: `${def.color}28` }} />
              <Link href={`/soccer/leagues`}
                className="flex items-center gap-0.5 font-spot-sans font-extrabold text-[10px] shrink-0"
                style={{ color: "var(--text-dim)" }}>
                {def.shortLabel} <ChevronRight size={10} />
              </Link>
            </div>

            {up.length > 0 && (
              <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
                {up.map((m) => <MatchCard key={m.id} match={m} />)}
              </div>
            )}
            {fin.length > 0 && (
              <>
                <p className="spot-label mb-2.5 mt-1" style={{ color: "var(--text-faint)", fontSize: 9 }}>FINAL</p>
                <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
                  {fin.map((m) => <MatchCard key={m.id} match={m} />)}
                </div>
              </>
            )}
          </section>
        )) : live.length === 0 && (
          <div className="text-center py-20">
            <div className="flex justify-center mb-3"><CircleDot size={36} style={{ color: "var(--text-dim)" }} /></div>
            <p className="font-spot-sans font-bold text-sm" style={{ color: "var(--text-muted)" }}>No fixtures scheduled today</p>
            <p className="font-spot-sans text-[12px] mt-1" style={{ color: "var(--text-faint)" }}>Check back tomorrow for matchday data</p>
          </div>
        )}
      </div>
    </div>
  );
}
