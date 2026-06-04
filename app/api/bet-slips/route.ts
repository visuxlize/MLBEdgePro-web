/**
 * GET  /api/bet-slips   → return all slips for the signed-in user
 * POST /api/bet-slips   → create a new slip
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

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
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bet_slips")
    .insert({
      id:            body.id,
      clerk_user_id: userId,
      created_at:    body.createdAt,
      legs:          body.legs,
      wager:         body.wager,
      to_win:        body.toWin ?? null,
      status:        body.status ?? "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
