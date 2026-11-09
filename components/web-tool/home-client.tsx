"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, ListOrdered, Target, Trophy, Users, LayoutGrid, LineChart } from "lucide-react";
import { LogoPlate, gradeColor } from "@/components/web-tool/spotlight";
import { SavedSlipsPanel } from "@/components/web-tool/saved-slips-panel";
import { Chip, EmptyState, Panel, Segmented, useCountUp } from "@/components/web-tool/sport-ui";
import { daysUntil, getSeasonInfo } from "@/lib/season";
import { nbaLogoUrl, nbaShortName, nbaTeamHex } from "@/lib/nba/teams";
import { nflLogoUrl, nflTeamHex, nflTeamName } from "@/lib/nfl/teams";
import { LEAGUE_MAP } from "@/lib/soccer/leagues";
import type { NbaGame, NbaStandingRow } from "@/lib/nba/types";
import type { NflSeasonGame } from "@/lib/nfl/types";
import type { SoccerMatch } from "@/lib/soccer/types";

type Tab = "nba" | "nfl" | "soccer";
const BLUE = "#1a73ff";

interface LineRow {
  key: string;
  href: string;
  status: "pre" | "live" | "final";
  when: string;
  tag?: string;
  away: { code: string; name: string; logo: ReactNodeLike; score?: number };
  home: { code: string; name: string; logo: ReactNodeLike; score?: number };
  spread?: string;
  total?: string;
  ml?: [string, string, string?];
  pick: string;
  grade?: string;
  prob?: number;
  split?: [number, number, number?];
  hexes: [string, string];
}
type ReactNodeLike = React.ReactNode;

const fmtSpread = (home: string, away: string, s: number | null | undefined) => (s == null ? undefined : `${s <= 0 ? home : away} ${s === 0 ? "PK" : `-${Math.abs(s)}`}`);

function Crest({ src, code }: { src: string; code: string }) {
  const [bad, setBad] = useState(false);
  if (bad) return <span className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black bg-[var(--wash-2)]" style={{ color: "var(--text-3)" }}>{code.slice(0, 3)}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={code} width={36} height={36} className="w-9 h-9 object-contain" onError={() => setBad(true)} />;
}

