-- Migration: Add health disclaimer acknowledgment tracking
-- This field stores when the user acknowledged the health disclaimer.
-- It is required to use the app. Deleted when the user deletes their account.

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS health_disclaimer_acknowledged_at TIMESTAMPTZ DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN user_preferences.health_disclaimer_acknowledged_at IS
  'Timestamp when user acknowledged health disclaimer. Required to use app. Deleted with account.';
