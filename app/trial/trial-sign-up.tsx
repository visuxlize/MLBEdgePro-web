"use client";

import { useEffect } from "react";
import { SignUp, ClerkLoaded } from "@clerk/nextjs";
import { Zap, Star } from "lucide-react";
import { setPendingTrial } from "@/components/PendingTrialRedirect";

const CLERK_APPEARANCE = {
  variables: {
    colorPrimary:         "#1a73ff",
    colorBackground:      "#ffffff",
    colorInputBackground: "#f3f4f7",
    colorInputText:       "#ffffff",
    colorText:            "#ffffff",
    colorTextSecondary:   "rgba(20,22,27,.6)",
    colorDanger:          "#eb505a",
    borderRadius:         "0.875rem",
  },
  elements: {
    card:            "shadow-[0_32px_80px_rgba(0,0,0,0.6)] border border-[#14161b]/[.09]",
    headerTitle:     "text-[#14161b] font-black",
    headerSubtitle:  "text-[#14161b]/56",
    formButtonPrimary:
      "bg-[#1a73ff] hover:bg-[#5a9bff] shadow-[0_6px_20px_rgba(26,115,255,0.40)]",
    footerActionLink: "text-[#1a73ff] hover:text-[#5a9bff]",
  },
};

const TIER_META = {
  fan: {
    label:   "Fan",
    trial:   "14-day free trial",
    price:   "$4.99/mo after",
    tagline: "Props, Edge Report & matchup analysis",
    color:   "#1a73ff",
    bg:      "rgba(26,115,255,0.08)",
    border:  "rgba(26,115,255,0.25)",
    Icon:    Zap,
  },
  pro: {
    label:   "Pro",
    trial:   "3-day free trial",
    price:   "$14.99/mo after",
    tagline: "Spray charts, barrel rate & daily picks",
    color:   "#6d4fe0",
    bg:      "rgba(129,140,248,0.08)",
    border:  "rgba(129,140,248,0.25)",
    Icon:    Star,
  },
} as const;

export function TrialSignUp({ tier }: { tier: "fan" | "pro" }) {
  const meta = TIER_META[tier];
  const { Icon } = meta;

  // Save the intended tier to localStorage immediately — this survives ANY
  // redirect chain (Google OAuth, email verify, etc.) so PendingTrialRedirect
  // in the app layout can pick it up and send the user to /api/trial/[tier].
  useEffect(() => {
    setPendingTrial(tier);
  }, [tier]);

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
        <h1 className="text-2xl font-black text-[#14161b] mb-1">Create your account</h1>
        <p className="text-sm text-[#14161b]/56">
          {meta.tagline}
          <span className="mx-2 text-[#14161b]/38">·</span>
          {meta.price}
          <span className="mx-2 text-[#14161b]/38">·</span>
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

      <p className="relative z-10 mt-6 text-xs text-[#14161b]/38 text-center">
        Already have an account?{" "}
        <a href="/sign-in" className="transition-colors" style={{ color: meta.color }}>
          Sign in
        </a>
      </p>
    </div>
  );
}
