"use client";

import { useEffect, useState } from "react";
import { WC_TEAMS, WC_GROUPS, INITIAL_BRACKET, eloWinProb } from "@/lib/worldcup/data";
import type { GSMatch, WCGroup, BracketState, RoundKey } from "@/lib/worldcup/types";

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

// ── Flag Image ────────────────────────────────────────────────────────────────

function FlagImg({ countryCode, size = 24 }: { countryCode: string; size?: number }) {
  const [err, setErr] = useState(false);
  const team = Object.values(WC_TEAMS).find((t) => t.countryCode === countryCode);
  if (err || !team) {
    return (
      <div
        style={{
          width: size * 1.33,
          height: size,
          borderRadius: 3,
          background: team?.color ?? "rgba(255,255,255,0.1)",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <img
      src={flagUrl(countryCode)}
      alt={countryCode}
      width={size * 1.33}
      height={size}
      onError={() => setErr(true)}
      style={{ borderRadius: 3, objectFit: "cover", flexShrink: 0 }}
    />
  );
}

// ── Win Probability Bar (3-segment) ──────────────────────────────────────────

function WinProbBar({
  awayProb,
  homeProb,
  height = 6,
  width = 80,
}: {
  awayProb: number;
  homeProb: number;
  height?: number;
  width?: number;
}) {
  const drawProb = Math.max(0, 1 - awayProb - homeProb);
  return (
    <div
      style={{
        display: "flex",
        width,
        height,
        borderRadius: height / 2,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: `${awayProb * 100}%`,
          background: "var(--blue)",
          height: "100%",
        }}
      />
      <div
        style={{
          width: `${drawProb * 100}%`,
          background: "rgba(255,255,255,0.2)",
          height: "100%",
        }}
      />
      <div
        style={{
          width: `${homeProb * 100}%`,
          background: "var(--red)",
          height: "100%",
        }}
      />
    </div>
  );
}

// ── Compute win probs from team strengths ─────────────────────────────────────

function matchProbs(homeId: string, awayId: string) {
  const home = WC_TEAMS[homeId];
  const away = WC_TEAMS[awayId];
  if (!home || !away) return { awayWin: 0.33, draw: 0.34, homeWin: 0.33 };
  const homeWin = eloWinProb(home.strength, away.strength);
  const awayWin = eloWinProb(away.strength, home.strength);
  const draw = Math.max(0, 1 - homeWin - awayWin);
  return { awayWin, draw, homeWin };
}

// ── Live Match Hero Card ──────────────────────────────────────────────────────

function LiveMatchCard({ match, groupId }: { match: GSMatch; groupId: string }) {
  const homeTeam = WC_TEAMS[match.home];
  const awayTeam = WC_TEAMS[match.away];
  const { awayWin, draw, homeWin } = matchProbs(match.home, match.away);
  // xG estimate derived from win probability — not a real provider feed
  const xGAway = Math.round((0.8 + awayWin * 2.2) * 10) / 10;
  const xGHome = Math.round((0.8 + homeWin * 2.2) * 10) / 10;

  return (
    <div
      style={{
        background: "var(--panel)",
        border: "1px solid var(--red)",
        borderRadius: "var(--r-card)",
        boxShadow: "0 0 32px rgba(239,68,68,0.12)",
        padding: "24px 28px",
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-ghost)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          GROUP {groupId} · {match.venue}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--red)",
              display: "inline-block",
              animation: "pulse 1.4s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--red)",
              letterSpacing: "0.06em",
            }}
          >
            LIVE
          </span>
        </div>
      </div>

      {/* Score */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          marginBottom: 24,
        }}
      >
        {/* Away team */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, justifyContent: "flex-end" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", textAlign: "right" }}>
              {awayTeam?.name ?? match.away.toUpperCase()}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-ghost)", textAlign: "right" }}>
              ELO {awayTeam?.strength ?? "—"}
            </div>
          </div>
          <FlagImg countryCode={awayTeam?.countryCode ?? match.away} size={28} />
        </div>

        {/* Score */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: "var(--text)",
              fontFamily: "var(--font-spot-mono, monospace)",
              lineHeight: 1,
            }}
          >
            {match.awayScore ?? 0}
          </span>
          <span style={{ fontSize: 24, color: "var(--text-ghost)" }}>:</span>
          <span
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: "var(--text)",
              fontFamily: "var(--font-spot-mono, monospace)",
              lineHeight: 1,
            }}
          >
            {match.homeScore ?? 0}
          </span>
        </div>

        {/* Home team */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <FlagImg countryCode={homeTeam?.countryCode ?? match.home} size={28} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
              {homeTeam?.name ?? match.home.toUpperCase()}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-ghost)" }}>
              ELO {homeTeam?.strength ?? "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Win prob bar */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "var(--text-ghost)",
            marginBottom: 6,
          }}
        >
          <span style={{ color: "var(--blue)" }}>{Math.round(awayWin * 100)}% {awayTeam?.shortName}</span>
          <span>{Math.round(draw * 100)}% Draw</span>
          <span style={{ color: "var(--red)" }}>{homeTeam?.shortName} {Math.round(homeWin * 100)}%</span>
        </div>
        <WinProbBar awayProb={awayWin} homeProb={homeWin} height={8} width={undefined as unknown as number} />

        {/* xG */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "var(--text-ghost)",
            marginTop: 8,
          }}
        >
          <span>xG: <span style={{ color: "var(--text-2)" }}>{xGAway.toFixed(1)}</span></span>
          <span style={{ fontSize: 10, letterSpacing: "0.04em" }}>EXPECTED GOALS (MODEL EST.)</span>
          <span>xG: <span style={{ color: "var(--text-2)" }}>{xGHome.toFixed(1)}</span></span>
        </div>
      </div>

      {/* Live commentary — not wired to a play-by-play provider */}
      <div
        style={{
          borderTop: "1px solid var(--hairline)",
          paddingTop: 12,
          fontSize: 12,
          color: "var(--text-ghost)",
          textAlign: "center",
        }}
      >
        Live play-by-play not available — score updates from ESPN every few minutes.
      </div>
    </div>
  );
}

