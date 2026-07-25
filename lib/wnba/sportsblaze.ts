/**
 * Stubbed odds/props provider. Exposes the same async, provider-style signature
 * a real odds provider client would have (keyed by position), so swapping the
 * body for a real API call later doesn't change any caller.
 */
import { RAW_PROPS } from "./fixtures/props-2026";
import type { WnbaPlayerProp, WnbaPropPosition } from "./types";

export async function getPlayerProps(pos?: WnbaPropPosition): Promise<WnbaPlayerProp[]> {
  if (!pos) return RAW_PROPS;
  return RAW_PROPS.filter((p) => p.pos === pos);
}
