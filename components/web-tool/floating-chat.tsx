"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bot, X, Send, Loader2, ExternalLink, Sparkles, TrendingUp, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Pick {
  playerId?: number;
  playerName?: string;
  teamId?: number;
  propType: string;
  probability: number;
  pitcherName?: string;
  description: string;
  odds?: string;
}

function parseMessage(content: string): { text: string; picks: Pick[] } {
  const picksMatch = content.match(/\[PICKS\]([\s\S]*?)\[\/PICKS\]/);
  const text = content.replace(/\[PICKS\][\s\S]*?\[\/PICKS\]/g, "").trimEnd();
  let picks: Pick[] = [];
  if (picksMatch) {
    try { picks = JSON.parse(picksMatch[1].trim()); } catch { /* ignore malformed */ }
  }
  return { text, picks };
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={i++}>{text.slice(last, m.index)}</span>);
    parts.push(<strong key={i++} className="font-black text-white">{m[1]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<span key={i++}>{text.slice(last)}</span>);
  return parts;
}

function SimpleMarkdown({ text }: { text: string }) {
  return (
    <div className="space-y-1">
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        if (/^#{1,3} /.test(line)) {
          return <p key={i} className="text-xs font-black text-white mt-2">{line.replace(/^#+\s*/, "")}</p>;
        }
        if (/^[-*] /.test(line)) {
          return (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-[#818cf8] text-xs mt-0.5 shrink-0">•</span>
              <span className="text-xs text-white/75 leading-relaxed">{renderInline(line.replace(/^[-*]\s+/, ""))}</span>
            </div>
          );
        }
        if (/^\d+\. /.test(line)) {
          const num = line.match(/^(\d+)\. /)?.[1];
          return (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-[10px] font-black text-[#818cf8]/70 mt-0.5 shrink-0 w-3">{num}.</span>
              <span className="text-xs text-white/75 leading-relaxed">{renderInline(line.replace(/^\d+\.\s+/, ""))}</span>
            </div>
          );
        }
        return <p key={i} className="text-xs text-white/80 leading-relaxed">{renderInline(line)}</p>;
      })}
    </div>
  );
}

const PROP_COLORS: Record<string, string> = {
  HR: "#FF7828",
  Hit: "#22c55e",
  "2+ Hits": "#22c55e",
  "2+ Bases": "#84cc16",
  "Pitcher K's": "#818cf8",
  "1st Inn O/U": "#f59e0b",
  Moneyline: "#06b6d4",
};

function PickCard({ pick }: { pick: Pick }) {
  const color = PROP_COLORS[pick.propType] ?? "#818cf8";
  const isBullish = pick.probability >= 70;

  return (
    <div className="rounded-xl border bg-white/[0.03] px-3 py-2.5 flex items-center gap-2.5"
      style={{ borderColor: `${color}28` }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <TrendingUp size={13} style={{ color }} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-black text-white leading-tight truncate">
          {pick.playerName ?? pick.description.split(" ").slice(0, 2).join(" ")}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[9px] font-bold rounded-full px-1.5 py-0.5"
            style={{ background: `${color}20`, color }}>
            {pick.propType}
          </span>
          {pick.pitcherName && (
            <span className="text-[9px] text-white/30 truncate">vs {pick.pitcherName.split(" ").pop()}</span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span className={`text-xs font-black tabular-nums ${isBullish ? "text-emerald-400" : "text-white/70"}`}>
          {pick.probability}%
        </span>
        {pick.odds && <span className="text-[9px] text-white/30">{pick.odds}</span>}
      </div>
    </div>
  );
}

const QUICK_PROMPTS = [
  "Best bet today?",
  "Top HR plays?",
  "Safe 3-leg parlay?",
  "Pitcher K edges?",
];

export function FloatingChat() {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [input, setInput]         = useState("");
  const [streaming, setStreaming] = useState(false);
  const [unread, setUnread]       = useState(0);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const abortRef   = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    if (open) { setUnread(0); inputRef.current?.focus(); }
  }, [open]);

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
        setMessages((prev) => prev.map((m) =>
          m.id === assistantId ? { ...m, content: "Still spinning up — check back shortly!" } : m
        ));
        if (!open) setUnread((n) => n + 1);
        return;
      }

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: acc } : m));
      }
      if (!open) setUnread((n) => n + 1);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setMessages((prev) => prev.map((m) =>
          m.id === assistantId ? { ...m, content: "Still spinning up — check back shortly!" } : m
        ));
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [messages, streaming, open]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-80 sm:w-[380px] rounded-2xl border border-white/[0.10] bg-[#0D1117] flex flex-col overflow-hidden"
            style={{
              height: 500,
              boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(129,140,248,0.08), 0 8px 32px rgba(129,140,248,0.12)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] shrink-0"
              style={{ background: "linear-gradient(135deg, #111827 0%, #0f1420 100%)" }}>
              <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #818cf8, #6366f1)", boxShadow: "0 0 12px rgba(99,102,241,0.4)" }}>
                  <Sparkles size={14} className="text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs font-black text-white leading-tight tracking-tight">Edge AI</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-[9px] text-white/35">MLB analysis · Live data</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Link
                  href="/ai"
                  className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-[10px] text-white/40 hover:text-white hover:border-white/[0.14] transition-colors"
                >
                  <ExternalLink size={9} strokeWidth={2} />
                  Full view
                </Link>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.07] transition-colors"
                >
                  <X size={13} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
              {messages.length === 0 ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-[#818cf8]/20 px-3 py-3"
                    style={{ background: "linear-gradient(135deg, rgba(129,140,248,0.07), rgba(99,102,241,0.03))" }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles size={11} className="text-[#818cf8]" />
                      <p className="text-xs font-black text-white">Hey! Ask me anything.</p>
                    </div>
                    <p className="text-[10px] text-white/40 leading-relaxed">
                      Live game data, props, HR grades, parlays — I have today's full slate loaded.
                    </p>
                  </div>
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest px-0.5">Quick questions</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => send(p)}
                        className="rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-[#818cf8]/10 hover:border-[#818cf8]/25 px-2.5 py-2 text-[10px] font-bold text-white/55 hover:text-white text-left transition-all"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    if (msg.role === "user") {
                      return (
                        <div key={msg.id} className="flex justify-end">
                          <div className="max-w-[82%] rounded-2xl rounded-br-md px-3 py-2 text-xs text-white/90"
                            style={{ background: "linear-gradient(135deg, rgba(255,120,40,0.18), rgba(255,120,40,0.10))", border: "1px solid rgba(255,120,40,0.22)" }}>
                            {msg.content}
                          </div>
                        </div>
                      );
                    }
                    const { text, picks } = parseMessage(msg.content);
                    return (
                      <div key={msg.id} className="flex gap-2 items-start">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: "linear-gradient(135deg, #818cf8, #6366f1)", boxShadow: "0 0 8px rgba(99,102,241,0.3)" }}>
                          <Sparkles size={10} className="text-white" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="rounded-2xl rounded-tl-md px-3 py-2.5 bg-white/[0.04] border border-white/[0.08]">
                            <SimpleMarkdown text={text || "…"} />
                          </div>
                          {picks.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest px-0.5 flex items-center gap-1">
                                <Plus size={8} strokeWidth={3} />
                                Recommended picks
                              </p>
                              {picks.map((pick, i) => <PickCard key={i} pick={pick} />)}
                              <Link href="/analysis?tab=props"
                                className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-[10px] font-black transition-all mt-1"
                                style={{ background: "linear-gradient(135deg, rgba(255,120,40,0.15), rgba(255,120,40,0.08))", border: "1px solid rgba(255,120,40,0.25)", color: "#FF7828" }}>
                                <TrendingUp size={10} strokeWidth={2.5} />
                                Open in Prop Builder
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {streaming && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex gap-2 items-start">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "linear-gradient(135deg, #818cf8, #6366f1)" }}>
                        <Sparkles size={10} className="text-white" strokeWidth={2} />
                      </div>
                      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl rounded-tl-md px-3 py-2.5 flex items-center gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#818cf8]/60 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-1 shrink-0 border-t border-white/[0.05]">
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3 py-2.5 mt-2 focus-within:border-[#818cf8]/40 transition-colors">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(input); } }}
                  placeholder="Ask about today's slate…"
                  disabled={streaming}
                  className="flex-1 bg-transparent text-xs text-white placeholder:text-white/20 outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || streaming}
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                  style={{ background: input.trim() && !streaming ? "linear-gradient(135deg, #818cf8, #6366f1)" : "rgba(129,140,248,0.15)" }}
                >
                  {streaming
                    ? <Loader2 size={12} className="text-white animate-spin" strokeWidth={2.5} />
                    : <Send size={11} className="text-white" strokeWidth={2.5} />
                  }
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB launcher ── */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="relative flex items-center gap-2.5 rounded-2xl px-4 transition-all"
        style={{
          height: 52,
          background: open
            ? "rgba(30,27,75,0.95)"
            : "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)",
          border: "1px solid rgba(129,140,248,0.45)",
          boxShadow: open
            ? "0 4px 20px rgba(0,0,0,0.4)"
            : "0 8px 40px rgba(99,102,241,0.45), 0 2px 12px rgba(0,0,0,0.3)",
        }}
      >
        {/* Glow ring when closed */}
        {!open && (
          <motion.span
            className="absolute inset-0 rounded-2xl"
            animate={{ opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ boxShadow: "0 0 0 6px rgba(99,102,241,0.25)" }}
          />
        )}

        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={18} className="text-white/70" strokeWidth={2} />
            </motion.div>
          ) : (
            <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Bot size={20} className="text-white" strokeWidth={2} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!open && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden flex items-center gap-1.5"
            >
              <span className="text-sm font-black text-white tracking-tight whitespace-nowrap">Edge AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" style={{ boxShadow: "0 0 6px rgba(52,211,153,0.8)" }} />
            </motion.div>
          )}
        </AnimatePresence>

        {unread > 0 && !open && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-[#FF7828] flex items-center justify-center text-[9px] font-black text-white px-1"
            style={{ boxShadow: "0 0 8px rgba(255,120,40,0.6)" }}>
            {unread}
          </span>
        )}
      </motion.button>
    </div>
  );
}
