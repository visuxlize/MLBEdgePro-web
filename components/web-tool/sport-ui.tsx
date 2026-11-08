"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { motion } from "framer-motion";

/* Shared building blocks for the NBA / NFL screens — Spotlight tokens, mobile-first. */

export function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setValue(Math.round((1 - Math.pow(1 - t, 3)) * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

/** Page header: eyebrow • title • subtitle • optional right slot (stacks on narrow screens). */
export function SportHeader({
  eyebrow, title, subtitle, accent, right,
}: { eyebrow: string; title: string; subtitle?: string; accent: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-x-4 gap-y-3 flex-wrap mb-5 rise">
      <div className="min-w-0">
        <p className="spot-label" style={{ color: accent }}>{eyebrow}</p>
        <h1 className="font-spot-sans text-[28px] sm:text-4xl font-black leading-[1.05] mt-1.5" style={{ color: "var(--text)" }}>{title}</h1>
        {subtitle && <p className="mt-1.5 font-spot-sans text-[13px] max-w-xl" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

/** Segmented control with a sliding highlight — scrolls horizontally when it can't fit. */
export function Segmented<T extends string>({
  options, value, onChange, accent, id,
}: { options: { key: T; label: string; badge?: string }[]; value: T; onChange: (v: T) => void; accent: string; id: string }) {
  return (
    <div className="snap-row rounded-2xl p-1 w-full sm:w-auto" style={{ background: "rgba(255,255,255,.04)", border: "1px solid var(--hairline)" }}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className="relative px-3.5 py-2 rounded-xl font-spot-sans font-extrabold text-[12px] whitespace-nowrap press"
            style={{ color: active ? "#06070d" : "var(--text-muted)" }}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-xl"
                style={{ background: accent }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-[1] inline-flex items-center gap-1.5">
              {o.label}
              {o.badge && <span className="font-spot-mono text-[9px] font-extrabold opacity-70">{o.badge}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export interface StripDay { key: string; dow: string; num: string; sub?: string }

export function DateStrip({
  days, active, onChange, accent,
}: { days: StripDay[]; active: string; onChange: (k: string) => void; accent: string }) {
  return (
    <div className="snap-row -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
      {days.map((d) => {
        const on = d.key === active;
        return (
          <button
            key={d.key}
            onClick={() => onChange(d.key)}
            className="relative flex flex-col items-center justify-center rounded-2xl w-[58px] py-2.5 press"
            style={on
              ? { background: accent, color: "#06070d", boxShadow: `0 8px 24px ${accent}44` }
              : { background: "var(--panel)", border: "1px solid var(--hairline)", color: "var(--text-muted)" }}
          >
            <span className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.12em]">{d.dow}</span>
            <span className="font-spot-mono font-black text-[19px] leading-tight mt-0.5">{d.num}</span>
            {d.sub && <span className="font-spot-sans font-bold text-[8px] mt-0.5 opacity-70">{d.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function LiveBadge({ label = "LIVE" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] font-spot-sans font-extrabold text-[9.5px] tracking-[.1em]"
      style={{ color: "var(--red-soft)", background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.3)" }}>
      <span className="spot-live-dot inline-block rounded-full" style={{ width: 5, height: 5, background: "var(--red)" }} />{label}
    </span>
  );
}

export function Chip({ children, color, bg, border }: { children: ReactNode; color: string; bg?: string; border?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-[3px] font-spot-sans font-extrabold text-[9.5px] tracking-[.08em] uppercase whitespace-nowrap"
      style={{ color, background: bg ?? `${color}1f`, border: `1px solid ${border ?? `${color}44`}` }}>
      {children}
    </span>
  );
}

/** Away vs home stat comparison with bars that grow in. */
export function CompareBar({
  label, away, home, awayPct, homePct, awayHex, homeHex, delay = 0,
}: { label: string; away: string; home: string; awayPct: number; homePct: number; awayHex: string; homeHex: string; delay?: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-spot-mono font-extrabold text-xs" style={{ color: awayPct >= homePct ? "var(--text)" : "var(--text-muted)" }}>{away}</span>
        <span className="font-spot-sans font-bold text-[10px] uppercase tracking-[.08em]" style={{ color: "var(--text-muted)" }}>{label}</span>
        <span className="font-spot-mono font-extrabold text-xs" style={{ color: homePct >= awayPct ? "var(--text)" : "var(--text-muted)" }}>{home}</span>
      </div>
      <div className="flex items-center gap-1 h-[7px]">
        <div className="flex-1 flex justify-end h-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.05)" }}>
          <div className="h-full rounded-full" style={{ width: `${awayPct}%`, background: awayHex, transformOrigin: "right", animation: `bar-grow .8s cubic-bezier(.22,1,.36,1) ${delay}s both` }} />
        </div>
        <div className="flex-1 h-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.05)" }}>
          <div className="h-full rounded-full" style={{ width: `${homePct}%`, background: homeHex, transformOrigin: "left", animation: `bar-grow .8s cubic-bezier(.22,1,.36,1) ${delay}s both` }} />
        </div>
      </div>
    </div>
  );
}

/** Animated circular gauge — 0-100. */
export function Gauge({
  value, label, color, size = 84, stroke = 7,
}: { value: number; label?: string; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const shown = useCountUp(value);
  const gid = useId();
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={stroke} />
        <motion.circle
          key={gid}
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-spot-mono font-extrabold" style={{ fontSize: size * 0.3, color: "var(--text)" }}>{shown}</span>
        {label && <span className="mt-1 font-spot-sans font-black" style={{ fontSize: size * 0.15, color }}>{label}</span>}
      </div>
    </div>
  );
}

/** Home/away win-probability split bar */
export function ProbSplit({
  awayLabel, homeLabel, homePct, awayHex, homeHex,
}: { awayLabel: string; homeLabel: string; homePct: number; awayHex: string; homeHex: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="font-spot-mono font-extrabold text-[11px]" style={{ color: "var(--text-2)" }}>{awayLabel} {100 - homePct}%</span>
        <span className="font-spot-mono font-extrabold text-[11px]" style={{ color: "var(--text-2)" }}>{homePct}% {homeLabel}</span>
      </div>
      <div className="flex h-[7px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.1)" }}>
        <div style={{ width: `${100 - homePct}%`, background: awayHex, transition: "width .6s cubic-bezier(.22,1,.36,1)" }} />
        <div style={{ flex: 1, background: homeHex }} />
      </div>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center text-center py-14 px-6 rounded-[20px]" style={{ background: "var(--panel)", border: "1px dashed var(--hairline)" }}>
      <p className="font-spot-sans font-extrabold text-sm" style={{ color: "var(--text-2)" }}>{title}</p>
      {body && <p className="mt-1 font-spot-sans text-xs max-w-xs" style={{ color: "var(--text-muted)" }}>{body}</p>}
    </div>
  );
}

export function Panel({ children, className = "", style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-[20px] ${className}`} style={{ background: "var(--panel)", border: "1px solid var(--hairline)", ...style }}>
      {children}
    </div>
  );
}

/** Odds trio (spread / total / moneyline) — DraftKings via ESPN. */
export function OddsStrip({
  items,
}: { items: { label: string; value: string; sub?: string; accent?: boolean }[] }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))` }}>
      {items.map((it) => (
        <div key={it.label} className="rounded-xl px-2.5 py-2 text-center" style={{
          background: it.accent ? "rgba(52,211,153,.12)" : "rgba(255,255,255,.04)",
          border: `1px solid ${it.accent ? "rgba(52,211,153,.32)" : "var(--hairline)"}`,
        }}>
          <p className="font-spot-sans font-extrabold text-[8.5px] uppercase tracking-[.12em]" style={{ color: "var(--text-faint)" }}>{it.label}</p>
          <p className="mt-0.5 font-spot-mono font-black text-[13px]" style={{ color: it.accent ? "var(--green)" : "var(--text)" }}>{it.value}</p>
          {it.sub && <p className="font-spot-mono text-[9px]" style={{ color: "var(--text-muted)" }}>{it.sub}</p>}
        </div>
      ))}
    </div>
  );
}
