"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LogoPlate, WnbaHeadshot, alpha, gradeColor } from "@/components/web-tool/spotlight";
import { Chip, Panel, Segmented, SportHeader } from "@/components/web-tool/sport-ui";
import { nflHeadshotUrl, nflLogoUrl, nflTeamHex } from "@/lib/nfl/teams";
import type { NflPlayerSeason, NflPropPlay } from "@/lib/nfl/types";

const ACCENT = "#a78bfa";
type Cat = "passing" | "rushing" | "receiving" | "defense";

interface Col { key: string; label: string; fmt?: (v: number, p: NflPlayerSeason) => string }
const n1 = (v: number) => (Number.isFinite(v) ? v.toFixed(1) : "—");
const int = (v: number) => (Number.isFinite(v) ? String(Math.round(v)) : "—");

const CATS: Record<Cat, { label: string; sort: string; market: NflPropPlay["market"] | null; cols: Col[]; headline: Col; insight: (p: NflPlayerSeason) => string }> = {
  passing: {
    label: "Passing", sort: "passingYards", market: "Pass Yds", headline: { key: "passingYards", label: "PASS YDS", fmt: int },
    cols: [
      { key: "completions", label: "C/A", fmt: (_, p) => `${int(p.s.completions)}/${int(p.s.passingAttempts)}` },
      { key: "passingYards", label: "YDS", fmt: int }, { key: "passingTouchdowns", label: "TD", fmt: int }, { key: "interceptions", label: "INT", fmt: int },
      { key: "QBRating", label: "RTG", fmt: n1 }, { key: "passingYardsPerGame", label: "YPG", fmt: n1 },
    ],
    insight: (p) => `${n1(p.s.yardsPerPassAttempt)} Y/A · ${int(p.s.passingTouchdowns)}:${int(p.s.interceptions)} TD:INT · ${n1(p.s.completionPct)}% completions`,
  },
  rushing: {
    label: "Rushing", sort: "rushingYards", market: "Rush Yds", headline: { key: "rushingYards", label: "RUSH YDS", fmt: int },
    cols: [
      { key: "rushingAttempts", label: "ATT", fmt: int }, { key: "rushingYards", label: "YDS", fmt: int }, { key: "yardsPerRushAttempt", label: "AVG", fmt: n1 },
      { key: "rushingTouchdowns", label: "TD", fmt: int }, { key: "rushingYardsPerGame", label: "YPG", fmt: n1 },
    ],
    insight: (p) => `${n1(p.s.yardsPerRushAttempt)} yards per carry · ${n1(p.s.rushingYardsPerGame)} YPG · ${int(p.s.rushingTouchdowns)} TD`,
  },
  receiving: {
    label: "Receiving", sort: "receivingYards", market: "Rec Yds", headline: { key: "receivingYards", label: "REC YDS", fmt: int },
    cols: [
      { key: "receptions", label: "REC", fmt: int }, { key: "receivingTargets", label: "TGT", fmt: int }, { key: "receivingYards", label: "YDS", fmt: int },
      { key: "yardsPerReception", label: "AVG", fmt: n1 }, { key: "receivingTouchdowns", label: "TD", fmt: int }, { key: "receivingYardsPerGame", label: "YPG", fmt: n1 },
    ],
    insight: (p) => `${p.s.receivingTargets ? Math.round((p.s.receptions / p.s.receivingTargets) * 100) : 0}% catch rate · ${n1(p.s.yardsPerReception)} Y/R · ${n1(p.s.receivingYardsPerGame)} YPG`,
  },
  defense: {
    label: "Defense", sort: "sacks", market: null, headline: { key: "sacks", label: "SACKS", fmt: n1 },
    cols: [
      { key: "sacks", label: "SACK", fmt: n1 }, { key: "tacklesForLoss", label: "TFL", fmt: int }, { key: "totalTackles", label: "TKL", fmt: int }, { key: "passesDefended", label: "PD", fmt: int },
    ],
    insight: (p) => `${int(p.s.tacklesForLoss)} TFL · ${int(p.s.totalTackles)} tackles · ${int(p.s.passesDefended)} passes defended`,
  },
};

function MatchupChip({ play }: { play?: NflPropPlay }) {
  if (!play) return <Chip color="#94a3b8">No game this week</Chip>;
  const c = play.factor >= 1.03 ? "#34d399" : play.factor <= 0.97 ? "#f87171" : "#94a3b8";
  return <Chip color={c}>{play.home ? "vs" : "@"} {play.opp} · {play.factor >= 1.03 ? "Soft spot" : play.factor <= 0.97 ? "Tough spot" : "Neutral"} ×{play.factor.toFixed(2)}</Chip>;
}

