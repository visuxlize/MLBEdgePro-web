"use client";

import { useState, useEffect } from "react";
import { WC_TEAMS, WC_GROUPS } from "@/lib/worldcup/data";
import type { WCGroup, GSTeam, GSMatch } from "@/lib/worldcup/types";

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

// ── Sort helpers ──────────────────────────────────────────────────────────────

function sortTeams(teams: GSTeam[]): GSTeam[] {
  return [...teams].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdB = b.gf - b.ga;
    const gdA = a.gf - a.ga;
    if (gdB !== gdA) return gdB - gdA;
    return b.gf - a.gf;
  });
}

function getCompletedMatches(matches: GSMatch[]): GSMatch[] {
  return matches.filter((m) => m.status === "completed").slice(-2);
}

// ── GroupCard ─────────────────────────────────────────────────────────────────

function GroupCard({ group }: { group: WCGroup }) {
  const sorted = sortTeams(group.teams);
  const completed = getCompletedMatches(group.matches);
  const played = group.matches.filter((m) => m.status === "completed").length;

  // Leader's color or gold default
  const leader = sorted[0] ? WC_TEAMS[sorted[0].teamId] : null;
  const accentColor = leader?.color ?? "var(--gold)";

  return (
    <div
      style={{
        background: "var(--panel)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--r-card)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Card header */}
      <div
        style={{
          borderLeft: `4px solid ${accentColor}`,
          padding: "10px 14px 8px",
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gold-2)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Group {group.id}
        </div>
        <div style={{ fontSize: 10, color: "var(--text-ghost)", marginTop: 2 }}>
          {played} match{played !== 1 ? "es" : ""} played
        </div>
      </div>

      {/* Standings table header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "16px 18px 1fr 22px 18px 18px 18px 22px 22px 26px",
          gap: 2,
          padding: "5px 10px 3px",
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        {["", "", "TEAM", "P", "W", "D", "L", "GF", "GA", "PTS"].map((h, i) => (
          <span
            key={i}
            style={{
              fontSize: 8,
              fontWeight: 700,
              color: "var(--text-ghost)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              textAlign: i >= 3 ? "center" : "left",
            }}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Team rows */}
      <div style={{ flex: 1 }}>
        {sorted.map((t, i) => {
          const team = WC_TEAMS[t.teamId];
          const isQualified = i < 2;
          const isBubble = i === 2;

          const rowBg = isQualified ? "rgba(52,211,153,0.05)" : "transparent";
          const indicatorColor = isQualified ? "var(--green)" : isBubble ? "var(--gold)" : "rgba(255,255,255,0.1)";
          const ptsColor = isQualified ? "var(--green)" : isBubble ? "var(--gold)" : "var(--text-muted)";

          return (
            <div key={t.teamId}>
              {/* Dashed separator after 2nd team */}
              {i === 2 && (
                <div
                  style={{
                    borderTop: "1px dashed rgba(255,255,255,0.1)",
                    margin: "0 10px",
                  }}
                />
              )}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "16px 18px 1fr 22px 18px 18px 18px 22px 22px 26px",
                  gap: 2,
                  padding: "6px 10px",
                  alignItems: "center",
                  background: rowBg,
                  borderLeft: `4px solid ${indicatorColor}`,
                }}
              >
                {/* Rank */}
                <span style={{ fontSize: 10, color: "var(--text-ghost)", textAlign: "center" }}>{i + 1}</span>
                {/* Flag */}
                <div style={{ display: "flex", alignItems: "center" }}>
                  {team ? <FlagImg cc={team.countryCode} size={14} /> : null}
                </div>
                {/* Name */}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {team?.shortName ?? t.teamId.toUpperCase()}
                </span>
                {/* P W D L GF GA */}
                {[t.p, t.w, t.d, t.l, t.gf, t.ga].map((v, vi) => (
                  <span
                    key={vi}
                    style={{
                      fontSize: 11,
                      color: "var(--text-2)",
                      textAlign: "center",
                      fontFamily: "var(--font-spot-mono, monospace)",
                    }}
                  >
                    {v}
                  </span>
                ))}
                {/* PTS */}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: ptsColor,
                    textAlign: "center",
                    fontFamily: "var(--font-spot-mono, monospace)",
                  }}
                >
                  {t.pts}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Results section */}
      {completed.length > 0 && (
        <div
          style={{
            background: "var(--panel-2)",
            borderTop: "1px solid var(--hairline)",
            padding: "8px 10px",
          }}
        >
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-ghost)", textTransform: "uppercase", marginBottom: 5 }}>
            Results
          </div>
          {completed.map((m, mi) => {
            const homeTeam = WC_TEAMS[m.home];
            const awayTeam = WC_TEAMS[m.away];
            return (
              <div
                key={mi}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  fontSize: 11,
                  color: "var(--text-2)",
                  padding: "2px 0",
                }}
              >
                {homeTeam && <FlagImg cc={homeTeam.countryCode} size={13} />}
                <span style={{ fontWeight: 600 }}>{homeTeam?.shortName ?? m.home.toUpperCase()}</span>
                <span
                  style={{
                    fontFamily: "var(--font-spot-mono, monospace)",
                    fontWeight: 700,
                    color: "var(--text)",
                    padding: "0 3px",
                  }}
                >
                  {m.homeScore}–{m.awayScore}
                </span>
                <span style={{ fontWeight: 600 }}>{awayTeam?.shortName ?? m.away.toUpperCase()}</span>
                {awayTeam && <FlagImg cc={awayTeam.countryCode} size={13} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const ALL_GROUP_IDS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export default function WCGroupsPage() {
  const [groups, setGroups] = useState<WCGroup[]>(WC_GROUPS);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  useEffect(() => {
    fetch("/api/worldcup/groups")
      .then((r) => r.json())
      .then((data: WCGroup[]) => {
        if (Array.isArray(data) && data.length > 0) setGroups(data);
      })
      .catch(() => null);
  }, []);

  const filteredGroups =
    activeFilter === "ALL" ? groups : groups.filter((g) => g.id === activeFilter);

  const filterChips = ["ALL", ...ALL_GROUP_IDS];

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 28px" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>
          Group Standings
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-ghost)", margin: 0 }}>
          Jun 12 – Jun 26, 2026
        </p>
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {filterChips.map((chip) => {
          const isActive = chip === activeFilter;
          return (
            <button
              key={chip}
              onClick={() => setActiveFilter(chip)}
              style={{
                padding: "5px 12px",
                borderRadius: "var(--r-chip)",
                border: isActive ? "1px solid var(--gold-line)" : "1px solid var(--hairline)",
                background: isActive ? "var(--gold-tint)" : "transparent",
                color: isActive ? "var(--gold)" : "var(--text-ghost)",
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s",
                letterSpacing: isActive ? "0.04em" : undefined,
              }}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { color: "var(--green)", label: "Qualified", bg: "rgba(52,211,153,0.12)" },
          { color: "var(--gold)", label: "Bubble", bg: "var(--gold-tint)" },
          { color: "var(--text-ghost)", label: "Eliminated", bg: "rgba(255,255,255,0.05)" },
        ].map((l) => (
          <div
            key={l.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: l.bg,
              border: `1px solid ${l.color}33`,
              borderRadius: "var(--r-badge)",
              padding: "3px 10px",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: l.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11, color: l.color, fontWeight: 600 }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Groups Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: filteredGroups.length === 1
            ? "minmax(0, 480px)"
            : "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {filteredGroups.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 0",
            color: "var(--text-ghost)",
            fontSize: 14,
          }}
        >
          No group data available.
        </div>
      )}
    </div>
  );
}
