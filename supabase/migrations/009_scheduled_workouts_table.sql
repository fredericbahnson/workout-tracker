-- Documentation migration: scheduled_workouts table
-- This table was created via Supabase dashboard and is documented here for reproducibility

CREATE TABLE IF NOT EXISTS scheduled_workouts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL,
  sequence_number INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  day_in_week INTEGER NOT NULL,
  group_id TEXT NOT NULL,
  rfem INTEGER NOT NULL,
  scheduled_sets JSONB NOT NULL,
  status TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  scheduled_date TIMESTAMPTZ,
  skip_reason TEXT,
  deleted_at TIMESTAMPTZ
);

-- RLS Policies (idempotent)
ALTER TABLE scheduled_workouts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own scheduled_workouts" ON scheduled_workouts FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own scheduled_workouts" ON scheduled_workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own scheduled_workouts" ON scheduled_workouts FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own scheduled_workouts" ON scheduled_workouts FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_user_id ON scheduled_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_cycle_id ON scheduled_workouts(cycle_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_status ON scheduled_workouts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_deleted_at ON scheduled_workouts(deleted_at);
