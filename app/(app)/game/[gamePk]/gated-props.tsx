"use client";

import Link from "next/link";
import { Lock, Zap, Check, ArrowRight } from "lucide-react";
import { playerHeadshotUrl } from "@/lib/mlb/api";
import { useSubscription } from "@/lib/subscription";

interface PropRowData {
  batterId: number;
  batterName: string;
  batterAvg: string;
  batterHr: number;
  pct: number;
  label: string;
  pitcherName: string;
}

function color(pct: number) {
  if (pct >= 65) return "#50C882";
  if (pct >= 40) return "#FF7828";
  return "#EB505A";
}

function Row({ row }: { row: PropRowData }) {
  const c = color(row.pct);
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0">
      <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 bg-white/5 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={playerHeadshotUrl(row.batterId)}
          alt={row.batterName}
          className="w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{row.batterName}</p>
        <p className="text-[10px] text-white/30 truncate">
          {row.batterAvg} AVG · {row.batterHr} HR · vs {row.pitcherName.split(" ").pop()}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-lg font-black" style={{ color: c }}>{row.pct}%</p>
        <p className="text-[9px] font-bold" style={{ color: `${c}80` }}>{row.label}</p>
      </div>
    </div>
  );
}

interface Props {
  title: string;
  rows: PropRowData[];
  freeCount?: number;
}

export function GatedPropList({ title, rows, freeCount = 2 }: Props) {
  const { isPro, isLoaded } = useSubscription();

  const free   = rows.slice(0, freeCount);
  const locked = rows.slice(freeCount);
  const isUnlocked = isPro;

  if (!isLoaded) return null;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111622] overflow-hidden">
      <div className="px-5 pt-5 pb-3 border-b border-white/[0.05]">
        <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-1">Prop Signals</p>
        <p className="text-sm font-black text-white">{title}</p>
      </div>

      <div className="px-5 py-1">
        {/* Always-free rows */}
        {free.map((r) => <Row key={r.batterId} row={r} />)}

        {/* Locked rows */}
        {locked.length > 0 && (
          isUnlocked ? (
            locked.map((r) => <Row key={r.batterId} row={r} />)
          ) : (
            <div className="relative">
              {/* Blurred preview — show up to 3 rows faded */}
              <div className="pointer-events-none select-none" style={{ filter: "blur(5px)", opacity: 0.35 }}>
                {locked.slice(0, 4).map((r) => <Row key={r.batterId} row={r} />)}
              </div>

              {/* Paywall overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111622]/80 backdrop-blur-[2px]">
                <div className="flex flex-col items-center text-center px-6 py-5">
                  <div className="w-10 h-10 rounded-2xl bg-[#FF7828]/15 border border-[#FF7828]/30 flex items-center justify-center mb-3">
                    <Lock size={18} className="text-[#FF7828]" strokeWidth={1.8} />
                  </div>
                  <p className="text-sm font-black text-white mb-0.5">
                    +{locked.length} more players locked
                  </p>
                  <p className="text-xs text-white/40 mb-4">
                    Unlock all prop signals with Fan plan
                  </p>
                  <div className="flex flex-col gap-2 w-full max-w-[220px]">
                    {[
                      "Full HR & hit prop rankings",
                      "Win probability model",
                      "Edge Report across all games",
                    ].map((b) => (
                      <div key={b} className="flex items-center gap-2">
                        <Check size={11} className="text-[#FF7828] shrink-0" strokeWidth={2.5} />
                        <span className="text-[11px] text-white/55 text-left">{b}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/upgrade?tier=fan"
                    className="mt-4 flex items-center gap-1.5 rounded-full bg-[#FF7828] text-white text-xs font-black px-5 py-2.5 hover:bg-[#FFA550] transition-colors shadow-[0_6px_20px_rgba(255,120,40,0.40)]"
                  >
                    <Zap size={12} strokeWidth={2.5} />
                    Unlock Fan — $4.99/mo
                    <ArrowRight size={11} strokeWidth={2.5} />
                  </Link>
                </div>
              </div>
            </div>
          )
        )}

        {rows.length === 0 && (
          <p className="text-white/30 text-sm py-6 text-center">No prop data yet</p>
        )}
      </div>
    </div>
  );
}

// ── Win probability — fan-gated ───────────────────────────────────────────────

interface WinProbProps {
  homeProb: number;
  awayTeam: string;
  homeTeam: string;
}

export function GatedWinProb({ homeProb, awayTeam, homeTeam }: WinProbProps) {
  const { isPro, isLoaded } = useSubscription();
  const awayProb = 100 - homeProb;

  if (!isLoaded) return null;

  if (!isPro) {
    return (
      <div className="rounded-2xl border border-[#FF7828]/20 bg-[#111622] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
          <p className="text-sm font-black text-white">Win Probability</p>
          <div className="flex items-center gap-1.5 rounded-full border border-[#FF7828]/30 bg-[#FF7828]/10 px-2.5 py-1">
            <Lock size={10} className="text-[#FF7828]" strokeWidth={2.5} />
            <span className="text-[10px] font-black text-[#FF7828]">FAN</span>
          </div>
        </div>
        <div className="px-5 py-5 flex flex-col items-center gap-4">
          {/* Blurred preview */}
          <div className="w-full pointer-events-none select-none" style={{ filter: "blur(8px)", opacity: 0.3 }}>
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-2">
              <div className="h-full rounded-l-full bg-[#818cf8]" style={{ width: `${awayProb}%` }} />
              <div className="h-full rounded-r-full bg-[#FF7828]" style={{ width: `${homeProb}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-center"><p className="text-xl font-black text-[#818cf8]">{awayProb}%</p><p className="text-[9px] text-white/25">Away</p></div>
              <div className="text-center"><p className="text-xl font-black text-[#FF7828]">{homeProb}%</p><p className="text-[9px] text-white/25">Home</p></div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-white/40 mb-3">Win probability is a <span className="text-[#FF7828] font-bold">Fan</span> feature</p>
            <Link
              href="/upgrade?tier=fan"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#FF7828] text-white text-xs font-black px-5 py-2.5 hover:bg-[#FFA550] transition-colors"
            >
              <Zap size={11} strokeWidth={2.5} />
              Unlock Fan — $4.99/mo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5">
      <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-4">Win Probability</p>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-white">{awayTeam.split(" ").pop()}</span>
        <span className="text-xs font-bold text-white">{homeTeam.split(" ").pop()}</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-2">
        <div className="h-full rounded-l-full bg-[#818cf8] transition-all" style={{ width: `${awayProb}%` }} />
        <div className="h-full rounded-r-full bg-[#FF7828] transition-all" style={{ width: `${homeProb}%` }} />
      </div>
      <div className="flex items-center justify-between">
        <div className="text-center">
          <p className="text-lg font-black text-[#818cf8]">{awayProb}%</p>
          <p className="text-[9px] text-white/25">Away</p>
        </div>
        <p className="text-[10px] text-white/20">Model estimate</p>
        <div className="text-center">
          <p className="text-lg font-black text-[#FF7828]">{homeProb}%</p>
          <p className="text-[9px] text-white/25">Home</p>
        </div>
      </div>
    </div>
  );
}
