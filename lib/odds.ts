/**
 * The Odds API v4 → FanDuel MLB player props
 * Docs: https://the-odds-api.com/liveapi/guides/v4/#get-event-odds
 *
 * Set ODDS_API_KEY in your environment to enable real odds.
 * Requests are cached 5 minutes server-side to preserve quota.
 * Free tier: 500 requests/month.  Premium tiers available at the-odds-api.com
 */

const BASE = "https://api.the-odds-api.com/v4";

// ── Internal types ────────────────────────────────────────────────────────────

interface OddsApiEvent {
  id: string;
  sport_key: string;
  commence_time: string;
  away_team: string;
  home_team: string;
}

interface OddsApiOutcome {
  name: string;
  description?: string;
  price: number;
  point?: number;
}

interface OddsApiMarket {
  key: string;
  outcomes: OddsApiOutcome[];
}

interface OddsApiBookmaker {
  key: string;
  markets: OddsApiMarket[];
}

interface OddsApiEventOdds {
  id: string;
  away_team: string;
  home_team: string;
  bookmakers: OddsApiBookmaker[];
}

// ── Public types ──────────────────────────────────────────────────────────────

/**
 * Flat odds map used throughout the app.
 * Key format: "<normalised-player-name>:<prop-type>"
 *   e.g. "aaron judge:HR"  →  "+450"
 *        "blake snell:Pitcher K's"  →  "-115"
 *        "new york yankees:Moneyline"  →  "-150"
 */
export type FanDuelOddsMap = Record<string, string>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function normName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[.']/g, "")
    .trim();
}

function fmtAmerican(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

function oddsKey(name: string, propType: string): string {
  return `${normName(name)}:${propType}`;
}

// ── Fetch + build map ─────────────────────────────────────────────────────────

async function fetchEvents(): Promise<OddsApiEvent[]> {
  const key = process.env.ODDS_API_KEY;
  if (!key) return [];

  const res = await fetch(
    `${BASE}/sports/baseball_mlb/events?apiKey=${key}&dateFormat=iso`,
    { next: { revalidate: 300 } },
  );
  if (!res.ok) return [];
  return res.json();
}

async function fetchEventOdds(eventId: string): Promise<OddsApiEventOdds | null> {
  const key = process.env.ODDS_API_KEY;
  if (!key) return null;

  const markets = [
    "batter_home_runs",
    "batter_hits",
    "pitcher_strikeouts",
    "h2h",
    "totals",
  ].join(",");

  const res = await fetch(
    `${BASE}/sports/baseball_mlb/events/${eventId}/odds` +
    `?apiKey=${key}&regions=us&markets=${markets}&bookmakers=fanduel&oddsFormat=american`,
    { next: { revalidate: 300 } },
  );
  if (!res.ok) return null;
  return res.json();
}

/**
 * Fetches today's FanDuel MLB prop odds and returns a flat key→odds map.
 * Gracefully returns an empty map if the API key is missing or any call fails.
 */
export async function fetchFanDuelOddsMap(): Promise<FanDuelOddsMap> {
  if (!process.env.ODDS_API_KEY) return {};

  try {
    const events = await fetchEvents();
    const today  = new Date().toDateString();
    const todayEvents = events.filter(
      (e) => new Date(e.commence_time).toDateString() === today,
    );

    const map: FanDuelOddsMap = {};

    // Fetch all events in parallel (cap at 12 to save quota)
    const results = await Promise.allSettled(
      todayEvents.slice(0, 12).map((e) => fetchEventOdds(e.id)),
    );

    for (const result of results) {
      if (result.status !== "fulfilled" || !result.value) continue;
      const data = result.value;
      const fanduel = data.bookmakers?.find((b) => b.key === "fanduel");
      if (!fanduel) continue;

      for (const market of fanduel.markets ?? []) {
        for (const outcome of market.outcomes ?? []) {

          // Player name is in `description` for player props; `name` for h2h
          const entityName = outcome.description ?? outcome.name;

          switch (market.key) {
            case "batter_home_runs":
              if (outcome.name === "Over") {
                map[oddsKey(entityName, "HR")] = fmtAmerican(outcome.price);
              }
              break;

            case "batter_hits":
              if (outcome.name === "Over") {
                if (!outcome.point || outcome.point <= 0.5) {
                  map[oddsKey(entityName, "Hit")] = fmtAmerican(outcome.price);
                }
                if (outcome.point && outcome.point >= 1.5) {
                  map[oddsKey(entityName, "2+ Hits")] = fmtAmerican(outcome.price);
                }
              }
              break;

            case "pitcher_strikeouts":
              // Use whichever Over line appears first (closest to projected)
              if (outcome.name === "Over") {
                const existing = map[oddsKey(entityName, "Pitcher K's")];
                if (!existing) {
                  map[oddsKey(entityName, "Pitcher K's")] = fmtAmerican(outcome.price);
                  // Also store the actual K line (e.g. 6.5) separately
                  if (outcome.point !== undefined) {
                    map[`${oddsKey(entityName, "Pitcher K's")}:line`] = String(outcome.point);
                  }
                }
              }
              break;

            case "h2h":
              // Team moneyline — `name` is the team name
              map[oddsKey(outcome.name, "Moneyline")] = fmtAmerican(outcome.price);
              break;

            case "totals":
              // Game total — store the Over line once per game
              if (outcome.name === "Over" && outcome.point !== undefined) {
                const totalKey = `${normName(data.away_team)}-${normName(data.home_team)}:Total Runs:line`;
                if (!map[totalKey]) {
                  map[totalKey] = String(outcome.point);
                }
              }
              break;
          }
        }
      }
    }

    return map;
  } catch {
    return {};
  }
}

/**
 * Look up real FanDuel odds for a given player name and prop type.
 * Returns empty string if not found (caller keeps previous value).
 */
export function lookupOdds(
  map: FanDuelOddsMap,
  playerOrTeamName: string,
  propType: string,
): string {
  return map[oddsKey(playerOrTeamName, propType)] ?? "";
}

/**
 * Look up the actual sportsbook line (e.g. 6.5 Ks) for a player prop.
 * Returns null if FanDuel didn't have this market.
 */
export function lookupLine(
  map: FanDuelOddsMap,
  playerName: string,
  propType: string,
): number | null {
  const v = map[`${oddsKey(playerName, propType)}:line`];
  return v !== undefined ? parseFloat(v) : null;
}

/**
 * Look up the FanDuel game total O/U line (e.g. 8.5 runs).
 * awayTeam and homeTeam should be full team names from the MLB API.
 * Returns null if not found.
 */
export function lookupGameTotal(
  map: FanDuelOddsMap,
  awayTeam: string,
  homeTeam: string,
): number | null {
  const v = map[`${normName(awayTeam)}-${normName(homeTeam)}:Total Runs:line`];
  return v !== undefined ? parseFloat(v) : null;
}
