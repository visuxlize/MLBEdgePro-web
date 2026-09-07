import type { SoccerMatch, SoccerMatchEdge, SoccerPlayerProp, SoccerLeagueKey } from "./types";
import { soccerLogoUrl, soccerHeadshotUrl } from "./leagues";

function seed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function poissonWinProb(homeXg: number, awayXg: number): { h: number; d: number; a: number } {
  let hWin = 0, draw = 0, aWin = 0;
  for (let hg = 0; hg <= 6; hg++) {
    for (let ag = 0; ag <= 6; ag++) {
      const p = poissonPmf(hg, homeXg) * poissonPmf(ag, awayXg);
      if (hg > ag) hWin += p;
      else if (hg === ag) draw += p;
      else aWin += p;
    }
  }
  return { h: hWin, d: draw, a: aWin };
}

function poissonPmf(k: number, lambda: number): number {
  let e = Math.exp(-lambda);
  let fact = 1;
  for (let i = 1; i <= k; i++) { fact *= i; }
  let lk = 1;
  for (let i = 0; i < k; i++) lk *= lambda;
  return (lk * e) / fact;
}

export function soccerMatchEdge(match: SoccerMatch): SoccerMatchEdge {
  const s = seed(match.id);

  const baseHome = 1.35 + ((s % 40) / 100);
  const baseAway = 1.15 + (((s >> 4) % 40) / 100);
  const homeXg = Math.round((baseHome + 0.15) * 10) / 10;
  const awayXg = Math.round(baseAway * 10) / 10;

  const probs = poissonWinProb(homeXg, awayXg);
  const total = probs.h + probs.d + probs.a;
  const homeWinProb = Math.round((probs.h / total) * 100);
  const drawProb = Math.round((probs.d / total) * 100);
  const awayWinProb = 100 - homeWinProb - drawProb;

  const homePpda = Math.round(8 + (s % 6));
  const awayPpda = Math.round(9 + ((s >> 3) % 7));
  const possession = Math.round(48 + (s % 12));

  const edge = Math.max(42, Math.min(94, Math.round(48 + Math.abs(homeWinProb - 50) * 1.5 + (s % 11))));
  const grade =
    edge >= 82 ? "A+" : edge >= 74 ? "A" : edge >= 65 ? "B+" :
    edge >= 56 ? "B" : edge >= 47 ? "C+" : "C";

  const xgDiff = homeXg - awayXg;
  let pick: string;
  let pickReason: string;
  if (xgDiff >= 0.4) {
    pick = `${match.homeTeam.shortName} ML`;
    pickReason = `Home xG advantage of +${xgDiff.toFixed(1)} · PPDA ${homePpda}`;
  } else if (xgDiff <= -0.4) {
    pick = `${match.awayTeam.shortName} ML`;
    pickReason = `Away xG advantage of +${(-xgDiff).toFixed(1)} · PPDA ${awayPpda}`;
  } else if (homeXg + awayXg >= 2.8) {
    pick = "Over 2.5 Goals";
    pickReason = `Combined xG ${(homeXg + awayXg).toFixed(1)} favors Over`;
  } else {
    pick = "Draw";
    pickReason = `Evenly matched — draw value at ${drawProb}%`;
  }

  return { homeXg, awayXg, homeWinProb, drawProb, awayWinProb, homePpda, awayPpda, possession, edge, grade, pick, pickReason };
}

export function soccerGradeColor(grade: string): string {
  return grade[0] === "A" ? "#34d399" : grade[0] === "B" ? "#fb923c" : "#a78bfa";
}

// ── Player props catalog ──────────────────────────────────────────────────────

interface PropTemplate {
  id: string;
  playerName: string;
  espnPlayerId: string;
  teamId: string;
  teamAbbr: string;
  teamHex: string;
  position: "ST" | "MF" | "DF";
  league: SoccerLeagueKey;
  matchup: string;
  props: {
    market: string;
    propType: "goals" | "shots" | "assists" | "cards";
    line: number;
    proj: number;
    side: "OVER" | "YES" | "UNDER";
    odds: string;
  }[];
}