// ── Compact Match Row ─────────────────────────────────────────────────────────

function MatchRow({ match }: { match: GSMatch }) {
  const homeTeam = WC_TEAMS[match.home];
  const awayTeam = WC_TEAMS[match.away];
  const { awayWin, homeWin } = matchProbs(match.home, match.away);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        height: 62,
        padding: "0 16px",
        gap: 12,
        borderBottom: "1px solid var(--hairline)",
        background: hovered ? "rgba(255,255,255,0.03)" : "transparent",
        transition: "background 0.15s",
        cursor: "default",
      }}
    >
      {/* Time */}
      <div
        style={{
          width: 72,
          fontSize: 13,
          fontFamily: "var(--font-spot-mono, monospace)",
          color: "var(--gold)",
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {match.time}
      </div>

      {/* Away team */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, width: 90, justifyContent: "flex-end" }}>
        {awayTeam && (
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>
            {awayTeam.shortName}
          </span>
        )}
        <FlagImg countryCode={awayTeam?.countryCode ?? match.away} size={18} />
      </div>

      {/* vs / score */}
      <div
        style={{
          width: 60,
          textAlign: "center",
          fontSize: 12,
          color: "var(--text-ghost)",
          flexShrink: 0,
        }}
      >
        {match.homeScore !== null && match.awayScore !== null ? (
          <span style={{ fontFamily: "var(--font-spot-mono, monospace)", fontWeight: 700, color: "var(--text)" }}>
            {match.awayScore} : {match.homeScore}
          </span>
        ) : (
          "vs"
        )}
      </div>

      {/* Home team */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, width: 90 }}>
        <FlagImg countryCode={homeTeam?.countryCode ?? match.home} size={18} />
        {homeTeam && (
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>
            {homeTeam.shortName}
          </span>
        )}
      </div>

      {/* Venue */}
      <div
        style={{
          flex: 1,
          fontSize: 11,
          color: "var(--text-ghost)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {match.venue}
      </div>

      {/* Mini prob bar */}
      <WinProbBar awayProb={awayWin} homeProb={homeWin} height={6} width={80} />
    </div>
  );
}

