"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogoPlate } from "@/components/web-tool/spotlight";
import { Chip, EmptyState, Gauge, Panel, Segmented, SportHeader } from "@/components/web-tool/sport-ui";
import { nbaLogoUrl, nbaShortName, nbaTeamHex } from "@/lib/nba/teams";
import type { NbaCupData, NbaCupGroup, NbaGame } from "@/lib/nba/types";

const GOLD = "#d49a06";

function GroupCard({ g, i }: { g: NbaCupGroup; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.4 }}
      className="rounded-[20px] overflow-hidden" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ background: "linear-gradient(120deg,rgba(251,191,36,.12),transparent 70%)", borderBottom: "1px solid var(--hairline)" }}>
        <p className="font-spot-sans font-black text-[13px]" style={{ color: "var(--text)" }}>{g.label}</p>
        <div className="flex gap-3 font-spot-sans font-extrabold text-[8.5px] uppercase tracking-[.1em]" style={{ color: "var(--text-faint)" }}>
          <span className="w-9 text-right">W-L</span><span className="w-9 text-right">Diff</span>
        </div>
      </div>
      {g.rows.map((r, idx) => (
        <div key={r.abbr} className="relative flex items-center gap-2.5 px-4 py-2.5" style={{ borderTop: idx ? "1px solid var(--hairline)" : undefined }}>
          {r.q && <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r" style={{ background: r.q === "adv" ? "var(--green)" : GOLD }} />}
          <span className="font-spot-mono font-black text-[11px] w-3.5" style={{ color: "var(--text-faint)" }}>{idx + 1}</span>
          <LogoPlate hex={nbaTeamHex(r.abbr)} src={nbaLogoUrl(r.abbr)} code={r.abbr} size={30} radius={9} variant="clean" />
          <span className="flex-1 font-spot-sans font-extrabold text-[13px] truncate" style={{ color: "var(--text)" }}>{nbaShortName(r.abbr)}</span>
          {r.q && <Chip color={r.q === "adv" ? "#12a150" : GOLD}>{r.q === "adv" ? "Adv" : "Wild card"}</Chip>}
          <span className="font-spot-mono font-extrabold text-[12px] w-9 text-right" style={{ color: "var(--text)" }}>{r.wins}-{r.losses}</span>
          <span className="font-spot-mono font-bold text-[11px] w-9 text-right" style={{ color: r.diff >= 0 ? "var(--green)" : "var(--red-soft)" }}>{r.diff > 0 ? "+" : ""}{r.diff}</span>
        </div>
      ))}
    </motion.div>
  );
}

function MiniGame({ g }: { g: NbaGame }) {
  const final = g.status === "final";
  const awayWon = final && (g.awayScore ?? 0) > (g.homeScore ?? 0);
  return (
    <Link href={`/nba/game/${g.id}`} className="press flex items-center gap-3 rounded-2xl px-3.5 py-3" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
      <div className="w-[52px] shrink-0">
        <p className="font-spot-mono font-extrabold text-[10px]" style={{ color: final ? "var(--text-muted)" : "#c2540a" }}>{final ? "FINAL" : g.status === "live" ? "LIVE" : g.timeLabel}</p>
        <p className="font-spot-sans text-[9px]" style={{ color: "var(--text-faint)" }}>{g.dateLabel.replace(/^\w+, /, "")}</p>
      </div>
      <div className="flex-1 min-w-0 flex items-center justify-center gap-2.5">
        <LogoPlate hex={nbaTeamHex(g.away)} src={nbaLogoUrl(g.away)} code={g.away} size={28} radius={9} variant="clean" />
        <span className="font-spot-mono font-black text-[15px]" style={{ color: final ? (awayWon ? "var(--text)" : "var(--text-dim)") : "var(--text-faint)" }}>{final ? g.awayScore : g.away}</span>
        <span style={{ color: "var(--text-ghost)" }}>–</span>
        <span className="font-spot-mono font-black text-[15px]" style={{ color: final ? (!awayWon ? "var(--text)" : "var(--text-dim)") : "var(--text-faint)" }}>{final ? g.homeScore : g.home}</span>
        <LogoPlate hex={nbaTeamHex(g.home)} src={nbaLogoUrl(g.home)} code={g.home} size={28} radius={9} variant="clean" />
      </div>
      <span className="font-spot-sans font-black text-sm" style={{ color: "var(--text-faint)" }}>›</span>
    </Link>
  );
}

