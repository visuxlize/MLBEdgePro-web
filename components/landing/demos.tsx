"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, animate, motion, useInView } from "framer-motion";

/* Animated sample UIs that mirror the real web tool. All numbers here are illustrative sample data. */

const INK = "#14161b", INK3 = "#8a909b", BLUE = "#1a73ff", RED = "#ef3b4a", GREEN = "#12a150";
const SH = "0 1px 2px rgba(20,22,27,.04), 0 18px 50px rgba(20,22,27,.10)";

function useTicker(ms: number, n: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % n), ms);
    return () => clearInterval(t);
  }, [ms, n]);
  return i;
}

function useCount(to: number, key: unknown, dur = 1.1) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const c = animate(0, to, { duration: dur, ease: [0.22, 1, 0.36, 1], onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [to, key, dur]);
  return v;
}

export function AppWindow({ url, children, tabs }: { url: string; children: ReactNode; tabs?: ReactNode }) {
  return (
    <div className="rounded-[26px] bg-[#f6f7f9] overflow-hidden" style={{ boxShadow: SH }}>
      <div className="flex items-center gap-3 px-4 h-11 bg-white" style={{ borderBottom: "1px solid #eceef2" }}>
        <div className="flex gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-[#ff6b6b]" /><i className="w-2.5 h-2.5 rounded-full bg-[#ffd166]" /><i className="w-2.5 h-2.5 rounded-full bg-[#4cd68a]" /></div>
        <div className="flex-1 max-w-[320px] mx-auto h-7 rounded-full bg-[#f1f3f6] flex items-center justify-center text-[11px] font-semibold" style={{ color: INK3 }}>🔒 {url}</div>
        <span className="w-[42px]" />
      </div>
      {tabs}
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[20px] bg-white ${className}`} style={{ boxShadow: "0 1px 2px rgba(20,22,27,.04), 0 6px 18px rgba(20,22,27,.05)" }}>{children}</div>;
}

const LiveChip = ({ t }: { t: string }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-extrabold text-white" style={{ background: RED }}><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />{t}</span>
);

/* ── NFL live tracker ────────────────────────────────────────────────────── */

export function NflDemo() {
  const step = useTicker(2400, 4);
  const spots = [34, 46, 58, 71];
  const x = spots[step];
  const wp = [58, 61, 66, 72][step];
  const yd = [3, 15, 27, 40][step];
  const wpShown = useCount(wp, step, 0.8);
  return (
    <div className="grid gap-3 sm:grid-cols-[1.5fr_1fr]">
      <Card className="p-4">
        <div className="flex items-center justify-between"><LiveChip t="Q2 8:21" /><span className="text-[11px] font-bold" style={{ color: INK3 }}>{["1st & 10", "2nd & 4", "1st & 10", "2nd & 6"][step]} at MIA {Math.round(100 - x)}</span></div>
        <div className="mt-3 flex items-center justify-between">
          <div><p className="text-[10px] font-extrabold" style={{ color: INK3 }}>DET</p><p className="font-mono text-[34px] font-black leading-none" style={{ color: INK }}>10</p></div>
          <span className="text-[11px] font-bold rounded-full px-2.5 py-1 bg-[#f3f4f7]" style={{ color: INK3 }}>Drive · {step + 3} plays · {yd} yds</span>
          <div className="text-right"><p className="text-[10px] font-extrabold" style={{ color: INK3 }}>MIA</p><p className="font-mono text-[34px] font-black leading-none" style={{ color: INK }}>7</p></div>
        </div>
        <svg viewBox="0 0 420 120" className="mt-3 w-full rounded-xl" aria-hidden>
          <rect width="420" height="120" fill="#2fa346" />
          {Array.from({ length: 10 }).map((_, i) => <rect key={i} x={30 + i * 36} width="36" height="120" fill={i % 2 ? "rgba(0,0,0,.05)" : "transparent"} />)}
          <rect width="30" height="120" fill="#3b82c4" /><rect x="390" width="30" height="120" fill="#1fa7a8" />
          {Array.from({ length: 11 }).map((_, i) => <line key={i} x1={30 + i * 36} y1="0" x2={30 + i * 36} y2="120" stroke="#fff" strokeOpacity=".5" />)}
          <motion.line animate={{ x1: 30 + x * 3.6, x2: 30 + x * 3.6 }} transition={{ type: "spring", stiffness: 90, damping: 16 }} y1="0" y2="120" stroke="#2f7bff" strokeWidth="3" />
          <motion.line animate={{ x1: 30 + (x + 10) * 3.6, x2: 30 + (x + 10) * 3.6 }} transition={{ type: "spring", stiffness: 90, damping: 16 }} y1="0" y2="120" stroke="#ffd21f" strokeWidth="3" />
          <motion.path animate={{ d: `M ${30 + 20 * 3.6} 70 Q ${(30 + 20 * 3.6 + 30 + x * 3.6) / 2} 14 ${30 + x * 3.6} 70` }} transition={{ type: "spring", stiffness: 90, damping: 16 }} fill="none" stroke="#fff" strokeWidth="2.5" strokeDasharray="2 7" strokeLinecap="round" />
          <motion.g animate={{ x: 30 + x * 3.6 }} transition={{ type: "spring", stiffness: 90, damping: 16 }}>
            <ellipse cy="64" rx="10" ry="6" fill="#8b5a2b" stroke="#fff" strokeWidth="1.5" transform="rotate(-20 0 64)" />
          </motion.g>
        </svg>
      </Card>
      <Card className="p-4 flex flex-col justify-between">
        <p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: INK3 }}>Win probability</p>
        <div>
          <p className="font-mono text-[34px] font-black leading-none" style={{ color: INK }}>{wpShown}%</p>
          <p className="text-[11px] font-bold mt-1" style={{ color: INK3 }}>DET to win</p>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden bg-[#eef0f4]"><motion.div animate={{ width: `${wp}%` }} transition={{ type: "spring", stiffness: 80, damping: 18 }} style={{ background: "#3b82c4" }} /><div className="flex-1" style={{ background: "#1fa7a8" }} /></div>
        <p className="text-[11px] font-semibold" style={{ color: INK3 }}>Updates every 30s from the live feed</p>
      </Card>
    </div>
  );
}

/* ── NBA shot chart ──────────────────────────────────────────────────────── */

const SHOTS = [[250, 90, 1], [180, 150, 0], [330, 140, 1], [250, 230, 1], [120, 190, 0], [380, 200, 1], [60, 60, 1], [250, 300, 0], [440, 90, 0], [300, 330, 1], [200, 280, 1], [150, 60, 1], [350, 260, 0], [250, 70, 1]] as const;

export function NbaDemo() {
  const n = useTicker(520, SHOTS.length + 4);
  const shown = Math.min(n, SHOTS.length);
  const made = SHOTS.slice(0, shown).filter((s) => s[2]).length;
  return (
    <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
      <Card className="p-3">
        <div className="flex items-center justify-between px-1 pb-2"><p className="text-[12px] font-bold" style={{ color: INK }}>Shot chart</p><span className="text-[11px] font-bold rounded-full px-2.5 py-1 bg-[#fdecee]" style={{ color: RED }}>ATL on a 12–0 run</span></div>
        <svg viewBox="0 0 500 400" className="w-full rounded-xl" style={{ background: "#fbf3e6" }} aria-hidden>
          <g fill="none" stroke="#c9b48c" strokeWidth="2.5"><rect x="4" y="4" width="492" height="392" rx="6" /><rect x="170" y="4" width="160" height="190" /><path d="M190 194 A60 60 0 0 0 310 194" /><path d="M30 4 L30 142 A237.5 237.5 0 0 0 470 142 L470 4" /><circle cx="250" cy="52" r="8" stroke="#ef6a2b" strokeWidth="3" /></g>
          <AnimatePresence>
            {SHOTS.slice(0, shown).map((s, i) => s[2] ? (
              <motion.circle key={i} cx={s[0]} cy={s[1]} r="9" fill={i % 2 ? "#e03a3e" : "#1a73ff"} stroke="#fff" strokeWidth="2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 14 }} />
            ) : (
              <motion.g key={i} stroke={i % 2 ? "#e03a3e" : "#1a73ff"} strokeWidth="3" strokeLinecap="round" opacity=".6" initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ transformOrigin: `${s[0]}px ${s[1]}px` }}><line x1={s[0] - 6} y1={s[1] - 6} x2={s[0] + 6} y2={s[1] + 6} /><line x1={s[0] + 6} y1={s[1] - 6} x2={s[0] - 6} y2={s[1] + 6} /></motion.g>
            ))}
          </AnimatePresence>
        </svg>
      </Card>
      <div className="grid gap-3">
        <Card className="p-4"><p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: INK3 }}>Field goals</p><p className="font-mono text-[30px] font-black leading-none mt-1" style={{ color: INK }}>{made}/{shown}</p><p className="text-[11px] font-bold mt-1" style={{ color: INK3 }}>{shown ? Math.round((made / shown) * 100) : 0}% from tracked shots</p></Card>
        <Card className="p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-wider mb-2" style={{ color: INK3 }}>Lead tracker</p>
          <svg viewBox="0 0 200 60" className="w-full" aria-hidden><line x1="0" y1="30" x2="200" y2="30" stroke="#d9dce3" strokeDasharray="3 4" /><motion.path d="M0 30 L20 26 L40 34 L60 22 L80 28 L100 14 L120 20 L140 8 L160 16 L180 10 L200 6" fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1 }} /></svg>
        </Card>
      </div>
    </div>
  );
}

/* ── Real prop lines ─────────────────────────────────────────────────────── */

const PROPS = [
  { n: "Tyrese Maxey", m: "Over 26.5 Points", open: "24.5", line: "26.5", proj: 29.4, p: 64, grade: "A+" },
  { n: "Jonathan Taylor", m: "Over 68.5 Rush Yds", open: "60.5", line: "68.5", proj: 79.2, p: 62, grade: "A+" },
  { n: "Jalen Brunson", m: "Over 6.5 Assists", open: "6.5", line: "6.5", proj: 7.4, p: 59, grade: "A" },
];

function PropRow({ p, i }: { p: (typeof PROPS)[number]; i: number }) {
  const pct = useCount(p.p, i, 1.2);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.14, duration: 0.5 }}>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#dbe8ff] to-[#f3f6ff] flex items-center justify-center text-[13px] font-black" style={{ color: BLUE }}>{p.n.split(" ").map((w) => w[0]).join("")}</div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-extrabold truncate" style={{ color: INK }}>{p.n}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="rounded-full px-2 py-0.5 text-[9px] font-extrabold tracking-wider uppercase" style={{ color: GREEN, background: "rgba(18,161,80,.1)" }}>DraftKings</span>
              {p.open !== p.line && <span className="rounded-full px-2 py-0.5 text-[9px] font-extrabold" style={{ color: "#b7791f", background: "rgba(212,154,6,.12)" }}>▲ {p.open} → {p.line}</span>}
            </div>
          </div>
          <div className="text-right"><p className="font-mono text-[22px] font-black leading-none" style={{ color: GREEN }}>{pct}%</p><p className="text-[10px] font-extrabold" style={{ color: INK3 }}>{p.grade} · hit chance</p></div>
        </div>
        <div className="mt-3 flex items-center justify-between text-[12px]"><span className="font-bold" style={{ color: INK }}>{p.m}</span><span className="font-semibold" style={{ color: INK3 }}>Model proj. {p.proj}</span></div>
        <div className="mt-2 relative h-2.5 rounded-full bg-[#eef0f4] overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(96, (p.proj / (parseFloat(p.line) * 1.6)) * 100)}%` }} transition={{ duration: 1, delay: 0.2 + i * 0.14, ease: [0.22, 1, 0.36, 1] }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${GREEN}99, ${GREEN})` }} /></div>
      </Card>
    </motion.div>
  );
}

export function PropsDemo() {
  const [k, setK] = useState(0);
  useEffect(() => { const t = setInterval(() => setK((v) => v + 1), 6500); return () => clearInterval(t); }, []);
  return <div key={k} className="grid gap-3">{PROPS.map((p, i) => <PropRow key={p.n} p={p} i={i} />)}</div>;
}

/* ── Soccer match centre ─────────────────────────────────────────────────── */

export function SoccerDemo() {
  const [min, setMin] = useState(12);
  useEffect(() => { const t = setInterval(() => setMin((m) => (m >= 88 ? 12 : m + 2)), 160); return () => clearInterval(t); }, []);
  const goal1 = min >= 23, goal2 = min >= 57;
  const hs = goal1 ? 1 : 0, as = goal2 ? 1 : 0;
  const home = Math.round(goal2 ? 33 - (min - 57) * 0.1 : goal1 ? 49 + (min - 23) * 0.25 : 43 - min * 0.05);
  const away = Math.round(goal2 ? 34 + (min - 57) * 0.4 : 24 - (goal1 ? 8 : 0));
  const draw = 100 - home - away;
  const bars = [62, 34, 80, 48, 20, 70];
  return (
    <div className="grid gap-3 sm:grid-cols-[1.3fr_1fr]">
      <Card className="p-4">
        <div className="flex items-center justify-between"><LiveChip t={`${min}'`} /><span className="text-[11px] font-bold" style={{ color: INK3 }}>Premier League</span></div>
        <div className="mt-3 flex items-center justify-between"><span className="text-[15px] font-extrabold" style={{ color: INK }}>Arsenal</span><span className="font-mono text-[32px] font-black" style={{ color: INK }}>{hs} – {as}</span><span className="text-[15px] font-extrabold" style={{ color: INK }}>Chelsea</span></div>
        <div className="mt-5 relative h-2.5 rounded-full bg-[#eef0f4]">
          <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${(min / 90) * 100}%`, background: `linear-gradient(90deg,#ef0107,${BLUE})` }} />
          <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white" style={{ left: `${(min / 90) * 100}%`, boxShadow: `0 0 0 3px ${BLUE}` }} />
          {goal1 && <span className="absolute -top-6 -translate-x-1/2 text-[15px]" style={{ left: `${(23 / 90) * 100}%` }}>⚽</span>}
          {goal2 && <span className="absolute top-5 -translate-x-1/2 text-[15px]" style={{ left: `${(57 / 90) * 100}%` }}>⚽</span>}
        </div>
        <div className="mt-6 flex items-end gap-1.5 h-16">{bars.map((b, i) => <motion.div key={i} className="flex-1 rounded-md" style={{ background: i % 2 ? "#fbbf24" : BLUE, opacity: i * 15 < min ? 1 : 0.2 }} animate={{ height: i * 15 < min ? `${b}%` : "8%" }} transition={{ type: "spring", stiffness: 120, damping: 14 }} />)}</div>
        <p className="mt-1 text-[10px] font-bold" style={{ color: INK3 }}>Momentum by 15&apos;</p>
      </Card>
      <Card className="p-4">
        <p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: INK3 }}>Win probability now</p>
        <div className="mt-3 flex h-3 rounded-full overflow-hidden bg-[#eef0f4] gap-0.5"><motion.div animate={{ width: `${home}%` }} style={{ background: "#ef0107" }} /><motion.div animate={{ width: `${draw}%` }} style={{ background: "#9aa1ad" }} /><motion.div animate={{ width: `${away}%` }} style={{ background: "#034694" }} /></div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">{[["ARS", home], ["Draw", draw], ["CHE", away]].map(([k, v]) => <div key={k as string} className="rounded-xl bg-[#f6f7f9] py-2"><p className="font-mono text-[18px] font-black" style={{ color: INK }}>{v}%</p><p className="text-[10px] font-bold" style={{ color: INK3 }}>{k}</p></div>)}</div>
        <p className="mt-3 text-[11px] font-semibold" style={{ color: INK3 }}>Expected goals 1.9 – 1.1 · likeliest score 2–1</p>
      </Card>
    </div>
  );
}

