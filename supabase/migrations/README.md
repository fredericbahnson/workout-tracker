# Supabase Migrations

Database migrations for the Ascend workout tracker.

## Naming Convention

Migrations are numbered sequentially: `NNN_description.sql`

## Migration Order

| # | File | Description | App Version |
|---|------|-------------|-------------|
| 001 | `001_user_preferences.sql` | Create user_preferences table for synced training preferences | v2.6.0 |
| 002 | `002_app_mode.sql` | Add app_mode column for standard/advanced feature gating | v2.7.0 |
| 003 | `003_timer_volume.sql` | Add timer_volume column for audio volume control | v2.13.0 |
| 004 | `004_delete_user_account.sql` | Add RPC function to delete user account and all data | v2.18.6 |
| 005 | `005_exercises_table.sql` | Document exercises table schema | v2.22.0 |
| 006 | `006_max_records_table.sql` | Document max_records table schema | v2.22.0 |
| 007 | `007_completed_sets_table.sql` | Document completed_sets table schema | v2.22.0 |
| 008 | `008_cycles_table.sql` | Document cycles table schema | v2.22.0 |
| 009 | `009_scheduled_workouts_table.sql` | Document scheduled_workouts table schema | v2.22.0 |
| 010 | `010_scheduled_workouts_adhoc.sql` | Add ad-hoc workout fields | v2.22.0 |
| 011 | `011_user_preferences_scheduling_mode.sql` | Add last_scheduling_mode preference | v2.22.0 |
| 012 | `012_health_disclaimer.sql` | Add health disclaimer acknowledgment tracking | v2.24.0 |
| 013 | `013_scheduled_workouts_updated_at.sql` | Add updated_at for conflict resolution | v2.24.0 |
| 014 | `014_schema_sync.sql` | Comprehensive schema sync (idempotent) | v2.24.29 |
| 015 | `015_user_entitlements.sql` | User entitlements table for offline purchase verification | v2.25.0 |
| 016 | `016_analytics_views.sql` | Admin analytics views for usage metrics | v2.25.x |
| 017 | `017_max_records_completed_sets_updated_at.sql` | Add updated_at to max_records/completed_sets for last-write-wins sync | unreleased (post-2.25.30) |

## Running Migrations

Migrations should be run in order via the Supabase dashboard SQL editor or CLI:

```bash
# Using Supabase CLI
supabase db push

# Or manually in SQL editor
# Copy and paste each migration file in order
```

## Important Notes

- Always backup your database before running migrations
- Run migrations BEFORE deploying the corresponding app version
- Test migrations in a development environment first
- **Client-authoritative timestamps**: sync conflict resolution is
  last-write-wins on client-written `updated_at`. Do NOT add server-side
  `BEFORE UPDATE` triggers that overwrite `updated_at` (they make conflicts
  resolve by push-arrival order and cause every pull to rewrite local rows).
  Migration 013's trigger on scheduled_workouts predates this decision;
  017 deliberately omits one.
