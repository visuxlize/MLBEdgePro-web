"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { daysUntil, getSeasonInfo, type SportKey } from "@/lib/season";
import { SeasonTimeline, MLB_2026_PHASES, WNBA_2026_PHASES } from "@/components/web-tool/season-timeline";
import { Panel, useCountUp } from "@/components/web-tool/sport-ui";

interface RecapRow { abbr: string; name: string; logo: string | null; wins: number; losses: number; pct: number }
interface RecapGroup { name: string; rows: RecapRow[] }

const THEME: Record<"mlb" | "wnba", { accent: string; soft: string; title: string; phases: typeof MLB_2026_PHASES; subtitle: string; returnWord: string; emoji: string }> = {
  mlb:  { accent: "#ea6a0a", soft: "#c2540a", title: "MLB 2026", phases: MLB_2026_PHASES,  subtitle: "Regular season through the World Series", returnWord: "Opening Day", emoji: "⚾" },
  wnba: { accent: "#0f9d8e", soft: "#0f8f80", title: "WNBA 2026", phases: WNBA_2026_PHASES, subtitle: "Regular season through the Finals", returnWord: "Tip-off", emoji: "🏀" },
};

const ACTIVE = [
  { href: "/nba", label: "NBA", color: "#ea6a0a", body: "Live scores, standings, Emirates NBA Cup & props" },
  { href: "/nfl", label: "NFL", color: "#6d4fe0", body: "All 18 weeks, standings, players & game props" },
  { href: "/soccer", label: "Soccer", color: "#12a150", body: "10 leagues — match centre with AI insights" },
];

export function OffseasonHub({ sport }: { sport: "mlb" | "wnba" }) {
  const theme = THEME[sport];
  const info = getSeasonInfo(sport as SportKey);
  const days = info.returns ? daysUntil(info.returns) : 0;
  const shown = useCountUp(days, 1200);
  const [groups, setGroups] = useState<RecapGroup[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/season-recap?sport=${sport}`)
      .then((r) => r.json())
      .then((d) => alive && setGroups(d.groups ?? []))
      .catch(() => alive && setGroups([]));
    return () => { alive = false; };
  }, [sport]);

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-xl mx-auto page-pad py-5 sm:py-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-[26px] p-6 sm:p-9 mb-5 rise"
          style={{ background: `linear-gradient(135deg, ${theme.accent}26, var(--panel) 58%)`, border: `1px solid ${theme.accent}40` }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(55% 80% at 100% 0%, ${theme.accent}22, transparent)` }} />
          <div className="relative grid gap-6 sm:grid-cols-[1fr_auto] items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-spot-sans font-extrabold text-[10px] uppercase tracking-[.14em]"
                style={{ color: theme.soft, background: `${theme.accent}1f`, border: `1px solid ${theme.accent}55` }}>
                {theme.emoji} {info.label} · Offseason
              </span>
              <h1 className="mt-3 font-spot-sans font-black text-[30px] sm:text-5xl leading-[1.05]" style={{ color: "var(--text)" }}>
                The {theme.title} season<br className="hidden sm:block" /> is in the books.
              </h1>
              <p className="mt-3 font-spot-sans text-[13.5px] max-w-lg" style={{ color: "var(--text-muted)" }}>
                {theme.subtitle} is complete, so live slates, props and deep dives are resting until {theme.returnWord.toLowerCase()}.
                The model&rsquo;s attention — and yours — is on the NBA, NFL and Soccer right now.
              </p>
            </div>
            <div className="text-center sm:text-right">
              <p className="font-spot-mono font-black text-[64px] sm:text-[88px] leading-none" style={{ color: theme.soft }}>{shown}</p>
              <p className="mt-1 font-spot-sans font-extrabold text-[11px] uppercase tracking-[.14em]" style={{ color: "var(--text-muted)" }}>days until {theme.returnWord}</p>
              {info.returnsLabel && <p className="font-spot-mono text-[11px] mt-0.5" style={{ color: "var(--text-faint)" }}>{info.returnsLabel}</p>}
            </div>
          </div>
        </div>

        {/* Where the action is */}
        <p className="spot-label mb-2.5" style={{ color: "var(--text-faint)" }}>In season right now</p>
        <div className="grid gap-3 sm:grid-cols-3 mb-6 stagger">
          {ACTIVE.map((a) => (
            <Link key={a.href} href={a.href} className="press group rounded-[20px] p-4 flex items-center gap-3"
              style={{ background: `linear-gradient(135deg, ${a.color}1f, var(--panel) 70%)`, border: `1px solid ${a.color}40` }}>
              <div className="flex-1 min-w-0">
                <p className="font-spot-sans font-black text-lg" style={{ color: "var(--text)" }}>{a.label}</p>
                <p className="font-spot-sans text-[11.5px]" style={{ color: "var(--text-muted)" }}>{a.body}</p>
              </div>
              <span className="font-spot-sans font-black text-lg transition-transform group-hover:translate-x-1" style={{ color: a.color }}>→</span>
            </Link>
          ))}
        </div>

        {/* Season recap */}
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr] items-start">
          <SeasonTimeline title={theme.title} subtitle={theme.subtitle} phases={theme.phases} sport={sport} />
          <Panel className="p-4">
            <p className="spot-label mb-3" style={{ color: theme.soft }}>Final standings · best records</p>
            {groups === null ? (
              <div className="flex flex-col gap-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-9" />)}</div>
            ) : groups.length === 0 ? (
              <p className="font-spot-sans text-xs" style={{ color: "var(--text-muted)" }}>Final standings are unavailable right now.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {groups.map((g) => (
                  <div key={g.name}>
                    <p className="font-spot-sans font-extrabold text-[10px] uppercase tracking-[.12em] mb-1" style={{ color: "var(--text-faint)" }}>{g.name}</p>
                    {g.rows.slice(0, 5).map((r, i) => (
                      <div key={r.abbr} className="flex items-center gap-2.5 py-1.5" style={{ borderTop: i ? "1px solid var(--hairline)" : undefined }}>
                        <span className="font-spot-mono font-black text-[11px] w-4 text-center" style={{ color: theme.soft }}>{i + 1}</span>
                        {r.logo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.logo} alt="" width={24} height={24} className="w-6 h-6 object-contain" />
                        )}
                        <span className="flex-1 font-spot-sans font-bold text-[12.5px] truncate" style={{ color: "var(--text-2)" }}>{r.name}</span>
                        <span className="font-spot-mono font-extrabold text-[12px]" style={{ color: "var(--text)" }}>{r.wins}-{r.losses}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
