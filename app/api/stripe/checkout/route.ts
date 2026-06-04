/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout Session and returns the checkout URL.
 *
 * IMPORTANT — Price ID vs Product ID:
 *   STRIPE_FAN_PRICE_ID and STRIPE_PRO_PRICE_ID must be Price IDs (price_...)
 *   NOT Product IDs (prod_...). Get them from:
 *   Stripe Dashboard → Products → click your product → Pricing → copy the price ID
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth, currentUser } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tier, trial } = await req.json() as { tier: "fan" | "pro"; trial?: boolean };

  const priceId =
    tier === "pro"
      ? process.env.STRIPE_PRO_PRICE_ID
      : process.env.STRIPE_FAN_PRICE_ID;

  // Validate it's a price_ ID, not prod_ or placeholder
  if (!priceId) {
    return NextResponse.json(
      { error: `STRIPE_${tier.toUpperCase()}_PRICE_ID is not set in environment variables.` },
      { status: 500 }
    );
  }
  if (priceId.startsWith("prod_")) {
    return NextResponse.json(
      { error: `STRIPE_${tier.toUpperCase()}_PRICE_ID is a Product ID (prod_...) — you need a Price ID (price_...). Go to Stripe Dashboard → Products → your product → Pricing → copy the price ID.` },
      { status: 500 }
    );
  }
  if (!priceId.startsWith("price_")) {
    return NextResponse.json(
      { error: `STRIPE_${tier.toUpperCase()}_PRICE_ID looks invalid. It should start with price_.` },
      { status: 500 }
    );
  }

  // Get user email to pre-fill Stripe checkout
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;

  // Use request origin for URLs so it works on any domain (localhost + production)
  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      ...(email ? { customer_email: email } : {}),
      metadata: {
        clerk_user_id: userId,
        tier,
      },
      subscription_data: {
        metadata: {
          clerk_user_id: userId,
          tier,
        },
        // Trial period: Fan = 14 days, Pro = 3 days (only when trial flag is set)
        ...(trial ? { trial_period_days: tier === "pro" ? 3 : 14 } : {}),
      },
      success_url: `https://mlbedgepro.dev/games?upgrade=success&tier=${tier}`,
      cancel_url:  `${origin}/upgrade`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
