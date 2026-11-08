/** A pick queued from HR Nuke for import into the MLB prop slip (stored in localStorage). */
export interface AIPick {
  playerId: number;
  playerName: string;
  teamId: number;
  propType: string;
  probability: number;
  pitcherName: string;
  description: string;
  odds: string;
}
