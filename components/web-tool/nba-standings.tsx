"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LogoPlate } from "@/components/web-tool/spotlight";
import { Panel, Segmented, SportHeader } from "@/components/web-tool/sport-ui";
import { nbaLogoUrl, nbaTeamHex, nbaTeamName } from "@/lib/nba/teams";
import type { NbaStandingRow } from "@/lib/nba/types";

const ACCENT = "#fb923c";
type View = "league" | "East" | "West" | "power";

function Spotlight({ label, row, value, color }: { label: string; row: NbaStandingRow; value: string; color: string }) {
  return (
    <div className="rounded-2xl p-3.5 flex items-center gap-3 min-w-[220px] sm:min-w-0" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
      <LogoPlate hex={nbaTeamHex(row.abbr)} src={nbaLogoUrl(row.abbr)} code={row.abbr} size={44} radius={14} variant="clean" />
      <div className="min-w-0">
        <p className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.12em]" style={{ color }}>{label}</p>
        <p className="font-spot-sans font-black text-[14px] truncate" style={{ color: "var(--text)" }}>{row.name}</p>
        <p className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-muted)" }}>{value}</p>
      </div>
    </div>
  );
}

function Head({ power }: { power: boolean }) {
  const c = "font-spot-sans font-extrabold text-[9px] uppercase tracking-[.1em]";
  return (
    <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sticky top-14 z-10 backdrop-blur-md" style={{ background: "rgba(11,13,21,.92)", borderBottom: "1px solid var(--hairline)", color: "var(--text-faint)" }}>
      <span className={`${c} w-6 text-center`}>#</span>
      <span className={`${c} flex-1`}>Team</span>
      <span className={`${c} w-14 text-right`}>W-L</span>
      {power ? (
        <span className={`${c} w-24 sm:w-40 text-right`}>Edge Power</span>
      ) : (
        <>
          <span className={`${c} w-11 text-right hidden sm:block`}>PCT</span>
          <span className={`${c} w-9 text-right hidden sm:block`}>GB</span>
          <span className={`${c} w-12 text-right hidden md:block`}>L10</span>
          <span className={`${c} w-10 text-right`}>Strk</span>
          <span className={`${c} w-12 text-right`}>Diff</span>
          <span className={`${c} w-14 text-right hidden lg:block`}>Home</span>
          <span className={`${c} w-14 text-right hidden lg:block`}>Road</span>
          <span className={`${c} w-[74px] text-right hidden lg:block`}>PPG/OPP</span>
        </>
      )}
    </div>
  );
}

function Row({ r, idx, power, maxPower, seedCut }: { r: NbaStandingRow; idx: number; power: boolean; maxPower: number; seedCut: boolean }) {
  const hex = nbaTeamHex(r.abbr);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx, 14) * 0.02, duration: 0.3 }}
      className="relative flex items-center gap-2 px-3 sm:px-4 py-2.5"
      style={{ borderTop: "1px solid var(--hairline)", boxShadow: seedCut ? "inset 0 1px 0 rgba(251,146,60,.5)" : undefined }}
    >
      <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r" style={{ background: hex }} />
      <span className="font-spot-mono font-black text-[12px] w-6 text-center" style={{ color: idx < 6 ? "#fdba74" : idx < 10 ? "var(--text-3)" : "var(--text-faint)" }}>{idx + 1}</span>
      <div className="flex-1 min-w-0 flex items-center gap-2.5">
        <LogoPlate hex={hex} src={nbaLogoUrl(r.abbr)} code={r.abbr} size={32} radius={10} variant="clean" />
        <div className="min-w-0">
          <p className="font-spot-sans font-extrabold text-[13.5px] truncate" style={{ color: "var(--text)" }}>
            <span className="sm:hidden">{r.abbr}</span><span className="hidden sm:inline">{nbaTeamName(r.abbr)}</span>
          </p>
          <p className="font-spot-sans text-[9px] sm:hidden" style={{ color: "var(--text-faint)" }}>{r.conf} · {r.pct.toFixed(3).replace(/^0/, "")}</p>
        </div>
      </div>
      <span className="font-spot-mono font-extrabold text-[12.5px] w-14 text-right" style={{ color: "var(--text)" }}>{r.wins}-{r.losses}</span>
      {power ? (
        <div className="w-24 sm:w-40 flex items-center justify-end gap-2">
          <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.06)" }}>
            <div className="h-full rounded-full" style={{ width: `${Math.max(6, ((r.power + maxPower) / (2 * maxPower)) * 100)}%`, background: r.power >= 0 ? "linear-gradient(90deg,#fb923c,#fdba74)" : "linear-gradient(90deg,#6b7280,#9ca3af)", transformOrigin: "left", animation: `bar-grow .8s cubic-bezier(.22,1,.36,1) ${Math.min(idx, 14) * 0.03}s both` }} />
          </div>
          <span className="font-spot-mono font-extrabold text-[11px] w-9 text-right" style={{ color: r.power >= 0 ? "var(--green)" : "var(--red-soft)" }}>{r.power > 0 ? "+" : ""}{r.power.toFixed(1)}</span>
        </div>
      ) : (
        <>
          <span className="font-spot-mono text-[11.5px] w-11 text-right hidden sm:block" style={{ color: "var(--text-2)" }}>{r.pct.toFixed(3).replace(/^0/, "")}</span>
          <span className="font-spot-mono text-[11.5px] w-9 text-right hidden sm:block" style={{ color: "var(--text-muted)" }}>{r.gb}</span>
          <span className="font-spot-mono text-[11.5px] w-12 text-right hidden md:block" style={{ color: "var(--text-2)" }}>{r.l10}</span>
          <span className="font-spot-mono font-bold text-[11px] w-10 text-right" style={{ color: r.streak.startsWith("W") ? "var(--green)" : "var(--red-soft)" }}>{r.streak}</span>
          <span className="font-spot-mono font-bold text-[11.5px] w-12 text-right" style={{ color: r.diff >= 0 ? "var(--green)" : "var(--red-soft)" }}>{r.diff > 0 ? "+" : ""}{r.diff.toFixed(1)}</span>
          <span className="font-spot-mono text-[11.5px] w-14 text-right hidden lg:block" style={{ color: "var(--text-muted)" }}>{r.home}</span>
          <span className="font-spot-mono text-[11.5px] w-14 text-right hidden lg:block" style={{ color: "var(--text-muted)" }}>{r.road}</span>
          <span className="font-spot-mono text-[11px] w-[74px] text-right hidden lg:block" style={{ color: "var(--text-muted)" }}>{r.ppg.toFixed(1)}/{r.oppg.toFixed(1)}</span>
        </>
      )}
    </motion.div>
  );
}

