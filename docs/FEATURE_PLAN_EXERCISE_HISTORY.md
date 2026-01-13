# Feature Plan: Exercise History View

## Overview

Add an exercise-specific history view that displays all prior logged sets (excluding warmups) for each exercise. This feature enables users to see their progression over time and plan future cycles based on historical performance.

**Version Target**: v2.11.0  
**Estimated Effort**: 3-5 hours  
**Breaking Changes**: None

---

## User Story

> As a user, when I tap on an exercise tile in the Exercises tab and view its details, I want to see a history of all my working sets for that exercise so I can track my progression over time and make informed decisions about future training cycles.

---

## Current State

### ExerciseDetailPage (`src/pages/ExerciseDetail.tsx`)

Currently displays:
1. **PageHeader** - Exercise name with edit/delete actions
2. **Exercise Info Card** - Type badge, mode, weight-enabled status, notes, custom parameters
3. **Stats Card** - Three-column grid showing:
   - Current Max (or Base for conditioning)
   - Total Sets
   - Total Reps/Time
4. **Record New Max Button** - For standard exercises only
5. **Max History** - List of all max records for standard exercises (date, value, weight, notes)

### Data Layer

- `CompletedSetRepo.getForExercise(exerciseId)` - Returns all completed sets, sorted by date descending
- `ScheduledWorkoutRepo.getById(id)` - Returns workout with `scheduledSets` array containing `isWarmup` flag
- `CompletedSet.scheduledSetId` - Links to `ScheduledSet` (null for ad-hoc sets)

---

## Proposed Changes

### 1. Data Layer Enhancement

**File**: `src/data/repositories/CompletedSetRepo.ts`

Add a new method to retrieve working sets (non-warmup) with workout context:

```typescript
/**
 * Gets completed sets for an exercise excluding warmup sets.
 * Groups results by workout date for history display.
 * @param exerciseId - The exercise UUID
 * @returns Promise resolving to working sets grouped by date
 */
async getWorkingSetHistory(exerciseId: string): Promise<{
  date: Date;
  workoutId: string | null;
  sets: Array<{
    actualReps: number;
    weight?: number;
    notes?: string;
  }>;
}[]>
```

**Implementation approach**:
1. Fetch all completed sets for the exercise
2. Fetch all scheduled workouts that might contain warmup info
3. Build a lookup map: `scheduledSetId → isWarmup`
4. Filter out sets where the corresponding scheduled set has `isWarmup: true`
5. Group remaining sets by date (same day = same session)

### 2. UI Component: ExerciseHistorySection

**File**: `src/components/exercises/ExerciseHistorySection.tsx`

A new component for displaying exercise history:

```typescript
interface ExerciseHistorySectionProps {
  exerciseId: string;
  measurementType: 'reps' | 'time';
  weightEnabled?: boolean;
}
```

**Display format**:
```
┌─────────────────────────────────────────────────┐
│ 📋 Exercise History                    [▼ Expand]│
├─────────────────────────────────────────────────┤
│ Jan 10, 2026                                    │
│   Set 1: 15 reps @ 25 lbs                       │
│   Set 2: 14 reps @ 25 lbs                       │
│   Set 3: 13 reps @ 25 lbs                       │
├─────────────────────────────────────────────────┤
│ Jan 8, 2026                                     │
│   Set 1: 14 reps                                │
│   Set 2: 13 reps                                │
│   Set 3: 12 reps                                │
├─────────────────────────────────────────────────┤
│ ... (older entries)                             │
└─────────────────────────────────────────────────┘
```

**Features**:
- Collapsible/expandable with session preview
- Groups sets by date (workout session)
- Shows individual set reps/time with weight if applicable
- Limits initial display to recent sessions with "Show More" option
- Empty state when no history exists

### 3. Max History Format Update

**Current format**:
```
Max History
┌──────────────────────────────────┐
│ 16 reps  +25 lbs  [Current]  Jan 10 │
└──────────────────────────────────┘
```

