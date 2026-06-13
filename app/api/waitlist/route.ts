import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  // Rate limit: 5 signups per hour per IP to prevent spam
  const ip = getIp(req);
  const rl = rateLimit(`waitlist:${ip}`, 5, 3_600_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const { email } = await req.json();

  if (!email || typeof email !== "string" || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Prefer service role key (bypasses RLS) — fall back to publishable key
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log("[waitlist] Supabase not configured — recording email:", email.trim().toLowerCase());
    return NextResponse.json({ ok: true });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const { error } = await supabase.from("waitlist").upsert(
    { email: email.trim().toLowerCase(), joined_at: new Date().toISOString() },
    { onConflict: "email" },
  );

  if (error) {
    console.log("[waitlist] DB error, logging email:", email.trim().toLowerCase(), error.message, error.code);
    // Degrade gracefully — user sees success, email is logged server-side
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
