# Changelog

All notable changes to Ascend are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.6.5] - 2026-01-11

### Fixed
- **Duplicate cleanup now syncs to cloud**: "Fix Duplicate Workouts" button now also soft-deletes duplicates from the cloud, preventing them from returning on app restart
- **Duplicate prevention in sync**: `pullFromCloud` now skips workouts that would create duplicates (same cycle + sequence number as existing local workout)

## [2.6.6] - 2026-01-11

### Fixed
- **Duplicate workout cleanup now properly syncs to cloud**: Cleanup button now returns success/failure feedback and properly soft-deletes duplicates in Supabase
- **Removed post-cleanup sync** that was re-fetching duplicates from cloud
- **Duplicate prevention in pullFromCloud**: Sync now skips remote workouts that would create cycle+sequence duplicates with existing local workouts

## [2.6.5] - 2026-01-11

### Fixed
- **Duplicate workout prevention**: Enhanced pullFromCloud to intelligently handle workout conflicts
  - Compares warmup sets when detecting duplicates - prefers version with warmups
  - Hard deletes duplicate workouts from cloud instead of soft delete
  - More robust sequence number validation
- **Cleanup button**: Now uses hard delete to permanently remove duplicates from cloud

### Added
- `hardDeleteItem` function in SyncService for permanent cloud deletion
- Debug logging for workout merge decisions

## [2.6.4] - 2026-01-11

### Added
- **Fix Duplicate Workouts** button in Settings > Data Management for cleaning up sync-related data corruption

### Fixed
- Improved duplicate workout detection and cleanup logic

## [2.6.3] - 2026-01-11

### Fixed
- **Sync queue processing order**: Process queued deletions before pulling from cloud on app startup, preventing deleted workouts from reappearing
- **Cycle wizard sync**: All cycle edits and workout changes now sync to cloud immediately, including deletions

## [2.6.2] - 2026-01-11

### Fixed
- **Warmup set calculation**: Warmup sets now correctly use their stored warmupPercentage (20% and 40%) instead of a fixed 20% for all warmups
- **Conditioning increment preservation**: Editing a cycle now correctly preserves a conditioning increment of 0 instead of defaulting to 10

### Added
- Tests for warmup percentage calculation with different values

## [2.6.1] - 2026-01-11

### Fixed
- Minor warmup calculation refinements

## [2.6.0] - 2026-01-11

### Added
- **Synced Training Preferences**: Training-related preferences now sync across devices via Supabase
  - Default Max Reps (RFEM calculations)
  - Default Conditioning Reps
  - Conditioning Weekly Increment
  - Weekly Set Goals (per exercise type)
  - Rest Timer settings
  - Max Test Rest Timer settings
- New `user_preferences` table in Supabase with RLS policies
- `SyncedPreferencesContext` for reactive preference access
- IndexedDB schema version 3 with preferences table
- Export/import now includes preferences (backup format v2)

### Changed
- UI preferences (theme, font size, rep display mode) remain local-only
- AppStore simplified to only handle UI preferences

## [2.5.5] - 2026-01-11

### Added
- React.memo optimization for Badge, Card, CardHeader, CardContent, CardFooter, Input components
- useMemo/useCallback optimization for Today.tsx and Schedule.tsx computed values
- Loading skeleton components (`src/components/ui/Skeleton.tsx`):
  - Skeleton, SkeletonText
  - WorkoutCardSkeleton, SetListSkeleton
  - ScheduleListSkeleton, ExerciseListSkeleton
  - StatsCardSkeleton, PageSkeleton
- Tailwind class utilities (`src/styles/classes.ts`)
- Additional warmup edge case tests (5 new tests)
- Enhanced ErrorBoundary with "Copy Error Details" button
- JSDoc documentation for scheduler.ts exported functions
- This CHANGELOG file

### Changed
- NumberInput and TimeDurationInput refactored with React.memo and centralized input styles
- Input component now uses shared class utilities for consistency

## [2.5.4] - 2026-01-11

### Changed
- **Schedule.tsx**: Refactored from 1,030 → 616 lines (-40%)
- **Settings.tsx**: Refactored from 822 → 673 lines (-18%)

