"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { LogoPlate, WnbaHeadshot, gradeColor, alpha } from "@/components/web-tool/spotlight";
import { Chip, EmptyState, Gauge, Segmented, SportHeader } from "@/components/web-tool/sport-ui";
import { nbaHeadshotUrl, nbaLogoUrl, nbaShortName, nbaTeamHex } from "@/lib/nba/teams";
import type { NbaGame, NbaPlayerProp, NbaPropMarket } from "@/lib/nba/types";

const ACCENT = "#fb923c";
type MarketFilter = "All" | NbaPropMarket;
type SideFilter = "all" | "over" | "under";

function NumberLine({ p }: { p: NbaPlayerProp }) {
  const max = Math.max(p.line, p.proj) * 1.55;
  const linePct = Math.min(88, (p.line / max) * 100);
  const projPct = Math.min(96, (p.proj / max) * 100);
  const left = Math.min(linePct, projPct);
  const width = Math.max(4, Math.abs(projPct - linePct));
  const green = p.proj >= p.line;
  return (
    <div className="relative h-10 rounded-xl" style={{ background: "rgba(255,255,255,.05)", border: "1px solid var(--hairline)" }}>
      <div className="absolute top-0 bottom-0 z-[2]" style={{ left: `${linePct}%`, width: 2, background: "rgba(255,255,255,.55)" }} />
      <div className="absolute z-[3] whitespace-nowrap rounded px-1.5 py-0.5 font-spot-mono font-extrabold text-[9px]"
        style={{ top: -9, left: `${linePct}%`, transform: "translateX(-50%)", color: "var(--text-2)", background: "var(--panel)", border: "1px solid rgba(255,255,255,.12)" }}>
        Line {p.line}
      </div>
      <div className="absolute flex items-center justify-end rounded-lg overflow-hidden"
        style={{
          top: 6, bottom: 6, left: `${left}%`, width: `${width}%`, minWidth: 34,
          background: green ? "var(--green)" : "#f87171",
          boxShadow: `0 0 16px ${green ? "rgba(52,211,153,.4)" : "rgba(248,113,113,.4)"}`,
          paddingRight: 7,
          ["--bar-target-width" as string]: `${width}%`,
          animation: "bar-grow-w .9s cubic-bezier(.22,1,.36,1) .1s both",
        }}>
        <span className="font-spot-mono font-extrabold text-[10.5px]" style={{ color: "#06070d" }}>{p.proj}</span>
      </div>
      <span className="absolute font-spot-sans font-extrabold text-[8px] uppercase tracking-[.1em]" style={{ bottom: 4, left: 8, color: "rgba(255,255,255,.3)" }}>Model proj.</span>
    </div>
  );
}

