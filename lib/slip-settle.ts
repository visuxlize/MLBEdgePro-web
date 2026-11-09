"use client";

import { applyResults, loadSavedSlips, type LegResult } from "@/lib/saved-slips";

let running: Promise<number> | null = null;
let lastRun = 0;

/** Ask the server which saved legs have final box scores and record the outcomes. Returns legs settled. */
export function settlePendingSlips(force = false): Promise<number> {
  if (running) return running;
  if (!force && Date.now() - lastRun < 90_000) return Promise.resolve(0);
  running = (async () => {
    lastRun = Date.now();
    try {
      const todo = loadSavedSlips()
        .filter((s) => !s.manual && s.status !== "lost")
        .flatMap((s) => s.legs.filter((l) => !l.result && l.sport && l.gameId && (l.athleteId || l.scope === "game") && l.marketKey).map((l) => ({ s, l })))
        .slice(0, 40);
      if (!todo.length) return 0;
      const res = await fetch("/api/slips/settle", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          legs: todo.map(({ s, l }) => ({
            key: `${s.id}:${l.id}`, sport: l.sport, gameId: l.gameId, athleteId: l.athleteId || undefined, scope: l.scope, marketKey: l.marketKey,
            line: Number(l.line), side: String(l.side).toLowerCase(), target: l.target, league: l.league,
          })),
        }),
      });
      if (!res.ok) return 0;
      const { results } = (await res.json()) as { results: { key: string; status: string; result?: LegResult; actual?: number }[] };
      const done = results.filter((r) => r.status === "final" && r.result).map((r) => {
        const [slipId, ...rest] = r.key.split(":");
        return { slipId, legId: rest.join(":"), result: r.result!, actual: r.actual };
      });
      applyResults(done);
      return done.length;
    } catch { return 0; } finally { running = null; }
  })();
  return running;
}
