import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth, currentUser } from "@clerk/nextjs/server";
import { rateLimit, getIp } from "@/lib/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const TRIAL_DAYS: Record<"fan" | "pro", number> = {
  fan: 14,
  pro: 3,
};

const ALLOWED_ORIGINS = new Set([
  "https://mlbedgepro.dev",
  "https://www.mlbedgepro.dev",
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean));

function safeOrigin(req: Request): string {
  const raw = req.headers.get("origin") ?? "";
  try {
    const u = new URL(raw);
    const normalized = `${u.protocol}//${u.host}`;
    if (ALLOWED_ORIGINS.has(normalized)) return normalized;
  } catch {}
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://mlbedgepro.dev";
}

export async function POST(req: Request) {
  // Rate limit: 10 checkout attempts per minute per IP
  const ip = getIp(req);
  const rl = rateLimit(`checkout:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { tier?: unknown; trial?: unknown };

  // Validate tier strictly — reject anything that isn't exactly "fan" or "pro"
  if (body.tier !== "fan" && body.tier !== "pro") {
    return NextResponse.json({ error: "Invalid tier." }, { status: 400 });
  }
  const tier = body.tier as "fan" | "pro";
  const wantsTrial = body.trial === true;

  const priceId =
    tier === "pro"
      ? process.env.STRIPE_PRO_PRICE_ID
      : process.env.STRIPE_FAN_PRICE_ID;

  if (!priceId) {
    return NextResponse.json(
      { error: `STRIPE_${tier.toUpperCase()}_PRICE_ID is not set.` },
      { status: 500 },
    );
  }
  if (!priceId.startsWith("price_")) {
    return NextResponse.json(
      { error: `STRIPE_${tier.toUpperCase()}_PRICE_ID is invalid — expected price_... got: ${priceId}` },
      { status: 500 },
    );
  }

  // If requesting a trial, verify server-side that the user hasn't used one
  let applyTrial = false;
  if (wantsTrial) {
    const user = await currentUser();
    const meta = (user?.publicMetadata ?? {}) as { trialUsed?: boolean };
    if (meta.trialUsed === true) {
      return NextResponse.json(
        { error: "You have already used your free trial." },
        { status: 403 },
      );
    }
    applyTrial = true;
  }

  const user  = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  const origin = safeOrigin(req);

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
        ...(applyTrial ? { trial_period_days: TRIAL_DAYS[tier] } : {}),
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
