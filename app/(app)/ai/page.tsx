"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Send, RotateCcw, CircleDot, Layers,
  Target, BookOpen, TrendingUp, Clock, Loader2, Bot,
  Plus, Check, ChevronRight, Zap,
} from "lucide-react";
import { PaywallGate } from "@/components/web-tool/paywall-gate";
import { playerHeadshotUrl } from "@/lib/mlb/api";

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

// ── Markdown renderer ─────────────────────────────────────────────────────────
// Parses a subset of markdown: ## headers, **bold**, - lists, 1. lists

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

    // ## Header
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

    // Bullet list (consecutive - or * lines)
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
              <span className="text-[#FF7828] mt-1 shrink-0">•</span>
              <span className="text-white/75">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list (consecutive "N." lines)
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
              <span className="text-[#FF7828] font-black text-xs mt-0.5 shrink-0 w-4">{j + 1}.</span>
              <span className="text-white/75 leading-relaxed flex-1">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty line → spacing
    if (line.trim() === "") {
      nodes.push(<div key={key++} className="h-2" />);
      i++;
      continue;
    }

    // Paragraph
    nodes.push(
      <p key={key++} className="text-white/80 leading-relaxed">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{nodes}</div>;
}

// ── [PICKS] parser ────────────────────────────────────────────────────────────

function parseContent(raw: string): { text: string; picks: AIPick[] } {
  const match = raw.match(/\[PICKS\]\s*([\s\S]*?)\s*\[\/PICKS\]/);
  if (!match) return { text: raw.trim(), picks: [] };

  const text = raw.slice(0, match.index).trim();
  let picks: AIPick[] = [];
  try {
    picks = JSON.parse(match[1].trim());
    if (!Array.isArray(picks)) picks = [];
  } catch {
    picks = [];
  }
  return { text, picks };
}

// ── Prop color helper ─────────────────────────────────────────────────────────

