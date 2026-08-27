"use client";

export interface TimelinePhase {
  label: string;
  shortLabel?: string;
  start: string;
  end?: string;
  color?: string;
  isPlayoffs?: boolean;
  isChampionship?: boolean;
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
  const clampedToday = Math.max(0, Math.min(100, todayPct));

  const activePhaseIndex = phases.findIndex((p) => {
    const start = parseDate(p.start);
    const end = p.end ? parseDate(p.end) : parseDate(p.start);
    return today >= start && today <= end;
  });

  const fmtDate = (s: string) => {
    const d = parseDate(s);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="rounded-[20px] overflow-hidden" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
      {/* Header */}
      <div className="px-6 pt-5 pb-4" style={{ background: `linear-gradient(135deg, ${color}18, var(--panel) 70%)`, borderBottom: "1px solid var(--hairline)" }}>
        <p className="font-spot-sans font-extrabold text-[10px] uppercase tracking-[.16em]" style={{ color }}>Season Timeline</p>
        <p className="mt-0.5 font-spot-sans font-black text-xl" style={{ color: "var(--text)" }}>{title}</p>
        <p className="mt-0.5 font-spot-sans text-xs" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
      </div>

      {/* Phase pills */}
      <div className="px-6 pt-4 pb-2 flex items-center gap-2 flex-wrap">
        {phases.map((p, i) => {
          const isActive = i === activePhaseIndex;
          const isPast = activePhaseIndex >= 0 && i < activePhaseIndex;
          const isFuture = activePhaseIndex >= 0 && i > activePhaseIndex;
          return (
            <span
              key={p.label}
              className="font-spot-sans font-extrabold text-[10px] uppercase tracking-[.10em] px-2.5 py-1 rounded-full"
              style={
                isActive
                  ? { background: color, color: "#fff" }
                  : isPast
                  ? { background: "rgba(255,255,255,.06)", color: "var(--text-dim)", textDecoration: "line-through" }
                  : { background: "rgba(255,255,255,.05)", border: "1px solid var(--hairline)", color: "var(--text-muted)" }
              }
            >
              {p.shortLabel ?? p.label}
            </span>
          );
        })}
      </div>

      {/* Timeline bar */}
      <div className="px-6 pb-5">
        {/* Labels */}
        <div className="relative" style={{ height: 20 }}>
          {phases.map((p) => {
            const startPct = pct(parseDate(p.start));
            return (
              <span
                key={p.label}
                className="absolute font-spot-sans font-semibold text-[9px] uppercase tracking-[.08em]"
                style={{ left: `${startPct}%`, top: 0, transform: "translateX(-50%)", color: "var(--text-dim)", whiteSpace: "nowrap" }}
              >
                {p.shortLabel ?? p.label}
              </span>
            );
          })}
        </div>

        {/* Bar */}
        <div className="relative" style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,.08)" }}>
          {/* Completed segment */}
          {clampedToday > 0 && (
            <div
              className="absolute left-0 top-0 h-full rounded-l"
              style={{ width: `${clampedToday}%`, background: `linear-gradient(90deg, ${color}80, ${color})`, transition: "width .6s ease" }}
            />
          )}
          {/* Today dot */}
          {clampedToday >= 0 && clampedToday <= 100 && (
            <div
              className="absolute top-1/2 -translate-y-1/2"
              style={{
                left: `${clampedToday}%`, transform: "translate(-50%, -50%)",
                width: 12, height: 12, borderRadius: "50%",
                background: color, border: "2px solid #fff",
                boxShadow: `0 0 0 3px ${color}40`,
              }}
            />
          )}
          {/* Phase dividers */}
          {phases.slice(1).map((p) => {
            const pp = pct(parseDate(p.start));
            return (
              <div
                key={p.label}
                className="absolute top-0 bottom-0"
                style={{ left: `${pp}%`, width: 1, background: "rgba(255,255,255,.18)" }}
              />
            );
          })}
        </div>

        {/* Start / end dates */}
        <div className="flex items-center justify-between mt-2">
          <span className="font-spot-mono font-semibold text-[10px]" style={{ color: "var(--text-muted)" }}>{fmtDate(phases[0].start)}</span>
          {clampedToday > 5 && clampedToday < 95 && (
            <span
              className="font-spot-sans font-black text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: color, color: "#fff", position: "absolute", left: `${clampedToday}%`, transform: "translateX(-50%)", marginTop: 14 }}
            >
              Today
            </span>
          )}
          <span className="font-spot-mono font-semibold text-[10px]" style={{ color: "var(--text-muted)" }}>
            {phases[phases.length - 1].end ? fmtDate(phases[phases.length - 1].end!) : fmtDate(phases[phases.length - 1].start)}
          </span>
        </div>

        {/* Bottom phase dates */}
        <div className="mt-4 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${phases.length}, 1fr)` }}>
          {phases.map((p, i) => {
            const isActive = i === activePhaseIndex;
            return (
              <div key={p.label} className="text-center">
                <p className="font-spot-sans font-extrabold text-[10px] uppercase tracking-[.08em]" style={{ color: isActive ? color : "var(--text-3)" }}>
                  {p.shortLabel ?? p.label}
                </p>
                <p className="font-spot-mono text-[9px]" style={{ color: "var(--text-muted)" }}>
                  {fmtDate(p.start)}{p.end && p.end !== p.start ? ` – ${fmtDate(p.end)}` : ""}
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
  { label: "Conference",      shortLabel: "Conf. Champ",start: "2027-01-26", end: "2027-01-26" },
  { label: "Super Bowl",      shortLabel: "Super Bowl", start: "2027-02-09", end: "2027-02-09" },
];

export const WNBA_2026_PHASES: TimelinePhase[] = [
  { label: "Regular Season", shortLabel: "Reg Season", start: "2026-05-15", end: "2026-09-20" },
  { label: "First Round",    shortLabel: "1st Round",  start: "2026-09-22", end: "2026-09-26" },
  { label: "Semifinals",     shortLabel: "Semis",      start: "2026-09-30", end: "2026-10-08" },
  { label: "Finals",         shortLabel: "Finals",     start: "2026-10-13", end: "2026-10-28" },
];
