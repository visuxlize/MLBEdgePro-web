"use client";

import { SignUp, ClerkLoaded } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
    // Hide social buttons until Google/Apple OAuth redirect URIs are configured
    socialButtonsBlockButton: "hidden",
    socialButtonsBlock:       "hidden",
    dividerRow:               "hidden",
    formButtonPrimary:
      "bg-[#1a73ff] hover:bg-[#5a9bff] shadow-[0_6px_20px_rgba(26,115,255,0.40)]",
    footerActionLink: "text-[#1a73ff] hover:text-[#5a9bff]",
  },
};

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-background overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[#1a73ff]/[0.06] blur-[100px]" />
      <div className="pointer-events-none absolute -top-40 left-1/4 w-80 h-80 rounded-full bg-indigo-500/[0.05] blur-3xl" />

      {/* Back link */}
      <div className="relative z-10 w-full max-w-md mb-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#14161b]/56 hover:text-[#14161b] transition-colors">
          <ArrowLeft size={14} strokeWidth={2} />
          Back to Home
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <ClerkLoaded>
          <SignUp
            appearance={CLERK_APPEARANCE}
            forceRedirectUrl="/home"
            signInUrl="/sign-in"
          />
        </ClerkLoaded>
      </div>

      <p className="relative z-10 mt-6 text-xs text-[#14161b]/38 text-center">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-[#1a73ff] hover:text-[#5a9bff] transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
