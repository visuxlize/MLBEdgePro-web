"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LogoPlate, gradeColor } from "@/components/web-tool/spotlight";
import { Chip, EmptyState, LiveBadge, Panel, ProbSplit, SportHeader } from "@/components/web-tool/sport-ui";
import { nflLogoUrl, nflTeamHex, nflTeamName } from "@/lib/nfl/teams";
import type { NflSeasonGame, NflStandingRow } from "@/lib/nfl/types";
import type { NflWeekPayload } from "@/lib/nfl/league";

const ACCENT = "#a78bfa";
const shortName = (abbr: string) => nflTeamName(abbr).split(" ").slice(-1)[0];

interface WeekKey { type: 1 | 2 | 3; week: number }
const keyOf = (k: WeekKey) => `${k.type}-${k.week}`;
const REG_WEEKS = Array.from({ length: 18 }, (_, i) => i + 1);
const PO_LABELS = ["Wild Card", "Divisional", "Conf. Champ", "—", "Super Bowl"];

function placement(r?: NflStandingRow) {
  if (!r) return null;
  return r.seed > 0 && r.seed <= 7 ? `${r.conf} #${r.seed}` : `${r.conf}`;
}

/* ── Game card ───────────────────────────────────────────────────────────── */

function GameCard({ g, st }: { g: NflSeasonGame; st: Map<string, NflStandingRow> }) {
  const live = g.status === "live", final = g.status === "final";
  const awayWon = final && (g.awayScore ?? 0) > (g.homeScore ?? 0);
  const homeWon = final && (g.homeScore ?? 0) > (g.awayScore ?? 0);
  const homeSpread = g.odds?.homeSpread;
  const spreadTxt = homeSpread == null ? null : `${homeSpread <= 0 ? g.home : g.away} -${Math.abs(homeSpread)}`;
  const fav = g.homeWinProb >= 50 ? g.home : g.away;
  const gc = gradeColor(g.grade);

  return (
    <Link href={`/nfl/game/${g.id}`} className="press block rounded-[20px] p-4 relative overflow-hidden"
      style={{ background: "var(--panel)", border: `1px solid ${live ? "rgba(239,68,68,.35)" : "var(--hairline)"}`, animation: live ? "live-glow 2.6s ease-in-out infinite" : undefined }}>
      <div className="flex items-center justify-between gap-2 mb-3">
        {live ? <LiveBadge label={g.statusDetail} /> : (
          <span className="font-spot-mono font-extrabold text-[10px] tracking-[.06em]" style={{ color: final ? "var(--text-muted)" : "#c4b5fd" }}>
            {final ? "FINAL" : `${g.timeLabel} ET`}
          </span>
        )}
        <span className="font-spot-sans font-bold text-[9.5px] truncate" style={{ color: "var(--text-faint)" }}>{g.broadcast ?? ""}</span>
      </div>

      {([["away", g.away, g.awayScore, g.awayRecord, awayWon], ["home", g.home, g.homeScore, g.homeRecord, homeWon]] as const).map(([side, abbr, score, rec, won]) => {
        const p = placement(st.get(abbr));
        return (
          <div key={side} className="flex items-center gap-3 py-1.5">
            <LogoPlate hex={nflTeamHex(abbr)} src={nflLogoUrl(abbr)} code={abbr} size={44} radius={14} variant="clean" />
            <div className="flex-1 min-w-0">
              <p className="font-spot-sans font-black text-[15px] leading-tight truncate" style={{ color: final && !won ? "var(--text-muted)" : "var(--text)" }}>{shortName(abbr)}</p>
              <p className="font-spot-mono text-[10px] flex items-center gap-1.5" style={{ color: "var(--text-faint)" }}>
                {rec ?? ""}{p && <span style={{ color: "#c4b5fd" }}>· {p}</span>}
              </p>
            </div>
            {g.status === "pre" ? (
              <span className="font-spot-mono font-extrabold text-[13px]" style={{ color: "var(--text-3)" }}>{side === "home" ? g.homeWinProb : 100 - g.homeWinProb}%</span>
            ) : (
              <span className="font-spot-mono font-black text-[28px] leading-none" style={{ color: final && !won ? "var(--text-dim)" : "var(--text)" }}>{score}</span>
            )}
          </div>
        );
      })}

      {g.status !== "final" && (
        <div className="mt-3"><ProbSplit awayLabel={g.away} homeLabel={g.home} homePct={g.homeWinProb} awayHex={nflTeamHex(g.away)} homeHex={nflTeamHex(g.home)} /></div>
      )}

      {final && g.leaders.length > 0 && (
        <div className="mt-3 pt-3 flex flex-col gap-1.5" style={{ borderTop: "1px solid var(--hairline)" }}>
          {g.leaders.map((l) => (
            <div key={l.category} className="flex items-center gap-2 text-[11px]">
              <span className="font-spot-sans font-extrabold text-[8.5px] uppercase tracking-[.1em] w-[52px] shrink-0" style={{ color: nflTeamHex(l.team) }}>{l.category}</span>
              <span className="font-spot-sans font-bold truncate" style={{ color: "var(--text-2)" }}>{l.player}</span>
              <span className="font-spot-mono ml-auto shrink-0 text-[10px]" style={{ color: "var(--text-muted)" }}>{l.line}</span>
            </div>
          ))}
        </div>
      )}

      {!final && (
        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
          <span className="font-spot-mono font-bold text-[10px]" style={{ color: "var(--text-muted)" }}>
            {spreadTxt ? `${spreadTxt}${g.odds?.overUnder ? `  ·  O/U ${g.odds.overUnder}` : ""}` : "Lines pending"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-spot-sans font-black text-[10.5px]" style={{ color: "var(--purple-soft)", background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>
            ◆ {fav} ML <span style={{ color: gc }}>{g.grade}</span>
          </span>
        </div>
      )}
    </Link>
  );
}

/* ── Playoff picture ─────────────────────────────────────────────────────── */

function PlayoffPicture({ standings }: { standings: NflStandingRow[] }) {
  const [conf, setConf] = useState<"AFC" | "NFC">("AFC");
  const rows = standings.filter((r) => r.conf === conf).sort((a, b) => (a.seed || 99) - (b.seed || 99)).slice(0, 7);
  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="spot-label" style={{ color: "var(--text-faint)" }}>Playoff Picture</p>
        <div className="flex gap-1 rounded-lg p-0.5" style={{ background: "rgba(255,255,255,.05)" }}>
          {(["AFC", "NFC"] as const).map((c) => (
            <button key={c} onClick={() => setConf(c)} className="px-2.5 py-1 rounded-md font-spot-sans font-extrabold text-[10px] press"
              style={conf === c ? { background: ACCENT, color: "#06070d" } : { color: "var(--text-muted)" }}>{c}</button>
          ))}
        </div>
      </div>
      {rows.map((r, i) => (
        <motion.div key={`${conf}-${r.abbr}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
          className="flex items-center gap-2.5 py-2" style={{ borderTop: i ? "1px solid var(--hairline)" : undefined }}>
          <span className="font-spot-mono font-black text-[11px] w-4 text-center" style={{ color: i === 0 ? "#fbbf24" : "#c4b5fd" }}>{r.seed || i + 1}</span>
          <LogoPlate hex={nflTeamHex(r.abbr)} src={nflLogoUrl(r.abbr)} code={r.abbr} size={26} radius={8} variant="clean" />
          <span className="flex-1 font-spot-sans font-extrabold text-[12.5px] truncate" style={{ color: "var(--text)" }}>{shortName(r.abbr)}</span>
          <span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-2)" }}>{r.wins}-{r.losses}{r.ties ? `-${r.ties}` : ""}</span>
          <span className="font-spot-mono font-bold text-[10px] w-7 text-right" style={{ color: r.streak.startsWith("W") ? "var(--green)" : "var(--red-soft)" }}>{r.streak}</span>
        </motion.div>
      ))}
      <Link href="/nfl/standings" className="press mt-2 flex items-center justify-center rounded-xl py-2 font-spot-sans font-extrabold text-[11px]"
        style={{ color: ACCENT, background: "rgba(167,139,250,.08)", border: "1px solid rgba(167,139,250,.24)" }}>Full standings & power rankings →</Link>
    </Panel>
  );
}

/* ── Week summary ────────────────────────────────────────────────────────── */

function WeekSummary({ games }: { games: NflSeasonGame[] }) {
  const finals = games.filter((g) => g.status === "final");
  if (finals.length === 0) return null;
  const pts = finals.reduce((a, g) => a + (g.awayScore ?? 0) + (g.homeScore ?? 0), 0);
  const hi = [...finals].sort((a, b) => (b.awayScore ?? 0) + (b.homeScore ?? 0) - ((a.awayScore ?? 0) + (a.homeScore ?? 0)))[0];
  const blow = [...finals].sort((a, b) => Math.abs((b.awayScore ?? 0) - (b.homeScore ?? 0)) - Math.abs((a.awayScore ?? 0) - (a.homeScore ?? 0)))[0];
  const close = finals.filter((g) => Math.abs((g.awayScore ?? 0) - (g.homeScore ?? 0)) <= 7).length;
  const stats = [
    { l: "Games final", v: `${finals.length}/${games.length}` },
    { l: "Avg total", v: (pts / finals.length).toFixed(1) },
    { l: "One-score games", v: String(close) },
    { l: "Highest scoring", v: `${hi.away} @ ${hi.home}`, s: `${(hi.awayScore ?? 0) + (hi.homeScore ?? 0)} pts` },
    { l: "Biggest margin", v: `${blow.away} @ ${blow.home}`, s: `${Math.abs((blow.awayScore ?? 0) - (blow.homeScore ?? 0))} pts` },
  ];
  return (
    <div className="snap-row -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5 mb-5">
      {stats.map((s) => (
        <div key={s.l} className="rounded-2xl px-3.5 py-3 min-w-[132px] sm:min-w-0" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
          <p className="font-spot-sans font-extrabold text-[8.5px] uppercase tracking-[.12em]" style={{ color: "var(--text-faint)" }}>{s.l}</p>
          <p className="font-spot-mono font-black text-[16px] mt-0.5" style={{ color: "var(--text)" }}>{s.v}</p>
          {s.s && <p className="font-spot-mono text-[10px]" style={{ color: "var(--text-muted)" }}>{s.s}</p>}
        </div>
      ))}
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */

export function NflHub({
  initial, current, standings,
}: { initial: NflWeekPayload; current: WeekKey; standings: NflStandingRow[] }) {
  const [sel, setSel] = useState<WeekKey>({ type: initial.seasonType, week: initial.weekNum });
  const [data, setData] = useState<NflWeekPayload>(initial);
  const [loading, setLoading] = useState(false);
  const cache = useRef<Map<string, NflWeekPayload>>(new Map([[keyOf({ type: initial.seasonType, week: initial.weekNum }), initial]]));
  const scroller = useRef<HTMLDivElement>(null);
  const st = useMemo(() => new Map(standings.map((r) => [r.abbr, r])), [standings]);

  useEffect(() => {
    const el = scroller.current?.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [sel]);

  useEffect(() => {
    const k = keyOf(sel);
    const hit = cache.current.get(k);
    if (hit) { setData(hit); return; }
    let alive = true;
    setLoading(true);
    fetch(`/api/nfl/week?type=${sel.type}&week=${sel.week}`)
      .then((r) => r.json())
      .then((d: NflWeekPayload) => { if (alive) { cache.current.set(k, d); setData(d); } })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [sel]);

  // Live refresh on the current week
  useEffect(() => {
    if (!data.games.some((g) => g.status === "live")) return;
    const iv = setInterval(() => {
      fetch(`/api/nfl/week?type=${sel.type}&week=${sel.week}`).then((r) => r.json()).then((d: NflWeekPayload) => { cache.current.set(keyOf(sel), d); setData(d); }).catch(() => {});
    }, 30_000);
    return () => clearInterval(iv);
  }, [data, sel]);

  const days = useMemo(() => {
    const m = new Map<string, NflSeasonGame[]>();
    for (const g of data.games) m.set(g.dateLabel, [...(m.get(g.dateLabel) ?? []), g]);
    return [...m.entries()];
  }, [data.games]);

  const chipState = (w: number) => (w < current.week ? "past" : w === current.week ? "now" : "future");
  const live = data.games.filter((g) => g.status === "live").length;

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-2xl mx-auto page-pad py-5 sm:py-6">
        <SportHeader
          eyebrow="NFL · 2026 season"
          title="Every game. Every week."
          subtitle="Scores, standings placement, closing lines and the model's read — from Week 1 through the Super Bowl."
          accent={ACCENT}
          right={live > 0 ? <LiveBadge label={`${live} LIVE`} /> : undefined}
        />

        {/* Week scroller */}
        <div ref={scroller} className="snap-row -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 mb-4">
          {REG_WEEKS.map((w) => {
            const active = sel.type === 2 && sel.week === w;
            const s = chipState(w);
            return (
              <button key={w} data-active={active} onClick={() => setSel({ type: 2, week: w })}
                className="press relative flex flex-col items-center justify-center rounded-2xl w-[56px] py-2.5"
                style={active ? { background: ACCENT, color: "#06070d", boxShadow: "0 8px 24px rgba(167,139,250,.35)" } : { background: "var(--panel)", border: "1px solid var(--hairline)", color: "var(--text-muted)" }}>
                <span className="font-spot-sans font-extrabold text-[8.5px] uppercase tracking-[.12em]">Wk</span>
                <span className="font-spot-mono font-black text-[18px] leading-tight">{w}</span>
                <span className="mt-0.5 h-[5px] flex items-center">
                  {s === "now" ? <span className="spot-live-dot inline-block rounded-full" style={{ width: 5, height: 5, background: active ? "#06070d" : "#34d399" }} />
                    : s === "past" ? <span className="text-[8px] font-black" style={{ color: active ? "#06070d" : "var(--text-faint)" }}>✓</span> : null}
                </span>
              </button>
            );
          })}
          <button data-active={sel.type === 3} onClick={() => setSel({ type: 3, week: 1 })}
            className="press flex flex-col items-center justify-center rounded-2xl w-[64px] py-2.5"
            style={sel.type === 3 ? { background: "#fbbf24", color: "#06070d" } : { background: "var(--panel)", border: "1px solid var(--hairline)", color: "var(--text-muted)" }}>
            <span className="font-spot-sans font-extrabold text-[8.5px] uppercase tracking-[.12em]">Post</span>
            <span className="font-spot-sans font-black text-[13px] leading-tight mt-1">Season</span>
          </button>
        </div>

        {sel.type === 3 && (
          <div className="snap-row mb-4">
            {[1, 2, 3, 5].map((w) => (
              <button key={w} onClick={() => setSel({ type: 3, week: w })} className="press rounded-full px-3.5 py-1.5 font-spot-sans font-extrabold text-[11px]"
                style={sel.week === w ? { background: "#fbbf24", color: "#06070d" } : { color: "var(--text-muted)", border: "1px solid var(--hairline)" }}>{PO_LABELS[w - 1]}</button>
            ))}
          </div>
        )}

        <div className="grid gap-4 lg:gap-5 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-3 flex-wrap">
              <h2 className="font-spot-sans font-black text-xl" style={{ color: "var(--text)" }}>{data.label}</h2>
              {sel.type === 2 && sel.week === current.week && <Chip color="#34d399">Current week</Chip>}
              {data.bye.length > 0 && (
                <span className="font-spot-sans text-[11px]" style={{ color: "var(--text-faint)" }}>Bye: {data.bye.join(", ")}</span>
              )}
            </div>
            <WeekSummary games={data.games} />

            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-[200px]" />)}</div>
            ) : data.games.length === 0 ? (
              <EmptyState title="No games for this week yet" body="Playoff matchups appear once the field is set." />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={keyOf(sel)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="flex flex-col gap-6">
                  {days.map(([day, list]) => (
                    <section key={day}>
                      <p className="spot-label mb-2.5" style={{ color: "var(--text-faint)" }}>{day}</p>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 stagger">
                        {list.map((g) => <GameCard key={g.id} g={g} st={st} />)}
                      </div>
                    </section>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
            <PlayoffPicture standings={standings} />
            <Link href="/nfl/players" className="press group rounded-[20px] p-4 flex items-center gap-3" style={{ background: "linear-gradient(135deg,rgba(167,139,250,.16),var(--panel) 70%)", border: "1px solid rgba(167,139,250,.3)" }}>
              <div className="flex-1 min-w-0">
                <p className="spot-label" style={{ color: "#c4b5fd" }}>Player analysis</p>
                <p className="mt-1 font-spot-sans font-black text-[15px]" style={{ color: "var(--text)" }}>Passing, rushing & receiving leaders</p>
                <p className="mt-0.5 font-spot-sans text-[11px]" style={{ color: "var(--text-muted)" }}>With this week&rsquo;s matchup grade for each star.</p>
              </div>
              <span className="font-spot-sans font-black text-lg transition-transform group-hover:translate-x-1" style={{ color: ACCENT }}>→</span>
            </Link>
          </aside>
        </div>

        <p className="mt-8 font-spot-sans text-[10px] max-w-2xl" style={{ color: "var(--text-faint)" }}>
          Lines from DraftKings via ESPN. Win probabilities and grades are model estimates built from points-for/against — entertainment only.
        </p>
      </div>
    </div>
  );
}
