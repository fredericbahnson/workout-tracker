-- Migration: Add delete_user_account RPC function
-- Date: 2026-01-24
-- Version: 2.18.6
--
-- Purpose: Provides a secure way for users to delete their account and all associated data.
-- This function runs with SECURITY DEFINER to allow deletion from auth.users.

-- =============================================================================
-- CREATE DELETE USER ACCOUNT FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the current user's ID
    current_user_id := auth.uid();

    -- Verify user is authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Delete user data from all tables (order matters due to foreign keys)
    -- The ON DELETE CASCADE on user_preferences handles that table automatically

    -- Delete from completed_sets (user's workout history)
    DELETE FROM completed_sets WHERE user_id = current_user_id;

    -- Delete from scheduled_workouts
    DELETE FROM scheduled_workouts WHERE user_id = current_user_id;

    -- Delete from cycles
    DELETE FROM cycles WHERE user_id = current_user_id;

    -- Delete from exercises
    DELETE FROM exercises WHERE user_id = current_user_id;

    -- Delete from max_records
    DELETE FROM max_records WHERE user_id = current_user_id;

    -- Delete from user_preferences (should cascade, but explicit is safer)
    DELETE FROM user_preferences WHERE user_id = current_user_id;

    -- Delete the user from auth.users
    -- This requires SECURITY DEFINER since normal users can't delete from auth schema
    DELETE FROM auth.users WHERE id = current_user_id;

END;
$$;

-- =============================================================================
-- GRANT EXECUTE PERMISSION
-- =============================================================================

-- Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;

-- =============================================================================
-- DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION delete_user_account() IS
    'Permanently deletes the current user account and all associated data. This action cannot be undone.';

-- =============================================================================
-- NOTES
-- =============================================================================

-- 1. SECURITY DEFINER is required to delete from auth.users
-- 2. The function only deletes the authenticated user's own data (auth.uid())
-- 3. Tables are deleted in order to respect foreign key constraints
-- 4. If any tables don't exist yet, those DELETE statements will simply do nothing