/* ── Standings / power rankings ──────────────────────────────────────────── */

const TEAMS = [["BOS", 8.4, "7-2"], ["OKC", 7.9, "8-1"], ["DET", 6.1, "6-2"], ["NY", 4.6, "6-3"], ["DEN", 3.2, "6-3"], ["HOU", 2.7, "5-3"]] as const;

export function StandingsDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-80px" });
  return (
    <Card className="p-4">
      <div ref={ref} className="flex items-center justify-between mb-3"><p className="text-[12px] font-bold" style={{ color: INK }}>Edge Power rankings</p><span className="text-[10px] font-bold rounded-full px-2.5 py-1 bg-[#eef4ff]" style={{ color: BLUE }}>Updated daily</span></div>
      {TEAMS.map(([t, p, rec], i) => (
        <div key={t} className="flex items-center gap-3 py-2" style={{ borderTop: i ? "1px solid #eceef2" : undefined }}>
          <span className="w-4 text-center font-mono text-[11px] font-black" style={{ color: i < 3 ? BLUE : INK3 }}>{i + 1}</span>
          <span className="w-9 h-9 rounded-xl bg-[#f3f4f7] flex items-center justify-center text-[11px] font-black" style={{ color: INK }}>{t}</span>
          <div className="flex-1 h-2 rounded-full bg-[#eef0f4] overflow-hidden"><motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${BLUE}88, ${BLUE})` }} initial={{ width: 0 }} animate={{ width: inView ? `${(p / 9) * 100}%` : 0 }} transition={{ duration: 0.9, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }} /></div>
          <span className="w-9 text-right font-mono text-[12px] font-black" style={{ color: GREEN }}>+{p}</span>
          <span className="w-9 text-right font-mono text-[11px]" style={{ color: INK3 }}>{rec}</span>
        </div>
      ))}
    </Card>
  );
}

/* ── Hero showcase: auto-cycling product window ──────────────────────────── */

const SCENES = [
  { key: "nfl", label: "NFL live tracker", url: "edgepro.app/nfl/game", node: <NflDemo /> },
  { key: "props", label: "Real prop lines", url: "edgepro.app/nba/props", node: <PropsDemo /> },
  { key: "soccer", label: "Soccer match centre", url: "edgepro.app/soccer", node: <SoccerDemo /> },
  { key: "nba", label: "NBA shot chart", url: "edgepro.app/nba/game", node: <NbaDemo /> },
];

export function HeroShowcase() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setI((v) => (v + 1) % SCENES.length), 7000);
    return () => clearTimeout(t);
  }, [i, paused]);
  const s = SCENES[i];
  return (
    <div className="w-full" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <AppWindow
        url={s.url}
        tabs={
          <div className="flex gap-1.5 px-3 pt-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {SCENES.map((x, k) => (
              <button key={x.key} onClick={() => setI(k)} className="relative whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors" style={k === i ? { background: BLUE, color: "#fff" } : { background: "#fff", color: INK3 }}>
                {x.label}
                {k === i && !paused && <motion.span key={i} className="absolute left-3 right-3 -bottom-[3px] h-[2px] rounded-full bg-[#1a73ff]/40 origin-left" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 7, ease: "linear" }} />}
              </button>
            ))}
          </div>
        }
      >
        <AnimatePresence mode="wait">
          <motion.div key={s.key} initial={{ opacity: 0, y: 14, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>{s.node}</motion.div>
        </AnimatePresence>
      </AppWindow>
      <p className="mt-3 text-center text-[11px]" style={{ color: INK3 }}>Sample data · the real tool updates live</p>
    </div>
  );
}
