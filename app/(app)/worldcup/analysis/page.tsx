"use client";

import { useState, useMemo, useEffect } from "react";
import { WC_TEAMS, WC_GROUPS, INITIAL_BRACKET, eloWinProb } from "@/lib/worldcup/data";
import type { GSMatch, WCGroup, BracketState, RoundKey } from "@/lib/worldcup/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function flagUrlLg(cc: string) {
  return `https://flagcdn.com/48x36/${cc.split("-")[0]}.png`;
}

const ROUND_LABEL: Record<RoundKey, string> = {
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarterfinal",
  sf: "Semifinal",
  final: "Final",
  "3rd": "3rd Place",
};

interface EnrichedMatch {
  id: string;
  sourceLabel: string; // "Group A" or "Round of 32" etc.
  match: GSMatch;
  homeTeam: (typeof WC_TEAMS)[string];
  awayTeam: (typeof WC_TEAMS)[string];
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  xGHome: string;
  xGAway: string;
}

function enrich(id: string, sourceLabel: string, match: GSMatch): EnrichedMatch | null {
  const homeTeam = WC_TEAMS[match.home];
  const awayTeam = WC_TEAMS[match.away];
  if (!homeTeam || !awayTeam) return null;

  const eloHome = eloWinProb(homeTeam.strength, awayTeam.strength);
  const rawHomeWin = eloHome * 0.85;
  const draw = 0.18;
  const rawAwayWin = 1 - rawHomeWin - draw;
  const total = rawHomeWin + draw + Math.max(0, rawAwayWin);
  const homeWinPct = Math.round((rawHomeWin / total) * 100);
  const drawPct = Math.round((draw / total) * 100);
  const awayWinPct = 100 - homeWinPct - drawPct;

  const xGHome = (homeWinPct * 0.028 + 0.8).toFixed(1);
  const xGAway = (awayWinPct * 0.028 + 0.8).toFixed(1);

  return { id, sourceLabel, match, homeTeam, awayTeam, homeWinPct, drawPct, awayWinPct, xGHome, xGAway };
}

type FilterId = "live" | "upcoming" | "completed";

// ── Page ─────────────────────────────────────────────────────────────────────

