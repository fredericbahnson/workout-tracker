# Ascend v2.11.1 Deployment Instructions

## Overview

This release adds the **Exercise History** feature, allowing users to view their workout history for each exercise directly from the Exercise Detail page.

## New Features

### Exercise History View
- Collapsible section showing all working sets (excludes warmups and skipped sets)
- Sets grouped by workout session (calendar day)
- Supports both rep-based and time-based exercises
- Shows weight when applicable
- "Show More" pagination for exercises with extensive history

### Prior Maxes Section
- Renamed from "Max History" for clarity
- Date-first layout for better visual alignment with Exercise History

## Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `src/data/repositories/CompletedSetRepo.ts` | Modified | Added `getWorkingSetHistory()` method |
| `src/components/exercises/ExerciseHistorySection.tsx` | **New** | Exercise history display component |
| `src/components/exercises/PriorMaxesSection.tsx` | **New** | Extracted max history component |
| `src/components/exercises/index.ts` | Modified | Added new exports |
| `src/pages/ExerciseDetail.tsx` | Modified | Integrated new components |
| `src/data/repositories/repositories.test.ts` | Modified | Added 6 new tests |
| `docs/FEATURE_PLAN_EXERCISE_HISTORY.md` | **New** | Feature implementation plan |

## Test Results

```
Tests:  244 passed (up from 237)
Files:  7 test files
New:    7 tests for getWorkingSetHistory()

Pre-existing failures (2):
- syncService.test.ts: Mock configuration issues (not related to this feature)
```

## Deployment Commands

```bash
cd /path/to/workout-tracker

# Remove old source and extract new version
rm -rf src docs
unzip ~/Downloads/ascend-v2.11.1.zip -d temp && \
  cp -r temp/* . && rm -rf temp

# Install dependencies (no new deps, but good practice)
npm install

# Verify
npm run lint      # 0 errors, 17 warnings (unchanged)
npm run build     # Should succeed
npm test          # 243 tests passing (+ 2 pre-existing failures)

# Deploy
git add .
git commit -m "v2.11.1: Add Exercise History feature

New Features:
- Exercise History view on Exercise Detail page
- Collapsible section showing all working sets (excludes warmups and skipped)
- Sets grouped by workout session date
- Supports rep-based and time-based exercises
- Prior Maxes section (renamed from Max History)

Technical:
- New components: ExerciseHistorySection, PriorMaxesSection
- CompletedSetRepo.getWorkingSetHistory() method
- 7 new repository tests
- Feature plan documentation"

git push
```

## Verification Checklist

- [ ] `npm run lint` shows 0 errors
- [ ] `npm run build` succeeds
- [ ] `npm test` shows 243+ tests passing
- [ ] Version displays as v2.11.1 in Settings tab

### Feature Verification

- [ ] Navigate to Exercises tab
- [ ] Tap on an exercise with workout history
- [ ] Verify "Exercise History" section appears (collapsed by default)
- [ ] Tap to expand - verify sessions grouped by date
- [ ] Verify warmup sets are NOT shown
- [ ] Verify skipped sets (0 reps) are NOT shown
- [ ] Verify "Show More" appears if >5 sessions exist
- [ ] For time-based exercises, verify MM:SS format
- [ ] For weighted exercises, verify weight displays
- [ ] Verify "Prior Maxes" section shows for standard exercises
- [ ] Test on different font sizes

## Rollback

If issues occur:
```bash
git revert HEAD
git push
```

No database migrations - feature uses existing data structures.

## Documentation

- Feature Plan: `docs/FEATURE_PLAN_EXERCISE_HISTORY.md`
- Architecture: `docs/ARCHITECTURE.md`
- Database Schema: `docs/DATABASE_SCHEMA.md`
