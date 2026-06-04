import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TrialAlreadyUsed } from "./trial-already-used";
import { TrialLanding } from "./trial-landing";

interface Props {
  searchParams: Promise<{ tier?: string }>;
}

export default async function TrialPage({ searchParams }: Props) {
  const { userId } = await auth();
  const { tier: rawTier } = await searchParams;
  const tier = rawTier === "pro" ? "pro" : "fan";

  // ── Not signed in — show landing that saves tier + redirects to /sign-up ──
  if (!userId) {
    return <TrialLanding tier={tier} />;
  }

  // ── Signed in — check plan status ─────────────────────────────────────────
  const { has } = await auth();
  const user = await currentUser();
  const meta = (user?.publicMetadata ?? {}) as {
    trialUsed?: boolean;
    isPro?: boolean;
  };

  let hasFan = false;
  let hasPro = false;
  try {
    hasFan = has?.({ plan: "fan_subscription" }) ?? false;
    hasPro = has?.({ plan: "pro_subscription" }) ?? false;
  } catch {}

  // Already subscribed — send to app
  if (hasFan || hasPro || meta.isPro) {
    redirect("/games");
  }

  // Trial already used — show pay/free options
  if (meta.trialUsed) {
    return <TrialAlreadyUsed tier={tier} />;
  }

  // Signed in, no trial yet — redirect directly to the Stripe/Clerk checkout
  redirect(`/api/trial/${tier}`);
}
