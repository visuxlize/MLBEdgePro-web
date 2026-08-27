"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KICKOFF_TARGET = new Date("2026-08-06T20:00:00").getTime();

function useCountdown() {
  const [remaining, setRemaining] = useState(() => Math.max(0, KICKOFF_TARGET - Date.now()));
  useEffect(() => {
    const iv = setInterval(() => setRemaining(Math.max(0, KICKOFF_TARGET - Date.now())), 1000);
    return () => clearInterval(iv);
  }, []);
  const days = Math.floor(remaining / 86_400_000);
  const hrs = Math.floor(remaining / 3_600_000) % 24;
  const min = Math.floor(remaining / 60_000) % 60;
  const sec = Math.floor(remaining / 1000) % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return { days, hrs: pad(hrs), min: pad(min), sec: pad(sec) };
}

const FEATURES = [
  { color: "var(--green)",     glyph: "★", title: "Edge Scores, every game",         body: "A graded 0–100 edge on all 272 regular-season games, plus preseason." },
  { color: "var(--red-soft)",  glyph: "●", title: "Live drive-by-drive win prob",     body: "Possession, down & distance, win probability that moves with the ball." },
  { color: "var(--gold-2)",    glyph: "◈", title: "Player prop projections",          body: "Pass yards, rush yards, receptions, anytime TD — model vs the line." },
  { color: "var(--purple-2)",  glyph: "◆", title: "Edge AI breakdowns",               body: "Ask the model why it likes a side. Full game briefs in plain English." },
];

