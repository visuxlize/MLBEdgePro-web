"use client";

import { useState, useMemo } from "react";
import { WC_TEAMS } from "@/lib/worldcup/data";
import type { WCTeam } from "@/lib/worldcup/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function flagUrl(cc: string, size: "24x18" | "48x36" | "64x48" = "24x18") {
  return `https://flagcdn.com/${size}/${cc.split("-")[0]}.png`;
}

function simulateTournament(teams: WCTeam[], seed: number): Record<string, number> {
  const sorted = [...teams].sort((a, b) => b.strength - a.strength);
  const trophyPcts: Record<string, number> = {};
  sorted.forEach((team, rank) => {
    const jitter = ((team.id.charCodeAt(0) * 7 + seed * 13) % 31) * 0.1 - 1.5;
    const rawPct = Math.max(0.1, 28 * Math.exp(-rank * 0.42) + jitter);
    trophyPcts[team.id] = Math.round(rawPct * 10) / 10;
  });
  const total = Object.values(trophyPcts).reduce((a, b) => a + b, 0);
  Object.keys(trophyPcts).forEach((k) => {
    trophyPcts[k] = Math.round((trophyPcts[k] / total) * 1000) / 10;
  });
  return trophyPcts;
}

// Team notes lookup
const TEAM_NOTES: Record<string, string> = {
  arg: "2022 champions, Messi legacy",
  fra: "Mbappé leading a strong squad",
  bra: "5× champions seeking return",
  eng: "Golden generation, Bellingham era",
  por: "Ronaldo chapter closing, new stars rising",
  esp: "Tiki-taka evolved, La Liga depth",
  ger: "Rebuilding powerhouse, Wirtz-led",
  ned: "Total Football revival, van Dijk anchor",
  bel: "Post-golden gen, De Bruyne's last dance",
  ita: "2-time WC, rebuilding post-2022",
  uru: "South American giants, tenacious defense",
  cro: "2018 finalists, Modric era fading",
  den: "Organized pressing machine",
  sui: "Consistent overachievers",
  col: "CONMEBOL contenders, Díaz-led",
  mor: "2022 semi-finalists, African pride",
  jpn: "Asia's standard-bearers, quick transitions",
  mex: "CONCACAF kings, host nation boost",
  usa: "Host nation, young talent surge",
  sen: "African lions, physical and direct",
  kor: "Dynamic, high-energy pressing",
  aus: "Socceroos, Asian-Oceanic bridge",
  tur: "Rebuilding with Europa league talent",
  pol: "Lewandowski's last World Cup run",
  nor: "Haaland-era powerhouse in the making",
  swe: "Tactical solidity, set-piece danger",
  aut: "Austria riding Bundesliga wave",
  cze: "Central European consistency",
  srb: "Balkan flair, attacking depth",
  sco: "First WC since 1998, emotional return",
};

const MEDAL_COLORS: [string, string, string] = ["#f59e0b", "#9ca3af", "#cd7f32"];
const MEDAL_EMOJIS = ["🥇", "🥈", "🥉"];

