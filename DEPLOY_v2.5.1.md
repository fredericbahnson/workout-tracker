# Ascend v2.5.1 Deployment Guide

## Overview

Version 2.5.1 is a refactoring release that reorganizes the codebase without changing functionality. It implements Phase 1 and Phase 2 of the code review recommendations.

## Changes in v2.5.1

### New Files Added

**Utilities:**
- `src/utils/logger.ts` - Centralized logging with environment-aware log levels
- `src/utils/cn.ts` - Class name merging utility
- `src/utils/time.ts` - Time formatting functions (extracted from types)
- `src/utils/progression.ts` - Progression mode helpers (extracted from types)

**Constants:**
- `src/constants/training.ts` - Training-related constants (warmup, RFEM, etc.)

**Types (reorganized):**
- `src/types/exercise.ts` - Exercise-related types
- `src/types/cycle.ts` - Cycle-related types
- `src/types/workout.ts` - Workout-related types
- `src/types/forms.ts` - Form data types
- `src/types/constants.ts` - Type constants and labels

**Sync Module (extracted):**
- `src/services/sync/types.ts` - Remote (Supabase) type definitions
- `src/services/sync/transformers.ts` - Data conversion functions
- `src/services/sync/index.ts` - Barrel export

**Documentation:**
- `supabase/README.md` - Migration instructions
- `supabase/migrations/*` - Organized migration files

### Files Modified

- `src/types/index.ts` - Now re-exports from focused modules
- `src/utils/index.ts` - Exports new utilities
- `src/constants/index.ts` - Exports training constants
- `src/services/syncService.ts` - Uses extracted transformers (reduced from 716 to ~470 lines)
- `src/services/syncService.test.ts` - Updated imports for extracted transformers

### Backwards Compatibility

All existing imports continue to work. The `types/index.ts` re-exports everything including the time and progression utilities that were moved to `utils/`.

---

## Deployment Steps

### 1. GitHub Deployment

If deploying via GitHub (recommended):

```bash
# From your local machine with the ascend-v2.5.1.zip contents
cd ascend
git add -A
git commit -m "v2.5.1: Phase 1 & 2 refactoring - type system consolidation, utilities, sync module extraction"
git push origin main
```

Vercel will automatically deploy on push to main.

### 2. Manual Vercel Deployment

If not using GitHub integration:

```bash
# Extract the zip and navigate to the directory
cd ascend

# Install dependencies
npm install

# Deploy to Vercel
npx vercel --prod
```

---

## Supabase - No SQL Updates Required

**v2.5.1 does not require any database changes.** 

This is a code-only refactoring release. All database schema changes were included in v2.5.0 (warmup sets).

### For Reference: Current Migration Status

If you're setting up a new deployment, ensure these migrations have been applied:

| Migration | Required For |
|-----------|--------------|
| 001_initial_schema.sql | All versions |
| 002_delete_account.sql | All versions |
| 003_cycle_type.sql | v2.0.0+ |
| 004_time_based.sql | v2.1.0+ |
| 005_mixed_mode.sql | v2.4.0+ |
| 006_warmup_sets.sql | v2.5.0+ |

See `supabase/README.md` for detailed migration instructions.

---

## Verification Checklist

After deployment, verify:

- [ ] App loads without errors
- [ ] Can create new exercises (tests types, constants)
- [ ] Can create new cycles (tests all modes: RFEM, Simple, Mixed)
- [ ] Can complete sets (tests workout types)
- [ ] Warmup sets display correctly (tests scheduler)
- [ ] Cloud sync works (tests transformed sync module)
- [ ] Settings page works (tests app store)

---

## Build Information

| Metric | Value |
|--------|-------|
| Version | 2.5.1 |
| Tests | 154 passing |
| Bundle Size | 198.17 KB (gzipped) |
| CSS Size | 7.55 KB (gzipped) |
| Build Time | ~9 seconds |

---

## Rollback

If issues occur, rollback to v2.5.0:

```bash
git checkout v2.5.0  # or the previous commit
git push origin main --force
```

---

## What's Next

This release completes Phases 1 and 2 of the refactoring plan. Future phases will address:

- **Phase 3**: CycleWizard decomposition (extract 2,456-line file into ~13 smaller files)
- **Phase 4**: Page component refactoring (Today.tsx, Schedule.tsx)
- **Phase 5**: Scheduler refinement
- **Phase 6**: Performance optimizations (React.memo, useMemo)
- **Phase 7**: Testing and documentation improvements

See `CODE_REVIEW_v2.5.0.md` for the complete implementation plan.