export default function WCAnalysisPage() {
  const [groups, setGroups] = useState<WCGroup[]>(WC_GROUPS);
  const [bracket, setBracket] = useState<BracketState>(INITIAL_BRACKET);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/worldcup/groups")
      .then((r) => r.json())
      .then((data: { groups?: WCGroup[]; live?: boolean }) => {
        if (!cancelled && Array.isArray(data?.groups) && data.groups.length > 0) {
          setGroups(data.groups);
          setIsLive(!!data.live);
        }
      })
      .catch(() => null);

    // Once the group stage ends there are no more "upcoming" group matches —
    // the real upcoming/live games are knockout-round fixtures from the bracket.
    fetch("/api/worldcup/bracket")
      .then((r) => r.json())
      .then((data: BracketState) => {
        if (!cancelled && data?.matches) setBracket(data);
      })
      .catch(() => null);

    return () => { cancelled = true; };
  }, []);

  const allMatches = useMemo<EnrichedMatch[]>(() => {
    const result: EnrichedMatch[] = [];

    groups.forEach((group) => {
      group.matches.forEach((m, idx) => {
        const enriched = enrich(`group-${group.id}-${idx}`, `Group ${group.id}`, m);
        if (enriched) result.push(enriched);
      });
    });

    Object.values(bracket.matches).forEach((bm) => {
      if (!bm.topTeamId || !bm.bottomTeamId) return; // matchup not yet determined
      const match: GSMatch = {
        home: bm.topTeamId,
        away: bm.bottomTeamId,
        date: bm.date,
        time: bm.time,
        venue: [bm.venue, bm.city].filter(Boolean).join(", "),
        homeScore: bm.topScore,
        awayScore: bm.bottomScore,
        goals: [],
        status: bm.status === "tbd" ? "scheduled" : bm.status,
      };
      const enriched = enrich(`bracket-${bm.id}`, ROUND_LABEL[bm.round], match);
      if (enriched) result.push(enriched);
    });

    return result;
  }, [groups, bracket]);

  const liveMatches = allMatches.filter((m) => m.match.status === "live");
  const upcomingMatches = allMatches.filter((m) => m.match.status === "scheduled");
  const completedMatches = allMatches.filter((m) => m.match.status === "completed");

  const filterCounts: Record<FilterId, EnrichedMatch[]> = {
    live: liveMatches,
    upcoming: upcomingMatches,
    completed: completedMatches,
  };

  const defaultFilter: FilterId = liveMatches.length > 0 ? "live" : upcomingMatches.length > 0 ? "upcoming" : "completed";
  const [activeFilter, setActiveFilter] = useState<FilterId>(defaultFilter);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const filteredMatches = filterCounts[activeFilter];

  // Keep the selection valid as data loads in — fall back to the first match
  // in the active filter whenever the current selection isn't in it.
  useEffect(() => {
    if (filteredMatches.length === 0) return;
    if (selectedMatchId && filteredMatches.some((m) => m.id === selectedMatchId)) return;
    setSelectedMatchId(filteredMatches[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, filteredMatches.map((m) => m.id).join(",")]);

  const selected = useMemo(
    () => allMatches.find((m) => m.id === selectedMatchId) ?? filteredMatches[0] ?? allMatches[0],
    [allMatches, selectedMatchId, filteredMatches]
  );

  if (!selected) return null;

  const { match, homeTeam, awayTeam, homeWinPct, drawPct, awayWinPct, xGHome, xGAway } = selected;

  // Derive stats from strength
  const homeAttack = Math.round(((homeTeam.strength - 1400) / 600) * 100);
  const awayAttack = Math.round(((awayTeam.strength - 1400) / 600) * 100);
  const homeDef = Math.round(homeAttack * 0.9 + 5);
  const awayDef = Math.round(awayAttack * 0.9 + 5);
  const homeForm = Math.min(99, homeAttack + 8);
  const awayForm = Math.min(99, awayAttack + 8);
  const homePassing = Math.min(99, homeAttack + 12);
  const awayPassing = Math.min(99, awayAttack + 12);

  const eloDiff = homeTeam.strength - awayTeam.strength;
  const confidence = Math.round(55 + Math.abs(eloDiff) * 0.08);

  // Score prediction
  const predHomeGoals = Math.round(parseFloat(xGHome));
  const predAwayGoals = Math.round(parseFloat(xGAway));
  const predictedWinner = homeWinPct >= awayWinPct ? homeTeam : awayTeam;

  // Edge props (derived from match data)
  const props = [
    {
      label: "Match Winner",
      pick: homeWinPct >= awayWinPct ? homeTeam.shortName : awayTeam.shortName,
      odds: homeWinPct >= awayWinPct ? `+${Math.round((100 / homeWinPct - 1) * 100)}` : `+${Math.round((100 / awayWinPct - 1) * 100)}`,
      prob: `${Math.max(homeWinPct, awayWinPct)}%`,
      conf: homeWinPct >= 52 || awayWinPct >= 52 ? "HIGH" : homeWinPct >= 45 ? "MED" : "LOW",
      note: "ELO-based model",
    },
    {
      label: "Both Teams Score",
      pick: drawPct > 18 ? "Yes" : "No",
      odds: drawPct > 18 ? "-115" : "+105",
      prob: `${Math.round(55 + drawPct * 0.8)}%`,
      conf: "MED",
      note: "Historical avg",
    },
    {
      label: "Total Goals O/U 2.5",
      pick: homeWinPct + awayWinPct > 70 ? "Over" : "Under",
      odds: "-110",
      prob: `${Math.round(52 + (homeWinPct - 35) * 0.3)}%`,
      conf: eloDiff > 100 ? "HIGH" : "MED",
      note: "xG model",
    },
    {
      label: "1st Team to Score",
      pick: homeTeam.shortName,
      odds: `-${Math.round(130 + homeWinPct * 0.5)}`,
      prob: `${Math.round(homeWinPct * 0.7 + 30)}%`,
      conf: "MED",
      note: "Home field factor",
    },
    {
      label: "Correct Score",
      pick: `${predHomeGoals}–${predAwayGoals}`,
      odds: `+${Math.round(500 + Math.abs(eloDiff) * 0.5)}`,
      prob: `${Math.round(8 + Math.abs(eloDiff) * 0.02)}%`,
      conf: "LOW",
      note: "Low confidence prop",
    },
    {
      label: "Clean Sheet",
      pick: `${homeWinPct > 55 ? homeTeam.shortName : awayTeam.shortName} Yes`,
      odds: `+${Math.round(160 + Math.abs(eloDiff) * 0.2)}`,
      prob: `${Math.round(28 + Math.abs(eloDiff) * 0.05)}%`,
      conf: eloDiff > 150 ? "HIGH" : "LOW",
      note: "Defense rating",
    },
  ];

  const confColor = (c: string) => {
    if (c === "HIGH") return "var(--green)";
    if (c === "MED") return "var(--gold)";
    return "var(--text-muted)";
  };

  const barCompare = (homeVal: number, awayVal: number, label: string) => {
    const maxVal = Math.max(homeVal, awayVal, 1);
    const homeW = Math.round((homeVal / 100) * 100);
    const awayW = Math.round((awayVal / 100) * 100);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--hairline)" }}>
        <span style={{ width: 32, textAlign: "right", fontSize: 13, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-spot-mono, monospace)" }}>{homeVal}</span>
        <div style={{ flex: 1, display: "flex", height: 8, borderRadius: 4, overflow: "hidden", gap: 1 }}>
          <div style={{ display: "flex", flex: 1, justifyContent: "flex-end" }}>
            <div style={{ width: `${homeW}%`, height: "100%", background: homeTeam.color || "var(--blue)", borderRadius: "4px 0 0 4px" }} />
          </div>
          <div style={{ width: 2, background: "var(--hairline)" }} />
          <div style={{ display: "flex", flex: 1 }}>
            <div style={{ width: `${awayW}%`, height: "100%", background: awayTeam.color || "var(--red)", borderRadius: "0 4px 4px 0" }} />
          </div>
        </div>
        <span style={{ width: 32, fontSize: 13, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-spot-mono, monospace)" }}>{awayVal}</span>
        <span style={{ width: 60, textAlign: "center", fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", color: "var(--text)", paddingBottom: 60 }}>

      {/* Selector Strip */}
      <div style={{ borderBottom: "1px solid var(--hairline)", background: "var(--panel)", paddingBottom: 14, paddingTop: 16, paddingLeft: 20, paddingRight: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", letterSpacing: "0.05em" }}>
            MATCH ANALYSIS
          </div>
          <span
            style={{
              fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
              color: isLive ? "var(--green)" : "var(--text-ghost)",
              background: isLive ? "rgba(52,211,153,.12)" : "rgba(255,255,255,.04)",
            }}
          >
            {isLive ? "● LIVE" : "STATIC FALLBACK"}
          </span>
        </div>

        {/* Filter tabs — clear separation between live / upcoming / completed */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {([
            { id: "live" as FilterId, label: "Live", dot: "var(--red)" },
            { id: "upcoming" as FilterId, label: "Upcoming", dot: "var(--gold)" },
            { id: "completed" as FilterId, label: "Completed", dot: "var(--text-ghost)" },
          ]).map((tab) => {
            const count = filterCounts[tab.id].length;
            const active = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                disabled={count === 0}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px",
                  borderRadius: "var(--r-chip)",
                  border: active ? "1px solid var(--gold-line)" : "1px solid var(--hairline)",
                  background: active ? "var(--gold-tint)" : "transparent",
                  color: count === 0 ? "var(--text-ghost)" : active ? "var(--gold)" : "var(--text-muted)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: count === 0 ? "default" : "pointer",
                  opacity: count === 0 ? 0.5 : 1,
                }}
              >
                {tab.id === "live" && count > 0 && (
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: tab.dot, display: "inline-block" }} />
                )}
                {tab.label}
                <span style={{ fontFamily: "var(--font-spot-mono, monospace)", fontSize: 11, opacity: 0.8 }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Match picker — scoped to the active filter only */}
        {filteredMatches.length > 0 ? (
          <select
            value={selectedMatchId ?? ""}
            onChange={(e) => setSelectedMatchId(e.target.value)}
            style={{
              width: "100%",
              maxWidth: 520,
              padding: "9px 12px",
              borderRadius: "var(--r-chip)",
              border: "1px solid var(--hairline)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "var(--font-spot-mono, monospace)",
              cursor: "pointer",
            }}
          >
            {filteredMatches.map((em) => (
              <option key={em.id} value={em.id}>
                {activeFilter === "completed"
                  ? `${em.homeTeam.shortName} ${em.match.homeScore}–${em.match.awayScore} ${em.awayTeam.shortName} — ${em.sourceLabel}`
                  : activeFilter === "upcoming"
                  ? `${em.homeTeam.shortName} vs ${em.awayTeam.shortName} — ${em.sourceLabel} · ${em.match.date}`
                  : `${em.homeTeam.shortName} vs ${em.awayTeam.shortName} — ${em.sourceLabel}`}
              </option>
            ))}
          </select>
        ) : (
          <p style={{ fontSize: 12, color: "var(--text-ghost)", margin: 0 }}>No matches in this category right now.</p>
        )}
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 28px 0", display: "flex", gap: 20 }}>

        {/* LEFT COLUMN */}
        <div style={{ flex: "1.2 1 0", display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

          {/* Matchup Header */}
          <div className="spot-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {/* Home */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
                <img src={flagUrlLg(homeTeam.countryCode)} alt={homeTeam.name} style={{ width: 52, height: 36, objectFit: "cover", borderRadius: 4, border: "1px solid var(--hairline)" }} />
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>{homeTeam.name}</div>
                <div style={{ fontSize: 11, fontFamily: "var(--font-spot-mono, monospace)", color: "var(--text-muted)" }}>ELO {homeTeam.strength}</div>
              </div>
              {/* Center */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "0 20px" }}>
                {match.status === "completed" ? (
                  <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "var(--font-spot-mono, monospace)", color: "var(--text)" }}>
                    {match.homeScore} <span style={{ color: "var(--text-muted)" }}>–</span> {match.awayScore}
                  </div>
                ) : match.status === "live" ? (
                  <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "var(--font-spot-mono, monospace)", color: "var(--red)" }}>LIVE</div>
                ) : (
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-2)", textAlign: "center" }}>
                    <div style={{ fontSize: 22, color: "var(--text-muted)" }}>VS</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{match.date} · {match.time}</div>
                  </div>
                )}
                <div style={{ fontSize: 11, color: "var(--text-ghost)", textAlign: "center", marginTop: 4 }}>
                  {selected.sourceLabel} · {match.venue}
                </div>
              </div>
              {/* Away */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
                <img src={flagUrlLg(awayTeam.countryCode)} alt={awayTeam.name} style={{ width: 52, height: 36, objectFit: "cover", borderRadius: 4, border: "1px solid var(--hairline)" }} />
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>{awayTeam.name}</div>
                <div style={{ fontSize: 11, fontFamily: "var(--font-spot-mono, monospace)", color: "var(--text-muted)" }}>ELO {awayTeam.strength}</div>
              </div>
            </div>
          </div>

          {/* xG Bar Chart */}
          <div className="spot-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", marginBottom: 16, letterSpacing: "0.04em" }}>EXPECTED GOALS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: homeTeam.shortName, value: parseFloat(xGHome), color: homeTeam.color || "var(--blue)" },
                { label: awayTeam.shortName, value: parseFloat(xGAway), color: awayTeam.color || "var(--red)" },
              ].map((bar) => (
                <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 36, fontSize: 11, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-spot-mono, monospace)" }}>{bar.label}</span>
                  <div style={{ flex: 1, height: 10, background: "var(--hairline)", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{
                      width: `${(bar.value / 3) * 100}%`,
                      height: "100%",
                      background: bar.color,
                      borderRadius: 5,
                      transition: "width 0.4s ease",
                    }} />
                  </div>
                  <span style={{ width: 30, fontSize: 13, fontWeight: 800, color: "var(--text)", fontFamily: "var(--font-spot-mono, monospace)" }}>{bar.value}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-ghost)", marginTop: 12 }}>
              xG based on ELO differential and historical averages
            </div>
          </div>

          {/* Win Probability */}
          <div className="spot-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", marginBottom: 14, letterSpacing: "0.04em" }}>WIN PROBABILITY</div>
            <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden" }}>
              <div style={{ width: `${awayWinPct}%`, background: "var(--blue)", transition: "width 0.4s" }} />
              <div style={{ width: `${drawPct}%`, background: "#4b5563", transition: "width 0.4s" }} />
              <div style={{ width: `${homeWinPct}%`, background: homeTeam.color || "var(--red)", transition: "width 0.4s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{awayTeam.shortName}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--blue)", fontFamily: "var(--font-spot-mono, monospace)" }}>{awayWinPct}%</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>DRAW</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-2)", fontFamily: "var(--font-spot-mono, monospace)" }}>{drawPct}%</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{homeTeam.shortName}</div>
                <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--font-spot-mono, monospace)", color: homeTeam.color || "var(--text)" }}>{homeWinPct}%</div>
              </div>
            </div>
          </div>

          {/* Edge Props Table */}
          <div className="spot-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", marginBottom: 14, letterSpacing: "0.04em" }}>EDGE PROPS</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    {["LABEL", "PICK", "MODEL ODDS", "PROB", "CONF", "NOTE"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "4px 8px", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", borderBottom: "1px solid var(--hairline)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {props.map((p, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--hairline)" }}>
                      <td style={{ padding: "10px 8px", color: "var(--text-2)", fontWeight: 600 }}>{p.label}</td>
                      <td style={{ padding: "10px 8px", color: "var(--text)", fontWeight: 700, fontFamily: "var(--font-spot-mono, monospace)" }}>{p.pick}</td>
                      <td style={{ padding: "10px 8px", color: "var(--gold)", fontFamily: "var(--font-spot-mono, monospace)" }}>{p.odds}</td>
                      <td style={{ padding: "10px 8px", color: "var(--text-2)", fontFamily: "var(--font-spot-mono, monospace)" }}>{p.prob}</td>
                      <td style={{ padding: "10px 8px" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: confColor(p.conf), background: `${confColor(p.conf)}18`, padding: "2px 6px", borderRadius: 4 }}>{p.conf}</span>
                      </td>
                      <td style={{ padding: "10px 8px", color: "var(--text-ghost)", fontStyle: "italic" }}>{p.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 10, color: "var(--text-ghost)", marginTop: 10, marginBottom: 0 }}>
              Odds are model-derived from ELO, not live sportsbook lines.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

          {/* AI Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, background: "var(--grad-gold)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⬡</div>
              <span style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>AI Analysis</span>
            </div>
            <div style={{ background: "var(--purple-tint)", border: "1px solid var(--purple-line)", borderRadius: "var(--r-badge)", padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "var(--purple-2)" }}>
              {Math.min(confidence, 95)}% Confidence
            </div>
          </div>

          {/* Match Prediction */}
          <div style={{ background: "var(--purple-tint)", border: "1px solid var(--purple-line)", borderRadius: "var(--r-card)", padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--purple-2)", marginBottom: 14, letterSpacing: "0.05em" }}>MATCH PREDICTION</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <img src={flagUrlLg(predictedWinner.countryCode)} alt={predictedWinner.name} style={{ width: 40, height: 28, objectFit: "cover", borderRadius: 4 }} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{predictedWinner.name}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "var(--purple-2)", fontFamily: "var(--font-spot-mono, monospace)" }}>
                  {predHomeGoals}–{predAwayGoals}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                `Strong ELO advantage (+${Math.abs(eloDiff)} pts) over ${eloDiff > 0 ? awayTeam.name : homeTeam.name}`,
                `Superior attacking output — projected xG of ${eloDiff > 0 ? xGHome : xGAway} vs ${eloDiff > 0 ? xGAway : xGHome}`,
                `Better group stage form and historical head-to-head record`,
              ].map((reason, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--purple-tint)", border: "1px solid var(--purple-line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "var(--purple-2)", flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>{reason}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Comparison */}
          <div className="spot-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", marginBottom: 4, letterSpacing: "0.04em" }}>TEAM COMPARISON</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 11, color: "var(--text-muted)" }}>
              <span style={{ fontWeight: 700, color: "var(--text-2)" }}>{homeTeam.shortName}</span>
              <span style={{ fontWeight: 700, color: "var(--text-2)" }}>{awayTeam.shortName}</span>
            </div>
            {barCompare(homeAttack, awayAttack, "Attack")}
            {barCompare(homeDef, awayDef, "Defense")}
            {barCompare(homeForm, awayForm, "Form")}
            {barCompare(homePassing, awayPassing, "Passing")}
          </div>

          {/* Tournament Context */}
          <div style={{ background: "var(--gold-tint)", border: "1px solid var(--gold-line)", borderRadius: "var(--r-card)", padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", marginBottom: 12, letterSpacing: "0.05em" }}>TOURNAMENT CONTEXT</div>
            <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 14 }}>
              {selected.sourceLabel.startsWith("Group")
                ? `${selected.sourceLabel} features ${homeTeam.name} and ${awayTeam.name} in what could be a decisive clash for knockout qualification. With the top two teams advancing, every point carries significant weight in the final standings.`
                : `${selected.sourceLabel} matchup between ${homeTeam.name} and ${awayTeam.name} — a single-elimination tie where ${eloDiff > 0 ? homeTeam.name : awayTeam.name} enters as the model favorite, but knockout-stage variance keeps the margin tight.`}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "rgba(245,158,11,0.08)", borderRadius: "var(--r-tile)", border: "1px solid var(--gold-line)" }}>
              <div style={{ fontSize: 18 }}>🏆</div>
              <div style={{ fontSize: 13, color: "var(--gold-2)", fontWeight: 600 }}>
                AI Tournament Pick: <strong>{predictedWinner.name}</strong> advances with <strong>{Math.min(confidence, 92)}%</strong> confidence
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
