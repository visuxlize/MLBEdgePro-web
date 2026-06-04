import Link from "next/link";
import type { Metadata } from "next";
import {
  Shield, Heart, Phone, AlertTriangle, CheckCircle,
  Clock, Ban, MessageCircle, ArrowLeft, Zap, ExternalLink,
} from "lucide-react";
import { Header } from "@/components/landing/header";
import { LandingFooter } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Responsible Gambling — MLB Edge Pro",
  description: "MLB Edge Pro is committed to responsible sports analysis. Learn about our approach, warning signs of problem gambling, and free resources available 24/7.",
};

const WARNING_SIGNS = [
  "Betting more than you can comfortably afford to lose",
  "Chasing losses by placing larger or more frequent bets",
  "Gambling interfering with work, school, or relationships",
  "Borrowing money or selling possessions to fund betting",
  "Feeling anxious, irritable, or restless when not betting",
  "Lying to friends or family about how much you bet",
  "Using betting as a way to escape stress or problems",
  "Feeling unable to stop even when you want to",
];

const TOOLS = [
  {
    icon: Clock,
    title: "Take Regular Breaks",
    body: "Set a session timer. Step away after 30 minutes regardless of results. Your decisions improve when you're not in a betting mindset.",
    color: "#FF7828",
  },
  {
    icon: Ban,
    title: "Set Hard Limits",
    body: "Before you open any app or sportsbook, decide your maximum loss for the day, week, or month — and stick to it. Write it down.",
    color: "#818cf8",
  },
  {
    icon: MessageCircle,
    title: "Talk to Someone",
    body: "Problem gambling thrives in isolation. If you're struggling, tell someone you trust or call the national helpline. You don't have to face it alone.",
    color: "#50C882",
  },
  {
    icon: Shield,
    title: "Self-Exclude",
    body: "Every licensed sportsbook offers self-exclusion. Use it without hesitation if gambling is becoming a problem. Most allow 30-day, 90-day, or permanent exclusions.",
    color: "#2dd4bf",
  },
];

const RESOURCES = [
  {
    name: "National Council on Problem Gambling",
    abbr: "NCPG",
    phone: "1-800-522-4700",
    url: "https://www.ncpgambling.org",
    desc: "24/7 confidential support. Free call, no judgment.",
    color: "#50C882",
  },
  {
    name: "Gamblers Anonymous",
    abbr: "GA",
    phone: "1-888-424-3577",
    url: "https://www.gamblersanonymous.org",
    desc: "Peer support groups available in all 50 states.",
    color: "#818cf8",
  },
  {
    name: "National Problem Gambling Helpline",
    abbr: "Chat",
    phone: null,
    url: "https://www.ncpgambling.org/help-treatment/chat/",
    desc: "Live chat support if you'd rather type than talk.",
    color: "#FF7828",
  },
];