// ── Final Result Card ─────────────────────────────────────────────────────────

function FinalCard({ match, groupId }: { match: GSMatch; groupId: string }) {
  const homeTeam = WC_TEAMS[match.home];
  const awayTeam = WC_TEAMS[match.away];
  const { homeWin } = matchProbs(match.home, match.away);

  const homeScore = match.homeScore ?? 0;
  const awayScore = match.awayScore ?? 0;
  const homeWon = homeScore > awayScore;
  const awayWon = awayScore > homeScore;

  // AI picked the higher win prob side
  const aiPickedHome = homeWin >= 0.5;
  const aiPickCorrect = aiPickedHome ? homeWon : awayWon;
  const aiPickedTeam = aiPickedHome
    ? homeTeam?.shortName ?? match.home.toUpperCase()
    : awayTeam?.shortName ?? match.away.toUpperCase();

  return (
    <div
      style={{
        background: "var(--panel)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--r-card)",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Status */}
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-ghost)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        FT · {/^[A-L]$/.test(groupId) ? `GROUP ${groupId}` : groupId}
      </div>

      {/* Away team row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: awayWon || homeScore === awayScore ? 1 : 0.5 }}>
        <FlagImg countryCode={awayTeam?.countryCode ?? match.away} size={20} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", flex: 1 }}>
          {awayTeam?.shortName ?? match.away.toUpperCase()}
        </span>
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            fontFamily: "var(--font-spot-mono, monospace)",
            color: awayWon ? "var(--text)" : "var(--text-2)",
          }}
        >
          {awayScore}
        </span>
      </div>

      {/* Home team row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: homeWon || homeScore === awayScore ? 1 : 0.5 }}>
        <FlagImg countryCode={homeTeam?.countryCode ?? match.home} size={20} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", flex: 1 }}>
          {homeTeam?.shortName ?? match.home.toUpperCase()}
        </span>
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            fontFamily: "var(--font-spot-mono, monospace)",
            color: homeWon ? "var(--text)" : "var(--text-2)",
          }}
        >
          {homeScore}
        </span>
      </div>

      {/* AI pick result */}
      <div
        style={{
          borderTop: "1px solid var(--hairline)",
          paddingTop: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: aiPickCorrect ? "var(--green)" : "var(--red)",
          }}
        >
          {aiPickCorrect ? "✓ Hit" : "✗ Miss"}
        </span>
        <span style={{ fontSize: 11, color: "var(--text-ghost)" }}>
          AI picked {aiPickedTeam}
        </span>
      </div>
    </div>
  );
}

// ── Tab types ─────────────────────────────────────────────────────────────────

type TabId = "live" | "today" | "upcoming" | "final";

// ── Flatten all group matches with group context ──────────────────────────────

interface FlatMatch {
  match: GSMatch;
  groupId: string; // group letter A-L, or round label like "Round of 32"
}

function flattenMatches(groups: WCGroup[]): FlatMatch[] {
  return groups.flatMap((g) => g.matches.map((m) => ({ match: m, groupId: g.id })));
}

const ROUND_LABEL: Record<RoundKey, string> = {
  r32: "Round of 32", r16: "Round of 16",
  qf: "Quarterfinal", sf: "Semifinal",
  final: "Final", "3rd": "3rd Place",
};

