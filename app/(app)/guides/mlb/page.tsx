import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { teamHex } from "@/lib/mlb/spotlight-utils";
import { teamLogoUrl } from "@/lib/mlb/api";
import { SeasonTimeline, MLB_2026_PHASES } from "@/components/web-tool/season-timeline";

const MLB_TEAMS = [
  { id: 133, name: "Athletics" },      { id: 109, name: "Diamondbacks" },
  { id: 144, name: "Braves" },         { id: 110, name: "Orioles" },
  { id: 111, name: "Red Sox" },        { id: 112, name: "Cubs" },
  { id: 113, name: "Reds" },           { id: 114, name: "Guardians" },
  { id: 115, name: "Rockies" },        { id: 116, name: "Tigers" },
  { id: 117, name: "Astros" },         { id: 118, name: "Royals" },
  { id: 108, name: "Angels" },         { id: 119, name: "Dodgers" },
  { id: 146, name: "Marlins" },        { id: 158, name: "Brewers" },
  { id: 142, name: "Twins" },          { id: 121, name: "Mets" },
  { id: 147, name: "Yankees" },        { id: 133, name: "Athletics" },
  { id: 143, name: "Phillies" },       { id: 134, name: "Pirates" },
  { id: 135, name: "Padres" },         { id: 137, name: "Giants" },
  { id: 136, name: "Mariners" },       { id: 138, name: "Cardinals" },
  { id: 139, name: "Rays" },           { id: 140, name: "Rangers" },
  { id: 141, name: "Blue Jays" },      { id: 120, name: "Nationals" },
];

const QUICK_LINKS = [
  { label: "Today's Games", desc: "Full slate with edge grades", href: "/games", color: "var(--orange)" },
  { label: "Live Scores", desc: "Live innings, win probability", href: "/scores", color: "var(--red)" },
  { label: "HR Nuke Report", desc: "Top HR props ranked by model", href: "/hr-deep-dive", color: "var(--gold)" },
  { label: "Props Builder", desc: "Build parlays from model picks", href: "/props", color: "var(--green)" },
  { label: "Edge AI", desc: "Ask the model anything", href: "/ai", color: "var(--purple-2)" },
];

const STRATEGY_CARDS = [
  {
    title: "Reading Edge Grades",
    body: "An A+ grade means our model finds 12–18% of value over the closing line. Stick to A and above for +EV bets.",
    tag: "Strategy",
  },
  {
    title: "Run Line vs Moneyline",
    body: "The run line (-1.5) inflates your payout but requires your team to win by 2+. Best used on heavy ML favorites priced above -180.",
    tag: "Betting Basics",
  },
  {
    title: "Park Factors",
    body: "Coors Field inflates all offensive numbers by ~15%. Pitcher park factors compound with individual matchup grades.",
    tag: "Advanced",
  },
  {
    title: "First 5 Innings (F5)",
    body: "The F5 bet isolates starting pitching. Use this when you like the SP edge but not the bullpen situation.",
    tag: "Prop Types",
  },
  {
    title: "Platoon Splits",
    body: "Left-handed starters are historically more vulnerable to RH lineups. Our model weights L/R splits on every prop.",
    tag: "Advanced",
  },
  {
    title: "Weather Impact",
    body: "Wind above 12 mph out to center raises over rates by ~7%. Check the weather badge on each game card.",
    tag: "Factors",
  },
];

export default function MlbGuidePage() {
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
            <span className="font-spot-sans font-bold text-[11px] uppercase tracking-[.12em]" style={{ color: "var(--orange)" }}>MLB</span>
          </div>
          <h1 className="font-spot-sans font-black text-4xl sm:text-5xl uppercase leading-tight" style={{ color: "var(--text)", letterSpacing: "-.01em" }}>
            ⚾ MLB Analysis
          </h1>
          <p className="mt-2 font-spot-sans text-sm max-w-2xl" style={{ color: "var(--text-muted)" }}>
            Pitcher matchups, run line edges, park factor breakdowns, and model-backed prop picks — for every MLB game.
          </p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Season Timeline */}
        <SeasonTimeline
          title="MLB 2026 Season"
          subtitle="Regular season runs Mar 26 – Sep 27 · World Series Oct 30"
          phases={MLB_2026_PHASES}
          sport="mlb"
        />

        {/* Quick Links */}
        <div>
          <p className="spot-label mb-3" style={{ color: "var(--orange)" }}>Jump Into the Data</p>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))" }}>
            {QUICK_LINKS.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="flex items-center gap-3 rounded-[16px] px-4 py-4 transition-all hover:scale-[1.02] spot-lift"
                style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `color-mix(in srgb, ${q.color} 15%, transparent)` }}>
                  <span className="text-base">
                    {q.href === "/games" ? "⚾" : q.href === "/scores" ? "📊" : q.href === "/hr-deep-dive" ? "💥" : q.href === "/props" ? "🎯" : "🤖"}
                  </span>
                </div>
                <div>
                  <p className="font-spot-sans font-extrabold text-sm" style={{ color: "var(--text)" }}>{q.label}</p>
                  <p className="font-spot-sans text-[11px]" style={{ color: "var(--text-muted)" }}>{q.desc}</p>
                </div>
                <ChevronRight size={14} className="ml-auto shrink-0" style={{ color: "var(--text-dim)" }} />
              </Link>
            ))}
          </div>
        </div>

        {/* Strategy Cards */}
        <div>
          <p className="spot-label mb-3" style={{ color: "var(--text-faint)" }}>Betting Strategy</p>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
            {STRATEGY_CARDS.map((c) => (
              <div key={c.title} className="rounded-[16px] p-4" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
                <span className="inline-block font-spot-sans font-extrabold text-[9px] uppercase tracking-[.10em] px-2 py-0.5 rounded mb-2"
                  style={{ color: "var(--orange)", background: "var(--orange-tint)", border: "1px solid var(--orange-line)" }}>
                  {c.tag}
                </span>
                <p className="font-spot-sans font-extrabold text-sm" style={{ color: "var(--text)" }}>{c.title}</p>
                <p className="mt-1 font-spot-sans text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Browse Teams */}
        <div>
          <p className="spot-label mb-3" style={{ color: "var(--text-faint)" }}>Browse by Team</p>
          <div className="flex flex-wrap gap-2">
            {MLB_TEAMS.filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i).map((t) => (
              <Link
                key={t.id}
                href={`/games?team=${t.id}`}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 font-spot-sans font-semibold text-[11px] transition-all hover:opacity-80"
                style={{ background: `${teamHex(t.id)}18`, border: `1px solid ${teamHex(t.id)}35`, color: "var(--text-2)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={teamLogoUrl(t.id)} alt={t.name} className="w-4 h-4 object-contain"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
