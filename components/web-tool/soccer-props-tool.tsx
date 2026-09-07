"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { BookmarkPlus, Check, Target, ChevronRight } from "lucide-react";
import type { SoccerPlayerProp, SoccerPropType, SoccerLeagueKey } from "@/lib/soccer/types";
import { soccerGradeColor, getSoccerPlayerProps } from "@/lib/soccer/analytics";
import { soccerHeadshotUrl, leagueDef, SOCCER_LEAGUES } from "@/lib/soccer/leagues";
import { saveSlip } from "@/lib/saved-slips";

const PROP_TABS: { key: SoccerPropType | "all"; label: string }[] = [
  { key: "all",     label: "All"     },
  { key: "goals",   label: "Goals"   },
  { key: "shots",   label: "Shots"   },
  { key: "assists", label: "Assists" },
  { key: "cards",   label: "Cards"   },
];

function PlayerSilhouette({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 60 72" width="100%" height="100%" fill="none">
      <circle cx="30" cy="20" r="13" fill={color} opacity="0.55" />
      <path d="M6 72c0-15.464 10.745-28 24-28s24 12.536 24 28" fill={color} opacity="0.35" />
    </svg>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const color = soccerGradeColor(grade);
  return (
    <span className="rounded-lg px-2 py-0.5 font-spot-sans font-black text-[11px]"
      style={{ color, background: `${color}1a`, border: `1px solid ${color}40` }}>
      {grade}
    </span>
  );
}

function PropCard({ prop, inSlip, onToggle }: {
  prop: SoccerPlayerProp;
  inSlip: boolean;
  onToggle: () => void;
}) {
  const gc = soccerGradeColor(prop.grade);
  const sideGreen = prop.side === "OVER" || prop.side === "YES";
  const barPct = Math.min(96, Math.max(4, Math.round((prop.modelProj / (prop.line * 2)) * 100)));

  return (
    <div className="rounded-[18px] overflow-hidden flex flex-col"
      style={{ background: "var(--panel)", border: inSlip ? `1px solid ${gc}55` : "1px solid var(--hairline)" }}>
      <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${prop.teamHex}, ${gc})` }} />

      {/* Player identity row */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3.5"
        style={{ background: `linear-gradient(135deg, ${prop.teamHex}16, transparent 55%)` }}>

        {/* Headshot */}
        <div className="relative shrink-0 w-[68px] h-[68px] rounded-2xl overflow-hidden"
          style={{ background: `${prop.teamHex}25`, border: `1.5px solid ${prop.teamHex}40` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={soccerHeadshotUrl(prop.espnPlayerId)}
            alt={prop.playerName}
            className="absolute inset-0 w-full h-full object-cover object-top"
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              el.style.display = "none";
              const fb = el.nextElementSibling as HTMLElement | null;
              if (fb) fb.style.display = "block";
            }}
          />
          <div style={{ display: "none" }} className="absolute inset-0">
            <PlayerSilhouette color={prop.teamHex} />
          </div>
          {/* Team logo badge */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={prop.teamLogo} alt="" className="absolute bottom-0.5 right-0.5 w-[18px] h-[18px] object-contain rounded"
            style={{ background: "rgba(0,0,0,.55)", padding: "2px" }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-1.5">
            <p className="font-spot-sans font-black text-[15px] leading-tight" style={{ color: "var(--text)" }}>
              {prop.playerName}
            </p>
            <GradeBadge grade={prop.grade} />
          </div>
          <p className="font-spot-sans text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            {prop.position} · {prop.teamAbbr}
          </p>
          {/* vs opponent pill */}
          <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5"
            style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}>
            <span className="font-spot-mono font-bold text-[9px] uppercase tracking-[.1em]" style={{ color: "var(--text-dim)" }}>vs</span>
            <span className="font-spot-sans font-extrabold text-[10px]" style={{ color: "var(--text-2)" }}>{prop.opponent}</span>
            <span className="font-spot-mono text-[9px]" style={{ color: "var(--text-faint)" }}>· {prop.matchDate}</span>
          </div>
        </div>
      </div>

      {/* Prop market + bar */}
      <div className="px-4 py-3 border-t border-white/[0.05]">
        <div className="flex items-center justify-between mb-2">
          <p className="font-spot-sans font-extrabold text-[11px] uppercase tracking-[.08em]" style={{ color: "var(--text-muted)" }}>
            {prop.market}
          </p>
          <span className="rounded-lg px-2.5 py-1 font-spot-sans font-extrabold text-[11px]"
            style={sideGreen
              ? { color: "var(--green)", background: "var(--green-bg)", border: "1px solid rgba(52,211,153,.3)" }
              : { color: "#fda4a4", background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.3)" }}>
            {prop.side} {prop.line}
          </span>
        </div>

        {/* Bar viz */}
        <div className="relative h-9 rounded-xl overflow-hidden"
          style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)" }}>
          <div className="absolute inset-y-0 left-0 rounded-xl transition-all"
            style={{ width: `${barPct}%`, background: `${gc}25` }} />
          <div className="absolute inset-y-0 w-px" style={{ left: "50%", background: "rgba(255,255,255,.2)" }} />
          <div className="absolute top-1" style={{ left: "50%", transform: "translateX(-50%)" }}>
            <span className="font-spot-mono font-bold text-[9px] px-1 rounded" style={{ color: "var(--text-dim)", background: "rgba(11,13,21,.7)" }}>
              Line {prop.line}
            </span>
          </div>
          <div className="absolute inset-y-0 flex items-center" style={{ left: `${barPct}%`, transform: "translateX(-110%)" }}>
            <span className="font-spot-mono font-black text-[14px]" style={{ color: gc }}>{prop.modelProj}</span>
          </div>
          <div className="absolute bottom-1 left-2">
            <span className="font-spot-mono font-bold text-[8px] uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>PROJ</span>
          </div>
        </div>
      </div>

      {/* Action row */}
      <div className="px-4 pb-4 flex items-center gap-2">
        <span className="font-spot-mono font-bold text-[12px]" style={{ color: "var(--text-muted)" }}>{prop.odds}</span>
        <button onClick={onToggle}
          className="flex-1 rounded-xl py-2.5 font-spot-sans font-extrabold text-[11px] text-center transition-all"
          style={inSlip
            ? { color: "var(--green)", background: "var(--green-bg)", border: "1px solid rgba(52,211,153,.32)" }
            : { color: "var(--purple-soft)", background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>
          {inSlip ? "✓ In Slip" : "+ Add to Slip"}
        </button>
      </div>
    </div>
  );
}

export function SoccerPropsTool() {
  const allProps = useMemo(() => getSoccerPlayerProps(), []);
  const [propType, setPropType] = useState<SoccerPropType | "all">("all");
  const [slip, setSlip] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const filtered = useMemo(() =>
    propType === "all" ? allProps : allProps.filter((p) => p.propType === propType),
    [allProps, propType]
  );

  // Group by league (preserving SOCCER_LEAGUES order), then by matchup
  const byLeague = useMemo(() => {
    return SOCCER_LEAGUES
      .map((league) => {
        const leagueProps = filtered.filter((p) => p.league === league.key);
        if (!leagueProps.length) return null;

        // Group by matchup
        const matchupMap = new Map<string, { matchup: string; date: string; props: SoccerPlayerProp[] }>();
        for (const p of leagueProps) {
          if (!matchupMap.has(p.matchup)) {
            matchupMap.set(p.matchup, { matchup: p.matchup, date: p.matchDate, props: [] });
          }
          matchupMap.get(p.matchup)!.props.push(p);
        }
        return { league, matchups: Array.from(matchupMap.values()) };
      })
      .filter(Boolean) as { league: typeof SOCCER_LEAGUES[0]; matchups: { matchup: string; date: string; props: SoccerPlayerProp[] }[] }[];
  }, [filtered]);

  const slipProps = useMemo(() => allProps.filter((p) => slip.includes(p.id)), [allProps, slip]);
  const slipEdge = slipProps.length
    ? Math.round(slipProps.reduce((s, p) => s + p.edge, 0) / slipProps.length)
    : 0;
  const slipPayout = slipProps.length ? `${(Math.pow(1.72, slipProps.length)).toFixed(2)}x` : "0x";

  function toggle(id: string) {
    setSlip((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function handleSave() {
    const legs = slipProps.map((p) => ({
      id: p.id, player: p.playerName, team: p.teamAbbr,
      market: p.market, side: p.side, line: p.line,
      model: p.modelProj, grade: p.grade, odds: p.odds,
    }));
    saveSlip({ sport: "Soccer", legs, combinedPayout: slipPayout, avgEdge: slipEdge });
    setSaved(true);
    setTimeout(() => { setSaved(false); setSlip([]); }, 2000);
  }

  return (
    <div className="spotlight min-h-screen">
      {/* Header */}
      <div style={{ background: "var(--panel)", borderBottom: "1px solid var(--hairline)" }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="spot-label mb-0.5" style={{ color: "var(--green)" }}>PROP PROJECTIONS</p>
              <h1 className="font-spot-sans font-black text-2xl sm:text-3xl uppercase leading-tight" style={{ color: "var(--text)", letterSpacing: "-.01em" }}>
                Soccer Props
              </h1>
              <p className="mt-1 font-spot-sans text-[12px]" style={{ color: "var(--text-muted)" }}>
                Goals · shots · assists · cards · model vs the book by league
              </p>
            </div>
            <Link href="/soccer"
              className="hidden sm:flex items-center gap-1.5 rounded-xl px-4 py-2 font-spot-sans font-extrabold text-[12px] transition-all hover:opacity-80"
              style={{ background: "var(--panel-2)", color: "var(--text-muted)", border: "1px solid var(--hairline)" }}>
              Fixtures &rarr;
            </Link>
          </div>

          {/* Prop type filter */}
          <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-0.5 scrollbar-none">
            {PROP_TABS.map((t) => (
              <button key={t.key} onClick={() => setPropType(t.key)}
                className="shrink-0 rounded-full px-3.5 py-1.5 font-spot-sans font-bold text-[11px] transition-all"
                style={propType === t.key
                  ? { background: "var(--green-bg)", color: "var(--green)", border: "1px solid rgba(52,211,153,.3)" }
                  : { background: "var(--panel-2)", color: "var(--text-muted)", border: "1px solid var(--hairline)" }}>
                {t.label}
              </button>
            ))}
            <span className="ml-auto shrink-0 font-spot-mono font-bold text-[10px]" style={{ color: "var(--text-faint)" }}>
              {filtered.length} props
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5 space-y-8">
        {byLeague.length > 0 ? byLeague.map(({ league: def, matchups }) => (
          <section key={def.key}>
            {/* League header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-[3px] h-6 rounded-full" style={{ background: def.color }} />
              <div>
                <p className="font-spot-sans font-black text-[15px] uppercase tracking-[-0.01em]" style={{ color: "var(--text)" }}>
                  {def.label}
                </p>
                <p className="font-spot-sans text-[10px]" style={{ color: "var(--text-faint)" }}>{def.country}</p>
              </div>
              <div className="flex-1 h-px" style={{ background: `${def.color}30` }} />
              <Link href={`/soccer?league=${def.key}`}
                className="flex items-center gap-1 font-spot-sans font-extrabold text-[10px] shrink-0"
                style={{ color: def.color === "#091c3e" || def.color === "#001d5b" ? "#93c5fd" : def.color }}>
                Fixtures <ChevronRight size={10} />
              </Link>
            </div>

            {/* Matchup sections */}
            {matchups.map(({ matchup, date, props: matchupProps }) => (
              <div key={matchup} className="mb-6">
                {/* Matchup header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="font-spot-sans font-extrabold text-[12px]" style={{ color: "var(--text-2)" }}>
                    {matchup}
                  </span>
                  <span className="font-spot-mono text-[10px]" style={{ color: "var(--text-faint)" }}>· {date}</span>
                  <span className="font-spot-mono font-bold text-[9px] rounded-full px-2 py-0.5 ml-auto"
                    style={{ color: "var(--text-dim)", background: "var(--panel-2)", border: "1px solid var(--hairline)" }}>
                    {matchupProps.length} props
                  </span>
                </div>

                <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
                  {matchupProps.map((p) => (
                    <PropCard key={p.id} prop={p} inSlip={slip.includes(p.id)} onToggle={() => toggle(p.id)} />
                  ))}
                </div>
              </div>
            ))}
          </section>
        )) : (
          <div className="text-center py-20">
            <div className="flex justify-center mb-3"><Target size={36} style={{ color: "var(--text-dim)" }} /></div>
            <p className="font-spot-sans font-bold text-sm" style={{ color: "var(--text-muted)" }}>No props match your filters</p>
          </div>
        )}
      </div>

      {/* Slip bar */}
      {slip.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-4" style={{ pointerEvents: "none" }}>
          <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-3 rounded-2xl px-5 py-3.5"
            style={{ background: "rgba(11,13,21,.96)", border: "1px solid rgba(52,211,153,.3)", backdropFilter: "blur(16px)", boxShadow: "0 20px 60px rgba(0,0,0,.65)", pointerEvents: "auto" }}>
            <div>
              <span className="font-spot-sans font-black text-[13px]" style={{ color: "var(--text)" }}>
                <span style={{ color: "var(--green)" }}>{slip.length}</span>-leg parlay
              </span>
              <span className="ml-2.5 font-spot-sans font-semibold text-[12px]" style={{ color: "var(--text-muted)" }}>
                Avg edge <span className="font-spot-mono font-extrabold" style={{ color: "var(--green)" }}>{slipEdge}</span>
                {" "}· Payout <span className="font-spot-mono font-extrabold" style={{ color: "var(--text)" }}>{slipPayout}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSave}
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-spot-sans font-extrabold text-[11px] transition-all"
                style={{ background: saved ? "var(--green-bg)" : "rgba(52,211,153,.12)", color: saved ? "var(--green)" : "#34d399", border: `1px solid ${saved ? "rgba(52,211,153,.4)" : "rgba(52,211,153,.28)"}` }}>
                {saved ? <Check size={12} /> : <BookmarkPlus size={12} />}
                {saved ? "Saved!" : "Save Slip"}
              </button>
              <button onClick={() => setSlip([])} className="font-spot-sans font-bold text-xs" style={{ color: "var(--text-dim)" }}>Clear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