export function NflPlayers({ boards, props }: { boards: Record<Cat, NflPlayerSeason[]>; props: NflPropPlay[] }) {
  const [cat, setCat] = useState<Cat>("passing");
  const def = CATS[cat];
  const list = boards[cat];
  const playFor = useMemo(() => {
    const m = new Map<string, NflPropPlay>();
    if (def.market) props.filter((p) => p.market === def.market).forEach((p) => m.set(p.espnId, p));
    return m;
  }, [props, def.market]);

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-xl mx-auto page-pad py-5 sm:py-6">
        <SportHeader eyebrow="NFL · Player analysis" title="Players to Know" subtitle="Season leaders in every phase — with this week's matchup grade for each star, built from the opposing defense, the game total and the spread." accent={ACCENT} />

        <div className="mb-5">
          <Segmented id="nfl-cat" accent={ACCENT} value={cat} onChange={setCat} options={(Object.keys(CATS) as Cat[]).map((k) => ({ key: k, label: CATS[k].label }))} />
        </div>

        <div key={cat}>
          {/* Top 3 */}
          <div className="grid gap-3.5 md:grid-cols-3 mb-5 stagger">
            {list.slice(0, 3).map((p, i) => {
              const hex = nflTeamHex(p.team);
              const play = playFor.get(p.espnId);
              return (
                <div key={p.espnId} className="relative overflow-hidden rounded-[22px] p-4" style={{ background: `linear-gradient(140deg, ${alpha(hex, "30")}, var(--panel) 70%)`, border: `1px solid ${alpha(hex, "55")}` }}>
                  <span className="absolute top-3 right-4 font-spot-mono font-black text-[34px] leading-none" style={{ color: "rgba(255,255,255,.07)" }}>#{i + 1}</span>
                  <div className="flex items-center gap-3.5">
                    <div className="relative shrink-0">
                      <WnbaHeadshot hex={hex} src={nflHeadshotUrl(p.espnId)} name={p.name} size={92} radius={22} />
                      <div className="absolute -bottom-1.5 -right-1.5"><LogoPlate hex={hex} src={nflLogoUrl(p.team)} code={p.team} size={30} radius={9} variant="clean" /></div>
                    </div>
                    <div className="min-w-0">
                      <p className="font-spot-sans font-black text-[17px] leading-tight truncate" style={{ color: "var(--text)" }}>{p.name}</p>
                      <p className="font-spot-sans font-semibold text-[11px]" style={{ color: "var(--text-3)" }}>{p.pos} · {p.team} · {p.gp} GP</p>
                      <p className="mt-1.5 font-spot-mono font-black text-[26px] leading-none" style={{ color: "var(--text)" }}>{def.headline.fmt!(p.s[def.headline.key], p)}</p>
                      <p className="font-spot-sans font-extrabold text-[9px] tracking-[.12em]" style={{ color: hex }}>{def.headline.label}</p>
                    </div>
                  </div>
                  <p className="mt-3 font-spot-sans text-[12px] leading-snug" style={{ color: "var(--text-muted)" }}>{def.insight(p)}</p>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <MatchupChip play={play} />
                    {play && <span className="font-spot-mono font-bold text-[10.5px]" style={{ color: "var(--text-3)" }}>proj {play.proj} · <span style={{ color: gradeColor(play.grade) }}>{play.grade}</span></span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leaderboard */}
          <Panel className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left">
                <thead>
                  <tr className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.1em]" style={{ color: "var(--text-faint)", borderBottom: "1px solid var(--hairline)" }}>
                    <th className="pl-4 pr-1 py-2.5 w-8">#</th><th className="px-2 py-2.5">Player</th>
                    {def.cols.map((c) => <th key={c.key + c.label} className="px-2 py-2.5 text-right">{c.label}</th>)}
                    {def.market && <th className="px-4 py-2.5 text-right">This week</th>}
                  </tr>
                </thead>
                <tbody>
                  {list.map((p, i) => {
                    const play = playFor.get(p.espnId);
                    return (
                      <motion.tr key={p.espnId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 15) * 0.02 }} style={{ borderTop: i ? "1px solid var(--hairline)" : undefined }}>
                        <td className="pl-4 pr-1 py-2 font-spot-mono font-black text-[11px]" style={{ color: i < 3 ? "#c4b5fd" : "var(--text-faint)" }}>{i + 1}</td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2.5">
                            <WnbaHeadshot hex={nflTeamHex(p.team)} src={nflHeadshotUrl(p.espnId)} name={p.name} size={38} radius={11} />
                            <div className="min-w-0">
                              <p className="font-spot-sans font-extrabold text-[12.5px] whitespace-nowrap" style={{ color: "var(--text)" }}>{p.name}</p>
                              <p className="font-spot-sans text-[9.5px]" style={{ color: "var(--text-faint)" }}>{p.pos} · {p.team}</p>
                            </div>
                          </div>
                        </td>
                        {def.cols.map((c, ci) => (
                          <td key={c.key + c.label} className="px-2 py-2 text-right font-spot-mono text-[11.5px]" style={{ color: ci === 1 || def.cols.length < 5 && ci === 0 ? "var(--text)" : "var(--text-3)", fontWeight: ci === 1 ? 800 : 500 }}>
                            {(c.fmt ?? int)(p.s[c.key], p)}
                          </td>
                        ))}
                        {def.market && (
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            {play ? <span className="font-spot-mono font-bold text-[10.5px]" style={{ color: play.factor >= 1.03 ? "var(--green)" : play.factor <= 0.97 ? "var(--red-soft)" : "var(--text-muted)" }}>{play.home ? "vs" : "@"} {play.opp} · {play.proj}</span> : <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>bye / done</span>}
                          </td>
                        )}
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