const PROP_TEMPLATES: PropTemplate[] = [
  // EPL
  { id: "haaland", playerName: "E. Haaland",    espnPlayerId: "4155882", teamId: "382", teamAbbr: "MCI", teamHex: "#6CABDD", position: "ST", league: "epl",        matchup: "MCI vs ARS",
    props: [{ market: "Anytime Scorer", propType: "goals", line: 0.5, proj: 0.76, side: "YES",  odds: "-150" },
            { market: "Shots on Target", propType: "shots", line: 2.5, proj: 3.1,  side: "OVER", odds: "-118" }] },
  { id: "salah",   playerName: "M. Salah",       espnPlayerId: "167664",  teamId: "364", teamAbbr: "LIV", teamHex: "#C8102E", position: "MF", league: "epl",        matchup: "LIV vs CHE",
    props: [{ market: "Anytime Scorer", propType: "goals", line: 0.5, proj: 0.55, side: "YES",  odds: "-120" },
            { market: "Key Passes",      propType: "assists", line: 1.5, proj: 2.2, side: "OVER", odds: "-108" }] },
  { id: "saka",    playerName: "B. Saka",         espnPlayerId: "4318076", teamId: "359", teamAbbr: "ARS", teamHex: "#EF0107", position: "MF", league: "epl",        matchup: "MCI vs ARS",
    props: [{ market: "Shots on Target", propType: "shots",  line: 1.5, proj: 2.0, side: "OVER", odds: "-115" },
            { market: "Assists",         propType: "assists", line: 0.5, proj: 0.48, side: "UNDER", odds: "-108" }] },
  { id: "palmer",  playerName: "C. Palmer",       espnPlayerId: "4778011", teamId: "363", teamAbbr: "CHE", teamHex: "#034694", position: "MF", league: "epl",        matchup: "LIV vs CHE",
    props: [{ market: "Anytime Scorer", propType: "goals",  line: 0.5, proj: 0.62, side: "YES",  odds: "-130" },
            { market: "Cards",           propType: "cards",  line: 0.5, proj: 0.22, side: "UNDER", odds: "-105" }] },
  // La Liga
  { id: "mbappe",  playerName: "K. Mbappé",       espnPlayerId: "4006310", teamId: "86",  teamAbbr: "RMA", teamHex: "#FEBE10", position: "ST", league: "laliga",     matchup: "RMA vs BAR",
    props: [{ market: "Anytime Scorer", propType: "goals",  line: 0.5, proj: 0.82, side: "YES",  odds: "-160" },
            { market: "Shots on Target", propType: "shots", line: 2.5, proj: 3.4,  side: "OVER", odds: "-125" }] },
  { id: "vini",    playerName: "Vinicius Jr.",     espnPlayerId: "4321877", teamId: "86",  teamAbbr: "RMA", teamHex: "#FEBE10", position: "MF", league: "laliga",     matchup: "RMA vs BAR",
    props: [{ market: "Key Passes",     propType: "assists", line: 1.5, proj: 2.1, side: "OVER", odds: "-112" },
            { market: "Cards",          propType: "cards",   line: 0.5, proj: 0.35, side: "UNDER", odds: "+102" }] },
  { id: "lewand",  playerName: "R. Lewandowski",  espnPlayerId: "1995913", teamId: "83",  teamAbbr: "BAR", teamHex: "#A50044", position: "ST", league: "laliga",     matchup: "RMA vs BAR",
    props: [{ market: "Anytime Scorer", propType: "goals",  line: 0.5, proj: 0.68, side: "YES",  odds: "-140" },
            { market: "Shots on Target", propType: "shots", line: 1.5, proj: 2.3,  side: "OVER", odds: "-118" }] },
  // Serie A
  { id: "lautaro", playerName: "L. Martínez",     espnPlayerId: "4154558", teamId: "110", teamAbbr: "INT", teamHex: "#0068A8", position: "ST", league: "seriea",     matchup: "INT vs JUV",
    props: [{ market: "Anytime Scorer", propType: "goals",  line: 0.5, proj: 0.71, side: "YES",  odds: "-145" },
            { market: "Shots on Target", propType: "shots", line: 2.5, proj: 2.8,  side: "OVER", odds: "-110" }] },
  { id: "leao",    playerName: "R. Leão",          espnPlayerId: "4273667", teamId: "103", teamAbbr: "MIL", teamHex: "#FB090B", position: "MF", league: "seriea",     matchup: "MIL vs ROM",
    props: [{ market: "Anytime Scorer", propType: "goals",  line: 0.5, proj: 0.52, side: "YES",  odds: "-112" },
            { market: "Key Passes",     propType: "assists", line: 1.5, proj: 1.9,  side: "OVER", odds: "-105" }] },
  // Bundesliga
  { id: "kane",    playerName: "H. Kane",          espnPlayerId: "156623",  teamId: "132", teamAbbr: "FCB", teamHex: "#DC052D", position: "ST", league: "bundesliga", matchup: "FCB vs BVB",
    props: [{ market: "Anytime Scorer", propType: "goals",  line: 0.5, proj: 0.74, side: "YES",  odds: "-148" },
            { market: "Shots on Target", propType: "shots", line: 2.5, proj: 3.2,  side: "OVER", odds: "-120" }] },
  { id: "guirassy", playerName: "S. Guirassy",     espnPlayerId: "4273669", teamId: "124", teamAbbr: "BVB", teamHex: "#FDE100", position: "ST", league: "bundesliga", matchup: "FCB vs BVB",
    props: [{ market: "Anytime Scorer", propType: "goals",  line: 0.5, proj: 0.58, side: "YES",  odds: "-118" },
            { market: "Cards",          propType: "cards",  line: 0.5, proj: 0.28, side: "UNDER", odds: "-102" }] },
  // Ligue 1
  { id: "barcola", playerName: "B. Barcola",       espnPlayerId: "5091374", teamId: "160", teamAbbr: "PSG", teamHex: "#004170", position: "MF", league: "ligue1",     matchup: "PSG vs OLY",
    props: [{ market: "Anytime Scorer", propType: "goals",  line: 0.5, proj: 0.64, side: "YES",  odds: "-132" },
            { market: "Key Passes",     propType: "assists", line: 1.5, proj: 2.0,  side: "OVER", odds: "-110" }] },
  // MLS
  { id: "messi",   playerName: "L. Messi",         espnPlayerId: "45843",   teamId: "4156", teamAbbr: "MIA", teamHex: "#F7B5CD", position: "MF", league: "mls",        matchup: "MIA vs ATL",
    props: [{ market: "Key Passes",     propType: "assists", line: 1.5, proj: 2.4,  side: "OVER", odds: "-128" },
            { market: "Anytime Scorer", propType: "goals",  line: 0.5, proj: 0.59, side: "YES",  odds: "-120" }] },
];

