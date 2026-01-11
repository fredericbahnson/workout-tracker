# Ascend v2.5.0 Code Review Report

**Reviewer:** Senior Full-Stack Developer  
**Date:** January 2026  
**Previous Review:** v1.1.5 (see CODE_REVIEW.md)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Progress Since v1.1.5](#progress-since-v115)
3. [Critical Issues](#-critical-issues)
4. [High Priority Issues](#-high-priority-issues)
5. [Medium Priority Issues](#-medium-priority-issues)
6. [Low Priority Issues](#-low-priority-issues)
7. [Documentation Gaps](#documentation-gaps)
8. [Files Requiring Attention](#files-requiring-attention)
9. [Phased Implementation Plan](#phased-implementation-plan)
10. [Conclusion](#conclusion)

---

## Executive Summary

Since v1.1.5, significant improvements have been made: Error boundaries added, test coverage established (154 tests), path aliases implemented throughout, date utilities consolidated, and swipe gesture constants extracted. However, rapid feature development (Mixed Mode, Warmup Sets, Time-Based exercises) has introduced new technical debt. The codebase remains functional but several files have grown beyond maintainable sizes.

**Severity Legend:**
- 🔴 **Critical** — Address before new features
- 🟠 **High** — Address in next sprint  
- 🟡 **Medium** — Address when working in affected areas
- ⚪ **Low** — Nice to have / cleanup

---

## Progress Since v1.1.5

| Issue from v1.1.5 | Status | Notes |
|-------------------|--------|-------|
| No Error Boundaries | ✅ Fixed | ErrorBoundary.tsx with app/page levels |
| No Tests | ✅ Fixed | 154 tests (scheduler, sync, dateUtils) |
| Path Aliases Not Used | ✅ Fixed | `@/` aliases used throughout |
| Magic Numbers in Swipe | ✅ Fixed | Extracted to `constants/ui.ts` |
| Date Handling Inconsistencies | ✅ Fixed | Consolidated in `utils/dateUtils.ts` |
| Today.tsx Size (1,597 lines) | ⚠️ Improved | Now 807 lines, hooks extracted |
| CycleWizard.tsx Size (1,290 lines) | ❌ Worse | Now 2,456 lines |
| syncService.ts Retry Logic | ⚠️ Partial | Still needs exponential backoff |

---

## 🔴 Critical Issues

### 1. CycleWizard.tsx is Now 2,456 Lines

This file has nearly doubled since v1.1.5 due to Mixed Mode and Warmup Sets features.

| Component | Lines | Purpose |
|-----------|-------|---------|
| CycleWizard (main) | ~750 | State management, orchestration |
| StartStep | ~100 | Initial step |
| BasicsStep | ~60 | Basic cycle settings |
| GroupsStep | ~220 | Exercise group management |
| MixedExerciseConfig | ~210 | Per-exercise config for mixed mode |
| SimpleProgressionFields | ~155 | Rep/weight/time progression inputs |
| GoalsStep | ~230 | Weekly goals + warmup settings |
| ProgressionStep | ~70 | Simple mode targets |
| ExerciseProgressionEditor | ~230 | Per-exercise progression editing |
| ReviewStep | ~350 | Final review before creation |

**Recommendation:** Extract into separate files:

```
src/components/cycles/
├── CycleWizard.tsx              (~300 lines - orchestrator only)
├── hooks/
│   ├── useCycleWizardState.ts   (all 30+ useState calls)
│   └── useCycleCloning.ts       (clone logic)
├── steps/
│   ├── StartStep.tsx
│   ├── BasicsStep.tsx
│   ├── GroupsStep.tsx
│   ├── GoalsStep.tsx
│   ├── ProgressionStep.tsx
│   └── ReviewStep.tsx
├── components/
│   ├── MixedExerciseConfig.tsx
│   ├── SimpleProgressionFields.tsx
│   └── ExerciseProgressionEditor.tsx
└── index.ts
```

**Impact:** Every new feature touching the cycle wizard requires holding 2,400+ lines in mental context.

---

### 2. Today.tsx State Management (807 lines, 25+ useState)

While some extraction occurred (hooks created), the main component still manages too much state:

```tsx
// Current state sprawl (partial):
const [showExercisePicker, setShowExercisePicker] = useState(false);
const [showCycleWizard, setShowCycleWizard] = useState(false);
const [showCycleTypeSelector, setShowCycleTypeSelector] = useState(false);
const [wizardProgressionMode, setWizardProgressionMode] = useState<ProgressionMode>('rfem');
const [showSkipConfirm, setShowSkipConfirm] = useState(false);
const [showEndConfirm, setShowEndConfirm] = useState(false);
const [showRestTimer, setShowRestTimer] = useState(false);
const [restTimerDuration, setRestTimerDuration] = useState(restTimer.defaultDurationSeconds);
const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
const [selectedScheduledSet, setSelectedScheduledSet] = useState<{...} | null>(null);
const [isLogging, setIsLogging] = useState(false);
const [setToSkip, setSetToSkip] = useState<{...} | null>(null);
const [editingCompletedSet, setEditingCompletedSet] = useState<{...} | null>(null);
// ... continues
```

**Recommendation:** Create a `useModalManager` hook or use `useReducer`:

```tsx
// Proposed: src/hooks/useTodayModals.ts
interface ModalState {
  exercisePicker: boolean;
  cycleWizard: boolean;
  cycleTypeSelector: boolean;
  skipConfirm: boolean;
  endConfirm: boolean;
  restTimer: boolean;
  // ...
}

type ModalAction = 
  | { type: 'OPEN'; modal: keyof ModalState }
  | { type: 'CLOSE'; modal: keyof ModalState }
  | { type: 'CLOSE_ALL' };

export function useTodayModals() {
  const [state, dispatch] = useReducer(modalReducer, initialState);
  // ...
}
```

---

### 3. Schedule.tsx is 1,026 Lines

This page handles both viewing and editing scheduled workouts with complex grouping logic.

**Recommendation:** Extract:
- `useScheduleData.ts` - data fetching and grouping logic
- `ScheduleCalendar.tsx` - calendar view component
- `WorkoutCard.tsx` - individual workout display
- `ScheduleFilters.tsx` - filtering controls

---

## 🟠 High Priority Issues

### 4. Duplicate Type Definitions in syncService.ts

Remote interfaces duplicate local type structure with snake_case naming:

```tsx
// syncService.ts lines 7-90 - manually maintained interfaces
interface RemoteExercise {
  id: string;
  user_id: string;
  name: string;
  type: string;
  mode: string;
  measurement_type: string | null;
  // ... 15+ more fields
}

interface RemoteCycle {
  id: string;
  user_id: string;
  // ... 20+ fields
}
// Similar for RemoteMaxRecord, RemoteCompletedSet, RemoteScheduledWorkout
```

**Problem:** Every new field must be added to:
1. `src/types/index.ts` (local type)
2. Remote interface in syncService.ts
3. `remoteToLocal*` conversion function
4. `localToRemote*` conversion function
5. Supabase migration SQL

**Recommendation:** Generate types from Supabase schema:

```bash
npx supabase gen types typescript --project-id rlnkzatitmkivekjxvzi > src/types/supabase.ts
```

Then create a single transformation layer:

```tsx
// src/services/sync/transformers.ts
import type { Database } from '@/types/supabase';

type RemoteCycle = Database['public']['Tables']['cycles']['Row'];

export function remoteToLocalCycle(remote: RemoteCycle): Cycle {
  return {
    id: remote.id,
    name: remote.name,
    // ... transformation
  };
}
```

---

### 5. Missing Test Coverage for New Features

Current tests (154 passing) cover scheduler.ts well, but gaps exist:

| Area | Current Coverage | Needed |
|------|-----------------|--------|
| scheduler.ts | ✅ Good (76 tests) | — |
| syncService.ts | ✅ Good (66 tests) | — |
| dateUtils.ts | ✅ Good (12 tests) | — |
| Repositories | ❌ None | Basic CRUD tests |
| CycleWizard | ❌ None | Form validation, state transitions |
| Today.tsx handlers | ❌ None | Set completion, skip logic |
| Warmup calculations | ⚠️ Partial | Edge cases for Simple mode weight progression |

**Recommendation:** Add repository tests:

```tsx
// src/data/repositories/ExerciseRepo.test.ts
describe('ExerciseRepo', () => {
  beforeEach(async () => {
    await db.exercises.clear();
  });

  it('creates exercise with correct timestamps', async () => {
    const exercise = await ExerciseRepo.create({...});
    expect(exercise.createdAt).toBeInstanceOf(Date);
    expect(exercise.updatedAt).toEqual(exercise.createdAt);
  });

  it('updates exercise and modifies updatedAt only', async () => {
    // ...
  });
});
```

---

### 6. Inconsistent Error Handling Patterns

55 console statements found across the codebase with varying patterns:

```tsx
// syncService.ts - logs full error objects
console.error('Error syncing exercises:', error);

// AuthContext.tsx - logs just message
console.log('getSession error (may be offline):', error.message);

// scheduler.ts - uses console.warn
console.warn(`Group ${groupId} not found in cycle`);

// Today.tsx - catches but ignores
try { ... } catch { /* silent */ }
```

**Recommendation:** Create centralized logger:

```tsx
// src/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0, info: 1, warn: 2, error: 3
};

const currentLevel = import.meta.env.PROD ? 'warn' : 'debug';

export const logger = {
  debug: (context: string, ...args: unknown[]) => {
    if (LOG_LEVELS.debug >= LOG_LEVELS[currentLevel]) {
      console.log(`[${context}]`, ...args);
    }
  },
  info: (context: string, ...args: unknown[]) => { /* ... */ },
  warn: (context: string, ...args: unknown[]) => {
    console.warn(`[${context}]`, ...args);
  },
  error: (context: string, error: unknown, metadata?: object) => {
    console.error(`[${context}]`, error, metadata);
    // Future: Send to error tracking service
  }
};
```

---

### 7. Types File is 371 Lines with Mixed Concerns

`src/types/index.ts` contains:
- Type definitions (appropriate)
- Constants like `EXERCISE_TYPES`, `EXERCISE_TYPE_LABELS` (should be in constants)
- Helper functions like `formatTime`, `parseTimeInput`, `formatDuration` (should be in utils)
- Business logic functions like `getProgressionMode`, `getExerciseProgressionMode` (should be in services or utils)

**Recommendation:** Split into focused modules:

```
src/types/
├── index.ts           (re-exports)
├── exercise.ts        (Exercise, ExerciseType, etc.)
├── cycle.ts           (Cycle, Group, ExerciseAssignment)
├── workout.ts         (ScheduledWorkout, ScheduledSet, CompletedSet)
├── forms.ts           (ExerciseFormData, QuickLogData)
└── constants.ts       (EXERCISE_TYPES, labels, etc.)

src/utils/
├── time.ts            (formatTime, parseTimeInput, formatDuration)
└── progression.ts     (getProgressionMode, getExerciseProgressionMode, etc.)
```

---

## 🟡 Medium Priority Issues

### 8. Repeated Tailwind Class Patterns

Found 153 instances of `text-gray-500 dark:text-gray-400` pattern across components.

**Recommendation:** Create semantic class utilities:

```tsx
// src/styles/classes.ts
export const textStyles = {
  muted: 'text-gray-500 dark:text-gray-400',
  mutedSmall: 'text-xs text-gray-500 dark:text-gray-400',
  label: 'text-sm font-medium text-gray-700 dark:text-gray-300',
  heading: 'text-lg font-semibold text-gray-900 dark:text-gray-100',
} as const;

// Usage
<span className={textStyles.muted}>Secondary text</span>
```

Or extend Tailwind config:

```js
// tailwind.config.js
theme: {
  extend: {
    textColor: {
      muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
    }
  }
}
```

---

### 9. NumberInput Component Has Duplicate Input Rendering

`src/components/ui/Input.tsx` lines 60-165 - the NumberInput component renders nearly identical input elements for with-label and without-label cases.

**Recommendation:** Extract shared input element:

```tsx
export function NumberInput({ label, ...props }: NumberInputProps) {
  const inputElement = (
    <input
      id={label ? inputId : undefined}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={cn(inputBaseStyles, !label && className)}
      {...props}
    />
  );

  if (!label) return inputElement;

  return (
    <div className="w-full">
      <label htmlFor={inputId} className={labelStyles}>{label}</label>
      {inputElement}
    </div>
  );
}
```

---

### 10. Scheduler.ts Warmup Logic Could Be Simplified

The `createScheduledWorkout` function is now ~200 lines with three passes over exercises:

```tsx
// Pass 1: Count working sets per exercise (lines 180-210)
for (const [type, setsNeeded] of Object.entries(day.setsByType)) { ... }

// Pass 2: Generate warmup sets (lines 215-280)
for (const [exerciseId, info] of exerciseWorkingSets) { ... }

// Pass 3: Generate working sets (lines 285-370)
for (const [type, setsNeeded] of Object.entries(day.setsByType)) { ... }
```

**Recommendation:** Extract into separate functions:

```tsx
function createScheduledWorkout(day: DayAllocation, cycle: Cycle, exercises: Map<string, Exercise>) {
  const exerciseInfo = collectExerciseInfo(day, cycle, exercises);
  const warmupSets = generateWarmupSetsForWorkout(exerciseInfo, day, cycle);
  const workingSets = generateWorkingSets(day, cycle, exercises, exerciseInfo);
  
  return {
    cycleId: cycle.id,
    // ...
    scheduledSets: [...warmupSets, ...workingSets],
    status: 'pending'
  };
}
```

---

### 11. Missing React.memo on Pure Components

Components that receive stable props but re-render on parent updates:

```tsx
// These should be memoized:
src/components/exercises/ExerciseCard.tsx
src/components/workouts/CompletedSetCard.tsx
src/components/workouts/today/TodayStats.tsx
src/components/workouts/today/WorkoutHeader.tsx
src/components/ui/Badge.tsx
src/components/ui/Card.tsx
```

**Recommendation:**

```tsx
// ExerciseCard.tsx
export const ExerciseCard = memo(function ExerciseCard({ 
  exercise, 
  latestMax,
  onClick 
}: ExerciseCardProps) {
  // ...
});
```

---

### 12. useLiveQuery Results Not Always Handled

Several components don't handle the `undefined` state from useLiveQuery during initial load:

```tsx
// Today.tsx
const exercises = useLiveQuery(() => ExerciseRepo.getAll());
const exerciseMap = new Map(exercises?.map(e => [e.id, e]) || []);
// exerciseMap could be empty during load, causing blank UI flicker
```

**Recommendation:** Add explicit loading states:

```tsx
const exercises = useLiveQuery(() => ExerciseRepo.getAll());

if (exercises === undefined) {
  return <WorkoutSkeleton />;
}
```

---

### 13. Magic Numbers in Warmup Calculations

```tsx
// scheduler.ts
for (const percentage of [20, 40]) { ... }  // Why 20 and 40?
warmupReps = Math.ceil(workoutTargetValue * 0.6);  // What's 0.6?
warmupWeight = roundToWeightIncrement(workoutTargetWeight * 0.6, 5);  // Same
setRestTimerDuration(Math.round(restTimer.defaultDurationSeconds * 0.5));  // 50% rest
```

**Recommendation:** Add to constants:

```tsx
// src/constants/training.ts
export const WARMUP = {
  PERCENTAGES: [20, 40] as const,
  REDUCED_INTENSITY_FACTOR: 0.6,  // 60% of working set intensity
  REST_TIMER_FACTOR: 0.5,         // 50% of normal rest time
} as const;
```

---

### 14. Supabase Migration Files Scattered in Root

Six migration files in project root:
- `supabase-schema.sql`
- `supabase-migration-cycle-type.sql`
- `supabase-migration-delete-account.sql`
- `supabase-migration-mixed-mode.sql`
- `supabase-migration-time-based.sql`
- `supabase-migration-warmup-sets.sql`

**Recommendation:** Organize with proper naming:

```
supabase/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_cycle_type.sql
│   ├── 003_delete_account.sql
│   ├── 004_mixed_mode.sql
│   ├── 005_time_based.sql
│   └── 006_warmup_sets.sql
└── README.md (migration instructions)
```

---

## ⚪ Low Priority Issues

### 15. Inconsistent Export Patterns

```tsx
// Some files use named exports
export function CycleWizard() { }
export const ExerciseRepo = { }

// Some use default exports
export default App;

// Index files re-export inconsistently
export { CycleWizard } from './CycleWizard';  // named
export { default as Layout } from './Layout';  // default as named
```

**Recommendation:** Standardize on named exports (more refactor-friendly).

---

### 16. README.md Doesn't Document New Features

README still describes v1.x features. Missing:
- Mixed Mode / Simple Progression explanation
- Time-based exercise support
- Warmup sets feature
- Ad-hoc workout functionality

---

### 17. No CHANGELOG.md

With 2.5.0 versions of changes, there's no changelog documenting what changed between versions.

**Recommendation:** Add CHANGELOG.md following Keep a Changelog format.

---

### 18. Deploy Documentation Fragmented

Four separate DEPLOY files:
- `DEPLOY_v2.0.0.md`
- `DEPLOY_v2.1.0.md`
- `DEPLOY_v2.2.0.md`
- `DEPLOY_v2.2.1.md`

**Recommendation:** Consolidate into single `DEPLOYMENT.md` with version-specific sections, or move to `docs/` folder.

---

### 19. Unused Custom Tailwind Font Sizes

```js
// tailwind.config.js
fontSize: {
  'gym-xl': ['1.5rem', ...],   // Used 2 times
  'gym-2xl': ['1.75rem', ...], // Used 3 times
  'gym-3xl': ['2rem', ...],    // Used 1 time
}
```

These are barely used. Consider if they're worth the config complexity.

---

### 20. ErrorBoundary Could Be Enhanced

Current ErrorBoundary handles errors but provides minimal recovery options:

```tsx
// Current: just shows error message
<div className="text-red-600">
  <p className="font-semibold">Something went wrong</p>
  <p className="text-sm">{this.state.error?.message}</p>
</div>
```

**Recommendation:** Add retry and report capabilities:

```tsx
<div>
  <p>Something went wrong</p>
  <Button onClick={this.handleRetry}>Try Again</Button>
  <Button onClick={this.handleReport}>Report Issue</Button>
</div>
```

---

## Documentation Gaps

### Missing JSDoc on Key Functions

These core business logic functions lack documentation:

| Function | File | Lines |
|----------|------|-------|
| `generateSchedule` | scheduler.ts | ~50 |
| `createScheduledWorkout` | scheduler.ts | ~200 |
| `calculateTargetReps` | scheduler.ts | ~60 |
| `generateWarmupSets` | scheduler.ts | ~80 |
| `SyncService.performSync` | syncService.ts | ~100 |
| `remoteToLocalCycle` | syncService.ts | ~25 |

---

## Files Requiring Attention

| File | Lines | Priority | Primary Issues |
|------|-------|----------|----------------|
| `CycleWizard.tsx` | 2,456 | 🔴 | Massive size, needs splitting |
| `Schedule.tsx` | 1,026 | 🟠 | Too large, mixed concerns |
| `Today.tsx` | 807 | 🟠 | State sprawl |
| `syncService.ts` | 716 | 🟠 | Duplicate type definitions |
| `scheduler.ts` | 766 | 🟡 | Could extract warmup logic |
| `Settings.tsx` | 821 | 🟡 | Large but acceptable for settings |
| `types/index.ts` | 371 | 🟡 | Mixed concerns |

---

## Phased Implementation Plan

This plan organizes all improvements into logical phases with dependencies, time estimates, and clear deliverables. Phases are designed to be completed sequentially, though some tasks within phases can be parallelized.

### Overview

| Phase | Focus | Duration | Risk Level |
|-------|-------|----------|------------|
| 1 | Foundation & Tooling | 1-2 days | Low |
| 2 | Type System Consolidation | 2-3 days | Low |
| 3 | CycleWizard Decomposition | 3-4 days | Medium |
| 4 | Page Component Refactoring | 3-4 days | Medium |
| 5 | Scheduler Refinement | 1-2 days | Low |
| 6 | Performance & Polish | 2-3 days | Low |
| 7 | Testing & Documentation | 2-3 days | Low |
| 8 | Ongoing Maintenance | Continuous | — |

**Total Estimated Time:** 14-21 days (spread across sprints)

---

### Phase 1: Foundation & Tooling
**Duration:** 1-2 days | **Risk:** Low | **Dependencies:** None

*Establish utilities and constants that will be used throughout subsequent refactoring.*

#### Tasks

| Task | Time | Files Affected | Deliverable |
|------|------|----------------|-------------|
| 1.1 Create logger utility | 2h | New: `src/utils/logger.ts` | Centralized logging with log levels |
| 1.2 Add training constants | 2h | New: `src/constants/training.ts`, Update: `constants/index.ts` | WARMUP, RFEM constants |
| 1.3 Organize migration files | 1h | Move SQL files to `supabase/migrations/` | Clean project root |
| 1.4 Add clsx/tailwind-merge | 1h | `package.json`, New: `src/utils/cn.ts` | Class merging utility |

#### Verification
- [ ] Logger works in dev (shows debug) and prod (hides debug)
- [ ] Constants imported and used in at least one file
- [ ] Build passes
- [ ] All 154 tests pass

---

### Phase 2: Type System Consolidation
**Duration:** 2-3 days | **Risk:** Low | **Dependencies:** Phase 1

*Clean up type definitions and sync service before major component refactoring.*

#### Tasks

| Task | Time | Files Affected | Deliverable |
|------|------|----------------|-------------|
| 2.1 Generate Supabase types | 1h | New: `src/types/supabase.ts` | Auto-generated DB types |
| 2.2 Split types/index.ts | 3h | `src/types/*.ts` | Focused type modules |
| 2.3 Extract time utilities | 1h | New: `src/utils/time.ts` | formatTime, parseTimeInput, formatDuration |
| 2.4 Extract progression utilities | 1h | New: `src/utils/progression.ts` | getProgressionMode helpers |
| 2.5 Update syncService transformers | 4h | `src/services/syncService.ts` | Use generated types, reduce duplication |
| 2.6 Update all imports | 2h | All files importing from types | Clean imports |

#### New File Structure
```
src/types/
├── index.ts           (re-exports only)
├── supabase.ts        (generated)
├── exercise.ts        
├── cycle.ts           
├── workout.ts         
└── forms.ts           

src/utils/
├── index.ts
├── cn.ts              (class name utility)
├── date.ts            (re-export)
├── dateUtils.ts       (existing)
├── logger.ts          (from Phase 1)
├── time.ts            (new)
└── progression.ts     (new)
```

#### Verification
- [ ] All type imports resolve correctly
- [ ] No TypeScript errors
- [ ] syncService still syncs correctly (manual test)
- [ ] All 154 tests pass

---

### Phase 3: CycleWizard Decomposition
**Duration:** 3-4 days | **Risk:** Medium | **Dependencies:** Phase 2

*Break apart the largest file in the codebase. This is the highest-impact refactoring.*

#### Tasks

| Task | Time | Files Affected | Deliverable |
|------|------|----------------|-------------|
| 3.1 Extract useCycleWizardState hook | 3h | New: `cycles/hooks/useCycleWizardState.ts` | All 30+ useState in one hook |
| 3.2 Extract useCycleCloning hook | 1h | New: `cycles/hooks/useCycleCloning.ts` | Clone logic |
| 3.3 Extract StartStep | 1h | New: `cycles/steps/StartStep.tsx` | ~100 lines |
| 3.4 Extract BasicsStep | 1h | New: `cycles/steps/BasicsStep.tsx` | ~60 lines |
| 3.5 Extract GroupsStep | 2h | New: `cycles/steps/GroupsStep.tsx` | ~220 lines |
| 3.6 Extract GoalsStep | 2h | New: `cycles/steps/GoalsStep.tsx` | ~230 lines |
| 3.7 Extract ProgressionStep | 1h | New: `cycles/steps/ProgressionStep.tsx` | ~70 lines |
| 3.8 Extract ReviewStep | 2h | New: `cycles/steps/ReviewStep.tsx` | ~350 lines |
| 3.9 Extract MixedExerciseConfig | 2h | New: `cycles/components/MixedExerciseConfig.tsx` | ~210 lines |
| 3.10 Extract SimpleProgressionFields | 1h | New: `cycles/components/SimpleProgressionFields.tsx` | ~155 lines |
| 3.11 Extract ExerciseProgressionEditor | 2h | New: `cycles/components/ExerciseProgressionEditor.tsx` | ~230 lines |
| 3.12 Refactor main CycleWizard | 2h | `cycles/CycleWizard.tsx` | ~300 line orchestrator |
| 3.13 Update index.ts exports | 0.5h | `cycles/index.ts` | Clean exports |

#### New File Structure
```
src/components/cycles/
├── CycleWizard.tsx              (~300 lines)
├── CycleCompletionModal.tsx     (existing)
├── CycleTypeSelector.tsx        (existing)
├── MaxTestingWizard.tsx         (existing)
├── hooks/
│   ├── index.ts
│   ├── useCycleWizardState.ts
│   └── useCycleCloning.ts
├── steps/
│   ├── index.ts
│   ├── StartStep.tsx
│   ├── BasicsStep.tsx
│   ├── GroupsStep.tsx
│   ├── GoalsStep.tsx
│   ├── ProgressionStep.tsx
│   └── ReviewStep.tsx
├── components/
│   ├── index.ts
│   ├── MixedExerciseConfig.tsx
│   ├── SimpleProgressionFields.tsx
│   └── ExerciseProgressionEditor.tsx
└── index.ts
```

#### Verification
- [ ] Cycle creation works (all three modes: RFEM, Simple, Mixed)
- [ ] Cycle editing works
- [ ] Cycle cloning works
- [ ] Warmup settings persist correctly
- [ ] All 154 tests pass
- [ ] No visual regressions

---

### Phase 4: Page Component Refactoring
**Duration:** 3-4 days | **Risk:** Medium | **Dependencies:** Phase 3

*Reduce complexity of large page components.*

#### Tasks

| Task | Time | Files Affected | Deliverable |
|------|------|----------------|-------------|
| 4.1 Create useTodayModals hook | 2h | New: `hooks/useTodayModals.ts` | Modal state management |
| 4.2 Create useTodayWorkout hook | 2h | New: `hooks/useTodayWorkout.ts` | Workout selection logic |
| 4.3 Refactor Today.tsx | 3h | `pages/Today.tsx` | Use new hooks, ~500 lines |
| 4.4 Extract useScheduleData hook | 2h | New: `hooks/useScheduleData.ts` | Data fetching/grouping |
| 4.5 Extract ScheduleWorkoutCard | 2h | New: `workouts/ScheduleWorkoutCard.tsx` | Workout display component |
| 4.6 Refactor Schedule.tsx | 3h | `pages/Schedule.tsx` | Use new components, ~600 lines |
| 4.7 Extract settings sections | 2h | New: `components/settings/*.tsx` | AccountSettings, DisplaySettings, etc. |

#### Verification
- [ ] Today page functions correctly (all workout flows)
- [ ] Schedule page functions correctly (all views)
- [ ] Settings page functions correctly (all settings)
- [ ] All 154 tests pass

---

### Phase 5: Scheduler Refinement
**Duration:** 1-2 days | **Risk:** Low | **Dependencies:** Phase 2

*Clean up scheduler.ts and add documentation.*

#### Tasks

| Task | Time | Files Affected | Deliverable |
|------|------|----------------|-------------|
| 5.1 Extract warmup generation | 2h | `services/scheduler.ts` | Separate functions |
| 5.2 Use training constants | 1h | `services/scheduler.ts` | Replace magic numbers |
| 5.3 Add JSDoc to all exports | 2h | `services/scheduler.ts` | Complete documentation |
| 5.4 Add JSDoc to syncService | 2h | `services/syncService.ts` | Complete documentation |

#### Verification
- [ ] Schedule generation works identically
- [ ] Warmup sets generated correctly
- [ ] All 154 tests pass

---

### Phase 6: Performance & Polish
**Duration:** 2-3 days | **Risk:** Low | **Dependencies:** Phase 4

*React optimizations and styling improvements.*

#### Tasks

| Task | Time | Files Affected | Deliverable |
|------|------|----------------|-------------|
| 6.1 Add React.memo to pure components | 2h | ExerciseCard, Badge, Card, etc. | Memoized components |
| 6.2 Add useMemo for expensive computations | 2h | Today.tsx, Schedule.tsx | Optimized renders |
| 6.3 Create Tailwind class utilities | 2h | New: `src/styles/classes.ts` | Semantic class names |
| 6.4 Apply class utilities | 3h | All components with repeated patterns | Cleaner JSX |
| 6.5 Add loading skeletons | 2h | Today.tsx, Schedule.tsx, Exercises.tsx | Better loading states |
| 6.6 Refactor NumberInput | 1h | `components/ui/Input.tsx` | Remove duplication |

#### Verification
- [ ] No visual regressions
- [ ] React DevTools shows fewer re-renders
- [ ] Loading states visible during data fetch
- [ ] All 154 tests pass

---

### Phase 7: Testing & Documentation
**Duration:** 2-3 days | **Risk:** Low | **Dependencies:** Phase 6

*Fill in testing gaps and update documentation.*

#### Tasks

| Task | Time | Files Affected | Deliverable |
|------|------|----------------|-------------|
| 7.1 Add repository tests | 3h | New: `data/repositories/*.test.ts` | CRUD test coverage |
| 7.2 Add warmup edge case tests | 2h | `services/scheduler.test.ts` | Weight progression tests |
| 7.3 Update README.md | 2h | `README.md` | Document all features |
| 7.4 Create CHANGELOG.md | 1h | New: `CHANGELOG.md` | Version history |
| 7.5 Consolidate deploy docs | 1h | New: `docs/DEPLOYMENT.md` | Single deploy guide |
| 7.6 Enhance ErrorBoundary | 1h | `components/ErrorBoundary.tsx` | Retry/report buttons |

#### Verification
- [ ] Test coverage increased
- [ ] README accurately describes app
- [ ] CHANGELOG documents all versions
- [ ] All tests pass

---

### Phase 8: Ongoing Maintenance
**Duration:** Continuous | **Dependencies:** All phases complete

*Standards to maintain going forward.*

#### Guidelines

1. **Component Size Limit:** Keep components under 400 lines
2. **New Features:** Add tests before merging
3. **New Types:** Update Supabase types when schema changes
4. **Releases:** Update CHANGELOG.md with each version
5. **Code Review Checklist:**
   - [ ] Component under 400 lines?
   - [ ] Tests added for new logic?
   - [ ] Magic numbers extracted to constants?
   - [ ] JSDoc on exported functions?
   - [ ] Loading states handled?

---

### Implementation Schedule (Suggested)

| Week | Phase | Focus |
|------|-------|-------|
| 1 | 1 + 2 | Foundation, types |
| 2 | 3 (first half) | CycleWizard hooks and steps |
| 3 | 3 (second half) | CycleWizard components, integration |
| 4 | 4 | Page refactoring |
| 5 | 5 + 6 | Scheduler, performance |
| 6 | 7 | Testing, documentation |

---

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking cycle creation | Test all three modes after each extraction |
| Breaking sync | Manual sync test after Phase 2 |
| Visual regressions | Screenshot comparison before/after |
| Merge conflicts | Complete phases before starting new features |
| Time overrun | Phases 6-7 can be deferred if needed |

---

### Success Criteria

After completing all phases:

- [ ] No file exceeds 500 lines
- [ ] Test coverage includes repositories
- [ ] All documentation current
- [ ] Build size unchanged (±5%)
- [ ] All existing functionality preserved
- [ ] Performance equal or improved

---

## Conclusion

The codebase has improved significantly since v1.1.5—error boundaries, tests, and path aliases are now in place. However, rapid feature development has caused `CycleWizard.tsx` to balloon to 2,456 lines, making it the most urgent refactoring target. 

The sync service's manual type definitions create maintenance burden with every schema change. Addressing this with generated types would prevent future bugs.

**All recommendations preserve existing functionality.** The refactoring suggestions are purely structural—extracting code into separate files, not changing logic. The phased implementation plan allows for incremental progress without disrupting ongoing development.

The highest-impact improvement is **Phase 3: CycleWizard Decomposition**. Completing this single phase would make the codebase significantly easier to work with and reduce bug risk for any future cycle-related features.

---

*Report generated: January 2026*  
*Next review recommended: After Phase 3 completion or v3.0.0, whichever comes first*
