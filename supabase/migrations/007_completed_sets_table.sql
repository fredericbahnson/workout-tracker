-- Documentation migration: completed_sets table
-- This table was created via Supabase dashboard and is documented here for reproducibility

CREATE TABLE IF NOT EXISTS completed_sets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_set_id UUID,
  scheduled_workout_id UUID,
  exercise_id UUID NOT NULL,
  target_reps INTEGER NOT NULL,
  actual_reps INTEGER NOT NULL,
  weight NUMERIC,
  completed_at TIMESTAMPTZ NOT NULL,
  notes TEXT DEFAULT '',
  parameters JSONB DEFAULT '{}'::jsonb,
  deleted_at TIMESTAMPTZ
);

-- RLS Policies (idempotent)
ALTER TABLE completed_sets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own completed_sets" ON completed_sets FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own completed_sets" ON completed_sets FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own completed_sets" ON completed_sets FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own completed_sets" ON completed_sets FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_completed_sets_user_id ON completed_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_sets_exercise_id ON completed_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_completed_sets_completed_at ON completed_sets(completed_at);
CREATE INDEX IF NOT EXISTS idx_completed_sets_deleted_at ON completed_sets(deleted_at);
