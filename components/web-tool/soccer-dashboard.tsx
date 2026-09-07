"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  CircleDot, Activity, Calendar, BarChart3, Users,
  ChevronRight, ExternalLink,
} from "lucide-react";
import type { SoccerMatch, SoccerLeagueKey } from "@/lib/soccer/types";
import { SOCCER_LEAGUES, leagueDef } from "@/lib/soccer/leagues";
import { soccerMatchEdge, soccerGradeColor, getSoccerPlayerProps } from "@/lib/soccer/analytics";
import { SoccerMatchExpanded } from "./soccer-match-expanded";

function seed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }) + " ET";
  } catch { return "TBD"; }
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch { return "—"; }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: "live" | "pre" | "final" }) {
  const cfg = {
    live:  { label: "Live Now",           color: "#ef4444" },
    pre:   { label: "Upcoming",           color: "#fb923c" },
    final: { label: "Analysis Complete",  color: "#34d399" },
  }[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.color }} />
      <span className="font-spot-sans text-[10px]" style={{ color: cfg.color }}>{cfg.label}</span>
    </span>
  );
}

function UpcomingCard({ match }: { match?: SoccerMatch }) {
  if (!match) {
    return (
      <div className="rounded-[20px] p-5 flex flex-col justify-center items-center gap-2" style={{ background: "var(--panel)", border: "1px solid var(--hairline)", minHeight: 170 }}>
        <CircleDot size={28} style={{ color: "var(--text-dim)" }} />
        <p className="font-spot-sans text-[12px]" style={{ color: "var(--text-muted)" }}>No upcoming fixtures</p>
      </div>
    );
  }
  const def = leagueDef(match.league);
  return (
    <div className="rounded-[20px] p-5 flex flex-col gap-4" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
      <div className="flex items-center justify-between">
        <p className="font-spot-sans font-extrabold text-[13px]" style={{ color: "var(--text)" }}>Upcoming Match</p>
        <span className="font-spot-sans font-bold text-[9px] px-2 py-0.5 rounded-full"
          style={{ color: def.color === "#38003c" || def.color === "#091c3e" ? "#e5e7ff" : "#fff", background: def.color }}>
          {def.shortLabel}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col items-center gap-1.5 flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={match.homeTeam.logo} alt={match.homeTeam.abbr} className="w-10 h-10 object-contain"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }} />
          <p className="font-spot-sans font-extrabold text-[11px] text-center" style={{ color: "var(--text)" }}>{match.homeTeam.abbr}</p>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <p className="font-spot-mono font-black text-base" style={{ color: "var(--text-dim)" }}>VS</p>
          <div className="w-px h-4" style={{ background: "var(--hairline)" }} />
        </div>

        <div className="flex flex-col items-center gap-1.5 flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={match.awayTeam.logo} alt={match.awayTeam.abbr} className="w-10 h-10 object-contain"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }} />
          <p className="font-spot-sans font-extrabold text-[11px] text-center" style={{ color: "var(--text)" }}>{match.awayTeam.abbr}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px]">
        <span className="font-spot-mono" style={{ color: "var(--text-muted)" }}>{fmtDate(match.date)}</span>
        <span className="font-spot-mono" style={{ color: "var(--text-muted)" }}>{fmtTime(match.date)}</span>
      </div>
      {match.venue && (
        <p className="font-spot-sans text-[9px] -mt-2" style={{ color: "var(--text-dim)" }}>{match.venue}</p>
      )}
    </div>
  );
}

