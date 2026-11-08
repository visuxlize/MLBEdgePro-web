"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LogoPlate } from "@/components/web-tool/spotlight";
import { Panel, Segmented, SportHeader } from "@/components/web-tool/sport-ui";
import { nflLogoUrl, nflTeamHex, nflTeamName } from "@/lib/nfl/teams";
import type { NflStandingRow } from "@/lib/nfl/types";

const ACCENT = "#a78bfa";
type View = "divisions" | "seeds" | "power";
type Conf = "AFC" | "NFC";

const rec = (r: NflStandingRow) => `${r.wins}-${r.losses}${r.ties ? `-${r.ties}` : ""}`;
const sortRows = (a: NflStandingRow, b: NflStandingRow) => b.pct - a.pct || b.diff - a.diff;

function Head({ mode }: { mode: "div" | "seeds" | "power" }) {
  const c = "font-spot-sans font-extrabold text-[9px] uppercase tracking-[.1em]";
  return (
    <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5" style={{ borderBottom: "1px solid var(--hairline)", color: "var(--text-faint)" }}>
      <span className={`${c} w-6 text-center`}>{mode === "seeds" ? "Seed" : "#"}</span>
      <span className={`${c} flex-1`}>Team</span>
      <span className={`${c} w-12 text-right`}>W-L</span>
      {mode === "power" ? <span className={`${c} w-28 sm:w-44 text-right`}>Edge Power</span> : (
        <>
          <span className={`${c} w-10 text-right hidden sm:block`}>PF</span>
          <span className={`${c} w-10 text-right hidden sm:block`}>PA</span>
          <span className={`${c} w-11 text-right`}>Diff</span>
          <span className={`${c} w-9 text-right`}>Strk</span>
          <span className={`${c} w-12 text-right hidden md:block`}>Div</span>
          <span className={`${c} w-12 text-right hidden md:block`}>Conf</span>
          <span className={`${c} w-12 text-right hidden lg:block`}>Home</span>
          <span className={`${c} w-12 text-right hidden lg:block`}>Road</span>
        </>
      )}
    </div>
  );
}

function Row({ r, i, mode, maxPower, cut }: { r: NflStandingRow; i: number; mode: "div" | "seeds" | "power"; maxPower: number; cut?: boolean }) {
  const hex = nflTeamHex(r.abbr);
  const lead = mode === "div" && i === 0;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 14) * 0.02 }}
      className="relative flex items-center gap-2 px-3 sm:px-4 py-2.5" style={{ borderTop: i ? "1px solid var(--hairline)" : undefined, boxShadow: cut ? "inset 0 1px 0 rgba(167,139,250,.55)" : undefined }}>
      <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r" style={{ background: hex }} />
      <span className="font-spot-mono font-black text-[12px] w-6 text-center" style={{ color: lead || (mode === "seeds" && i < 7) ? "#c4b5fd" : "var(--text-faint)" }}>
        {mode === "seeds" ? (r.seed || i + 1) : i + 1}
      </span>
      <div className="flex-1 min-w-0 flex items-center gap-2.5">
        <LogoPlate hex={hex} src={nflLogoUrl(r.abbr)} code={r.abbr} size={32} radius={10} variant="clean" />
        <div className="min-w-0">
          <p className="font-spot-sans font-extrabold text-[13.5px] truncate" style={{ color: "var(--text)" }}>
            <span className="sm:hidden">{r.abbr}</span><span className="hidden sm:inline">{nflTeamName(r.abbr)}</span>
          </p>
          <p className="font-spot-sans text-[9px]" style={{ color: "var(--text-faint)" }}>{r.division}</p>
        </div>
      </div>
      <span className="font-spot-mono font-extrabold text-[12.5px] w-12 text-right" style={{ color: "var(--text)" }}>{rec(r)}</span>
      {mode === "power" ? (
        <div className="w-28 sm:w-44 flex items-center justify-end gap-2">
          <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.06)" }}>
            <div className="h-full rounded-full" style={{ width: `${Math.max(6, ((r.power + maxPower) / (2 * maxPower)) * 100)}%`, background: r.power >= 0 ? "linear-gradient(90deg,#7c5cfa,#c4b5fd)" : "linear-gradient(90deg,#6b7280,#9ca3af)", transformOrigin: "left", animation: `bar-grow .8s cubic-bezier(.22,1,.36,1) ${Math.min(i, 14) * 0.03}s both` }} />
          </div>
          <span className="font-spot-mono font-extrabold text-[11px] w-10 text-right" style={{ color: r.power >= 0 ? "var(--green)" : "var(--red-soft)" }}>{r.power > 0 ? "+" : ""}{r.power.toFixed(1)}</span>
        </div>
      ) : (
        <>
          <span className="font-spot-mono text-[11.5px] w-10 text-right hidden sm:block" style={{ color: "var(--text-2)" }}>{r.pf}</span>
          <span className="font-spot-mono text-[11.5px] w-10 text-right hidden sm:block" style={{ color: "var(--text-2)" }}>{r.pa}</span>
          <span className="font-spot-mono font-bold text-[11.5px] w-11 text-right" style={{ color: r.diff >= 0 ? "var(--green)" : "var(--red-soft)" }}>{r.diff > 0 ? "+" : ""}{r.diff}</span>
          <span className="font-spot-mono font-bold text-[11px] w-9 text-right" style={{ color: r.streak.startsWith("W") ? "var(--green)" : "var(--red-soft)" }}>{r.streak}</span>
          <span className="font-spot-mono text-[11.5px] w-12 text-right hidden md:block" style={{ color: "var(--text-muted)" }}>{r.divRecord}</span>
          <span className="font-spot-mono text-[11.5px] w-12 text-right hidden md:block" style={{ color: "var(--text-muted)" }}>{r.confRecord}</span>
          <span className="font-spot-mono text-[11.5px] w-12 text-right hidden lg:block" style={{ color: "var(--text-muted)" }}>{r.home}</span>
          <span className="font-spot-mono text-[11.5px] w-12 text-right hidden lg:block" style={{ color: "var(--text-muted)" }}>{r.road}</span>
        </>
      )}
    </motion.div>
  );
}

