-- Documentation migration: max_records table
-- This table was created via Supabase dashboard and is documented here for reproducibility

CREATE TABLE IF NOT EXISTS max_records (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL,
  max_reps INTEGER,
  max_time INTEGER,
  weight NUMERIC,
  notes TEXT DEFAULT '',
  recorded_at TIMESTAMPTZ NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- RLS Policies (idempotent)
ALTER TABLE max_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own max_records" ON max_records FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own max_records" ON max_records FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own max_records" ON max_records FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own max_records" ON max_records FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_max_records_user_id ON max_records(user_id);
CREATE INDEX IF NOT EXISTS idx_max_records_exercise_id ON max_records(exercise_id);
CREATE INDEX IF NOT EXISTS idx_max_records_deleted_at ON max_records(deleted_at);
