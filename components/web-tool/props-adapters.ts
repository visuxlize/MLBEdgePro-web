import { nbaHeadshotUrl, nbaLogoUrl, nbaShortName, nbaTeamHex } from "@/lib/nba/teams";
import type { NbaPlayerProp } from "@/lib/nba/types";
import { nflHeadshotUrl, nflLogoUrl, nflTeamHex } from "@/lib/nfl/teams";
import type { NflPropPlay } from "@/lib/nfl/types";
import { LEAGUE_MAP, soccerHeadshotUrl } from "@/lib/soccer/leagues";
import type { SoccerRealProp } from "@/lib/soccer/props";
import type { PropItem } from "@/lib/picks/types";

const NBA_SHORT: Record<string, string> = { Points: "PTS", Rebounds: "REB", Assists: "AST", "3-Pointers": "3PM" };
const NFL_SHORT: Record<string, string> = { "Pass Yds": "Pass Yds", "Pass TDs": "Pass TD", "Rush Yds": "Rush Yds", "Rec Yds": "Rec Yds", Receptions: "Rec" };
const SOC_SHORT: Record<string, string> = { "Anytime Goalscorer": "Goalscorer", "Shots on Target": "SOT", Shots: "Shots", "To be Carded": "Card", Assist: "Assist" };

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export function nbaToItems(props: NbaPlayerProp[]): PropItem[] {
  return props.map((p) => ({
    id: p.id, sport: "nba", athleteId: p.espnId, kind: "model", player: p.player, headshot: nbaHeadshotUrl(p.espnId), hex: nbaTeamHex(p.team), logo: nbaLogoUrl(p.team),
    team: p.team, opp: p.opp, home: p.home, gameId: p.gameId, gameLabel: `${p.home ? p.opp : p.team} @ ${p.home ? p.team : p.opp}`, when: p.tipLabel,
    marketKey: p.market, marketShort: NBA_SHORT[p.market] ?? p.market, pick: `${cap(p.over ? "over" : "under")} ${p.line}`, side: p.over ? "over" : "under", line: p.line,
    lineSource: p.source, openLine: p.openLine, prob: p.prob, baseProb: p.baseProb, edge: p.prob - p.baseProb, grade: p.grade, proj: p.proj, seasonAvg: p.seasonAvg, price: p.price,
    stats: [{ label: "Season avg", value: String(p.seasonAvg) }, { label: "Minutes", value: String(p.minutes) }, { label: "Games", value: String(p.gp) }, { label: "Matchup", value: `×${p.oppFactor.toFixed(2)}` }],
    notes: [],
    tag: { label: p.oppFactor >= 1.02 ? "Boosted spot" : p.oppFactor <= 0.98 ? "Tough spot" : "Neutral spot", tone: p.oppFactor >= 1.02 ? "good" : p.oppFactor <= 0.98 ? "bad" : "neutral" },
  }));
}

export function nflToItems(props: NflPropPlay[]): PropItem[] {
  return props.map((p) => ({
    id: p.id, sport: "nfl", athleteId: p.espnId, kind: "model", player: p.player, headshot: nflHeadshotUrl(p.espnId), hex: nflTeamHex(p.team), logo: nflLogoUrl(p.team),
    team: p.team, pos: p.pos, opp: p.opp, home: p.home, gameId: p.gameId, gameLabel: `${p.home ? p.opp : p.team} @ ${p.home ? p.team : p.opp}`, when: p.kickoff,
    marketKey: p.market, marketShort: NFL_SHORT[p.market] ?? p.market, pick: `${cap(p.over ? "over" : "under")} ${p.line}`, side: p.over ? "over" : "under", line: p.line,
    lineSource: p.source, openLine: p.openLine, prob: p.prob, baseProb: p.baseProb, edge: p.prob - p.baseProb, grade: p.grade, proj: p.proj, seasonAvg: p.seasonAvg,
    stats: [{ label: "Season avg", value: String(p.seasonAvg) }, { label: "Games", value: String(p.gp) }, { label: "Matchup", value: `×${p.factor.toFixed(2)}` }],
    notes: p.notes,
    tag: { label: p.factor >= 1.03 ? "Soft spot" : p.factor <= 0.97 ? "Tough spot" : "Neutral spot", tone: p.factor >= 1.03 ? "good" : p.factor <= 0.97 ? "bad" : "neutral" },
  }));
}

export function soccerToItems(props: SoccerRealProp[]): PropItem[] {
  return props.map((p) => ({
    id: p.id, sport: "soccer", athleteId: p.athleteId, league: LEAGUE_MAP[p.league]?.slug, target: p.target, kind: "market", player: p.player, headshot: soccerHeadshotUrl(p.athleteId), hex: p.teamHex.length >= 7 ? p.teamHex : "#12a150", logo: p.teamLogo,
    team: p.teamAbbr, pos: p.pos, opp: p.opp, gameId: p.matchId, gameLabel: p.matchup, when: new Date(p.kickoff).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) + (p.status === "live" ? " · LIVE" : ""),
    marketKey: p.market, marketShort: SOC_SHORT[p.market] ?? p.market, pick: p.target === "Yes" ? "Yes" : `${p.target}`, lineSource: "draftkings",
    prob: p.implied, edge: 0, price: p.price, openPrice: p.openPrice, movement: p.movement,
    stats: [{ label: "League", value: p.leagueLabel }, ...(p.jersey ? [{ label: "Number", value: `#${p.jersey}` }] : [])],
    notes: [],
    tag: p.movement ? { label: p.movement === "shorter" ? "Backed" : "Drifting", tone: p.movement === "shorter" ? "good" : "neutral" } : undefined,
  }));
}

export { nbaShortName };
