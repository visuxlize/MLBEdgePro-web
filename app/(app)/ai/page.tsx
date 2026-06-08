"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Zap, RotateCcw, CircleDot, Layers,
  Target, BookOpen, TrendingUp, Clock, Loader2, Bot,
} from "lucide-react";
import { PaywallGate } from "@/components/web-tool/paywall-gate";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// ── Starter prompts ───────────────────────────────────────────────────────────

const STARTERS = [
  {
    icon: TrendingUp,
    color: "#50C882",
    label: "Best bet today",
    prompt: "What's the single best bet on today's slate and why?",
  },
  {
    icon: Target,
    color: "#FF7828",
    label: "Hot HR plays",
    prompt: "Which HR props are the hottest today based on the nuke model? Give me the top 3 with reasoning.",
  },
  {
    icon: Layers,
    color: "#818cf8",
    label: "3-leg safe parlay",
    prompt: "Build me a 3-leg safe parlay from today's slate. Walk me through why each leg makes sense.",
  },
  {
    icon: BookOpen,
    color: "#f472b6",
    label: "Analyze my history",
    prompt: "Look at my bet history and tell me honestly: where am I leaking value and what should I change?",
  },
  {
    icon: CircleDot,
    color: "#fbbf24",
    label: "1st inning locks",
    prompt: "Which 1st inning Over 0.5 props look strongest today? Which pitchers are vulnerable early?",
  },
  {
    icon: Clock,
    color: "#2dd4bf",
    label: "Pitcher K edges",
    prompt: "Which pitcher strikeout Over lines have the best edge today? Give me K/9, the line, and the probability.",
  },
  {
    icon: TrendingUp,
    color: "#60B4F0",
    label: "Moneyline value",
    prompt: "Where does the model see the biggest moneyline edge today? Which team is the model most confident on?",
  },
  {
    icon: Zap,
    color: "#FF7828",
    label: "5-leg long shot",
    prompt: "Give me a 5-leg long shot parlay with solid upside. Explain each pick.",
  },
];

// ── Context pills ─────────────────────────────────────────────────────────────

const CONTEXT_PILLS = [
  { icon: CircleDot,  label: "Today's Games", color: "#50C882"  },
  { icon: Target,     label: "HR Nuke Model", color: "#FF7828"  },
  { icon: Layers,     label: "Prop Data",     color: "#818cf8"  },
  { icon: BookOpen,   label: "Bet History",   color: "#f472b6"  },
  { icon: TrendingUp, label: "Edge Scores",   color: "#fbbf24"  },
  { icon: Clock,      label: "1st Inn Model", color: "#2dd4bf"  },
];

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
        isUser
          ? "bg-[#FF7828]/15 border border-[#FF7828]/30"
          : "bg-[#818cf8]/15 border border-[#818cf8]/30"
      }`}>
        {isUser
          ? <span className="text-[11px] font-black text-[#FF7828]">YOU</span>
          : <Bot size={14} className="text-[#818cf8]" strokeWidth={2} />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? "bg-[#FF7828]/10 border border-[#FF7828]/20 text-white rounded-tr-sm"
          : "bg-white/[0.04] border border-white/[0.07] text-white/85 rounded-tl-sm"
      }`}>
        {msg.content}
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
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main chat component ───────────────────────────────────────────────────────

function EdgeAIChat() {
  const [messages, setMessages]     = useState<ChatMessage[]>([]);
  const [input, setInput]           = useState("");
  const [streaming, setStreaming]   = useState(false);
  const bottomRef                   = useRef<HTMLDivElement>(null);
  const inputRef                    = useRef<HTMLTextAreaElement>(null);
  const abortRef                    = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const assistantId = crypto.randomUUID();

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    // Seed a streaming assistant message
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    abortRef.current = new AbortController();

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: history }),
        signal:  abortRef.current.signal,
      });

      if (!res.ok) {
        // Show friendly message instead of raw API error
        setMessages((prev) =>
          prev.map((m) => m.id === assistantId
            ? { ...m, content: "Still in development — check back later when it is ready!" }
            : m
          ),
        );
        setStreaming(false);
        abortRef.current = null;
        return;
      }

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const snap = accumulated;
        setMessages((prev) =>
          prev.map((m) => m.id === assistantId ? { ...m, content: snap } : m),
        );
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } else {
        setMessages((prev) =>
          prev.map((m) => m.id === assistantId
            ? { ...m, content: "Still in development — check back later when it is ready!" }
            : m
          ),
        );
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }, [messages, streaming]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
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

      {/* ── Header ── */}
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
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/40 hover:text-white hover:border-white/[0.14] transition-colors"
          >
            <RotateCcw size={11} strokeWidth={2} />
            New chat
          </button>
        )}
      </div>

      {/* ── Context pills ── */}
      {isEmpty && (
        <div className="px-4 pt-4 flex flex-wrap gap-2 shrink-0">
          {CONTEXT_PILLS.map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold"
              style={{ borderColor: `${color}30`, backgroundColor: `${color}10`, color }}
            >
              <Icon size={9} strokeWidth={2.5} />
              {label}
            </div>
          ))}
        </div>
      )}

      {/* ── Messages or starters ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {isEmpty ? (
          <div className="space-y-6">
            {/* Welcome */}
            <div className="rounded-2xl border border-[#818cf8]/20 bg-[#818cf8]/[0.06] p-5">
              <p className="text-sm font-black text-white mb-1">Ask me anything about today&apos;s slate.</p>
              <p className="text-xs text-white/45 leading-relaxed">
                I have live access to all today&apos;s games, pitching matchups, HR Nuke grades, prop probabilities,
                1st inning models, moneyline predictions, and your full bet history. Ask for picks, analysis, or
                anything in between.
              </p>
            </div>

            {/* Starter grid */}
            <div>
              <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-3">Try asking…</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STARTERS.map(({ icon: Icon, color, label, prompt }) => (
                  <button
                    key={label}
                    onClick={() => send(prompt)}
                    disabled={streaming}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12] px-4 py-3 text-left transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}15` }}>
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
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {streaming && messages[messages.length - 1]?.role === "user" && (
              <TypingIndicator />
            )}
          </>
        )}



        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
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
        <p className="text-[10px] font-bold text-white/25 tracking-widest uppercase mb-1">Powered by Claude</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">Edge AI</h1>
        <p className="text-sm text-white/35">
          Your personal MLB analyst — ask about games, props, your bet history, or anything in between.
        </p>
      </div>

      <PaywallGate
        feature="Edge AI"
        benefits={[
          "Live analysis of every game on today's slate",
          "HR Nuke matchup grades and DUE/HOT detection",
          "Prop Builder data — Hit, HR, K's, 1st Inn, Moneyline",
          "Reads your bet history to spot patterns",
          "Streaming responses powered by Claude",
        ]}
      >
        <EdgeAIChat />
      </PaywallGate>
    </div>
  );
}
