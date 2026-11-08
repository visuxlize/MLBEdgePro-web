"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LogoPlate, gradeColor } from "@/components/web-tool/spotlight";
import { Chip, DateStrip, EmptyState, LiveBadge, Panel, ProbSplit, SportHeader, type StripDay } from "@/components/web-tool/sport-ui";
import { nbaLogoUrl, nbaShortName, nbaTeamHex } from "@/lib/nba/teams";
import type { NbaGame, NbaStandingRow } from "@/lib/nba/types";

const ACCENT = "#fb923c";

function addDays(key: string, n: number): string {
  const d = new Date(`${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function buildDays(todayKey: string): StripDay[] {
  return Array.from({ length: 9 }, (_, i) => {
    const key = addDays(todayKey, i - 3);
    const d = new Date(`${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}T12:00:00Z`);
    return {
      key,
      dow: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      num: String(d.getUTCDate()),
      sub: key === todayKey ? "TODAY" : undefined,
    };
  });
}

function spreadText(g: NbaGame): string | null {
  const s = g.odds?.homeSpread;
  if (s == null) return null;
  const fav = s <= 0 ? g.home : g.away;
  return `${fav} -${Math.abs(s)}`;
}

/* ── Game card ───────────────────────────────────────────────────────────── */

function GameCard({ g }: { g: NbaGame }) {
  const live = g.status === "live";
  const final = g.status === "final";
  const awayWon = final && (g.awayScore ?? 0) > (g.homeScore ?? 0);
  const homeWon = final && (g.homeScore ?? 0) > (g.awayScore ?? 0);
  const fav = g.homeWinProb >= 50 ? g.home : g.away;
  const gc = gradeColor(g.grade);
  const spread = spreadText(g);

  return (
    <Link
      href={`/nba/game/${g.id}`}
      className="press group relative block rounded-[20px] p-4 overflow-hidden"
      style={{
        background: "var(--panel)",
        border: `1px solid ${live ? "rgba(239,68,68,.35)" : "var(--hairline)"}`,
        animation: live ? "live-glow 2.6s ease-in-out infinite" : undefined,
      }}
    >
      {live && <div className="absolute top-0 bottom-0 left-0 w-1/4 pointer-events-none" style={{ background: "linear-gradient(90deg,transparent,rgba(239,68,68,.07),transparent)", animation: "scan 6s linear infinite" }} />}
      <div className="relative flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {live ? <LiveBadge label={g.statusDetail} /> : (
            <span className="font-spot-mono font-extrabold text-[10px] tracking-[.06em]" style={{ color: final ? "var(--text-muted)" : "#fdba74" }}>
              {final ? "FINAL" : g.timeLabel + " ET"}
            </span>
          )}
          {g.isCup && <Chip color="#fbbf24">NBA Cup</Chip>}
        </div>
        {g.broadcast && <span className="font-spot-sans font-bold text-[9.5px] shrink-0" style={{ color: "var(--text-faint)" }}>{g.broadcast}</span>}
      </div>

      {([["away", g.away, g.awayScore, g.awayRecord, awayWon], ["home", g.home, g.homeScore, g.homeRecord, homeWon]] as const).map(([side, abbr, score, rec, won]) => (
        <div key={side} className="relative flex items-center gap-3 py-1.5">
          <LogoPlate hex={nbaTeamHex(abbr)} src={nbaLogoUrl(abbr)} code={abbr} size={42} radius={13} variant="clean" />
          <div className="flex-1 min-w-0">
            <p className="font-spot-sans font-black text-[15px] leading-tight truncate" style={{ color: final && !won ? "var(--text-muted)" : "var(--text)" }}>{nbaShortName(abbr)}</p>
            <p className="font-spot-mono text-[10px]" style={{ color: "var(--text-faint)" }}>{rec ?? ""}{side === "home" ? "  ·  HOME" : ""}</p>
          </div>
          {g.status === "pre" ? (
            <span className="font-spot-mono font-extrabold text-[13px]" style={{ color: "var(--text-3)" }}>{side === "home" ? g.homeWinProb : 100 - g.homeWinProb}%</span>
          ) : (
            <span className="font-spot-mono font-black text-[26px] leading-none" style={{ color: final && !won ? "var(--text-dim)" : "var(--text)" }}>{score}</span>
          )}
        </div>
      ))}

      <div className="relative mt-3">
        <ProbSplit awayLabel={g.away} homeLabel={g.home} homePct={g.homeWinProb} awayHex={nbaTeamHex(g.away)} homeHex={nbaTeamHex(g.home)} />
      </div>

      <div className="relative mt-3 flex items-center justify-between gap-2 flex-wrap">
        <span className="font-spot-mono font-bold text-[10px]" style={{ color: "var(--text-muted)" }}>
          {spread ? `${spread}${g.odds?.overUnder ? `  ·  O/U ${g.odds.overUnder}` : ""}` : "Lines pending"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-spot-sans font-black text-[10.5px]"
          style={{ color: "var(--purple-soft)", background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>
          ◆ {fav} ML <span style={{ color: gc }}>{g.grade}</span>
        </span>
      </div>
    </Link>
  );
}

/* ── Rankings snapshot ───────────────────────────────────────────────────── */

function RankingsPanel({ standings }: { standings: NbaStandingRow[] }) {
  const [conf, setConf] = useState<"East" | "West">("East");
  const rows = standings.filter((r) => r.conf === conf).slice(0, 8);
  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="spot-label" style={{ color: "var(--text-faint)" }}>Conference Rankings</p>
        <div className="flex gap-1 rounded-lg p-0.5" style={{ background: "rgba(255,255,255,.05)" }}>
          {(["East", "West"] as const).map((c) => (
            <button key={c} onClick={() => setConf(c)} className="px-2.5 py-1 rounded-md font-spot-sans font-extrabold text-[10px] press"
              style={conf === c ? { background: ACCENT, color: "#06070d" } : { color: "var(--text-muted)" }}>{c}</button>
          ))}
        </div>
      </div>
      <div className="flex flex-col">
        {rows.map((r, i) => (
          <motion.div key={`${conf}-${r.abbr}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
            className="flex items-center gap-2.5 py-2" style={{ borderTop: i ? "1px solid var(--hairline)" : undefined }}>
            <span className="font-spot-mono font-black text-[11px] w-4 text-center" style={{ color: i < 6 ? "#fdba74" : "var(--text-faint)" }}>{r.rank}</span>
            <LogoPlate hex={nbaTeamHex(r.abbr)} src={nbaLogoUrl(r.abbr)} code={r.abbr} size={26} radius={8} variant="clean" />
            <span className="flex-1 font-spot-sans font-extrabold text-[12.5px] truncate" style={{ color: "var(--text)" }}>{nbaShortName(r.abbr)}</span>
            <span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-2)" }}>{r.wins}-{r.losses}</span>
            <span className="font-spot-mono font-bold text-[10px] w-7 text-right" style={{ color: r.streak.startsWith("W") ? "var(--green)" : "var(--red-soft)" }}>{r.streak}</span>
          </motion.div>
        ))}
      </div>
      <Link href="/nba/standings" className="press mt-2 flex items-center justify-center rounded-xl py-2 font-spot-sans font-extrabold text-[11px]"
        style={{ color: ACCENT, background: "rgba(251,146,60,.08)", border: "1px solid rgba(251,146,60,.22)" }}>
        Full standings & power rankings →
      </Link>
    </Panel>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */

