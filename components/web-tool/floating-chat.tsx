"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bot, X, Send, Loader2, Minimize2, ExternalLink, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSubscription } from "@/lib/subscription";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
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
              <span className="text-[#FF7828] text-xs mt-0.5">•</span>
              <span className="text-xs text-white/75">{renderInline(line.replace(/^[-*]\s+/, ""))}</span>
            </div>
          );
        }
        return <p key={i} className="text-xs text-white/80 leading-relaxed">{renderInline(line)}</p>;
      })}
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
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput]       = useState("");
  const [streaming, setStreaming] = useState(false);
  const [unread, setUnread]     = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const abortRef  = useRef<AbortController | null>(null);
  const { isSuperPro, isLoaded } = useSubscription();

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
        const snap = acc;
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: snap } : m));
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
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-80 sm:w-96 rounded-2xl border border-white/[0.10] bg-[#0D1117] shadow-2xl shadow-black/60 flex flex-col overflow-hidden"
            style={{ height: "480px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] bg-[#111622] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#818cf8]/15 border border-[#818cf8]/30 flex items-center justify-center">
                  <Bot size={13} className="text-[#818cf8]" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs font-black text-white leading-tight">Edge AI</p>
                  <p className="text-[9px] text-white/30">Quick chat · MLB analysis</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Link
                  href="/ai"
                  className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] text-white/40 hover:text-white hover:border-white/[0.14] transition-colors"
                >
                  <ExternalLink size={9} strokeWidth={2} />
                  Full view
                </Link>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.07] transition-colors"
                >
                  <Minimize2 size={12} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* World Cup banner for Pro users */}
            {isLoaded && isSuperPro && (
              <button
                onClick={() => send("Give me today's top FIFA World Cup betting edges and analysis.")}
                className="mx-3 mt-2.5 shrink-0 flex items-center gap-2 rounded-xl border border-[#FBBF24]/25 bg-[#FBBF24]/8 px-3 py-2 text-left hover:bg-[#FBBF24]/14 transition-colors"
              >
                <Trophy size={12} className="text-[#FBBF24] shrink-0" strokeWidth={2.2} />
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-[#FBBF24] leading-tight">World Cup Edge — Limited Access</p>
                  <p className="text-[9px] text-white/35 mt-0.5">Ask for today's World Cup betting edges</p>
                </div>
              </button>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
              {messages.length === 0 ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-[#818cf8]/20 bg-[#818cf8]/[0.06] px-3 py-3">
                    <p className="text-xs font-black text-white mb-1">Hey! Ask me anything.</p>
                    <p className="text-[10px] text-white/40 leading-relaxed">
                      Live game data, props, HR grades — I've got today's full slate loaded.
                    </p>
                  </div>
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest px-1">Quick questions</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => send(p)}
                        className="rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07] px-2.5 py-2 text-[10px] font-bold text-white/60 hover:text-white text-left transition-all"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      {msg.role === "assistant" && (
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[#818cf8]/15 border border-[#818cf8]/30">
                          <Bot size={11} className="text-[#818cf8]" strokeWidth={2} />
                        </div>
                      )}
                      <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                        msg.role === "user"
                          ? "bg-[#FF7828]/12 border border-[#FF7828]/20 text-white/90"
                          : "bg-white/[0.04] border border-white/[0.07]"
                      }`}>
                        {msg.role === "assistant"
                          ? <SimpleMarkdown text={msg.content || "…"} />
                          : msg.content}
                      </div>
                    </div>
                  ))}
                  {streaming && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-[#818cf8]/15 border border-[#818cf8]/30">
                        <Bot size={11} className="text-[#818cf8]" strokeWidth={2} />
                      </div>
                      <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 flex items-center gap-1">
                        {[0,1,2].map((i) => (
                          <div key={i} className="w-1 h-1 rounded-full bg-white/30 animate-bounce"
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
            <div className="px-3 pb-3 shrink-0">
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.09] bg-[#0D1117] px-3 py-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(input); } }}
                  placeholder="Ask about today's slate…"
                  disabled={streaming}
                  className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || streaming}
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#FF7828] hover:bg-[#FFA550] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  {streaming
                    ? <Loader2 size={12} className="text-white animate-spin" strokeWidth={2.5} />
                    : <Send size={12} className="text-white" strokeWidth={2.5} />
                  }
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg shadow-[#818cf8]/20 transition-colors"
        style={{
          width: 52, height: 52,
          background: open ? "#1e1b4b" : "linear-gradient(135deg, #818cf8, #6366f1)",
          border: "1px solid rgba(129,140,248,0.4)",
        }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={20} className="text-white/70" strokeWidth={2} />
            </motion.div>
          ) : (
            <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Bot size={22} className="text-white" strokeWidth={2} />
            </motion.div>
          )}
        </AnimatePresence>
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF7828] flex items-center justify-center text-[9px] font-black text-white">
            {unread}
          </span>
        )}
      </motion.button>
    </div>
  );
}
