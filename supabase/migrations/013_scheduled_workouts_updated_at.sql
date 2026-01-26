-- Migration: Add updated_at column to scheduled_workouts table
-- Purpose: Enable last-write-wins conflict resolution for workout status changes

-- Add the updated_at column with default value
ALTER TABLE scheduled_workouts
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing rows to have a sensible updated_at value
-- Use completed_at if available, otherwise use current timestamp
UPDATE scheduled_workouts
SET updated_at = COALESCE(completed_at, NOW())
WHERE updated_at IS NULL;

-- Create a trigger function to automatically update the timestamp on changes
CREATE OR REPLACE FUNCTION update_scheduled_workout_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger (drop first if it exists to allow re-running)
DROP TRIGGER IF EXISTS scheduled_workout_updated_at ON scheduled_workouts;

CREATE TRIGGER scheduled_workout_updated_at
  BEFORE UPDATE ON scheduled_workouts
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_workout_timestamp();
