import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TrialSignUp } from "./trial-sign-up";
import { TrialAlreadyUsed } from "./trial-already-used";

interface Props {
  searchParams: Promise<{ tier?: string }>;
}

export default async function TrialPage({ searchParams }: Props) {
  const { userId } = await auth();
  const { tier: rawTier } = await searchParams;
  const tier = rawTier === "pro" ? "pro" : "fan";

  // ── Not signed in — show sign-up form ────────────────────────────────────
  if (!userId) {
    return <TrialSignUp tier={tier} />;
  }

  // ── Signed in — check if trial was already used ───────────────────────────
  const user = await currentUser();
  const meta = (user?.publicMetadata ?? {}) as {
    trialUsed?: boolean;
    isPro?: boolean;
    plan?: string;
  };

  // Already on a paid plan — send straight to the app
  if (meta.isPro) {
    redirect("/games");
  }

  // Trial already used — show "pay or stay free" screen
  if (meta.trialUsed) {
    return <TrialAlreadyUsed tier={tier} />;
  }

  // Signed in, no trial used — go straight to Stripe checkout
  redirect(`/trial/checkout?tier=${tier}`);
}
