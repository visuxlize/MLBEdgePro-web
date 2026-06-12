import Link from "next/link";
import { Trophy, Map, BarChart3, Users, ArrowRight, Globe2 } from "lucide-react";

export const metadata = { title: "World Cup 2026 – MLBEdgePro" };

const SECTIONS = [
  {
    href:    "/worldcup/bracket",
    icon:    Trophy,
    title:   "Live Bracket",
    desc:    "32-team knockout bracket with ELO predictor. Simulate the tournament or pick your own winners.",
    accent:  "#FBBF24",
    gradient:"from-[#FBBF24]/10 to-transparent",
  },
  {
    href:    "/worldcup/map",
    icon:    Map,
    title:   "Host Map",
    desc:    "Interactive USA/Canada/Mexico venue map. Explore stadiums, weather, and match schedules.",
    accent:  "#34D399",
    gradient:"from-[#34D399]/10 to-transparent",
  },
  {
    href:    "/worldcup/props",
    icon:    BarChart3,
    title:   "Betting & Props",
    desc:    "Live FanDuel moneylines, Asian handicaps, goal totals, and player prop value bets.",
    accent:  "#FF7828",
    gradient:"from-[#FF7828]/10 to-transparent",
  },
  {
    href:    "/worldcup/h2h",
    icon:    Users,
    title:   "H2H Matchup",
    desc:    "Virtual pitch with predicted starting XI. Click players for individual tournament stats.",
    accent:  "#818CF8",
    gradient:"from-[#818CF8]/10 to-transparent",
  },
];

export default function WorldCupHubPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#FBBF24]/20 bg-[#FBBF24]/[0.06] px-4 py-2 mb-6">
          <Globe2 size={13} className="text-[#FBBF24]" strokeWidth={2.5} />
          <span className="text-[10px] font-black text-[#FBBF24] tracking-widest uppercase">
            Limited-Time Feature
          </span>
        </div>
        <h1 className="text-4xl font-black text-white mb-3">
          World Cup
          <span className="text-[#FBBF24]"> 2026</span>
        </h1>
        <p className="text-white/40 text-sm max-w-md mx-auto">
          Full tournament analysis — bracket predictions, host city maps, live odds, and player matchups.
        </p>
      </div>


      {/* Section cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SECTIONS.map(({ href, icon: Icon, title, desc, accent, gradient }) => (
          <Link key={href} href={href} className="group block">
            <div
              className={`rounded-2xl border border-white/[0.07] bg-gradient-to-br ${gradient} p-6 h-full transition-all hover:border-white/15 hover:scale-[1.01]`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}
              >
                <Icon size={18} style={{ color: accent }} strokeWidth={2} />
              </div>
              <h2 className="text-base font-black text-white mb-1.5">{title}</h2>
              <p className="text-xs text-white/40 leading-relaxed mb-4">{desc}</p>
              <div
                className="flex items-center gap-1 text-[10px] font-bold"
                style={{ color: accent }}
              >
                Open
                <ArrowRight
                  size={11}
                  strokeWidth={2.5}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-center text-[10px] text-white/20 mt-10">
        Data: API-Football · The Odds API (FanDuel) · ELO ratings · Available through Jul 2026
      </p>
    </div>
  );
}
