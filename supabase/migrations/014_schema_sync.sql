-- Migration: Comprehensive Schema Sync
-- Date: 2026-01-26
-- Version: 2.24.29
--
-- This migration ensures all columns expected by the app exist in Supabase.
-- Uses IF NOT EXISTS to be idempotent (safe to run multiple times).
-- Run this in Supabase SQL Editor: Project → SQL Editor → New Query

-- ============================================
-- CYCLES TABLE
-- ============================================
ALTER TABLE cycles ADD COLUMN IF NOT EXISTS scheduling_mode TEXT;
ALTER TABLE cycles ADD COLUMN IF NOT EXISTS selected_days JSONB;
ALTER TABLE cycles ADD COLUMN IF NOT EXISTS progression_mode TEXT DEFAULT 'rfem';
ALTER TABLE cycles ADD COLUMN IF NOT EXISTS conditioning_weekly_time_increment INTEGER;
ALTER TABLE cycles ADD COLUMN IF NOT EXISTS include_warmup_sets BOOLEAN DEFAULT false;
ALTER TABLE cycles ADD COLUMN IF NOT EXISTS include_timed_warmups BOOLEAN DEFAULT false;

-- ============================================
-- SCHEDULED_WORKOUTS TABLE
-- ============================================
ALTER TABLE scheduled_workouts ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMPTZ;
ALTER TABLE scheduled_workouts ADD COLUMN IF NOT EXISTS skip_reason TEXT;
ALTER TABLE scheduled_workouts ADD COLUMN IF NOT EXISTS is_ad_hoc BOOLEAN DEFAULT false;
ALTER TABLE scheduled_workouts ADD COLUMN IF NOT EXISTS custom_name TEXT;
ALTER TABLE scheduled_workouts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- USER_PREFERENCES TABLE
-- ============================================
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS app_mode TEXT DEFAULT 'standard';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS timer_volume INTEGER DEFAULT 40;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS last_scheduling_mode TEXT;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS health_disclaimer_acknowledged_at TIMESTAMPTZ;

-- ============================================
-- EXERCISES TABLE
-- ============================================
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS measurement_type TEXT DEFAULT 'reps';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS default_conditioning_time INTEGER;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS weight_enabled BOOLEAN DEFAULT false;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS default_weight NUMERIC;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS last_cycle_settings JSONB;
