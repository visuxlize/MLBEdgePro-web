/**
 * Placeholder roster fixture standing in for a real stats-provider roster call.
 * One notable player per team, used only to label prop/impact cards until a
 * real roster/box-score provider is wired in behind lib/wnba/wnba-data.ts.
 */
export const NOTABLE_PLAYER: Record<string, { name: string; pos: "PG" | "SG" | "SF" | "PF" | "C" }> = {
  ATL: { name: "Rhyne Howard",      pos: "SG" },
  CHI: { name: "Angel Reese",       pos: "PF" },
  CON: { name: "Marina Mabrey",     pos: "SG" },
  DAL: { name: "Arike Ogunbowale",  pos: "SG" },
  GS:  { name: "Kate Martin",       pos: "SG" },
  IND: { name: "Caitlin Clark",     pos: "PG" },
  LV:  { name: "A'ja Wilson",       pos: "PF" },
  LA:  { name: "Cameron Brink",     pos: "PF" },
  MIN: { name: "Napheesa Collier",  pos: "PF" },
  NY:  { name: "Breanna Stewart",   pos: "PF" },
  PHX: { name: "Kahleah Copper",    pos: "SG" },
  POR: { name: "Clara Fields",      pos: "SF" },
  SEA: { name: "Nneka Ogwumike",    pos: "PF" },
  TOR: { name: "Dana Voss",         pos: "PG" },
  WSH: { name: "Brittney Sanders",  pos: "SF" },
};
