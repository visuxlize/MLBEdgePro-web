/**
 * World Cup 2026 odds via The Odds API (same key as MLB section)
 *
 * Sport key: "soccer_fifa_world_cup"
 * Markets: h2h (1X2), spreads (Asian handicap), totals (goals O/U), player props
 *
 * Reuses ODDS_API_KEY from the existing MLB integration.
 */

import type { WCOddsMarket, PlayerProp } from "./types";

const BASE_URL = "https://api.the-odds-api.com/v4";
const WC_SPORT  = "soccer_fifa_world_cup";
const BOOKMAKER = "fanduel";

function oddsKey(): string {
  const k = process.env.ODDS_API_KEY;
  if (!k) throw new Error("ODDS_API_KEY not set");
  return k;
}

// ── Moneyline / 1X2 markets ───────────────────────────────────────────────────

interface OddsApiEvent {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    last_update: string;
    markets: Array<{
      key: string;
      outcomes: Array<{ name: string; price: number; point?: number }>;
    }>;
  }>;
}

function fmtAmericanOdds(decimal: number): string {
  if (decimal >= 2) return `+${Math.round((decimal - 1) * 100)}`;
  return `${Math.round(-100 / (decimal - 1))}`;
}

function impliedProb(decimal: number): number {
  return 1 / decimal;
}

export async function fetchWCOddsMarkets(): Promise<WCOddsMarket[]> {
  const url = new URL(`${BASE_URL}/sports/${WC_SPORT}/odds`);
  url.searchParams.set("apiKey", oddsKey());
  url.searchParams.set("regions", "us");
  url.searchParams.set("markets", "h2h,totals,spreads");
  url.searchParams.set("bookmakers", BOOKMAKER);
  url.searchParams.set("oddsFormat", "decimal");

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) {
    if (res.status === 404) return []; // tournament not available yet
    throw new Error(`WC Odds API: ${res.status}`);
  }

  const events: OddsApiEvent[] = await res.json();

  return events.map((event) => {
    const bookmaker = event.bookmakers.find((b) => b.key === BOOKMAKER)
      ?? event.bookmakers[0];
    if (!bookmaker) {
      return {
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        matchDate: new Date(event.commence_time).toLocaleDateString(),
        moneyline: { home: "N/A", draw: "N/A", away: "N/A" },
        bookmaker: "N/A",
        lastUpdate: "",
      };
    }

    const h2h = bookmaker.markets.find((m) => m.key === "h2h");
    const totals = bookmaker.markets.find((m) => m.key === "totals");
    const spreads = bookmaker.markets.find((m) => m.key === "spreads");

    const homeOdds = h2h?.outcomes.find((o) => o.name === event.home_team)?.price ?? 0;
    const awayOdds = h2h?.outcomes.find((o) => o.name === event.away_team)?.price ?? 0;
    const drawOdds = h2h?.outcomes.find((o) => o.name === "Draw")?.price ?? 0;

    const overTotals = totals?.outcomes.find((o) => o.name === "Over");
    const underTotals = totals?.outcomes.find((o) => o.name === "Under");
    const homeSpread = spreads?.outcomes.find((o) => o.name === event.home_team);
    const awaySpread = spreads?.outcomes.find((o) => o.name === event.away_team);

    return {
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      matchDate: new Date(event.commence_time).toLocaleDateString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      }),
      moneyline: {
        home: homeOdds ? fmtAmericanOdds(homeOdds) : "N/A",
        draw: drawOdds ? fmtAmericanOdds(drawOdds) : "N/A",
        away: awayOdds ? fmtAmericanOdds(awayOdds) : "N/A",
      },
      totals: overTotals && underTotals ? {
        over:  { line: overTotals.point  ?? 2.5, odds: fmtAmericanOdds(overTotals.price) },
        under: { line: underTotals.point ?? 2.5, odds: fmtAmericanOdds(underTotals.price) },
      } : undefined,
      spread: homeSpread && awaySpread ? {
        home: { line: homeSpread.point ?? 0, odds: fmtAmericanOdds(homeSpread.price) },
        away: { line: awaySpread.point ?? 0, odds: fmtAmericanOdds(awaySpread.price) },
      } : undefined,
      bookmaker: bookmaker.title,
      lastUpdate: bookmaker.last_update,
    };
  });
}

// ── Player Props ───────────────────────────────────────────────────────────────

export async function fetchWCPlayerProps(eventId?: string): Promise<PlayerProp[]> {
  const url = new URL(
    eventId
      ? `${BASE_URL}/sports/${WC_SPORT}/events/${eventId}/odds`
      : `${BASE_URL}/sports/${WC_SPORT}/odds`
  );
  url.searchParams.set("apiKey", oddsKey());
  url.searchParams.set("regions", "us");
  url.searchParams.set("markets", "player_anytime_goalscorer,player_shots_on_target_over_under");
  url.searchParams.set("bookmakers", BOOKMAKER);
  url.searchParams.set("oddsFormat", "decimal");

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) return [];

  const events: OddsApiEvent[] = eventId ? [await res.json()] : await res.json();
  const props: PlayerProp[] = [];

  events.forEach((event) => {
    const bm = event.bookmakers.find((b) => b.key === BOOKMAKER) ?? event.bookmakers[0];
    if (!bm) return;

    bm.markets.forEach((market) => {
      market.outcomes.forEach((outcome, i) => {
        const bookProb = impliedProb(outcome.price);
        // Mock model probability — in production wire to your own model
        const modelProb = Math.min(0.95, bookProb * (0.9 + Math.random() * 0.3));
        const edge = modelProb - bookProb;

        props.push({
          playerId: i + 1,
          playerName: outcome.name,
          teamName: "",
          propType: market.key === "player_anytime_goalscorer"
            ? "Anytime Goalscorer"
            : "Shots on Target O/U",
          line: outcome.point,
          yesOdds:  fmtAmericanOdds(outcome.price),
          modelProb,
          impliedProb: bookProb,
          hasEdge: edge > 0.04, // 4 percentage point minimum edge
          edgePct: Math.round(edge * 100),
        });
      });
    });
  });

  return props.sort((a, b) => b.edgePct - a.edgePct);
}

// ── Value Bet Finder ──────────────────────────────────────────────────────────

/**
 * Given an implied probability and your model's probability,
 * compute the Kelly fraction for bankroll management.
 */
export function kellyFraction(modelProb: number, decimalOdds: number): number {
  const b = decimalOdds - 1;
  const q = 1 - modelProb;
  return Math.max(0, (b * modelProb - q) / b);
}
