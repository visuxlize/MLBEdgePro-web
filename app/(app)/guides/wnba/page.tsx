import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getSchedule } from "@/lib/wnba/espn";
import { wnbaTeamHex, WNBA_TEAMS } from "@/lib/wnba/teams";
import { SeasonTimeline, WNBA_2026_PHASES } from "@/components/web-tool/season-timeline";

export const dynamic = "force-dynamic";

const QUICK_LINKS = [
  { label: "Today's Games", desc: "Full slate with impact scores", href: "/wnba", emoji: "🏀" },
  { label: "Player Props",  desc: "Model picks by position",      href: "/wnba/props", emoji: "🎯" },
  { label: "Impact Report", desc: "Player impact rankings",       href: "/wnba/impact", emoji: "📊" },
];

const STRATEGY_CARDS = [
  { title: "Pace & Tempo", tag: "Factors", body: "High-pace WNBA teams push possessions above 80 per game. The model adjusts totals for pace matchups — slow vs. fast is the sharpest edge." },
  { title: "Road Fatigue", tag: "Factors", body: "WNBA road travel is condensed. Teams on a back-to-back road spot have historically covered at below 44% ATS vs. a rested home team." },
  { title: "Point Spread Basics", tag: "Basics", body: "The spread requires winning or losing by the listed margin. The model finds spreads miscalibrated by 5+ points — those are the highest-edge plays." },
  { title: "Player Props", tag: "Prop Types", body: "Points, rebounds, assists, and 3PM lines often open soft in the WNBA. The model compares usage-adjusted projections to opening lines daily." },
  { title: "Parlay Construction", tag: "Strategy", body: "Combining a model-backed ML underdog with a low total under creates a 2-leg parlay with genuine positive expected value at ~2.8x." },
  { title: "Home Court Edge", tag: "Factors", body: "Home WNBA teams cover ~54% of games. In rivalry matchups (e.g., NY Liberty vs. Las Vegas Aces), the edge narrows significantly." },
];

export default async function WnbaGuidePage() {
  const games = await getSchedule().catch(() => []);
  const todayGames = games.slice(0, 6);

  const teams = Object.entries(WNBA_TEAMS);

  return (
    <div className="spotlight min-h-screen">
      {/* Header */}
      <div style={{ background: "var(--panel)", borderBottom: "1px solid var(--hairline)" }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/guides" className="font-spot-sans font-semibold text-[11px] uppercase tracking-[.12em]" style={{ color: "var(--text-muted)" }}>
              Guides
            </Link>
            <ChevronRight size={12} style={{ color: "var(--text-dim)" }} />
            <span className="font-spot-sans font-bold text-[11px] uppercase tracking-[.12em]" style={{ color: "#2dd4bf" }}>WNBA</span>
          </div>
          <h1 className="font-spot-sans font-black text-4xl sm:text-5xl uppercase leading-tight" style={{ color: "var(--text)", letterSpacing: "-.01em" }}>
            🏀 WNBA Analysis
          </h1>
          <p className="mt-2 font-spot-sans text-sm max-w-2xl" style={{ color: "var(--text-muted)" }}>
            Game-by-game breakdowns, player impact scores, prop analysis, and model-backed picks for every WNBA matchup.
          </p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Season Timeline */}
        <SeasonTimeline
          title="WNBA 2026 Season"
          subtitle="Regular season May 15 – Sep 20 · Finals Oct 13"
          phases={WNBA_2026_PHASES}
          sport="wnba"
        />

        {/* Quick Links */}
        <div>
          <p className="spot-label mb-3" style={{ color: "#2dd4bf" }}>Quick Access</p>
          <div className="flex gap-3 flex-wrap">
            {QUICK_LINKS.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="flex items-center gap-3 rounded-[16px] px-5 py-4 spot-lift"
                style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}
              >
                <span className="text-2xl">{q.emoji}</span>
                <div>
                  <p className="font-spot-sans font-extrabold text-sm" style={{ color: "var(--text)" }}>{q.label}</p>
                  <p className="font-spot-sans text-[11px]" style={{ color: "var(--text-muted)" }}>{q.desc}</p>
                </div>
                <ChevronRight size={14} className="ml-2 shrink-0" style={{ color: "var(--text-dim)" }} />
              </Link>
            ))}
          </div>
        </div>

        {/* Today's Games */}
        {todayGames.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="spot-label" style={{ color: "#2dd4bf" }}>Today&apos;s Games</p>
              <Link href="/wnba" className="font-spot-sans font-bold text-[11px]" style={{ color: "#2dd4bf" }}>Full slate →</Link>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))" }}>
              {todayGames.map((g) => {
                const awayHex = wnbaTeamHex(g.away);
                const homeHex = wnbaTeamHex(g.home);
                const gameDate = new Date(g.date);
                return (
                  <Link
                    key={g.id}
                    href="/wnba"
                    className="rounded-[16px] p-4 spot-lift"
                    style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-spot-mono font-bold text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {gameDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })} ET
                      </span>
                      {g.status === "live" && (
                        <span className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.10em] px-2 py-0.5 rounded-full"
                          style={{ color: "var(--red)", background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.3)" }}>
                          Live
                        </span>
                      )}
                    </div>
                    {([
                      { abbr: g.away, hex: awayHex },
                      { abbr: g.home, hex: homeHex },
                    ] as { abbr: string; hex: string }[]).map(({ abbr, hex }, i) => (
                      <div key={i} className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: hex }}>
                          <span className="font-spot-sans font-black text-[8px] text-white">{abbr.slice(0, 3)}</span>
                        </div>
                        <span className="flex-1 font-spot-sans font-extrabold text-sm" style={{ color: "var(--text)" }}>{WNBA_TEAMS[abbr]?.name ?? abbr}</span>
                        <span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-dim)" }}>{abbr}</span>
                      </div>
                    ))}
                    <div className="flex h-1.5 rounded overflow-hidden mt-2" style={{ background: "rgba(255,255,255,.08)" }}>
                      <div style={{ width: "48%", background: awayHex }} />
                      <div style={{ flex: 1, background: homeHex }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Strategy Cards */}
        <div>
          <p className="spot-label mb-3" style={{ color: "var(--text-faint)" }}>WNBA Betting Strategy</p>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
            {STRATEGY_CARDS.map((c) => (
              <div key={c.title} className="rounded-[16px] p-4" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
                <span className="inline-block font-spot-sans font-extrabold text-[9px] uppercase tracking-[.10em] px-2 py-0.5 rounded mb-2"
                  style={{ color: "#2dd4bf", background: "rgba(45,212,191,.12)", border: "1px solid rgba(45,212,191,.25)" }}>
                  {c.tag}
                </span>
                <p className="font-spot-sans font-extrabold text-sm" style={{ color: "var(--text)" }}>{c.title}</p>
                <p className="mt-1 font-spot-sans text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Teams */}
        <div>
          <p className="spot-label mb-3" style={{ color: "var(--text-faint)" }}>All Teams</p>
          <div className="flex flex-wrap gap-2">
            {teams.map(([abbr, info]) => {
              const hex = wnbaTeamHex(abbr);
              return (
                <Link
                  key={abbr}
                  href="/wnba"
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-spot-sans font-semibold text-[11px] transition-all hover:opacity-80"
                  style={{ background: `${hex}22`, border: `1px solid ${hex}40`, color: "var(--text-2)" }}
                >
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ background: hex }} />
                  {info.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
