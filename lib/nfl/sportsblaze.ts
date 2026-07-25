/**
 * Stubbed SportsBlaze-shaped provider for odds/props. Exposes the same async,
 * provider-style signature a real SportsBlaze client would have (keyed by week
 * and optionally position), so swapping the body for a real API call later
 * doesn't change any caller.
 */
import { RAW_PROPS } from "./fixtures/props-2026";
import type { NflPlayerProp, NflPropPosition, NflWeekKey } from "./types";

export async function getPlayerProps(_week?: NflWeekKey, pos?: NflPropPosition): Promise<NflPlayerProp[]> {
  if (!pos) return RAW_PROPS;
  return RAW_PROPS.filter((p) => p.pos === pos);
}

export async function getGameOdds(_eventId: string): Promise<NflPlayerProp[]> {
  return RAW_PROPS;
}
