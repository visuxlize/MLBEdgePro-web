/**
 * GET  /api/bet-slips   → return all slips for the signed-in user
 * POST /api/bet-slips   → create a new slip
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getIp } from "@/lib/rate-limit";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bet_slips")
    .select("*")
    .eq("clerk_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  // Rate limit: 30 slip creates per minute per IP
  const ip = getIp(req);
  const rl = rateLimit(`bet-slips:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bet_slips")
    .insert({
      // Never trust client-supplied id or created_at — let the DB generate them
      clerk_user_id: userId,
      legs:          body.legs,
      wager:         body.wager,
      to_win:        body.toWin ?? null,
      status:        "pending",           // always start as pending
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
