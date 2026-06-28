"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { playerHeadshotUrl, teamLogoDarkUrl, type Game } from "@/lib/mlb/api";

// Re-export all server-safe utilities so existing imports from this module still work.
export {
  teamHex, alpha, teamCode, luminance, contrastText,
  gradeColor, edgeColor, pctColor, modelEdge,
} from "@/lib/mlb/spotlight-utils";
import {
  teamHex, alpha, teamCode, contrastText, gradeColor, edgeColor,
} from "@/lib/mlb/spotlight-utils";

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

/* ── Team logo badge — team-color plate, auto-loads MLB logo, falls back to abbr ── */

export function LogoBadge({
  teamId, name, size = 38, radius,
}: { teamId: number; name: string; size?: number; radius?: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  const hex = teamHex(teamId);
  const code = teamCode(teamId, name);
  const r = radius ?? Math.round(size * 0.3);
  const ink = contrastText(hex);
  const pad = Math.round(size * 0.15);
  // Use the cap-on-dark variant — always white/light, visible on any team-color plate
  const logoSrc = teamLogoDarkUrl(teamId);

  return (
    <div
      className="shrink-0 flex items-center justify-center relative overflow-hidden"
      style={{
        width: size, height: size, borderRadius: r, background: hex,
        boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.55), 0 3px 8px rgba(0,0,0,.4)",
      }}
      title={name}
    >
      {!imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoSrc}
          alt={name}
          style={{
            width: size - pad * 2,
            height: size - pad * 2,
            objectFit: "contain",
            filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.55))",
          }}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="font-spot-sans font-black" style={{ fontSize: size * 0.34, letterSpacing: "-0.5px", color: ink }}>
          {code.slice(0, 3)}
        </span>
      )}
    </div>
  );
}

/* ── Blended player headshot — portrait crop, full face, team-color bottom fade ─ */

export function BlendedHeadshot({
  id, name, size = 64, teamId,
}: { id: number; name: string; size?: number; teamId?: number }) {
  const hex = teamId !== undefined ? teamHex(teamId) : "#7c5cfa";
  // Portrait: 1.3× taller than wide so the full head + shoulders shows without clipping
  const w = size;
  const h = Math.round(size * 1.35);
  const r = Math.round(size * 0.15);
  return (
    <div className="relative shrink-0 overflow-hidden" style={{ width: w, height: h, borderRadius: r }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={playerHeadshotUrl(id)}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: "50% 5%" }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0"; }}
      />
      {/* Subtle team-color gradient fades the lower third into the card */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, transparent 55%, ${alpha(hex, "55")} 82%, rgba(6,7,13,.92) 100%)` }} />
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
 * Model pick footer. Renders [team logo] [team code] ML.
 * Pass `teamId` to show the team logo badge; falls back to pick text only.
 */
export function AIPredictionButton({
  pick, href, arrow = true, teamId, teamName,
}: { pick: string; href?: string; arrow?: boolean; teamId?: number; teamName?: string }) {
  const inner = (
    <div
      className="flex items-center justify-between gap-3 rounded-[var(--r-tile)] px-3.5 py-2.5 spot-lift"
      style={{ background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}
    >
      <span className="inline-flex items-center gap-1.5 spot-label-sm" style={{ color: "var(--purple-2)" }}>
        <span>◆</span> AI Prediction
      </span>
      <span className="inline-flex items-center gap-2 font-spot-sans font-black text-[13px]" style={{ color: "var(--purple-soft)" }}>
        {teamId !== undefined && (
          <LogoBadge teamId={teamId} name={teamName ?? pick} size={20} radius={5} />
        )}
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
