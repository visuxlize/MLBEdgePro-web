import { buildNbaProps, modelNbaGame } from "@/lib/nba/analytics";
import { nbaLogoUrl, nbaTeamHex } from "@/lib/nba/teams";
import { getNbaSchedule, getNbaGameDetail, getNbaPlayerSeasons, getNbaStandings, standingsMap } from "@/lib/nba/espn";
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
  const day = await getNbaSchedule(game.date ? new Date(game.date).toLocaleDateString("en-CA", { timeZone: "America/New_York" }).replace(/-/g, "") : undefined).catch(() => []);
  const strip = day.map((g) => ({
    id: g.id, href: `/nba/game/${g.id}`, status: g.status, label: g.statusDetail,
    away: { abbr: g.away, score: g.awayScore, logo: nbaLogoUrl(g.away), hex: nbaTeamHex(g.away) },
    home: { abbr: g.home, score: g.homeScore, logo: nbaLogoUrl(g.home), hex: nbaTeamHex(g.home) },
  }));
  return (
    <NbaGameDeepDive detail={detail} model={model} props={props} awayRank={st.get(game.away)?.rank} homeRank={st.get(game.home)?.rank} strip={strip} />
  );
}
