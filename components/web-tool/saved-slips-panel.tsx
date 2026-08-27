"use client";

import { useEffect, useState } from "react";
import { loadSavedSlips, deleteSlip, type SavedSlip, type SlipSport } from "@/lib/saved-slips";
import { BookmarkCheck, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const SPORT_COLOR: Record<SlipSport, string> = {
  MLB: "#f97316",
  NFL: "#a78bfa",
  WNBA: "#2dd4bf",
};

const SPORT_EMOJI: Record<SlipSport, string> = { MLB: "⚾", NFL: "🏈", WNBA: "🏀" };

export function SavedSlipsPanel() {
  const [slips, setSlips] = useState<SavedSlip[]>([]);
  const [sport, setSport] = useState<SlipSport | "All">("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setSlips(loadSavedSlips());
  }, []);

  const filtered = sport === "All" ? slips : slips.filter((s) => s.sport === sport);
  const sports: SlipSport[] = ["MLB", "NFL", "WNBA"];
  const hasSport = (sp: SlipSport) => slips.some((s) => s.sport === sp);

  function remove(id: string) {
    deleteSlip(id);
    setSlips((prev) => prev.filter((s) => s.id !== id));
    if (expanded === id) setExpanded(null);
  }

  if (slips.length === 0) return null;

  return (
    <div className="rounded-[20px] overflow-hidden" style={{ background: "var(--panel)", border: "1px solid var(--hairline)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--hairline)" }}>
        <div className="flex items-center gap-2">
          <BookmarkCheck size={16} style={{ color: "var(--orange)" }} />
          <span className="font-spot-sans font-extrabold text-sm" style={{ color: "var(--text)" }}>Your Saved Slips</span>
          <span className="font-spot-mono font-bold text-[10px] px-1.5 py-0.5 rounded-full"
            style={{ color: "var(--text-muted)", background: "rgba(255,255,255,.06)", border: "1px solid var(--hairline)" }}>
            {slips.length}
          </span>
        </div>
        {/* Sport filter */}
        <div className="flex gap-1.5">
          {(["All", ...sports.filter(hasSport)] as (SlipSport | "All")[]).map((sp) => {
            const active = sp === sport;
            const color = sp !== "All" ? SPORT_COLOR[sp as SlipSport] : "var(--text-muted)";
            return (
              <button key={sp} onClick={() => setSport(sp)}
                className="font-spot-sans font-extrabold text-[10px] uppercase tracking-[.08em] px-2 py-1 rounded-full transition-all"
                style={active
                  ? { background: sp !== "All" ? `${SPORT_COLOR[sp as SlipSport]}22` : "rgba(255,255,255,.08)", color, border: `1px solid ${sp !== "All" ? `${SPORT_COLOR[sp as SlipSport]}40` : "rgba(255,255,255,.14)"}` }
                  : { color: "var(--text-dim)" }}>
                {sp === "All" ? "All" : `${SPORT_EMOJI[sp as SlipSport]} ${sp}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slip list */}
      <div className="divide-y" style={{ borderColor: "var(--hairline)" }}>
        {filtered.length === 0 ? (
          <p className="px-5 py-6 font-spot-sans text-sm text-center" style={{ color: "var(--text-muted)" }}>
            No {sport !== "All" ? sport : ""} slips saved yet
          </p>
        ) : (
          filtered.map((s) => {
            const color = SPORT_COLOR[s.sport];
            const isExpanded = expanded === s.id;
            const date = new Date(s.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
            return (
              <div key={s.id}>
                <div className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-white/[.02] transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : s.id)}>
                  {/* Sport badge */}
                  <span className="font-spot-sans font-extrabold text-[9px] uppercase tracking-[.10em] px-2 py-0.5 rounded-full shrink-0"
                    style={{ color, background: `${color}18`, border: `1px solid ${color}35` }}>
                    {SPORT_EMOJI[s.sport]} {s.sport}
                  </span>
                  {/* Legs summary */}
                  <div className="flex-1 min-w-0">
                    <p className="font-spot-sans font-extrabold text-[12px] leading-tight truncate" style={{ color: "var(--text)" }}>
                      {s.legs.map((l) => l.player.split(" ").pop()).join(", ")}
                    </p>
                    <p className="font-spot-mono text-[9px] mt-0.5" style={{ color: "var(--text-dim)" }}>{date}</p>
                  </div>
                  {/* Payout */}
                  <div className="text-right shrink-0">
                    <p className="font-spot-mono font-extrabold text-sm" style={{ color }}>{s.combinedPayout}</p>
                    <p className="font-spot-sans text-[9px]" style={{ color: "var(--text-dim)" }}>{s.legs.length}-leg</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); remove(s.id); }} className="shrink-0 ml-1 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-dim)" }}>
                    <Trash2 size={12} />
                  </button>
                  {isExpanded ? <ChevronUp size={14} style={{ color: "var(--text-dim)", flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: "var(--text-dim)", flexShrink: 0 }} />}
                </div>

                {/* Expanded leg detail */}
                {isExpanded && (
                  <div className="px-5 pb-3 space-y-1.5">
                    {s.legs.map((leg) => (
                      <div key={leg.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                        style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--hairline)" }}>
                        <div>
                          <p className="font-spot-sans font-extrabold text-[11px]" style={{ color: "var(--text)" }}>{leg.player}</p>
                          <p className="font-spot-sans text-[9px]" style={{ color: "var(--text-muted)" }}>{leg.market} · {leg.team}</p>
                        </div>
                        <div className="flex-1" />
                        <span className="font-spot-sans font-extrabold text-[10px] px-2 py-0.5 rounded-lg"
                          style={leg.side === "OVER" || leg.side === "YES"
                            ? { color: "var(--green)", background: "var(--green-bg)", border: "1px solid rgba(52,211,153,.25)" }
                            : { color: "#fda4a4", background: "var(--red-bg)", border: "1px solid rgba(239,68,68,.25)" }}>
                          {leg.side} {leg.line}
                        </span>
                        <span className="font-spot-sans font-extrabold text-[10px]" style={{ color: `${color}` }}>{leg.grade}</span>
                        <button onClick={() => remove(s.id)} className="ml-1" style={{ color: "var(--text-ghost)" }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
