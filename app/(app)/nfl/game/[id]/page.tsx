import { buildNflProps, modelNflGame } from "@/lib/nfl/analytics";
import { nflLogoUrl, nflTeamHex } from "@/lib/nfl/teams";
import { getNflWeek, getNflGameDetail, getNflGameLines, getNflPropPool, getNflStandings, nflStandingsMap } from "@/lib/nfl/league";
import { NflGameDetailView } from "@/components/web-tool/nfl-game-detail";

export const dynamic = "force-dynamic";

export default async function NflGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getNflGameDetail(id);
  if (!detail) {
    return (
      <div className="spotlight min-h-screen flex items-center justify-center">
        <p className="font-spot-sans text-sm" style={{ color: "var(--text-muted)" }}>Game not found.</p>
      </div>
    );
  }
  const { game } = detail;
  const [standings, pool] = await Promise.all([getNflStandings(), getNflPropPool()]);
  const st = nflStandingsMap(standings);
  const model = modelNflGame(st.get(game.home), st.get(game.away), game.odds?.homeSpread);
  const lines = await getNflGameLines(game.id);
  const props = buildNflProps(
    pool,
    [{ id: game.id, away: game.away, home: game.home, kickoff: `${game.dateLabel} · ${game.timeLabel}`, total: game.odds?.overUnder, homeSpread: game.odds?.homeSpread, lines }],
    st,
  ).slice(0, 15);
  const week = await getNflWeek(game.seasonType, game.weekNum).catch(() => null);
  const strip = (week?.games ?? []).map((g) => ({
    id: g.id, href: `/nfl/game/${g.id}`, status: g.status, label: g.statusDetail,
    away: { abbr: g.away, score: g.awayScore, logo: nflLogoUrl(g.away), hex: nflTeamHex(g.away) },
    home: { abbr: g.home, score: g.homeScore, logo: nflLogoUrl(g.home), hex: nflTeamHex(g.home) },
  }));
  return <NflGameDetailView detail={detail} model={model} props={props} awayRow={st.get(game.away)} homeRow={st.get(game.home)} strip={strip} />;
}
