"use client";

import { useMemo } from "react";
import { PropsExplorer } from "@/components/web-tool/props-explorer";
import { soccerToItems } from "@/components/web-tool/props-adapters";
import { EmptyState, SportHeader } from "@/components/web-tool/sport-ui";
import type { SoccerPropsPayload } from "@/lib/soccer/props";

export function SoccerPropsBoard({ data }: { data: SoccerPropsPayload }) {
  const items = useMemo(() => soccerToItems(data.props), [data.props]);
  if (items.length === 0) {
    return (
      <div className="spotlight min-h-screen"><div className="max-w-screen-2xl mx-auto page-pad py-5 sm:py-6">
        <SportHeader eyebrow="Soccer Props · DraftKings" title="Player Props" accent="#1a73ff" />
        <EmptyState title="No player props posted yet" body="DraftKings usually posts soccer player markets a day or two before kickoff — check back closer to match day." />
      </div></div>
    );
  }
  const games = [...new Map(items.map((p) => [p.gameId, { id: p.gameId, label: p.gameLabel, sub: p.when }])).values()];
  const top = items.reduce((m, p) => Math.max(m, p.prob), 0);
  return (
    <PropsExplorer
      sport="soccer" eyebrow="Soccer Props · DraftKings" title="Player Props" defaultGroup="game"
      subtitle="Live DraftKings player markets — goalscorer, shots, cards and assists — with the price, the chance it implies, and how it has moved since it opened."
      items={items} topLabel="Most likely right now"
      games={games}
      markets={[{ key: "Anytime Goalscorer", label: "Goalscorer" }, { key: "Shots on Target", label: "Shots on target" }, { key: "Shots", label: "Shots" }, { key: "To be Carded", label: "Cards" }, { key: "Assist", label: "Assists" }]}
      summary={[{ label: "Props posted", value: String(items.length) }, { label: "Matches", value: `${data.withLines}/${data.matches.length}` }, { label: "Top chance", value: `${top}%` }]}
      footnote="Prices: DraftKings via ESPN. “Implied” is the chance the price represents, including the book’s margin. Odds move — confirm at your book. Entertainment only."
      backHref="/soccer"
    />
  );
}