function propColor(pct: number) {
  return pct >= 65 ? "#50C882" : pct >= 40 ? "#FF7828" : "#EB505A";
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
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0D1117] p-2.5">
      {/* Headshot */}
      <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-white/5 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={playerHeadshotUrl(pick.playerId)}
          alt={pick.playerName}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-white leading-tight truncate">{pick.playerName}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span
            className="text-[9px] font-black px-1.5 py-0.5 rounded-full border"
            style={{ color, borderColor: `${color}40`, backgroundColor: `${color}15` }}
          >
            {pick.propType}
          </span>
          {pick.pitcherName && (
            <span className="text-[10px] text-white/35 truncate">
              vs {pick.pitcherName.split(" ").pop()}
            </span>
          )}
          {pick.odds && (
            <span className="text-[10px] font-black text-white/50">{pick.odds}</span>
          )}
        </div>
      </div>

      {/* Pct + Add */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-black" style={{ color }}>{pick.probability}%</span>
        <button
          onClick={handleAdd}
          disabled={added}
          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-all ${
            added
              ? "border-[#50C882]/40 bg-[#50C882]/10 text-[#50C882]"
              : "border-[#FF7828]/30 bg-[#FF7828]/10 text-[#FF7828] hover:bg-[#FF7828]/18"
          }`}
        >
          {added ? <Check size={10} strokeWidth={2.5} /> : <Plus size={10} strokeWidth={2.5} />}
          {added ? "Added" : "Slip"}
        </button>
      </div>
    </div>
  );
}

// ── AI Pending-slip banner (shown when picks are queued) ──────────────────────

function PendingPicksBanner() {
  const [count, setCount] = useState(0);

  function refresh() {
    const stored: AIPick[] = JSON.parse(localStorage.getItem(AI_SLIP_KEY) || "[]");
    setCount(stored.length);
  }

  useEffect(() => {
    refresh();
    window.addEventListener("ai-picks-updated", refresh);
    return () => window.removeEventListener("ai-picks-updated", refresh);
  }, []);

  if (count === 0) return null;

  return (
    <Link
      href="/props"
      className="flex items-center gap-3 mx-4 mb-3 rounded-xl border border-[#FF7828]/30 bg-[#FF7828]/10 px-4 py-2.5 hover:bg-[#FF7828]/16 transition-colors"
    >
      <Zap size={13} className="text-[#FF7828] shrink-0" strokeWidth={2.5} />
      <p className="flex-1 text-xs font-bold text-[#FF7828]">
        {count} AI pick{count > 1 ? "s" : ""} queued — tap to open Prop Builder
      </p>
      <ChevronRight size={13} className="text-[#FF7828]/60 shrink-0" strokeWidth={2} />
    </Link>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex gap-3 flex-row-reverse">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-[#FF7828]/15 border border-[#FF7828]/30">
          <span className="text-[11px] font-black text-[#FF7828]">YOU</span>
        </div>
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-3 bg-[#FF7828]/10 border border-[#FF7828]/20 text-sm text-white/90 leading-relaxed">
          {msg.content}
        </div>
      </div>
    );
  }

  const { text, picks } = parseContent(msg.content);

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-[#818cf8]/15 border border-[#818cf8]/30">
        <Bot size={14} className="text-[#818cf8]" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        {/* Text bubble */}
        <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-white/[0.04] border border-white/[0.07] text-sm">
          <MarkdownContent text={text || msg.content} />
        </div>

        {/* Pick cards */}
        {picks.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">
              Add to slip
            </p>
            {picks.map((pick, i) => (
              <PickCard key={i} pick={pick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-[#818cf8]/15 border border-[#818cf8]/30">
        <Bot size={14} className="text-[#818cf8]" strokeWidth={2} />
      </div>
      <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

// ── Starter prompts ───────────────────────────────────────────────────────────

const STARTERS = [
  { icon: TrendingUp, color: "#50C882",  label: "Best bet today",    prompt: "What's the single best bet on today's slate and why?" },
  { icon: Target,     color: "#FF7828",  label: "Hot HR plays",      prompt: "Which HR props are the hottest today? Give me the top 3 with reasoning." },
  { icon: Layers,     color: "#818cf8",  label: "3-leg safe parlay", prompt: "Build me a 3-leg safe parlay from today's slate. Walk me through each leg." },
  { icon: BookOpen,   color: "#f472b6",  label: "Analyze my history",prompt: "Look at my bet history: where am I leaking value and what should I change?" },
  { icon: CircleDot,  color: "#fbbf24",  label: "1st inning locks",  prompt: "Which 1st inning Over 0.5 props look strongest today?" },
  { icon: Clock,      color: "#2dd4bf",  label: "Pitcher K edges",   prompt: "Which pitcher K Over lines have the best edge? Give me K/9, line, and probability." },
  { icon: TrendingUp, color: "#60B4F0",  label: "Moneyline value",   prompt: "Where does the model see the biggest moneyline edge today?" },
  { icon: Zap,        color: "#FF7828",  label: "5-leg long shot",   prompt: "Give me a 5-leg long shot parlay with solid upside. Explain each pick." },
];

const CONTEXT_PILLS = [
  { icon: CircleDot,  label: "Today's Games", color: "#50C882"  },
  { icon: Target,     label: "HR Nuke Model", color: "#FF7828"  },
  { icon: Layers,     label: "Prop Data",     color: "#818cf8"  },
  { icon: BookOpen,   label: "Bet History",   color: "#f472b6"  },
  { icon: TrendingUp, label: "Edge Scores",   color: "#fbbf24"  },
  { icon: Clock,      label: "1st Inn Model", color: "#2dd4bf"  },
];

// ── Main chat ─────────────────────────────────────────────────────────────────

function EdgeAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput]       = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const abortRef   = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMsg: ChatMessage    = { id: crypto.randomUUID(), role: "user", content: trimmed };
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
          ? { ...m, content: "Still in development — check back later when it is ready!" }
          : m
        ));
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
          ? { ...m, content: "Still in development — check back later when it is ready!" }
          : m
        ));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }, [messages, streaming]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  function reset() {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setStreaming(false);
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#818cf8]/15 border border-[#818cf8]/30 flex items-center justify-center">
            <Bot size={18} className="text-[#818cf8]" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-black text-white">Edge AI</p>
            <p className="text-[10px] text-white/35">Powered by Groq / Claude · Real-time MLB data</p>
          </div>
        </div>
        {!isEmpty && (
          <button onClick={reset} className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/40 hover:text-white hover:border-white/[0.14] transition-colors">
            <RotateCcw size={11} strokeWidth={2} />
            New chat
          </button>
        )}
      </div>

      {/* Pending picks banner */}
      {!isEmpty && <PendingPicksBanner />}

      {/* Context pills */}
      {isEmpty && (
        <div className="px-4 pt-4 flex flex-wrap gap-2 shrink-0">
          {CONTEXT_PILLS.map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold"
              style={{ borderColor: `${color}30`, backgroundColor: `${color}10`, color }}>
              <Icon size={9} strokeWidth={2.5} />
              {label}
            </div>
          ))}
        </div>
      )}

      {/* Messages / starters */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {isEmpty ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#818cf8]/20 bg-[#818cf8]/[0.06] p-5">
              <p className="text-sm font-black text-white mb-1">Ask me anything about today&apos;s slate.</p>
              <p className="text-xs text-white/45 leading-relaxed">
                Live game data, HR Nuke grades, props, 1st inning models, moneyline predictions, and your
                bet history — all loaded. Ask for picks and I&apos;ll show &ldquo;Add to Slip&rdquo; buttons you can send
                straight to the Prop Builder.
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-3">Try asking…</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STARTERS.map(({ icon: Icon, color, label, prompt }) => (
                  <button key={label} onClick={() => send(prompt)} disabled={streaming}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12] px-4 py-3 text-left transition-all">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                      <Icon size={13} style={{ color }} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{label}</p>
                      <p className="text-[10px] text-white/30 leading-snug mt-0.5 line-clamp-1">{prompt}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
            {streaming && messages[messages.length - 1]?.role === "user" && <TypingIndicator />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 pb-4 shrink-0">
        <div className="flex items-end gap-2 rounded-2xl border border-white/[0.10] bg-[#111622] p-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about today's picks, your bet history, props…"
            rows={1}
            disabled={streaming}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none resize-none max-h-32 px-2 py-1.5 leading-relaxed disabled:opacity-50"
            style={{ minHeight: "2.25rem" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || streaming}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-[#FF7828] hover:bg-[#FFA550]"
          >
            {streaming
              ? <Loader2 size={15} className="text-white animate-spin" strokeWidth={2.5} />
              : <Send size={15} className="text-white" strokeWidth={2.5} />
            }
          </button>
        </div>
        <p className="text-[10px] text-white/18 text-center mt-2">
          For educational use only · Not betting advice · Edge AI can make mistakes
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EdgeAIPage() {
  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6 max-w-screen-xl mx-auto">
      <div className="mb-5">
        <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-1">Powered by Groq / Claude</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">Edge AI</h1>
        <p className="text-sm text-white/35">
          Your personal MLB analyst — ask for picks and add them straight to your slip.
        </p>
      </div>
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
  );
}
