"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogoPlate, WnbaHeadshot, gradeColor, alpha } from "@/components/web-tool/spotlight";
import { PaywallGate } from "@/components/web-tool/paywall-gate";
import { Chip, CompareBar, EmptyState, Gauge, LiveBadge, OddsStrip, Panel, ProbSplit, Segmented } from "@/components/web-tool/sport-ui";
import { nbaHeadshotUrl, nbaLogoUrl, nbaTeamHex, nbaTeamName } from "@/lib/nba/teams";
import type { NbaBoxPlayer, NbaGameDetail, NbaPlayerProp } from "@/lib/nba/types";
import type { GameModel } from "@/lib/nba/analytics";

const ACCENT = "#fb923c";
type Tab = "analysis" | "box" | "props";

function WinProbChart({ series, homeHex, home }: { series: number[]; homeHex: string; home: string }) {
  if (series.length < 4) return null;
  const pts = series.filter((_, i) => i % Math.ceil(series.length / 120) === 0);
  const W = 320, H = 110;
  const path = pts.map((v, i) => `${i === 0 ? "M" : "L"}${(i / (pts.length - 1)) * W},${H - (v / 100) * H}`).join(" ");
  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="spot-label" style={{ color: "var(--text-faint)" }}>Win probability · {home}</p>
        <span className="font-spot-mono font-bold text-[10px]" style={{ color: homeHex }}>{series[series.length - 1]}% final</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 120, display: "block" }}>
        <defs><linearGradient id="nbawp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={homeHex} stopOpacity=".35" /><stop offset="1" stopColor={homeHex} stopOpacity="0" /></linearGradient></defs>
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="rgba(255,255,255,.14)" strokeDasharray="3 4" />
        <path d={`${path} L${W},${H} L0,${H} Z`} fill="url(#nbawp)" />
        <path d={path} fill="none" stroke={homeHex} strokeWidth="2.4" strokeLinejoin="round" style={{ strokeDasharray: 1200, strokeDashoffset: 1200, animation: "draw 1.8s ease .1s forwards" }} />
      </svg>
    </Panel>
  );
}

