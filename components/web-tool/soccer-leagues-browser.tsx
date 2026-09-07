"use client";

import Link from "next/link";
import { Users, Trophy, Globe } from "lucide-react";
import { SOCCER_LEAGUES, leagueLogoUrl } from "@/lib/soccer/leagues";
import type { SoccerLeagueDef } from "@/lib/soccer/types";

const REGIONS: { key: "europe" | "continental" | "americas"; label: string; sublabel: string }[] = [
  { key: "europe",      label: "Europe",      sublabel: "Top 5 + domestic leagues" },
  { key: "continental", label: "Tournaments", sublabel: "UEFA continental competitions" },
  { key: "americas",    label: "Americas",    sublabel: "North & South America" },
];

function LeagueCard({ def }: { def: SoccerLeagueDef }) {
  const initials = def.shortLabel.slice(0, 3).toUpperCase();
  const isTournament = def.region === "continental";

  return (
    <Link
      href={`/soccer?league=${def.key}`}
      className="group rounded-[18px] overflow-hidden flex flex-col transition-all hover:scale-[1.015]"
      style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}
    >
      {/* Accent bar */}
      <div className="h-[3px]" style={{ background: def.color }} />

      <div className="p-4 flex-1 flex flex-col gap-3">
        {/* Logo + name row */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0 w-12 h-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={leagueLogoUrl(def.espnLeagueId)}
              alt={def.label}
              className="w-12 h-12 object-contain"
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                el.style.display = "none";
                const fb = el.nextElementSibling as HTMLElement | null;
                if (fb) fb.style.display = "flex";
              }}
            />
            <div
              className="w-12 h-12 rounded-2xl items-center justify-center font-spot-sans font-black text-[11px] text-white"
              style={{ display: "none", background: def.color }}
            >
              {initials}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-spot-sans font-black text-[14px] leading-snug truncate" style={{ color: "var(--text)" }}>
                {def.label}
              </p>
              {isTournament && (
                <span className="shrink-0 rounded-full px-2 py-0.5 font-spot-sans font-extrabold text-[8px] uppercase tracking-[.12em]"
                  style={{ color: def.color === "#001d5b" ? "#93c5fd" : "#fed7aa", background: `${def.color}33`, border: `1px solid ${def.color}66` }}>
                  KO
                </span>
              )}
            </div>
            <p className="font-spot-sans text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{def.country}</p>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Users size={10} style={{ color: "var(--text-dim)" }} />
            <span className="font-spot-mono font-bold text-[10px]" style={{ color: "var(--text-dim)" }}>{def.teams} clubs</span>
          </div>
          <div className="flex items-center gap-1 min-w-0">
            {isTournament
              ? <Trophy size={10} style={{ color: "var(--text-dim)" }} />
              : <Globe size={10} style={{ color: "var(--text-dim)" }} />
            }
            <span className="font-spot-mono text-[10px] truncate" style={{ color: "var(--text-dim)" }}>{def.format}</span>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-auto pt-1">
          <span className="font-spot-sans font-extrabold text-[11px] transition-colors"
            style={{ color: def.color === "#091c3e" ? "#93c5fd" : def.color === "#001d5b" ? "#93c5fd" : def.color }}>
            View Fixtures &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}

export function SoccerLeaguesBrowser() {
  return (
    <div className="spotlight min-h-screen">
      {/* Header */}
      <div style={{ background: "var(--panel)", borderBottom: "1px solid var(--hairline)" }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5">
          <p className="spot-label mb-0.5" style={{ color: "var(--green)" }}>FOOTBALL / SOCCER</p>
          <h1 className="font-spot-sans font-black text-2xl sm:text-3xl uppercase" style={{ color: "var(--text)", letterSpacing: "-.01em" }}>
            Leagues &amp; Tournaments
          </h1>
          <p className="mt-1 font-spot-sans text-[12px]" style={{ color: "var(--text-muted)" }}>
            10 competitions tracked · xG, PPDA &amp; win probability on every fixture
          </p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {REGIONS.map((region) => {
          const leagues = SOCCER_LEAGUES.filter((l) => l.region === region.key);
          return (
            <section key={region.key}>
              {/* Section header */}
              <div className="flex items-end gap-3 mb-4">
                <div>
                  <p className="font-spot-sans font-black text-[18px] uppercase" style={{ color: "var(--text)", letterSpacing: "-.01em" }}>
                    {region.label}
                  </p>
                  <p className="font-spot-sans text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{region.sublabel}</p>
                </div>
                <div className="flex-1 h-px mb-1" style={{ background: "var(--hairline)" }} />
                <span className="font-spot-mono font-bold text-[10px] mb-1" style={{ color: "var(--text-faint)" }}>
                  {leagues.length} {leagues.length === 1 ? "league" : "competitions"}
                </span>
              </div>

              {/* Cards grid */}
              <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))" }}>
                {leagues.map((def) => <LeagueCard key={def.key} def={def} />)}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