export default function ResponsibleGamblingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-16">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[#50C882]/[0.06] blur-[120px]" />

        <div className="relative max-w-3xl mx-auto px-5 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/35 hover:text-white transition-colors mb-8">
            <ArrowLeft size={14} strokeWidth={2} />
            Back to Home
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-[#50C882]/25 bg-[#50C882]/[0.08] px-4 py-1.5 mb-5">
            <Shield size={11} className="text-[#50C882]" strokeWidth={2.5} />
            <span className="text-xs font-bold text-[#50C882] tracking-wider uppercase">Responsible Gambling</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-5">
            We take this{" "}
            <span className="text-[#50C882]">seriously.</span>
          </h1>
          <p className="text-lg text-white/45 leading-relaxed mb-6">
            MLB Edge Pro exists to make sports analysis sharper — not to fuel addiction. We&apos;re a data tool, not a sportsbook.
            But we know our users interact with betting markets, and that comes with real responsibility.
          </p>

          {/* Emergency call-out */}
          <div className="rounded-2xl border border-[#50C882]/30 bg-[#50C882]/[0.08] p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-[#50C882]/15 flex items-center justify-center shrink-0">
              <Phone size={24} className="text-[#50C882]" strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white/50 mb-0.5">If you need help right now</p>
              <a href="tel:18005224700" className="text-3xl font-black text-[#50C882] hover:text-[#7DDEA6] transition-colors block">
                1-800-522-4700
              </a>
              <p className="text-xs text-white/35 mt-0.5">National Problem Gambling Helpline · 24/7 · Free · Confidential</p>
            </div>
            <a
              href="https://www.ncpgambling.org/help-treatment/chat/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[#50C882]/30 bg-[#50C882]/10 px-4 py-2 text-sm font-bold text-[#50C882] hover:bg-[#50C882]/15 transition-colors shrink-0"
            >
              Live Chat
              <ExternalLink size={12} strokeWidth={2} />
            </a>
          </div>
        </div>
      </section>

      {/* Our philosophy */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-12 border-t border-white/[0.05]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-xl bg-[#FF7828]/15 flex items-center justify-center">
            <Zap size={15} className="text-[#FF7828]" strokeWidth={2} />
          </div>
          <h2 className="text-xl font-black text-white">Our Philosophy</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: "We are analysis, not advice", body: "Every number on MLB Edge Pro is a model estimate based on publicly available stats. We don't know how tomorrow's game will go. Neither does anyone else." },
            { title: "Entertainment comes first", body: "The edge isn't guaranteed profits — it's sharper information to make betting more engaging. If it stops being fun, it's time to step back." },
            { title: "Losses are part of the game", body: "Even the best models lose. Building a bet slip with our tool doesn't make any outcome more likely than probability dictates." },
            { title: "We don't want problem bettors", body: "A user who bets responsibly with us for years is worth infinitely more than a user who chases losses for a month. We mean that." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5">
              <div className="flex items-start gap-2 mb-2">
                <CheckCircle size={15} className="text-[#50C882] mt-0.5 shrink-0" strokeWidth={2} />
                <p className="text-sm font-black text-white">{item.title}</p>
              </div>
              <p className="text-sm text-white/40 leading-relaxed pl-6">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Warning signs */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-12 border-t border-white/[0.05]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-[#EB505A]/15 flex items-center justify-center">
            <AlertTriangle size={15} className="text-[#EB505A]" strokeWidth={2} />
          </div>
          <h2 className="text-xl font-black text-white">Warning Signs</h2>
        </div>
        <p className="text-sm text-white/40 mb-6 pl-11">Gambling becomes a problem when it stops being entertainment. Watch for these signs in yourself or someone you care about.</p>
        <div className="rounded-2xl border border-[#EB505A]/20 bg-[#EB505A]/[0.04] overflow-hidden">
          {WARNING_SIGNS.map((sign, i) => (
            <div key={i} className="flex items-start gap-4 px-5 py-4 border-b border-white/[0.04] last:border-0">
              <div className="w-1.5 h-1.5 rounded-full bg-[#EB505A] mt-2 shrink-0" />
              <p className="text-sm text-white/60 leading-relaxed">{sign}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-white/30 text-center">
          Experiencing 3 or more of these signs is a strong signal to seek support.
        </p>
      </section>

      {/* Tools & strategies */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-12 border-t border-white/[0.05]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-xl bg-[#818cf8]/15 flex items-center justify-center">
            <Heart size={15} className="text-[#818cf8]" strokeWidth={2} />
          </div>
          <h2 className="text-xl font-black text-white">Tools for Staying in Control</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <div key={tool.title} className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${tool.color}15` }}>
                  <Icon size={16} style={{ color: tool.color }} strokeWidth={1.8} />
                </div>
                <p className="text-sm font-black text-white mb-2">{tool.title}</p>
                <p className="text-sm text-white/40 leading-relaxed">{tool.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Resources */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 py-12 border-t border-white/[0.05]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-xl bg-[#50C882]/15 flex items-center justify-center">
            <Phone size={15} className="text-[#50C882]" strokeWidth={2} />
          </div>
          <h2 className="text-xl font-black text-white">Free Resources</h2>
        </div>
        <div className="space-y-3">
          {RESOURCES.map((r) => (
            <div key={r.name} className="rounded-2xl border border-white/[0.07] bg-[#111622] p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black shrink-0"
                style={{ backgroundColor: `${r.color}15`, color: r.color, border: `1px solid ${r.color}25` }}>
                {r.abbr}
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-white mb-0.5">{r.name}</p>
                <p className="text-xs text-white/40">{r.desc}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {r.phone && (
                  <a href={`tel:${r.phone.replace(/-/g, "")}`} className="text-sm font-black transition-colors" style={{ color: r.color }}>
                    {r.phone}
                  </a>
                )}
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors hover:opacity-80"
                  style={{ borderColor: `${r.color}30`, color: r.color, backgroundColor: `${r.color}10` }}
                >
                  Visit
                  <ExternalLink size={10} strokeWidth={2} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Age & legal */}
      <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-16">
        <div className="rounded-2xl border border-white/[0.07] bg-[#111622] p-6 text-center">
          <p className="text-4xl font-black text-white mb-2">21+</p>
          <p className="text-sm text-white/40 leading-relaxed max-w-md mx-auto">
            Sports betting is legal only for adults 21 and older in jurisdictions where it has been authorized.
            MLB Edge Pro does not facilitate wagering and is not affiliated with any sportsbook.
            Please verify that sports betting is legal in your state before participating.
          </p>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
