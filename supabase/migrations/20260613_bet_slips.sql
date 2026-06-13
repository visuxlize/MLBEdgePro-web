-- Run this in: Supabase Dashboard → SQL Editor → New query
-- Creates the bet_slips table for MLB Edge Pro bet tracker

CREATE TABLE IF NOT EXISTS public.bet_slips (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id   TEXT        NOT NULL,
  legs            JSONB       NOT NULL DEFAULT '[]',
  wager           NUMERIC(10, 2) NOT NULL DEFAULT 0,
  to_win          NUMERIC(10, 2),
  status          TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'won', 'lost', 'void')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at      TIMESTAMPTZ
);

-- Fast lookup by user, sorted newest first
CREATE INDEX IF NOT EXISTS idx_bet_slips_user
  ON public.bet_slips (clerk_user_id, created_at DESC);

-- RLS enabled but bypassed by service role key (what the app uses)
ALTER TABLE public.bet_slips ENABLE ROW LEVEL SECURITY;