**Updated format** (align with exercise history):
```
Prior Maxes
┌─────────────────────────────────────┐
│ Jan 10, 2026        16 reps @ 25 lbs [Current] │
│ Jan 3, 2026         15 reps @ 25 lbs           │
│ Dec 27, 2025        14 reps @ 20 lbs           │
└─────────────────────────────────────┘
```

This provides visual consistency between the two history sections.

### 4. ExerciseDetailPage Integration

**File**: `src/pages/ExerciseDetail.tsx`

Add the new section below Max History:

```tsx
{/* Prior Maxes - renamed from Max History */}
{exercise.mode === 'standard' && maxRecords && maxRecords.length > 0 && (
  <PriorMaxesSection maxRecords={maxRecords} exercise={exercise} />
)}

{/* Exercise History - NEW */}
<ExerciseHistorySection
  exerciseId={exercise.id}
  measurementType={exercise.measurementType}
  weightEnabled={exercise.weightEnabled}
/>
```

---

## Technical Details

### Warmup Set Detection

The challenge is that `CompletedSet` doesn't directly store `isWarmup`. Detection requires:

1. **Scheduled sets**: Look up `scheduledSetId` → find in `ScheduledWorkout.scheduledSets` → check `isWarmup`
2. **Ad-hoc sets**: These have `scheduledSetId: null` and are never warmups (users manually log them)

**Lookup strategy**:
```typescript
// Build warmup set ID map
const warmupSetIds = new Set<string>();

for (const workout of allWorkouts) {
  for (const set of workout.scheduledSets) {
    if (set.isWarmup) {
      warmupSetIds.add(set.id);
    }
  }
}

// Filter completed sets
const workingSets = completedSets.filter(
  cs => cs.scheduledSetId === null || !warmupSetIds.has(cs.scheduledSetId)
);
```

### Grouping Algorithm

Group sets into workout sessions based on date:

```typescript
type SessionGroup = {
  date: Date;           // Start of day
  workoutId: string | null;
  sets: Array<{
    actualReps: number;
    weight?: number;
    notes?: string;
  }>;
};

function groupBySession(sets: CompletedSet[]): SessionGroup[] {
  const groups = new Map<string, SessionGroup>();
  
  for (const set of sets) {
    const dateKey = startOfDay(set.completedAt).toISOString();
    
    if (!groups.has(dateKey)) {
      groups.set(dateKey, {
        date: startOfDay(set.completedAt),
        workoutId: set.scheduledWorkoutId,
        sets: []
      });
    }
    
    groups.get(dateKey)!.sets.push({
      actualReps: set.actualReps,
      weight: set.weight,
      notes: set.notes || undefined
    });
  }
  
  // Sort by date descending (newest first)
  return Array.from(groups.values())
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}
```

### Performance Considerations

- **Initial load**: Show only the 5 most recent sessions
- **Lazy expansion**: Load additional sessions on "Show More"
- **Caching**: Use `useLiveQuery` which automatically updates on data changes
- **Memory**: For exercises with extensive history (100+ sessions), consider pagination

---

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/data/repositories/CompletedSetRepo.ts` | Modify | Add `getWorkingSetHistory()` method |
| `src/components/exercises/ExerciseHistorySection.tsx` | **New** | Exercise history display component |
| `src/components/exercises/PriorMaxesSection.tsx` | **New** | Extracted max history component |
| `src/components/exercises/index.ts` | Modify | Export new components |
| `src/pages/ExerciseDetail.tsx` | Modify | Integrate new sections |

---

## UI Mockups

### Collapsed State (default)

```
┌────────────────────────────────────────────────────┐
│ 📋 Exercise History (42 sessions)     [▼ Expand]   │
└────────────────────────────────────────────────────┘
```

### Expanded State

```
┌────────────────────────────────────────────────────┐
│ 📋 Exercise History (42 sessions)     [▲ Collapse] │
├────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────┐ │
│ │ Fri, Jan 10                                    │ │
│ │   • 15 reps @ 25 lbs                          │ │
│ │   • 14 reps @ 25 lbs                          │ │
│ │   • 13 reps @ 25 lbs                          │ │
│ └────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────┐ │
│ │ Wed, Jan 8                                     │ │
│ │   • 14 reps @ 25 lbs                          │ │
│ │   • 13 reps @ 25 lbs                          │ │
│ │   • 12 reps @ 25 lbs                          │ │
│ └────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────┐ │
│ │ Mon, Jan 6                                     │ │
│ │   • 13 reps @ 20 lbs                          │ │
│ │   • 12 reps @ 20 lbs                          │ │
│ │   • 11 reps @ 20 lbs                          │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│           [Show More (39 older sessions)]          │
└────────────────────────────────────────────────────┘
```

### Empty State

```
┌────────────────────────────────────────────────────┐
│ 📋 Exercise History                                │
├────────────────────────────────────────────────────┤
│                                                    │
│        No workout history for this exercise        │
│                                                    │
│       Complete a workout to start tracking         │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Time-based Exercise (alternative display)

