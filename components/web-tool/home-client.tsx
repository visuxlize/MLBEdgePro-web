"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { LogoPlate, gradeColor } from "@/components/web-tool/spotlight";
import { SavedSlipsPanel } from "@/components/web-tool/saved-slips-panel";
import { Chip, LiveBadge, Panel, useCountUp } from "@/components/web-tool/sport-ui";
import { daysUntil, getSeasonInfo } from "@/lib/season";
import { nbaLogoUrl, nbaTeamHex } from "@/lib/nba/teams";
import { nflLogoUrl, nflTeamHex } from "@/lib/nfl/teams";
import type { NbaGame, NbaStandingRow } from "@/lib/nba/types";
import type { NflSeasonGame } from "@/lib/nfl/types";
import type { SoccerMatch } from "@/lib/soccer/types";
import { LEAGUE_MAP } from "@/lib/soccer/leagues";

function useSyncedAgo() {
  const [minutes, setMinutes] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setMinutes((m) => m + 1), 60_000);
    return () => clearInterval(iv);
  }, []);
  return minutes === 0 ? "just now" : `${minutes}m ago`;
}

interface Row { key: string; href: string; away: ReactNode; home: ReactNode; awayCode: string; homeCode: string; mid: string; live: boolean; sub?: string }

function SoccerCrest({ src, code }: { src: string; code: string }) {
  const [bad, setBad] = useState(false);
  if (bad) return <span className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-black" style={{ background: "rgba(255,255,255,.08)", color: "var(--text-3)" }}>{code.slice(0, 3)}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={code} width={32} height={32} className="w-8 h-8 object-contain" onError={() => setBad(true)} />;
}

function SportCard({
  accent, soft, title, icon, chip, headline, sub, rows, links, href, extra,
}: {
  accent: string; soft: string; title: string; icon: ReactNode; chip: string; headline: string; sub: string;
  rows: Row[]; links: { href: string; label: string }[]; href: string; extra?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[24px] p-5 flex flex-col" style={{ background: `linear-gradient(145deg, ${accent}24, var(--panel) 62%)`, border: `1px solid ${accent}45`, boxShadow: `0 0 50px ${accent}0f` }}>
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${accent}26, transparent 70%)`, animation: "glow-breathe 5s ease-in-out infinite" }} />
      <div className="relative flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 font-spot-sans font-extrabold text-[11px] uppercase tracking-[.14em]" style={{ color: soft }}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}26`, color: soft }}>{icon}</span>{title}
        </span>
        <span className="rounded-full px-2.5 py-1 font-spot-sans font-extrabold text-[9px] uppercase tracking-[.12em]" style={{ color: soft, background: `${accent}1f`, border: `1px solid ${accent}55` }}>{chip}</span>
      </div>
      <Link href={href} className="relative mt-4 block">
        <p className="font-spot-sans font-black text-[26px] leading-tight" style={{ color: "var(--text)" }}>{headline}</p>
        <p className="mt-1 font-spot-sans text-[12px]" style={{ color: "var(--text-muted)" }}>{sub}</p>
      </Link>

      <div className="relative mt-4 flex flex-col gap-2 flex-1">
        {rows.length === 0 && <p className="font-spot-sans text-xs py-3" style={{ color: "var(--text-muted)" }}>No games on the board right now.</p>}
        {rows.map((r) => (
          <Link key={r.key} href={r.href} className="press flex items-center gap-2.5 rounded-2xl px-3 py-2.5" style={{ background: "rgba(0,0,0,.28)", border: "1px solid var(--hairline)" }}>
            {r.away}
            <span className="flex-1 min-w-0 text-center">
              <span className="block font-spot-sans font-extrabold text-[12px] truncate" style={{ color: "var(--text)" }}>{r.awayCode} <span style={{ color: "var(--text-ghost)" }}>@</span> {r.homeCode}</span>
              {r.sub && <span className="block font-spot-sans text-[9.5px] truncate" style={{ color: "var(--text-faint)" }}>{r.sub}</span>}
            </span>
            {r.home}
            <span className="font-spot-mono font-extrabold text-[11px] w-[58px] text-right shrink-0" style={{ color: r.live ? "var(--red-soft)" : "var(--text-3)" }}>
              {r.live && <span className="spot-live-dot inline-block rounded-full mr-1" style={{ width: 5, height: 5, background: "var(--red)" }} />}{r.mid}
            </span>
          </Link>
        ))}
      </div>

      {extra}
      <div className="relative mt-4 flex gap-2 flex-wrap">
        {links.map((l, i) => (
          <Link key={l.href} href={l.href} className="press rounded-xl px-3 py-2 font-spot-sans font-extrabold text-[11px]"
            style={i === 0 ? { background: accent, color: "#06070d" } : { color: soft, background: `${accent}14`, border: `1px solid ${accent}38` }}>{l.label}</Link>
        ))}
      </div>
    </div>
  );
}

