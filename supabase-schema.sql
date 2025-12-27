-- Ascend Database Schema for Supabase
-- Run this in the Supabase SQL Editor (SQL Editor → New Query)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  mode TEXT NOT NULL,
  notes TEXT DEFAULT '',
  custom_parameters JSONB DEFAULT '[]',
  default_conditioning_reps INTEGER,
  weight_enabled BOOLEAN DEFAULT FALSE,
  default_weight NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Max records table
CREATE TABLE IF NOT EXISTS max_records (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID NOT NULL,
  max_reps INTEGER NOT NULL,
  weight NUMERIC,
  notes TEXT DEFAULT '',
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Completed sets table
CREATE TABLE IF NOT EXISTS completed_sets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scheduled_set_id UUID,
  scheduled_workout_id UUID,
  exercise_id UUID NOT NULL,
  target_reps INTEGER NOT NULL,
  actual_reps INTEGER NOT NULL,
  weight NUMERIC,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT DEFAULT '',
  parameters JSONB DEFAULT '{}',
  deleted_at TIMESTAMPTZ
);

-- Cycles table
CREATE TABLE IF NOT EXISTS cycles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  number_of_weeks INTEGER NOT NULL,
  workout_days_per_week INTEGER NOT NULL,
  weekly_set_goals JSONB DEFAULT '{}',
  groups JSONB DEFAULT '[]',
  group_rotation JSONB DEFAULT '[]',
  rfem_rotation JSONB DEFAULT '[]',
  conditioning_weekly_rep_increment INTEGER DEFAULT 1,
  status TEXT DEFAULT 'planning',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Scheduled workouts table
CREATE TABLE IF NOT EXISTS scheduled_workouts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cycle_id UUID NOT NULL,
  sequence_number INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  day_in_week INTEGER NOT NULL,
  group_id UUID NOT NULL,
  rfem INTEGER NOT NULL,
  scheduled_sets JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_max_records_user_id ON max_records(user_id);
CREATE INDEX IF NOT EXISTS idx_max_records_exercise_id ON max_records(exercise_id);
CREATE INDEX IF NOT EXISTS idx_completed_sets_user_id ON completed_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_sets_exercise_id ON completed_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_completed_sets_workout_id ON completed_sets(scheduled_workout_id);
CREATE INDEX IF NOT EXISTS idx_cycles_user_id ON cycles(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_user_id ON scheduled_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_cycle_id ON scheduled_workouts(cycle_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE max_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_workouts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - users can only access their own data
-- Exercises policies
CREATE POLICY "Users can view own exercises" ON exercises
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exercises" ON exercises
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exercises" ON exercises
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exercises" ON exercises
  FOR DELETE USING (auth.uid() = user_id);

-- Max records policies
CREATE POLICY "Users can view own max_records" ON max_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own max_records" ON max_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own max_records" ON max_records
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own max_records" ON max_records
  FOR DELETE USING (auth.uid() = user_id);

-- Completed sets policies
CREATE POLICY "Users can view own completed_sets" ON completed_sets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own completed_sets" ON completed_sets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own completed_sets" ON completed_sets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own completed_sets" ON completed_sets
  FOR DELETE USING (auth.uid() = user_id);

-- Cycles policies
CREATE POLICY "Users can view own cycles" ON cycles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cycles" ON cycles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cycles" ON cycles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cycles" ON cycles
  FOR DELETE USING (auth.uid() = user_id);

-- Scheduled workouts policies
CREATE POLICY "Users can view own scheduled_workouts" ON scheduled_workouts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scheduled_workouts" ON scheduled_workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scheduled_workouts" ON scheduled_workouts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scheduled_workouts" ON scheduled_workouts
  FOR DELETE USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT ALL ON exercises TO authenticated;
GRANT ALL ON max_records TO authenticated;
GRANT ALL ON completed_sets TO authenticated;
GRANT ALL ON cycles TO authenticated;
GRANT ALL ON scheduled_workouts TO authenticated;

-- Function to allow users to delete their own account completely
-- This uses SECURITY DEFINER to run with elevated privileges
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the current user's ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Delete user data from all tables (CASCADE should handle this, but be explicit)
  DELETE FROM completed_sets WHERE user_id = current_user_id;
  DELETE FROM scheduled_workouts WHERE user_id = current_user_id;
  DELETE FROM max_records WHERE user_id = current_user_id;
  DELETE FROM exercises WHERE user_id = current_user_id;
  DELETE FROM cycles WHERE user_id = current_user_id;
  
  -- Delete the user from auth.users (this requires SECURITY DEFINER)
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;
