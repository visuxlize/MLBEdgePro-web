import { getGameSummary } from "@/lib/wnba/espn";
import { getPlayerProps } from "@/lib/wnba/sportsblaze";
import { wnbaH2H, wnbaEdgeFactors, wnbaNarrative, wnbaWinProbPath } from "@/lib/wnba/deep-dive";
import { WnbaGameDeepDive } from "@/components/web-tool/wnba-game-deep-dive";

export default async function WnbaGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const summary = await getGameSummary(id);

  if (!summary) {
    return (
      <div className="spotlight min-h-screen flex items-center justify-center">
        <p className="font-spot-sans text-sm" style={{ color: "var(--text-muted)" }}>Game not found.</p>
      </div>
    );
  }

  const { game, winProbSeries } = summary;
  const allProps = await getPlayerProps();
  const gameProps = allProps.filter((p) => p.team === game.away || p.team === game.home).slice(0, 4);
  const narrative = wnbaNarrative(game);
  const wp = wnbaWinProbPath(game.homeWinProb, winProbSeries, game.id);

  return (
    <WnbaGameDeepDive
      game={game}
      h2h={wnbaH2H(game)}
      factors={wnbaEdgeFactors(game)}
      narrativeText={narrative.text}
      narrativeTags={narrative.tags}
      wpLine={wp.line}
      wpArea={wp.area}
      gameProps={gameProps}
    />
  );
}
