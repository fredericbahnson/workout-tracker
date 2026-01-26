-- Add last_scheduling_mode to user_preferences
-- Tracks the user's preferred scheduling mode (date vs sequence) for cycle creation

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS last_scheduling_mode TEXT;
