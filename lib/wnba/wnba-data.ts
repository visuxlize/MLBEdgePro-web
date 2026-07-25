/**
 * Stubbed roster provider. Exposes the same async, provider-style signature a
 * future stats provider client would have, so swapping the body for a real
 * call later doesn't change any caller.
 */
import { NOTABLE_PLAYER } from "./fixtures/rosters-2026";

export async function getNotablePlayer(abbr: string) {
  return NOTABLE_PLAYER[abbr];
}