function LiveNowCard({ match }: { match?: SoccerMatch }) {
  if (!match) {
    return (
      <div className="rounded-[20px] p-5 flex flex-col justify-center items-center gap-2" style={{ background: "var(--panel)", border: "1px solid var(--hairline)", minHeight: 170 }}>
        <Activity size={28} style={{ color: "var(--text-dim)" }} />
        <p className="font-spot-sans text-[12px]" style={{ color: "var(--text-muted)" }}>No live matches right now</p>
      </div>
    );
  }
  const edge = soccerMatchEdge(match);
  const totalProb = edge.homeWinProb + edge.drawProb + edge.awayWinProb;
  const hPct = Math.round((edge.homeWinProb / totalProb) * 100);
  const aPct = Math.round((edge.awayWinProb / totalProb) * 100);

  return (
    <div className="rounded-[20px] overflow-hidden" style={{ background: "var(--panel)", border: "1.5px solid rgba(239,68,68,.35)", boxShadow: "0 0 28px rgba(239,68,68,.1)" }}>
      <div className="h-[3px]" style={{ background: "linear-gradient(90deg,#ef4444,#f97316)" }} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 font-spot-sans font-black text-[10px] uppercase tracking-[.08em]" style={{ color: "#ef4444" }}>
            <span className="spot-live-dot inline-block w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
            Live Now
          </span>
          <span className="font-spot-mono font-extrabold text-[12px] px-2 py-0.5 rounded-full"
            style={{ color: "#ef4444", background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.2)" }}>
            {match.minute ? `${match.minute}′` : "LIVE"}
          </span>
        </div>

        {/* Teams + score */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-col items-center gap-1 flex-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={match.homeTeam.logo} alt={match.homeTeam.abbr} className="w-9 h-9 object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }} />
            <p className="font-spot-sans font-extrabold text-[11px]" style={{ color: "var(--text)" }}>{match.homeTeam.abbr}</p>
          </div>

          <div className="text-center">
            <p className="font-spot-mono font-black text-3xl" style={{ color: "var(--text)", letterSpacing: "-.04em" }}>
              {match.homeScore ?? 0}–{match.awayScore ?? 0}
            </p>
          </div>

          <div className="flex flex-col items-center gap-1 flex-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={match.awayTeam.logo} alt={match.awayTeam.abbr} className="w-9 h-9 object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }} />
            <p className="font-spot-sans font-extrabold text-[11px]" style={{ color: "var(--text)" }}>{match.awayTeam.abbr}</p>
          </div>
        </div>

        {/* Win prob */}
        <div className="flex items-center justify-between text-[9px] mb-1.5">
          <span style={{ color: "var(--text-muted)" }}>{hPct}% Win</span>
          <span style={{ color: "var(--text-muted)" }}>{aPct}% Win</span>
        </div>
        <div className="flex h-1.5 rounded-full overflow-hidden">
          <div style={{ width: `${hPct}%`, background: match.homeTeam.hex, borderRadius: "99px 0 0 99px" }} />
          <div style={{ flex: 1, background: match.awayTeam.hex, borderRadius: "0 99px 99px 0" }} />
        </div>
      </div>
    </div>
  );
}

