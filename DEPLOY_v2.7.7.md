# Ascend v2.7.7 Deployment Instructions

## Overview

This release includes UI fixes for the cycle creation/editing wizards:
1. **v2.7.4**: Centralized weight unit configuration
2. **v2.7.5**: Cycle wizard layout - moved conditioning input below name row
3. **v2.7.6**: Cycle wizard layout - stacked secondary badges vertically
4. **v2.7.7**: Cycle wizard - fixed date field overflow, improved tile contrast

## Changes Summary

### v2.7.7 - Date Field & Tile Contrast Fixes
| File | Change |
|------|--------|
| `src/components/cycles/wizard/steps/BasicsStep.tsx` | Constrain date input to container width |
| `src/components/cycles/wizard/steps/GroupsStep.tsx` | Increase tile contrast, soften internal dividers |
| `src/components/cycles/wizard/components/MixedExerciseConfig.tsx` | Increase tile contrast, soften internal dividers |
| `src/components/cycles/wizard/components/ExerciseProgressionEditor.tsx` | Increase tile contrast, soften internal dividers |

**Visual Changes:**
- Exercise tiles now have stronger contrast against card background
- Internal dividers (within tiles) are more subtle
- Date input no longer overflows at large font sizes

## Deployment Commands

```bash
cd /path/to/workout-tracker

# Extract
unzip ~/Downloads/ascend-v2.7.7.zip -d temp && \
  cp -r temp/* . && rm -rf temp

# Build & test
npm run build && npm test

# Deploy
git add .
git commit -m "v2.7.7: Fix cycle wizard date overflow and tile contrast

- Constrain Start Date input to container width at large font sizes
- Increase exercise tile contrast for better visual separation
- Soften internal dividers to associate inputs with exercise names
- Applied consistently across all wizard components"
git push
```

## Verification Checklist

After deployment, verify:

- [ ] Cycle wizard: Start Date field stays within bounds at XL font size
- [ ] Cycle wizard: Exercise tiles are clearly distinct from card background
- [ ] Cycle wizard: Internal dividers within tiles are subtle
- [ ] Version displays as v2.7.7 in Settings

## Rollback

If issues occur:
```bash
git revert HEAD
git push
```
