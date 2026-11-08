"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogoPlate, WnbaHeadshot, alpha, gradeColor } from "@/components/web-tool/spotlight";
import { PaywallGate } from "@/components/web-tool/paywall-gate";
import { NflPropCard } from "@/components/web-tool/nfl-props-board";
import { Chip, CompareBar, EmptyState, Gauge, LiveBadge, OddsStrip, Panel, ProbSplit, Segmented } from "@/components/web-tool/sport-ui";
import { nflHeadshotUrl, nflLogoUrl, nflTeamHex, nflTeamName } from "@/lib/nfl/teams";
import type { NflGameModel } from "@/lib/nfl/analytics";
import type { NflGameDetail, NflPropPlay, NflStandingRow } from "@/lib/nfl/types";

const ACCENT = "#a78bfa";
type Tab = "analysis" | "props";

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
        <defs><linearGradient id="nflwp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={homeHex} stopOpacity=".35" /><stop offset="1" stopColor={homeHex} stopOpacity="0" /></linearGradient></defs>
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="rgba(255,255,255,.14)" strokeDasharray="3 4" />
        <path d={`${path} L${W},${H} L0,${H} Z`} fill="url(#nflwp)" />
        <path d={path} fill="none" stroke={homeHex} strokeWidth="2.4" strokeLinejoin="round" style={{ strokeDasharray: 1200, strokeDashoffset: 1200, animation: "draw 1.8s ease .1s forwards" }} />
      </svg>
    </Panel>
  );
}

