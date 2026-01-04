-- Migration: Add support for time-based exercises
-- Run this in the Supabase SQL Editor

-- Add measurement_type column to exercises (reps or time)
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS measurement_type TEXT DEFAULT 'reps';

-- Add default_conditioning_time for time-based conditioning exercises
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS default_conditioning_time INTEGER;

-- Add max_time column to max_records for time-based exercises
ALTER TABLE max_records 
ADD COLUMN IF NOT EXISTS max_time INTEGER;

-- Make max_reps nullable (since time-based exercises won't have it)
ALTER TABLE max_records 
ALTER COLUMN max_reps DROP NOT NULL;

-- Add conditioningWeeklyTimeIncrement to cycles (for time-based conditioning)
ALTER TABLE cycles 
ADD COLUMN IF NOT EXISTS conditioning_weekly_time_increment INTEGER DEFAULT 5;

-- Update RLS policies if needed (the existing policies should still work)

-- Optional: Add a check constraint to ensure at least one of max_reps or max_time is set
-- ALTER TABLE max_records ADD CONSTRAINT check_max_value 
-- CHECK (max_reps IS NOT NULL OR max_time IS NOT NULL);
