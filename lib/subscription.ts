"use client";

import { useUser } from "@clerk/nextjs";

export type Plan = "free" | "fan" | "pro";

export interface SubscriptionStatus {
  plan: Plan;
  /** true for both Fan ($4.99) and Pro ($14.99) */
  isPro: boolean;
  /** true ONLY for Pro ($14.99) — HR Deep Dive and advanced features */
  isSuperPro: boolean;
  isLoaded: boolean;
  stripeSubscriptionId?: string;
  expiresAt?: string;
}

/**
 * Reads subscription status from Clerk publicMetadata.
 *
 * Tier mapping:
 *   free       → no features locked
 *   fan  $4.99 → Edge Report, Prop Builder, Matchup Analysis
 *   pro $14.99 → Everything in Fan + HR Deep Dive, Advanced Analysis
 *
 * To grant a tier manually (dev/testing):
 *   Clerk Dashboard → Users → your user → Metadata → Public
 *   { "plan": "pro", "isPro": true, "isSuperPro": true }
 */
export function useSubscription(): SubscriptionStatus {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return { plan: "free", isPro: false, isSuperPro: false, isLoaded: false };
  if (!user)     return { plan: "free", isPro: false, isSuperPro: false, isLoaded: true  };

  const meta = (user.publicMetadata ?? {}) as {
    plan?: Plan;
    isPro?: boolean;
    isSuperPro?: boolean;
    stripeSubscriptionId?: string;
    subscriptionExpiresAt?: string;
  };

  const plan: Plan     = meta.plan ?? "free";
  const isPro          = meta.isPro === true || plan === "fan" || plan === "pro";
  const isSuperPro     = meta.isSuperPro === true || plan === "pro";

  return {
    plan,
    isPro,
    isSuperPro,
    isLoaded:              true,
    stripeSubscriptionId:  meta.stripeSubscriptionId,
    expiresAt:             meta.subscriptionExpiresAt,
  };
}

// Helper for the PaywallGate
export function canAccess(
  tier: "fan" | "pro",
  subscription: SubscriptionStatus
): boolean {
  if (tier === "fan") return subscription.isPro;
  if (tier === "pro") return subscription.isSuperPro;
  return true;
}
