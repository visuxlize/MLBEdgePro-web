"use client";

import { useMemo } from "react";
import { PropsExplorer } from "@/components/web-tool/props-explorer";
import { nbaToItems, nbaShortName } from "@/components/web-tool/props-adapters";
import type { NbaGame, NbaPlayerProp } from "@/lib/nba/types";

export function NbaPropsTool({ props, games, dayLabel, liveLines }: { props: NbaPlayerProp[]; games: NbaGame[]; dayLabel: string; liveLines: number }) {
  const items = useMemo(() => nbaToItems(props), [props]);
  const best = items.reduce((m, p) => Math.max(m, p.edge), 0);
  return (
    <PropsExplorer
      sport="nba" eyebrow={`NBA Props · ${dayLabel || "Next slate"}`} title="Player Props"
      subtitle={liveLines > 0 ? "Real DraftKings lines graded against tonight's matchup. Edge = our hit chance at the book's number (50% is fair)." : "DraftKings hasn't posted this slate yet — showing season-average reference lines until it does."}
      items={items} topLabel="Top edges right now"
      games={games.map((g) => ({ id: g.id, label: `${nbaShortName(g.away)} @ ${nbaShortName(g.home)}`, sub: g.timeLabel }))}
      markets={[{ key: "Points", label: "Points" }, { key: "Rebounds", label: "Rebounds" }, { key: "Assists", label: "Assists" }, { key: "3-Pointers", label: "3-Pointers" }]}
      summary={[{ label: "Props graded", value: String(items.length) }, { label: "DK lines live", value: `${liveLines}/${games.length}` }, { label: "Best edge", value: `+${best}` }]}
      footnote={`${liveLines > 0 ? "Lines: DraftKings via ESPN — they move, so confirm the number and price at your book. " : "Reference lines are season averages, not sportsbook prices. "}Projections are model estimates for entertainment only.`}
      backHref="/nba"
    />
  );
}
