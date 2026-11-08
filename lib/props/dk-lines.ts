import "server-only";

/**
 * Real sportsbook player-prop lines — DraftKings (ESPN provider 100) via ESPN's core odds API.
 *   GET sports.core.api.espn.com/v2/sports/{sport}/leagues/{league}/events/{id}/competitions/{id}/odds/100/propBets
 * No API key required. Lines post roughly 1–2 days before kickoff / tip-off, so games further out return 404.
 */

const CORE = "https://sports.core.api.espn.com/v2/sports";

export interface DkLine {
  athleteId: string;
  /** ESPN season-athlete resource (resolves to name, jersey, team) */
  athleteRef: string;
  /** ESPN's market name, e.g. "Total Points" */
  market: string;
  line: number;
  openLine: number;
  /** DraftKings' quoted American price at this line (side not specified by ESPN) */
  price?: number;
  /** Over/Yes price when ESPN supplies one (soccer & milestone markets) */
  overPrice?: number;
  openOverPrice?: number;
  updated?: string;
}

const athleteIdOf = (ref?: string) => ref?.match(/athletes\/(\d+)/)?.[1];

function toLine(it: any): DkLine | null {
  const athleteId = athleteIdOf(it.athlete?.$ref);
  const tv = it.current?.target?.value;
  const hasOver = it.current?.over?.american != null;
  // Yes/No markets (anytime scorer, to receive a card…) have a price but no numeric target.
  if (!athleteId || (typeof tv !== "number" && !hasOver)) return null;
  const line = typeof tv === "number" ? tv : 0;
  const price = it.odds?.american?.value != null ? parseInt(String(it.odds.american.value), 10) : undefined;
  const overAm = it.current?.over?.american;
  return {
    athleteId,
    athleteRef: String(it.athlete?.$ref ?? ""),
    market: it.type?.name ?? "",
    line,
    openLine: typeof it.open?.target?.value === "number" ? it.open.target.value : line,
    price: Number.isFinite(price) ? price : undefined,
    overPrice: overAm != null ? parseInt(String(overAm), 10) : undefined,
    openOverPrice: it.open?.over?.american != null ? parseInt(String(it.open.over.american), 10) : undefined,
    updated: it.lastUpdated,
  };
}

async function getPage(url: string, revalidate: number): Promise<any | null> {
  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetch prop lines for one event. `wanted` filters by ESPN market name (exact match).
 * Page size is capped (25 for NBA) and items are ordered by market type, so we only walk the first `maxPages`.
 */
export async function getEventPropLines(
  sportPath: string,
  eventId: string,
  wanted: (marketName: string) => boolean,
  opts: { maxPages?: number; revalidate?: number } = {},
): Promise<DkLine[]> {
  const { maxPages = 5, revalidate = 300 } = opts;
  const base = `${CORE}/${sportPath}/events/${eventId}/competitions/${eventId}/odds/100/propBets`;
  const first = await getPage(`${base}?limit=1000&page=1`, revalidate);
  if (!first?.items) return [];
  const pageCount: number = first.pageCount ?? 1;
  const pages = [first];
  if (pageCount > 1) {
    const rest = await Promise.all(
      Array.from({ length: Math.min(pageCount, maxPages) - 1 }, (_, i) => getPage(`${base}?limit=1000&page=${i + 2}`, revalidate)),
    );
    pages.push(...rest.filter(Boolean));
  }
  const out: DkLine[] = [];
  for (const p of pages) {
    for (const it of p.items ?? []) {
      if (!wanted(it.type?.name ?? "")) continue;
      const l = toLine(it);
      if (l) out.push(l);
    }
  }
  return out;
}

export interface AthleteInfo { name: string; jersey?: string; teamId?: string; pos?: string }

/** Resolve a prop item's season-athlete $ref → name, jersey, team id, position. Cached for a day. */
export async function getAthleteInfo(athleteRef: string): Promise<AthleteInfo | null> {
  const url = athleteRef.replace(/^http:\/\/sports\.core\.api\.espn\.(pvt|com)/, "https://sports.core.api.espn.com").split("?")[0];
  if (!url.startsWith("https://sports.core.api.espn.com/")) return null;
  const d = await getPage(url, 86400);
  if (!d) return null;
  return {
    name: d.displayName ?? d.fullName ?? "",
    jersey: d.jersey,
    teamId: String(d.team?.$ref ?? "").match(/teams\/(\d+)/)?.[1],
    pos: d.position?.abbreviation,
  };
}
