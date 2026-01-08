# Ascend v2.2.1 Deployment Instructions

## Bug Fix Release

Fixes issue where "Continue to Next Workout" would sometimes show a previously completed or skipped workout instead of the next pending workout.

## What Changed

### Fixed: Next Workout Navigation Bug

**Problem:** After completing a workout and clicking "Continue to Next Workout", the app would sometimes show a workout that was already completed or skipped earlier in the schedule.

**Cause:** Race condition where the `nextPendingWorkout` query hadn't refreshed with updated data after the workout status changed.

**Solution:** 
1. Added `dismissedWorkoutId` state to track just-completed workouts
2. Query now explicitly skips the dismissed workout when finding next pending
3. Forces query refresh via dependency on `dismissedWorkoutId`

### Files Changed

**src/pages/Today.tsx:**
- Added `dismissedWorkoutId` state
- Modified `nextPendingWorkout` query to skip dismissed workout
- Created wrapper for `handleProceedToNextWorkout` to set dismissed ID

**src/data/repositories/ScheduledWorkoutRepo.ts:**
- Minor cleanup of `getNextPending` function

## Deployment

```bash
cd ~/code/workout-tracker

# Remove old source files
rm -rf src

# Extract new version
unzip -o ~/Downloads/ascend-v2.2.1.zip

# Commit and push
git add .
git commit -m "v2.2.1: Fix next workout navigation bug

Fixed issue where 'Continue to Next Workout' would show previously
completed/skipped workouts instead of the next pending workout.

Root cause: Race condition in query refresh after workout completion.

Solution: Track dismissed workout ID and skip it in the pending query
until the data fully refreshes."

git push
```

## Testing

1. Complete a workout (all sets)
2. Click "Continue to Next Workout"
3. Verify the correct next pending workout is shown
4. Repeat with out-of-order completion (skip some workouts first)

## Rollback

If issues occur:
```bash
git revert HEAD
git push
```
