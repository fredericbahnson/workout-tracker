# Ascend Database Schema

## Overview

Ascend uses a dual-database architecture:

1. **IndexedDB (Local)**: Primary data store via Dexie.js - works offline
2. **PostgreSQL (Remote)**: Cloud storage via Supabase - enables sync across devices

Data flows: Local IndexedDB ↔ Sync Service ↔ Supabase PostgreSQL

## Local Database (Dexie/IndexedDB)

### Schema Version History

| Version | Changes |
|---------|---------|
| 1 | Initial schema: exercises, maxRecords, completedSets, cycles, scheduledWorkouts |
| 2 | Added syncQueue for offline operation support |
| 3 | Added userPreferences table, compound index on syncQueue |

### Tables

#### exercises
Stores exercise definitions.

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | string | ✓ (PK) | UUID |
| `name` | string | ✓ | Exercise name |
| `type` | ExerciseType | ✓ | Category: push, pull, legs, core, balance, mobility, other |
| `mode` | ExerciseMode | ✓ | standard or conditioning |
| `measurementType` | MeasurementType | | reps or time |
| `notes` | string | | User notes |
| `customParameters` | CustomParameter[] | | Exercise-specific tracking fields |
| `defaultConditioningReps` | number? | | Starting reps for conditioning |
| `defaultConditioningTime` | number? | | Starting time (seconds) for timed conditioning |
| `weightEnabled` | boolean? | | Whether weight tracking is enabled |
| `defaultWeight` | number? | | Default weight in lbs |
| `lastCycleSettings` | ExerciseCycleDefaults? | | Last-used cycle configuration |
| `createdAt` | Date | ✓ | Creation timestamp |
| `updatedAt` | Date | | Last modification |

#### maxRecords
Stores personal records (PRs) for exercises.

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | string | ✓ (PK) | UUID |
| `exerciseId` | string | ✓ | Foreign key to exercises |
| `maxReps` | number? | | Max reps achieved |
| `maxTime` | number? | | Max time in seconds |
| `weight` | number? | | Weight in lbs (undefined = bodyweight) |
| `notes` | string | | Notes about the record |
| `recordedAt` | Date | ✓ | When the record was set |

#### completedSets
Stores logged workout sets.

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | string | ✓ (PK) | UUID |
| `scheduledSetId` | string? | | Reference to scheduled set (null for ad-hoc) |
| `scheduledWorkoutId` | string? | ✓ | Reference to workout |
| `exerciseId` | string | ✓ | Foreign key to exercises |
| `targetReps` | number | | Target reps or time |
| `actualReps` | number | | Achieved reps or time |
| `weight` | number? | | Weight used in lbs |
| `completedAt` | Date | ✓ | Completion timestamp |
| `notes` | string | | Set notes |
| `parameters` | Record<string, string\|number> | | Custom parameter values |

#### cycles
Stores training cycle configurations.

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | string | ✓ (PK) | UUID |
| `name` | string | | Cycle name |
| `cycleType` | CycleType | | training or max_testing |
| `progressionMode` | ProgressionMode? | | rfem, simple, or mixed |
| `previousCycleId` | string? | | For max testing: reference cycle |
| `startDate` | Date | ✓ | Cycle start date |
| `numberOfWeeks` | number | | Duration in weeks |
| `workoutDaysPerWeek` | number | | Training days per week |
| `weeklySetGoals` | Record<ExerciseType, number> | | Target sets per type per week |
| `groups` | Group[] | | Exercise groups |
| `groupRotation` | string[] | | Order groups appear in workouts |
| `rfemRotation` | number[] | | RFEM values that rotate through workouts |
| `conditioningWeeklyRepIncrement` | number | | Weekly rep increase for conditioning |
| `conditioningWeeklyTimeIncrement` | number? | | Weekly time increase (seconds) |
| `includeWarmupSets` | boolean? | | Generate warmup sets |
| `includeTimedWarmups` | boolean? | | Include warmups for timed exercises |
| `status` | CycleStatus | ✓ | planning, active, or completed |
| `createdAt` | Date | | Creation timestamp |
| `updatedAt` | Date | | Last modification |

