-- Migration: Add missing columns to user_exercise_state for progression algorithm
-- Run this in Supabase SQL Editor

-- 1. Add missing columns
ALTER TABLE user_exercise_state
  ADD COLUMN IF NOT EXISTS sessions_at_current_weight integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS deload_step integer NOT NULL DEFAULT 0;

-- 2. Backfill existing rows with sensible defaults
UPDATE user_exercise_state
SET sessions_at_current_weight = 1,
    deload_step = 0
WHERE sessions_at_current_weight IS NULL OR deload_step IS NULL;

-- 3. Verify
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_exercise_state'
ORDER BY ordinal_position;