export function getSoccerPlayerProps(league?: SoccerLeagueKey): SoccerPlayerProp[] {
  const templates = league
    ? PROP_TEMPLATES.filter((t) => t.league === league)
    : PROP_TEMPLATES;

  const props: SoccerPlayerProp[] = [];
  let idCounter = 0;

  for (const t of templates) {
    for (const p of t.props) {
      const s = seed(t.id + p.market);
      const jitter = (s % 7) - 3;
      const prob = Math.max(30, Math.min(88, Math.round(60 + (p.proj - p.line) * 18 + jitter)));
      const edge = Math.max(42, Math.min(93, Math.round(50 + Math.abs(p.proj - p.line) * 20 + (s % 9))));
      const grade =
        edge >= 80 ? "A+" : edge >= 72 ? "A" : edge >= 63 ? "B+" :
        edge >= 54 ? "B" : edge >= 46 ? "C+" : "C";

      props.push({
        id: `${t.id}-${idCounter++}`,
        playerName: t.playerName,
        espnPlayerId: t.espnPlayerId,
        teamId: t.teamId,
        teamAbbr: t.teamAbbr,
        teamHex: t.teamHex,
        teamLogo: soccerLogoUrl(t.teamId),
        position: t.position,
        league: t.league,
        matchup: t.matchup,
        market: p.market,
        propType: p.propType,
        line: p.line,
        modelProj: p.proj,
        probability: prob,
        side: p.side,
        odds: p.odds,
        grade,
        edge,
      });
    }
  }

  return props.sort((a, b) => b.edge - a.edge);
}
