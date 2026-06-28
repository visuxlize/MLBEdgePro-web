"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  RotateCcw, Target, TrendingUp, Loader2, Bot,
  Plus, Check, ChevronRight, Zap, Hexagon, CircleDot, Flame,
} from "lucide-react";
import { PaywallGate } from "@/components/web-tool/paywall-gate";
import { playerHeadshotUrl, fetchTodaysGames, type Game } from "@/lib/mlb/api";
import { LogoBadge, SectionLabel, teamCode, modelEdge } from "@/components/web-tool/spotlight";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface AIPick {
  playerId: number;
  playerName: string;
  teamId: number;
  propType: string;
  probability: number;
  pitcherName: string;
  description: string;
  odds: string;
}

// ── Markdown renderer (subset: ## headers, **bold**, - lists, 1. lists) ────────

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={i++}>{text.slice(last, m.index)}</span>);
    parts.push(<strong key={i++} className="font-black text-white">{m[1]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<span key={i++}>{text.slice(last)}</span>);
  return parts;
}

function MarkdownContent({ text }: { text: string }) {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^#{1,3} /.test(line)) {
      const level = (line.match(/^#+/) ?? [""])[0].length;
      const content = line.replace(/^#+\s*/, "");
      const cls = level === 1
        ? "text-base font-black text-white mt-4 mb-1"
        : level === 2
        ? "text-sm font-black text-white mt-3 mb-1"
        : "text-xs font-black text-white/70 uppercase tracking-widest mt-3 mb-1";
      nodes.push(<p key={key++} className={cls}>{renderInline(content)}</p>);
      i++;
      continue;
    }

    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      nodes.push(
        <ul key={key++} className="space-y-1 my-2 pl-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2">
              <span className="mt-1 shrink-0" style={{ color: "var(--orange)" }}>•</span>
              <span className="text-white/75">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      nodes.push(
        <ol key={key++} className="space-y-2 my-2 pl-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2.5">
              <span className="font-black text-xs mt-0.5 shrink-0 w-4" style={{ color: "var(--orange)" }}>{j + 1}.</span>
              <span className="text-white/75 leading-relaxed flex-1">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (line.trim() === "") { nodes.push(<div key={key++} className="h-2" />); i++; continue; }

    nodes.push(<p key={key++} className="text-white/80 leading-relaxed">{renderInline(line)}</p>);
    i++;
  }

  return <div className="space-y-0.5 font-spot-sans">{nodes}</div>;
}

// ── [PICKS] parser ────────────────────────────────────────────────────────────

function tryParsePicksJson(str: string): AIPick[] {
  const trimmed = str.trim();
  const arrStart = trimmed.indexOf("[");
  if (arrStart === -1) return [];
  try {
    const parsed = JSON.parse(trimmed.slice(arrStart));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseContent(raw: string): { text: string; picks: AIPick[] } {
  const closed = raw.match(/\[PICKS\]\s*([\s\S]*?)\s*\[\/PICKS\]/);
  if (closed) {
    const picks = tryParsePicksJson(closed[1]);
    return { text: raw.slice(0, closed.index).trim(), picks };
  }
  const tagIdx = raw.lastIndexOf("[PICKS]");
  if (tagIdx !== -1) {
    const after = raw.slice(tagIdx + 7);
    const picks = tryParsePicksJson(after);
    if (picks.length > 0) return { text: raw.slice(0, tagIdx).trim(), picks };
    return { text: raw.slice(0, tagIdx).trim(), picks: [] };
  }
  return { text: raw.trim(), picks: [] };
}

// ── Prop color helper ─────────────────────────────────────────────────────────

function propColor(pct: number) {
  return pct >= 65 ? "#34d399" : pct >= 40 ? "#f97316" : "#ef4444";
}

// ── AI Pick card ──────────────────────────────────────────────────────────────

const AI_SLIP_KEY = "edge-ai-pending-picks";

function PickCard({ pick }: { pick: AIPick }) {
  const [added, setAdded] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored: AIPick[] = JSON.parse(localStorage.getItem(AI_SLIP_KEY) || "[]");
    return stored.some((p) => p.description === pick.description);
  });

  const color = propColor(pick.probability);

  function handleAdd() {
    const stored: AIPick[] = JSON.parse(localStorage.getItem(AI_SLIP_KEY) || "[]");
    if (!stored.some((p) => p.description === pick.description)) {
      stored.push(pick);
      localStorage.setItem(AI_SLIP_KEY, JSON.stringify(stored));
    }
    setAdded(true);
    window.dispatchEvent(new Event("ai-picks-updated"));
  }

  return (
    <div className="flex items-center gap-3 rounded-[var(--r-tile)] p-2.5" style={{ background: "var(--panel-2)", border: "1px solid var(--hairline)" }}>
      {pick.propType === "Moneyline" ? (
        <LogoBadge teamId={pick.teamId} name={pick.playerName} size={40} radius={10} />
      ) : (
        <div className="w-10 h-10 shrink-0 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={playerHeadshotUrl(pick.playerId)}
            alt={pick.playerName}
            width={40}
            height={40}
            className="object-contain"
            style={{
              objectPosition: "top center",
              maskImage: "radial-gradient(ellipse 82% 88% at 50% 26%, black 35%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 82% 88% at 50% 26%, black 35%, transparent 100%)",
            }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-spot-sans text-sm font-black text-white leading-tight truncate">{pick.playerName}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="font-spot-sans text-[9px] font-black px-1.5 py-0.5 rounded-full"
            style={{ color, background: `color-mix(in srgb, ${color} 15%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 40%, transparent)` }}>
            {pick.propType}
          </span>
          {pick.pitcherName && <span className="font-spot-sans text-[10px] truncate" style={{ color: "var(--text-muted)" }}>vs {pick.pitcherName.split(" ").pop()}</span>}
          {pick.odds && <span className="font-spot-mono text-[10px] font-black" style={{ color: "var(--text-3)" }}>{pick.odds}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="font-spot-mono text-sm font-black" style={{ color }}>{pick.probability}%</span>
        <button
          onClick={handleAdd}
          disabled={added}
          className="flex items-center gap-1 rounded-[var(--r-chip)] px-2.5 py-1.5 font-spot-sans text-[11px] font-bold transition-all"
          style={added
            ? { color: "var(--green)", background: "var(--green-bg)", border: "1px solid rgba(52,211,153,.4)" }
            : { color: "var(--orange-soft)", background: "var(--orange-tint)", border: "1px solid var(--orange-line)" }}
        >
          {added ? <Check size={10} strokeWidth={2.5} /> : <Plus size={10} strokeWidth={2.5} />}
          {added ? "Added" : "Slip"}
        </button>
      </div>
    </div>
  );
}

// ── AI Pending-slip banner ─────────────────────────────────────────────────────

function PendingPicksBanner() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const refresh = () => {
      const stored: AIPick[] = JSON.parse(localStorage.getItem(AI_SLIP_KEY) || "[]");
      setCount(stored.length);
    };
    refresh();
    window.addEventListener("ai-picks-updated", refresh);
    return () => window.removeEventListener("ai-picks-updated", refresh);
  }, []);
  if (count === 0) return null;
  return (
    <Link href="/analysis?tab=props" className="flex items-center gap-3 mb-4 rounded-[var(--r-tile)] px-4 py-2.5 spot-lift"
      style={{ background: "var(--orange-tint)", border: "1px solid var(--orange-line)" }}>
      <Zap size={13} className="shrink-0" style={{ color: "var(--orange)" }} strokeWidth={2.5} />
      <p className="flex-1 font-spot-sans text-xs font-bold" style={{ color: "var(--orange-soft)" }}>
        {count} AI pick{count > 1 ? "s" : ""} queued — tap to open Prop Builder
      </p>
      <ChevronRight size={13} style={{ color: "var(--orange)" }} strokeWidth={2} />
    </Link>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex gap-3 flex-row-reverse">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--orange-tint)", border: "1px solid var(--orange-line)" }}>
          <span className="font-spot-sans text-[11px] font-black" style={{ color: "var(--orange)" }}>YOU</span>
        </div>
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-3 font-spot-sans text-sm text-white/90 leading-relaxed" style={{ background: "var(--orange-tint)", border: "1px solid var(--orange-line)" }}>
          {msg.content}
        </div>
      </div>
    );
  }

  const { text, picks } = parseContent(msg.content);

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>
        <Bot size={14} style={{ color: "var(--purple-2)" }} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        <div className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm" style={{ background: "rgba(255,255,255,.04)", border: "1px solid var(--hairline)" }}>
          <MarkdownContent text={text || msg.content} />
        </div>
        {picks.length > 0 && (
          <div className="space-y-2">
            <SectionLabel className="pl-1">Add to slip</SectionLabel>
            {picks.map((pick, i) => <PickCard key={i} pick={pick} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>
        <Bot size={14} style={{ color: "var(--purple-2)" }} strokeWidth={2} />
      </div>
      <div className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5" style={{ background: "rgba(255,255,255,.04)", border: "1px solid var(--hairline)" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

// ── Starter prompts ───────────────────────────────────────────────────────────

const STARTERS = [
  { label: "Best bet today",    prompt: "What's the single best bet on today's slate and why?" },
  { label: "Hot HR plays",      prompt: "Which HR props are the hottest today? Give me the top 3 with reasoning." },
  { label: "3-leg safe parlay", prompt: "Build me a 3-leg safe parlay from today's slate. Walk me through each leg." },
  { label: "Value leans",       prompt: "Which games today have the most model edge vs public perception?" },
  { label: "1st inning locks",  prompt: "Which 1st inning Over 0.5 props look strongest today?" },
  { label: "Pitcher K edges",   prompt: "Which pitcher K Over lines have the best edge? Give me K/9, line, and probability." },
  { label: "Moneyline value",   prompt: "Where does the model see the biggest moneyline edge today?" },
];

// ── Ask bar ─────────────────────────────────────────────────────────────────────

function AskBar({
  value, onChange, onSend, streaming, big, inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: (v: string) => void;
  streaming: boolean;
  big?: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <div className="flex items-end gap-2 rounded-[var(--r-panel)] p-2"
      style={{ background: "var(--panel)", border: "1px solid var(--purple-line)", boxShadow: big ? "var(--shadow-card)" : undefined }}>
      <span className="w-9 h-9 flex items-center justify-center shrink-0" style={{ color: "var(--purple-2)" }}>
        <Hexagon size={18} strokeWidth={2} />
      </span>
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(value); } }}
        placeholder="Ask anything about today's slate — picks, props, matchups…"
        rows={1}
        disabled={streaming}
        className="flex-1 bg-transparent font-spot-sans text-sm text-white placeholder:text-white/30 outline-none resize-none max-h-32 px-2 py-2 leading-relaxed disabled:opacity-50"
        style={{ minHeight: big ? "2.75rem" : "2.25rem" }}
        onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = `${Math.min(t.scrollHeight, 128)}px`; }}
      />
      <button
        onClick={() => onSend(value)}
        disabled={!value.trim() || streaming}
        className="flex items-center gap-1.5 rounded-[var(--r-tile)] px-4 h-10 shrink-0 font-spot-sans text-sm font-black text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: "var(--grad-purple)", boxShadow: "0 6px 18px rgba(124,92,250,.3)" }}
      >
        {streaming ? <Loader2 size={15} className="animate-spin" strokeWidth={2.5} /> : <>Ask <span>↗</span></>}
      </button>
    </div>
  );
}

// ── Featured answer card ─────────────────────────────────────────────────────

function FeaturedAnswer({ game, onAsk }: { game: Game; onAsk: (q: string) => void }) {
  const { homeProb, awayProb, favId, favCode } = modelEdge(game);
  const favHome = favId === game.teams.home.team.id;
  const fav = favHome ? game.teams.home : game.teams.away;
  const opp = favHome ? game.teams.away : game.teams.home;
  const favPct = Math.max(homeProb, awayProb);
  const oppCode = teamCode(opp.team.id, opp.team.name);
  const question = "What's the single best bet on today's slate?";

  const reasons = [
    { label: "Model edge", text: `${favPct}% projected win probability — the strongest read on the board.` },
    { label: "Pitching", text: `Run-prevention edge for ${fav.team.name.split(" ").pop()} over ${oppCode}${favHome ? " with the home-field bump" : ""}.` },
    { label: "Matchup", text: `${fav.probablePitcher?.fullName.split(" ").pop() ?? "The starter"} lines up well against the ${oppCode} lineup.` },
  ];

  return (
    <div className="rounded-[var(--r-panel)] p-5" style={{ background: "var(--purple-tint)", border: "1px solid var(--purple-line)", boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Bot size={14} style={{ color: "var(--purple-2)" }} strokeWidth={2} />
        <SectionLabel style={{ color: "var(--purple-soft)" }}>Featured Answer</SectionLabel>
      </div>
      <p className="font-spot-sans text-lg font-black leading-snug mb-3" style={{ color: "var(--text)" }}>{question}</p>

      <div className="flex items-center gap-3 mb-4">
        <LogoBadge teamId={fav.team.id} name={fav.team.name} size={40} />
        <p className="font-spot-sans text-sm" style={{ color: "var(--text-2)" }}>
          <span className="font-black" style={{ color: "var(--text)" }}>{fav.team.name}</span> are the play vs {oppCode} — here&apos;s why.
        </p>
      </div>

      <div className="space-y-2.5 mb-4">
        {reasons.map((r) => (
          <div key={r.label} className="flex items-start gap-2.5">
            <span className="rounded-full mt-1.5 shrink-0" style={{ width: 7, height: 7, background: "var(--purple)" }} />
            <p className="font-spot-sans text-[13px] leading-snug" style={{ color: "var(--text-3)" }}>
              <span className="font-black" style={{ color: "var(--purple-soft)" }}>{r.label}:</span> {r.text}
            </p>
          </div>
        ))}
      </div>

      {/* AI Prediction footer — orange */}
      <button onClick={() => onAsk(question)}
        className="w-full flex items-center justify-between gap-3 rounded-[var(--r-tile)] px-3.5 py-2.5 spot-lift"
        style={{ background: "var(--orange-tint)", border: "1px solid var(--orange-line)" }}>
        <span className="inline-flex items-center gap-1.5 spot-label-sm" style={{ color: "var(--orange-soft)" }}>
          <span>◆</span> AI Prediction
        </span>
        <span className="inline-flex items-center gap-1.5 font-spot-sans font-black text-[13px]" style={{ color: "var(--orange-2)" }}>
          {favCode} ML <span style={{ color: "var(--orange)" }}>↗</span>
        </span>
      </button>
    </div>
  );
}

// ── AI Daily Brief ────────────────────────────────────────────────────────────

function DailyBrief({ games, onAsk }: { games: Game[]; onAsk: (q: string) => void }) {
  const sorted = useMemo(() => [...games].sort((a, b) => modelEdge(b).edge - modelEdge(a).edge), [games]);
  if (!sorted.length) return null;

  const top = sorted[0];
  const dog = [...games].sort((a, b) => modelEdge(a).edge - modelEdge(b).edge)[0]; // tightest game
  const hr = sorted[Math.min(1, sorted.length - 1)];

  const topE = modelEdge(top);
  const dogE = modelEdge(dog);
  const hrAway = hr.teams.away;

  const items = [
    {
      tag: "TOP EDGE", color: "var(--green)", Icon: TrendingUp,
      headline: `${topE.favCode} ML`,
      body: `${Math.max(topE.homeProb, topE.awayProb)}% model win prob — the cleanest single play on today's board.`,
      q: `Break down the ${teamCode(top.teams.away.team.id, top.teams.away.team.name)} @ ${teamCode(top.teams.home.team.id, top.teams.home.team.name)} edge for me.`,
    },
    {
      tag: "VALUE DOG", color: "var(--orange-2)", Icon: Target,
      headline: `${dogE.favCode} live dog`,
      body: `Near coin-flip matchup the model rates closer than the market — value if you like the underdog.`,
      q: `Where's the best underdog value on today's slate?`,
    },
    {
      tag: "HR WATCH", color: "var(--purple-2)", Icon: Flame,
      headline: `${teamCode(hrAway.team.id, hrAway.team.name)} bats`,
      body: `Power spot at ${hr.venue.name} — check HR Nuke for the top home-run probabilities.`,
      q: `Which HR props are hottest today? Give me the top 3.`,
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <CircleDot size={13} style={{ color: "var(--orange)" }} strokeWidth={2} />
        <SectionLabel>AI Daily Brief</SectionLabel>
      </div>
      <div className="space-y-3">
        {items.map((it) => (
          <button key={it.tag} onClick={() => onAsk(it.q)}
            className="w-full text-left rounded-[var(--r-card)] p-4 spot-lift"
            style={{ background: "var(--panel)", border: "1px solid var(--hairline)", borderLeft: `3px solid ${it.color}` }}>
            <span className="inline-flex items-center gap-1 spot-label-sm mb-2" style={{ color: it.color }}>
              <it.Icon size={10} strokeWidth={2.5} /> {it.tag}
            </span>
            <p className="font-spot-sans text-sm font-black mb-1" style={{ color: "var(--text)" }}>{it.headline}</p>
            <p className="font-spot-sans text-[11px] leading-snug" style={{ color: "var(--text-muted)" }}>{it.body}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main chat ─────────────────────────────────────────────────────────────────

function EdgeAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput]       = useState("");
  const [streaming, setStreaming] = useState(false);
  const [games, setGames]       = useState<Game[]>([]);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const abortRef   = useRef<AbortController | null>(null);

  useEffect(() => { fetchTodaysGames().then(setGames).catch(() => setGames([])); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streaming]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const assistantId = crypto.randomUUID();

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);
    abortRef.current = new AbortController();

    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        setMessages((prev) => prev.map((m) => m.id === assistantId
          ? { ...m, content: "Still in development — check back later when it is ready!" } : m));
        return;
      }

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const snap = acc;
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: snap } : m));
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } else {
        setMessages((prev) => prev.map((m) => m.id === assistantId
          ? { ...m, content: "Still in development — check back later when it is ready!" } : m));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }, [messages, streaming]);

  function reset() {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setStreaming(false);
  }

  const isEmpty = messages.length === 0;
  const featured = useMemo(() => {
    if (!games.length) return null;
    return [...games].sort((a, b) => modelEdge(b).edge - modelEdge(a).edge)[0];
  }, [games]);

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>
            <Bot size={19} style={{ color: "var(--purple-2)" }} strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-spot-sans text-xl font-black" style={{ color: "var(--text)" }}>Edge AI</h1>
              <span className="inline-flex items-center gap-1 spot-label-sm rounded-full px-2 py-0.5" style={{ color: "var(--green)", background: "var(--green-bg)" }}>
                <span className="spot-live-dot inline-block rounded-full" style={{ width: 5, height: 5, background: "var(--green)" }} /> Active
              </span>
            </div>
            <p className="font-spot-sans text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              Model live · {games.length} game{games.length === 1 ? "" : "s"} loaded
            </p>
          </div>
        </div>
        {!isEmpty && (
          <button onClick={reset} className="flex items-center gap-1.5 rounded-[var(--r-tile)] px-3 py-1.5 font-spot-sans text-xs spot-lift"
            style={{ color: "var(--text-muted)", background: "var(--panel)", border: "1px solid var(--hairline)" }}>
            <RotateCcw size={11} strokeWidth={2} /> New chat
          </button>
        )}
      </div>

      {isEmpty ? (
        <>
          {/* Hero */}
          <div className="mb-7">
            <h2 className="font-spot-sans text-3xl sm:text-4xl font-black leading-tight mb-4" style={{ color: "var(--text)" }}>
              Ask anything about<br />today&apos;s slate.
            </h2>
            <AskBar value={input} onChange={setInput} onSend={send} streaming={streaming} big inputRef={inputRef} />
            <div className="flex flex-wrap gap-2 mt-3">
              {STARTERS.map((s) => (
                <button key={s.label} onClick={() => send(s.prompt)} disabled={streaming}
                  className="rounded-full px-3 py-1.5 font-spot-sans text-xs font-semibold transition-colors spot-lift"
                  style={{ color: "var(--text-3)", background: "var(--panel)", border: "1px solid var(--hairline)" }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <PendingPicksBanner />

          {/* Two-column body */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-5">
            {featured ? <FeaturedAnswer game={featured} onAsk={send} /> : (
              <div className="rounded-[var(--r-panel)] p-8 text-center" style={{ background: "var(--purple-tint)", border: "1px solid var(--purple-line)" }}>
                <Bot size={32} className="mx-auto mb-3" style={{ color: "var(--purple-2)" }} strokeWidth={1.5} />
                <p className="font-spot-sans text-sm" style={{ color: "var(--text-3)" }}>Ask a question above to get a full breakdown.</p>
              </div>
            )}
            <DailyBrief games={games} onAsk={send} />
          </div>

          <p className="font-spot-sans text-[10px] text-center mt-8" style={{ color: "var(--text-ghost)" }}>
            For educational use only · Not betting advice · Edge AI can make mistakes
          </p>
        </>
      ) : (
        <div className="flex flex-col h-[calc(100vh-12rem)] max-w-3xl mx-auto">
          <PendingPicksBanner />
          <div className="flex-1 overflow-y-auto py-2 space-y-4 min-h-0">
            {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
            {streaming && messages[messages.length - 1]?.role === "user" && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
          <div className="pt-3 shrink-0">
            <AskBar value={input} onChange={setInput} onSend={send} streaming={streaming} inputRef={inputRef} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EdgeAIPage() {
  return (
    <div className="spotlight min-h-screen">
      <div className="px-4 py-6 sm:px-6 sm:py-7">
        <PaywallGate
          feature="Edge AI"
          benefits={[
            "Live analysis of every game on today's slate",
            "HR Nuke matchup grades and DUE/HOT detection",
            "Pick cards with player headshots + one-tap Add to Slip",
            "Reads your bet history to spot patterns",
            "Streaming responses powered by Groq / Claude",
          ]}
        >
          <EdgeAIChat />
        </PaywallGate>
      </div>
    </div>
  );
}
