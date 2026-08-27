import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getWeekSchedule } from "@/lib/nfl/espn";
import { SeasonTimeline, NFL_2026_PHASES } from "@/components/web-tool/season-timeline";
import { nflTeamHex } from "@/lib/nfl/teams";
import type { NflWeekKey } from "@/lib/nfl/types";

export const dynamic = "force-dynamic";

const WEEKS: { key: NflWeekKey; label: string; range: string; dates: string }[] = [
  { key: "HOF_PRE1", label: "HOF + PRE 1", range: "AUG 6–15", dates: "Aug 6 – Aug 15, 2026" },
  { key: "PRE2",     label: "PRE 2",       range: "AUG 20–23", dates: "Aug 20 – Aug 23, 2026" },
  { key: "PRE3",     label: "PRE 3",       range: "AUG 27–29", dates: "Aug 27 – Aug 29, 2026" },
  { key: "WK1",      label: "WK 1",        range: "SEP 10",    dates: "Sep 10, 2026" },
];

const NFL_TEAMS = [
  { code: "BUF", name: "Bills" },       { code: "MIA", name: "Dolphins" },
  { code: "NE",  name: "Patriots" },    { code: "NYJ", name: "Jets" },
  { code: "BAL", name: "Ravens" },      { code: "CIN", name: "Bengals" },
  { code: "CLE", name: "Browns" },      { code: "PIT", name: "Steelers" },
  { code: "HOU", name: "Texans" },      { code: "IND", name: "Colts" },
  { code: "JAX", name: "Jaguars" },     { code: "TEN", name: "Titans" },
  { code: "DEN", name: "Broncos" },     { code: "KC",  name: "Chiefs" },
  { code: "LV",  name: "Raiders" },     { code: "LAC", name: "Chargers" },
  { code: "DAL", name: "Cowboys" },     { code: "NYG", name: "Giants" },
  { code: "PHI", name: "Eagles" },      { code: "WSH", name: "Commanders" },
  { code: "CHI", name: "Bears" },       { code: "DET", name: "Lions" },
  { code: "GB",  name: "Packers" },     { code: "MIN", name: "Vikings" },
  { code: "ATL", name: "Falcons" },     { code: "CAR", name: "Panthers" },
  { code: "NO",  name: "Saints" },      { code: "TB",  name: "Buccaneers" },
  { code: "ARI", name: "Cardinals" },   { code: "LAR", name: "Rams" },
  { code: "SF",  name: "49ers" },       { code: "SEA", name: "Seahawks" },
];

const QUICK_LINKS = [
  { label: "This Week's Slate", desc: "All games with edge grades", href: "/nfl", emoji: "🏈" },
  { label: "Player Props",      desc: "Model vs the line, by position", href: "/nfl/props", emoji: "🎯" },
];

const STRATEGY_CARDS = [
  { title: "ATS vs Spread", tag: "Basics", body: "Against the spread bets require winning by more than the listed spread. The model identifies when the spread misvalues a team by 4+ points." },
  { title: "Totals & Weather", tag: "Factors", body: "Cold games (below 30°F) depress scoring by 2–3 points on average. Wind above 15 mph affects passing efficiency significantly." },
  { title: "Home Field Edge", tag: "Factors", body: "Home teams win ~57% of games. In primetime, that edge narrows to ~52% due to opponent quality bias in scheduling." },
  { title: "First Half Lines", tag: "Prop Types", body: "1H lines move sharply based on the first drive. The model grades 1H independently of full-game totals for live betting edge." },
  { title: "Parlay Construction", tag: "Strategy", body: "Combining a ML underdog (+150) with a small team total under creates a 2-leg parlay with genuine model backing at ~3x." },
  { title: "Anytime TD Props", tag: "Prop Types", body: "The model projects anytime TD probability for every skill player. Values appear most often on RBs in run-heavy game scripts." },
];

