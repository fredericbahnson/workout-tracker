-- Migration: Add delete_user_account function
-- Run this in Supabase SQL Editor if you already have the schema set up

-- Function to allow users to delete their own account completely
-- This uses SECURITY DEFINER to run with elevated privileges
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
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Delete user data from all tables (CASCADE should handle this, but be explicit)
  DELETE FROM completed_sets WHERE user_id = current_user_id;
  DELETE FROM scheduled_workouts WHERE user_id = current_user_id;
  DELETE FROM max_records WHERE user_id = current_user_id;
  DELETE FROM exercises WHERE user_id = current_user_id;
  DELETE FROM cycles WHERE user_id = current_user_id;
  
  -- Delete the user from auth.users (this requires SECURITY DEFINER)
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;
