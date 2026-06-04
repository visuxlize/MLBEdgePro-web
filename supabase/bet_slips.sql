-- Run this in Supabase Dashboard → SQL Editor
-- Creates the bet_slips table for cross-device parlay tracking

CREATE TABLE IF NOT EXISTS bet_slips (
  id            TEXT PRIMARY KEY,
  clerk_user_id TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at    TIMESTAMPTZ,
  legs          JSONB       NOT NULL DEFAULT '[]',
  wager         NUMERIC     NOT NULL DEFAULT 0,
  to_win        NUMERIC,
  status        TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'won', 'lost'))
);

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS bet_slips_user_idx ON bet_slips (clerk_user_id);
CREATE INDEX IF NOT EXISTS bet_slips_created_idx ON bet_slips (clerk_user_id, created_at DESC);

-- Disable RLS — security is enforced by Clerk auth in the Next.js API routes.
-- All queries filter by clerk_user_id which is set server-side and never
-- exposed to the client.
ALTER TABLE bet_slips DISABLE ROW LEVEL SECURITY;