export function NbaToday({
  todayKey, initialGames, standings,
}: { todayKey: string; initialGames: NbaGame[]; standings: NbaStandingRow[] }) {
  const [day, setDay] = useState(todayKey);
  const [games, setGames] = useState<NbaGame[]>(initialGames);
  const [loading, setLoading] = useState(false);
  const cache = useRef<Map<string, NbaGame[]>>(new Map([[todayKey, initialGames]]));
  const days = useMemo(() => buildDays(todayKey), [todayKey]);

  useEffect(() => {
    const hit = cache.current.get(day);
    if (hit) { setGames(hit); return; }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/nba/schedule?date=${day}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((g: NbaGame[]) => { if (!cancelled) { cache.current.set(day, g); setGames(g); } })
      .catch(() => { if (!cancelled) setGames([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [day]);

  // Auto-refresh live scores
  useEffect(() => {
    if (day !== todayKey || !games.some((g) => g.status === "live")) return;
    const iv = setInterval(() => {
      fetch(`/api/nba/schedule?date=${day}`).then((r) => r.json()).then((g: NbaGame[]) => { cache.current.set(day, g); setGames(g); }).catch(() => {});
    }, 30_000);
    return () => clearInterval(iv);
  }, [day, todayKey, games]);

  const live = games.filter((g) => g.status === "live");
  const upcoming = games.filter((g) => g.status === "pre");
  const final = games.filter((g) => g.status === "final");
  const cupCount = games.filter((g) => g.isCup).length;
  const dayLabel = day === todayKey ? "Today" : days.find((d) => d.key === day)?.dow + " " + days.find((d) => d.key === day)?.num;

  const groups: { title: string; list: NbaGame[]; tone?: string }[] = [
    { title: "Live now", list: live, tone: "var(--red-soft)" },
    { title: "Upcoming", list: upcoming },
    { title: "Final", list: final },
  ].filter((s) => s.list.length > 0);

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-2xl mx-auto page-pad py-5 sm:py-6">
        <SportHeader
          eyebrow="NBA · 2026–27 season"
          title={`${dayLabel}'s games`}
          subtitle="Live scores, closing lines, and the model's read on every game."
          accent={ACCENT}
          right={
            <div className="flex items-center gap-2 flex-wrap">
              {live.length > 0 && <LiveBadge label={`${live.length} LIVE`} />}
              {cupCount > 0 && <Chip color="#fbbf24">{cupCount} Cup {cupCount === 1 ? "game" : "games"}</Chip>}
              <Link href="/nba/cup" className="press rounded-xl px-3 py-2 font-spot-sans font-extrabold text-[11px]"
                style={{ color: "#fbbf24", background: "rgba(251,191,36,.1)", border: "1px solid rgba(251,191,36,.28)" }}>Emirates NBA Cup →</Link>
            </div>
          }
        />

        <div className="mb-5"><DateStrip days={days} active={day} onChange={setDay} accent={ACCENT} /></div>

        <div className="grid gap-4 lg:gap-5 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
          <div className="min-w-0">
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((i) => <div key={i} className="skeleton h-[210px]" />)}
              </div>
            ) : games.length === 0 ? (
              <EmptyState title="No games on this date" body="Pick another day on the strip — the NBA schedule runs almost every night." />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={day} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="flex flex-col gap-6">
                  {groups.map((s) => (
                    <section key={s.title}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <p className="spot-label" style={{ color: s.tone ?? "var(--text-faint)" }}>{s.title}</p>
                        <span className="font-spot-mono text-[10px] font-bold" style={{ color: "var(--text-faint)" }}>{s.list.length}</span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 stagger">
                        {s.list.map((g) => <GameCard key={g.id} g={g} />)}
                      </div>
                    </section>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
            <RankingsPanel standings={standings} />
            <Link href="/nba/props" className="press group rounded-[20px] p-4 flex items-center gap-3"
              style={{ background: "linear-gradient(135deg,rgba(251,146,60,.14),var(--panel) 70%)", border: "1px solid rgba(251,146,60,.28)" }}>
              <div className="flex-1 min-w-0">
                <p className="spot-label" style={{ color: "#fdba74" }}>Props analysis</p>
                <p className="mt-1 font-spot-sans font-black text-[15px]" style={{ color: "var(--text)" }}>Matchup-adjusted player projections</p>
                <p className="mt-0.5 font-spot-sans text-[11px]" style={{ color: "var(--text-muted)" }}>Points, rebounds, assists & threes vs tonight&rsquo;s defenses.</p>
              </div>
              <span className="font-spot-sans font-black text-lg transition-transform group-hover:translate-x-1" style={{ color: ACCENT }}>→</span>
            </Link>
          </aside>
        </div>

        <p className="mt-8 font-spot-sans text-[10px] max-w-2xl" style={{ color: "var(--text-faint)" }}>
          Lines from DraftKings via ESPN. Win probabilities and grades are model estimates built from season point differentials — for entertainment only.
        </p>
      </div>
    </div>
  );
}
