/**
 * Stubbed `nfl-data-py`-shaped provider. Exposes the same async, provider-style
 * signature a future Python-service client would have, so swapping the body
 * for a real call later doesn't change any caller.
 */
import { STARTING_QB } from "./fixtures/rosters-2026";

export async function getStartingQb(abbr: string): Promise<string | undefined> {
  return STARTING_QB[abbr];
}
