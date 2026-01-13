-- Migration: Add timer_volume to user_preferences
-- Purpose: Allow users to control the volume of timer countdown beeps and completion sounds
-- Date: 2026-01-13

-- Add timer_volume column with default value of 40 (matches previous hardcoded value)
-- Range: 0-100 where 0 = muted, 100 = maximum volume
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS timer_volume INTEGER DEFAULT 40;

-- Add check constraint to ensure volume is in valid range
ALTER TABLE user_preferences 
ADD CONSTRAINT timer_volume_range CHECK (timer_volume >= 0 AND timer_volume <= 100);

-- Update existing rows to have the default value (if null)
UPDATE user_preferences 
SET timer_volume = 40 
WHERE timer_volume IS NULL;
