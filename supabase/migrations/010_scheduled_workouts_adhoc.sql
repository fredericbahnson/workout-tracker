-- Add ad-hoc workout fields to scheduled_workouts
-- These fields track workouts created outside of the cycle schedule

ALTER TABLE scheduled_workouts
ADD COLUMN IF NOT EXISTS is_ad_hoc BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS custom_name TEXT;