function BoxTable({ team, rows }: { team: string; rows: NbaBoxPlayer[] }) {
  const hex = nbaTeamHex(team);
  return (
    <Panel className="overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: `linear-gradient(120deg, ${alpha(hex, "26")}, transparent 70%)`, borderBottom: "1px solid var(--hairline)" }}>
        <LogoPlate hex={hex} src={nbaLogoUrl(team)} code={team} size={28} radius={9} variant="clean" />
        <p className="font-spot-sans font-black text-[13.5px]" style={{ color: "var(--text)" }}>{nbaTeamName(team)}</p>
      </div>
      {rows.length === 0 ? <p className="p-4 text-xs" style={{ color: "var(--text-muted)" }}>Box score posts at tip-off.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left">
            <thead>
              <tr className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.1em]" style={{ color: "var(--text-faint)" }}>
                <th className="px-4 py-2">Player</th><th className="px-1 py-2 text-right">MIN</th><th className="px-1 py-2 text-right">PTS</th>
                <th className="px-1 py-2 text-right">REB</th><th className="px-1 py-2 text-right">AST</th><th className="px-1 py-2 text-right">FG</th><th className="px-1 py-2 text-right">3PT</th><th className="px-4 py-2 text-right">+/-</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.espnId + r.name} style={{ borderTop: "1px solid var(--hairline)" }}>
                  <td className="px-4 py-2 font-spot-sans font-bold text-[12px] whitespace-nowrap" style={{ color: "var(--text)" }}>{r.name} <span className="font-normal text-[10px]" style={{ color: "var(--text-faint)" }}>{r.pos}</span></td>
                  {[r.min, r.pts, r.reb, r.ast, r.fg, r.tp].map((v, i) => (
                    <td key={i} className="px-1 py-2 text-right font-spot-mono text-[11.5px]" style={{ color: i === 1 ? "var(--text)" : "var(--text-3)", fontWeight: i === 1 ? 800 : 500 }}>{v}</td>
                  ))}
                  <td className="px-4 py-2 text-right font-spot-mono text-[11.5px] font-bold" style={{ color: r.pm.startsWith("-") ? "var(--red-soft)" : "var(--green)" }}>{r.pm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function PropsList({ props }: { props: NbaPlayerProp[] }) {
  if (props.length === 0) return <EmptyState title="No props for this game" body="Props are generated for games that haven't finished." />;
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {props.map((p) => {
        const hex = nbaTeamHex(p.team);
        const gc = gradeColor(p.grade);
        return (
          <div key={p.id} className="flex items-center gap-3 rounded-2xl px-3.5 py-3" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
            <WnbaHeadshot hex={hex} src={nbaHeadshotUrl(p.espnId)} name={p.player} size={56} radius={15} />
            <div className="flex-1 min-w-0">
              <p className="font-spot-sans font-black text-[13.5px] truncate" style={{ color: "var(--text)" }}>{p.player}</p>
              <p className="font-spot-sans text-[10.5px]" style={{ color: "var(--text-muted)" }}>{p.market} · {p.over ? "Over" : "Under"} {p.line} {p.source === "draftkings" ? <span style={{ color: "var(--green)" }}>· DraftKings</span> : <span style={{ color: "var(--text-faint)" }}>· ref. line</span>}</p>
              <p className="font-spot-mono font-bold text-[10.5px]" style={{ color: "var(--text-3)" }}>proj {p.proj} · {p.prob}% ({p.prob - p.baseProb >= 0 ? "+" : ""}{p.prob - p.baseProb}) · ×{p.oppFactor.toFixed(2)}</p>
            </div>
            <span className="rounded-lg px-2 py-1 font-spot-sans font-black text-xs" style={{ color: gc, background: `color-mix(in srgb, ${gc} 16%, transparent)` }}>{p.grade}</span>
          </div>
        );
      })}
    </div>
  );
}

export function NbaGameDeepDive({
  detail, model, props, awayRank, homeRank,
}: { detail: NbaGameDetail; model: GameModel; props: NbaPlayerProp[]; awayRank?: number; homeRank?: number }) {
  const { game: g } = detail;
  const [tab, setTab] = useState<Tab>("analysis");
  const awayHex = nbaTeamHex(g.away), homeHex = nbaTeamHex(g.home);
  const final = g.status === "final";
  const live = g.status === "live";
  const gc = gradeColor(g.grade);
  const fav = model.homeWinProb >= 50 ? g.home : g.away;
  const mktSpread = g.odds?.homeSpread;
  const spreadFav = mktSpread == null ? null : mktSpread <= 0 ? g.home : g.away;
  const modelFavText = `${model.margin >= 0 ? g.home : g.away} by ${Math.abs(model.margin).toFixed(1)}`;

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-xl mx-auto page-pad py-5 sm:py-6">
        <Link href="/nba" className="press inline-flex items-center gap-1.5 mb-4 font-spot-sans font-bold text-xs" style={{ color: "var(--text-muted)" }}>← Back to NBA</Link>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-[24px] overflow-hidden mb-4"
          style={{ border: "1px solid var(--hairline)", boxShadow: "var(--shadow-panel)", background: `linear-gradient(120deg, ${alpha(awayHex, "38")}, var(--panel) 52%, ${alpha(homeHex, "38")})` }}>
          <div className="relative p-5 sm:p-7">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-spot-mono font-extrabold text-[10px] tracking-[.08em]" style={{ color: "#fdba74" }}>{g.dateLabel} · {g.timeLabel} ET</span>
                <span className="font-spot-sans text-[10px]" style={{ color: "var(--text-3)" }}>{g.venue}</span>
                {g.isCup && <Chip color="#fbbf24">NBA Cup</Chip>}
              </div>
              {live ? <LiveBadge label={g.statusDetail} /> : final && <Chip color="#94a3b8">Final</Chip>}
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
              {([["away", g.away, g.awayScore, g.awayRecord, awayRank], ["home", g.home, g.homeScore, g.homeRecord, homeRank]] as const).map(([side, abbr, score, rec, rank], i) => {
                const el = (
                  <div key={side} className={`flex flex-col items-center gap-2 ${i === 0 ? "" : ""}`}>
                    <LogoPlate hex={nbaTeamHex(abbr)} src={nbaLogoUrl(abbr)} code={abbr} size={84} radius={24} variant="clean" />
                    <p className="font-spot-sans font-black text-[15px] sm:text-lg text-center leading-tight" style={{ color: "var(--text)" }}>{nbaTeamName(abbr)}</p>
                    <p className="font-spot-mono text-[10.5px]" style={{ color: "var(--text-muted)" }}>{rec}{rank ? ` · #${rank}` : ""}</p>
                  </div>
                );
                if (i === 0) {
                  return [el, (
                    <div key="mid" className="text-center">
                      {g.status === "pre" ? <p className="font-spot-mono font-black text-2xl" style={{ color: "var(--text-ghost)" }}>@</p> : (
                        <p className="font-spot-mono font-black text-3xl sm:text-5xl tracking-tight" style={{ color: "var(--text)" }}>
                          {score}<span style={{ color: "var(--text-ghost)" }}> – </span>{g.homeScore}
                        </p>
                      )}
                    </div>
                  )];
                }
                return el;
              })}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-[auto_1fr] items-center">
              <div className="flex items-center gap-4">
                <Gauge value={g.edge} label={g.grade} color={gc} size={92} />
                <div className="sm:hidden">
                  <p className="spot-label" style={{ color: "var(--purple-2)" }}>Model pick</p>
                  <p className="font-spot-sans font-black text-lg" style={{ color: "var(--text)" }}>{fav} ML</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <ProbSplit awayLabel={g.away} homeLabel={g.home} homePct={model.homeWinProb} awayHex={awayHex} homeHex={homeHex} />
                <div className="hidden sm:flex items-center justify-between rounded-xl px-3.5 py-2.5" style={{ background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>
                  <span className="font-spot-sans font-extrabold text-[10px] uppercase tracking-[.12em]" style={{ color: "var(--purple-2)" }}>◆ AI Prediction</span>
                  <span className="font-spot-sans font-black text-[13px]" style={{ color: "var(--purple-soft)" }}>{fav} ML · {modelFavText}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mb-4"><Segmented id="nba-game-tab" accent={ACCENT} value={tab} onChange={setTab} options={[{ key: "analysis", label: "Analysis" }, { key: "box", label: "Box score" }, { key: "props", label: "Player props", badge: String(props.length) }]} /></div>

        {tab === "analysis" && (
          <div className="grid gap-4 lg:grid-cols-2 stagger">
            {/* Betting lines vs model */}
            <Panel className="p-5">
              <p className="spot-label mb-3" style={{ color: "var(--text-faint)" }}>Lines vs. the model · {g.odds?.provider ?? "DraftKings"}</p>
              {g.odds ? (
                <>
                  <OddsStrip items={[
                    { label: "Spread", value: spreadFav ? `${spreadFav} -${Math.abs(mktSpread!)}` : "—" },
                    { label: "Total", value: g.odds.overUnder ? `O/U ${g.odds.overUnder}` : "—" },
                    { label: "Moneyline", value: `${g.away} ${g.odds.awayML ?? "—"}`, sub: `${g.home} ${g.odds.homeML ?? "—"}` },
                  ]} />
                  <div className="mt-3 rounded-xl p-3.5" style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--hairline)" }}>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div><p className="font-spot-mono font-black text-[17px]" style={{ color: "var(--text)" }}>{modelFavText.replace(" by ", " -")}</p><p className="font-spot-sans text-[9px] uppercase tracking-[.1em]" style={{ color: "var(--text-faint)" }}>Model spread</p></div>
                      <div><p className="font-spot-mono font-black text-[17px]" style={{ color: "var(--text)" }}>{model.projTotal}</p><p className="font-spot-sans text-[9px] uppercase tracking-[.1em]" style={{ color: "var(--text-faint)" }}>Proj. total</p></div>
                      <div><p className="font-spot-mono font-black text-[17px]" style={{ color: model.valuePts != null && Math.abs(model.valuePts) >= 2 ? "var(--green)" : "var(--text-3)" }}>{model.valuePts != null ? `${model.valuePts > 0 ? "+" : ""}${model.valuePts}` : "—"}</p><p className="font-spot-sans text-[9px] uppercase tracking-[.1em]" style={{ color: "var(--text-faint)" }}>Value (pts)</p></div>
                    </div>
                    {g.odds.overUnder && (
                      <p className="mt-3 font-spot-sans text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        Model total of <b style={{ color: "var(--text-2)" }}>{model.projTotal}</b> sits {Math.abs(model.projTotal - g.odds.overUnder).toFixed(1)} pts {model.projTotal >= g.odds.overUnder ? "above" : "below"} the market —
                        a lean to the <b style={{ color: model.projTotal >= g.odds.overUnder ? "var(--green)" : "#fda4a4" }}>{model.projTotal >= g.odds.overUnder ? "over" : "under"}</b>.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="font-spot-sans text-xs" style={{ color: "var(--text-muted)" }}>Market lines haven&rsquo;t posted. Model projects {model.projAway}–{model.projHome} ({modelFavText}).</p>
              )}
            </Panel>

            {/* Team stats */}
            <Panel className="p-5">
              <div className="flex items-center justify-between mb-4">
                <LogoPlate hex={awayHex} src={nbaLogoUrl(g.away)} code={g.away} size={22} radius={6} variant="clean" />
                <p className="spot-label" style={{ color: "var(--text-faint)" }}>Team comparison</p>
                <LogoPlate hex={homeHex} src={nbaLogoUrl(g.home)} code={g.home} size={22} radius={6} variant="clean" />
              </div>
              {detail.teamStats.length ? (
                <div className="flex flex-col gap-3.5">
                  {detail.teamStats.map((r, i) => <CompareBar key={r.label} label={r.label} away={r.away} home={r.home} awayPct={r.awayPct} homePct={r.homePct} awayHex={awayHex} homeHex={homeHex} delay={i * 0.06} />)}
                </div>
              ) : <p className="font-spot-sans text-xs" style={{ color: "var(--text-muted)" }}>Team stats post once the game starts.</p>}
            </Panel>

            {detail.leaders.length > 0 && (
              <Panel className="p-5">
                <p className="spot-label mb-3" style={{ color: "var(--text-faint)" }}>Top performers</p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {detail.leaders.map((l) => (
                    <div key={l.team + l.category} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--hairline)" }}>
                      <WnbaHeadshot hex={nbaTeamHex(l.team)} src={nbaHeadshotUrl(l.espnId)} name={l.player} size={50} radius={14} />
                      <div className="min-w-0">
                        <p className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.1em]" style={{ color: nbaTeamHex(l.team) }}>{l.team} · {l.category}</p>
                        <p className="font-spot-sans font-black text-[13px] truncate" style={{ color: "var(--text)" }}>{l.player}</p>
                        <p className="font-spot-mono font-extrabold text-[12px]" style={{ color: "var(--text-2)" }}>{l.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            <div className="flex flex-col gap-4">
              <WinProbChart series={detail.winProbSeries} homeHex={homeHex} home={g.home} />
              {detail.injuries.length > 0 && (
                <Panel className="p-5">
                  <p className="spot-label mb-3" style={{ color: "var(--text-faint)" }}>Injury report</p>
                  <div className="flex flex-col gap-2">
                    {detail.injuries.map((x, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <LogoPlate hex={nbaTeamHex(x.team)} src={nbaLogoUrl(x.team)} code={x.team} size={22} radius={6} variant="clean" />
                        <span className="flex-1 font-spot-sans font-bold text-[12px] truncate" style={{ color: "var(--text-2)" }}>{x.player}</span>
                        <Chip color={/out/i.test(x.status) ? "#f87171" : "#fbbf24"}>{x.status}</Chip>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}
            </div>
          </div>
        )}

        {tab === "box" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <BoxTable team={g.away} rows={detail.box.away} />
            <BoxTable team={g.home} rows={detail.box.home} />
          </div>
        )}

        {tab === "props" && (
          <PaywallGate requiredTier="fan" feature="NBA Game Props" benefits={["Matchup-adjusted projections for this game", "Hit probability & grade per prop"]}>
            <PropsList props={props} />
          </PaywallGate>
        )}
      </div>
    </div>
  );
}
