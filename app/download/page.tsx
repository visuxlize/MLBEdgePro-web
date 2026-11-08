"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Bell, Check, LayoutDashboard, Smartphone, Zap } from "lucide-react";
import { Header } from "@/components/landing/header";
import { LandingFooter } from "@/components/landing/footer";
import { Container } from "@/components/landing/container";

const SOON = [
  { icon: Bell, title: "Live alerts", body: "Push alerts when a line moves, a game gets close or your prop is in play." },
  { icon: Zap, title: "Faster game days", body: "Live trackers and prop boards tuned for one-handed use on the couch or at the bar." },
  { icon: LayoutDashboard, title: "Widgets", body: "Today's lines and your live games on your home screen." },
];

function Waitlist() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const submit = async () => {
    if (!email.includes("@")) { setState("error"); return; }
    setState("loading");
    try {
      const res = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      setState(res.ok ? "done" : "error");
    } catch { setState("error"); }
  };
  if (state === "done") {
    return <p className="inline-flex items-center gap-2 rounded-2xl bg-[#12a150]/10 text-[#12a150] font-bold px-5 py-3.5"><Check size={18} strokeWidth={3} />You&rsquo;re on the list — we&rsquo;ll email you at launch.</p>;
  }
  return (
    <div className="w-full max-w-md">
      <div className="flex gap-2">
        <input value={email} onChange={(e) => { setEmail(e.target.value); if (state === "error") setState("idle"); }} onKeyDown={(e) => e.key === "Enter" && submit()} type="email" placeholder="you@email.com"
          className="flex-1 min-w-0 rounded-2xl bg-white px-4 py-3.5 text-[14px] outline-none focus:ring-2 focus:ring-[#1a73ff]/40" style={{ boxShadow: "0 1px 2px rgba(20,22,27,.05), 0 6px 18px rgba(20,22,27,.06)" }} />
        <button onClick={submit} disabled={state === "loading"} className="rounded-2xl bg-[#14161b] text-white font-bold px-5 text-[14px] disabled:opacity-60">{state === "loading" ? "…" : "Notify me"}</button>
      </div>
      {state === "error" && <p className="mt-2 text-[12px] text-[#d6303d]">Enter a valid email and try again.</p>}
    </div>
  );
}

export default function DownloadPage() {
  return (
    <>
      <Header />
      <main className="py-16 sm:py-24">
        <Container>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[#14161b]/64 tracking-wider uppercase" style={{ boxShadow: "0 8px 24px rgba(20,22,27,.05)" }}><Smartphone size={13} />Mobile app · in development</span>
            <h1 className="mt-5 text-4xl sm:text-6xl font-black tracking-tight text-[#14161b] leading-[1.03]">The app is <span className="gradient-orange-text">coming.</span></h1>
            <p className="mt-5 text-base sm:text-lg text-[#14161b]/60 leading-relaxed">We&rsquo;re building a mobile companion for Edge Pro. Until then, everything lives in the web app — and it&rsquo;s designed to work great on your phone, foldable or desktop.</p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/sign-up"><span className="inline-flex items-center gap-2 rounded-full bg-[#1a73ff] text-white font-bold px-7 py-3.5" style={{ boxShadow: "0 10px 28px rgba(26,115,255,.4)" }}>Open the web app <ArrowRight size={16} strokeWidth={2.5} /></span></Link>
            </div>
          </motion.div>

          <div className="mt-14 grid gap-4 md:grid-cols-3 max-w-5xl mx-auto">
            {SOON.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="rounded-[24px] bg-white p-6" style={{ boxShadow: "0 1px 2px rgba(20,22,27,.04), 0 12px 36px rgba(20,22,27,.07)" }}>
                  <span className="w-11 h-11 rounded-2xl bg-[#eef4ff] text-[#1a73ff] flex items-center justify-center"><Icon size={20} strokeWidth={1.9} /></span>
                  <h3 className="mt-4 text-[17px] font-black text-[#14161b]">{s.title}</h3>
                  <p className="mt-1.5 text-[14px] text-[#14161b]/58 leading-relaxed">{s.body}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-14 max-w-3xl mx-auto rounded-[28px] p-8 sm:p-10 text-center flex flex-col items-center" style={{ background: "linear-gradient(145deg,#e4ecfb,#f1f3f8)" }}>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#14161b]">Get notified at launch</h2>
            <p className="mt-2 mb-6 text-[14px] text-[#14161b]/60">One email when the app is ready. No spam.</p>
            <Waitlist />
          </div>
        </Container>
      </main>
      <LandingFooter />
    </>
  );
}
