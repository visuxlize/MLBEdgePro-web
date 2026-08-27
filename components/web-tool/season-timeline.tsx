"use client";

export interface TimelinePhase {
  label: string;
  shortLabel?: string;
  start: string;
  end?: string;
}

interface SeasonTimelineProps {
  title: string;
  subtitle: string;
  phases: TimelinePhase[];
  sport: "mlb" | "nfl" | "wnba";
}

const SPORT_COLOR: Record<string, string> = {
  mlb:  "#f97316",
  nfl:  "#a78bfa",
  wnba: "#2dd4bf",
};

function parseDate(s: string): Date {
  return new Date(s + "T00:00:00");
}

function fmtDate(s: string) {
  const d = parseDate(s);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function SeasonTimeline({ title, subtitle, phases, sport }: SeasonTimelineProps) {
  const color = SPORT_COLOR[sport] ?? "#f97316";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allDates = phases.flatMap((p) => [parseDate(p.start), p.end ? parseDate(p.end) : parseDate(p.start)]);
  const minTime = Math.min(...allDates.map((d) => d.getTime()));
  const maxTime = Math.max(...allDates.map((d) => d.getTime()));
  const span = maxTime - minTime || 1;

  function pct(date: Date) {
    return Math.max(0, Math.min(100, ((date.getTime() - minTime) / span) * 100));
  }

  const todayPct = pct(today);
  const todayInRange = todayPct >= 0 && todayPct <= 100;

  const activePhaseIndex = phases.findIndex((p) => {
    const start = parseDate(p.start);
    const end = p.end ? parseDate(p.end) : parseDate(p.start);
    return today >= start && today <= end;
  });

  return (
    <div className="rounded-[20px] overflow-hidden" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-4 flex-wrap"
        style={{ background: `linear-gradient(135deg, ${color}18, var(--panel) 70%)`, borderBottom: "1px solid var(--hairline)" }}>
        <div>
          <p className="font-spot-sans font-extrabold text-[10px] uppercase tracking-[.16em]" style={{ color }}> Season Timeline</p>
          <p className="mt-0.5 font-spot-sans font-black text-lg" style={{ color: "var(--text)" }}>{title}</p>
          <p className="font-spot-sans text-[11px]" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
        </div>
        {/* Active phase badge */}
        {activePhaseIndex >= 0 && (
          <span className="self-start mt-1 font-spot-sans font-extrabold text-[10px] uppercase tracking-[.12em] px-2.5 py-1 rounded-full"
            style={{ background: color, color: "#fff" }}>
            {phases[activePhaseIndex].shortLabel ?? phases[activePhaseIndex].label}
          </span>
        )}
      </div>

      {/* Phase pills */}
      <div className="px-5 pt-3 pb-1 flex items-center gap-2 flex-wrap">
        {phases.map((p, i) => {
          const isActive = i === activePhaseIndex;
          const isPast = activePhaseIndex >= 0 && i < activePhaseIndex;
          return (
            <span key={p.label}
              className="font-spot-sans font-extrabold text-[10px] uppercase tracking-[.08em] px-2.5 py-1 rounded-full"
              style={
                isActive
                  ? { background: color, color: "#fff" }
                  : isPast
                  ? { background: "rgba(255,255,255,.05)", color: "var(--text-ghost)", textDecoration: "line-through" }
                  : { background: "rgba(255,255,255,.04)", border: "1px solid var(--hairline)", color: "var(--text-3)" }
              }>
              {p.shortLabel ?? p.label}
            </span>
          );
        })}
      </div>

      {/* Timeline bar */}
      <div className="px-5 pb-4 pt-2">
        {/* Bar + Today marker */}
        <div className="relative" style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,.07)" }}>
          {/* Filled portion */}
          {todayPct > 0 && (
            <div className="absolute left-0 top-0 h-full rounded-l"
              style={{ width: `${Math.min(todayPct, 100)}%`, background: `linear-gradient(90deg, ${color}70, ${color})` }} />
          )}
          {/* Phase dividers */}
          {phases.slice(1).map((p) => {
            const pp = pct(parseDate(p.start));
            return (
              <div key={p.label} className="absolute top-0 bottom-0"
                style={{ left: `${pp}%`, width: 1, background: "rgba(255,255,255,.15)" }} />
            );
          })}
          {/* Today dot */}
          {todayInRange && (
            <div className="absolute top-1/2"
              style={{
                left: `${todayPct}%`, transform: "translate(-50%, -50%)",
                width: 14, height: 14, borderRadius: "50%",
                background: color, border: "2px solid #0b0d15",
                boxShadow: `0 0 0 3px ${color}50, 0 0 12px ${color}60`,
                zIndex: 2,
              }} />
          )}
        </div>

        {/* Start / Today / End labels */}
        <div className="relative flex items-start justify-between mt-1.5">
          <span className="font-spot-mono text-[9px]" style={{ color: "var(--text-dim)" }}>
            {fmtDate(phases[0].start)}
          </span>
          {todayInRange && todayPct > 8 && todayPct < 92 && (
            <span className="absolute font-spot-sans font-black text-[9px] px-1.5 py-0.5 rounded-full"
              style={{
                left: `${todayPct}%`, transform: "translateX(-50%)",
                background: color, color: "#fff",
              }}>
              Today
            </span>
          )}
          <span className="font-spot-mono text-[9px]" style={{ color: "var(--text-dim)" }}>
            {phases[phases.length - 1].end ? fmtDate(phases[phases.length - 1].end!) : fmtDate(phases[phases.length - 1].start)}
          </span>
        </div>

        {/* Bottom phase date grid */}
        <div className="mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${phases.length}, 1fr)` }}>
          {phases.map((p, i) => {
            const isActive = i === activePhaseIndex;
            return (
              <div key={p.label} className="text-center min-w-0">
                <p className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.06em] truncate"
                  style={{ color: isActive ? color : "var(--text-3)" }}>
                  {p.shortLabel ?? p.label}
                </p>
                <p className="font-spot-mono text-[8px] truncate" style={{ color: "var(--text-muted)" }}>
                  {fmtDate(p.start)}{p.end && p.end !== p.start ? ` – ${fmtDate(p.end).replace(/\w+ /, "")}` : ""}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Pre-built sport timelines
export const MLB_2026_PHASES: TimelinePhase[] = [
  { label: "Regular Season", shortLabel: "Reg Season", start: "2026-03-26", end: "2026-09-27" },
  { label: "Wild Card",        shortLabel: "Wild Card",  start: "2026-10-01", end: "2026-10-03" },
  { label: "Division Series",  shortLabel: "ALDS/NLDS", start: "2026-10-07", end: "2026-10-15" },
  { label: "Championship",     shortLabel: "ALCS/NLCS", start: "2026-10-19", end: "2026-10-26" },
  { label: "World Series",     shortLabel: "World Series", start: "2026-10-30", end: "2026-11-05" },
];

export const NFL_2026_PHASES: TimelinePhase[] = [
  { label: "Preseason",       shortLabel: "Preseason",  start: "2026-08-06", end: "2026-08-29" },
  { label: "Regular Season",  shortLabel: "Reg Season", start: "2026-09-10", end: "2027-01-04" },
  { label: "Wild Card",       shortLabel: "Wild Card",  start: "2027-01-11", end: "2027-01-12" },
  { label: "Divisional",      shortLabel: "Divisional", start: "2027-01-18", end: "2027-01-19" },
  { label: "Conf. Champ",     shortLabel: "Conf. Champ",start: "2027-01-26", end: "2027-01-26" },
  { label: "Super Bowl",      shortLabel: "Super Bowl", start: "2027-02-09", end: "2027-02-09" },
];

export const WNBA_2026_PHASES: TimelinePhase[] = [
  { label: "Regular Season", shortLabel: "Reg Season", start: "2026-05-15", end: "2026-09-20" },
  { label: "First Round",    shortLabel: "1st Round",  start: "2026-09-22", end: "2026-09-26" },
  { label: "Semifinals",     shortLabel: "Semis",      start: "2026-09-30", end: "2026-10-08" },
  { label: "Finals",         shortLabel: "Finals",     start: "2026-10-13", end: "2026-10-28" },
];
