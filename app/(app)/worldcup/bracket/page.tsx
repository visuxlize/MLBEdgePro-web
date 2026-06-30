"use client";

import { useEffect, useState } from "react";
import { WC_TEAMS, INITIAL_BRACKET } from "@/lib/worldcup/data";
import type { BracketState, BracketMatch, WCTeam } from "@/lib/worldcup/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function flagUrl(cc: string) {
  return `https://flagcdn.com/24x18/${cc.split("-")[0]}.png`;
}

function luminance(hex: string): number {
  const c = hex.replace("#", "");
  const ch = (i: number) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(0) + 0.7152 * ch(2) + 0.0722 * ch(4);
}
function contrastText(hex: string) {
  return luminance(hex) > 0.45 ? "#0a1018" : "#ffffff";
}

// ── Team Badge ────────────────────────────────────────────────────────────────

function TeamBadge({ teamId, size = 24 }: { teamId: string | null; size?: number }) {
  const team = teamId ? WC_TEAMS[teamId] : null;
  if (!team) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: team.color,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <img
        src={flagUrl(team.countryCode)}
        alt={team.shortName}
        style={{ width: size, height: size, objectFit: "cover" }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    </div>
  );
}

// ── Match Team Row ────────────────────────────────────────────────────────────

function TeamRow({
  teamId,
  score,
  isWinner,
  hasResult,
  predictedWinner,
  isPredicted,
}: {
  teamId: string | null;
  score: number | null;
  isWinner: boolean;
  hasResult: boolean;
  predictedWinner: boolean;
  isPredicted: boolean;
}) {
  const team = teamId ? WC_TEAMS[teamId] : null;
  const dim = hasResult && !isWinner;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 6px",
        borderRadius: 6,
        opacity: dim ? 0.45 : 1,
        borderLeft:
          isPredicted && predictedWinner
            ? "2px solid var(--purple-2)"
            : "2px solid transparent",
        background:
          isPredicted && predictedWinner
            ? "rgba(124,92,250,0.08)"
            : "transparent",
        transition: "all 0.2s",
      }}
    >
      <TeamBadge teamId={teamId} size={22} />
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: team ? "var(--text)" : "var(--text-ghost)",
          flex: 1,
          letterSpacing: "0.02em",
        }}
      >
        {team ? team.shortName : "TBD"}
      </span>
      {score !== null && (
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: isWinner ? "var(--text)" : "var(--text-2)",
            fontFamily: "var(--font-spot-mono, monospace)",
          }}
        >
          {score}
        </span>
      )}
    </div>
  );
}

// ── Match Card ────────────────────────────────────────────────────────────────

function MatchCard({
  match,
  isFinal,
  predicted,
}: {
  match: BracketMatch;
  isFinal?: boolean;
  predicted: boolean;
}) {
  const hasResult = match.winner !== null;
  const topWinner = match.winner === "top";
  const bottomWinner = match.winner === "bottom";

  // Predicted winner based on topWinProb
  const topWinProb = match.topWinProb ?? 0.5;
  const predictedTop = topWinProb >= 0.5;

  const isLive = match.status === "live";

  const cardStyle: React.CSSProperties = {
    width: isFinal ? 190 : 164,
    padding: "8px 6px",
    borderRadius: "var(--r-tile)",
    background: isFinal ? "var(--gold-tint)" : "var(--panel)",
    border: isFinal
      ? "1px solid var(--gold-line)"
      : isLive
      ? "1px solid var(--red)"
      : "1px solid var(--hairline)",
    boxShadow: isFinal
      ? "0 0 24px rgba(245,158,11,0.12)"
      : isLive
      ? "0 0 12px rgba(239,68,68,0.15)"
      : "none",
    flexShrink: 0,
    position: "relative",
  };

  return (
    <div style={cardStyle}>
      {isFinal && (
        <div style={{ textAlign: "center", fontSize: 18, marginBottom: 4 }}>
          🏆
        </div>
      )}
      {isLive && (
        <div
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            fontSize: 9,
            fontWeight: 700,
            color: "#fff",
            background: "var(--red)",
            padding: "2px 5px",
            borderRadius: 4,
            letterSpacing: "0.06em",
          }}
        >
          LIVE
        </div>
      )}

      <TeamRow
        teamId={match.topTeamId}
        score={match.topScore}
        isWinner={topWinner}
        hasResult={hasResult}
        predictedWinner={predictedTop}
        isPredicted={predicted && match.topTeamId !== null && match.bottomTeamId !== null}
      />

      <div style={{ height: 1, background: "var(--hairline)", margin: "2px 0" }} />

      <TeamRow
        teamId={match.bottomTeamId}
        score={match.bottomScore}
        isWinner={bottomWinner}
        hasResult={hasResult}
        predictedWinner={!predictedTop}
        isPredicted={predicted && match.topTeamId !== null && match.bottomTeamId !== null}
      />

      <div
        style={{
          marginTop: 6,
          fontSize: 10,
          color: "var(--text-ghost)",
          display: "flex",
          gap: 4,
          alignItems: "center",
        }}
      >
        <span>{match.date}</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {match.city}
        </span>
      </div>

      {isFinal && (
        <div
          style={{
            marginTop: 4,
            fontSize: 10,
            color: "var(--gold)",
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          MetLife Stadium · Jul 21
        </div>
      )}
    </div>
  );
}

// ── Column of Matches ─────────────────────────────────────────────────────────

function BracketColumn({
  matchIds,
  bracketState,
  predicted,
  isFinal,
}: {
  matchIds: string[];
  bracketState: BracketState;
  predicted: boolean;
  isFinal?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
        alignItems: "center",
        height: "100%",
        gap: 8,
      }}
    >
      {matchIds.map((id) => {
        const m = bracketState.matches[id];
        if (!m) return null;
        return (
          <MatchCard key={id} match={m} isFinal={isFinal} predicted={predicted} />
        );
      })}
    </div>
  );
}