export function NflStandings({ rows }: { rows: NflStandingRow[] }) {
  const [view, setView] = useState<View>("divisions");
  const [conf, setConf] = useState<Conf>("AFC");

  const divisions = useMemo(() => {
    const m = new Map<string, NflStandingRow[]>();
    rows.filter((r) => r.conf === conf).forEach((r) => m.set(r.division, [...(m.get(r.division) ?? []), r]));
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, list]) => [name, list.sort(sortRows)] as const);
  }, [rows, conf]);
  const seeds = useMemo(() => rows.filter((r) => r.conf === conf).sort((a, b) => (a.seed || 99) - (b.seed || 99)), [rows, conf]);
  const power = useMemo(() => [...rows].sort((a, b) => b.power - a.power), [rows]);
  const maxPower = Math.max(1, ...rows.map((r) => Math.abs(r.power)));

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-xl mx-auto page-pad py-5 sm:py-6">
        <SportHeader eyebrow="NFL · 2026 season" title="Standings & Placement" subtitle="Division races, the playoff seeding line, and Edge Power — points differential per game, shrunk for sample size." accent={ACCENT} />

        <div className="flex flex-wrap gap-3 mb-4">
          <Segmented id="nfl-view" accent={ACCENT} value={view} onChange={setView} options={[{ key: "divisions", label: "Divisions" }, { key: "seeds", label: "Playoff seeds" }, { key: "power", label: "Power rankings" }]} />
          {view !== "power" && <Segmented id="nfl-conf" accent="#fbbf24" value={conf} onChange={setConf} options={[{ key: "AFC", label: "AFC" }, { key: "NFC", label: "NFC" }]} />}
        </div>

        {view === "divisions" && (
          <div key={conf} className="grid gap-4 md:grid-cols-2">
            {divisions.map(([name, list]) => (
              <Panel key={name} className="overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between" style={{ background: "linear-gradient(120deg,rgba(167,139,250,.14),transparent 70%)", borderBottom: "1px solid var(--hairline)" }}>
                  <p className="font-spot-sans font-black text-[13.5px]" style={{ color: "var(--text)" }}>{name}</p>
                  <span className="font-spot-mono text-[10px]" style={{ color: "var(--text-faint)" }}>Leader {list[0]?.abbr}</span>
                </div>
                <Head mode="div" />
                {list.map((r, i) => <Row key={r.abbr} r={r} i={i} mode="div" maxPower={maxPower} />)}
              </Panel>
            ))}
          </div>
        )}

        {view === "seeds" && (
          <Panel key={conf} className="overflow-hidden">
            <Head mode="seeds" />
            {seeds.map((r, i) => <Row key={r.abbr} r={r} i={i} mode="seeds" maxPower={maxPower} cut={i === 7} />)}
          </Panel>
        )}

        {view === "power" && (
          <Panel className="overflow-hidden">
            <Head mode="power" />
            {power.map((r, i) => <Row key={r.abbr} r={r} i={i} mode="power" maxPower={maxPower} />)}
          </Panel>
        )}

        {view === "seeds" && <p className="mt-3 font-spot-sans text-[10.5px]" style={{ color: "var(--text-faint)" }}>Seeds 1–7 make the playoffs; the 1 seed earns a first-round bye. Purple line marks the cut.</p>}
      </div>
    </div>
  );
}