#### scheduledWorkouts
Stores generated workout plans.

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | string | ✓ (PK) | UUID |
| `cycleId` | string | ✓ | Foreign key to cycles |
| `sequenceNumber` | number | ✓ | Order within cycle (1, 2, 3...) |
| `weekNumber` | number | | Week within cycle (1-indexed) |
| `dayInWeek` | number | | Day within week (1-indexed) |
| `groupId` | string | | Which group this workout trains |
| `rfem` | number | | RFEM value for this workout |
| `scheduledSets` | ScheduledSet[] | | Sets to complete |
| `status` | WorkoutStatus | ✓ | pending, completed, partial, skipped |
| `completedAt` | Date? | | When completed |
| `isAdHoc` | boolean? | | True for user-created workouts |
| `customName` | string? | | User-defined name (ad-hoc only) |

#### userPreferences
Stores synced training preferences (one record per user).

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | string | ✓ (PK) | UUID |
| `appMode` | AppMode | | standard or advanced |
| `defaultMaxReps` | number | | Default max for new exercises |
| `defaultConditioningReps` | number | | Default conditioning start |
| `conditioningWeeklyIncrement` | number | | Default weekly increment |
| `weeklySetGoals` | WeeklySetGoals | | Default goals by type |
| `restTimer` | TimerSettings | | Rest timer configuration |
| `maxTestRestTimer` | TimerSettings | | Max test rest configuration |
| `createdAt` | Date | | Creation timestamp |
| `updatedAt` | Date | | Last modification |

#### syncQueue
Stores pending sync operations for offline support.

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | string | ✓ (PK) | UUID |
| `table` | SyncTable | ✓ | Target table name |
| `itemId` | string | ✓ | ID of item to sync |
| `operation` | 'upsert' \| 'delete' | | Operation type |
| `data` | unknown? | | Item data (for upsert) |
| `createdAt` | Date | ✓ | When queued |
| `retryCount` | number | | Failed attempt count |
| `nextRetryAt` | Date? | | Next retry time (exponential backoff) |

**Compound Index:** `[table+itemId]` - For efficient lookup/deduplication

---

## Remote Database (Supabase/PostgreSQL)

### Tables

All tables include Row Level Security (RLS) policies restricting access to the owning user.

#### exercises

```sql
CREATE TABLE exercises (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  mode TEXT NOT NULL,
  measurement_type TEXT DEFAULT 'reps',
  notes TEXT,
  custom_parameters JSONB DEFAULT '[]',
  default_conditioning_reps INTEGER,
  default_conditioning_time INTEGER,
  weight_enabled BOOLEAN DEFAULT false,
  default_weight NUMERIC,
  last_cycle_settings JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exercises_user_id ON exercises(user_id);
CREATE INDEX idx_exercises_updated_at ON exercises(updated_at);
```

#### max_records

```sql
CREATE TABLE max_records (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  max_reps INTEGER,
  max_time INTEGER,
  weight NUMERIC,
  notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_max_records_user_id ON max_records(user_id);
CREATE INDEX idx_max_records_exercise_id ON max_records(exercise_id);
CREATE INDEX idx_max_records_recorded_at ON max_records(recorded_at);
```

#### completed_sets

```sql
CREATE TABLE completed_sets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_set_id UUID,
  scheduled_workout_id UUID,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  target_reps INTEGER NOT NULL,
  actual_reps INTEGER NOT NULL,
  weight NUMERIC,
  completed_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  parameters JSONB DEFAULT '{}'
);

CREATE INDEX idx_completed_sets_user_id ON completed_sets(user_id);
CREATE INDEX idx_completed_sets_exercise_id ON completed_sets(exercise_id);
CREATE INDEX idx_completed_sets_completed_at ON completed_sets(completed_at);
```

#### cycles