// ── Round Labels ──────────────────────────────────────────────────────────────

const ROUND_LABELS = [
  "Round of 32",
  "Round of 16",
  "QF",
  "Semifinals",
  "FINAL",
  "Semifinals",
  "QF",
  "Round of 16",
  "Round of 32",
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BracketPage() {
  const [bracketState, setBracketState] = useState<BracketState>(INITIAL_BRACKET);
  const [predicted, setPredicted] = useState(false);
  const [knockoutLive, setKnockoutLive] = useState(false);

  useEffect(() => {
    fetch("/api/worldcup/bracket")
      .then((r) => r.json())
      .then((data: BracketState & { knockoutLive?: boolean }) => {
        if (data?.matches) {
          setBracketState(data);
          setKnockoutLive(!!data.knockoutLive);
        }
      })
      .catch(() => {
        // fallback to INITIAL_BRACKET already set
      });
  }, []);

  const r32 = bracketState.rounds.r32 ?? [];
  const r16 = bracketState.rounds.r16 ?? [];
  const qf = bracketState.rounds.qf ?? [];
  const sf = bracketState.rounds.sf ?? [];
  const finalRound = bracketState.rounds.final ?? [];

  // Split into upper and lower halves
  const r32Upper = r32.filter((id) => bracketState.matches[id]?.side === "upper");
  const r32Lower = r32.filter((id) => bracketState.matches[id]?.side === "lower");
  const r16Upper = r16.filter((id) => bracketState.matches[id]?.side === "upper");
  const r16Lower = r16.filter((id) => bracketState.matches[id]?.side === "lower");
  const qfUpper = qf.filter((id) => bracketState.matches[id]?.side === "upper");
  const qfLower = qf.filter((id) => bracketState.matches[id]?.side === "lower");
  const sfUpper = sf.filter((id) => bracketState.matches[id]?.side === "upper");
  const sfLower = sf.filter((id) => bracketState.matches[id]?.side === "lower");

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(9, 1fr)",
    gap: 12,
    height: 700,
    minWidth: 1560,
  };

  return (
    <div style={{ padding: "24px 32px", minWidth: 1600, overflowX: "auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "var(--text)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Tournament Bracket
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, marginBottom: 0 }}>
            FIFA World Cup 2026 · 48 Teams
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
              color: knockoutLive ? "var(--green)" : "var(--text-ghost)",
              background: knockoutLive ? "rgba(52,211,153,.12)" : "rgba(255,255,255,.04)",
            }}
            title={knockoutLive ? "Round of 32 hydrated from real ESPN fixtures" : "Showing projected pairings until the knockout stage starts"}
          >
            {knockoutLive ? "● LIVE" : "PROJECTED"}
          </span>
          {predicted && (
            <div
              style={{
                fontSize: 11,
                color: "var(--purple-2)",
                background: "rgba(124,92,250,0.12)",
                border: "1px solid rgba(167,139,250,0.25)",
                padding: "4px 10px",
                borderRadius: "var(--r-chip)",
                fontWeight: 600,
              }}
            >
              ⬡ Predicted path highlighted
            </div>
          )}
          <button
            onClick={() => setPredicted((p) => !p)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: "var(--r-chip)",
              border: predicted
                ? "1px solid rgba(167,139,250,0.4)"
                : "1px solid var(--hairline)",
              background: predicted ? "rgba(124,92,250,0.15)" : "rgba(124,92,250,0.06)",
              color: predicted ? "var(--purple-2)" : "var(--text-muted)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <span style={{ fontSize: 15 }}>⬡</span>
            <span>AI Predictor</span>
          </button>
        </div>
      </div>

      {/* Round labels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(9, 1fr)",
          gap: 12,
          minWidth: 1560,
          marginBottom: 12,
        }}
      >
        {ROUND_LABELS.map((label, i) => (
          <div
            key={i}
            style={{
              textAlign: "center",
              fontSize: 11,
              fontWeight: 700,
              color: i === 4 ? "var(--gold)" : "var(--text-ghost)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "4px 0",
              borderBottom: i === 4
                ? "1px solid var(--gold-line)"
                : "1px solid var(--hairline)",
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Bracket grid */}
      <div style={gridStyle}>
        {/* Col 1: R32 upper */}
        <BracketColumn matchIds={r32Upper} bracketState={bracketState} predicted={predicted} />

        {/* Col 2: R16 upper */}
        <BracketColumn matchIds={r16Upper} bracketState={bracketState} predicted={predicted} />

        {/* Col 3: QF upper */}
        <BracketColumn matchIds={qfUpper} bracketState={bracketState} predicted={predicted} />

        {/* Col 4: SF upper */}
        <BracketColumn matchIds={sfUpper} bracketState={bracketState} predicted={predicted} />

        {/* Col 5: Final */}
        <BracketColumn
          matchIds={finalRound}
          bracketState={bracketState}
          predicted={predicted}
          isFinal
        />

        {/* Col 6: SF lower */}
        <BracketColumn matchIds={sfLower} bracketState={bracketState} predicted={predicted} />

        {/* Col 7: QF lower */}
        <BracketColumn matchIds={qfLower} bracketState={bracketState} predicted={predicted} />

        {/* Col 8: R16 lower */}
        <BracketColumn matchIds={r16Lower} bracketState={bracketState} predicted={predicted} />

        {/* Col 9: R32 lower */}
        <BracketColumn matchIds={r32Lower} bracketState={bracketState} predicted={predicted} />
      </div>
    </div>
  );
}