function flattenBracketMatches(bracket: BracketState): FlatMatch[] {
  const result: FlatMatch[] = [];
  for (const rk of (["r32", "r16", "qf", "sf", "final", "3rd"] as RoundKey[])) {
    for (const slotId of bracket.rounds[rk] ?? []) {
      const bm = bracket.matches[slotId];
      if (!bm || !bm.topTeamId || !bm.bottomTeamId) continue;
      result.push({
        groupId: ROUND_LABEL[rk],
        match: {
          home: bm.topTeamId,
          away: bm.bottomTeamId,
          date: bm.date,
          time: bm.time,
          venue: [bm.venue, bm.city].filter(Boolean).join(", "),
          homeScore: bm.topScore,
          awayScore: bm.bottomScore,
          goals: [],
          status: bm.status === "tbd" ? "scheduled" : bm.status,
        },
      });
    }
  }
  return result;
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface TodayMatchApi {
  groupId: string;
  homeId: string;
  awayId: string;
  date: string;
  time: string;
  venue: string;
  homeScore: number | null;
  awayScore: number | null;
  status: GSMatch["status"];
}

export default function GamesPage() {
  const [activeTab, setActiveTab] = useState<TabId>("today");
  const [groups, setGroups] = useState<WCGroup[]>(WC_GROUPS);
  const [bracket, setBracket] = useState<BracketState>(INITIAL_BRACKET);
  const [isLive, setIsLive] = useState(false);
  const [liveToday, setLiveToday] = useState<FlatMatch[]>([]);

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

    fetch("/api/worldcup/bracket")
      .then((r) => r.json())
      .then((data: BracketState) => {
        if (!cancelled && data?.matches) setBracket(data);
      })
      .catch(() => null);

    // /today has no group-stage restriction, so it still catches real games
    // happening during knockout rounds (cross-group matchups).
    fetch("/api/worldcup/today")
      .then((r) => r.json())
      .then((data: { matches?: TodayMatchApi[] }) => {
        if (cancelled || !Array.isArray(data?.matches)) return;
        setLiveToday(
          data.matches.map((tm) => ({
            groupId: tm.groupId,
            match: {
              home: tm.homeId,
              away: tm.awayId,
              date: tm.date,
              time: tm.time,
              venue: tm.venue,
              homeScore: tm.homeScore,
              awayScore: tm.awayScore,
              goals: [],
              status: tm.status,
            },
          }))
        );
      })
      .catch(() => null);

    return () => { cancelled = true; };
  }, []);

  const groupMatches   = flattenMatches(groups);
  const knockoutMatches = flattenBracketMatches(bracket);

  // Dedupe: bracket matches supersede any group-derived match with the same team pair
  const knockoutPairKeys = new Set(knockoutMatches.map((fm) => `${fm.match.home}_${fm.match.away}`));
  const allMatches = [
    ...groupMatches.filter((fm) => !knockoutPairKeys.has(`${fm.match.home}_${fm.match.away}`)),
    ...knockoutMatches,
  ];

  // Dedupe live-today matches against group-derived ones by team pair
  const groupPairKeys = new Set(allMatches.map((fm) => `${fm.match.home}_${fm.match.away}`));
  const extraLiveToday = liveToday.filter((fm) => !groupPairKeys.has(`${fm.match.home}_${fm.match.away}`));

  const liveMatches = [...allMatches.filter((fm) => fm.match.status === "live"), ...extraLiveToday.filter((fm) => fm.match.status === "live")];
  const completedMatches = allMatches.filter((fm) => fm.match.status === "completed");
  const scheduledMatches = allMatches.filter((fm) => fm.match.status === "scheduled");

  const todayStr = todayLabel();
  const todayMatches = [
    ...scheduledMatches.filter((fm) => fm.match.date === todayStr),
    ...extraLiveToday.filter((fm) => fm.match.status !== "live"),
  ];
  const upcomingMatches = scheduledMatches.filter((fm) => fm.match.date !== todayStr);

  const liveCount = liveMatches.length;

  const tabs: { id: TabId; label: string }[] = [
    { id: "live", label: liveCount > 0 ? `● Live (${liveCount})` : "● Live" },
    { id: "today", label: "Today" },
    { id: "upcoming", label: "Upcoming" },
    { id: "final", label: "Final" },
  ];

  // Group matches by group for tabbed list views
  function groupedMatches(flatList: FlatMatch[]) {
    const byGroup: Record<string, FlatMatch[]> = {};
    for (const fm of flatList) {
      if (!byGroup[fm.groupId]) byGroup[fm.groupId] = [];
      byGroup[fm.groupId].push(fm);
    }
    return byGroup;
  }

  function renderScheduledList(flatList: FlatMatch[]) {
    if (flatList.length === 0) {
      return (
        <div
          style={{
            padding: "48px 0",
            textAlign: "center",
            color: "var(--text-ghost)",
            fontSize: 14,
          }}
        >
          No matches in this category.
        </div>
      );
    }
    const grouped = groupedMatches(flatList);
    return Object.entries(grouped).map(([groupId, items]) => {
      const isGroupLetter = /^[A-L]$/.test(groupId);
      const header = isGroupLetter ? `Group ${groupId}` : groupId;
      return (
        <div key={groupId} style={{ marginBottom: 8 }}>
          <div
            style={{
              padding: "8px 16px",
              fontSize: 11,
              fontWeight: 700,
              color: isGroupLetter ? "var(--text-ghost)" : "var(--gold-2)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              borderBottom: "1px solid var(--hairline)",
              background: isGroupLetter ? "transparent" : "var(--gold-tint)",
            }}
          >
            {header}
          </div>
          {items.map((fm, i) => (
            <MatchRow key={i} match={fm.match} />
          ))}
        </div>
      );
    });
  }

  function renderFinalGrid(flatList: FlatMatch[]) {
    if (flatList.length === 0) {
      return (
        <div
          style={{
            padding: "48px 0",
            textAlign: "center",
            color: "var(--text-ghost)",
            fontSize: 14,
          }}
        >
          No completed matches yet.
        </div>
      );
    }
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
          padding: "16px 0",
        }}
      >
        {flatList.map((fm, i) => (
          <FinalCard key={i} match={fm.match} groupId={fm.groupId} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 32px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
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
            Games
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, marginBottom: 0 }}>
            FIFA World Cup 2026 · Group Stage
          </p>
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

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          borderBottom: "1px solid var(--hairline)",
          paddingBottom: 12,
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "6px 16px",
                borderRadius: "var(--r-chip)",
                border: isActive ? "1px solid var(--gold-line)" : "1px solid transparent",
                background: isActive ? "var(--gold-tint)" : "transparent",
                color: isActive ? "var(--gold)" : "var(--text-ghost)",
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {/* Live tab */}
        {activeTab === "live" && (
          <div>
            {liveMatches.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "80px 0",
                  gap: 16,
                }}
              >
                <div style={{ position: "relative", width: 40, height: 40 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: "var(--gold)",
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: "1px solid rgba(245,158,11,0.3)",
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      animation: "ping 2s ease-in-out infinite",
                    }}
                  />
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-2)" }}>
                  No live matches right now
                </div>
                <div style={{ fontSize: 13, color: "var(--text-ghost)" }}>
                  Check back when the next match kicks off
                </div>
              </div>
            ) : (
              liveMatches.map((fm, i) => (
                <LiveMatchCard key={i} match={fm.match} groupId={fm.groupId} />
              ))
            )}
          </div>
        )}

        {/* Today tab */}
        {activeTab === "today" && (
          <div
            style={{
              background: "var(--panel)",
              borderRadius: "var(--r-card)",
              border: "1px solid var(--hairline)",
              overflow: "hidden",
            }}
          >
            {renderScheduledList(todayMatches.length > 0 ? todayMatches : scheduledMatches.slice(0, 8))}
          </div>
        )}

        {/* Upcoming tab */}
        {activeTab === "upcoming" && (
          <div
            style={{
              background: "var(--panel)",
              borderRadius: "var(--r-card)",
              border: "1px solid var(--hairline)",
              overflow: "hidden",
            }}
          >
            {renderScheduledList(upcomingMatches)}
          </div>
        )}

        {/* Final tab */}
        {activeTab === "final" && renderFinalGrid(completedMatches)}
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes ping {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
