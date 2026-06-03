import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const supabase = await createClient();

  const { error } = await supabase.from("waitlist").upsert(
    { email: email.trim().toLowerCase(), created_at: new Date().toISOString() },
    { onConflict: "email" }
  );

  if (error) {
    console.error("Waitlist insert error:", error);
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
