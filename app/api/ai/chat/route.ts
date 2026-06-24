import { NextRequest, NextResponse } from "next/server";
import { streamChat, type ChatMessage } from "@/lib/anthropic";
import { requirePlan, isNextResponse } from "@/lib/require-plan";
import { rateLimit, getIp } from "@/lib/rate-limit";
import {
  fetchTodaysGames,
  fetchPitcherStats,
  fetchTeamBatters,
  type PitcherSeasonStats,
  type RosterBatter,
} from "@/lib/mlb/api";
import { createClient } from "@/lib/supabase/server";
import { fetchFanDuelOddsMap, lookupOdds } from "@/lib/odds";

const MAX_MESSAGES  = 20;
const MAX_MSG_CHARS = 2_000;

function sanitize(s: string, maxLen = MAX_MSG_CHARS): string {
  return String(s ?? "").slice(0, maxLen).replace(/[`<>]/g, "");
}

// ── Context builders ──────────────────────────────────────────────────────────

function normalCDF(z: number): number {
  return 1 / (1 + Math.exp(-1.7 * z));
}

function hrNukePct(hrPerAb: number, era: number, ops: number): number {
  const power = Math.min(1, Math.max(0, (ops - 0.62) / 0.38));
  return Math.min(35, Math.max(4, Math.round(hrPerAb * 100 * (era / 4.5) * 3.8 + power * 5)));
}

function hitPct(avg: number, whip: number): number {
  const adj = 1.3 / Math.max(0.8, whip);
  const a   = Math.min(0.38, Math.max(0.15, avg * adj));
  return Math.round((1 - Math.pow(1 - a, 4)) * 100);
}

function kLineProp(stats: PitcherSeasonStats) {
  const ip      = parseFloat(stats.inningsPitched) || 1;
  const starts  = Math.max(stats.gamesStarted, 1);
  const avgIp   = Math.min(ip / starts, 7);
  const k9      = stats.strikeOuts / (ip / 9);
  const projKs  = k9 * (avgIp / 9);
  const line    = Math.floor(Math.round(projKs * 10) / 10) + 0.5;
  const z       = (line + 0.5 - Math.max(projKs, 0.5)) / Math.max(Math.sqrt(Math.max(projKs, 0.5)), 0.5);
  const overPct = Math.min(82, Math.max(18, Math.round(100 * (1 - normalCDF(z)))));
  return { k9: k9.toFixed(1), line, overPct };
}

function firstInningPct(pitcher: PitcherSeasonStats, oppAvg: number): number {
  let p = 38 + (pitcher.whip - 1.30) * 30 + (pitcher.era - 4.0) * 3 + (oppAvg - 0.245) * 80;
  return Math.min(72, Math.max(25, Math.round(p)));
}

function moneylineWinPct(homePitcher: PitcherSeasonStats, awayPitcher: PitcherSeasonStats): { home: number; away: number; confidence: string } {
  let adj = ((awayPitcher.era - homePitcher.era) / 6) * 12
    + ((awayPitcher.whip - homePitcher.whip) / 1.5) * 8
    + ((homePitcher.strikeoutsPer9Inn - awayPitcher.strikeoutsPer9Inn) / 10) * 5
    + 4;
  const home = Math.round(Math.min(85, Math.max(15, 50 + adj)));
  const diff = Math.abs(home - 50);
  return { home, away: 100 - home, confidence: diff >= 18 ? "HIGH" : diff >= 10 ? "MEDIUM" : "LOW" };
}

function topBattersCtx(batters: RosterBatter[], pitcher: PitcherSeasonStats, propType: "HR" | "Hit", n = 4) {
  return batters
    .map((b) => {
      const ab  = Math.max(b.stats.atBats, 1);
      const avg = parseFloat(b.stats.avg) || 0.22;
      const ops = parseFloat(b.stats.ops) || 0.70;
      const pct = propType === "HR"
        ? hrNukePct(b.stats.homeRuns / ab, pitcher.era, ops)
        : hitPct(avg, pitcher.whip);
      return { id: b.id, name: b.fullName, teamId: b.teamId, pct };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, n);
}

async function buildGameContext(oddsMap: Record<string, string>): Promise<string> {
  const games = await fetchTodaysGames();
  const withPitchers = games.filter(
    (g) => g.teams.away.probablePitcher || g.teams.home.probablePitcher,
  );
  if (!withPitchers.length) return "No games with confirmed pitchers today.";

  const lines: string[] = [];

  await Promise.all(
    withPitchers.map(async (game) => {
      try {
        const [hb, ab, hp, ap] = await Promise.all([
          fetchTeamBatters(game.teams.home.team.id).catch(() => [] as RosterBatter[]),
          fetchTeamBatters(game.teams.away.team.id).catch(() => [] as RosterBatter[]),
          game.teams.home.probablePitcher ? fetchPitcherStats(game.teams.home.probablePitcher.id).catch(() => null) : Promise.resolve(null as PitcherSeasonStats | null),
          game.teams.away.probablePitcher ? fetchPitcherStats(game.teams.away.probablePitcher.id).catch(() => null) : Promise.resolve(null as PitcherSeasonStats | null),
        ]);

        const homeTeam = game.teams.home.team.name;
        const awayTeam = game.teams.away.team.name;
        const hpName   = game.teams.home.probablePitcher?.fullName ?? "TBD";
        const apName   = game.teams.away.probablePitcher?.fullName ?? "TBD";

        let block = `\nGAME: ${awayTeam} @ ${homeTeam} | ${game.venue.name}`;

        if (hp) {
          const kp = kLineProp(hp);
          block += `\n  Home Pitcher: ${hpName} [pid:${game.teams.home.probablePitcher!.id}] — ERA ${hp.era.toFixed(2)}, WHIP ${hp.whip.toFixed(2)}, K/9 ${hp.strikeoutsPer9Inn.toFixed(1)} | K Line: ${kp.line} (Over ${kp.overPct}%)`;
          if (ab.length) {
            const fi = firstInningPct(hp, ab.slice(0,4).reduce((s,b) => s + (parseFloat(b.stats.avg)||0.245), 0) / Math.min(ab.length,4));
            block += ` | 1st Inn Over 0.5: ${fi}%`;
            const hrPicks = topBattersCtx(ab, hp, "HR", 3);
            const hitPicks = topBattersCtx(ab, hp, "Hit", 3);
            if (hrPicks.length) block += `\n  HR vs ${hpName}: ${hrPicks.map(p=>{const o=lookupOdds(oddsMap,p.name,"HR"); return `${p.name}[pid:${p.id},tid:${p.teamId}] ${p.pct}%${o?` FD:${o}`:""}`}).join(" | ")}`;
            if (hitPicks.length) block += `\n  Hit vs ${hpName}: ${hitPicks.map(p=>{const o=lookupOdds(oddsMap,p.name,"Hit"); return `${p.name}[pid:${p.id},tid:${p.teamId}] ${p.pct}%${o?` FD:${o}`:""}`}).join(" | ")}`;
          }
        }
        if (ap) {
          const kp = kLineProp(ap);
          const kOdds = lookupOdds(oddsMap, apName, "Pitcher K's");
          block += `\n  Away Pitcher: ${apName} [pid:${game.teams.away.probablePitcher!.id}] — ERA ${ap.era.toFixed(2)}, WHIP ${ap.whip.toFixed(2)}, K/9 ${ap.strikeoutsPer9Inn.toFixed(1)} | K Line: ${kp.line} (Over ${kp.overPct}%${kOdds?` FD:${kOdds}`:""})`;
          if (hb.length) {
            const fi = firstInningPct(ap, hb.slice(0,4).reduce((s,b) => s + (parseFloat(b.stats.avg)||0.245), 0) / Math.min(hb.length,4));
            block += ` | 1st Inn Over 0.5: ${fi}%`;
            const hrPicks = topBattersCtx(hb, ap, "HR", 3);
            const hitPicks = topBattersCtx(hb, ap, "Hit", 3);
            if (hrPicks.length) block += `\n  HR vs ${apName}: ${hrPicks.map(p=>{const o=lookupOdds(oddsMap,p.name,"HR"); return `${p.name}[pid:${p.id},tid:${p.teamId}] ${p.pct}%${o?` FD:${o}`:""}`}).join(" | ")}`;
            if (hitPicks.length) block += `\n  Hit vs ${apName}: ${hitPicks.map(p=>{const o=lookupOdds(oddsMap,p.name,"Hit"); return `${p.name}[pid:${p.id},tid:${p.teamId}] ${p.pct}%${o?` FD:${o}`:""}`}).join(" | ")}`;
          }
        }
        if (hp && ap) {
          const ml = moneylineWinPct(hp, ap);
          const homeML = lookupOdds(oddsMap, homeTeam, "Moneyline");
          const awayML = lookupOdds(oddsMap, awayTeam, "Moneyline");
          block += `\n  Moneyline: ${homeTeam} ${ml.home}%${homeML?` FD:${homeML}`:""} vs ${awayTeam} ${ml.away}%${awayML?` FD:${awayML}`:""} (${ml.confidence} conf.)`;
        }

        lines.push(block);
      } catch {
        // skip failed game
      }
    }),
  );

  return lines.join("\n");
}

async function buildBetHistoryContext(userId: string): Promise<string> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("bet_slips")
      .select("*")
      .eq("clerk_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(25);

    if (!data?.length) return "User has no saved bet slips yet.";

    const won     = data.filter((s) => s.status === "won").length;
    const lost    = data.filter((s) => s.status === "lost").length;
    const pending = data.filter((s) => s.status === "pending").length;
    const settled = won + lost;
    const winRate = settled > 0 ? Math.round((won / settled) * 100) : null;

    let summary = `Bet History: ${data.length} total slips | Won: ${won} | Lost: ${lost} | Pending: ${pending}`;
    if (winRate !== null) summary += ` | Win Rate: ${winRate}%`;

    const recent = data.slice(0, 5).map((s) => {
      const legDescs = (s.legs as Array<{ description: string; probability: number }>)
        .map((l) => `${l.description} (${l.probability}%)`)
        .join("; ");
      return `  [${s.status?.toUpperCase()}] ${legDescs}`;
    });
    summary += `\nRecent 5 slips:\n${recent.join("\n")}`;

    return summary;
  } catch {
    return "Bet history unavailable.";
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Rate limit: 30 requests per minute per IP
  const ip = getIp(req);
  const rl = rateLimit(`chat:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  // Require Fan plan or above
  const planResult = await requirePlan("fan");
  if (isNextResponse(planResult)) return planResult;
  const { userId } = planResult;

  let messages: ChatMessage[];
  try {
    const body = await req.json();
    const raw: unknown[] = Array.isArray(body.messages) ? body.messages : [];

    // Enforce message count and length limits
    if (raw.length > MAX_MESSAGES) {
      return NextResponse.json({ error: "Too many messages in conversation." }, { status: 400 });
    }

    messages = (raw as ChatMessage[]).map((m) => ({
      role:    m.role === "assistant" ? "assistant" : "user",
      content: sanitize(String(m.content ?? ""), MAX_MSG_CHARS),
    }));
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!messages.length) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  const [oddsMap, betHistory] = await Promise.all([
    fetchFanDuelOddsMap(),
    buildBetHistoryContext(userId),
  ]);
  const gameContext = await buildGameContext(oddsMap);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const systemPrompt = `You are Edge AI — MLB Edge Pro's embedded analyst, powered by Claude. You have real-time access to today's full game slate, prop probabilities, HR Nuke matchup grades, 1st inning predictions, moneyline models, live FanDuel odds (marked FD: in the context), and this user's personal bet history.

TODAY: ${today}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TODAY'S GAME DATA & PROP CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${gameContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER BET HISTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${betHistory}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Be direct, specific, and data-driven. Reference real player names, pitchers, percentages.
- Use **bold** for player names, team names, pick labels, and key stats.
- Use ## for section headers (e.g. ## Parlay Breakdown, ## Why This Works).
- Use numbered or bulleted lists for multi-pick responses.
- When recommending bets, explain WHY using the actual numbers from context.
- Never say "I don't have access to" — you have all the data above.
- Keep responses punchy and actionable. No filler. No excessive hedging.
- If the user's bet history shows patterns, address it honestly.
- Disclaimer: add one line at the very end only when recommending bets.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURED PICKS — REQUIRED FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Whenever you recommend specific player or team props, append a [PICKS] block at the VERY END of your response (after all text). This powers the "Add to Slip" UI buttons.

[PICKS]
[
  {"playerId":656941,"playerName":"Kyle Schwarber","teamId":143,"propType":"HR","probability":35,"pitcherName":"Patrick Corbin","description":"Kyle Schwarber HR vs Patrick Corbin","odds":"+800"},
  {"playerId":592518,"playerName":"Yandy Díaz","teamId":139,"propType":"Hit","probability":82,"pitcherName":"Connelly Early","description":"Yandy Díaz 1+ Hit vs Early","odds":"-145"}
]
[/PICKS]

Rules:
- Use the exact [pid:X] IDs from the game context above for playerId
- propType must be exactly one of: "HR", "Hit", "2+ Hits", "2+ Bases", "Pitcher K's", "1st Inn O/U", "Moneyline"
- odds: use the real FanDuel odds from the "FD:" markers in the context when available; otherwise estimate
- Maximum 6 picks per block
- ONLY include this block when you recommend specific player/team props. Skip it for general analysis, history questions, or educational explanations.`;

  const stream = streamChat(systemPrompt, messages);

  return new Response(stream, {
    headers: {
      "Content-Type":           "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control":          "no-cache",
    },
  });
}