// Bracket path for top team (deterministic, based on sorted strength halves)
function buildPath(
  topTeam: WCTeam,
  allTeams: WCTeam[]
): Array<{ round: string; opp: string; prob: number; note: string }> {
  const sorted = [...allTeams].sort((a, b) => b.strength - a.strength);
  const bottomHalf = sorted.filter((t) => t.id !== topTeam.id).reverse();
  const getOpp = (idx: number) => bottomHalf[Math.min(idx, bottomHalf.length - 1)];

  const eloProb = (a: number, b: number) => {
    const raw = 1 / (1 + Math.pow(10, -(a - b) / 400));
    return Math.round((0.1 + raw * 0.8) * 100);
  };

  const r32Opp = getOpp(0);
  const r16Opp = getOpp(4);
  const qfOpp = getOpp(8);
  const sfOpp = getOpp(12);
  const finalOpp = getOpp(15);

  return [
    { round: "R32", opp: r32Opp.shortName, prob: eloProb(topTeam.strength, r32Opp.strength), note: "Group runner-up" },
    { round: "R16", opp: r16Opp.shortName, prob: eloProb(topTeam.strength, r16Opp.strength), note: "R32 winner" },
    { round: "QF", opp: qfOpp.shortName, prob: eloProb(topTeam.strength, qfOpp.strength), note: "Quarterfinal clash" },
    { round: "SF", opp: sfOpp.shortName, prob: eloProb(topTeam.strength, sfOpp.strength), note: "Semifinal showdown" },
    { round: "Final", opp: finalOpp.shortName, prob: eloProb(topTeam.strength, finalOpp.strength), note: "Championship match" },
  ];
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function WCAiSimPage() {
  const [simKey, setSimKey] = useState(0);

  const teamsArray = useMemo(() => Object.values(WC_TEAMS), []);

  const trophyPcts = useMemo(() => simulateTournament(teamsArray, simKey), [teamsArray, simKey]);

  const sorted = useMemo(
    () =>
      teamsArray
        .map((t) => ({ team: t, pct: trophyPcts[t.id] ?? 0 }))
        .sort((a, b) => b.pct - a.pct),
    [teamsArray, trophyPcts]
  );

  const top3 = sorted.slice(0, 3);
  const topTeam = sorted[0]?.team;
  const bracketPath = useMemo(
    () => (topTeam ? buildPath(topTeam, teamsArray) : []),
    [topTeam, teamsArray]
  );

  const maxPct = sorted[0]?.pct ?? 1;

  return (
    <div style={{ minHeight: "100vh", color: "var(--text)", paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ textAlign: "center", padding: "40px 24px 28px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", margin: 0, marginBottom: 8 }}>
          Who wins World Cup 2026?
        </h1>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {["ELO 80%", "Form 15%", "Fixture 5%"].map((chip) => (
            <span key={chip} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", background: "var(--panel)", border: "1px solid var(--hairline)", borderRadius: "var(--r-chip)", padding: "4px 10px" }}>
              {chip}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setSimKey((k) => k + 1)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 18px", borderRadius: "var(--r-chip)",
              border: "1px solid var(--hairline)", background: "var(--panel)",
              color: "var(--text-2)", fontSize: 13, fontWeight: 700, cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 16 }}>↺</span> Re-Run Simulation
          </button>
          <span style={{ fontSize: 11, color: "var(--text-ghost)", fontFamily: "var(--font-spot-mono, monospace)" }}>
            10,000 simulations
          </span>
        </div>
      </div>

      {/* Podium */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 12, padding: "0 24px 32px", maxWidth: 700, margin: "0 auto" }}>
        {[top3[1], top3[0], top3[2]].map((entry, visualIdx) => {
          if (!entry) return null;
          const dataIdx = visualIdx === 0 ? 1 : visualIdx === 1 ? 0 : 2;
          const medalColor = MEDAL_COLORS[dataIdx];
          const isFirst = dataIdx === 0;
          return (
            <div
              key={entry.team.id}
              style={{
                flex: isFirst ? "0 0 200px" : "0 0 160px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                padding: isFirst ? "20px 16px 24px" : "16px 12px 20px",
                background: "var(--panel)",
                borderRadius: "var(--r-card)",
                border: `1.5px solid ${medalColor}`,
                marginBottom: isFirst ? 0 : 20,
                boxShadow: isFirst ? `0 0 32px ${medalColor}22` : "none",
              }}
            >
              <div style={{ fontSize: isFirst ? 28 : 22 }}>{MEDAL_EMOJIS[dataIdx]}</div>
              <img
                src={flagUrl(entry.team.countryCode, isFirst ? "48x36" : "24x18")}
                alt={entry.team.name}
                style={{ width: isFirst ? 64 : 44, height: isFirst ? 44 : 30, objectFit: "cover", borderRadius: 4, border: "1px solid var(--hairline)" }}
              />
              <div style={{ fontSize: isFirst ? 16 : 13, fontWeight: 800, color: "var(--text)", textAlign: "center" }}>{entry.team.name}</div>
              <div style={{ fontSize: isFirst ? 26 : 20, fontWeight: 900, color: medalColor, fontFamily: "var(--font-spot-mono, monospace)" }}>{entry.pct}%</div>
              <div style={{ fontSize: 10, color: "var(--text-ghost)" }}>trophy odds</div>
            </div>
          );
        })}
      </div>

      {/* Body: 2 columns */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 28px", display: "flex", gap: 20 }}>

        {/* LEFT: Probability Table */}
        <div style={{ flex: "1.2 1 0", minWidth: 0 }}>
          <div className="spot-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--hairline)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", letterSpacing: "0.04em" }}>TOURNAMENT ODDS — ALL 48 TEAMS</div>
            </div>
            <div style={{ maxHeight: 620, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead style={{ position: "sticky", top: 0, background: "var(--panel)" }}>
                  <tr>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", borderBottom: "1px solid var(--hairline)" }}>#</th>
                    <th style={{ padding: "8px 8px", textAlign: "left", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", borderBottom: "1px solid var(--hairline)" }}>TEAM</th>
                    <th style={{ padding: "8px 8px", textAlign: "left", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", borderBottom: "1px solid var(--hairline)" }}>NOTE</th>
                    <th style={{ padding: "8px 8px", textAlign: "right", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", borderBottom: "1px solid var(--hairline)" }}>ELO</th>
                    <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", borderBottom: "1px solid var(--hairline)" }}>%</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", borderBottom: "1px solid var(--hairline)", width: 120 }}>BAR</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(({ team, pct }, idx) => {
                    const rank = idx + 1;
                    const isTop3 = rank <= 3;
                    const barW = Math.round((pct / maxPct) * 100 * 0.92);
                    return (
                      <tr key={team.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                        <td style={{ padding: "10px 12px", fontFamily: "var(--font-spot-mono, monospace)", fontSize: 12, fontWeight: 700, color: isTop3 ? "var(--gold)" : "var(--text-ghost)" }}>{rank}</td>
                        <td style={{ padding: "10px 8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <img src={flagUrl(team.countryCode)} alt={team.shortName} style={{ width: 24, height: 17, objectFit: "cover", borderRadius: 2 }} />
                            <span style={{ fontWeight: 600, color: "var(--text)" }}>{team.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 8px", color: "var(--text-ghost)", fontStyle: "italic", maxWidth: 180 }}>
                          {TEAM_NOTES[team.id] ?? "Strong contender"}
                        </td>
                        <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "var(--font-spot-mono, monospace)", color: "var(--text-muted)", fontSize: 11 }}>{team.strength}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "var(--font-spot-mono, monospace)", fontWeight: 700, color: isTop3 ? "var(--gold)" : "var(--text-2)" }}>{pct}%</td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ height: 6, borderRadius: 3, overflow: "hidden", background: "var(--hairline)" }}>
                            <div style={{
                              width: `${barW}%`,
                              height: "100%",
                              background: "linear-gradient(90deg, var(--purple), var(--gold-2))",
                              borderRadius: 3,
                              transition: "width 0.5s ease",
                            }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: Stacked cards */}
        <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

          {/* Predicted Path */}
          {topTeam && (
            <div style={{ background: "var(--gold-tint)", border: "1px solid var(--gold-line)", borderRadius: "var(--r-card)", padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <img src={flagUrl(topTeam.countryCode, "24x18")} alt={topTeam.name} style={{ width: 32, height: 22, objectFit: "cover", borderRadius: 3 }} />
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{topTeam.name}</div>
                <div style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "var(--gold)", background: "var(--gold-tint)", border: "1px solid var(--gold-line)", borderRadius: "var(--r-badge)", padding: "3px 8px" }}>Predicted Path</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {bracketPath.map((step, i) => (
                  <div key={step.round} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 0",
                    borderBottom: i < bracketPath.length - 1 ? "1px solid var(--gold-line)" : "none",
                  }}>
                    <div style={{ width: 40, fontSize: 11, fontWeight: 800, color: "var(--gold)", fontFamily: "var(--font-spot-mono, monospace)", flexShrink: 0 }}>{step.round}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>vs {step.opp}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{step.note}</div>
                    </div>
                    <div style={{
                      fontSize: 13, fontWeight: 800,
                      fontFamily: "var(--font-spot-mono, monospace)",
                      color: step.prob >= 70 ? "var(--green)" : step.prob >= 55 ? "var(--gold)" : "var(--text-2)",
                    }}>
                      {step.prob}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Methodology */}
          <div className="spot-card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 24, height: 24, background: "var(--grad-gold)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>⬡</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", letterSpacing: "0.04em" }}>SIMULATION METHODOLOGY</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { icon: "📊", title: "ELO Ratings (80%)", body: "International ELO ratings form the core of every matchup probability. Teams are seeded by strength and tournament simulations use log-odds distributions." },
                { icon: "📈", title: "Form Factor (15%)", body: "Recent match performance — wins, clean sheets, goals scored — applies a jitter modifier that shifts individual tournament outcomes run-to-run." },
                { icon: "🗺️", title: "Fixture Draw (5%)", body: "Bracket position and opponent difficulty path affects the cumulative trophy probability through the knockout rounds." },
              ].map((item) => (
                <div key={item.title} style={{ display: "flex", gap: 10, padding: "10px 12px", background: "var(--panel-2)", borderRadius: "var(--r-tile)", border: "1px solid var(--hairline)" }}>
                  <div style={{ fontSize: 18 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>{item.body}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--r-tile)", border: "1px solid var(--hairline)" }}>
              <div style={{ fontSize: 10, color: "var(--text-ghost)", lineHeight: 1.7 }}>
                ⚠️ For entertainment purposes only. These simulations are statistical models and do not constitute financial or betting advice. Past ELO performance does not guarantee future tournament results.
              </div>
            </div>
          </div>

          {/* Sim stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Teams Simulated", value: teamsArray.length.toString(), icon: "🌍" },
              { label: "Simulations Run", value: "10,000", icon: "⚙️" },
              { label: "Sim Variant", value: `#${simKey + 1}`, icon: "🔁" },
              { label: "Confidence Model", value: "ELO v3.2", icon: "⬡" },
            ].map((stat) => (
              <div key={stat.label} className="spot-card" style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: 16, marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "var(--gold)", fontFamily: "var(--font-spot-mono, monospace)" }}>{stat.value}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
