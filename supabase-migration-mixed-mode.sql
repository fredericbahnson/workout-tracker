-- Migration: Add support for Mixed Cycle Mode (v2.4.0)
-- Run this in the Supabase SQL Editor

-- Add progression_mode column to cycles ('rfem', 'simple', or 'mixed')
ALTER TABLE cycles 
ADD COLUMN IF NOT EXISTS progression_mode TEXT DEFAULT 'rfem';

-- Add last_cycle_settings to exercises for smart defaults
-- Stores: progressionMode, conditioningRepIncrement, conditioningTimeIncrement,
--         simpleBaseReps, simpleBaseTime, simpleBaseWeight,
--         simpleRepProgressionType, simpleRepIncrement,
--         simpleTimeProgressionType, simpleTimeIncrement,
--         simpleWeightProgressionType, simpleWeightIncrement
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS last_cycle_settings JSONB;

-- Note: The following fields are stored in JSONB columns and don't need schema changes:
-- - ExerciseAssignment.progressionMode (stored in cycles.groups JSONB)
-- - ExerciseAssignment.conditioningRepIncrement (stored in cycles.groups JSONB)
-- - ExerciseAssignment.conditioningTimeIncrement (stored in cycles.groups JSONB)
-- - ScheduledSet.progressionMode (stored in scheduled_workouts.scheduled_sets JSONB)
-- - ScheduledSet.conditioningRepIncrement (stored in scheduled_workouts.scheduled_sets JSONB)
-- - ScheduledSet.conditioningTimeIncrement (stored in scheduled_workouts.scheduled_sets JSONB)
