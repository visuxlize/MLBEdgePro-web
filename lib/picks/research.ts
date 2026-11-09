import type { PropItem } from "./types";
import { suspectLine } from "./engine";

export interface Research { case: string[]; risks: string[] }

const fix = (n: number) => (Math.abs(n) >= 10 ? n.toFixed(1) : n.toFixed(2)).replace(/\.?0+$/, "");

/** Plain-English reasons to like a leg — and what could make it miss. Built only from the numbers we have. */
export function researchFor(p: PropItem): Research {
  const why: string[] = [];
  const risks: string[] = [];

  if (p.scope === "game") {
    why.push(...p.notes);
    if (p.edge < 3) risks.push("The edge on whole-game bets is small — treat it as a lean, not a lock.");
    risks.push("Spread and total prices are assumed at about −110; check the number and price at your book.");
    if (p.marketKey === "Total" || p.marketKey === "Total Goals") risks.push("Totals swing on pace, garbage time and one hot shooter — variance is high.");
    return { case: why, risks };
  }

  if (p.kind === "market") {
    why.push(`DraftKings prices this at ${p.price != null ? (p.price > 0 ? `+${p.price}` : p.price) : "—"}, an implied ${p.prob}% chance.`);
    if (p.openPrice != null && p.price != null && p.openPrice !== p.price) why.push(`Price moved from ${p.openPrice > 0 ? "+" : ""}${p.openPrice} to ${p.price > 0 ? "+" : ""}${p.price}${p.movement === "shorter" ? " — money is backing it." : p.movement === "longer" ? " — the market is drifting away." : "."}`);
    risks.push("We don't model soccer player markets yet — the percentage is the book's own, margin included.");
    return { case: why, risks };
  }

  const over = p.side !== "under";
  if (p.line != null && p.proj != null) {
    const diff = p.proj - p.line;
    why.push(`Model projects ${fix(p.proj)} against a ${fix(p.line)} line — ${fix(Math.abs(diff))} ${diff >= 0 ? "above" : "below"} it, which favors the ${over ? "over" : "under"}.`);
    if ((over && diff < 0) || (!over && diff > 0)) risks.push("The raw projection sits on the other side of the line — this lean comes from the spread of outcomes, not the average.");
    if (Math.abs(diff) / Math.max(1, p.line) < 0.06) risks.push("The projection is within ~6% of the line — a thin margin for error.");
  }
  if (p.seasonAvg != null) why.push(`Season average ${fix(p.seasonAvg)}${p.line != null ? ` (${p.seasonAvg >= p.line ? "above" : "below"} the line)` : ""}${p.stats.find((s) => s.label === "Games") ? ` across ${p.stats.find((s) => s.label === "Games")!.value} games` : ""}.`);
  const matchup = p.stats.find((s) => s.label === "Matchup");
  if (matchup) {
    const m = parseFloat(matchup.value.replace("×", ""));
    why.push(`Opponent adjustment ${matchup.value} — ${m >= 1.03 ? "a soft spot for this stat" : m <= 0.97 ? "a tough defensive matchup" : "about a neutral matchup"}.`);
    if (m <= 0.97 && over) risks.push("Tough matchup for an over.");
    if (m >= 1.03 && !over) risks.push("Soft matchup works against an under.");
  }
  const mins = p.stats.find((s) => s.label === "Minutes");
  if (mins) { why.push(`Plays about ${mins.value} minutes a night.`); if (parseFloat(mins.value) < 24) risks.push("Modest minutes — a blowout or foul trouble cuts the ceiling fast."); }
  why.push(...p.notes.slice(0, 3));

  if (p.openLine != null && p.line != null && p.openLine !== p.line) {
    const up = p.line > p.openLine;
    const agrees = over ? up : !up;
    why.push(`Line moved ${fix(p.openLine)} → ${fix(p.line)}${agrees ? " — the market is moving the same direction as this pick." : "."}`);
    if (!agrees) risks.push("The line has moved against this side since it opened.");
  }
  const gp = Number(p.stats.find((s) => s.label === "Games")?.value ?? NaN);
  if (Number.isFinite(gp) && gp < 8) risks.push(`Only ${gp} games of data — the season average is still noisy.`);
  if (p.lineSource === "model") risks.push("This is a reference line (the season average), not a posted DraftKings number — confirm the real line first.");
  if (suspectLine(p)) risks.unshift("The posted line is far from the season average — usually an injury, role change or a different market. We don't recommend it until you confirm why.");
  if (!over) risks.push("Unders die to overtime, garbage-time minutes and one hot stretch.");
  risks.push(`Model hit chance is ${p.prob}%. Books are sharp — a ${p.prob >= 70 ? "high" : "moderate"} number can still lose any single night.`);
  return { case: why.slice(0, 6), risks: risks.slice(0, 4) };
}
