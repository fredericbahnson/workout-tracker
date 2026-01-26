-- Documentation migration: cycles table
-- This table was created via Supabase dashboard and is documented here for reproducibility

CREATE TABLE IF NOT EXISTS cycles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cycle_type TEXT NOT NULL,
  progression_mode TEXT,
  previous_cycle_id UUID,
  start_date TIMESTAMPTZ NOT NULL,
  number_of_weeks INTEGER NOT NULL,
  workout_days_per_week INTEGER NOT NULL,
  weekly_set_goals JSONB NOT NULL,
  groups JSONB NOT NULL,
  group_rotation JSONB NOT NULL,
  rfem_rotation JSONB NOT NULL,
  conditioning_weekly_rep_increment INTEGER NOT NULL,
  conditioning_weekly_time_increment INTEGER,
  include_warmup_sets BOOLEAN,
  include_timed_warmups BOOLEAN,
  scheduling_mode TEXT,
  selected_days JSONB,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- RLS Policies (idempotent)
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own cycles" ON cycles FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own cycles" ON cycles FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own cycles" ON cycles FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own cycles" ON cycles FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_cycles_user_id ON cycles(user_id);
CREATE INDEX IF NOT EXISTS idx_cycles_status ON cycles(status);
CREATE INDEX IF NOT EXISTS idx_cycles_deleted_at ON cycles(deleted_at);