function PropCard({ p, inSlip, onToggle }: { p: NbaPlayerProp; inSlip: boolean; onToggle: () => void }) {
  const hex = nbaTeamHex(p.team);
  const gc = gradeColor(p.grade);
  return (
    <motion.div layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.3 }}
      className="rounded-[20px] overflow-hidden" style={{ background: "var(--panel)", border: `1px solid ${inSlip ? "rgba(52,211,153,.45)" : "var(--hairline)"}`, boxShadow: "var(--shadow-card)" }}>
      <div className="relative flex items-center gap-3.5 px-4 pt-4 pb-3.5 overflow-hidden" style={{ background: `linear-gradient(135deg, ${alpha(hex, "26")}, transparent 68%)` }}>
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${hex}, transparent)` }} />
        <div className="relative shrink-0">
          <WnbaHeadshot hex={hex} src={nbaHeadshotUrl(p.espnId)} name={p.player} size={76} />
          <div className="absolute -bottom-1.5 -right-1.5"><LogoPlate hex={hex} src={nbaLogoUrl(p.team)} code={p.team} size={27} radius={8} variant="clean" /></div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-spot-sans font-black text-[16.5px] leading-tight truncate" style={{ color: "var(--text)" }}>{p.player}</p>
          <p className="mt-1 font-spot-sans font-semibold text-[11px]" style={{ color: "var(--text-3)" }}>{p.team} {p.home ? "vs" : "@"} {p.opp} · {p.tipLabel}</p>
          <div className="mt-1.5 flex gap-1.5 flex-wrap">
            {p.source === "draftkings" ? <Chip color="#34d399">DraftKings line</Chip> : <Chip color="#94a3b8">Reference line</Chip>}
            {p.openLine != null && p.openLine !== p.line && <Chip color={p.line > p.openLine ? "#fbbf24" : "#60a5fa"}>{p.line > p.openLine ? "▲" : "▼"} {p.openLine} → {p.line}</Chip>}
            <Chip color={p.oppFactor >= 1.02 ? "#34d399" : p.oppFactor <= 0.98 ? "#f87171" : "#94a3b8"}>
              {p.oppFactor >= 1.02 ? "Boosted spot" : p.oppFactor <= 0.98 ? "Tough spot" : "Neutral spot"} ×{p.oppFactor.toFixed(2)}
            </Chip>
          </div>
        </div>
        <div className="shrink-0 text-center">
          <Gauge value={p.prob} label={p.grade} color={gc} size={62} stroke={6} />
        </div>
      </div>
      <div className="p-4 flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <p className="font-spot-sans font-extrabold text-[13px]" style={{ color: "var(--text)" }}>{p.market}</p>
          <p className="font-spot-mono font-bold text-[10px]" style={{ color: "var(--text-faint)" }}>Season avg {p.seasonAvg} · {p.minutes} min · {p.gp} GP</p>
        </div>
        <NumberLine p={p} />
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="rounded-lg px-2.5 py-1 font-spot-sans font-extrabold text-[11px]"
              style={p.over ? { color: "var(--green)", background: "var(--green-bg)", border: "1px solid rgba(52,211,153,.3)" } : { color: "#fda4a4", background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.3)" }}>
              {p.over ? "OVER" : "UNDER"} {p.line}
            </span>
            <span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-muted)" }}>{p.prob}% <span style={{ color: p.prob >= p.baseProb ? "var(--green)" : "var(--red-soft)" }}>{p.prob - p.baseProb >= 0 ? "+" : ""}{p.prob - p.baseProb}</span> {p.source === "draftkings" ? "vs fair" : "vs base"}{p.price != null ? ` · DK ${p.price > 0 ? "+" : ""}${p.price}` : ""}</span>
          </div>
          <button onClick={onToggle} className="press rounded-xl px-3.5 py-2 font-spot-sans font-extrabold text-[11px] whitespace-nowrap"
            style={inSlip ? { color: "var(--green)", background: "var(--green-bg)", border: "1px solid rgba(52,211,153,.32)" } : { color: "var(--purple-soft)", background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>
            {inSlip ? "✓ In slip" : "+ Add"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function FeaturedStrip({ top }: { top: NbaPlayerProp[] }) {
  return (
    <div className="snap-row -mx-4 px-4 sm:mx-0 sm:px-0 mb-6 pb-1">
      {top.map((p, i) => {
        const hex = nbaTeamHex(p.team);
        return (
          <motion.div key={p.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
            className="relative overflow-hidden rounded-[22px] p-4 w-[268px] sm:w-[300px] flex items-center gap-3"
            style={{ background: `linear-gradient(135deg, ${alpha(hex, "30")}, var(--panel) 72%)`, border: `1px solid ${alpha(hex, "55")}` }}>
            <span className="absolute top-2.5 right-3 font-spot-mono font-black text-[11px]" style={{ color: "rgba(255,255,255,.25)" }}>#{i + 1}</span>
            <WnbaHeadshot hex={hex} src={nbaHeadshotUrl(p.espnId)} name={p.player} size={84} radius={20} />
            <div className="min-w-0">
              <p className="font-spot-sans font-black text-[15px] leading-tight truncate" style={{ color: "var(--text)" }}>{p.player}</p>
              <p className="font-spot-sans text-[10.5px]" style={{ color: "var(--text-muted)" }}>{p.team} {p.home ? "vs" : "@"} {p.opp}</p>
              <p className="mt-1.5 font-spot-sans font-black text-[14px]" style={{ color: p.over ? "var(--green)" : "#fda4a4" }}>{p.over ? "Over" : "Under"} {p.line} {({ Points: "PTS", Rebounds: "REB", Assists: "AST", "3-Pointers": "3PM" } as Record<string, string>)[p.market] ?? p.market}</p>
              <p className="font-spot-mono font-bold text-[10.5px]" style={{ color: "var(--text-3)" }}>proj {p.proj} · {p.prob}% ({p.prob - p.baseProb >= 0 ? "+" : ""}{p.prob - p.baseProb}) · <span style={{ color: gradeColor(p.grade) }}>{p.grade}</span></p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function NbaPropsTool({ props, games, dayLabel, liveLines }: { props: NbaPlayerProp[]; games: NbaGame[]; dayLabel: string; liveLines: number }) {
  const [market, setMarket] = useState<MarketFilter>("All");
  const [side, setSide] = useState<SideFilter>("all");
  const [gameId, setGameId] = useState<string>("all");
  const [slip, setSlip] = useState<string[]>([]);
  const [limit, setLimit] = useState(18);

  const filtered = useMemo(() => props.filter((p) =>
    (market === "All" || p.market === market) &&
    (side === "all" || (side === "over") === p.over) &&
    (gameId === "all" || p.gameId === gameId)), [props, market, side, gameId]);

  const featured = useMemo(() => {
    const seen = new Set<string>();
    return props.filter((p) => (seen.has(p.player) ? false : (seen.add(p.player), true))).slice(0, 6);
  }, [props]);

  const slipProps = props.filter((p) => slip.includes(p.id));
  const slipProb = slipProps.reduce((a, p) => a * (p.prob / 100), 1);
  const toggle = (id: string) => setSlip((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-2xl mx-auto page-pad py-5 sm:py-6" style={{ paddingBottom: slip.length ? 110 : 28 }}>
        <SportHeader
          eyebrow={`NBA Props · ${dayLabel || "Next slate"}`}
          title="Player Props Analysis"
          subtitle={liveLines > 0
            ? "Real DraftKings player-prop lines, graded against a model projection built from season averages, tonight's defense, the game total and blowout risk. Edge = the model's hit chance at the book's number (50% = fair)."
            : "DraftKings hasn't posted player props for this slate yet — showing season-average reference lines until they do. Edge = lift over a season-average baseline."}
          accent={ACCENT}
        />

        {props.length === 0 ? (
          <EmptyState title="No games on the board" body="Props appear as soon as the next NBA slate is posted." />
        ) : (
          <>
            <FeaturedStrip top={featured} />

            <div className="flex flex-col gap-3 mb-5">
              <div className="flex gap-3 flex-wrap items-center">
                <Segmented id="nba-market" accent={ACCENT} value={market} onChange={setMarket}
                  options={[{ key: "All", label: "All" }, { key: "Points", label: "Points" }, { key: "Rebounds", label: "Rebounds" }, { key: "Assists", label: "Assists" }, { key: "3-Pointers", label: "3-Pointers" }]} />
                <Segmented id="nba-side" accent="#a78bfa" value={side} onChange={setSide}
                  options={[{ key: "all", label: "Any side" }, { key: "over", label: "Over" }, { key: "under", label: "Under" }]} />
              </div>
              <div className="snap-row -mx-4 px-4 sm:mx-0 sm:px-0">
                <button onClick={() => setGameId("all")} className="press rounded-full px-3.5 py-1.5 font-spot-sans font-extrabold text-[11px]"
                  style={gameId === "all" ? { background: "#fff", color: "#06070d" } : { color: "var(--text-muted)", border: "1px solid var(--hairline)" }}>All games</button>
                {games.map((g) => (
                  <button key={g.id} onClick={() => setGameId(g.id)} className="press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-spot-sans font-extrabold text-[11px]"
                    style={gameId === g.id ? { background: "#fff", color: "#06070d" } : { color: "var(--text-muted)", border: "1px solid var(--hairline)" }}>
                    {nbaShortName(g.away)} @ {nbaShortName(g.home)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,340px),1fr))" }}>
              <AnimatePresence mode="popLayout">
                {filtered.slice(0, limit).map((p) => <PropCard key={p.id} p={p} inSlip={slip.includes(p.id)} onToggle={() => toggle(p.id)} />)}
              </AnimatePresence>
            </div>
            {filtered.length === 0 && <EmptyState title="No props match these filters" />}
            {filtered.length > limit && (
              <div className="mt-5 flex justify-center">
                <button onClick={() => setLimit((l) => l + 18)} className="press rounded-xl px-5 py-2.5 font-spot-sans font-extrabold text-[12px]"
                  style={{ color: ACCENT, background: "rgba(251,146,60,.1)", border: "1px solid rgba(251,146,60,.28)" }}>Show more ({filtered.length - limit})</button>
              </div>
            )}
          </>
        )}

        <p className="mt-8 font-spot-sans text-[10px] max-w-2xl" style={{ color: "var(--text-faint)" }}>
          {liveLines > 0 ? `Lines: DraftKings via ESPN (${liveLines} of ${games.length} games posted). Lines move — confirm the number and price at your book before betting. ` : "Reference lines are season averages, not sportsbook prices. "}Projections are model estimates for entertainment only.{" "}
          <Link href="/nba" className="underline">Back to games</Link>
        </p>
      </div>

      <AnimatePresence>
        {slip.length > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="fixed left-0 right-0 z-30 px-4 sm:px-5 bottom-[calc(72px+env(safe-area-inset-bottom))] sm:bottom-4" style={{ pointerEvents: "none" }}>
            <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-3 rounded-2xl px-4 py-3" style={{ background: "rgba(17,15,30,.94)", border: "1px solid var(--purple-line)", backdropFilter: "blur(14px)", boxShadow: "0 20px 60px rgba(0,0,0,.6)", pointerEvents: "auto" }}>
              <span className="font-spot-sans font-bold text-[12.5px]" style={{ color: "var(--text-2)" }}>
                <span className="font-black" style={{ color: "var(--purple-2)" }}>{slip.length}</span>-leg slip · model hit chance{" "}
                <span className="font-spot-mono font-extrabold" style={{ color: "var(--green)" }}>{(slipProb * 100).toFixed(1)}%</span>
              </span>
              <button onClick={() => setSlip([])} className="font-spot-sans font-bold text-xs" style={{ color: "var(--text-muted)" }}>Clear</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
