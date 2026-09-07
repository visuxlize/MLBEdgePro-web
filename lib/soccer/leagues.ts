import type { SoccerLeagueDef, SoccerLeagueKey } from "./types";

export const SOCCER_LEAGUES: SoccerLeagueDef[] = [
  { key: "epl",         slug: "eng.1",           label: "Premier League",      shortLabel: "EPL",     region: "europe",      color: "#38003c", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { key: "laliga",      slug: "esp.1",            label: "La Liga",             shortLabel: "La Liga", region: "europe",      color: "#ff4b44", flag: "🇪🇸" },
  { key: "seriea",      slug: "ita.1",            label: "Serie A",             shortLabel: "Serie A", region: "europe",      color: "#024494", flag: "🇮🇹" },
  { key: "bundesliga",  slug: "ger.1",            label: "Bundesliga",          shortLabel: "Bundes.", region: "europe",      color: "#d20515", flag: "🇩🇪" },
  { key: "ligue1",      slug: "fra.1",            label: "Ligue 1",             shortLabel: "Ligue 1", region: "europe",      color: "#091c3e", flag: "🇫🇷" },
  { key: "ucl",         slug: "UEFA.CHAMPIONS",   label: "Champions League",    shortLabel: "UCL",     region: "continental", color: "#001d5b", flag: "🌍" },
  { key: "europa",      slug: "UEFA.EUROPA",      label: "Europa League",       shortLabel: "UEL",     region: "continental", color: "#f26522", flag: "🌍" },
  { key: "mls",         slug: "usa.1",            label: "MLS",                 shortLabel: "MLS",     region: "americas",    color: "#1a3e72", flag: "🇺🇸" },
  { key: "ligamx",      slug: "mex.1",            label: "Liga MX",             shortLabel: "Liga MX", region: "americas",    color: "#006847", flag: "🇲🇽" },
  { key: "brasileirao", slug: "bra.1",            label: "Brasileirão",         shortLabel: "Bras.",   region: "americas",    color: "#009c3b", flag: "🇧🇷" },
];

export const LEAGUE_MAP = Object.fromEntries(
  SOCCER_LEAGUES.map((l) => [l.key, l])
) as Record<SoccerLeagueKey, SoccerLeagueDef>;

export function leagueDef(key: SoccerLeagueKey): SoccerLeagueDef {
  return LEAGUE_MAP[key] ?? SOCCER_LEAGUES[0];
}

export function soccerLogoUrl(espnTeamId: string): string {
  return `https://a.espncdn.com/i/teamlogos/soccer/500/${espnTeamId}.png`;
}

export function soccerHeadshotUrl(espnPlayerId: string): string {
  return `https://a.espncdn.com/i/headshots/soccer/players/full/${espnPlayerId}.png`;
}
