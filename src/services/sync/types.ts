/**
 * Sync Remote Types
 * 
 * Type definitions for data structures stored in Supabase.
 * These mirror the database schema with snake_case naming.
 * 
 * ## Generating Types from Supabase
 * 
 * These types can be auto-generated using the Supabase CLI:
 * 
 * ```bash
 * # Option 1: Using project ID (requires access token)
 * npx supabase gen types typescript --project-id rlnkzatitmkivekjxvzi > src/types/supabase.ts
 * 
 * # Option 2: Using local linked project
 * npx supabase link --project-ref rlnkzatitmkivekjxvzi
 * npx supabase gen types typescript --local > src/types/supabase.ts
 * 
 * # Option 3: Using Supabase Dashboard
 * # Go to: Project Settings > API > Generate types
 * ```
 * 
 * ## Current Status
 * 
 * Types are manually maintained to match the database schema.
 * When the schema changes (new migration), update these types accordingly:
 * 
 * 1. Add/modify the interface to match new columns
 * 2. Update the corresponding transformer in transformers.ts
 * 3. Run tests to verify sync still works
 * 
 * ## Schema Reference
 * 
 * See `supabase/migrations/` for the authoritative schema definitions.
 */

/**
 * Remote exercise record from Supabase.
 * Corresponds to the `exercises` table.
 */
export interface RemoteExercise {
  id: string;
  user_id: string;
  name: string;
  type: string;
  mode: string;
  measurement_type: string | null;
  notes: string;
  custom_parameters: unknown;
  default_conditioning_reps: number | null;
  default_conditioning_time: number | null;
  weight_enabled: boolean;
  default_weight: number | null;
  last_cycle_settings: unknown | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Remote max record from Supabase.
 * Corresponds to the `max_records` table.
 */
export interface RemoteMaxRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  max_reps: number | null;
  max_time: number | null;
  weight: number | null;
  notes: string;
  recorded_at: string;
  deleted_at: string | null;
}

/**
 * Remote completed set record from Supabase.
 * Corresponds to the `completed_sets` table.
 */
export interface RemoteCompletedSet {
  id: string;
  user_id: string;
  scheduled_set_id: string | null;
  scheduled_workout_id: string | null;
  exercise_id: string;
  target_reps: number;
  actual_reps: number;
  weight: number | null;
  completed_at: string;
  notes: string;
  parameters: unknown;
  deleted_at: string | null;
}

/**
 * Remote cycle record from Supabase.
 * Corresponds to the `cycles` table.
 */
export interface RemoteCycle {
  id: string;
  user_id: string;
  name: string;
  cycle_type: string;
  progression_mode: string | null;
  previous_cycle_id: string | null;
  start_date: string;
  number_of_weeks: number;
  workout_days_per_week: number;
  weekly_set_goals: unknown;
  groups: unknown;
  group_rotation: unknown;
  rfem_rotation: unknown;
  conditioning_weekly_rep_increment: number;
  conditioning_weekly_time_increment: number | null;
  include_warmup_sets: boolean | null;
  include_timed_warmups: boolean | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Remote scheduled workout record from Supabase.
 * Corresponds to the `scheduled_workouts` table.
 */
export interface RemoteScheduledWorkout {
  id: string;
  user_id: string;
  cycle_id: string;
  sequence_number: number;
  week_number: number;
  day_in_week: number;
  group_id: string;
  rfem: number;
  scheduled_sets: unknown;
  status: string;
  completed_at: string | null;
  deleted_at: string | null;
}

/**
 * Remote user preferences record from Supabase.
 * Corresponds to the `user_preferences` table.
 */
export interface RemoteUserPreferences {
  id: string;
  user_id: string;
  app_mode: string;
  default_max_reps: number;
  default_conditioning_reps: number;
  conditioning_weekly_increment: number;
  weekly_set_goals: unknown;
  rest_timer_enabled: boolean;
  rest_timer_duration_seconds: number;
  max_test_rest_timer_enabled: boolean;
  max_test_rest_timer_duration_seconds: number;
  created_at: string;
  updated_at: string;
}

/**
 * Table names in the Supabase database.
 */
export type SyncTableName = 
  | 'exercises' 
  | 'max_records' 
  | 'completed_sets' 
  | 'cycles' 
  | 'scheduled_workouts'
  | 'user_preferences';

/**
 * Union type of all remote record types.
 */
export type RemoteRecord = 
  | RemoteExercise 
  | RemoteMaxRecord 
  | RemoteCompletedSet 
  | RemoteCycle 
  | RemoteScheduledWorkout
  | RemoteUserPreferences;
