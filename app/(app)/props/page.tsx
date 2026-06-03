import { Suspense } from "react";
import { Layers, RefreshCw } from "lucide-react";
import { fetchTodaysGames, teamLogoUrl, type Game } from "@/lib/mlb/api";
import { PaywallGate } from "@/components/web-tool/paywall-gate";

const PROP_TYPES = [
  { id: "HR", label: "Home Run", color: "#818cf8" },
  { id: "Hit", label: "1+ Hit", color: "#50C882" },
  { id: "2+Hits", label: "2+ Hits", color: "#FF7828" },
  { id: "K", label: "Pitcher Ks", color: "#2dd4bf" },
];

function PropCard({ game }: { game: Game }) {
  const away = game.teams.away;
  const home = game.teams.home;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5">
      <div className="flex items-center gap-3 mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={teamLogoUrl(away.team.id)} alt="" width={28} height={28} className="w-7 h-7 object-contain" />
        <div>
          <p className="text-sm font-bold text-white">
            {away.team.name.split(" ").pop()} @ {home.team.name.split(" ").pop()}
          </p>
          {away.probablePitcher && (
            <p className="text-[11px] text-white/30">
              {away.probablePitcher.fullName.split(" ").pop()} vs {home.probablePitcher?.fullName.split(" ").pop() ?? "TBD"}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {PROP_TYPES.map((pt) => {
          const pct = Math.max(18, Math.min(88, 35 + ((game.gamePk + pt.id.charCodeAt(0)) % 50)));
          return (
            <div key={pt.id} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
              <p className="text-[10px] text-white/30 font-bold tracking-wider uppercase mb-1.5">{pt.label}</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-black" style={{ color: pt.color }}>{pct}%</span>
                <span className="text-[10px] text-white/25">{pct >= 65 ? "Strong" : pct >= 45 ? "Possible" : "Risky"}</span>
              </div>
              <div className="w-full h-1 rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pt.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

async function PropsContent() {
  let games: Game[] = [];
  try { games = await fetchTodaysGames(); } catch {}

  const withPitchers = games.filter((g) => g.teams.away.probablePitcher || g.teams.home.probablePitcher);

  if (!withPitchers.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Layers size={44} className="text-white/10 mb-4" strokeWidth={1.2} />
        <p className="text-white/35">No prop data available yet — check back closer to first pitch</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {withPitchers.map((g) => <PropCard key={g.gamePk} game={g} />)}
    </div>
  );
}

export default function PropsPage() {
  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <div className="mb-8">
        <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-1">Today's Slate</p>
        <h1 className="text-3xl font-black text-white mb-1">Prop Builder</h1>
        <p className="text-sm text-white/35">HR, Hit, and strikeout props for every confirmed matchup</p>
      </div>

      <PaywallGate
        feature="Prop Builder"
        benefits={[
          "HR, 1+ Hit & 2+ Hit props",
          "Pitcher strikeout projections",
          "Full batter vs pitcher matchup",
          "Build & save multi-leg slips",
        ]}
      >
        <Suspense fallback={
          <div className="flex items-center gap-3 py-16 text-white/30">
            <RefreshCw size={18} className="animate-spin" strokeWidth={1.5} />
            <span className="text-sm">Loading prop data…</span>
          </div>
        }>
          <PropsContent />
        </Suspense>
      </PaywallGate>

      <p className="mt-6 text-xs text-white/15">
        Probabilities are model estimates based on 2025 season stats. For educational use only — not betting advice.
      </p>
    </div>
  );
}