const Ball = ({ s = 14 }: { s?: number }) => (
  <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v17M3.5 12h17M5.2 5.2c2.4 2.2 3.8 4.4 3.8 6.8s-1.4 4.6-3.8 6.8M18.8 5.2c-2.4 2.2-3.8 4.4-3.8 6.8s1.4 4.6 3.8 6.8" /></svg>
);
const Foot = ({ s = 14 }: { s?: number }) => (
  <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.8"><ellipse cx="12" cy="12" rx="9.2" ry="5.6" transform="rotate(-45 12 12)" /><path d="M9.2 14.8l5.6-5.6M10.5 11.7l1.2 1.2M12.3 9.9l1.2 1.2" /></svg>
);
const Soc = ({ s = 14 }: { s?: number }) => (
  <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5l2.5 3.5-2.5 1.5-2.5-1.5L12 3.5zM12 20.5l-2.5-3.5 2.5-1.5 2.5 1.5L12 20.5zM3.5 12l3.5-2.5L8.5 12l-1.5 2.5L3.5 12zM20.5 12l-3.5 2.5L15.5 12l1.5-2.5L20.5 12z" /></svg>
);

interface Props {
  userName: string;
  todayDate: string;
  nba: { games: NbaGame[]; standings: NbaStandingRow[] };
  nfl: { weekLabel: string; weekNum: number; games: NflSeasonGame[] };
  soccer: SoccerMatch[];
}

