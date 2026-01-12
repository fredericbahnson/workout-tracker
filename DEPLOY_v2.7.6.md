# Ascend v2.7.6 Deployment Instructions

## Overview

This release includes three focused improvements:
1. **v2.7.4**: Centralized weight unit configuration (enables future lbs/kg support)
2. **v2.7.5**: Fixed cycle wizard layout - moved conditioning input below name row
3. **v2.7.6**: Fixed cycle wizard layout - stacked secondary badges vertically

## Changes Summary

### v2.7.6 - Badge Layout Fix
| File | Change |
|------|--------|
| `src/components/cycles/wizard/steps/GroupsStep.tsx` | Stack Cond badge below type badge |
| `src/components/cycles/wizard/components/MixedExerciseConfig.tsx` | Stack Cond/Wt badges below type badge |
| `src/components/cycles/wizard/components/ExerciseProgressionEditor.tsx` | Stack Wt badge below type badge |

**Layout Change:**
```
Before: [Push] Exercise Name With Many Words [Cond] [🗑️]
                                              ↑ squeezes name

After:  [Push]  Exercise Name With Many Words      [🗑️]
        [Cond]
```

### v2.7.5 - Input Row Fix
Moved conditioning input below exercise name row.

### v2.7.4 - Weight Unit Centralization
Created `src/constants/units.ts` with formatting utilities.

## Deployment Commands

```bash
cd /path/to/workout-tracker

# Extract
unzip ~/Downloads/ascend-v2.7.6.zip -d temp && \
  cp -r temp/* . && rm -rf temp

# Build & test
npm run build && npm test

# Deploy
git add .
git commit -m "v2.7.6: Fix cycle wizard badge layout

- Stack secondary badges (Cond, Wt) vertically below type badge
- Gives exercise names maximum horizontal space
- Shortened labels: Conditioning → Cond, Weighted → Wt

Updated: GroupsStep, MixedExerciseConfig, ExerciseProgressionEditor"
git push
```

## Verification Checklist

After deployment, verify:

- [ ] Cycle wizard: Exercise names have full width, no awkward wrapping
- [ ] Cycle wizard: Cond badge appears below type badge (e.g., Push/Cond stacked)
- [ ] Cycle wizard: Wt badge appears below type badge for weighted exercises
- [ ] Version displays as v2.7.6 in Settings

## Rollback

If issues occur:
```bash
git revert HEAD
git push
```
