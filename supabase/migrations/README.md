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