export function HomeClient({ userName, todayDate, nba, nfl, soccer }: Props) {
  const syncedAgo = useSyncedAgo();
  const mlb = getSeasonInfo("mlb"), wnba = getSeasonInfo("wnba");

  const nbaLive = nba.games.filter((g) => g.status === "live");
  const nflLive = nfl.games.filter((g) => g.status === "live");
  const socLive = soccer.filter((m) => m.status === "live");

  const sortLive = <T extends { status: string }>(list: T[]) => [...list].sort((a, b) => (a.status === "live" ? 0 : a.status === "pre" ? 1 : 2) - (b.status === "live" ? 0 : b.status === "pre" ? 1 : 2));

  const nbaRows: Row[] = sortLive(nba.games).slice(0, 3).map((g) => ({
    key: g.id, href: `/nba/game/${g.id}`, awayCode: g.away, homeCode: g.home,
    away: <LogoPlate hex={nbaTeamHex(g.away)} src={nbaLogoUrl(g.away)} code={g.away} size={32} radius={10} variant="clean" />,
    home: <LogoPlate hex={nbaTeamHex(g.home)} src={nbaLogoUrl(g.home)} code={g.home} size={32} radius={10} variant="clean" />,
    mid: g.status === "pre" ? g.timeLabel : `${g.awayScore}-${g.homeScore}`, live: g.status === "live",
    sub: g.status === "live" ? g.statusDetail : g.isCup ? "NBA Cup" : g.status === "final" ? "Final" : undefined,
  }));
  const nflRows: Row[] = sortLive(nfl.games).slice(0, 3).map((g) => ({
    key: g.id, href: `/nfl/game/${g.id}`, awayCode: g.away, homeCode: g.home,
    away: <LogoPlate hex={nflTeamHex(g.away)} src={nflLogoUrl(g.away)} code={g.away} size={32} radius={10} variant="clean" />,
    home: <LogoPlate hex={nflTeamHex(g.home)} src={nflLogoUrl(g.home)} code={g.home} size={32} radius={10} variant="clean" />,
    mid: g.status === "pre" ? g.timeLabel : `${g.awayScore}-${g.homeScore}`, live: g.status === "live",
    sub: g.status === "live" ? g.statusDetail : g.status === "final" ? "Final" : g.dateLabel,
  }));
  const socRows: Row[] = soccer.slice(0, 3).map((m) => ({
    key: m.id, href: "/soccer", awayCode: m.awayTeam.abbr, homeCode: m.homeTeam.abbr,
    away: <SoccerCrest src={m.awayTeam.logo} code={m.awayTeam.abbr} />,
    home: <SoccerCrest src={m.homeTeam.logo} code={m.homeTeam.abbr} />,
    mid: m.status === "pre" ? new Date(m.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : `${m.awayScore}-${m.homeScore}`,
    live: m.status === "live", sub: LEAGUE_MAP[m.league]?.shortLabel,
  }));

  // Strongest model edges across NBA + NFL (upcoming/live only)
  const edges = useMemo(() => {
    const list = [
      ...nba.games.filter((g) => g.status !== "final").map((g) => ({ key: `n${g.id}`, tag: "NBA", color: "#fb923c", href: `/nba/game/${g.id}`, matchup: `${g.away} @ ${g.home}`, pick: `${g.homeWinProb >= 50 ? g.home : g.away} ML`, edge: g.edge, grade: g.grade, prob: Math.max(g.homeWinProb, 100 - g.homeWinProb) })),
      ...nfl.games.filter((g) => g.status !== "final").map((g) => ({ key: `f${g.id}`, tag: "NFL", color: "#a78bfa", href: `/nfl/game/${g.id}`, matchup: `${g.away} @ ${g.home}`, pick: `${g.homeWinProb >= 50 ? g.home : g.away} ML`, edge: g.edge, grade: g.grade, prob: Math.max(g.homeWinProb, 100 - g.homeWinProb) })),
    ];
    return list.sort((a, b) => b.edge - a.edge).slice(0, 5);
  }, [nba.games, nfl.games]);

  const ticker = useMemo(() => [
    ...nba.games.slice(0, 5).map((g) => ({ key: `n${g.id}`, tag: "NBA", color: "var(--orange-soft)", a: g.away, h: g.home, ap: 100 - g.homeWinProb, hp: g.homeWinProb, ah: nbaTeamHex(g.away), hh: nbaTeamHex(g.home), status: g.status === "live" ? "LIVE" : g.timeLabel, href: `/nba/game/${g.id}` })),
    ...nfl.games.slice(0, 5).map((g) => ({ key: `f${g.id}`, tag: "NFL", color: "var(--purple-soft)", a: g.away, h: g.home, ap: 100 - g.homeWinProb, hp: g.homeWinProb, ah: nflTeamHex(g.away), hh: nflTeamHex(g.home), status: g.status === "live" ? "LIVE" : g.timeLabel, href: `/nfl/game/${g.id}` })),
    ...soccer.filter((m) => m.model).slice(0, 5).map((m) => ({ key: `s${m.id}`, tag: "SOC", color: "#6ee7b7", a: m.awayTeam.abbr, h: m.homeTeam.abbr, ap: m.model!.away, hp: m.model!.home, ah: m.awayTeam.hex, hh: m.homeTeam.hex, status: m.status === "live" ? "LIVE" : new Date(m.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }), href: "/soccer" })),
  ], [nba.games, nfl.games, soccer]);

  const avgGp = nba.standings.length ? nba.standings.reduce((a, r) => a + r.gp, 0) / nba.standings.length : 0;
  const nbaPct = Math.round((avgGp / 82) * 100);
  const nflPct = Math.round((nfl.weekNum / 18) * 100);
  const nbaShown = useCountUp(nbaPct), nflShown = useCountUp(nflPct);

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-2xl mx-auto page-pad py-5 sm:py-6">
        {/* Header */}
        <div className="flex items-end justify-between gap-x-4 gap-y-3 flex-wrap mb-5 rise">
          <div className="min-w-0">
            <p className="spot-label" style={{ color: "var(--orange)" }}>{todayDate}</p>
            <h1 className="font-spot-sans text-[28px] sm:text-4xl font-black leading-[1.05] mt-1.5" style={{ color: "var(--text)" }}>Welcome back, {userName}</h1>
            <p className="mt-1.5 font-spot-sans text-[13px] max-w-xl" style={{ color: "var(--text-muted)" }}>
              NBA, NFL and Soccer are live — the model has graded every game, line and prop.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 font-spot-sans text-[11px] font-bold" style={{ color: "var(--green)", background: "var(--green-bg)", border: "1px solid rgba(52,211,153,.3)" }}>
            <span className="spot-live-dot inline-block rounded-full" style={{ width: 7, height: 7, background: "var(--green)" }} />Model synced &middot; {syncedAgo}
          </span>
        </div>

        {/* In-season sports */}
        <div className="grid gap-3.5 mb-4 sm:grid-cols-2 xl:grid-cols-3 stagger">
          <SportCard
            accent="#fb923c" soft="#fdba74" title="NBA" icon={<Ball />} chip={nbaLive.length ? `${nbaLive.length} live` : "Live season"}
            headline={`${nba.games.length} ${nba.games.length === 1 ? "game" : "games"} today`}
            sub="Emirates NBA Cup in progress · standings, props & lines" href="/nba" rows={nbaRows}
            links={[{ href: "/nba", label: "Today's slate →" }, { href: "/nba/standings", label: "Standings" }, { href: "/nba/cup", label: "NBA Cup" }, { href: "/nba/props", label: "Props" }]}
          />
          <SportCard
            accent="#a78bfa" soft="#c4b5fd" title="NFL" icon={<Foot />} chip={nflLive.length ? `${nflLive.length} live` : nfl.weekLabel}
            headline={`${nfl.weekLabel} · ${nfl.games.length} games`}
            sub="All 18 weeks, standings placement, players & game props" href="/nfl" rows={nflRows}
            links={[{ href: "/nfl", label: "Every game →" }, { href: "/nfl/standings", label: "Standings" }, { href: "/nfl/players", label: "Players" }, { href: "/nfl/props", label: "Props" }]}
          />
          <div className="sm:col-span-2 xl:col-span-1">
            <SportCard
              accent="#34d399" soft="#6ee7b7" title="Soccer" icon={<Soc />} chip={socLive.length ? `${socLive.length} live` : "10 leagues"}
              headline={`${soccer.length} matches today`}
              sub="Match centre with momentum, lineups & AI insights" href="/soccer" rows={socRows}
              links={[{ href: "/soccer", label: "Match centre →" }, { href: "/soccer/leagues", label: "Leagues" }, { href: "/soccer/props", label: "Props" }]}
            />
          </div>
        </div>

        {/* Ticker */}
        {ticker.length > 0 && (
          <div className="relative rounded-[20px] overflow-hidden mb-4" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
            <div className="px-5 pt-4 pb-2">
              <span className="inline-flex items-center gap-2 font-spot-sans font-bold text-[11px] uppercase tracking-[.14em]" style={{ color: "var(--purple-2)" }}>
                <span className="spot-live-dot inline-block rounded-full" style={{ width: 7, height: 7, background: "var(--purple-2)" }} />AI Live Market &middot; win probability across NBA · NFL · Soccer
              </span>
            </div>
            <div className="overflow-hidden py-2 pb-4">
              <div className="flex gap-3 w-max" style={{ animation: "ticker-scroll 60s linear infinite" }}>
                {[...ticker, ...ticker].map((m, i) => (
                  <Link key={`${m.key}-${i}`} href={m.href} className="press flex flex-col gap-2 rounded-[14px] px-3.5 py-3" style={{ width: 212, background: "var(--panel-2)", border: "1px solid var(--hairline)" }}>
                    <div className="flex items-center justify-between">
                      <span className="font-spot-sans font-extrabold text-[9px] tracking-[.12em]" style={{ color: m.color }}>{m.tag}</span>
                      <span className="font-spot-mono font-bold text-[9px]" style={{ color: m.status === "LIVE" ? "var(--red-soft)" : "var(--text-muted)" }}>{m.status}</span>
                    </div>
                    <div className="flex items-center justify-between font-spot-sans font-extrabold text-xs">
                      <span>{m.a} <span className="font-spot-mono" style={{ color: "var(--text-3)" }}>{m.ap}%</span></span>
                      <span style={{ color: "var(--text-ghost)" }}>@</span>
                      <span><span className="font-spot-mono" style={{ color: "var(--text-3)" }}>{m.hp}%</span> {m.h}</span>
                    </div>
                    <div className="flex h-1.5 rounded overflow-hidden" style={{ background: "rgba(255,255,255,.10)" }}>
                      <div style={{ width: `${m.ap}%`, background: m.ah }} /><div style={{ flex: 1, background: m.hh }} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Edges + season progress */}
        <div className="grid gap-3.5 mb-4 lg:grid-cols-[1.4fr_1fr]">
          <Panel className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="spot-label" style={{ color: "var(--green)" }}>Strongest model edges</p>
              <span className="font-spot-sans text-[10px]" style={{ color: "var(--text-faint)" }}>NBA · NFL · vs. DraftKings</span>
            </div>
            {edges.length === 0 ? <p className="font-spot-sans text-xs" style={{ color: "var(--text-muted)" }}>Edges appear once lines post.</p> : (
              <div className="flex flex-col">
                {edges.map((e, i) => (
                  <Link key={e.key} href={e.href} className="press flex items-center gap-3 py-2.5" style={{ borderTop: i ? "1px solid var(--hairline)" : undefined }}>
                    <Chip color={e.color}>{e.tag}</Chip>
                    <span className="flex-1 min-w-0">
                      <span className="block font-spot-sans font-extrabold text-[13px] truncate" style={{ color: "var(--text)" }}>{e.pick}</span>
                      <span className="block font-spot-mono text-[10px]" style={{ color: "var(--text-faint)" }}>{e.matchup} · {e.prob}% win prob</span>
                    </span>
                    <span className="font-spot-mono font-extrabold text-[12px]" style={{ color: "var(--text-3)" }}>{e.edge}</span>
                    <span className="rounded-lg px-2 py-1 font-spot-sans font-black text-xs" style={{ color: gradeColor(e.grade), background: `color-mix(in srgb, ${gradeColor(e.grade)} 16%, transparent)` }}>{e.grade}</span>
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          <Panel className="p-5">
            <p className="spot-label mb-4" style={{ color: "var(--text-faint)" }}>Season progress</p>
            {[{ l: "NFL · Regular season", s: `Week ${nfl.weekNum} of 18`, p: nflShown, c: "#a78bfa" }, { l: "NBA · Regular season", s: `~${Math.round(avgGp)} of 82 games`, p: nbaShown, c: "#fb923c" }].map((r) => (
              <div key={r.l} className="mb-4 last:mb-0">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="font-spot-sans font-extrabold text-[12px]" style={{ color: "var(--text-2)" }}>{r.l}</span>
                  <span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-muted)" }}>{r.s} · {r.p}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.07)" }}>
                  <div className="h-full rounded-full" style={{ width: `${r.p}%`, background: `linear-gradient(90deg, ${r.c}88, ${r.c})`, transition: "width .3s" }} />
                </div>
              </div>
            ))}
          </Panel>
        </div>

        {/* Offseason */}
        <p className="spot-label mb-2.5" style={{ color: "var(--text-faint)" }}>Offseason</p>
        <div className="grid gap-3 sm:grid-cols-2 mb-4">
          {[{ info: mlb, href: "/games", label: "MLB", color: "#f97316", note: "2026 World Series is complete" }, { info: wnba, href: "/wnba", label: "WNBA", color: "#2dd4bf", note: "2026 Finals are complete" }].map((o) => (
            <Link key={o.label} href={o.href} className="press flex items-center gap-4 rounded-[18px] px-4 py-3.5" style={{ background: "rgba(255,255,255,.025)", border: "1px dashed rgba(255,255,255,.12)" }}>
              <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${o.color}1a`, color: o.color, filter: "saturate(.55)" }}>{o.label === "MLB" ? <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8.5" /><path d="M6 6c2 2.5 2 9.5 0 12M18 6c-2 2.5-2 9.5 0 12" /></svg> : <Ball s={18} />}</span>
              <span className="flex-1 min-w-0">
                <span className="block font-spot-sans font-extrabold text-[14px]" style={{ color: "var(--text-2)" }}>{o.label} <span className="font-semibold text-[11px]" style={{ color: "var(--text-faint)" }}>· Offseason</span></span>
                <span className="block font-spot-sans text-[11px]" style={{ color: "var(--text-faint)" }}>{o.note} · {o.info.returns ? `${daysUntil(o.info.returns)} days to ${o.info.returnsLabel?.split("·")[0]?.trim()}` : ""}</span>
              </span>
              <span className="font-spot-sans font-bold text-[11px]" style={{ color: "var(--text-muted)" }}>Season recap →</span>
            </Link>
          ))}
        </div>

        <SavedSlipsPanel />
      </div>
    </div>
  );
}
