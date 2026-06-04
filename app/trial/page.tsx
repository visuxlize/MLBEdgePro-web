import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TrialSignUp } from "./trial-sign-up";

interface Props {
  searchParams: Promise<{ tier?: string }>;
}

export default async function TrialPage({ searchParams }: Props) {
  const { userId } = await auth();
  const { tier } = await searchParams;

  const validTier = tier === "pro" ? "pro" : "fan";

  // Already signed in — skip signup, go straight to checkout
  if (userId) {
    redirect(`/trial/checkout?tier=${validTier}`);
  }

  return <TrialSignUp tier={validTier} />;
}
