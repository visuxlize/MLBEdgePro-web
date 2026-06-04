"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const PENDING_TRIAL_KEY = "mlbedge_pending_trial";

/** Call this anywhere before sign-up/sign-in to record the intended trial tier. */
export function setPendingTrial(tier: "fan" | "pro") {
  try { localStorage.setItem(PENDING_TRIAL_KEY, tier); } catch {}
}

/**
 * Drop this inside the authenticated app layout.
 * On every mount it checks localStorage for a pending trial, and if found
 * immediately redirects to the server-side trial API — regardless of how
 * the user authenticated (email, Google OAuth, etc.).
 */
export function PendingTrialRedirect() {
  const router = useRouter();

  useEffect(() => {
    try {
      const tier = localStorage.getItem(PENDING_TRIAL_KEY) as "fan" | "pro" | null;
      if (tier === "fan" || tier === "pro") {
        localStorage.removeItem(PENDING_TRIAL_KEY);
        // Hard navigate so the server-side API route runs correctly
        window.location.href = `/api/trial/${tier}`;
      }
    } catch {}
  }, []);

  return null;
}