function StandingCard({ matches }: { matches: SoccerMatch[] }) {
  // Use EPL teams from matches, or show top league
  const eplMatches = matches.filter((m) => m.league === "epl");
  const featured = eplMatches.length > 0 ? eplMatches : matches.slice(0, 4);
  const def = leagueDef(featured[0]?.league ?? "epl");

  // Collect unique teams and seed standings
  const teams: { abbr: string; logo: string; hex: string }[] = [];
  for (const m of featured) {
    if (!teams.find((t) => t.abbr === m.homeTeam.abbr)) teams.push({ abbr: m.homeTeam.abbr, logo: m.homeTeam.logo, hex: m.homeTeam.hex });
    if (!teams.find((t) => t.abbr === m.awayTeam.abbr)) teams.push({ abbr: m.awayTeam.abbr, logo: m.awayTeam.logo, hex: m.awayTeam.hex });
  }

  const rows = teams.slice(0, 4).map((t, i) => {
    const s = seed(def.key + t.abbr + i);
    const p = 6 + (s % 5);
    const w = Math.min(p, s % (p + 1));
    const d = Math.min(p - w, (s >> 2) % (p - w + 1));
    const l = p - w - d;
    return { pos: 0, ...t, p, w, d, l, pts: w * 3 + d };
  }).sort((a, b) => b.pts - a.pts).map((t, i) => ({ ...t, pos: i + 1 }));

  const leagueColorFg = def.color === "#38003c" || def.color === "#091c3e" ? "#e5e7ff" : "#fff";

  return (
    <div className="rounded-[20px] overflow-hidden" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
      <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: "1px solid var(--hairline)" }}>
        <p className="font-spot-sans font-extrabold text-[13px]" style={{ color: "var(--text)" }}>Group Standing</p>
        <span className="font-spot-sans font-bold text-[9px] px-2 py-0.5 rounded-full"
          style={{ color: leagueColorFg, background: def.color }}>{def.shortLabel}</span>
      </div>
      <div className="grid px-4 py-2 font-spot-mono font-bold text-[9px] uppercase tracking-wider"
        style={{ gridTemplateColumns: "20px 1fr 24px 24px 24px 30px", gap: "0 6px", color: "var(--text-faint)", borderBottom: "1px solid var(--hairline)" }}>
        {["P", "Club", "W", "D", "L", "Pts"].map((h, i) => (
          <span key={h} className={i === 0 ? "text-center" : i > 1 ? "text-right" : ""}>{h}</span>
        ))}
      </div>
      {rows.map((row) => (
        <div key={row.pos} className="grid items-center px-4 py-2.5"
          style={{ gridTemplateColumns: "20px 1fr 24px 24px 24px 30px", gap: "0 6px", borderBottom: "1px solid var(--hairline)" }}>
          <span className="font-spot-mono font-bold text-[10px] text-center"
            style={{ color: row.pos <= 2 ? "var(--green)" : "var(--text-faint)" }}>{row.pos}</span>
          <div className="flex items-center gap-1.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={row.logo} alt={row.abbr} className="w-4 h-4 object-contain shrink-0"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            <span className="font-spot-sans font-bold text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{row.abbr}</span>
          </div>
          {[row.w, row.d, row.l].map((v, i) => (
            <span key={i} className="font-spot-mono text-[10px] text-right" style={{ color: "var(--text-3)" }}>{v}</span>
          ))}
          <span className="font-spot-mono font-black text-[11px] text-right" style={{ color: "var(--green)" }}>{row.pts}</span>
        </div>
      ))}
    </div>
  );
}

function MatchTableRow({
  match, index, onSelect,
}: {
  match: SoccerMatch;
  index: number;
  onSelect: (m: SoccerMatch) => void;
}) {
  const def = leagueDef(match.league);
  return (
    <div className="grid items-center px-5 py-3 hover:bg-white/[.02] transition-colors cursor-pointer"
      style={{ gridTemplateColumns: "28px 1fr 64px 1fr 80px", gap: "0 12px", borderBottom: "1px solid var(--hairline)" }}
      onClick={() => onSelect(match)}>
      <span className="font-spot-mono text-[11px] text-center" style={{ color: "var(--text-dim)" }}>{index}</span>

      {/* Match */}
      <div className="flex items-center gap-2 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={match.homeTeam.logo} alt="" className="w-5 h-5 object-contain shrink-0" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        <span className="font-spot-sans font-bold text-[11px]" style={{ color: "var(--text-muted)" }}>vs</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={match.awayTeam.logo} alt="" className="w-5 h-5 object-contain shrink-0" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        <div className="min-w-0">
          <p className="font-spot-sans font-extrabold text-[11px] truncate" style={{ color: "var(--text)" }}>
            {match.homeTeam.abbr} – {match.awayTeam.abbr}
          </p>
          <span className="font-spot-sans text-[9px]" style={{ color: def.color === "#38003c" ? "#a78bfa" : def.color }}>{def.shortLabel}</span>
        </div>
      </div>

      {/* Date */}
      <p className="font-spot-mono text-[10px]" style={{ color: "var(--text-muted)" }}>{fmtDate(match.date)}</p>

      {/* Status */}
      <StatusDot status={match.status} />

      {/* Action */}
      <button className="flex items-center gap-1 font-spot-sans font-extrabold text-[10px] transition-opacity hover:opacity-80"
        style={{ color: "var(--green)" }}>
        View details <ExternalLink size={10} />
      </button>
    </div>
  );
}

