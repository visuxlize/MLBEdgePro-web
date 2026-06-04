"use client";

import { useUser, useAuth } from "@clerk/nextjs";

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
 * Reads subscription status from Clerk Billing plans + publicMetadata fallback.
 *
 * Tier mapping:
 *   free       → no features locked
 *   fan  $4.99 → Edge Report, Prop Builder, Matchup Analysis
 *   pro $14.99 → Everything in Fan + HR Deep Dive, Advanced Analysis
 *
 * Clerk Billing plan keys:
 *   fan_subscription  → Fan plan
 *   pro_subscription  → Pro plan
 *
 * Legacy publicMetadata fallback (for users subscribed before Clerk Billing):
 *   { "plan": "pro", "isPro": true, "isSuperPro": true }
 */
export function useSubscription(): SubscriptionStatus {
  const { user, isLoaded } = useUser();
  const { has, isLoaded: authLoaded } = useAuth();

  if (!isLoaded || !authLoaded) return { plan: "free", isPro: false, isSuperPro: false, isLoaded: false };
  if (!user)                    return { plan: "free", isPro: false, isSuperPro: false, isLoaded: true  };

  const meta = (user.publicMetadata ?? {}) as {
    plan?: Plan;
    isPro?: boolean;
    isSuperPro?: boolean;
    stripeSubscriptionId?: string;
    subscriptionExpiresAt?: string;
  };

  // Clerk Billing checks (primary)
  const hasFanBilling = has?.({ plan: "fan_subscription" }) ?? false;
  const hasProBilling = has?.({ plan: "pro_subscription" }) ?? false;

  // Legacy publicMetadata checks (backward compat)
  const legacyPlan: Plan = meta.plan ?? "free";
  const legacyIsFan      = legacyPlan === "fan";
  const legacyIsSuperPro = meta.isSuperPro === true || legacyPlan === "pro";

  const isFan      = hasFanBilling || legacyIsFan;
  const isSuperPro = hasProBilling || legacyIsSuperPro;
  const isPro      = isFan || isSuperPro;

  let plan: Plan = "free";
  if (isSuperPro)  plan = "pro";
  else if (isFan)  plan = "fan";

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
