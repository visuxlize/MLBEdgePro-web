/**
 * Notable-player fixture standing in for a real stats-provider roster call.
 * One recognizable player per team, verified against ESPN's live 2026 roster
 * endpoint (site.api.espn.com/.../teams/{abbr}/roster) — names, teams, and
 * espnId are real; only the association "this team's headline player" is a
 * stand-in until a real roster/depth-chart provider is wired in behind
 * lib/wnba/wnba-data.ts.
 */
export const NOTABLE_PLAYER: Record<string, { name: string; pos: "PG" | "SG" | "SF" | "PF" | "C"; espnId: string }> = {
  ATL: { name: "Angel Reese",     pos: "PF", espnId: "4433402" },
  CHI: { name: "Kamilla Cardoso", pos: "C",  espnId: "4433405" },
  CON: { name: "Brittney Griner", pos: "C",  espnId: "2490553" },
  DAL: { name: "Paige Bueckers",  pos: "PG", espnId: "4433730" },
  GS:  { name: "Tiffany Hayes",   pos: "SG", espnId: "1054" },
  IND: { name: "Caitlin Clark",   pos: "PG", espnId: "4433403" },
  LV:  { name: "A'ja Wilson",     pos: "PF", espnId: "3149391" },
  LA:  { name: "Cameron Brink",   pos: "PF", espnId: "4433404" },
  MIN: { name: "Napheesa Collier",pos: "PF", espnId: "3917450" },
  NY:  { name: "Breanna Stewart", pos: "PF", espnId: "2998928" },
  PHX: { name: "Kahleah Copper",  pos: "SG", espnId: "2998938" },
  POR: { name: "Bridget Carleton",pos: "SF", espnId: "3906972" },
  SEA: { name: "Ezi Magbegor",    pos: "PF", espnId: "4420318" },
  TOR: { name: "Marina Mabrey",   pos: "SG", espnId: "3904576" },
  WSH: { name: "Sonia Citron",    pos: "SG", espnId: "4433524" },
};
