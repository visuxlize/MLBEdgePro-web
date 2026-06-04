import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth, currentUser } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

// Trial lengths per tier
const TRIAL_DAYS: Record<"fan" | "pro", number> = {
  fan: 14,
  pro: 3,
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tier, trial } = await req.json() as { tier: "fan" | "pro"; trial?: boolean };

  // Always use the regular recurring price IDs — trial is applied via trial_period_days
  const priceId =
    tier === "pro"
      ? process.env.STRIPE_PRO_PRICE_ID
      : process.env.STRIPE_FAN_PRICE_ID;

  if (!priceId) {
    return NextResponse.json(
      { error: `STRIPE_${tier.toUpperCase()}_PRICE_ID is not set.` },
      { status: 500 }
    );
  }
  if (!priceId.startsWith("price_")) {
    return NextResponse.json(
      { error: `STRIPE_${tier.toUpperCase()}_PRICE_ID is invalid — expected price_... got: ${priceId}` },
      { status: 500 }
    );
  }

  const user  = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://mlbedgepro.dev";

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
        // Attach trial days only when this is a trial checkout
        ...(trial ? { trial_period_days: TRIAL_DAYS[tier] } : {}),
      },
      success_url: `https://mlbedgepro.dev/games?upgrade=success&tier=${tier}`,
      cancel_url:  `${origin}/upgrade`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("[stripe/checkout]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
