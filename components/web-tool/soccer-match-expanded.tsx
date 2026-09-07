"use client";

import { X, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { SoccerMatch } from "@/lib/soccer/types";
import { leagueDef } from "@/lib/soccer/leagues";
import { soccerMatchEdge, soccerGradeColor, getSoccerPlayerProps } from "@/lib/soccer/analytics";

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

interface StandingRow {
  pos: number; abbr: string; logo: string; hex: string;
  p: number; w: number; d: number; l: number; pts: number;
  isMatch?: boolean;
}

const FILLER_TEAMS = [
  { abbr: "ATM", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/1068.png", hex: "#CB3524" },
  { abbr: "VIL", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/449.png",  hex: "#F7D117" },
  { abbr: "BET", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/244.png",  hex: "#00A650" },
  { abbr: "SOC", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/16.png",   hex: "#0067B1" },
];

function genStandings(match: SoccerMatch): StandingRow[] {
  const s = seed(match.id);
  const slots = [
    { abbr: match.homeTeam.abbr, logo: match.homeTeam.logo, hex: match.homeTeam.hex, isMatch: true },
    { abbr: match.awayTeam.abbr, logo: match.awayTeam.logo, hex: match.awayTeam.hex, isMatch: true },
    ...FILLER_TEAMS.slice(0, 4),
  ];
  return slots
    .map((t, i) => {
      const ts = seed(match.id + t.abbr + i);
      const p = 6 + (ts % 4);
      const w = Math.min(p, (ts % (p + 1)));
      const d = Math.min(p - w, ((ts >> 2) % (p - w + 1)));
      const l = p - w - d;
      return { pos: 0, ...t, p, w, d, l, pts: w * 3 + d };
    })
    .sort((a, b) => b.pts - a.pts)
    .map((t, i) => ({ ...t, pos: i + 1 }));
}

function WinProbBars({ hPct, dPct, aPct, match }: { hPct: number; dPct: number; aPct: number; match: SoccerMatch }) {
  return (
    <div>
      <div className="flex h-2.5 rounded-full overflow-hidden mb-3">
        <div style={{ width: `${hPct}%`, background: match.homeTeam.hex, borderRadius: "99px 0 0 99px" }} />
        <div style={{ width: `${dPct}%`, background: "rgba(255,255,255,.2)" }} />
        <div style={{ flex: 1, background: match.awayTeam.hex, borderRadius: "0 99px 99px 0" }} />
      </div>
      <div className="flex justify-between">
        {[
          { label: match.homeTeam.abbr + " Win", pct: hPct, color: match.homeTeam.hex },
          { label: "Draw", pct: dPct, color: "var(--text-3)" },
          { label: match.awayTeam.abbr + " Win", pct: aPct, color: match.awayTeam.hex },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <p className="font-spot-mono font-black text-[17px] leading-tight" style={{ color: item.color }}>{item.pct}%</p>
            <p className="font-spot-sans text-[9px] mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SoccerMatchExpanded({ match, onClose }: { match: SoccerMatch; onClose: () => void }) {
  const edge = soccerMatchEdge(match);
  const def = leagueDef(match.league);
  const standings = genStandings(match);
  const gradeColor = soccerGradeColor(edge.grade);
  const isLive = match.status === "live";
  const isFinal = match.status === "final";

  const totalProb = edge.homeWinProb + edge.drawProb + edge.awayWinProb;
  const hPct = Math.round((edge.homeWinProb / totalProb) * 100);
  const dPct = Math.round((edge.drawProb / totalProb) * 100);
  const aPct = 100 - hPct - dPct;

  // Top prop player for this matchup
  const allProps = getSoccerPlayerProps(match.league);
  const mvp = allProps.find((p) =>
    p.matchup.includes(match.homeTeam.abbr) || p.matchup.includes(match.awayTeam.abbr)
  ) ?? allProps[0];

  const leagueColorFg = def.color === "#38003c" || def.color === "#091c3e" || def.color === "#001d5b" ? "#e5e7ff" : "#fff";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "rgba(3,5,12,.92)", backdropFilter: "blur(12px)" }}>
      <div className="min-h-screen max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* ── Title row ── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="spot-label" style={{ color: def.color === "#38003c" ? "#a78bfa" : def.color }}>
              {def.label} · MATCH ANALYSIS
            </p>
            <h2 className="font-spot-sans font-black text-xl sm:text-2xl uppercase mt-0.5" style={{ color: "var(--text)" }}>
              {match.homeTeam.shortName} vs {match.awayTeam.shortName}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-white/5"
            style={{ background: "var(--panel)", border: "1px solid var(--hairline)", color: "var(--text-muted)", flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* ── Stadium hero ── */}
        <div className="rounded-[22px] overflow-hidden relative"
          style={{
            minHeight: 220,
            background: `linear-gradient(135deg, ${match.homeTeam.hex}28 0%, #0b0d15 45%, ${match.awayTeam.hex}20 100%)`,
            border: isLive ? "1.5px solid rgba(239,68,68,.45)" : "1px solid var(--hairline)",
            boxShadow: isLive ? "0 0 60px rgba(239,68,68,.1)" : `0 0 60px ${match.homeTeam.hex}18`,
          }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse at 30% 50%, rgba(255,255,255,.03) 0%, transparent 60%)",
          }} />
          <div className="h-[3px]" style={{ background: isLive ? "linear-gradient(90deg,#ef4444,#f97316)" : `linear-gradient(90deg,${match.homeTeam.hex},${match.awayTeam.hex})` }} />

          <div className="relative px-6 sm:px-10 py-8">
            {/* League / status pill */}
            <div className="flex justify-center mb-6">
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 font-spot-sans font-black text-[11px] uppercase tracking-[.08em] px-3 py-1 rounded-full"
                  style={{ color: "#ef4444", background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.3)" }}>
                  <span className="spot-live-dot inline-block w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
                  {match.minute ? `${match.minute}′` : "LIVE"}
                </span>
              ) : (
                <span className="font-spot-sans font-extrabold text-[11px] px-3 py-1 rounded-full"
                  style={{ color: leagueColorFg, background: def.color }}>{def.shortLabel}</span>
              )}
            </div>

            {/* Teams + Score */}
            <div className="flex items-center justify-between gap-4">
              {/* Home */}
              <div className="flex flex-col items-center gap-3 flex-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={match.homeTeam.logo} alt={match.homeTeam.shortName} className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }} />
                <div className="text-center">
                  <p className="font-spot-sans font-black text-base sm:text-xl uppercase" style={{ color: "var(--text)", letterSpacing: "-.01em" }}>{match.homeTeam.shortName}</p>
                  <p className="font-spot-mono text-[10px] mt-0.5" style={{ color: "var(--text-faint)" }}>HOME · {hPct}% WIN</p>
                </div>
              </div>

              {/* Center: score / time */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                {(isLive || isFinal) ? (
                  <p className="font-spot-mono font-black leading-none" style={{ fontSize: 44, color: "var(--text)", letterSpacing: "-.04em" }}>
                    {match.homeScore ?? 0} – {match.awayScore ?? 0}
                  </p>
                ) : (
                  <p className="font-spot-mono font-black text-3xl" style={{ color: "var(--text-dim)", letterSpacing: "-.02em" }}>VS</p>
                )}
                <p className="font-spot-sans font-extrabold text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {isFinal ? "FULL TIME" : isLive ? "IN PROGRESS" : fmtTime(match.date)}
                </p>
                {match.venue && (
                  <p className="font-spot-sans text-[9px] text-center" style={{ color: "var(--text-dim)" }}>{match.venue}</p>
                )}
              </div>

              {/* Away */}
              <div className="flex flex-col items-center gap-3 flex-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={match.awayTeam.logo} alt={match.awayTeam.shortName} className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }} />
                <div className="text-center">
                  <p className="font-spot-sans font-black text-base sm:text-xl uppercase" style={{ color: "var(--text)", letterSpacing: "-.01em" }}>{match.awayTeam.shortName}</p>
                  <p className="font-spot-mono text-[10px] mt-0.5" style={{ color: "var(--text-faint)" }}>AWAY · {aPct}% WIN</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3-column analysis ── */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>

          {/* Col 1: AI Analysis */}
          <div className="space-y-3">
            {/* AI Powered Analysis */}
            <div className="rounded-[18px] p-4" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
              <p className="spot-label mb-3" style={{ color: "var(--green)" }}>AI POWERED ANALYSIS</p>

              <div className="flex items-center gap-3 mb-3">
                <span className="font-spot-mono font-black text-4xl leading-none" style={{ color: gradeColor }}>{edge.grade}</span>
                <div>
                  <p className="font-spot-sans font-black text-[13px]" style={{ color: "var(--text)" }}>{edge.pick}</p>
                  <p className="font-spot-sans text-[10px] leading-snug mt-0.5" style={{ color: "var(--text-muted)" }}>{edge.pickReason}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="font-spot-mono font-bold text-[9px] uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>MODEL EDGE</span>
                  <span className="font-spot-mono font-extrabold text-[9px]" style={{ color: gradeColor }}>{edge.edge}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.06)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${edge.edge}%`, background: `linear-gradient(90deg, ${gradeColor}88, ${gradeColor})` }} />
                </div>
              </div>
            </div>

            {/* AI MVP of the Day */}
            {mvp && (
              <div className="rounded-[18px] p-4" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
                <p className="spot-label mb-3" style={{ color: "var(--orange)" }}>TOP PROP PICK</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ background: `${mvp.teamHex}22`, border: `1px solid ${mvp.teamHex}44` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://a.espncdn.com/i/headshots/soccer/players/full/${mvp.espnPlayerId}.png`}
                      alt={mvp.playerName}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-spot-sans font-black text-[13px] truncate" style={{ color: "var(--text)" }}>{mvp.playerName}</p>
                    <p className="font-spot-sans text-[10px]" style={{ color: "var(--text-muted)" }}>{mvp.teamAbbr} · {mvp.position}</p>
                  </div>
                  <span className="font-spot-mono font-black text-xl shrink-0" style={{ color: soccerGradeColor(mvp.grade) }}>{mvp.grade}</span>
                </div>
                <div className="mt-3 rounded-xl px-3 py-2" style={{ background: `${soccerGradeColor(mvp.grade)}10`, border: `1px solid ${soccerGradeColor(mvp.grade)}25` }}>
                  <p className="font-spot-sans font-extrabold text-[10px]" style={{ color: soccerGradeColor(mvp.grade) }}>
                    {mvp.market} {mvp.side} {mvp.line}
                  </p>
                  <p className="font-spot-mono text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Proj {mvp.modelProj} · {mvp.probability}% conf · {mvp.odds}
                  </p>
                </div>
              </div>
            )}

            {/* Win probability */}
            <div className="rounded-[18px] p-4" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="spot-label" style={{ color: "var(--text-muted)" }}>WIN PROBABILITY</p>
                <span className="font-spot-sans font-extrabold text-[9px] px-2 py-0.5 rounded-full"
                  style={{ color: leagueColorFg, background: def.color }}>{def.shortLabel}</span>
              </div>
              {[
                { label: match.homeTeam.shortName, prob: hPct, hex: match.homeTeam.hex },
                { label: "Draw", prob: dPct, hex: "rgba(255,255,255,.3)" },
                { label: match.awayTeam.shortName, prob: aPct, hex: match.awayTeam.hex },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-2 mb-2.5">
                  <span className="font-spot-sans text-[10px] w-16 shrink-0 truncate" style={{ color: "var(--text-muted)" }}>{row.label}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${row.prob}%`, background: row.hex }} />
                  </div>
                  <span className="font-spot-mono font-bold text-[10px] w-8 text-right shrink-0" style={{ color: "var(--text-3)" }}>{row.prob}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Col 2: Key Metrics */}
          <div className="space-y-3">
            {/* xG comparison */}
            <div className="rounded-[18px] p-4" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
              <p className="spot-label mb-3" style={{ color: "var(--text-muted)" }}>EXPECTED GOALS (xG)</p>

              <div className="flex justify-between items-end mb-2">
                <span className="font-spot-mono font-black text-3xl" style={{ color: "var(--green)" }}>{edge.homeXg}</span>
                <span className="font-spot-mono font-bold text-[10px] uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>xG</span>
                <span className="font-spot-mono font-black text-3xl" style={{ color: "var(--text-3)" }}>{edge.awayXg}</span>
              </div>

              <div className="flex h-2 rounded-full overflow-hidden">
                <div style={{ flex: edge.homeXg, background: match.homeTeam.hex, borderRadius: "99px 0 0 99px" }} />
                <div style={{ flex: edge.awayXg, background: match.awayTeam.hex, borderRadius: "0 99px 99px 0" }} />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="font-spot-sans font-bold text-[9px]" style={{ color: "var(--text-faint)" }}>{match.homeTeam.abbr}</span>
                <span className="font-spot-sans font-bold text-[9px]" style={{ color: "var(--text-faint)" }}>{match.awayTeam.abbr}</span>
              </div>
            </div>

            {/* Metrics 2x2 */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "PPDA Home", value: edge.homePpda, hint: "Pressing intensity" },
                { label: "PPDA Away", value: edge.awayPpda, hint: "Pressing intensity" },
                { label: "Possession", value: `${edge.possession}%`, hint: "Home ball control" },
                { label: "Total xG", value: (edge.homeXg + edge.awayXg).toFixed(1), hint: "Combined expected goals" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-[14px] px-3 py-3"
                  style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--hairline)" }}>
                  <p className="font-spot-mono font-black text-xl leading-none" style={{ color: "var(--text)" }}>{stat.value}</p>
                  <p className="font-spot-sans font-bold text-[9px] uppercase tracking-wider mt-1" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Outcome probability bar */}
            <div className="rounded-[18px] p-4" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
              <p className="spot-label mb-3" style={{ color: "var(--text-muted)" }}>OUTCOME PROBABILITY</p>
              <WinProbBars hPct={hPct} dPct={dPct} aPct={aPct} match={match} />
            </div>

            {/* Model pick */}
            <div className="rounded-[18px] p-4" style={{ background: `${gradeColor}0d`, border: `1.5px solid ${gradeColor}30` }}>
              <p className="spot-label mb-1" style={{ color: gradeColor }}>MODEL RECOMMENDATION</p>
              <p className="font-spot-sans font-black text-base" style={{ color: "var(--text)" }}>{edge.pick}</p>
              <p className="font-spot-sans text-[11px] mt-1.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>{edge.pickReason}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="font-spot-sans font-extrabold text-[10px] px-2.5 py-1 rounded-lg"
                  style={{ color: gradeColor, background: `${gradeColor}1a`, border: `1px solid ${gradeColor}30` }}>
                  Grade {edge.grade}
                </span>
                <span className="font-spot-mono font-bold text-[11px]" style={{ color: gradeColor }}>{edge.edge}% confidence</span>
              </div>
            </div>
          </div>

          {/* Col 3: Group Standing + Links */}
          <div className="space-y-3">
            {/* Group standing */}
            <div className="rounded-[18px] overflow-hidden" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--hairline)" }}>
                <p className="font-spot-sans font-extrabold text-[13px]" style={{ color: "var(--text)" }}>Group Standing</p>
                <span className="font-spot-sans font-bold text-[9px] px-2 py-0.5 rounded-full"
                  style={{ color: leagueColorFg, background: def.color }}>{def.shortLabel}</span>
              </div>

              {/* Table header */}
              <div className="grid px-4 py-2 font-spot-mono font-bold text-[9px] uppercase tracking-wider"
                style={{ gridTemplateColumns: "22px 1fr 24px 24px 24px 32px", gap: "0 6px", color: "var(--text-faint)", borderBottom: "1px solid var(--hairline)" }}>
                {["P", "Club", "W", "D", "L", "Pts"].map((h) => (
                  <span key={h} className="text-right first:text-center">{h}</span>
                ))}
              </div>

              {standings.map((row) => (
                <div key={row.pos} className="grid items-center px-4 py-2.5"
                  style={{
                    gridTemplateColumns: "22px 1fr 24px 24px 24px 32px",
                    gap: "0 6px",
                    borderBottom: "1px solid var(--hairline)",
                    background: row.isMatch ? `${row.hex}09` : undefined,
                  }}>
                  <span className="font-spot-mono font-bold text-[10px] text-center"
                    style={{ color: row.pos <= 4 ? "var(--green)" : "var(--text-faint)" }}>{row.pos}</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={row.logo} alt={row.abbr} className="w-4 h-4 object-contain shrink-0"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    <span className="font-spot-sans font-bold text-[11px] truncate"
                      style={{ color: row.isMatch ? "var(--text)" : "var(--text-muted)" }}>{row.abbr}</span>
                  </div>
                  {[row.w, row.d, row.l].map((v, i) => (
                    <span key={i} className="font-spot-mono text-[11px] text-right" style={{ color: "var(--text-3)" }}>{v}</span>
                  ))}
                  <span className="font-spot-mono font-black text-[11px] text-right"
                    style={{ color: row.isMatch ? "var(--green)" : "var(--text)" }}>{row.pts}</span>
                </div>
              ))}
            </div>

            {/* PPDA context */}
            <div className="rounded-[18px] p-4" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
              <p className="spot-label mb-2.5" style={{ color: "var(--text-muted)" }}>PRESSING INTENSITY (PPDA)</p>
              {[
                { label: match.homeTeam.abbr, value: edge.homePpda, hex: match.homeTeam.hex },
                { label: match.awayTeam.abbr, value: edge.awayPpda, hex: match.awayTeam.hex },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-2 mb-2.5">
                  <span className="font-spot-sans font-bold text-[10px] w-10 shrink-0" style={{ color: "var(--text-muted)" }}>{row.label}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (row.value / 16) * 100)}%`, background: row.hex }} />
                  </div>
                  <span className="font-spot-mono font-extrabold text-[11px] w-6 text-right shrink-0" style={{ color: row.hex }}>{row.value}</span>
                </div>
              ))}
              <p className="font-spot-sans text-[9px] mt-1" style={{ color: "var(--text-dim)" }}>
                Lower PPDA = higher pressing intensity
              </p>
            </div>

            {/* Quick links */}
            <div className="space-y-2">
              <Link href="/soccer/props"
                className="flex items-center justify-between rounded-[14px] px-4 py-3 transition-opacity hover:opacity-80"
                style={{ background: "var(--green-bg)", border: "1px solid rgba(52,211,153,.3)", color: "var(--green)" }}>
                <span className="font-spot-sans font-extrabold text-[13px]">View Player Props</span>
                <ChevronRight size={16} />
              </Link>
              <Link href="/soccer/leagues"
                className="flex items-center justify-between rounded-[14px] px-4 py-3 transition-opacity hover:opacity-80"
                style={{ background: "var(--panel)", border: "1px solid var(--hairline)", color: "var(--text-muted)" }}>
                <span className="font-spot-sans font-bold text-[13px]">League Browser</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
