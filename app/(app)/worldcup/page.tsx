"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { WC_TEAMS, WC_GROUPS, eloWinProb } from "@/lib/worldcup/data";
import type { WCGroup, GSMatch, GSTeam } from "@/lib/worldcup/types";

// ── Flag helpers ──────────────────────────────────────────────────────────────

function flagUrl(cc: string) {
  return `https://flagcdn.com/24x18/${cc.split("-")[0]}.png`;
}

function FlagImg({ cc, size = 20 }: { cc: string; size?: number }) {
  return (
    <img
      src={flagUrl(cc)}
      alt=""
      width={size}
      height={Math.round(size * 0.75)}
      style={{ borderRadius: 2, objectFit: "cover", flexShrink: 0 }}
    />
  );
}

// ── Derived stat helpers ──────────────────────────────────────────────────────

function computeStats(groups: WCGroup[]) {
  let goals = 0;
  let played = 0;
  let cleanSheets = 0;

  for (const g of groups) {
    for (const m of g.matches) {
      if (m.status === "completed" && m.homeScore !== null && m.awayScore !== null) {
        goals += m.homeScore + m.awayScore;
        played++;
        if (m.homeScore === 0 || m.awayScore === 0) cleanSheets++;
      }
    }
  }

  const today = new Date("2026-06-28");
  const finalDate = new Date("2026-07-19");
  const daysToFinal = Math.ceil((finalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return { goals, played, cleanSheets, daysToFinal, avgGoals: played > 0 ? goals / played : 0 };
}

function sortTeams(teams: GSTeam[]): GSTeam[] {
  return [...teams].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    return (b.gf - b.ga) - (a.gf - a.ga);
  });
}

function getTodayMatches(groups: WCGroup[]): Array<{ groupId: string; match: GSMatch }> {
  const results: Array<{ groupId: string; match: GSMatch }> = [];
  for (const g of groups) {
    for (const m of g.matches) {
      if (m.date === "Jun 28" || m.status === "live") {
        results.push({ groupId: g.id, match: m });
      }
    }
  }
  return results.slice(0, 4);
}

function getRecentResults(groups: WCGroup[]): Array<{ groupId: string; match: GSMatch }> {
  const results: Array<{ groupId: string; match: GSMatch }> = [];
  for (const g of groups) {
    for (const m of g.matches) {
      if (m.status === "completed") {
        results.push({ groupId: g.id, match: m });
      }
    }
  }
  return results.slice(0, 3);
}

function getMustWatchMatches(groups: WCGroup[]): Array<{ groupId: string; match: GSMatch; strength: number }> {
  const upcoming: Array<{ groupId: string; match: GSMatch; strength: number }> = [];
  for (const g of groups) {
    for (const m of g.matches) {
      if (m.status === "scheduled") {
        const homeTeam = WC_TEAMS[m.home];
        const awayTeam = WC_TEAMS[m.away];
        if (homeTeam && awayTeam) {
          upcoming.push({ groupId: g.id, match: m, strength: homeTeam.strength + awayTeam.strength });
        }
      }
    }
  }
  return upcoming.sort((a, b) => b.strength - a.strength).slice(0, 3);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function WinProbBar({ home, away }: { home: string; away: string }) {
  const homeTeam = WC_TEAMS[home];
  const awayTeam = WC_TEAMS[away];
  if (!homeTeam || !awayTeam) return null;

  const homeProb = eloWinProb(homeTeam.strength, awayTeam.strength);
  const awayProb = eloWinProb(awayTeam.strength, homeTeam.strength);
  const drawProb = Math.max(0, 1 - homeProb - awayProb);

  const hPct = Math.round(homeProb * 100);
  const dPct = Math.round(drawProb * 100);
  const aPct = 100 - hPct - dPct;

  return (
    <div style={{ display: "flex", height: 4, borderRadius: 4, overflow: "hidden", gap: 1, marginTop: 6 }}>
      <div style={{ flex: hPct, background: "var(--blue)", borderRadius: "4px 0 0 4px" }} title={`Home win: ${hPct}%`} />
      <div style={{ flex: dPct, background: "rgba(255,255,255,0.2)" }} title={`Draw: ${dPct}%`} />
      <div style={{ flex: aPct, background: "var(--red)", borderRadius: "0 4px 4px 0" }} title={`Away win: ${aPct}%`} />
    </div>
  );
}

function MatchCard({ groupId, match }: { groupId: string; match: GSMatch }) {
  const homeTeam = WC_TEAMS[match.home];
  const awayTeam = WC_TEAMS[match.away];
  const isLive = match.status === "live";

  return (
    <div
      style={{
        background: "var(--panel)",
        border: `1px solid ${isLive ? "var(--red)" : "var(--hairline)"}`,
        borderRadius: "var(--r-tile)",
        padding: "10px 12px",
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "var(--gold-2)",
            background: "var(--gold-tint)",
            border: "1px solid var(--gold-line)",
            borderRadius: "var(--r-badge)",
            padding: "2px 7px",
            textTransform: "uppercase",
          }}
        >
          GROUP {groupId}
        </span>
        {isLive && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--red)" }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--red)",
                animation: "pulse 1.5s infinite",
              }}
            />
            LIVE
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {homeTeam && <FlagImg cc={homeTeam.countryCode} size={16} />}
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
            {homeTeam?.shortName ?? match.home.toUpperCase()}
          </span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-spot-mono, monospace)" }}>
          {match.status === "completed" || match.status === "live"
            ? `${match.homeScore ?? 0} – ${match.awayScore ?? 0}`
            : match.time}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
            {awayTeam?.shortName ?? match.away.toUpperCase()}
          </span>
          {awayTeam && <FlagImg cc={awayTeam.countryCode} size={16} />}
        </div>
      </div>
      {match.status === "scheduled" && <WinProbBar home={match.home} away={match.away} />}
      <div style={{ fontSize: 10, color: "var(--text-ghost)", marginTop: 5 }}>{match.venue}</div>
    </div>
  );
}

