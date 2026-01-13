# Changelog

All notable changes to Ascend are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.9.0] - 2026-01-12

### Added
- **FilterChip component**: Reusable filter chip/button for toggle-style filtering
  - Used in Exercises page for type filtering
  - Supports label, count, active state, and custom className
- **ConfirmModal component**: Generic confirmation modal for simple confirm/cancel dialogs
  - Supports primary and danger button variants
  - Loading state with customizable labels
  - Optional secondary message and custom children
- **useSettingsState hook**: Reducer-based state management for Settings page
  - Consolidates 19 useState calls into organized state groups
  - Typed actions for modals, auth, password change, loading states, and messages
  - Exported from hooks/index.ts for use in Settings page refactoring
- **useThemeEffect hook**: Consolidated theme application with system theme listener
  - Removed duplicate theme logic from App.tsx
  - Single source of truth for theme management

### Changed
- Exercises page now uses FilterChip component instead of inline buttons
- App.tsx simplified by using useThemeEffect hook
- appStore.ts exports both useThemeEffect (recommended) and useTheme (legacy)

### Technical
- Phase 3 refactoring complete
- All new components follow existing patterns and conventions
- No breaking changes - existing code continues to work

## [2.8.0] - 2026-01-12

### Added
- **ESLint configuration**: Added comprehensive linting for TypeScript and React
  - TypeScript-ESLint for type-aware linting
  - React Hooks plugin for hooks rules enforcement
  - React Refresh plugin for Vite HMR compatibility
  - Custom rules for unused variables, console statements, and more
- **Prettier configuration**: Added consistent code formatting
  - Single quotes, 2-space indentation, trailing commas
  - 100 character line width
  - Format scripts: `npm run format` and `npm run format:check`
- **Pre-commit hooks**: Added Husky + lint-staged for automated quality checks
  - Runs ESLint and Prettier on staged files before commit
  - Prevents committing code that doesn't meet quality standards

### Changed
- Formatted entire codebase with Prettier for consistency
- Added new npm scripts: `lint`, `lint:fix`, `format`, `format:check`, `prepare`

### Technical
- Phase 1 items verified complete (date utils, constants exports, timer defaults, migrations)
- Phase 2 code quality infrastructure fully implemented
- 0 linting errors, 17 warnings (intentional - warnings don't block commits)

## [2.7.7] - 2026-01-12

### Fixed
- **Cycle wizard date field overflow**: Start Date input now constrained to container width at large font sizes
- **Exercise tile contrast**: Increased contrast between exercise tiles and card background for better visual separation
  - Light mode: `bg-gray-50` → `bg-gray-100`, border `gray-200` → `gray-300`
  - Dark mode: `bg-gray-800/50` → `bg-gray-800`, border `dark-border` → `gray-700`
- **Internal dividers softened**: Reduced visibility of dividers within exercise tiles (between name row and input fields)
  - Creates clearer visual association between exercise name and its configuration
  - More obvious separation between different exercise tiles

### Changed
- Applied consistent styling across GroupsStep, MixedExerciseConfig, and ExerciseProgressionEditor

## [2.7.6] - 2026-01-12

### Fixed
- **Cycle wizard layout (continued)**: Secondary badges (Cond, Wt) now stack vertically below exercise type badge
  - Gives exercise names maximum horizontal space
  - Prevents awkward text wrapping on narrow screens
  - Shortened badge labels: "Conditioning" → "Cond", "Weighted" → "Wt"
  - Applied consistently across GroupsStep, MixedExerciseConfig, and ExerciseProgressionEditor

## [2.7.5] - 2026-01-12

### Fixed
- **Cycle wizard layout**: Conditioning exercise input fields now appear below the exercise name row instead of inline
  - Prevents exercise names from being squeezed into narrow columns on mobile
  - Added "Cond" badge for visual clarity
  - Now properly supports both rep-based and time-based conditioning exercises
  
### Changed
- Simplified `GroupsStep` component by using `onUpdateAssignment` for conditioning exercises
- Removed deprecated `onUpdateConditioningReps` prop from `GroupsStepProps` interface

## [2.7.4] - 2026-01-12

### Changed
- **Centralized weight unit configuration**: All hardcoded "lbs" strings (20+ locations) now use centralized constants
  - Created `src/constants/units.ts` with `WEIGHT_UNIT` configuration and formatting utilities
  - `formatWeight(value)` - formats as "20 lbs"
  - `formatWeightAt(value)` - formats as "@ 20 lbs" for combined displays
  - `formatWeightIncrement(value)` - formats as "+5 lbs" for progression displays
  - `formatWeightLabel(text)` - formats as "Weight (lbs)" for input labels
  - `getWeightUnitLabel()` - returns unit string for inline use

### Technical
- Enables future support for user-selectable weight units (lbs vs kg)
- Updated components: ExerciseCard, ExerciseForm, MaxRecordForm, QuickLogForm, EditCompletedSetModal, ReviewStep, SimpleProgressionFields, ExerciseProgressionEditor, ExerciseDetail, ScheduledSetsList

## [2.7.3] - 2026-01-11

### Fixed
- **Time display in Exercises tab**: Time-based exercises now display duration in MM:SS format without redundant "sec" label (e.g., "Max: 1:30" instead of "Max: 1:30 sec")

## [2.7.2] - 2026-01-11

### Added
- **Continue to next workout after ad-hoc**: After completing an ad-hoc workout, users now see "Continue to Next Workout" button to proceed to their next scheduled workout

## [2.7.1] - 2026-01-11

### Fixed
- **Today view layout**: Removed swipe hint arrow that overlapped with goal reps/time at larger font sizes

## [2.7.0] - 2026-01-11

### Added
- **Standard and Advanced app modes**: Users can now choose between simplified (Standard) or full-featured (Advanced) interfaces
  - Standard mode: RFEM-based training cycles and max testing only
  - Advanced mode: All cycle types including Simple Progression and Mixed cycles
- **App Mode setting in Settings page**: New radio-style selector under Appearance section
- **Cross-device sync for app mode**: Mode preference syncs via Supabase like other user preferences

### Changed
- CycleTypeSelector now conditionally displays cycle options based on selected app mode
- New users default to Standard mode for a streamlined experience

### Technical
- Added `AppMode` type to preferences system
- Extended `UserPreferences` interface with `appMode` field
- Updated sync transformers to handle `app_mode` field
- Added `setAppMode` to `UserPreferencesRepo` and `SyncedPreferencesContext`

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
