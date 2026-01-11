-- Migration: Add app_mode column to user_preferences
-- Date: 2026-01-XX (update before running)
-- Version: 2.7.0
-- 
-- Purpose: Adds app mode preference (standard/advanced) to support
-- feature-gated UI and prepare for future subscription model.
--
-- IMPORTANT: Run this migration BEFORE deploying v2.7.0 of the app.
-- The app code will gracefully handle missing column (defaults to 'standard'),
-- but syncing will fail until this migration is applied.

-- =============================================================================
-- PRE-MIGRATION VERIFICATION
-- =============================================================================

-- Check current table structure (run this first to verify table exists)
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'user_preferences'
-- ORDER BY ordinal_position;

-- =============================================================================
-- ADD APP_MODE COLUMN
-- =============================================================================

-- Add the app_mode column with default 'standard'
-- Using IF NOT EXISTS for idempotency (safe to run multiple times)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_preferences' AND column_name = 'app_mode'
    ) THEN
        ALTER TABLE user_preferences 
        ADD COLUMN app_mode TEXT NOT NULL DEFAULT 'standard';
        
        RAISE NOTICE 'Column app_mode added successfully';
    ELSE
        RAISE NOTICE 'Column app_mode already exists, skipping';
    END IF;
END $$;

-- =============================================================================
-- ADD CHECK CONSTRAINT
-- =============================================================================

-- Add constraint to ensure only valid values
-- Using DO block for idempotency
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'valid_app_mode'
    ) THEN
        ALTER TABLE user_preferences 
        ADD CONSTRAINT valid_app_mode CHECK (app_mode IN ('standard', 'advanced'));
        
        RAISE NOTICE 'Constraint valid_app_mode added successfully';
    ELSE
        RAISE NOTICE 'Constraint valid_app_mode already exists, skipping';
    END IF;
END $$;

-- =============================================================================
-- DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN user_preferences.app_mode IS 
    'Application mode: standard (RFEM-only simplified UI) or advanced (all features). Syncs across devices.';

-- =============================================================================
-- POST-MIGRATION VERIFICATION
-- =============================================================================

-- Verify the column was added correctly
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_preferences' 
AND column_name = 'app_mode';

-- Verify the constraint exists
SELECT 
    constraint_name, 
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'valid_app_mode';

-- Check existing data (should all be 'standard')
SELECT 
    app_mode, 
    COUNT(*) as count
FROM user_preferences
GROUP BY app_mode;

-- =============================================================================
-- ROLLBACK SCRIPT (if needed)
-- =============================================================================

-- To rollback this migration, run:
--
-- ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS valid_app_mode;
-- ALTER TABLE user_preferences DROP COLUMN IF EXISTS app_mode;
--
-- WARNING: This will lose all app_mode preferences. Users will default
-- back to 'standard' mode when the column is re-added.

-- =============================================================================
-- NOTES
-- =============================================================================

-- 1. This migration is backward compatible:
--    - Existing rows get 'standard' as default
--    - Old app versions will ignore the new column
--    - New app versions handle missing column gracefully
--
-- 2. No indexes needed:
--    - app_mode is not queried directly
--    - Already have index on user_id which is the lookup key
--
-- 3. RLS policies:
--    - No changes needed - existing user_id policies cover new column
--
-- 4. Future considerations:
--    - May add 'premium' mode when subscription system is implemented
--    - Constraint can be altered to add new valid values
