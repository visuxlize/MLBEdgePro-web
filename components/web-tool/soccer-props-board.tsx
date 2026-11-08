"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { WnbaHeadshot, alpha } from "@/components/web-tool/spotlight";
import { Chip, EmptyState, Segmented, SportHeader } from "@/components/web-tool/sport-ui";
import { soccerHeadshotUrl } from "@/lib/soccer/leagues";
import type { SoccerPropsPayload, SoccerRealProp, SoccerMarket } from "@/lib/soccer/props";

const ACCENT = "#1a73ff";
type MarketFilter = "all" | SoccerMarket;
const fmt = (p: number) => (p > 0 ? `+${p}` : String(p));
const tm = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

function Crest({ src, name, size }: { src: string; name: string; size: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={name} width={size} height={size} className="object-contain" style={{ width: size, height: size }} onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = "hidden")} />;
}

function PropCard({ p, i }: { p: SoccerRealProp; i: number }) {
  const hex = p.teamHex.length >= 7 ? p.teamHex : "#12a150";
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}
      className="rounded-[20px] overflow-hidden" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
      <div className="relative flex items-center gap-3.5 px-4 pt-4 pb-3 overflow-hidden" style={{ background: `linear-gradient(135deg, ${alpha(hex, "26")}, transparent 68%)` }}>
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${hex}, transparent)` }} />
        <div className="relative shrink-0">
          <WnbaHeadshot hex={hex} src={soccerHeadshotUrl(p.athleteId)} name={p.player} size={68} />
          <div className="absolute -bottom-1.5 -right-1.5 w-[26px] h-[26px] rounded-lg flex items-center justify-center" style={{ background: "#ffffff", boxShadow: `inset 0 0 0 1.5px ${alpha(hex, "66")}` }}><Crest src={p.teamLogo} name={p.teamAbbr} size={18} /></div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-spot-sans font-black text-[16px] leading-tight truncate" style={{ color: "var(--text)" }}>{p.player}</p>
          <p className="mt-0.5 font-spot-sans font-semibold text-[11px]" style={{ color: "var(--text-3)" }}>{p.teamAbbr}{p.pos ? ` · ${p.pos}` : ""}{p.jersey ? ` · #${p.jersey}` : ""} · vs {p.opp}</p>
          <div className="mt-1.5 flex gap-1.5 flex-wrap">
            <Chip color="#12a150">DraftKings</Chip>
            {p.movement && <Chip color={p.movement === "shorter" ? "#d49a06" : "#60a5fa"}>{p.movement === "shorter" ? "▲ backed" : "▼ drifting"} {p.openPrice != null ? `${fmt(p.openPrice)} → ${fmt(p.price)}` : ""}</Chip>}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-spot-mono font-black text-[20px] leading-none" style={{ color: "var(--text)" }}>{fmt(p.price)}</p>
          <p className="mt-1 font-spot-sans font-extrabold text-[9px] uppercase tracking-[.1em]" style={{ color: "var(--text-faint)" }}>price</p>
        </div>
      </div>
      <div className="px-4 pb-4 pt-1">
        <div className="flex items-baseline justify-between">
          <p className="font-spot-sans font-extrabold text-[13.5px]" style={{ color: "var(--text)" }}>{p.market} <span style={{ color: ACCENT }}>{p.target}</span></p>
          <p className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-3)" }}>{p.implied}% implied</p>
        </div>
        <div className="mt-2 h-[7px] rounded-full overflow-hidden" style={{ background: "var(--wash-2)" }}>
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, p.implied)}%`, background: `linear-gradient(90deg, ${alpha(hex, "99")}, ${ACCENT})`, transformOrigin: "left", animation: "bar-grow .8s cubic-bezier(.22,1,.36,1) both" }} />
        </div>
      </div>
    </motion.div>
  );
}

export function SoccerPropsBoard({ data }: { data: SoccerPropsPayload }) {
  const [market, setMarket] = useState<MarketFilter>("all");
  const [league, setLeague] = useState<string>("all");

  const leagues = useMemo(() => [...new Set(data.props.map((p) => p.league))].map((k) => ({ key: k, label: data.props.find((p) => p.league === k)!.leagueLabel })), [data.props]);
  const visible = useMemo(() => data.props.filter((p) => (market === "all" || p.market === market) && (league === "all" || p.league === league)), [data.props, market, league]);

  const groups = useMemo(() => {
    const m = new Map<string, SoccerRealProp[]>();
    for (const p of visible) m.set(p.matchId, [...(m.get(p.matchId) ?? []), p]);
    return [...m.values()].sort((a, b) => a[0].kickoff.localeCompare(b[0].kickoff));
  }, [visible]);

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-2xl mx-auto page-pad py-5 sm:py-6">
        <SportHeader
          eyebrow="Soccer Props · DraftKings"
          title="Player Props Board"
          subtitle="Live DraftKings player markets — anytime goalscorer, shots, shots on target, cards and assists — with the price, the chance it implies, and how the number has moved since it opened."
          accent={ACCENT}
          right={<Chip color="#12a150">{data.withLines} of {data.matches.length} matches posted</Chip>}
        />

        {data.props.length === 0 ? (
          <EmptyState title="No player props posted yet" body="DraftKings usually posts soccer player markets a day or two before kickoff — check back closer to match day." />
        ) : (
          <>
            <div className="flex flex-col gap-3 mb-5">
              <Segmented id="soc-market" accent={ACCENT} value={market} onChange={setMarket}
                options={[{ key: "all", label: "All" }, { key: "Anytime Goalscorer", label: "Goalscorer" }, { key: "Shots on Target", label: "Shots on target" }, { key: "Shots", label: "Shots" }, { key: "To be Carded", label: "Cards" }, { key: "Assist", label: "Assists" }]} />
              <div className="snap-row -mx-4 px-4 sm:mx-0 sm:px-0">
                <button onClick={() => setLeague("all")} className="press rounded-full px-3.5 py-1.5 font-spot-sans font-extrabold text-[11px]" style={league === "all" ? { background: "#fff", color: "#06070d" } : { color: "var(--text-muted)", border: "1px solid var(--hairline)" }}>All leagues</button>
                {leagues.map((l) => (
                  <button key={l.key} onClick={() => setLeague(l.key)} className="press rounded-full px-3.5 py-1.5 font-spot-sans font-extrabold text-[11px]" style={league === l.key ? { background: "#fff", color: "#06070d" } : { color: "var(--text-muted)", border: "1px solid var(--hairline)" }}>{l.label}</button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-7">
              {groups.map((g) => (
                <section key={g[0].matchId}>
                  <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
                    <Chip color="#12a150">{g[0].leagueLabel}</Chip>
                    <p className="font-spot-sans font-black text-[16px]" style={{ color: "var(--text)" }}>{g[0].matchup}</p>
                    <span className="font-spot-mono text-[11px]" style={{ color: "var(--text-faint)" }}>{tm(g[0].kickoff)}{g[0].status === "live" ? " · LIVE" : ""}</span>
                  </div>
                  <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,330px),1fr))" }}>
                    {g.map((p, i) => <PropCard key={p.id} p={p} i={i} />)}
                  </div>
                </section>
              ))}
              {groups.length === 0 && <EmptyState title="No props match these filters" />}
            </div>
          </>
        )}

        <p className="mt-8 font-spot-sans text-[10px] max-w-2xl" style={{ color: "var(--text-faint)" }}>
          Prices: DraftKings via ESPN. &ldquo;Implied&rdquo; is the chance the price represents including the book&rsquo;s margin. Odds move — confirm at your book. Entertainment only.
        </p>
      </div>
    </div>
  );
}
