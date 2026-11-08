import { getNflPlayerBoards, getNflProps } from "@/lib/nfl/league";
import { NflPlayers } from "@/components/web-tool/nfl-players";

export const dynamic = "force-dynamic";

export default async function NflPlayersPage() {
  const [boards, { props }] = await Promise.all([getNflPlayerBoards(), getNflProps()]);
  return <NflPlayers boards={boards} props={props} />;
}