### Added
- Schedule page modals extracted to `src/components/schedule/`:
  - WorkoutPreviewModal
  - WorkoutHistoryModal
  - DeleteWorkoutModal
  - CalendarDateModal
- Settings page modals extracted to `src/components/settings/`:
  - AuthModal
  - DeleteAccountModal
  - ChangePasswordModal
  - ClearDataModal
- Inline helper components in Schedule.tsx (ViewToggle, CycleProgressCard, etc.)

## [2.5.3] - 2026-01-11

### Changed
- **CycleWizard.tsx**: Decomposed into modular architecture
- Extracted to `src/components/cycles/wizard/`:
  - useCycleWizardState hook (622 lines)
  - 6 step components (1,012 lines)
  - 6 shared components (804 lines)
  - Comprehensive type definitions (207 lines)

## [2.5.2] - 2026-01-10

### Added
- Consolidated modal state management with useTodayModals hook
- Improved TypeScript types across components

### Changed
- Today.tsx modals now use centralized state management

## [2.5.1] - 2026-01-10

### Added
- Centralized logging utility (`src/utils/logger.ts`)
- Class name merging utility (`src/utils/cn.ts`)
- Time formatting utilities (`src/utils/time.ts`)
- Progression mode helpers (`src/utils/progression.ts`)
- Training constants (`src/constants/training.ts`)
- Reorganized type system with separate files per domain

### Changed
- Sync module extracted to `src/services/sync/`
- All imports converted to `@/` path aliases
- Logger replaces console.log throughout codebase

## [2.5.0] - 2026-01-10

### Added
- Mixed Cycle Mode: Configure RFEM or Simple progression per-exercise
- Smart defaults: Remember last-used settings for each exercise
- Per-exercise warmup toggle in mixed mode

### Changed
- Cycle wizard updated with mixed mode step
- Exercise assignments store progression mode settings

## [2.4.3] - 2026-01-09

### Added
- Mixed Cycle Mode functionality
- Per-exercise progression mode configuration
- Smart defaults for exercise settings

## [2.2.1] - 2026-01-08

### Fixed
- Next workout navigation bug where completed/skipped workouts would incorrectly appear
- Race condition in workout status query refresh

### Changed
- Added dismissedWorkoutId state tracking
- Query now explicitly skips dismissed workouts

## [2.2.0] - 2026-01-08

### Added
- Path aliases (`@/`) for all imports (141 imports updated)
- Modal focus trapping for accessibility
- SwipeableSetCard keyboard support (Enter, Space, Arrow keys)
- ARIA attributes for screen readers

### Changed
- UI standardization across components
- Improved focus indicators for keyboard navigation

## [2.1.0] - 2026-01-08

### Added
- Custom hooks extracted from Today.tsx:
  - useWorkoutDisplay (158 lines)
  - useCycleCompletion (133 lines)
  - useAdHocWorkout (164 lines)
- Exponential backoff for sync retry logic

### Changed
- Today.tsx reduced from 1,635 → 762 lines (53% reduction)
- Total of 4 custom hooks now managing Today page state

## [2.0.0] - 2026-01-07

### Added
- 14 components extracted from Today.tsx to `src/components/workouts/today/`:
  - WorkoutCompletionBanner
  - ScheduledSetsList
  - WorkoutHeader
  - AdHocWorkoutControls
  - EditCompletedSetModal
  - ScheduledSetModal
  - TodayStats
  - AdHocCompletedSetsList
  - WorkoutActionButtons
  - CycleProgressHeader
  - ConfirmationModals (4 dialogs)
  - ExercisePickerModal
  - RenameWorkoutModal

### Changed
- Today.tsx reduced from 1,635 → 932 lines (43% reduction)
- Improved state management with component-local state

## [1.0.0] - 2026-01-01

### Added
- Initial release
- RFEM-based progression system
- Training cycles with exercise groups
- Cloud sync with Supabase
- Offline-first PWA architecture
- Swipe gestures for set completion
- Rest timer with configurable duration
- Weight tracking for weighted exercises
- Dark mode support
- Data export/import functionality

---

## Version Naming

- **Major** (X.0.0): Breaking changes or major feature additions
- **Minor** (0.X.0): New features, backward compatible
- **Patch** (0.0.X): Bug fixes and minor improvements
