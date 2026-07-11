-- Migration: Add updated_at columns to max_records and completed_sets
-- Purpose: Enable last-write-wins conflict resolution for these tables.
-- Without this column, the client merge is insert-only, so edits made on
-- one device never propagate to other devices.

-- Add the updated_at columns with default value
ALTER TABLE max_records
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE completed_sets
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill existing rows with a sensible updated_at value so pulled rows
-- always have a non-null timestamp for last-write-wins comparison.
UPDATE max_records
SET updated_at = COALESCE(recorded_at, NOW())
WHERE updated_at IS NULL;

UPDATE completed_sets
SET updated_at = COALESCE(completed_at, NOW())
WHERE updated_at IS NULL;

-- Note: deliberately NO BEFORE UPDATE trigger (unlike 013). The client is
-- authoritative for updated_at: a server trigger would overwrite the client
-- timestamp on every upsert, making conflict resolution depend on push
-- arrival order instead of actual edit time, and would cause every pull to
-- rewrite local rows (the remote timestamp would always be newer).
