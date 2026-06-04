"use client";

import { SignUp, ClerkLoaded } from "@clerk/nextjs";
import { Zap, Star } from "lucide-react";

const CLERK_APPEARANCE = {
  variables: {
    colorPrimary:         "#FF7828",
    colorBackground:      "#111622",
    colorInputBackground: "#191C22",
    colorInputText:       "#ffffff",
    colorText:            "#ffffff",
    colorTextSecondary:   "rgba(255,255,255,0.45)",
    colorDanger:          "#eb505a",
    borderRadius:         "0.875rem",
  },
  elements: {
    card:            "shadow-[0_32px_80px_rgba(0,0,0,0.6)] border border-white/[0.07]",
    headerTitle:     "text-white font-black",
    headerSubtitle:  "text-white/45",
    formButtonPrimary:
      "bg-[#FF7828] hover:bg-[#FFA550] shadow-[0_6px_20px_rgba(255,120,40,0.40)]",
    footerActionLink: "text-[#FF7828] hover:text-[#FFA550]",
  },
};

const TIER_META = {
  fan: {
    label:   "Fan",
    trial:   "14-day free trial",
    price:   "$4.99/mo after",
    tagline: "Props, Edge Report & matchup analysis",
    color:   "#FF7828",
    bg:      "rgba(255,120,40,0.08)",
    border:  "rgba(255,120,40,0.25)",
    Icon:    Zap,
  },
  pro: {
    label:   "Pro",
    trial:   "3-day free trial",
    price:   "$14.99/mo after",
    tagline: "Spray charts, barrel rate & daily picks",
    color:   "#818CF8",
    bg:      "rgba(129,140,248,0.08)",
    border:  "rgba(129,140,248,0.25)",
    Icon:    Star,
  },
} as const;

export function TrialSignUp({ tier }: { tier: "fan" | "pro" }) {
  const meta = TIER_META[tier];
  const { Icon } = meta;

  // After sign-up/OAuth, Clerk redirects to the server-side API route which
  // immediately creates the Stripe checkout session and redirects to Stripe.
  // Using /api/trial/fan (not /trial/checkout?tier=fan) because:
  //   1. Clean path — no query params dropped by OAuth redirect chain
  //   2. Server-side — no client JS race conditions
  //   3. Immediate redirect to Stripe — no loading screen
  const checkoutUrl = `/api/trial/${tier}`;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-background overflow-hidden">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[100px]"
        style={{ background: `${meta.color}10` }}
      />

      {/* Trial badge */}
      <div className="relative z-10 mb-6 text-center">
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 border mb-3"
          style={{ background: meta.bg, borderColor: meta.border }}
        >
          <Icon size={12} strokeWidth={2.5} style={{ color: meta.color }} />
          <span className="text-xs font-black tracking-wider uppercase" style={{ color: meta.color }}>
            {meta.label} — {meta.trial}
          </span>
        </div>
        <h1 className="text-2xl font-black text-white mb-1">Create your account</h1>
        <p className="text-sm text-white/40">
          {meta.tagline}
          <span className="mx-2 text-white/20">·</span>
          {meta.price}
          <span className="mx-2 text-white/20">·</span>
          Card required
        </p>
      </div>

      {/* Clerk SignUp */}
      <div className="relative z-10 w-full max-w-md">
        <ClerkLoaded>
          <SignUp
            appearance={CLERK_APPEARANCE}
            forceRedirectUrl={checkoutUrl}
            signInUrl="/sign-in"
          />
        </ClerkLoaded>
      </div>

      <p className="relative z-10 mt-6 text-xs text-white/20 text-center">
        Already have an account?{" "}
        <a href="/sign-in" className="transition-colors" style={{ color: meta.color }}>
          Sign in
        </a>
      </p>
    </div>
  );
}