export function NflTeaser() {
  const { days, hrs, min, sec } = useCountdown();
  const [email, setEmail] = useState("");
  const [notified, setNotified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleNotify() {
    if (!email.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong — try again.");
        return;
      }
      setNotified(true);
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="spotlight min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-7 flex-wrap items-center mt-3" style={{ maxWidth: 1080, margin: "12px auto 0" }}>
          {/* Left — hero */}
          <div className="relative text-center" style={{ flex: "1.4 1 480px", minWidth: 320 }}>
            <div
              className="absolute pointer-events-none"
              style={{
                top: -40, left: "50%", transform: "translateX(-50%)", width: 420, maxWidth: "100%", height: 280,
                borderRadius: "50%", background: "radial-gradient(closest-side, rgba(249,115,22,.10), transparent 70%)",
                animation: "glow-breathe 3.5s ease-in-out infinite",
              }}
            />
            <span
              className="relative inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-spot-sans font-extrabold text-[11px] uppercase tracking-[.14em]"
              style={{ color: "var(--orange)", background: "var(--orange-tint)", border: "1px solid var(--orange-line)" }}
            >
              🏈 Coming to Edge Pro
            </span>
            <h1
              className="relative mt-4 font-spot-sans font-black leading-[0.98]"
              style={{ fontSize: "clamp(44px,7vw,68px)", letterSpacing: "-0.02em", background: "var(--grad-orange)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}
            >
              NFL EDGE PRO
            </h1>
            <p className="relative mt-3.5 mx-auto font-spot-sans text-base leading-relaxed" style={{ maxWidth: 440, color: "var(--text-3)" }}>
              Every game, every edge. The same model you trust for MLB — rebuilt for football, refreshed all game long.
            </p>

            <div
              className="relative inline-flex items-stretch mt-6 rounded-[18px] overflow-hidden"
              style={{ background: "#fff", border: "1px solid var(--hairline)", boxShadow: "var(--shadow-panel)" }}
            >
              <div className="flex flex-col items-center justify-center px-5 py-4" style={{ background: "linear-gradient(135deg,#FF7828,#C85014)" }}>
                <span className="font-spot-mono font-black leading-[0.9]" style={{ fontSize: 52, color: "#fff" }}>{days}</span>
                <span className="mt-1.5 font-spot-sans font-extrabold text-[10px] uppercase tracking-[.22em]" style={{ color: "rgba(255,255,255,.9)" }}>Days</span>
              </div>
              <div className="flex items-center gap-1.5 px-6 py-4">
                <div className="text-center" style={{ minWidth: 44 }}>
                  <span className="block font-spot-mono font-black text-3xl leading-none" style={{ color: "var(--text)" }}>{hrs}</span>
                  <span className="block mt-1 font-spot-sans font-bold text-[8px] uppercase tracking-[.18em]" style={{ color: "var(--text-muted)" }}>Hrs</span>
                </div>
                <span className="font-spot-mono font-black text-2xl leading-none pb-3" style={{ color: "var(--text-ghost)" }}>:</span>
                <div className="text-center" style={{ minWidth: 44 }}>
                  <span className="block font-spot-mono font-black text-3xl leading-none" style={{ color: "var(--text)" }}>{min}</span>
                  <span className="block mt-1 font-spot-sans font-bold text-[8px] uppercase tracking-[.18em]" style={{ color: "var(--text-muted)" }}>Min</span>
                </div>
                <span className="font-spot-mono font-black text-2xl leading-none pb-3" style={{ color: "var(--text-ghost)" }}>:</span>
                <div className="text-center" style={{ minWidth: 44 }}>
                  <span className="block font-spot-mono font-black text-3xl leading-none" style={{ color: "var(--green)" }}>{sec}</span>
                  <span className="block mt-1 font-spot-sans font-bold text-[8px] uppercase tracking-[.18em]" style={{ color: "var(--text-muted)" }}>Sec</span>
                </div>
              </div>
            </div>
            <p className="relative mt-3.5 font-spot-sans font-bold text-[11px] uppercase tracking-[.1em]" style={{ color: "var(--text-faint)" }}>
              Until the Hall of Fame Game &middot; Thu Aug 6
            </p>

            <div className="relative grid gap-3 mt-7 mx-auto text-left" style={{ gridTemplateColumns: "repeat(2,minmax(200px,1fr))", maxWidth: 560 }}>
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-[18px] p-4" style={{ background: "#fff", border: "1px solid var(--hairline)", boxShadow: "var(--shadow-card)" }}>
                  <span style={{ color: f.color }}>{f.glyph}</span>
                  <p className="mt-2 font-spot-sans font-extrabold text-sm" style={{ color: "var(--text)" }}>{f.title}</p>
                  <p className="mt-1 font-spot-sans text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{f.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — early access panel */}
          <div
            className="relative overflow-hidden rounded-[22px]"
            style={{ flex: "1 1 320px", minWidth: 300, background: "#fff", border: "1px solid var(--hairline)", boxShadow: "var(--shadow-panel)" }}
          >
            <div className="relative p-6 flex flex-col gap-4">
              <div>
                <p className="font-spot-sans font-extrabold text-[10px] uppercase tracking-[.16em]" style={{ color: "var(--orange-soft)" }}>Early Access</p>
                <p className="mt-1.5 font-spot-sans font-black text-2xl leading-tight" style={{ color: "var(--text)" }}>Be first on the field</p>
                <p className="mt-2 font-spot-sans text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  Lock your spot now &mdash; we&rsquo;ll open your NFL dashboard the moment the model goes live.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {["Every game graded before kickoff", "Live win probability, drive by drive", "AI prop picks & parlay builder"].map((t) => (
                  <span key={t} className="flex items-center gap-2 font-spot-sans text-xs" style={{ color: "var(--text-2)" }}>
                    <span style={{ color: "var(--green)", fontWeight: 900 }}>&#10003;</span>{t}
                  </span>
                ))}
              </div>
              {!notified ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNotify()}
                    className="rounded-[14px] px-4 py-3 font-spot-sans text-sm outline-none"
                    style={{ color: "var(--text)", background: "var(--panel-2)", border: "1px solid var(--hairline)" }}
                  />
                  <button
                    onClick={handleNotify}
                    disabled={submitting}
                    className="rounded-full px-5 py-3.5 font-spot-sans font-extrabold text-sm text-white disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg,#FFA550,#FF7828,#C85014)", boxShadow: "0 6px 24px rgba(255,120,40,.4)" }}
                  >
                    {submitting ? "Joining…" : "Notify me at kickoff"}
                  </button>
                  {error && <p className="text-center font-spot-sans text-[11px]" style={{ color: "var(--red-soft)" }}>{error}</p>}
                  <p className="text-center font-spot-sans text-[10px]" style={{ color: "var(--text-faint)" }}>Free at kickoff &middot; no spam, one email</p>
                </div>
              ) : (
                <div className="rounded-[14px] px-4.5 py-3.5 text-center font-spot-sans font-bold text-sm" style={{ color: "var(--green)", background: "var(--green-bg)", border: "1px solid rgba(52,211,153,.32)" }}>
                  &#10003; You&rsquo;re on the list &mdash; see you at kickoff.
                </div>
              )}
              <div className="flex items-center justify-between gap-3 flex-wrap pt-3.5" style={{ borderTop: "1px solid var(--hairline)" }}>
                <span className="font-spot-sans font-bold text-xs leading-snug" style={{ color: "var(--purple-soft)" }}>
                  Don&rsquo;t want to wait?<br /><span className="font-normal" style={{ color: "var(--text-muted)" }}>Pro members are already inside.</span>
                </span>
                <Link href="/upgrade?tier=pro" className="rounded-full px-4.5 py-2.5 font-spot-sans font-black text-xs text-white whitespace-nowrap" style={{ background: "var(--grad-purple)" }}>
                  Go Pro &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
