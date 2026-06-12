import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type Plan = "free" | "fan" | "pro";

interface PlanResult {
  userId: string;
  plan: Plan;
}

export async function requirePlan(minPlan: "fan" | "pro"): Promise<PlanResult | NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const meta = (user?.publicMetadata ?? {}) as {
    plan?: Plan;
    isPro?: boolean;
    isSuperPro?: boolean;
  };

  const plan: Plan = meta.plan ?? "free";
  const isFanOrAbove = meta.isPro === true || plan === "fan" || plan === "pro";
  const isProOnly    = meta.isSuperPro === true || plan === "pro";

  if (minPlan === "fan" && !isFanOrAbove) {
    return NextResponse.json({ error: "Fan plan required to access this feature." }, { status: 403 });
  }
  if (minPlan === "pro" && !isProOnly) {
    return NextResponse.json({ error: "Pro plan required to access this feature." }, { status: 403 });
  }

  return { userId, plan };
}

export function isNextResponse(v: unknown): v is NextResponse {
  return v instanceof NextResponse;
}
