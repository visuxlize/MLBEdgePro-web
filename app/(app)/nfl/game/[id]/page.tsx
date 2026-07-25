import { PaywallGate } from "@/components/web-tool/paywall-gate";
import { getGameSummary, getTeamVenueImage } from "@/lib/nfl/espn";
import { getPlayerProps } from "@/lib/nfl/sportsblaze";
import { nflH2H, nflEdgeFactors, nflNarrative, nflWinProbPath } from "@/lib/nfl/deep-dive";
import { GameDeepDive } from "@/components/web-tool/game-deep-dive";

export default async function NflGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const summary = await getGameSummary(id);

  if (!summary) {
    return (
      <div className="spotlight min-h-screen flex items-center justify-center">
        <p className="font-spot-sans text-sm" style={{ color: "var(--text-muted)" }}>Game not found.</p>
      </div>
    );
  }

  const { game, drive, winProbSeries } = summary;
  const [venueImage, allProps] = await Promise.all([
    getTeamVenueImage(game.home),
    getPlayerProps(),
  ]);
  const gameProps = allProps.filter((p) => p.team === game.away || p.team === game.home).slice(0, 4);
  const narrative = nflNarrative(game);
  const wp = nflWinProbPath(game.homeWinProb, winProbSeries, game.id);

  return (
    <PaywallGate
      requiredTier="pro"
      feature="NFL Game Analysis"
      benefits={[
        "Live win probability, drive by drive",
        "Head-to-head matchup breakdown",
        "Edge AI narrative for every game",
        "Best props with one-tap parlay building",
      ]}
    >
      <GameDeepDive
        game={game}
        drive={drive}
        venueImage={venueImage}
        h2h={nflH2H(game)}
        factors={nflEdgeFactors(game)}
        narrativeText={narrative.text}
        narrativeTags={narrative.tags}
        wpLine={wp.line}
        wpArea={wp.area}
        gameProps={gameProps}
      />
    </PaywallGate>
  );
}