function PlayerSpotlight() {
  const props = getSoccerPlayerProps();
  const top = props[0];
  if (!top) return null;

  const gradeColor = soccerGradeColor(top.grade);
  const stats = [
    { label: "Rating",    value: top.modelProj.toFixed(1) },
    { label: "Accuracy",  value: `${top.probability}%` },
    { label: "Edge",      value: `${top.edge}%` },
    { label: "Conf",      value: `${top.probability}%` },
  ];

  return (
    <div className="rounded-[20px] overflow-hidden" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
      {/* Header with player image */}
      <div className="relative h-20 flex items-end px-4 pb-0 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${top.teamHex}30 0%, var(--panel-2) 100%)` }}>
        <div className="absolute right-0 bottom-0 w-24 h-24 opacity-60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://a.espncdn.com/i/headshots/soccer/players/full/${top.espnPlayerId}.png`}
            alt={top.playerName}
            className="w-full h-full object-contain object-bottom"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </div>
        <div className="relative pb-3">
          <p className="spot-label" style={{ color: gradeColor }}>AI TOP PICK</p>
          <p className="font-spot-sans font-black text-[14px]" style={{ color: "var(--text)" }}>{top.playerName}</p>
          <p className="font-spot-sans text-[10px]" style={{ color: "var(--text-muted)" }}>{top.teamAbbr} · {top.position}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 p-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[12px] px-3 py-2.5"
            style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--hairline)" }}>
            <p className="font-spot-mono font-black text-base leading-tight" style={{ color: "var(--text)" }}>{s.value}</p>
            <p className="font-spot-sans font-bold text-[9px] uppercase tracking-wider mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4">
        <div className="rounded-[12px] px-3 py-2" style={{ background: `${gradeColor}0f`, border: `1px solid ${gradeColor}25` }}>
          <p className="font-spot-sans font-extrabold text-[10px]" style={{ color: gradeColor }}>
            {top.market} {top.side} {top.line}
          </p>
          <p className="font-spot-mono text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            vs {top.opponent} · {top.matchDate} · {top.odds}
          </p>
        </div>
      </div>
    </div>
  );
}