function MiniGroupCard({ group }: { group: WCGroup }) {
  const sorted = sortTeams(group.teams);
  const played = group.matches.filter((m) => m.status === "completed").length;

  return (
    <div
      style={{
        background: "var(--panel)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--r-tile)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          borderLeft: "3px solid var(--gold)",
          padding: "8px 10px 6px",
        }}
      >
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "var(--gold-2)", textTransform: "uppercase" }}>
          Group {group.id}
        </div>
        <div style={{ fontSize: 10, color: "var(--text-ghost)", marginTop: 1 }}>{played} played</div>
      </div>
      <div>
        {sorted.map((t, i) => {
          const team = WC_TEAMS[t.teamId];
          const rowBorderColor = i < 2 ? "var(--green)" : i === 2 ? "var(--gold)" : "transparent";
          const ptsColor = i < 2 ? "var(--green)" : i === 2 ? "var(--gold)" : "var(--text-ghost)";

          return (
            <div
              key={t.teamId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 10px",
                borderLeft: `3px solid ${rowBorderColor}`,
                background: i < 2 ? "rgba(52,211,153,0.04)" : "transparent",
              }}
            >
              <span style={{ fontSize: 9, color: "var(--text-ghost)", width: 10 }}>{i + 1}</span>
              {team && <FlagImg cc={team.countryCode} size={14} />}
              <span style={{ fontSize: 11, color: "var(--text)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {team?.shortName ?? t.teamId.toUpperCase()}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: ptsColor }}>{t.pts}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Top contenders for AI panel ───────────────────────────────────────────────

function getContenders() {
  return Object.values(WC_TEAMS)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 8)
    .map((team) => ({
      team,
      trophyPct: ((team.strength - 1400) / (1900 - 1400)) * 28 + 2,
    }));
}

function getTopThree() {
  return getContenders().slice(0, 3);
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WCHubPage() {
  const [groups, setGroups] = useState<WCGroup[]>(WC_GROUPS);

  useEffect(() => {
    fetch("/api/worldcup/today")
      .then((r) => r.json())
      .catch(() => null);

    fetch("/api/worldcup/groups")
      .then((r) => r.json())
      .then((data: WCGroup[]) => {
        if (Array.isArray(data) && data.length > 0) setGroups(data);
      })
      .catch(() => null);
  }, []);

  const stats = computeStats(groups);
  const todayMatches = getTodayMatches(groups);
  const recentResults = getRecentResults(groups);
  const mustWatch = getMustWatchMatches(groups);
  const contenders = getContenders();
  const topThree = getTopThree();

  const rankLabel = ["1st", "2nd", "3rd"];

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes livePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
          50% { box-shadow: 0 0 0 6px rgba(239,68,68,0.15); }
        }
      `}</style>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div
        style={{
          background: "var(--panel)",
          borderBottom: "1px solid var(--hairline)",
          position: "relative",
          overflow: "hidden",
          minHeight: 220,
        }}
      >
        {/* gold glow */}
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "28px 28px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 32,
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Left content */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "var(--gold-tint)",
                border: "1px solid var(--gold-line)",
                borderRadius: "var(--r-badge)",
                padding: "3px 10px",
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--gold)", textTransform: "uppercase" }}>
                FIFA World Cup 2026
              </span>
            </div>

            <h1
              style={{
                fontSize: 52,
                fontWeight: 900,
                lineHeight: 1,
                margin: "0 0 10px",
                background: "var(--grad-gold)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              WORLD CUP
            </h1>

            <p style={{ fontSize: 15, color: "var(--text-2)", margin: "0 0 20px" }}>
              2026 · USA 🇺🇸 · Canada 🇨🇦 · Mexico 🇲🇽
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a
                href="/worldcup/groups"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "var(--gold)",
                  color: "#000",
                  border: "none",
                  borderRadius: "var(--r-chip)",
                  padding: "9px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                Live Groups
              </a>
              <a
                href="/worldcup/bracket"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "transparent",
                  color: "var(--text)",
                  border: "1px solid var(--hairline)",
                  borderRadius: "var(--r-chip)",
                  padding: "9px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                Full Bracket
              </a>
              <a
                href="/worldcup/ai-sim"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(124,92,250,0.12)",
                  color: "var(--purple-2)",
                  border: "1px solid rgba(124,92,250,0.3)",
                  borderRadius: "var(--r-chip)",
                  padding: "9px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                ⬡ Run AI Sim
              </a>
            </div>
          </div>

          {/* Right: AI Favorites podium */}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexShrink: 0,
            }}
            className="hidden md:flex"
          >
            {topThree.map((c, i) => (
              <motion.div
                key={c.team.id}
                whileHover={{ scale: 1.04 }}
                style={{
                  background: "var(--panel-2)",
                  border: `1px solid ${i === 0 ? "var(--gold-line)" : "var(--hairline)"}`,
                  borderRadius: "var(--r-tile)",
                  padding: "12px 14px",
                  minWidth: 110,
                  textAlign: "center",
                  cursor: "default",
                }}
              >
                <div style={{ fontSize: 10, color: "var(--text-ghost)", marginBottom: 6, letterSpacing: "0.06em" }}>
                  {rankLabel[i]}
                </div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
                  <FlagImg cc={c.team.countryCode} size={28} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? "var(--gold-2)" : "var(--text)", marginBottom: 4 }}>
                  {c.team.shortName}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--gold)",
                    fontFamily: "var(--font-spot-mono, monospace)",
                  }}
                >
                  {c.trophyPct.toFixed(1)}%
                </div>
                <div style={{ fontSize: 9, color: "var(--text-ghost)", marginTop: 2 }}>trophy</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats Strip ─────────────────────────────────────────────── */}
      <div
        style={{
          background: "var(--panel-2)",
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "0 28px",
            display: "flex",
            alignItems: "stretch",
          }}
        >
          {[
            { value: stats.goals.toString(), label: "Goals Scored", sub: "group stage" },
            { value: stats.avgGoals.toFixed(1), label: "Avg Goals/Match", sub: "per game" },
            { value: stats.played.toString(), label: "Matches Played", sub: "of 48 group" },
            { value: stats.cleanSheets.toString(), label: "Clean Sheets", sub: "shutouts" },
            { value: stats.daysToFinal.toString(), label: "Days to Final", sub: "Jul 19 · MetLife" },
          ].map((s, i, arr) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                padding: "14px 20px",
                borderRight: i < arr.length - 1 ? "1px solid var(--hairline)" : "none",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--gold)",
                  fontFamily: "var(--font-spot-mono, monospace)",
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-2)", marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 9, color: "var(--text-ghost)", marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3-col Body ──────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "22px 28px",
          display: "flex",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        {/* ── Left Column ─────────────────────────────────────────────── */}
        <div style={{ width: 300, flexShrink: 0 }}>
          {/* Today's Matches */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--red)",
                  animation: "pulse 1.5s infinite",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Today&apos;s Matches
              </span>
            </div>
            {todayMatches.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--text-ghost)", padding: "16px 0" }}>No matches today</div>
            ) : (
              todayMatches.map(({ groupId, match }, i) => (
                <MatchCard key={i} groupId={groupId} match={match} />
              ))
            )}
          </div>

          {/* Yesterday's Results */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Recent Results
            </div>
            {recentResults.map(({ groupId, match }, i) => {
              const homeTeam = WC_TEAMS[match.home];
              const awayTeam = WC_TEAMS[match.away];
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 0",
                    borderBottom: "1px solid var(--hairline)",
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: "var(--gold-2)",
                      background: "var(--gold-tint)",
                      border: "1px solid var(--gold-line)",
                      borderRadius: "var(--r-badge)",
                      padding: "1px 6px",
                      flexShrink: 0,
                    }}
                  >
                    {groupId}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text)" }}>
                    {homeTeam && <FlagImg cc={homeTeam.countryCode} size={14} />}
                    <span style={{ fontWeight: 600 }}>{homeTeam?.shortName ?? match.home.toUpperCase()}</span>
                    <span
                      style={{
                        fontFamily: "var(--font-spot-mono, monospace)",
                        fontWeight: 700,
                        color: "var(--text-2)",
                        margin: "0 4px",
                      }}
                    >
                      {match.homeScore}–{match.awayScore}
                    </span>
                    <span style={{ fontWeight: 600 }}>{awayTeam?.shortName ?? match.away.toUpperCase()}</span>
                    {awayTeam && <FlagImg cc={awayTeam.countryCode} size={14} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Center Column ───────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Group Standings Grid */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Group Standings
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
              }}
            >
              {groups.map((group) => (
                <MiniGroupCard key={group.id} group={group} />
              ))}
            </div>
          </div>

          {/* Must-Watch Today */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Must-Watch Upcoming
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {mustWatch.map(({ groupId, match }, i) => {
                const homeTeam = WC_TEAMS[match.home];
                const awayTeam = WC_TEAMS[match.away];
                return (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    style={{
                      background: "var(--panel)",
                      border: "1px solid var(--hairline)",
                      borderRadius: "var(--r-tile)",
                      padding: "12px 14px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--gold)",
                        fontFamily: "var(--font-spot-mono, monospace)",
                        marginBottom: 8,
                      }}
                    >
                      {match.time}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        {homeTeam && <FlagImg cc={homeTeam.countryCode} size={16} />}
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                          {homeTeam?.shortName ?? match.home.toUpperCase()}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text-ghost)" }}>vs</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                          {awayTeam?.shortName ?? match.away.toUpperCase()}
                        </span>
                        {awayTeam && <FlagImg cc={awayTeam.countryCode} size={16} />}
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-ghost)", marginBottom: 4 }}>{match.venue}</div>
                    <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                      GROUP {groupId} · {match.date}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right Column ────────────────────────────────────────────── */}
        <div style={{ width: 270, flexShrink: 0 }}>
          {/* AI Contenders */}
          <div
            style={{
              background: "var(--panel)",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--r-card)",
              padding: "14px 16px",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              ⬡ AI Contenders
            </div>
            {contenders.map((c, i) => (
              <div
                key={c.team.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 0",
                  borderBottom: i < contenders.length - 1 ? "1px solid var(--hairline)" : "none",
                }}
              >
                <span style={{ fontSize: 11, color: "var(--text-ghost)", width: 16, textAlign: "right" }}>{i + 1}</span>
                <FlagImg cc={c.team.countryCode} size={16} />
                <span style={{ fontSize: 12, color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.team.name}
                </span>
                <span style={{ fontSize: 10, color: "var(--text-ghost)", fontFamily: "var(--font-spot-mono, monospace)" }}>
                  {c.team.strength}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", fontFamily: "var(--font-spot-mono, monospace)", minWidth: 38, textAlign: "right" }}>
                  {c.trophyPct.toFixed(1)}%
                </span>
              </div>
            ))}
            <a
              href="/worldcup/ai-sim"
              style={{
                display: "block",
                marginTop: 12,
                background: "rgba(124,92,250,0.12)",
                border: "1px solid rgba(124,92,250,0.3)",
                borderRadius: "var(--r-chip)",
                padding: "9px 14px",
                textAlign: "center",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--purple-2)",
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              ⬡ Run AI Tournament Sim
            </a>
          </div>

          {/* Golden Boot Race */}
          <div
            style={{
              background: "var(--panel)",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--r-card)",
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              🥅 Golden Boot Race
            </div>
            {[
              { name: "Kylian Mbappé", cc: "fr", team: "FRA", goals: 2, assists: 1 },
              { name: "Vinicius Jr", cc: "br", team: "BRA", goals: 2, assists: 0 },
              { name: "Pedri", cc: "es", team: "ESP", goals: 1, assists: 2 },
              { name: "C. Pulisic", cc: "us", team: "USA", goals: 1, assists: 1 },
              { name: "Harry Kane", cc: "gb", team: "ENG", goals: 1, assists: 0 },
            ].map((p, i) => (
              <div
                key={p.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 0",
                  borderBottom: i < 4 ? "1px solid var(--hairline)" : "none",
                }}
              >
                <FlagImg cc={p.cc} size={16} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-ghost)" }}>{p.team}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--gold)",
                      fontFamily: "var(--font-spot-mono, monospace)",
                    }}
                  >
                    {p.goals}G
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-ghost)",
                      fontFamily: "var(--font-spot-mono, monospace)",
                      marginLeft: 4,
                    }}
                  >
                    {p.assists}A
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
