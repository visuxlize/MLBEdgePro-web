/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout Session and returns the checkout URL.
 *
 * Body: { priceId: string, clerkUserId: string, userEmail: string }
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tier } = await req.json() as { tier: "fan" | "pro" };

  const priceId =
    tier === "pro"
      ? process.env.STRIPE_PRO_PRICE_ID
      : process.env.STRIPE_FAN_PRICE_ID;

  if (!priceId || priceId.startsWith("price_YOUR")) {
    return NextResponse.json(
      { error: "Stripe price IDs not configured. See SETUP.md." },
      { status: 500 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    // Pass the Clerk user ID so the webhook can update their metadata
    client_reference_id: userId,
    metadata: {
      clerk_user_id: userId,
      tier,
    },
    subscription_data: {
      metadata: {
        clerk_user_id: userId,
        tier,
      },
    },
    success_url: `${appUrl}/games?upgrade=success&tier=${tier}`,
    cancel_url:  `${appUrl}/upgrade`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
