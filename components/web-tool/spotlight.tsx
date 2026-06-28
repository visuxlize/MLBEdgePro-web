"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { teamLogoUrl, teamLogoDarkUrl, TEAM_COLORS, TEAM_ABBR, type Game } from "@/lib/mlb/api";

/* ── Model estimate (deterministic from schedule data, no extra fetches) ─────── */

export function modelEdge(game: Game) {
  const seed = game.gamePk;
  const jitter = (seed % 23) - 11;
  let homeProb = 50 + 3 + jitter;
  homeProb = Math.max(36, Math.min(64, homeProb));
  const favHome = homeProb >= 50;
  const edge = Math.max(41, Math.min(93, Math.round(45 + Math.abs(homeProb - 50) * 1.9 + (seed % 9))));
  const grade =
    edge >= 80 ? "A+" : edge >= 72 ? "A" : edge >= 64 ? "B+" :
    edge >= 55 ? "B" : edge >= 46 ? "C+" : "C";
  const favId = favHome ? game.teams.home.team.id : game.teams.away.team.id;
  const favName = favHome ? game.teams.home.team.name : game.teams.away.team.name;
  return { edge, grade, homeProb, awayProb: 100 - homeProb, favId, favCode: teamCode(favId, favName) };
}

/* ── Color helpers ──────────────────────────────────────────────────────────── */

/** Team primary hex (6-digit), falling back to the Spotlight orange. */
export function teamHex(teamId: number): string {
  return TEAM_COLORS[teamId] ?? "#f97316";
}

/** Append an 8-digit-hex alpha pair to a 6-digit hex. e.g. alpha("#f97316","26"). */
export function alpha(hex: string, aa: string): string {
  return `${hex}${aa}`;
}

export function teamCode(teamId: number, name?: string): string {
  return TEAM_ABBR[teamId] ?? name?.split(" ").pop()?.slice(0, 3).toUpperCase() ?? "MLB";
}

/** Grade → semantic color. A = green, B = orange, C = purple. */
export function gradeColor(grade: string): string {
  const g = grade.trim().charAt(0).toUpperCase();
  if (g === "A") return "var(--green)";
  if (g === "B") return "var(--grade-b)";
  return "var(--grade-c)";
}

/** Edge score (0-100) → color band. */
export function edgeColor(score: number): string {
  if (score >= 75) return "var(--green)";
  if (score >= 60) return "var(--grade-b)";
  return "var(--grade-c)";
}

/** % confidence → color. ≥80 green / 40–79 orange / <40 red. */
export function pctColor(pct: number): string {
  if (pct >= 80) return "var(--green)";
  if (pct >= 40) return "var(--grade-b)";
  return "var(--red)";
}

/* ── Section label ──────────────────────────────────────────────────────────── */

export function SectionLabel({
  children, className = "", style,
}: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <p className={`spot-label ${className}`} style={{ color: "var(--text-faint)", ...style }}>
      {children}
    </p>
  );
}

/* ── Team logo badge — rounded-square, team-color, inset ring ───────────────── */

export function LogoBadge({
  teamId, name, size = 38, radius,
}: { teamId: number; name: string; size?: number; radius?: number }) {
  const [src, setSrc] = useState<"primary" | "dark" | "fallback">("primary");
  const hex = teamHex(teamId);
  const code = teamCode(teamId, name);
  const r = radius ?? Math.round(size * 0.3);
  const pad = Math.round(size * 0.16);

  return (
    <div
      className="shrink-0 flex items-center justify-center relative overflow-hidden"
      style={{
        width: size, height: size, borderRadius: r,
        background: `linear-gradient(150deg, ${hex}, ${alpha(hex, "cc")})`,
        boxShadow: "var(--ring-inset), var(--shadow-badge)",
      }}
    >
      {src === "fallback" ? (
        <span className="font-spot-sans font-black text-white" style={{ fontSize: size * 0.32, letterSpacing: "-0.5px" }}>
          {code.slice(0, 3)}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src === "primary" ? teamLogoUrl(teamId) : teamLogoDarkUrl(teamId)}
          alt={name}
          style={{
            width: size - pad * 2, height: size - pad * 2, objectFit: "contain",
            filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.55))",
          }}
          onError={() => setSrc(src === "primary" ? "dark" : "fallback")}
        />
      )}
    </div>
  );
}

/* ── Conic edge / grade ring ────────────────────────────────────────────────── */

export function EdgeRing({
  value, grade, color, size = 58,
}: { value: number; grade?: string; color?: string; size?: number }) {
  const c = color ?? (grade ? gradeColor(grade) : edgeColor(value));
  return (
    <div className="spot-ring" style={{ width: size, height: size, ["--grade" as string]: c, ["--edge" as string]: value }}>
      <div className="flex flex-col items-center leading-none">
        <span className="font-spot-mono font-extrabold text-white" style={{ fontSize: size * 0.3 }}>{value}</span>
        {grade && <span className="font-spot-sans font-black mt-0.5" style={{ fontSize: size * 0.17, color: c }}>{grade}</span>}
      </div>
    </div>
  );
}

