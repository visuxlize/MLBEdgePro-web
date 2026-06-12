/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events to grant / revoke subscription access.
 *
 * Events handled:
 *   checkout.session.completed  → grant plan (fan or pro) in Clerk publicMetadata
 *   customer.subscription.updated → handle plan changes / renewals
 *   customer.subscription.deleted → downgrade to free
 *
 * SETUP:
 *   1. stripe listen --forward-to localhost:3000/api/stripe/webhook
 *   2. Set STRIPE_WEBHOOK_SECRET from the CLI output
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export async function POST(req: Request) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not set" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Stripe webhook signature failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const client = await clerkClient();

  console.log("Stripe event:", event.type);

  // ── checkout.session.completed ─────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const clerkId = session.metadata?.clerk_user_id;
    const tier    = session.metadata?.tier as "fan" | "pro" | undefined;

    if (!clerkId || !tier) {
      console.warn("Missing metadata in checkout session:", session.id);
      return NextResponse.json({ received: true });
    }

    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

    // Get subscription end date
    let expiresAt: string | null = null;
    if (subscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        expiresAt = new Date((sub as any).current_period_end * 1000).toISOString();
      } catch {}
    }

    // Check if this checkout included a trial
    let isTrialing = false;
    if (subscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        isTrialing = sub.status === "trialing";
      } catch {}
    }

    await client.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        plan:                  tier,
        isPro:                 true,
        isSuperPro:            tier === "pro",
        subscriptionExpiresAt: expiresAt,
        ...(isTrialing ? { trialUsed: true } : {}),
      },
      privateMetadata: {
        stripeSubscriptionId: subscriptionId,
      },
    });

    console.log(`✅ Granted ${tier} plan to ${clerkId}${isTrialing ? " (trial)" : ""}`);
  }

  // ── customer.subscription.updated (renewal, upgrade, downgrade) ────────────
  if (event.type === "customer.subscription.updated") {
    const sub     = event.data.object as Stripe.Subscription;
    const clerkId = sub.metadata?.clerk_user_id;
    if (!clerkId) return NextResponse.json({ received: true });

    const rawTier = sub.metadata?.tier;
    const tier    = (rawTier === "fan" || rawTier === "pro") ? rawTier : null;
    const active  = sub.status === "active" || sub.status === "trialing";
    const expires = new Date((sub as any).current_period_end * 1000).toISOString();

    if (!tier) {
      console.warn("customer.subscription.updated: missing/invalid tier in metadata", sub.id);
      return NextResponse.json({ received: true });
    }

    await client.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        plan:                  active ? tier : "free",
        isPro:                 active,
        isSuperPro:            active && tier === "pro",
        subscriptionExpiresAt: active ? expires : null,
      },
      privateMetadata: {
        stripeSubscriptionId: sub.id,
      },
    });
  }

  // ── customer.subscription.deleted (cancelled + expired) ───────────────────
  if (event.type === "customer.subscription.deleted") {
    const sub     = event.data.object as Stripe.Subscription;
    const clerkId = sub.metadata?.clerk_user_id;
    if (!clerkId) return NextResponse.json({ received: true });

    await client.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        plan:                  "free",
        isPro:                 false,
        isSuperPro:            false,
        subscriptionExpiresAt: null,
      },
      privateMetadata: {
        stripeSubscriptionId: null,
      },
    });

    console.log(`❌ Revoked plan from ${clerkId}`);
  }

  return NextResponse.json({ received: true });
}