export function NflGameDetailView({
  detail, model, props, awayRow, homeRow,
}: { detail: NflGameDetail; model: NflGameModel; props: NflPropPlay[]; awayRow?: NflStandingRow; homeRow?: NflStandingRow }) {
  const { game: g } = detail;
  const [tab, setTab] = useState<Tab>("analysis");
  const awayHex = nflTeamHex(g.away), homeHex = nflTeamHex(g.home);
  const final = g.status === "final", live = g.status === "live";
  const gc = gradeColor(g.grade);
  const fav = model.homeWinProb >= 50 ? g.home : g.away;
  const mkt = g.odds?.homeSpread;
  const mktFav = mkt == null ? null : mkt <= 0 ? g.home : g.away;
  const modelLine = `${model.margin >= 0 ? g.home : g.away} -${Math.abs(model.margin).toFixed(1)}`;
  const place = (r?: NflStandingRow) => (r ? `${r.conf} ${r.division.replace(/^(AFC|NFC) /, "")}${r.seed ? ` · #${r.seed} seed` : ""}` : "");

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-xl mx-auto page-pad py-5 sm:py-6">
        <Link href="/nfl" className="press inline-flex items-center gap-1.5 mb-4 font-spot-sans font-bold text-xs" style={{ color: "var(--text-muted)" }}>← Back to the slate</Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-[24px] overflow-hidden mb-4"
          style={{ border: "1px solid var(--hairline)", boxShadow: "var(--shadow-panel)", background: `linear-gradient(120deg, ${alpha(awayHex, "38")}, var(--panel) 52%, ${alpha(homeHex, "38")})` }}>
          {detail.venueImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={detail.venueImage} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.2 }} />
          )}
          <div className="relative p-5 sm:p-7">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-5">
              <div className="flex items-center gap-2 flex-wrap">
                <Chip color="#c4b5fd">{g.weekLabel}</Chip>
                <span className="font-spot-mono font-extrabold text-[10px] tracking-[.08em]" style={{ color: "#c4b5fd" }}>{g.dateLabel} · {g.timeLabel} ET</span>
                <span className="font-spot-sans text-[10px]" style={{ color: "var(--text-3)" }}>{g.venue}</span>
              </div>
              {live ? <LiveBadge label={g.statusDetail} /> : final && <Chip color="#94a3b8">Final</Chip>}
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
              <div className="flex flex-col items-center gap-2">
                <LogoPlate hex={awayHex} src={nflLogoUrl(g.away)} code={g.away} size={84} radius={24} variant="clean" />
                <p className="font-spot-sans font-black text-[15px] sm:text-lg text-center leading-tight" style={{ color: "var(--text)" }}>{nflTeamName(g.away)}</p>
                <p className="font-spot-mono text-[10.5px]" style={{ color: "var(--text-muted)" }}>{g.awayRecord}</p>
                <p className="font-spot-sans text-[9.5px] text-center" style={{ color: "#c4b5fd" }}>{place(awayRow)}</p>
              </div>
              <div className="text-center">
                {g.status === "pre" ? <p className="font-spot-mono font-black text-2xl" style={{ color: "var(--text-ghost)" }}>@</p> : (
                  <p className="font-spot-mono font-black text-3xl sm:text-5xl tracking-tight" style={{ color: "var(--text)" }}>{g.awayScore}<span style={{ color: "var(--text-ghost)" }}> – </span>{g.homeScore}</p>
                )}
              </div>
              <div className="flex flex-col items-center gap-2">
                <LogoPlate hex={homeHex} src={nflLogoUrl(g.home)} code={g.home} size={84} radius={24} variant="clean" />
                <p className="font-spot-sans font-black text-[15px] sm:text-lg text-center leading-tight" style={{ color: "var(--text)" }}>{nflTeamName(g.home)}</p>
                <p className="font-spot-mono text-[10.5px]" style={{ color: "var(--text-muted)" }}>{g.homeRecord}</p>
                <p className="font-spot-sans text-[9.5px] text-center" style={{ color: "#c4b5fd" }}>{place(homeRow)}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-[auto_1fr] items-center">
              <div className="flex items-center gap-4">
                <Gauge value={g.edge} label={g.grade} color={gc} size={92} />
                <div className="sm:hidden"><p className="spot-label" style={{ color: "var(--purple-2)" }}>Model pick</p><p className="font-spot-sans font-black text-lg" style={{ color: "var(--text)" }}>{fav} ML</p></div>
              </div>
              <div className="flex flex-col gap-3">
                <ProbSplit awayLabel={g.away} homeLabel={g.home} homePct={model.homeWinProb} awayHex={awayHex} homeHex={homeHex} />
                <div className="hidden sm:flex items-center justify-between rounded-xl px-3.5 py-2.5" style={{ background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>
                  <span className="font-spot-sans font-extrabold text-[10px] uppercase tracking-[.12em]" style={{ color: "var(--purple-2)" }}>◆ AI Prediction</span>
                  <span className="font-spot-sans font-black text-[13px]" style={{ color: "var(--purple-soft)" }}>{fav} ML · {modelLine}{detail.predictorHome != null ? ` · ESPN ${detail.predictorHome}% ${g.home}` : ""}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mb-4"><Segmented id="nfl-game-tab" accent={ACCENT} value={tab} onChange={setTab} options={[{ key: "analysis", label: "Analysis" }, { key: "props", label: "Game props", badge: String(props.length) }]} /></div>

        {tab === "analysis" && (
          <div className="grid gap-4 lg:grid-cols-2 stagger">
            <Panel className="p-5">
              <p className="spot-label mb-3" style={{ color: "var(--text-faint)" }}>Lines vs. the model · {g.odds?.provider ?? "DraftKings"}</p>
              {g.odds ? (
                <>
                  <OddsStrip items={[
                    { label: "Spread", value: mktFav ? `${mktFav} -${Math.abs(mkt!)}` : "—" },
                    { label: "Total", value: g.odds.overUnder ? `O/U ${g.odds.overUnder}` : "—" },
                    { label: "Moneyline", value: `${g.away} ${g.odds.awayML ?? "—"}`, sub: `${g.home} ${g.odds.homeML ?? "—"}` },
                  ]} />
                  <div className="mt-3 rounded-xl p-3.5" style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--hairline)" }}>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div><p className="font-spot-mono font-black text-[16px]" style={{ color: "var(--text)" }}>{modelLine}</p><p className="font-spot-sans text-[9px] uppercase tracking-[.1em]" style={{ color: "var(--text-faint)" }}>Model spread</p></div>
                      <div><p className="font-spot-mono font-black text-[16px]" style={{ color: "var(--text)" }}>{model.projTotal}</p><p className="font-spot-sans text-[9px] uppercase tracking-[.1em]" style={{ color: "var(--text-faint)" }}>Proj. total</p></div>
                      <div><p className="font-spot-mono font-black text-[16px]" style={{ color: model.valuePts != null && Math.abs(model.valuePts) >= 2 ? "var(--green)" : "var(--text-3)" }}>{model.valuePts != null ? `${model.valuePts > 0 ? "+" : ""}${model.valuePts}` : "—"}</p><p className="font-spot-sans text-[9px] uppercase tracking-[.1em]" style={{ color: "var(--text-faint)" }}>Value (pts)</p></div>
                    </div>
                    <p className="mt-3 font-spot-sans text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      Model projects <b style={{ color: "var(--text-2)" }}>{g.away} {model.projAway} – {g.home} {model.projHome}</b>.
                      {g.odds.overUnder ? <> That total is {Math.abs(model.projTotal - g.odds.overUnder).toFixed(1)} pts {model.projTotal >= g.odds.overUnder ? "above" : "below"} the {g.odds.overUnder} market — a lean to the <b style={{ color: model.projTotal >= g.odds.overUnder ? "var(--green)" : "#fda4a4" }}>{model.projTotal >= g.odds.overUnder ? "over" : "under"}</b>.</> : null}
                      {model.valuePts != null && Math.abs(model.valuePts) >= 2 && <> The spread offers <b style={{ color: "var(--green)" }}>{Math.abs(model.valuePts)} pts of value</b> on {model.valuePts > 0 ? g.home : g.away}.</>}
                    </p>
                  </div>
                </>
              ) : <p className="font-spot-sans text-xs" style={{ color: "var(--text-muted)" }}>Market lines haven&rsquo;t posted. Model projects {g.away} {model.projAway} – {g.home} {model.projHome}.</p>}
            </Panel>

            {awayRow && homeRow && (
              <Panel className="p-5">
                <p className="spot-label mb-4" style={{ color: "var(--text-faint)" }}>Offense vs. defense · points per game</p>
                <div className="flex flex-col gap-4">
                  {[
                    { label: `${g.away} offense vs ${g.home} defense`, a: awayRow.ppg, h: homeRow.papg },
                    { label: `${g.home} offense vs ${g.away} defense`, a: homeRow.ppg, h: awayRow.papg },
                  ].map((r, i) => {
                    const tot = r.a + r.h || 1;
                    return <CompareBar key={r.label} label={r.label} away={String(r.a)} home={String(r.h)} awayPct={Math.round((r.a / tot) * 100)} homePct={Math.round((r.h / tot) * 100)} awayHex={i === 0 ? awayHex : homeHex} homeHex={i === 0 ? homeHex : awayHex} delay={i * 0.08} />;
                  })}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    {[{ t: g.away, r: awayRow }, { t: g.home, r: homeRow }].map(({ t, r }) => (
                      <div key={t} className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--hairline)" }}>
                        <p className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.1em]" style={{ color: nflTeamHex(t) }}>{t} · Edge Power</p>
                        <p className="font-spot-mono font-black text-[17px]" style={{ color: r.power >= 0 ? "var(--green)" : "var(--red-soft)" }}>{r.power > 0 ? "+" : ""}{r.power.toFixed(1)}</p>
                        <p className="font-spot-mono text-[10px]" style={{ color: "var(--text-muted)" }}>{r.streak} · diff {r.diff > 0 ? "+" : ""}{r.diff}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>
            )}

            {detail.teamStats.length > 0 && (
              <Panel className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <LogoPlate hex={awayHex} src={nflLogoUrl(g.away)} code={g.away} size={22} radius={6} variant="clean" />
                  <p className="spot-label" style={{ color: "var(--text-faint)" }}>Season team comparison</p>
                  <LogoPlate hex={homeHex} src={nflLogoUrl(g.home)} code={g.home} size={22} radius={6} variant="clean" />
                </div>
                <div className="flex flex-col gap-3.5">
                  {detail.teamStats.map((r, i) => <CompareBar key={r.label} label={r.label} away={r.away} home={r.home} awayPct={r.awayPct} homePct={r.homePct} awayHex={awayHex} homeHex={homeHex} delay={i * 0.06} />)}
                </div>
              </Panel>
            )}

            <div className="flex flex-col gap-4">
              {final && g.leaders.length > 0 && (
                <Panel className="p-5">
                  <p className="spot-label mb-3" style={{ color: "var(--text-faint)" }}>Top performers</p>
                  <div className="flex flex-col gap-2.5">
                    {g.leaders.map((l) => (
                      <div key={l.category} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--hairline)" }}>
                        <WnbaHeadshot hex={nflTeamHex(l.team)} src={nflHeadshotUrl(l.espnId)} name={l.player} size={50} radius={14} />
                        <div className="min-w-0 flex-1">
                          <p className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.1em]" style={{ color: nflTeamHex(l.team) }}>{l.team} · {l.category}</p>
                          <p className="font-spot-sans font-black text-[13px] truncate" style={{ color: "var(--text)" }}>{l.player}</p>
                          <p className="font-spot-mono font-bold text-[11px]" style={{ color: "var(--text-2)" }}>{l.line}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}
              <WinProbChart series={detail.winProbSeries} homeHex={homeHex} home={g.home} />
              {detail.injuries.length > 0 && (
                <Panel className="p-5">
                  <p className="spot-label mb-3" style={{ color: "var(--text-faint)" }}>Injury report</p>
                  <div className="flex flex-col gap-2">
                    {detail.injuries.map((x, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <LogoPlate hex={nflTeamHex(x.team)} src={nflLogoUrl(x.team)} code={x.team} size={22} radius={6} variant="clean" />
                        <span className="flex-1 font-spot-sans font-bold text-[12px] truncate" style={{ color: "var(--text-2)" }}>{x.player} <span className="text-[10px] font-normal" style={{ color: "var(--text-faint)" }}>{x.pos}</span></span>
                        <Chip color={/out|ir/i.test(x.status) ? "#f87171" : "#fbbf24"}>{x.status}</Chip>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}
            </div>
          </div>
        )}

        {tab === "props" && (
          <PaywallGate requiredTier="fan" feature="NFL Game Props" benefits={["Projections for every QB, RB, WR and TE in this game", "Hit probability, grade and the reasoning behind each lean"]}>
            {props.length === 0 ? <EmptyState title="No props for this game" body="Props are generated for games that haven't finished." /> : (
              <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">{props.map((p) => <NflPropCard key={p.id} p={p} />)}</div>
            )}
          </PaywallGate>
        )}
      </div>
    </div>
  );
}