export function NbaStandings({ rows }: { rows: NbaStandingRow[] }) {
  const [view, setView] = useState<View>("league");

  const list = useMemo(() => {
    if (view === "power") return [...rows].sort((a, b) => b.power - a.power);
    if (view === "league") return [...rows].sort((a, b) => b.pct - a.pct || b.diff - a.diff);
    return rows.filter((r) => r.conf === view).sort((a, b) => b.pct - a.pct || b.diff - a.diff);
  }, [rows, view]);

  const best = [...rows].sort((a, b) => b.pct - a.pct || b.diff - a.diff)[0];
  const topPower = [...rows].sort((a, b) => b.power - a.power)[0];
  const hottest = [...rows].filter((r) => r.streak.startsWith("W")).sort((a, b) => parseInt(b.streak.slice(1)) - parseInt(a.streak.slice(1)))[0];
  const maxPower = Math.max(1, ...rows.map((r) => Math.abs(r.power)));

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-xl mx-auto page-pad py-5 sm:py-6">
        <SportHeader
          eyebrow="NBA · 2026–27"
          title="Standings & Rankings"
          subtitle="Where every team stands — plus the Edge Power ranking, which weighs point differential and shrinks small samples."
          accent={ACCENT}
        />

        {best && topPower && (
          <div className="snap-row -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 gap-3 mb-5 stagger">
            <Spotlight label="Best record" row={best} value={`${best.wins}-${best.losses} · ${best.conf}`} color="#fdba74" />
            <Spotlight label="#1 Edge Power" row={topPower} value={`${topPower.power > 0 ? "+" : ""}${topPower.power.toFixed(1)} rating`} color="var(--purple-2)" />
            {hottest && <Spotlight label="Hottest streak" row={hottest} value={`${hottest.streak} · ${hottest.wins}-${hottest.losses}`} color="var(--green)" />}
          </div>
        )}

        <div className="mb-4">
          <Segmented
            id="nba-standings" accent={ACCENT} value={view} onChange={setView}
            options={[
              { key: "league", label: "League" },
              { key: "East", label: "East" },
              { key: "West", label: "West" },
              { key: "power", label: "Power Rankings" },
            ]}
          />
        </div>

        <Panel className="overflow-hidden">
          <Head power={view === "power"} />
          <div key={view}>
            {list.map((r, i) => (
              <Row key={r.abbr} r={r} idx={i} power={view === "power"} maxPower={maxPower}
                seedCut={view !== "league" && view !== "power" && i === 6} />
            ))}
          </div>
        </Panel>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-spot-sans text-[10.5px]" style={{ color: "var(--text-faint)" }}>
          <span><span style={{ color: "#fdba74" }}>●</span> Top 6 — direct playoff spots</span>
          <span>Orange line — play-in cutoff (7–10 play-in)</span>
          <span>Edge Power = avg point differential × games/(games+12)</span>
        </div>
      </div>
    </div>
  );
}
