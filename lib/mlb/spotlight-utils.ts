/**
 * Server-safe Spotlight utilities — no "use client", callable from server components.
 * Pure functions only; no React hooks or browser APIs.
 */
import { TEAM_COLORS, TEAM_ABBR, type Game } from "./api";

export function teamHex(teamId: number): string {
  return TEAM_COLORS[teamId] ?? "#f97316";
}

export function alpha(hex: string, aa: string): string {
  return `${hex}${aa}`;
}

export function teamCode(teamId: number, name?: string): string {
  return TEAM_ABBR[teamId] ?? name?.split(" ").pop()?.slice(0, 3).toUpperCase() ?? "MLB";
}

export function luminance(hex: string): number {
  const c = hex.replace("#", "");
  if (c.length < 6) return 0;
  const ch = (i: number) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(0) + 0.7152 * ch(2) + 0.0722 * ch(4);
}

export function contrastText(hex: string): string {
  return luminance(hex) > 0.45 ? "#0a1018" : "#ffffff";
}

export function gradeColor(grade: string): string {
  const g = grade.trim().charAt(0).toUpperCase();
  if (g === "A") return "var(--green)";
  if (g === "B") return "var(--grade-b)";
  return "var(--grade-c)";
}

export function edgeColor(score: number): string {
  if (score >= 75) return "var(--green)";
  if (score >= 60) return "var(--grade-b)";
  return "var(--grade-c)";
}

export function pctColor(pct: number): string {
  if (pct >= 80) return "var(--green)";
  if (pct >= 40) return "var(--grade-b)";
  return "var(--red)";
}

export function modelEdge(game: Game) {
  const seed = game.gamePk;
  const jitter = (seed % 23) - 11;
  let homeProb = 50 + 3 + jitter;
  homeProb = Math.max(36, Math.min(64, homeProb));
  const favHome = homeProb >= 50;
  const edge = Math.max(41, Math.min(93, Math.round(45 + Math.abs(homeProb - 50) * 1.9 + (seed % 9))));
  const grade =
    edge >= 80 ? "A+" : edge >= 72 ? "A" : edge >= 64 ? "B+" :
    edge >= 55 ? "B" : edge >= 46 ? "C+" : "C";
  const favId = favHome ? game.teams.home.team.id : game.teams.away.team.id;
  const favName = favHome ? game.teams.home.team.name : game.teams.away.team.name;
  return { edge, grade, homeProb, awayProb: 100 - homeProb, favId, favCode: teamCode(favId, favName) };
}