```sql
CREATE TABLE cycles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cycle_type TEXT NOT NULL DEFAULT 'training',
  progression_mode TEXT DEFAULT 'rfem',
  previous_cycle_id UUID REFERENCES cycles(id),
  start_date DATE NOT NULL,
  number_of_weeks INTEGER NOT NULL,
  workout_days_per_week INTEGER NOT NULL,
  weekly_set_goals JSONB NOT NULL,
  groups JSONB NOT NULL,
  group_rotation JSONB NOT NULL,
  rfem_rotation JSONB NOT NULL,
  conditioning_weekly_rep_increment INTEGER NOT NULL DEFAULT 2,
  conditioning_weekly_time_increment INTEGER,
  include_warmup_sets BOOLEAN DEFAULT false,
  include_timed_warmups BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'planning',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cycles_user_id ON cycles(user_id);
CREATE INDEX idx_cycles_status ON cycles(status);
CREATE INDEX idx_cycles_updated_at ON cycles(updated_at);
```

#### scheduled_workouts

```sql
CREATE TABLE scheduled_workouts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  sequence_number NUMERIC NOT NULL,
  week_number INTEGER NOT NULL,
  day_in_week INTEGER NOT NULL,
  group_id TEXT NOT NULL,
  rfem INTEGER NOT NULL,
  scheduled_sets JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  is_ad_hoc BOOLEAN DEFAULT false,
  custom_name TEXT
);

CREATE INDEX idx_scheduled_workouts_user_id ON scheduled_workouts(user_id);
CREATE INDEX idx_scheduled_workouts_cycle_id ON scheduled_workouts(cycle_id);
CREATE INDEX idx_scheduled_workouts_status ON scheduled_workouts(status);
```

#### user_preferences

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  app_mode TEXT DEFAULT 'standard',
  default_max_reps INTEGER NOT NULL DEFAULT 10,
  default_conditioning_reps INTEGER NOT NULL DEFAULT 20,
  conditioning_weekly_increment INTEGER NOT NULL DEFAULT 2,
  weekly_set_goals JSONB NOT NULL,
  rest_timer_enabled BOOLEAN DEFAULT true,
  rest_timer_duration_seconds INTEGER DEFAULT 180,
  max_test_rest_timer_enabled BOOLEAN DEFAULT true,
  max_test_rest_timer_duration_seconds INTEGER DEFAULT 300,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

---

## Data Transformations

Data is transformed between local (camelCase, Date objects) and remote (snake_case, ISO strings) formats by functions in `src/services/sync/transformers.ts`.

### Example: Exercise

**Local (TypeScript/Dexie)**
```typescript
{
  id: "abc-123",
  exerciseId: "ex-456",
  measurementType: "reps",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z")
}
```

**Remote (PostgreSQL/Supabase)**
```json
{
  "id": "abc-123",
  "exercise_id": "ex-456",
  "measurement_type": "reps",
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-01-01T00:00:00.000Z"
}
```

---

## Sync Strategy

### Pull (Remote → Local)
1. Fetch records updated since last sync time
2. Transform snake_case → camelCase
3. Upsert into local IndexedDB
4. Handle deletions (soft delete marker or missing records)

### Push (Local → Sync Queue → Remote)
1. Changes queued in `syncQueue` table
2. Transform camelCase → snake_case
3. Upsert to Supabase
4. Remove from queue on success
5. Retry with exponential backoff on failure

### Conflict Resolution
- **Strategy**: Last-write-wins (remote takes precedence)
- **Timestamps**: `updated_at` determines recency
- **Deletions**: Propagate via sync service delete operations

---

## Row Level Security (RLS)

All Supabase tables use RLS policies:

```sql
-- Example for exercises table
CREATE POLICY "Users can only access own exercises"
  ON exercises FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercises"
  ON exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## Migrations

Located in `supabase/migrations/`:

| File | Description |
|------|-------------|
| `001_user_preferences.sql` | Creates user_preferences table |
| `002_app_mode.sql` | Adds app_mode column to user_preferences |

Run migrations via Supabase CLI:
```bash
supabase db push
```

---

## Type Definitions

All database types are defined in `src/types/`:

| File | Contains |
|------|----------|
| `exercise.ts` | Exercise, MaxRecord, ExerciseType, ExerciseMode |
| `cycle.ts` | Cycle, Group, ExerciseAssignment, CycleType |
| `workout.ts` | ScheduledWorkout, ScheduledSet, CompletedSet |
| `preferences.ts` | UserPreferences, WeeklySetGoals, TimerSettings |

Remote types are in `src/services/sync/types.ts`.
