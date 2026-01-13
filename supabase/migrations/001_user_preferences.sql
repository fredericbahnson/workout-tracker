-- Migration: Add user_preferences table for synced training preferences
-- Date: 2026-01-11
-- Version: 2.6.0

-- =============================================================================
-- CREATE USER_PREFERENCES TABLE
-- =============================================================================

-- Create the user_preferences table (one row per user)
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Default values for cycle creation
    default_max_reps INTEGER NOT NULL DEFAULT 10,
    default_conditioning_reps INTEGER NOT NULL DEFAULT 30,
    conditioning_weekly_increment INTEGER NOT NULL DEFAULT 10,
    
    -- Weekly set goals per exercise type (JSONB for flexibility)
    weekly_set_goals JSONB NOT NULL DEFAULT '{
        "push": 10,
        "pull": 10,
        "legs": 10,
        "core": 0,
        "balance": 0,
        "mobility": 0,
        "other": 0
    }'::jsonb,
    
    -- Rest timer settings
    rest_timer_enabled BOOLEAN NOT NULL DEFAULT false,
    rest_timer_duration_seconds INTEGER NOT NULL DEFAULT 180,
    
    -- Max testing rest timer settings
    max_test_rest_timer_enabled BOOLEAN NOT NULL DEFAULT false,
    max_test_rest_timer_duration_seconds INTEGER NOT NULL DEFAULT 300,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure one preferences record per user
    CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own preferences (for account deletion)
CREATE POLICY "Users can delete own preferences" ON user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Index for fast lookup by user_id
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE user_preferences IS 'User training preferences that sync across devices';
COMMENT ON COLUMN user_preferences.default_max_reps IS 'Default max reps for RFEM calculations when no max record exists';
COMMENT ON COLUMN user_preferences.default_conditioning_reps IS 'Default starting reps for conditioning exercises';
COMMENT ON COLUMN user_preferences.conditioning_weekly_increment IS 'Weekly rep increase for conditioning exercises';
COMMENT ON COLUMN user_preferences.weekly_set_goals IS 'Target weekly sets per exercise type (push, pull, legs, etc.)';
COMMENT ON COLUMN user_preferences.rest_timer_enabled IS 'Whether to show rest timer after completing sets';
COMMENT ON COLUMN user_preferences.rest_timer_duration_seconds IS 'Default rest timer duration in seconds';
COMMENT ON COLUMN user_preferences.max_test_rest_timer_enabled IS 'Whether to show rest timer during max testing';
COMMENT ON COLUMN user_preferences.max_test_rest_timer_duration_seconds IS 'Default max test rest timer duration in seconds';
