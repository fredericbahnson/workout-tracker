# Ascend v2.7.5 Deployment Instructions

## Overview

This release includes two focused improvements:
1. **v2.7.4**: Centralized weight unit configuration (enables future lbs/kg support)
2. **v2.7.5**: Fixed cycle wizard layout for conditioning exercises

## Changes Summary

### v2.7.5 - Layout Fix
| File | Change |
|------|--------|
| `src/components/cycles/wizard/steps/GroupsStep.tsx` | Input field moved below exercise name row; added Cond badge |
| `src/components/cycles/wizard/types.ts` | Removed deprecated `onUpdateConditioningReps` prop |
| `src/components/cycles/CycleWizard.tsx` | Removed unused prop and destructuring |

### v2.7.4 - Weight Unit Centralization
| File | Change |
|------|--------|
| `src/constants/units.ts` | NEW - Weight unit configuration |
| `src/constants/index.ts` | Added units export |
| 10 components | Replaced hardcoded "lbs" with unit formatters |

## Deployment Commands

```bash
cd /path/to/workout-tracker

# Extract
unzip ~/Downloads/ascend-v2.7.5.zip -d temp && \
  cp -r temp/* . && rm -rf temp

# Build & test
npm run build && npm test

# Deploy
git add .
git commit -m "v2.7.5: Fix cycle wizard layout for conditioning exercises

- Move conditioning input below exercise name row to prevent text squeezing
- Add 'Cond' badge for visual clarity
- Support both rep-based and time-based conditioning exercises
- Remove deprecated onUpdateConditioningReps prop

Also includes v2.7.4: Centralized weight unit configuration"
git push
```

## Verification Checklist

After deployment, verify:

- [ ] Cycle wizard: conditioning exercise names display fully without wrapping
- [ ] Cycle wizard: conditioning exercises show "Cond" badge
- [ ] Cycle wizard: Base reps/time input appears below exercise name row
- [ ] Version displays as v2.7.5 in Settings

## Rollback

If issues occur:
```bash
git revert HEAD
git push
```
