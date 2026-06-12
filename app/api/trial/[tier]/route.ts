/**
 * GET /api/trial/fan  → creates Stripe checkout with 14-day trial, redirects
 * GET /api/trial/pro  → creates Stripe checkout with 3-day trial, redirects
 *
 * This is a server-side redirect — no client JS race conditions, works
 * perfectly after both email sign-up and Google OAuth.
 */

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { rateLimit, getIp } from "@/lib/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const TRIAL_DAYS = { fan: 14, pro: 3 } as const;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tier: string }> }
) {
  // Rate limit: 5 trial attempts per minute per IP
  const ip = getIp(req);
  const rl = rateLimit(`trial:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const { userId } = await auth();

  // Not signed in — send to sign-up for the correct tier
  if (!userId) {
    const { tier } = await params;
    const safeTier = tier === "pro" ? "pro" : "fan";
    return NextResponse.redirect(
      new URL(`/trial?tier=${safeTier}`, process.env.NEXT_PUBLIC_APP_URL ?? "https://mlbedgepro.dev")
    );
  }

  const { tier: rawTier } = await params;
  const tier = rawTier === "pro" ? "pro" : "fan";

  // Verify trial hasn't been used
  const user = await currentUser();
  const meta = (user?.publicMetadata ?? {}) as { trialUsed?: boolean };
  if (meta.trialUsed === true) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://mlbedgepro.dev";
    return NextResponse.redirect(
      new URL(`/upgrade?error=${encodeURIComponent("You have already used your free trial.")}`, appUrl)
    );
  }

  const priceId =
    tier === "pro"
      ? process.env.STRIPE_PRO_PRICE_ID
      : process.env.STRIPE_FAN_PRICE_ID;

  if (!priceId) {
    return NextResponse.json({ error: "Price not configured" }, { status: 500 });
  }

  const email = user?.emailAddresses?.[0]?.emailAddress;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://mlbedgepro.dev";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      ...(email ? { customer_email: email } : {}),
      metadata: { clerk_user_id: userId, tier },
      subscription_data: {
        metadata: { clerk_user_id: userId, tier },
        trial_period_days: TRIAL_DAYS[tier],
      },
      success_url: `${appUrl}/games?upgrade=success&tier=${tier}`,
      cancel_url:  `${appUrl}/upgrade`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    if (!session.url) {
      return NextResponse.json({ error: "No checkout URL" }, { status: 500 });
    }

    return NextResponse.redirect(session.url);
  } catch (err: any) {
    console.error("[trial/start]", err.message);
    // On error send to upgrade page with error message in URL
    return NextResponse.redirect(
      new URL(`/upgrade?error=${encodeURIComponent(err.message)}`, appUrl)
    );
  }
}
