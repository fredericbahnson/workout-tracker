-- Migration: Add warmup set preferences (v2.5.0)
-- Run this in the Supabase SQL Editor

-- Add warmup preferences to cycles
ALTER TABLE cycles 
ADD COLUMN IF NOT EXISTS include_warmup_sets BOOLEAN DEFAULT FALSE;

ALTER TABLE cycles 
ADD COLUMN IF NOT EXISTS include_timed_warmups BOOLEAN DEFAULT FALSE;

-- Note: The following fields are stored in JSONB columns and don't need schema changes:
-- - ExerciseAssignment.includeWarmup (stored in cycles.groups JSONB)
-- - ScheduledSet.isWarmup (stored in scheduled_workouts.scheduled_sets JSONB)
-- - ScheduledSet.warmupPercentage (stored in scheduled_workouts.scheduled_sets JSONB)
