"use client";

import { SignUp, ClerkLoaded } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
    // Hide social buttons until Google/Apple OAuth redirect URIs are configured
    socialButtonsBlockButton: "hidden",
    socialButtonsBlock:       "hidden",
    dividerRow:               "hidden",
    formButtonPrimary:
      "bg-[#FF7828] hover:bg-[#FFA550] shadow-[0_6px_20px_rgba(255,120,40,0.40)]",
    footerActionLink: "text-[#FF7828] hover:text-[#FFA550]",
  },
};

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-background overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[#FF7828]/[0.06] blur-[100px]" />
      <div className="pointer-events-none absolute -top-40 left-1/4 w-80 h-80 rounded-full bg-indigo-500/[0.05] blur-3xl" />

      {/* Back link */}
      <div className="relative z-10 w-full max-w-md mb-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/35 hover:text-white transition-colors">
          <ArrowLeft size={14} strokeWidth={2} />
          Back to Home
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <ClerkLoaded>
          <SignUp
            appearance={CLERK_APPEARANCE}
            forceRedirectUrl="/games"
            signInUrl="/sign-in"
          />
        </ClerkLoaded>
      </div>

      <p className="relative z-10 mt-6 text-xs text-white/20 text-center">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-[#FF7828] hover:text-[#FFA550] transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