```
┌────────────────────────────────────────────────────┐
│ Fri, Jan 10                                        │
│   • 1:30 @ 10 lbs                                 │
│   • 1:25 @ 10 lbs                                 │
│   • 1:20 @ 10 lbs                                 │
└────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Data Layer (Est. 1 hour)
1. Add `getWorkingSetHistory()` to `CompletedSetRepo`
2. Write unit tests for the new method
3. Verify warmup filtering works correctly

### Phase 2: UI Components (Est. 1.5 hours)
1. Create `ExerciseHistorySection` component
2. Create `PriorMaxesSection` component (extract from ExerciseDetail)
3. Add expand/collapse functionality
4. Handle empty states

### Phase 3: Integration (Est. 0.5 hours)
1. Update `ExerciseDetail.tsx` to use new components
2. Update exports in index files
3. Test integration

### Phase 4: Polish (Est. 1 hour)
1. Verify responsive design on mobile
2. Test with various font sizes
3. Test with different data scenarios (lots of history, no history, etc.)
4. Performance testing with large datasets

---

## Testing Plan

### Unit Tests

**CompletedSetRepo.test.ts** (new tests):
```typescript
describe('getWorkingSetHistory', () => {
  it('returns all sets for exercise');
  it('excludes warmup sets');
  it('includes ad-hoc sets (no scheduledSetId)');
  it('groups sets by date correctly');
  it('sorts groups by date descending');
  it('returns empty array for exercise with no history');
});
```

### Integration Tests

**ExerciseHistorySection.test.tsx** (new file):
```typescript
describe('ExerciseHistorySection', () => {
  it('renders collapsed state by default');
  it('expands on click');
  it('displays sessions with correct dates');
  it('shows reps correctly');
  it('shows time correctly for time-based exercises');
  it('shows weight when applicable');
  it('renders empty state when no history');
  it('handles Show More pagination');
});
```

### Manual Testing Checklist

- [ ] Warmup sets are excluded from history
- [ ] Ad-hoc logged sets appear in history
- [ ] Date grouping is correct (same workout day grouped)
- [ ] Expand/collapse works smoothly
- [ ] Time-based exercises display MM:SS format
- [ ] Weight displays correctly when enabled
- [ ] Empty state renders for new exercises
- [ ] "Show More" loads additional sessions
- [ ] Responsive on mobile (various screen sizes)
- [ ] Handles exercises with 100+ sessions
- [ ] Dark mode displays correctly

---

## Rollback Strategy

If issues occur:
1. Revert to v2.10.0 deployment
2. No database migrations required (feature uses existing data)
3. No breaking changes to existing functionality

---

## Future Enhancements

1. **Charts/graphs**: Visualize rep progression over time
2. **Export history**: Export to CSV/PDF
3. **Filter by date range**: View specific time periods
4. **Search within history**: Find sessions with specific notes
5. **Compare cycles**: Show history grouped by training cycle
6. **PR highlighting**: Mark sessions where user achieved a new best

---

## Dependencies

No new npm dependencies required.

---

## Approval Checklist

- [ ] Design reviewed
- [ ] Technical approach approved
- [ ] Estimated effort confirmed
- [ ] Testing plan reviewed
- [ ] Ready for implementation
