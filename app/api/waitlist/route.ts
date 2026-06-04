import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Prefer service role key (bypasses RLS) — fall back to publishable key
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase env vars missing");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const { error } = await supabase.from("waitlist").upsert(
    { email: email.trim().toLowerCase(), joined_at: new Date().toISOString() },
    { onConflict: "email" },
  );

  if (error) {
    console.error("Waitlist insert error:", error.message, error.code);
    return NextResponse.json(
      { error: "Failed to join waitlist. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
