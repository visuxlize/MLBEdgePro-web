"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/lib/subscription";
import { getScore, type Game } from "@/lib/mlb/api";
import type { NflGame } from "@/lib/nfl/types";
import { nflTeamHex, nflLogoUrl } from "@/lib/nfl/teams";
import {
  SectionLabel, LogoBadge, GradePill, AIPredictionButton,
  teamHex, teamCode, modelEdge,
} from "@/components/web-tool/spotlight";

const KICKOFF_TARGET = new Date("2026-08-06T20:00:00").getTime();

function gameTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function useSyncedAgo() {
  const [minutes, setMinutes] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setMinutes((m) => m + 1), 60_000);
    return () => clearInterval(iv);
  }, []);
  return minutes === 0 ? "just now" : `${minutes}m ago`;
}

interface MarketChip {
  key: string;
  away: string;
  home: string;
  awayHex: string;
  homeHex: string;
  awayPct: number;
  homePct: number;
  tag: "MLB" | "NFL";
  status: string;
  href: string;
}

interface Props {
  userName: string;
  todayDate: string;
  mlbGames: Game[];
  nflGames: NflGame[];
}

export function HomeClient({ userName, todayDate, mlbGames, nflGames }: Props) {
  const router = useRouter();
  const { isSuperPro } = useSubscription();
  const syncedAgo = useSyncedAgo();

  const daysToKickoff = Math.max(0, Math.ceil((KICKOFF_TARGET - Date.now()) / 86_400_000));

  const mlbLive = mlbGames.filter((g) => g.status.detailedState === "In Progress");
  const nflLive = nflGames.filter((g) => g.status === "live");

  const mlbTopPick = useMemo(() => {
    if (!mlbGames.length) return null;
    const best = [...mlbGames].sort((a, b) => modelEdge(b).edge - modelEdge(a).edge)[0];
    const { favId, favName } = (() => {
      const m = modelEdge(best);
      const name = m.favId === best.teams.home.team.id ? best.teams.home.team.name : best.teams.away.team.name;
      return { favId: m.favId, favName: name };
    })();
    return teamCode(favId, favName);
  }, [mlbGames]);

  const marketChips: MarketChip[] = useMemo(() => {
    const mlbChips: MarketChip[] = mlbGames.slice(0, 8).map((g) => {
      const m = modelEdge(g);
      const isLive = g.status.detailedState === "In Progress";
      return {
        key: `mlb-${g.gamePk}`,
        away: teamCode(g.teams.away.team.id, g.teams.away.team.name),
        home: teamCode(g.teams.home.team.id, g.teams.home.team.name),
        awayHex: teamHex(g.teams.away.team.id),
        homeHex: teamHex(g.teams.home.team.id),
        awayPct: m.awayProb,
        homePct: m.homeProb,
        tag: "MLB",
        status: isLive ? "LIVE" : gameTime(g.gameDate),
        href: `/game/${g.gamePk}`,
      };
    });
    const nflChips: MarketChip[] = nflGames.slice(0, 8).map((g) => ({
      key: `nfl-${g.id}`,
      away: g.away,
      home: g.home,
      awayHex: nflTeamHex(g.away),
      homeHex: nflTeamHex(g.home),
      awayPct: 100 - g.homeWinProb,
      homePct: g.homeWinProb,
      tag: "NFL",
      status: g.status === "live" ? "LIVE" : g.timeLabel,
      href: `/nfl/game/${g.id}`,
    }));
    return [...mlbChips, ...nflChips].slice(0, 12);
  }, [mlbGames, nflGames]);

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
          <div>
            <p className="spot-label" style={{ color: "var(--orange)" }}>{todayDate}</p>
            <h1 className="font-spot-sans text-3xl sm:text-4xl font-black leading-tight mt-1" style={{ color: "var(--text)" }}>
              Welcome back, {userName}
            </h1>
            <p className="mt-1.5 font-spot-sans text-[13px]" style={{ color: "var(--text-muted)" }}>
              The model&rsquo;s already done the homework. Here&rsquo;s your slate &mdash; grades, picks, and edges ready to go.
            </p>
          </div>
          <span
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 font-spot-sans text-[11px] font-bold"
            style={{ color: "var(--green)", background: "var(--green-bg)", border: "1px solid rgba(52,211,153,.3)" }}
          >
            <span className="spot-live-dot inline-block rounded-full" style={{ width: 7, height: 7, background: "var(--green)" }} />
            Model synced &middot; {syncedAgo}
          </span>
        </div>

        {/* Sport switch cards */}
        <div className="grid gap-3.5 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
          <button
            onClick={() => router.push("/games")}
            className="relative overflow-hidden text-left rounded-[20px] p-5"
            style={{
              background: "linear-gradient(135deg, rgba(255,120,40,.16), #0b0d15 62%)",
              border: "1px solid rgba(255,120,40,.35)", boxShadow: "0 0 44px rgba(255,120,40,.08)",
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-spot-sans font-extrabold text-[11px] uppercase tracking-[.12em]" style={{ color: "var(--orange-soft)" }}>
                ⚾ MLB &middot; In Season
              </span>
              {mlbLive.length > 0 && (
                <span className="inline-flex items-center gap-1.5 font-spot-mono font-extrabold text-[10px]" style={{ color: "var(--red-soft)" }}>
                  <span className="spot-live-dot inline-block rounded-full" style={{ width: 6, height: 6, background: "var(--red)" }} />
                  {mlbLive.length} LIVE
                </span>
              )}
            </div>
            <p className="mt-3 font-spot-sans font-black text-2xl" style={{ color: "var(--text)" }}>{mlbGames.length} games today</p>
            <p className="mt-1 font-spot-sans text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              {mlbGames.length ? `All analyzed · ${mlbTopPick} is tonight's strongest edge` : "No games scheduled today"}
            </p>
            <p className="mt-3.5 font-spot-sans font-extrabold text-xs" style={{ color: "var(--orange)" }}>Open MLB dashboard &rarr;</p>
          </button>

          <button
            onClick={() => router.push("/nfl")}
            className="relative overflow-hidden text-left rounded-[20px] p-5"
            style={{ background: "linear-gradient(135deg, rgba(124,92,250,.14), #0b0d15 62%)", border: "1px solid rgba(167,139,250,.32)" }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-spot-sans font-extrabold text-[11px] uppercase tracking-[.12em]" style={{ color: "var(--purple-soft)" }}>
                🏈 NFL &middot; {isSuperPro ? "Early Access" : "Preview"}
              </span>
              <span className="rounded-full px-2.5 py-1 font-spot-sans font-extrabold text-[10px] tracking-[.1em]" style={{ color: "var(--purple-2)", background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>
                {isSuperPro ? "◆ PRO" : "SOON"}
              </span>
            </div>
            <p className="mt-3 font-spot-sans font-black text-2xl" style={{ color: "var(--text)" }}>Kickoff in {daysToKickoff} days</p>
            <p className="mt-1 font-spot-sans text-xs font-medium" style={{ color: "var(--text-muted)" }}>HOF Game + Preseason Week 1 already graded</p>
            <p className="mt-3.5 font-spot-sans font-extrabold text-xs" style={{ color: "var(--purple-2)" }}>See the NFL slate &rarr;</p>
          </button>
        </div>

        {/* AI Live Market ticker */}
        {marketChips.length > 0 && (
          <div className="relative rounded-[20px] overflow-hidden mb-4" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
            <div className="flex items-center justify-between gap-3 flex-wrap px-5 pt-4 pb-2">
              <span className="inline-flex items-center gap-2 font-spot-sans font-bold text-[11px] uppercase tracking-[.14em]" style={{ color: "var(--purple-2)" }}>
                <span className="spot-live-dot inline-block rounded-full" style={{ width: 7, height: 7, background: "var(--purple-2)" }} />
                AI Live Market &middot; win probability, updating
              </span>
            </div>
            <div className="overflow-hidden py-2 pb-4">
              <div className="flex gap-3 w-max" style={{ animation: "ticker-scroll 44s linear infinite" }}>
                {[...marketChips, ...marketChips].map((m, i) => (
                  <Link
                    key={`${m.key}-${i}`}
                    href={m.href}
                    className="flex flex-col gap-2 rounded-[14px] px-3.5 py-3 text-left"
                    style={{ width: 212, background: "var(--panel-2)", border: "1px solid var(--hairline)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-spot-sans font-extrabold text-[9px] tracking-[.12em]" style={{ color: m.tag === "MLB" ? "var(--orange-soft)" : "var(--purple-soft)" }}>{m.tag}</span>
                      <span className="font-spot-mono font-bold text-[9px]" style={{ color: "var(--text-muted)" }}>{m.status}</span>
                    </div>
                    <div className="flex items-center justify-between font-spot-sans font-extrabold text-xs">
                      <span>{m.away} <span className="font-spot-mono" style={{ color: "var(--text-3)" }}>{m.awayPct}%</span></span>
                      <span style={{ color: "var(--text-ghost)" }}>@</span>
                      <span><span className="font-spot-mono" style={{ color: "var(--text-3)" }}>{m.homePct}%</span> {m.home}</span>
                    </div>
                    <div className="flex h-1.5 rounded overflow-hidden" style={{ background: "rgba(255,255,255,.10)" }}>
                      <div style={{ width: `${m.awayPct}%`, background: m.awayHex }} />
                      <div style={{ flex: 1, background: m.homeHex }} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Slate + concierge */}
        <div className="grid gap-3.5" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <SectionLabel style={{ color: "var(--text-faint)" }}>Today&rsquo;s Slate &middot; MLB</SectionLabel>
              <Link href="/games" className="font-spot-sans font-bold text-[11px]" style={{ color: "var(--orange)" }}>All games &rarr;</Link>
            </div>
            {mlbGames.length === 0 ? (
              <div className="rounded-[15px] py-10 text-center" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
                <p className="font-spot-sans text-sm" style={{ color: "var(--text-muted)" }}>No MLB games scheduled today</p>
              </div>
            ) : (
              <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}>
                {mlbGames.slice(0, 6).map((g) => {
                  const m = modelEdge(g);
                  const isLive = g.status.detailedState === "In Progress";
                  const isFinal = ["Final", "Game Over"].includes(g.status.detailedState);
                  const awayScore = getScore(g.teams.away, g.linescore, "away");
                  const homeScore = getScore(g.teams.home, g.linescore, "home");
                  return (
                    <Link
                      key={g.gamePk}
                      href={`/game/${g.gamePk}`}
                      className="text-left rounded-[15px] p-3.5 flex flex-col gap-2.5"
                      style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-spot-mono font-bold text-[10px]" style={{ color: isLive ? "var(--red-soft)" : "var(--text-muted)" }}>
                          {isLive ? "LIVE" : isFinal ? "FINAL" : gameTime(g.gameDate)}
                        </span>
                        <GradePill grade={m.grade} />
                      </div>
                      {[{ side: g.teams.away, pct: m.awayProb, score: awayScore }, { side: g.teams.home, pct: m.homeProb, score: homeScore }].map(({ side, pct, score }, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <LogoBadge teamId={side.team.id} name={side.team.name} size={24} />
                          <span className="flex-1 font-spot-sans font-extrabold text-[13px]" style={{ color: "var(--text)" }}>{teamCode(side.team.id, side.team.name)}</span>
                          <span className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-3)" }}>
                            {isLive || isFinal ? score ?? "—" : `${pct}%`}
                          </span>
                        </div>
                      ))}
                      <div className="flex h-1.5 rounded overflow-hidden" style={{ background: "rgba(255,255,255,.10)" }}>
                        <div style={{ width: `${m.awayProb}%`, background: teamHex(g.teams.away.team.id) }} />
                        <div style={{ flex: 1, background: teamHex(g.teams.home.team.id) }} />
                      </div>
                      <AIPredictionButton pick={`${m.favCode} ML`} teamId={m.favId} />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Concierge column */}
          <div className="flex flex-col gap-3.5">
            <div className="rounded-[20px] p-5" style={{ background: "linear-gradient(160deg, rgba(249,115,22,.08), #0b0d15 60%)", border: "1px solid rgba(249,115,22,.22)" }}>
              <p className="spot-label" style={{ color: "var(--orange-soft)" }}>We&rsquo;ve got you</p>
              <div className="flex flex-col gap-2.5 mt-3.5">
                <div className="flex items-start gap-2.5 rounded-[13px] px-3 py-2.5" style={{ background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.22)" }}>
                  <span style={{ color: "var(--green)", fontWeight: 900 }}>&#10003;</span>
                  <span className="font-spot-sans text-xs" style={{ color: "var(--text-2)" }}>
                    Today&rsquo;s top edge: <span className="font-black" style={{ color: "var(--green)" }}>
                      {mlbGames.length ? `${teamCode(mlbGames[0].teams.away.team.id, mlbGames[0].teams.away.team.name)} @ ${teamCode(mlbGames[0].teams.home.team.id, mlbGames[0].teams.home.team.name)} · ${modelEdge(mlbGames[0]).grade}` : "—"}
                    </span>
                  </span>
                </div>
                <div className="flex items-start gap-2.5 rounded-[13px] px-3 py-2.5" style={{ background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>
                  <span style={{ color: "var(--purple-2)" }}>&#9670;</span>
                  <span className="font-spot-sans text-xs" style={{ color: "var(--text-2)" }}>A 3-leg parlay draft is waiting in your slip builder</span>
                </div>
                <div className="flex items-start gap-2.5 rounded-[13px] px-3 py-2.5" style={{ background: "var(--orange-tint)", border: "1px solid var(--orange-line)" }}>
                  <span style={{ color: "var(--orange)" }}>&#8635;</span>
                  <span className="font-spot-sans text-xs" style={{ color: "var(--text-2)" }}>Lines, injuries &amp; weather refreshed {syncedAgo}</span>
                </div>
              </div>
              <p className="mt-3.5 font-spot-sans text-[11px] leading-relaxed" style={{ color: "var(--text-faint)" }}>
                No spreadsheets, no homework. Open a game &mdash; the analysis is already done.
              </p>
            </div>

            <div className="rounded-[20px] p-5" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
              <p className="spot-label mb-3" style={{ color: "var(--text-faint)" }}>How it works</p>
              <div className="flex flex-col gap-3">
                {[
                  { n: "1", c: "var(--orange)", bg: "var(--orange-tint)", bd: "var(--orange-line)", title: "We watch every line", body: "Odds, injuries, weather, lineups — auto-refreshed all day." },
                  { n: "2", c: "var(--purple-2)", bg: "var(--purple-tint)", bd: "var(--purple-line)", title: "The model grades it", body: "A+ to C. Green means the numbers are on your side." },
                  { n: "3", c: "var(--green)", bg: "var(--green-bg)", bd: "rgba(52,211,153,.3)", title: "You get the pick", body: "Tap a game for the full deep dive, or build a slip in two clicks." },
                ].map((s) => (
                  <div key={s.n} className="flex gap-2.5 items-start">
                    <span className="w-[26px] h-[26px] rounded-lg flex items-center justify-center shrink-0 font-spot-mono font-black text-[11px]" style={{ color: s.c, background: s.bg, border: `1px solid ${s.bd}` }}>{s.n}</span>
                    <div>
                      <p className="font-spot-sans font-extrabold text-xs" style={{ color: "var(--text)" }}>{s.title}</p>
                      <p className="mt-0.5 font-spot-sans text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
