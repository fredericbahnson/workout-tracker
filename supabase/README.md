# Supabase Migrations

This directory contains all database migrations for the Ascend application.

## Migration Order

Migrations must be run in numerical order:

| Migration | Description | Added In |
|-----------|-------------|----------|
| 001_initial_schema.sql | Base tables and RLS policies | v1.0.0 |
| 002_delete_account.sql | Account deletion function | v1.0.0 |
| 003_cycle_type.sql | Cycle type column (training/max_testing) | v2.0.0 |
| 004_time_based.sql | Time-based exercise support | v2.1.0 |
| 005_mixed_mode.sql | Mixed progression mode fields | v2.4.0 |
| 006_warmup_sets.sql | Warmup sets configuration | v2.5.0 |

## New Installation

For a fresh Supabase project, run all migrations in order:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor → New Query
3. Copy and paste each migration file in order (001 → 006)
4. Execute each one

## Upgrading Existing Installation

Check which migrations have already been applied, then run only the new ones.

### Checking Current State

You can check if a column exists before running a migration:

```sql
-- Check if exercises table has measurement_type column (added in 004)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'exercises' AND column_name = 'measurement_type';

-- Check if cycles table has progression_mode column (added in 005)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'cycles' AND column_name = 'progression_mode';

-- Check if cycles table has include_warmup_sets column (added in 006)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'cycles' AND column_name = 'include_warmup_sets';
```

### Version Upgrade Paths

**From v1.x to v2.5.0:** Run migrations 003 → 006

**From v2.0.x to v2.5.0:** Run migrations 004 → 006

**From v2.1.x-2.3.x to v2.5.0:** Run migrations 005 → 006

**From v2.4.x to v2.5.0:** Run migration 006 only

## Migration Details

### 001 - Initial Schema
Creates all base tables:
- `exercises` - Exercise definitions
- `max_records` - Personal record tracking
- `completed_sets` - Workout history
- `cycles` - Training cycle configuration
- `scheduled_workouts` - Generated workout schedule

Also sets up Row Level Security (RLS) policies.

### 002 - Delete Account
Adds `delete_user_account()` function for proper account deletion with cascading data removal.

### 003 - Cycle Type
Adds `cycle_type` column to cycles table to distinguish between training and max testing cycles.

### 004 - Time Based
Adds support for time-based exercises:
- `measurement_type` column on exercises
- `default_conditioning_time` on exercises
- `max_time` on max_records
- `conditioning_weekly_time_increment` on cycles

### 005 - Mixed Mode
Adds mixed progression mode support:
- `progression_mode` column on cycles
- `last_cycle_settings` JSONB on exercises

### 006 - Warmup Sets
Adds warmup set configuration:
- `include_warmup_sets` on cycles
- `include_timed_warmups` on cycles

## Rollback

Migrations are designed to be idempotent (safe to run multiple times) using `IF NOT EXISTS` and `IF EXISTS` clauses. However, there are no automated rollback scripts. If you need to rollback, you'll need to manually remove the added columns/tables.

## Best Practices

1. **Always backup before migrating** - Export your data from Supabase dashboard
2. **Test in a staging environment first** - Create a separate Supabase project for testing
3. **Run migrations during low-traffic periods** - Avoid peak usage times
4. **Verify after migration** - Check that the app still functions correctly
