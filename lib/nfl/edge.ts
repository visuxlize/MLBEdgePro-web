/**
 * Deterministic placeholder edge/grade/win-prob estimator — the NFL equivalent of
 * modelEdge() in lib/mlb/spotlight-utils.ts. Stands in until a real model is wired up;
 * every game gets a stable score derived from its ESPN event id so cards never look empty.
 */
function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function nflModelEdge(eventId: string) {
  const seed = seedFromId(eventId);
  const jitter = (seed % 23) - 11;
  let homeProb = 50 + 3 + jitter;
  homeProb = Math.max(36, Math.min(64, homeProb));
  const edge = Math.max(41, Math.min(93, Math.round(45 + Math.abs(homeProb - 50) * 1.9 + (seed % 9))));
  const grade =
    edge >= 80 ? "A+" : edge >= 72 ? "A" : edge >= 64 ? "B+" :
    edge >= 55 ? "B" : edge >= 46 ? "C+" : "C";
  return { edge, grade, homeWinProb: homeProb };
}

export function nflGradeColor(grade: string): string {
  return grade[0] === "A" ? "#34d399" : grade[0] === "B" ? "#fb923c" : "#a78bfa";
}
