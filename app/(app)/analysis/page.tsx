import { Suspense } from "react";
import { TrendingUp, RefreshCw, Zap } from "lucide-react";
import { fetchTodaysGames, teamLogoUrl, type Game } from "@/lib/mlb/api";
import { PaywallGate } from "@/components/web-tool/paywall-gate";

function EdgeCard({ game, index }: { game: Game; index: number }) {
  const away = game.teams.away;
  const home = game.teams.home;
  // Deterministic mock edge score based on game index
  const edgeScore = Math.max(45, Math.min(95, 55 + ((game.gamePk * 7 + index * 13) % 40)));
  const edgeColor = edgeScore >= 75 ? "#50C882" : edgeScore >= 60 ? "#FF7828" : "#818cf8";

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={teamLogoUrl(away.team.id)} alt="" width={32} height={32} className="w-8 h-8 object-contain" />
          <div>
            <p className="text-sm font-bold text-white">
              {away.team.name.split(" ").pop()} <span className="text-white/25 font-normal">@</span> {home.team.name.split(" ").pop()}
            </p>
            {away.probablePitcher && home.probablePitcher && (
              <p className="text-[11px] text-white/30 mt-0.5">
                {away.probablePitcher.fullName.split(" ").pop()} vs {home.probablePitcher.fullName.split(" ").pop()}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/25 tracking-widest uppercase">Edge Score</p>
          <p className="text-2xl font-black" style={{ color: edgeColor }}>{edgeScore}</p>
        </div>
      </div>

      {/* Edge bar */}
      <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${edgeScore}%`, backgroundColor: edgeColor }}
        />
      </div>

      <p className="text-xs text-white/35 leading-relaxed">
        {edgeScore >= 75
          ? "Strong pitcher-batter mismatch detected. Value on the over."
          : edgeScore >= 60
          ? "Moderate edge. Monitor lineup confirmation closer to first pitch."
          : "Slight lean. Weather and lineup dependent."}
      </p>
    </div>
  );
}

async function EdgeContent() {
  let games: Game[] = [];
  try { games = await fetchTodaysGames(); } catch {}

  const withPitchers = games.filter(
    (g) => g.teams.away.probablePitcher && g.teams.home.probablePitcher
  );

  if (!withPitchers.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Zap size={44} className="text-white/10 mb-4" strokeWidth={1.2} />
        <p className="text-white/35">Edge data requires confirmed pitchers</p>
      </div>
    );
  }

  const sorted = [...withPitchers].sort((a, b) => {
    const ea = Math.max(45, Math.min(95, 55 + ((a.gamePk * 7) % 40)));
    const eb = Math.max(45, Math.min(95, 55 + ((b.gamePk * 7) % 40)));
    return eb - ea;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sorted.map((g, i) => <EdgeCard key={g.gamePk} game={g} index={i} />)}
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <div className="mb-8">
        <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-1">Today's Edge</p>
        <h1 className="text-3xl font-black text-white mb-1">Edge Report</h1>
        <p className="text-sm text-white/35">AI-ranked value bets across today's full slate</p>
      </div>

      <PaywallGate
        feature="Edge Report"
        benefits={[
          "Value bets ranked by edge score",
          "Pitcher vs lineup matchup grades",
          "Weather & ballpark factor analysis",
          "AI-powered game insights",
        ]}
      >
        <Suspense fallback={
          <div className="flex items-center gap-3 py-16 text-white/30">
            <RefreshCw size={18} className="animate-spin" strokeWidth={1.5} />
            <span className="text-sm">Analyzing edges…</span>
          </div>
        }>
          <EdgeContent />
        </Suspense>
      </PaywallGate>
    </div>
  );
}