function LineCard({ r, i }: { r: LineRow; i: number }) {
  const live = r.status === "live", final = r.status === "final";
  const gc = r.grade ? gradeColor(r.grade) : "var(--text-3)";
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.03 }}>
      <Link href={r.href} className="press block rounded-[20px] px-4 py-3.5 sm:px-5" style={{ background: "var(--panel)", boxShadow: live ? "inset 0 0 0 1.5px rgba(239,59,74,.4), var(--shadow-card)" : "var(--shadow-card)" }}>
        <div className="grid gap-x-4 gap-y-3 md:grid-cols-[88px_minmax(0,1.5fr)_minmax(0,2fr)_150px] md:items-center">
          {/* when */}
          <div className="flex md:flex-col items-center md:items-start gap-2 md:gap-1">
            {live ? <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] text-[10px] font-extrabold" style={{ color: "var(--red-soft)", background: "var(--red-bg)" }}><span className="spot-live-dot inline-block rounded-full" style={{ width: 5, height: 5, background: "var(--red)" }} />{r.when}</span>
              : <span className="font-spot-mono text-[11px] font-extrabold" style={{ color: final ? "var(--text-muted)" : "var(--blue)" }}>{final ? "FINAL" : r.when}</span>}
            {r.tag && <span className="text-[10px] font-bold" style={{ color: "var(--text-faint)" }}>{r.tag}</span>}
          </div>

          {/* teams */}
          <div className="flex flex-col gap-1.5 min-w-0">
            {([r.away, r.home] as const).map((t, k) => (
              <div key={t.code + k} className="flex items-center gap-2.5 min-w-0">
                {t.logo}
                <span className="flex-1 min-w-0 truncate font-spot-sans font-extrabold text-[14.5px]" style={{ color: "var(--text)" }}>{t.name}{k === 1 && <span className="font-semibold text-[10px] ml-1.5" style={{ color: "var(--text-faint)" }}>HOME</span>}</span>
                {r.status !== "pre" && <span className="font-spot-mono font-black text-[18px]" style={{ color: "var(--text)" }}>{t.score ?? "–"}</span>}
              </div>
            ))}
          </div>

          {/* lines */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { l: "Spread", v: r.spread ?? "—" },
              { l: "Total", v: r.total ?? "—" },
              { l: "Money", v: r.ml ? (r.ml[2] ? `${r.ml[0]} / ${r.ml[2]} / ${r.ml[1]}` : `${r.ml[0]} / ${r.ml[1]}`) : "—" },
            ].map((c) => (
              <div key={c.l} className="rounded-xl px-2 py-2 text-center" style={{ background: "var(--wash-1)" }}>
                <p className="font-spot-sans font-extrabold text-[8.5px] uppercase tracking-[.12em]" style={{ color: "var(--text-faint)" }}>{c.l}</p>
                <p className="mt-0.5 font-spot-mono font-extrabold text-[11px] sm:text-[12px] leading-tight break-words" style={{ color: "var(--text)" }}>{c.v}</p>
              </div>
            ))}
          </div>

          {/* model */}
          <div className="flex md:flex-col items-center md:items-stretch justify-between gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5" style={{ background: "var(--purple-tint)" }}>
              <span className="font-spot-sans font-black text-[11.5px]" style={{ color: "var(--purple-soft)" }}>◆ {r.pick}</span>
              {r.grade && <span className="font-spot-sans font-black text-[11.5px]" style={{ color: gc }}>{r.grade}</span>}
            </div>
            {r.split && (
              <div className="flex h-1.5 rounded-full overflow-hidden w-24 md:w-full" style={{ background: "var(--wash-3)" }}>
                <div style={{ width: `${r.split[0]}%`, background: r.hexes[0] }} />
                {r.split[2] != null && <div style={{ width: `${r.split[2]}%`, background: "#c9ccd3" }} />}
                <div style={{ flex: 1, background: r.hexes[1] }} />
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

interface Props {
  userName: string;
  todayDate: string;
  nba: { games: NbaGame[]; standings: NbaStandingRow[] };
  nfl: { weekLabel: string; weekNum: number; games: NflSeasonGame[] };
  soccer: SoccerMatch[];
}

export function HomeClient({ userName, todayDate, nba, nfl, soccer }: Props) {
  const [tab, setTab] = useState<Tab>("nba");
  const mlb = getSeasonInfo("mlb"), wnba = getSeasonInfo("wnba");

  const rows = useMemo<Record<Tab, LineRow[]>>(() => {
    const order = (s: string) => (s === "live" ? 0 : s === "pre" ? 1 : 2);
    const nbaRows: LineRow[] = [...nba.games].sort((a, b) => order(a.status) - order(b.status) || a.date.localeCompare(b.date)).map((g) => ({
      key: g.id, href: `/nba/game/${g.id}`, status: g.status, when: g.status === "live" ? g.statusDetail : `${g.timeLabel} ET`, tag: g.isCup ? "NBA Cup" : g.broadcast,
      away: { code: g.away, name: nbaShortName(g.away), logo: <Crest src={nbaLogoUrl(g.away)} code={g.away} />, score: g.awayScore },
      home: { code: g.home, name: nbaShortName(g.home), logo: <Crest src={nbaLogoUrl(g.home)} code={g.home} />, score: g.homeScore },
      spread: fmtSpread(g.home, g.away, g.odds?.homeSpread), total: g.odds?.overUnder ? `O/U ${g.odds.overUnder}` : undefined,
      ml: g.odds?.awayML || g.odds?.homeML ? [g.odds?.awayML ?? "—", g.odds?.homeML ?? "—"] : undefined,
      pick: `${g.homeWinProb >= 50 ? g.home : g.away} ML`, grade: g.grade, split: [100 - g.homeWinProb, g.homeWinProb], hexes: [nbaTeamHex(g.away), nbaTeamHex(g.home)],
    }));
    const nflRows: LineRow[] = [...nfl.games].sort((a, b) => order(a.status) - order(b.status) || a.date.localeCompare(b.date)).map((g) => ({
      key: g.id, href: `/nfl/game/${g.id}`, status: g.status, when: g.status === "live" ? g.statusDetail : `${g.dateLabel.split(", ")[0].slice(0, 3)} ${g.timeLabel}`, tag: g.broadcast,
      away: { code: g.away, name: nflTeamName(g.away).split(" ").slice(-1)[0], logo: <Crest src={nflLogoUrl(g.away)} code={g.away} />, score: g.awayScore },
      home: { code: g.home, name: nflTeamName(g.home).split(" ").slice(-1)[0], logo: <Crest src={nflLogoUrl(g.home)} code={g.home} />, score: g.homeScore },
      spread: fmtSpread(g.home, g.away, g.odds?.homeSpread), total: g.odds?.overUnder ? `O/U ${g.odds.overUnder}` : undefined,
      ml: g.odds?.awayML || g.odds?.homeML ? [g.odds?.awayML ?? "—", g.odds?.homeML ?? "—"] : undefined,
      pick: `${g.homeWinProb >= 50 ? g.home : g.away} ML`, grade: g.grade, split: [100 - g.homeWinProb, g.homeWinProb], hexes: [nflTeamHex(g.away), nflTeamHex(g.home)],
    }));
    const socRows: LineRow[] = [...soccer].sort((a, b) => order(a.status) - order(b.status) || a.date.localeCompare(b.date)).map((m) => {
      const mod = m.model;
      const top = mod ? (mod.home >= mod.away && mod.home >= mod.draw ? m.homeTeam.shortName : mod.away >= mod.draw ? m.awayTeam.shortName : "Draw") : "";
      return {
        key: m.id, href: "/soccer", status: m.status, when: m.status === "live" ? m.clock ?? "LIVE" : new Date(m.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }), tag: LEAGUE_MAP[m.league]?.shortLabel,
        away: { code: m.awayTeam.abbr, name: m.awayTeam.shortName, logo: <Crest src={m.awayTeam.logo} code={m.awayTeam.abbr} />, score: m.awayScore },
        home: { code: m.homeTeam.abbr, name: m.homeTeam.shortName, logo: <Crest src={m.homeTeam.logo} code={m.homeTeam.abbr} />, score: m.homeScore },
        total: m.odds?.overUnder ? `O/U ${m.odds.overUnder}` : undefined, spread: undefined,
        ml: m.odds?.homeML ? [m.odds.homeML, m.odds.awayML ?? "—", m.odds.drawML ?? "—"] : undefined,
        pick: top === "Draw" ? "Draw" : `${top} ML`, prob: mod ? Math.max(mod.home, mod.draw, mod.away) : undefined,
        split: mod ? [mod.home, mod.away, mod.draw] : undefined, hexes: [m.homeTeam.hex, m.awayTeam.hex],
      } as LineRow;
    });
    // soccer split order: home / away / draw → LineCard expects [away, home, draw?]; reorder so left bar = away, right = home
    socRows.forEach((r) => { if (r.split) r.split = [r.split[1], r.split[0], r.split[2]]; if (r.hexes) r.hexes = [r.hexes[1], r.hexes[0]]; });
    return { nba: nbaRows, nfl: nflRows, soccer: socRows };
  }, [nba.games, nfl.games, soccer]);

  const counts = { nba: nba.games.length, nfl: nfl.games.length, soccer: soccer.length };
  const live = [
    ...nba.games.filter((g) => g.status === "live").map((g) => ({ key: g.id, sport: "NBA", href: `/nba/game/${g.id}`, label: `${g.away} ${g.awayScore}–${g.homeScore} ${g.home}`, sub: g.statusDetail })),
    ...nfl.games.filter((g) => g.status === "live").map((g) => ({ key: g.id, sport: "NFL", href: `/nfl/game/${g.id}`, label: `${g.away} ${g.awayScore}–${g.homeScore} ${g.home}`, sub: g.statusDetail })),
    ...soccer.filter((m) => m.status === "live").map((m) => ({ key: m.id, sport: "SOC", href: "/soccer", label: `${m.homeTeam.abbr} ${m.homeScore}–${m.awayScore} ${m.awayTeam.abbr}`, sub: m.clock ?? "LIVE" })),
  ];

  const avgGp = nba.standings.length ? nba.standings.reduce((a, r) => a + r.gp, 0) / nba.standings.length : 0;
  const nflPct = useCountUp(Math.round((nfl.weekNum / 18) * 100)), nbaPct = useCountUp(Math.round((avgGp / 82) * 100));

  const TOOLS = [
    { href: "/nba/props", icon: Target, label: "NBA props", sub: "DraftKings lines" },
    { href: "/nfl/props", icon: LineChart, label: "NFL props", sub: "Real lines + movement" },
    { href: "/soccer/props", icon: BarChart3, label: "Soccer props", sub: "Scorer, shots, cards" },
    { href: "/nba/standings", icon: ListOrdered, label: "NBA standings", sub: "Power rankings" },
    { href: "/nfl/standings", icon: LayoutGrid, label: "NFL standings", sub: "Seeding & divisions" },
    { href: "/nba/cup", icon: Trophy, label: "NBA Cup", sub: "Groups & advancing" },
    { href: "/nfl/players", icon: Users, label: "NFL players", sub: "Matchup grades" },
    { href: "/results", icon: BarChart3, label: "Model results", sub: "Graded in public" },
  ];

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-2xl mx-auto page-pad py-5 sm:py-7">
        {/* Welcome */}
        <div className="rise mb-6">
          <p className="spot-label" style={{ color: "var(--blue)" }}>{todayDate}</p>
          <h1 className="font-spot-sans text-[30px] sm:text-5xl font-black leading-[1.05] mt-2" style={{ color: "var(--text)" }}>Welcome back, {userName}</h1>
          <a href="#lines" className="press mt-2 inline-flex items-center gap-2 font-spot-sans text-[18px] sm:text-[22px] font-bold" style={{ color: "var(--blue)" }}>
            Take a look at today&rsquo;s lines <ArrowRight size={20} strokeWidth={2.6} />
          </a>
          <div className="mt-4 flex gap-2 flex-wrap">
            {([["nba", "NBA", counts.nba], ["nfl", "NFL", counts.nfl], ["soccer", "Soccer", counts.soccer]] as const).map(([k, l, n]) => (
              <button key={k} onClick={() => { setTab(k); document.getElementById("lines")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="press rounded-full px-4 py-2 font-spot-sans font-bold text-[13px]" style={{ background: "var(--panel)", boxShadow: "var(--shadow-card)", color: "var(--text)" }}>
                {l} <span style={{ color: "var(--text-faint)" }}>· {n} {k === "nfl" ? "games" : "today"}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
          {/* Lines board */}
          <section id="lines" className="min-w-0 scroll-mt-24">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <div>
                <h2 className="font-spot-sans font-black text-[22px]" style={{ color: "var(--text)" }}>Today&rsquo;s lines</h2>
                <p className="font-spot-sans text-[12px]" style={{ color: "var(--text-muted)" }}>DraftKings spread, total & moneyline next to the model&rsquo;s pick · {tab === "nfl" ? nfl.weekLabel : "today"}</p>
              </div>
              <Segmented id="home-tab" accent={BLUE} value={tab} onChange={setTab} options={[{ key: "nba", label: "NBA", badge: String(counts.nba) }, { key: "nfl", label: "NFL", badge: String(counts.nfl) }, { key: "soccer", label: "Soccer", badge: String(counts.soccer) }]} />
            </div>
            <div className="hidden md:grid grid-cols-[88px_minmax(0,1.5fr)_minmax(0,2fr)_150px] gap-x-4 px-5 mb-1.5 font-spot-sans font-extrabold text-[9.5px] uppercase tracking-[.14em]" style={{ color: "var(--text-faint)" }}>
              <span>Time</span><span>Matchup</span><span>Lines</span><span>Model</span>
            </div>
            {rows[tab].length === 0 ? (
              <EmptyState title="No games on the board" body="Check another sport — the board refreshes through the day." />
            ) : (
              <div key={tab} className="flex flex-col gap-2.5">{rows[tab].map((r, i) => <LineCard key={r.key} r={r} i={i} />)}</div>
            )}
            <p className="mt-4 font-spot-sans text-[10.5px]" style={{ color: "var(--text-faint)" }}>Lines: DraftKings via ESPN. Picks and grades are model estimates for entertainment only.{tab === "soccer" ? " Soccer money line shows Home / Away / Draw." : ""}</p>
          </section>

          {/* Sidebar */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
            <Panel className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="spot-label flex items-center gap-2" style={{ color: "var(--red-soft)" }}><span className="spot-live-dot inline-block rounded-full" style={{ width: 6, height: 6, background: "var(--red)" }} />Live now</p>
                <span className="font-spot-mono text-[11px] font-bold" style={{ color: "var(--text-faint)" }}>{live.length}</span>
              </div>
              {live.length === 0 ? <p className="font-spot-sans text-[12px]" style={{ color: "var(--text-muted)" }}>No games in progress right now.</p> : (
                <div className="flex flex-col max-h-[260px] overflow-y-auto">
                  {live.slice(0, 12).map((g, i) => (
                    <Link key={g.key} href={g.href} className="press flex items-center gap-2.5 py-2" style={{ borderTop: i ? "1px solid var(--hairline)" : undefined }}>
                      <Chip color={g.sport === "NBA" ? "#ea6a0a" : g.sport === "NFL" ? "#6d4fe0" : "#12a150"}>{g.sport}</Chip>
                      <span className="flex-1 font-spot-mono font-extrabold text-[12px]" style={{ color: "var(--text)" }}>{g.label}</span>
                      <span className="font-spot-mono text-[10px] font-bold" style={{ color: "var(--red-soft)" }}>{g.sub}</span>
                    </Link>
                  ))}
                </div>
              )}
            </Panel>

            <Panel className="p-4">
              <p className="spot-label mb-3" style={{ color: "var(--text-faint)" }}>Tools</p>
              <div className="grid grid-cols-2 gap-2">
                {TOOLS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <Link key={t.href} href={t.href} className="press rounded-2xl p-3 flex flex-col gap-2" style={{ background: "var(--wash-1)" }}>
                      <span className="w-8 h-8 rounded-xl bg-white flex items-center justify-center" style={{ color: "var(--blue)", boxShadow: "var(--shadow-card)" }}><Icon size={16} strokeWidth={1.9} /></span>
                      <span><span className="block font-spot-sans font-extrabold text-[12.5px]" style={{ color: "var(--text)" }}>{t.label}</span><span className="block font-spot-sans text-[10.5px]" style={{ color: "var(--text-muted)" }}>{t.sub}</span></span>
                    </Link>
                  );
                })}
              </div>
            </Panel>

            <Panel className="p-4">
              <p className="spot-label mb-4" style={{ color: "var(--text-faint)" }}>Season progress</p>
              {[{ l: "NFL", s: `Week ${nfl.weekNum} of 18`, p: nflPct, c: "#6d4fe0" }, { l: "NBA", s: `~${Math.round(avgGp)} of 82 games`, p: nbaPct, c: "#ea6a0a" }].map((r) => (
                <div key={r.l} className="mb-3.5 last:mb-0">
                  <div className="flex items-baseline justify-between mb-1.5"><span className="font-spot-sans font-extrabold text-[12px]" style={{ color: "var(--text-2)" }}>{r.l}</span><span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-muted)" }}>{r.s} · {r.p}%</span></div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--wash-2)" }}><div className="h-full rounded-full" style={{ width: `${r.p}%`, background: r.c }} /></div>
                </div>
              ))}
              <div className="mt-4 pt-3 flex flex-col gap-1.5" style={{ borderTop: "1px solid var(--hairline)" }}>
                {[{ i: mlb, h: "/games", n: "MLB" }, { i: wnba, h: "/wnba", n: "WNBA" }].map((o) => (
                  <Link key={o.n} href={o.h} className="press flex items-center justify-between font-spot-sans text-[12px]" style={{ color: "var(--text-muted)" }}>
                    <span><b style={{ color: "var(--text-3)" }}>{o.n}</b> · offseason</span><span className="font-spot-mono text-[11px]">{o.i.returns ? `${daysUntil(o.i.returns)}d to return` : ""}</span>
                  </Link>
                ))}
              </div>
            </Panel>
          </aside>
        </div>

        <Link href="/picks" className="press mt-6 flex items-center justify-between gap-3 rounded-[22px] px-4 py-3.5 sm:px-5 sm:py-4"
          style={{ background: "linear-gradient(135deg, rgba(26,115,255,.12), var(--panel) 60%)", border: "1px solid rgba(26,115,255,.28)", boxShadow: "var(--shadow-card)" }}>
          <div className="min-w-0">
            <p className="spot-label" style={{ color: "var(--blue)" }}>New · Picks</p>
            <p className="font-spot-sans font-black text-[15px] sm:text-[17px] mt-0.5" style={{ color: "var(--text)" }}>Today&apos;s best bets, parlays &amp; the research behind them</p>
            <p className="font-spot-sans text-[11.5px] mt-0.5" style={{ color: "var(--text-muted)" }}>Singles, same-game and multi-game parlays across NBA, NFL and Soccer.</p>
          </div>
          <ArrowRight size={18} style={{ color: "var(--blue)" }} className="shrink-0" />
        </Link>

        <div className="mt-6"><SavedSlipsPanel /></div>
      </div>
    </div>
  );
}