/* ── Grade pill (letter + optional edge) ────────────────────────────────────── */

export function GradePill({ grade, edge }: { grade: string; edge?: number }) {
  const c = gradeColor(grade);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[var(--r-badge)] px-2.5 py-1 font-spot-sans font-black"
      style={{ color: c, background: `color-mix(in srgb, ${c} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${c} 32%, transparent)` }}
    >
      {edge !== undefined && <span className="font-spot-mono text-[13px]">{edge}</span>}
      <span className="text-[13px]">{grade}</span>
    </span>
  );
}

/* ── Win probability bar ────────────────────────────────────────────────────── */

export function WinProbBar({
  awayPct, awayHex, homeHex, awayCode, homeCode, showLabels = true,
}: {
  awayPct: number; awayHex: string; homeHex: string;
  awayCode?: string; homeCode?: string; showLabels?: boolean;
}) {
  const homePct = 100 - awayPct;
  return (
    <div className="w-full">
      {showLabels && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-spot-mono text-[11px] font-bold" style={{ color: "var(--text-3)" }}>{awayPct}%</span>
          <SectionLabel className="!tracking-[.14em]" style={{ fontSize: 9 }}>Win Prob</SectionLabel>
          <span className="font-spot-mono text-[11px] font-bold" style={{ color: "var(--text-3)" }}>{homePct}%</span>
        </div>
      )}
      <div className="flex w-full overflow-hidden" style={{ height: 7, borderRadius: 5, background: "rgba(255,255,255,.12)" }}>
        <div style={{ width: `${awayPct}%`, background: awayHex }} />
        <div style={{ flex: 1, background: homeHex }} />
      </div>
      {showLabels && (awayCode || homeCode) && (
        <div className="flex items-center justify-between mt-1">
          <span className="font-spot-sans text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>{awayCode}</span>
          <span className="font-spot-sans text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>{homeCode}</span>
        </div>
      )}
    </div>
  );
}

/* ── AI Prediction tag + button ─────────────────────────────────────────────── */

export function AIPredictionTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 spot-label-sm ${className}`}
      style={{ color: "var(--purple-2)", background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}
    >
      <span style={{ color: "var(--purple-2)" }}>◆</span> AI Prediction
    </span>
  );
}

/**
 * The model pick footer. Always name the favored team, e.g. "HOU ML".
 * Renders as a link when `href` is provided.
 */
export function AIPredictionButton({
  pick, href, arrow = true,
}: { pick: string; href?: string; arrow?: boolean }) {
  const inner = (
    <div
      className="flex items-center justify-between gap-3 rounded-[var(--r-tile)] px-3.5 py-2.5 spot-lift"
      style={{ background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}
    >
      <span className="inline-flex items-center gap-1.5 spot-label-sm" style={{ color: "var(--purple-2)" }}>
        <span>◆</span> AI Prediction
      </span>
      <span className="inline-flex items-center gap-1.5 font-spot-sans font-black text-[13px]" style={{ color: "var(--purple-soft)" }}>
        {pick}
        {arrow && <span style={{ color: "var(--purple-2)" }}>↗</span>}
      </span>
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

/* ── Live status pill ───────────────────────────────────────────────────────── */

export function LivePill({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 spot-label-sm"
      style={{ color: "var(--red-soft)", background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.3)" }}
    >
      <span className="spot-live-dot inline-block rounded-full" style={{ width: 6, height: 6, background: "var(--red)" }} />
      {label}
    </span>
  );
}

/* ── Base diamond + outs (live games) ───────────────────────────────────────── */

export function BaseDiamond({
  first, second, third, outs,
}: { first?: boolean; second?: boolean; third?: boolean; outs?: number }) {
  const on = "var(--orange)";
  const off = "rgba(255,255,255,.10)";
  const sq = (filled?: boolean) => (
    <span
      style={{
        width: 11, height: 11, transform: "rotate(45deg)", display: "inline-block",
        background: filled ? on : off, borderRadius: 2,
        boxShadow: filled ? `0 0 8px ${alpha("#f97316", "88")}` : "none",
      }}
    />
  );
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: 44, height: 30 }}>
        <div className="absolute" style={{ left: "50%", top: 0, transform: "translateX(-50%)" }}>{sq(second)}</div>
        <div className="absolute" style={{ left: 0, top: 13 }}>{sq(third)}</div>
        <div className="absolute" style={{ right: 0, top: 13 }}>{sq(first)}</div>
      </div>
      {outs !== undefined && (
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="rounded-full" style={{ width: 5, height: 5, background: i < outs ? "var(--red)" : "rgba(255,255,255,.14)" }} />
          ))}
        </div>
      )}
    </div>
  );
}
