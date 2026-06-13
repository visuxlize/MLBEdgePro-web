/**
 * PATCH  /api/bet-slips/[id]  → update slip (settle, edit legs/wager)
 * DELETE /api/bet-slips/[id]  → delete slip
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body    = await req.json();
  const supabase = createServiceClient();

  const VALID_STATUSES = new Set(["pending", "won", "lost", "void"]);

  const update: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (!VALID_STATUSES.has(body.status)) {
      return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
    }
    update.status = body.status;
  }
  if (body.settledAt !== undefined) update.settled_at = body.settledAt;
  if (body.legs      !== undefined) update.legs       = body.legs;
  if (body.wager     !== undefined) update.wager      = body.wager;
  if (body.toWin     !== undefined) update.to_win     = body.toWin;

  const { data, error } = await supabase
    .from("bet_slips")
    .update(update)
    .eq("id", id)
    .eq("clerk_user_id", userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("bet_slips")
    .delete()
    .eq("id", id)
    .eq("clerk_user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
