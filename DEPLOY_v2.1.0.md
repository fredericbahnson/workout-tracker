# Ascend v2.1.0 Deployment Instructions

## Overview

This release completes Phase 2 of technical debt remediation:
- **Phase 2A**: Component extraction (14 components from Today.tsx)
- **Phase 2B**: Custom hook extraction (3 hooks)
- **Exponential backoff**: Improved sync retry logic

## What Changed

### Today.tsx Refactoring (53% reduction)

| Metric | Before | After |
|--------|--------|-------|
| Today.tsx | 1,635 lines | 762 lines |
| Components | 0 | 14 |
| Custom Hooks | 1 | 4 |

### New Custom Hooks (`src/hooks/`)

| Hook | Lines | Description |
|------|-------|-------------|
| useWorkoutDisplay | 158 | Which workout to show, completion view state |
| useCycleCompletion | 133 | Cycle completion modal, max testing wizard |
| useAdHocWorkout | 164 | Ad-hoc workout CRUD operations |

### New Components (`src/components/workouts/today/`)

| Component | Lines | Description |
|-----------|-------|-------------|
| WorkoutCompletionBanner | 26 | Celebration banner |
| ScheduledSetsList | 185 | Swipeable set cards |
| WorkoutHeader | 114 | Title, progress, styling |
| AdHocWorkoutControls | 55 | Log/Complete/Cancel buttons |
| EditCompletedSetModal | 150 | Edit completed set |
| ScheduledSetModal | 129 | Log scheduled set with timer |
| TodayStats | 99 | Collapsible stats summary |
| AdHocCompletedSetsList | 93 | Ad-hoc sets grouped by type |
| WorkoutActionButtons | 75 | Continue/Skip/End buttons |
| CycleProgressHeader | 105 | Cycle status display |
| ConfirmationModals | 174 | 4 confirmation dialogs |
| ExercisePickerModal | 80 | Exercise selection |
| RenameWorkoutModal | 68 | Rename ad-hoc workout |

### Sync Service Improvements

**Exponential Backoff**: Failed sync operations now retry with increasing delays:
- Attempt 1: Wait 1 second
- Attempt 2: Wait 2 seconds
- Attempt 3: Wait 4 seconds
- Attempt 4: Wait 8 seconds
- Attempt 5: Give up

This prevents hammering the server during outages and improves battery life.

## Deployment

```bash
cd ~/code/workout-tracker

# Remove old source files
rm -rf src

# Extract new version
unzip -o ~/Downloads/ascend-v2.1.0.zip

# Commit and push
git add .
git commit -m "v2.1.0: Phase 2 Complete - Refactoring & Sync Improvements

Phase 2A - Component Extraction:
- Extract 14 components from Today.tsx
- New src/components/workouts/today/ directory

Phase 2B - Custom Hooks:
- useWorkoutDisplay: workout display logic
- useCycleCompletion: cycle completion flow
- useAdHocWorkout: ad-hoc workout management

Sync Improvements:
- Implement exponential backoff for failed sync retries
- Add nextRetryAt tracking to sync queue

Results:
- Today.tsx: 1,635 → 762 lines (53% reduction)
- All 112 tests passing"

git push
```

## Testing Checklist

After deployment, verify:

### Core Functionality
- [ ] Today page loads correctly
- [ ] Scheduled workout displays with progress
- [ ] Swipe to complete sets works
- [ ] Timer/stopwatch for timed exercises
- [ ] Ad-hoc workout creation and logging
- [ ] Edit completed set modal
- [ ] Skip/End workout confirmations
- [ ] Cycle completion flow

### Sync (if using Supabase)
- [ ] Data syncs between devices
- [ ] Offline changes queue properly
- [ ] Failed syncs retry with backoff (check console logs)

### Regression
- [ ] All existing features work as before
- [ ] No console errors in production

## Rollback

If issues occur, revert to v2.0.0:
```bash
git revert HEAD
git push
```

## Test Results

```
Test Files  3 passed (3)
     Tests  112 passed (112)
```

## File Changes Summary

### New Files
- `src/hooks/useWorkoutDisplay.ts`
- `src/hooks/useCycleCompletion.ts`
- `src/hooks/useAdHocWorkout.ts`
- `src/components/workouts/today/*.tsx` (14 components)

### Modified Files
- `src/hooks/index.ts` - Export new hooks
- `src/pages/Today.tsx` - Major refactor
- `src/pages/Settings.tsx` - Version display
- `src/data/db.ts` - Add nextRetryAt to SyncQueueItem
- `src/services/syncService.ts` - Exponential backoff
- `src/services/syncService.test.ts` - New backoff tests
- `package.json` - Version 2.1.0