export function NbaCup({ data }: { data: NbaCupData }) {
  const [conf, setConf] = useState<"all" | "East" | "West">("all");
  const pct = data.total ? Math.round((data.played / data.total) * 100) : 0;
  const groups = data.groups.filter((g) => conf === "all" || g.conf === conf);
  const upcoming = useMemo(() => data.games.filter((g) => g.status !== "final").slice(0, 8), [data.games]);
  const recent = useMemo(() => data.games.filter((g) => g.status === "final").slice(-8).reverse(), [data.games]);

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-xl mx-auto page-pad py-5 sm:py-6">
        <SportHeader
          eyebrow="NBA · In-Season Tournament"
          title="Emirates NBA Cup"
          subtitle="Six groups of five. Group winners plus one wild card per conference advance to the knockout rounds."
          accent={GOLD}
        />

        {/* Hero progress */}
        <div className="relative overflow-hidden rounded-[22px] p-5 mb-5 flex items-center gap-5 flex-wrap"
          style={{ background: "linear-gradient(130deg,rgba(251,191,36,.16),var(--panel) 62%)", border: "1px solid rgba(251,191,36,.3)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(60% 90% at 90% 0%, rgba(251,191,36,.12), transparent)" }} />
          <Gauge value={pct} label="DONE" color={GOLD} size={92} />
          <div className="relative flex-1 min-w-[200px]">
            <p className="spot-label" style={{ color: GOLD }}>Group play</p>
            <p className="mt-1 font-spot-sans font-black text-2xl" style={{ color: "var(--text)" }}>{data.played} of {data.total} games played</p>
            <p className="mt-1 font-spot-sans text-[12px]" style={{ color: "var(--text-muted)" }}>
              <span style={{ color: "var(--green)" }}>●</span> Group leader — advancing &nbsp; <span style={{ color: GOLD }}>●</span> Best runner-up — wild card
            </p>
          </div>
          {data.knockout.length > 0 && <Chip color="#6d4fe0">Knockout rounds set</Chip>}
        </div>

        {data.groups.length === 0 ? (
          <EmptyState title="Cup groups aren't published yet" body="Group play fills in as soon as the first Cup games are on the schedule." />
        ) : (
          <>
            <div className="mb-4">
              <Segmented id="cup-conf" accent={GOLD} value={conf} onChange={setConf}
                options={[{ key: "all", label: "All groups" }, { key: "East", label: "East" }, { key: "West", label: "West" }]} />
            </div>
            <div key={conf} className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3 mb-7">
              {groups.map((g, i) => <GroupCard key={g.id} g={g} i={i} />)}
            </div>
          </>
        )}

        {data.knockout.length > 0 && (
          <section className="mb-7">
            <p className="spot-label mb-2.5" style={{ color: "#6d4fe0" }}>Knockout rounds</p>
            <div className="grid gap-2.5 sm:grid-cols-2">{data.knockout.map((g) => <MiniGame key={g.id} g={g} />)}</div>
          </section>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <section>
            <p className="spot-label mb-2.5" style={{ color: "var(--text-faint)" }}>Next Cup games</p>
            <div className="flex flex-col gap-2">{upcoming.length ? upcoming.map((g) => <MiniGame key={g.id} g={g} />) : <EmptyState title="No upcoming Cup games" />}</div>
          </section>
          <section>
            <p className="spot-label mb-2.5" style={{ color: "var(--text-faint)" }}>Recent results</p>
            <div className="flex flex-col gap-2">{recent.length ? recent.map((g) => <MiniGame key={g.id} g={g} />) : <EmptyState title="No results yet" />}</div>
          </section>
        </div>

        <Panel className="mt-7 p-4">
          <p className="spot-label" style={{ color: GOLD }}>How the Cup works</p>
          <p className="mt-2 font-spot-sans text-[12.5px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Every team plays four group games on designated Cup nights. Cup results also count in the regular-season standings, except the final.
            Group winners and a wild card from each conference reach the quarterfinals; the semifinals and final are played in Las Vegas.
            Tiebreakers here: wins, then point differential, then points scored.
          </p>
        </Panel>
      </div>
    </div>
  );
}
