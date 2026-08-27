import Link from "next/link";
import { fetchTodaysGames } from "@/lib/mlb/api";
import { getWeekSchedule } from "@/lib/nfl/espn";
import { getSchedule as getWnbaSchedule } from "@/lib/wnba/espn";
import { ChevronRight, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

interface SportCard {
  key: string;
  label: string;
  emoji: string;
  href: string;
  description: string;
  gameCount: number;
  accentColor: string;
  subcategories: { label: string; href: string }[];
}

export default async function GuidesPage() {
  const [mlbGames, nflGames, wnbaGames] = await Promise.all([
    fetchTodaysGames().catch(() => []),
    getWeekSchedule("HOF_PRE1").catch(() => []),
    getWnbaSchedule().catch(() => []),
  ]);

  const sports: SportCard[] = [
    {
      key:         "mlb",
      label:       "MLB",
      emoji:       "⚾",
      href:        "/guides/mlb",
      description: "Betting guides, pitcher matchups, run line analysis, and park factor breakdowns for every MLB game.",
      gameCount:   mlbGames.length,
      accentColor: "#f97316",
      subcategories: [
        { label: "Today's Games",   href: "/games" },
        { label: "Live Scores",     href: "/scores" },
        { label: "HR Nuke Report",  href: "/hr-deep-dive" },
        { label: "Props Builder",   href: "/props" },
        { label: "Edge AI",         href: "/ai" },
      ],
    },
    {
      key:         "nfl",
      label:       "NFL",
      emoji:       "🏈",
      href:        "/guides/nfl",
      description: "Weekly matchup breakdowns, spread analysis, player props, and best bet trends for the NFL slate.",
      gameCount:   nflGames.length,
      accentColor: "#7c5cfa",
      subcategories: [
        { label: "This Week's Slate", href: "/nfl" },
        { label: "Player Props",      href: "/nfl/props" },
      ],
    },
    {
      key:         "wnba",
      label:       "WNBA",
      emoji:       "🏀",
      href:        "/guides/wnba",
      description: "Game-by-game analysis, player impact scores, and model-backed picks for every WNBA matchup.",
      gameCount:   wnbaGames.length,
      accentColor: "#2dd4bf",
      subcategories: [
        { label: "Today's Games",   href: "/wnba" },
        { label: "Player Props",    href: "/wnba/props" },
        { label: "Impact Report",   href: "/wnba/impact" },
      ],
    },
    {
      key:         "nhl",
      label:       "NHL",
      emoji:       "🏒",
      href:        "/guides/nhl",
      description: "Puck line breakdowns, goaltender matchups, and power play analysis. Coming soon.",
      gameCount:   0,
      accentColor: "#60a5fa",
      subcategories: [],
    },
  ];

  return (
    <div className="spotlight min-h-screen">
      {/* Page header */}
      <div style={{ background: "var(--panel)", borderBottom: "1px solid var(--hairline)" }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen size={20} style={{ color: "var(--orange)" }} />
            <span className="font-spot-sans font-bold text-[11px] uppercase tracking-[.14em]" style={{ color: "var(--orange-soft)" }}>
              Guides & Analysis
            </span>
          </div>
          <h1 className="font-spot-sans font-black text-4xl sm:text-5xl uppercase leading-tight" style={{ color: "var(--text)", letterSpacing: "-.01em" }}>
            Betting Guides
          </h1>
          <p className="mt-2 font-spot-sans text-sm max-w-xl" style={{ color: "var(--text-muted)" }}>
            Deep-dive analysis across every sport — organized by league, team, and individual matchup.
          </p>

          {/* Browse by Sport — quick nav at top */}
          <div className="flex items-center gap-2.5 flex-wrap mt-5">
            {sports.filter(s => s.subcategories.length > 0).map((s) => (
              <Link
                key={s.key}
                href={s.href}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-spot-sans font-extrabold text-[12px] uppercase tracking-[.08em] transition-all hover:opacity-80"
                style={{ background: `${s.accentColor}18`, border: `1px solid ${s.accentColor}40`, color: s.accentColor }}
              >
                {s.emoji} {s.label}
                <ChevronRight size={12} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Sport grid */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
          {sports.map((s) => (
            <div
              key={s.key}
              className="flex flex-col rounded-[20px] overflow-hidden"
              style={{ background: "var(--panel)", border: "1px solid var(--hairline)", boxShadow: "var(--shadow-card)" }}
            >
              {/* Sport header */}
              <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid var(--hairline)" }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px]"
                      style={{ background: `${s.accentColor}18`, border: `1px solid ${s.accentColor}35` }}
                    >
                      {s.emoji}
                    </span>
                    <div>
                      <h2 className="font-spot-sans font-black text-xl uppercase tracking-[.02em]" style={{ color: "var(--text)" }}>{s.label}</h2>
                      {s.gameCount > 0 && (
                        <p className="font-spot-mono font-bold text-[11px]" style={{ color: s.accentColor }}>
                          {s.gameCount} {s.gameCount === 1 ? "game" : "games"} available
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <p className="font-spot-sans text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {s.description}
                </p>
              </div>

              {/* Subcategories */}
              {s.subcategories.length > 0 ? (
                <nav className="flex-1 py-2">
                  {s.subcategories.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className="flex items-center justify-between px-5 py-3 transition-colors group"
                      style={{ borderBottom: "1px solid var(--hairline-2)" }}
                    >
                      <span className="font-spot-sans font-semibold text-[13px]" style={{ color: "var(--text-3)" }}>{sub.label}</span>
                      <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" style={{ color: "var(--text-dim)" }} />
                    </Link>
                  ))}
                </nav>
              ) : (
                <div className="flex-1 flex items-center justify-center py-8">
                  <span className="font-spot-sans font-bold text-[12px] uppercase tracking-[.10em]"
                    style={{ color: "var(--text-dim)", background: "rgba(255,255,255,.05)", padding: "6px 14px", borderRadius: 8, border: "1px solid var(--hairline)" }}>
                    Coming Soon
                  </span>
                </div>
              )}

              {/* CTA footer */}
              {s.subcategories.length > 0 && (
                <Link
                  href={s.href}
                  className="flex items-center justify-between px-5 py-3.5 font-spot-sans font-extrabold text-[12px] uppercase tracking-[.08em] transition-all hover:opacity-90"
                  style={{ background: `linear-gradient(135deg, ${s.accentColor}cc, ${s.accentColor})`, color: "#fff" }}
                >
                  <span>Browse {s.label} Analysis</span>
                  <ChevronRight size={14} />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
