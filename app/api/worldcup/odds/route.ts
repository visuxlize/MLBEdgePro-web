import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { fetchWCOddsMarkets, fetchWCPlayerProps } from "@/lib/worldcup/wc-odds";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getIp(req);
  const rl = rateLimit(`wc-odds:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (!process.env.ODDS_API_KEY) {
    // Return empty arrays rather than 500 — frontend handles gracefully
    return NextResponse.json([]);
  }

  try {
    if (type === "props") {
      const eventId = searchParams.get("eventId") ?? undefined;
      const props   = await fetchWCPlayerProps(eventId);
      return NextResponse.json(props);
    }

    const markets = await fetchWCOddsMarkets();
    return NextResponse.json(markets);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