export default async function NflGuidePage() {
  const preseasonGames = await getWeekSchedule("PRE3").catch(() => []);

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
            <span className="font-spot-sans font-bold text-[11px] uppercase tracking-[.12em]" style={{ color: "var(--purple-2)" }}>NFL</span>
          </div>
          <h1 className="font-spot-sans font-black text-4xl sm:text-5xl uppercase leading-tight" style={{ color: "var(--text)", letterSpacing: "-.01em" }}>
            🏈 NFL Analysis
          </h1>
          <p className="mt-2 font-spot-sans text-sm max-w-2xl" style={{ color: "var(--text-muted)" }}>
            Weekly matchup breakdowns, spread analysis, player props, and best bet trends — every game, every week.
          </p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Season Timeline */}
        <SeasonTimeline
          title="NFL 2026 Season"
          subtitle="Preseason Aug 6 · Regular Season Sep 10 · Super Bowl Feb 9, 2027"
          phases={NFL_2026_PHASES}
          sport="nfl"
        />

        {/* Week Schedule */}
        <div>
          <p className="spot-label mb-3" style={{ color: "var(--purple-2)" }}>2026 Schedule by Week</p>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))" }}>
            {WEEKS.map((w) => (
              <Link
                key={w.key}
                href={`/nfl`}
                className="rounded-[16px] p-4 spot-lift"
                style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}
              >
                <p className="font-spot-sans font-black text-base" style={{ color: "var(--text)" }}>{w.label}</p>
                <p className="font-spot-mono font-semibold text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{w.dates}</p>
                <p className="font-spot-sans font-extrabold text-[10px] uppercase tracking-[.10em] mt-2.5" style={{ color: "var(--purple-2)" }}>
                  View Slate →
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <p className="spot-label mb-3" style={{ color: "var(--text-faint)" }}>Quick Access</p>
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

        {/* Live PRE3 games */}
        {preseasonGames.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="spot-label" style={{ color: "var(--purple-2)" }}>PRE 3 · Aug 27–29 Games</p>
              <Link href="/nfl" className="font-spot-sans font-bold text-[11px]" style={{ color: "var(--purple-2)" }}>Full slate →</Link>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))" }}>
              {preseasonGames.slice(0, 8).map((g) => {
                const awayHex = nflTeamHex(g.away);
                const homeHex = nflTeamHex(g.home);
                const gameDate = new Date(g.date);
                return (
                  <Link
                    key={g.id}
                    href="/nfl"
                    className="rounded-[16px] p-4 spot-lift"
                    style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-spot-mono font-bold text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {gameDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <span className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.10em] px-2 py-0.5 rounded-full"
                        style={{ color: "var(--purple-2)", background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>
                        Preseason
                      </span>
                    </div>
                    {([
                      { abbr: g.away, hex: awayHex },
                      { abbr: g.home, hex: homeHex },
                    ] as { abbr: string; hex: string }[]).map(({ abbr, hex }, i) => (
                      <div key={i} className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: hex }}>
                          <span className="font-spot-sans font-black text-[8px] text-white">{abbr.slice(0, 3)}</span>
                        </div>
                        <span className="flex-1 font-spot-sans font-extrabold text-sm" style={{ color: "var(--text)" }}>{abbr}</span>
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

        {/* Strategy */}
        <div>
          <p className="spot-label mb-3" style={{ color: "var(--text-faint)" }}>NFL Betting Strategy</p>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
            {STRATEGY_CARDS.map((c) => (
              <div key={c.title} className="rounded-[16px] p-4" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
                <span className="inline-block font-spot-sans font-extrabold text-[9px] uppercase tracking-[.10em] px-2 py-0.5 rounded mb-2"
                  style={{ color: "var(--purple-2)", background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>
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
          <p className="spot-label mb-3" style={{ color: "var(--text-faint)" }}>All 32 Teams</p>
          <div className="flex flex-wrap gap-2">
            {NFL_TEAMS.map((t) => {
              const hex = nflTeamHex(t.code);
              return (
                <Link
                  key={t.code}
                  href="/nfl"
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-spot-sans font-semibold text-[11px] transition-all hover:opacity-80"
                  style={{ background: `${hex}22`, border: `1px solid ${hex}40`, color: "var(--text-2)" }}
                >
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ background: hex }} />
                  {t.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
