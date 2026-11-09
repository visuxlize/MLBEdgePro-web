"use client";

import { useMemo } from "react";
import { PropsExplorer } from "@/components/web-tool/props-explorer";
import { nflToItems } from "@/components/web-tool/props-adapters";
import type { NflPropPlay, NflSeasonGame } from "@/lib/nfl/types";

export function NflPropsBoard({ props, games, weekLabel, liveLines }: { props: NflPropPlay[]; games: NflSeasonGame[]; weekLabel: string; liveLines: number }) {
  const items = useMemo(() => nflToItems(props), [props]);
  const best = items.reduce((m, p) => Math.max(m, p.edge), 0);
  return (
    <PropsExplorer
      sport="nfl" eyebrow={`NFL Props · ${weekLabel}`} title="Player Props"
      subtitle={liveLines > 0 ? "Real DraftKings lines graded against the opposing defense, the game total and game script. Edge = our hit chance at the book's number (50% is fair)." : "DraftKings hasn't posted props for this slate yet — showing season-average reference lines until it does."}
      items={items} topLabel="Top edges this week"
      games={games.map((g) => ({ id: g.id, label: `${g.away} @ ${g.home}`, sub: `${g.dateLabel} · ${g.timeLabel}` }))}
      markets={[{ key: "Pass Yds", label: "Pass Yds" }, { key: "Pass TDs", label: "Pass TDs" }, { key: "Rush Yds", label: "Rush Yds" }, { key: "Rec Yds", label: "Rec Yds" }, { key: "Receptions", label: "Receptions" }]}
      summary={[{ label: "Props graded", value: String(items.length) }, { label: "DK lines live", value: `${liveLines}/${games.length}` }, { label: "Best edge", value: `+${best}` }]}
      footnote={`${liveLines > 0 ? `Lines: DraftKings via ESPN (${liveLines} of ${games.length} games posted) — they move, so confirm the number and price at your book. ` : "Reference lines are season averages, not sportsbook prices. "}Projections are model estimates for entertainment only.`}
      backHref="/nfl"
    />
  );
}