function TopLeagueCard() {
  const def = SOCCER_LEAGUES[0]; // EPL
  return (
    <div className="rounded-[20px] p-4 flex items-center gap-4"
      style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
      <div className="w-12 h-12 rounded-[14px] overflow-hidden shrink-0 flex items-center justify-center"
        style={{ background: `${def.color}20`, border: `1px solid ${def.color}40` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`https://a.espncdn.com/i/leaguelogos/soccer/500/${def.espnLeagueId}.png`} alt={def.label} className="w-full h-full object-contain p-1"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="spot-label mb-0.5" style={{ color: def.color === "#38003c" ? "#a78bfa" : def.color }}>FEATURED LEAGUE</p>
        <p className="font-spot-sans font-black text-[14px]" style={{ color: "var(--text)" }}>{def.label}</p>
        <p className="font-spot-sans text-[10px]" style={{ color: "var(--text-muted)" }}>{def.country} · {def.teams} clubs</p>
      </div>
      <Link href="/soccer/leagues" className="shrink-0" style={{ color: "var(--text-dim)" }}>
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}

// ── League filter tabs ────────────────────────────────────────────────────────

type Tab = SoccerLeagueKey | "all";

const TABS: { key: Tab; label: string; color?: string }[] = [
  { key: "all", label: "All" },
  ...SOCCER_LEAGUES.map((l) => ({ key: l.key as Tab, label: l.shortLabel, color: l.color })),
];

// ── Main dashboard ────────────────────────────────────────────────────────────

export function SoccerDashboard({ matches, initialLeague }: { matches: SoccerMatch[]; initialLeague?: string }) {
  const [tab, setTab] = useState<Tab>((initialLeague as Tab) ?? "all");
  const [expandedMatch, setExpandedMatch] = useState<SoccerMatch | null>(null);

  const filtered = useMemo(
    () => (tab === "all" ? matches : matches.filter((m) => m.league === tab)),
    [matches, tab],
  );

  const live = filtered.filter((m) => m.status === "live");
  const upcoming = filtered.filter((m) => m.status === "pre");
  const finals = filtered.filter((m) => m.status === "final");
  const allOrdered = [...live, ...upcoming, ...finals];

  return (
    <div className="spotlight min-h-screen">

      {/* ── Page header ── */}
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

          {/* League filter tabs */}
          <div className="flex gap-1.5 mt-4 overflow-x-auto pb-1 scrollbar-none">
            {TABS.map((t) => {
              const count = t.key === "all" ? matches.length : matches.filter((m) => m.league === t.key).length;
              if (t.key !== "all" && count === 0) return null;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 font-spot-sans font-bold text-[11px] transition-all whitespace-nowrap"
                  style={tab === t.key
                    ? { background: "var(--green-bg)", color: "var(--green)", border: "1px solid rgba(52,211,153,.3)" }
                    : { background: "var(--panel-2)", color: "var(--text-muted)", border: "1px solid var(--hairline)" }}>
                  {t.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} />}
                  {t.key === "all" ? "All" : t.label}
                  {count > 0 && <span className="opacity-55 font-spot-mono text-[9px]">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5 space-y-5">

        {/* ── Row 1: CTA hero + stat tiles ── */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {/* CTA hero */}
          <div className="rounded-[22px] p-6 flex flex-col justify-between"
            style={{ background: "linear-gradient(135deg, rgba(52,211,153,.08) 0%, var(--panel) 60%)", border: "1px solid rgba(52,211,153,.15)", minHeight: 200 }}>
            <div>
              <p className="spot-label mb-1" style={{ color: "var(--green)" }}>FOOTBALL EDGE PRO</p>
              <h2 className="font-spot-sans font-black text-xl sm:text-2xl leading-tight uppercase" style={{ color: "var(--text)" }}>
                Ready to Analyze a Match?
              </h2>
              <p className="font-spot-sans text-[12px] mt-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Real-time xG, PPDA, and AI-powered win probability across {SOCCER_LEAGUES.length} leagues. Click any match for deep analysis.
              </p>
            </div>
            <Link href="/soccer/props"
              className="mt-5 flex items-center justify-center gap-2 rounded-[14px] py-3 font-spot-sans font-black text-[13px] uppercase tracking-wide transition-all hover:opacity-85"
              style={{ background: "linear-gradient(135deg,#34d399,#059669)", color: "#fff" }}>
              Start Analysis →
            </Link>
          </div>

          {/* 2 × 2 stat tiles */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { Icon: Calendar,  label: "Upcoming",     value: upcoming.length,         sub: "matches today",       color: "#34d399" },
              { Icon: Activity,  label: "Live Now",      value: live.length,             sub: "in progress",         color: "#ef4444" },
              { Icon: BarChart3, label: "Total Fixtures",value: matches.length,          sub: "available today",     color: "#fb923c" },
              { Icon: Users,     label: "Leagues",       value: SOCCER_LEAGUES.length,   sub: "competitions tracked",color: "#a78bfa" },
            ].map(({ Icon, label, value, sub, color }) => (
              <div key={label} className="rounded-[18px] p-4 flex flex-col gap-2.5"
                style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
                <Icon size={16} style={{ color }} />
                <div>
                  <p className="font-spot-mono font-black text-2xl leading-none" style={{ color: "var(--text)" }}>{value}</p>
                  <p className="font-spot-sans font-bold text-[10px] uppercase tracking-wider mt-1" style={{ color }}>{label}</p>
                  <p className="font-spot-sans text-[9px] mt-0.5" style={{ color: "var(--text-faint)" }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Row 2: Upcoming | Live Now | Standing ── */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <UpcomingCard match={upcoming[0]} />
          <LiveNowCard match={live[0]} />
          {matches.length > 0 ? <StandingCard matches={matches} /> : (
            <div className="rounded-[20px] p-5 flex items-center justify-center" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
              <p className="font-spot-sans text-[12px]" style={{ color: "var(--text-muted)" }}>No standing data</p>
            </div>
          )}
        </div>

        {/* ── Row 3: Match table + spotlight ── */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "minmax(0, 2fr) minmax(260px, 1fr)" }}>

          {/* Match analysis table */}
          <div className="rounded-[22px] overflow-hidden" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--hairline)" }}>
              <p className="font-spot-sans font-extrabold text-[13px]" style={{ color: "var(--text)" }}>Match Analysis</p>
              <div className="flex items-center gap-2">
                <span className="font-spot-mono font-bold text-[10px] px-2 py-0.5 rounded-full"
                  style={{ color: "var(--text-muted)", background: "rgba(255,255,255,.05)", border: "1px solid var(--hairline)" }}>
                  {allOrdered.length} matches
                </span>
              </div>
            </div>

            {/* Table header */}
            <div className="grid items-center px-5 py-2 font-spot-mono font-bold text-[9px] uppercase tracking-wider"
              style={{ gridTemplateColumns: "28px 1fr 64px 1fr 80px", gap: "0 12px", color: "var(--text-faint)", borderBottom: "1px solid var(--hairline)" }}>
              {["##", "Match", "Date", "Status", "Action"].map((h) => <span key={h}>{h}</span>)}
            </div>

            {allOrdered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <CircleDot size={36} style={{ color: "var(--text-dim)" }} />
                <p className="font-spot-sans font-bold text-sm" style={{ color: "var(--text-muted)" }}>No fixtures scheduled today</p>
                <p className="font-spot-sans text-[12px]" style={{ color: "var(--text-faint)" }}>Check back tomorrow for matchday data</p>
              </div>
            ) : (
              allOrdered.slice(0, 10).map((match, i) => (
                <MatchTableRow key={match.id} match={match} index={i + 1} onSelect={setExpandedMatch} />
              ))
            )}
          </div>

          {/* Right spotlights */}
          <div className="space-y-4">
            <PlayerSpotlight />
            <TopLeagueCard />
          </div>
        </div>

        {/* ── Live games prominent section (if any) ── */}
        {live.length > 0 && (
          <div className="rounded-[22px] overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(239,68,68,.07), rgba(11,13,21,0) 60%)", border: "1.5px solid rgba(239,68,68,.3)", boxShadow: "0 0 40px rgba(239,68,68,.08)" }}>
            <div className="flex items-center gap-3 px-5 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(239,68,68,.14)" }}>
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
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                {live.map((m) => (
                  <button key={m.id} className="text-left rounded-[18px] overflow-hidden transition-transform hover:scale-[1.01]"
                    style={{ background: "var(--panel)", border: "1.5px solid rgba(239,68,68,.35)" }}
                    onClick={() => setExpandedMatch(m)}>
                    <MiniMatchCard match={m} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Expanded analysis modal ── */}
      {expandedMatch && (
        <SoccerMatchExpanded match={expandedMatch} onClose={() => setExpandedMatch(null)} />
      )}
    </div>
  );
}

function MiniMatchCard({ match }: { match: SoccerMatch }) {
  const edge = soccerMatchEdge(match);
  const gradeColor = soccerGradeColor(edge.grade);
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1 font-spot-sans font-extrabold text-[9px] uppercase tracking-[.10em] px-1.5 py-0.5 rounded-full"
          style={{ color: "var(--red)", background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.3)" }}>
          <span className="spot-live-dot inline-block rounded-full shrink-0" style={{ width: 5, height: 5, background: "var(--red)" }} />
          {match.minute ? `${match.minute}′` : "LIVE"}
        </span>
        <span className="font-spot-sans font-extrabold text-[11px] px-2 py-0.5 rounded-lg"
          style={{ color: gradeColor, background: `${gradeColor}1a`, border: `1px solid ${gradeColor}40` }}>
          {edge.grade}
        </span>
      </div>
      {[
        { team: match.homeTeam, score: match.homeScore },
        { team: match.awayTeam, score: match.awayScore },
      ].map(({ team, score }, i) => (
        <div key={i} className="flex items-center gap-2.5 mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={team.logo} alt={team.shortName} className="w-6 h-6 object-contain shrink-0"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          <span className="flex-1 font-spot-sans font-extrabold text-[13px]" style={{ color: "var(--text)" }}>{team.shortName}</span>
          {score != null && (
            <span className="font-spot-mono font-black text-xl" style={{ color: "var(--text)" }}>{score}</span>
          )}
        </div>
      ))}
      <div className="mt-2 rounded-xl px-2.5 py-1.5" style={{ background: `${gradeColor}10`, border: `1px solid ${gradeColor}22` }}>
        <p className="font-spot-sans font-extrabold text-[9px]" style={{ color: gradeColor }}>MODEL: {edge.pick}</p>
      </div>
    </div>
  );
}
