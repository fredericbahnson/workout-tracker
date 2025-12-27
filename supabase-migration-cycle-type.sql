-- Migration: Add cycle_type and previous_cycle_id columns to cycles table
-- Run this in Supabase SQL Editor if you already have the schema set up

-- Add cycle_type column with default 'training'
ALTER TABLE cycles 
ADD COLUMN IF NOT EXISTS cycle_type TEXT DEFAULT 'training';

-- Add previous_cycle_id column for linking max testing cycles to completed training cycles
ALTER TABLE cycles 
ADD COLUMN IF NOT EXISTS previous_cycle_id UUID;
