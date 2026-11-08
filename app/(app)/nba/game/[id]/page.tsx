import { buildNbaProps, modelNbaGame } from "@/lib/nba/analytics";
import { getNbaGameDetail, getNbaPlayerSeasons, getNbaStandings, standingsMap } from "@/lib/nba/espn";
import { getNbaGameLines } from "@/lib/nba/props";
import { NbaGameDeepDive } from "@/components/web-tool/nba-game-deep-dive";

export const dynamic = "force-dynamic";

export default async function NbaGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getNbaGameDetail(id);
  if (!detail) {
    return (
      <div className="spotlight min-h-screen flex items-center justify-center">
        <p className="font-spot-sans text-sm" style={{ color: "var(--text-muted)" }}>Game not found.</p>
      </div>
    );
  }
  const { game } = detail;
  const [standings, players] = await Promise.all([getNbaStandings(), getNbaPlayerSeasons(160)]);
  const st = standingsMap(standings);
  const model = modelNbaGame(st.get(game.home), st.get(game.away), game.odds?.homeSpread);
  const lines = await getNbaGameLines(game.id);
  const props = buildNbaProps(players, [{ id: game.id, away: game.away, home: game.home, tipLabel: game.timeLabel, total: game.odds?.overUnder, homeSpread: game.odds?.homeSpread, lines }], st).slice(0, 12);
  return (
    <NbaGameDeepDive detail={detail} model={model} props={props} awayRank={st.get(game.away)?.rank} homeRank={st.get(game.home)?.rank} />
  );
}
