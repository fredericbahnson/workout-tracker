# Changelog

All notable changes to Ascend are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.18.8] - 2026-01-24

### Fixed
- **RFEM Calculator Slider**: Fixed interactive slider not responding to touch on iOS by improving touch event handling and adding proper thumb styling for WebKit

## [2.18.7] - 2026-01-24

### Changed
- **Delete Account Warning**: Added prominent warning that in-app purchases will be lost and require re-purchase if user creates a new account

## [2.18.6] - 2026-01-24

### Added
- **Website Link**: Added link to www.fredericbahnson.com/ascend in the About section of Settings

### Fixed
- **RFEM Guide Icon**: Removed extra color background from app icon on first slide of "Learn about RFEM training" module

## [2.18.5] - 2026-01-24

### Changed
- **Branding Update**: Changed "Progressive calisthenics training" to "Progressive fitness training" throughout the app (login screen, About section, onboarding)

## [2.18.4] - 2026-01-24

### Fixed
- **Entitlement Bug for Purchased Users in Standard Mode**: Users who purchased Advanced but are using Standard mode now see a simple "Switch to Advanced Mode?" prompt instead of the paywall when accessing Advanced features
  - Shows purple Zap icon instead of amber lock
  - Displays appropriate message acknowledging their purchase
  - Single "Enable Advanced Mode" button instead of purchase options
  - Hides trial banners and feature comparisons since they already own Advanced

## [2.18.3] - 2026-01-24

### Changed
- **Settings Reorganization**: Consolidated all data management actions into a single "Data Management" section
  - Moved "Clear Workout History" and "Delete Account" from Account section to Data Management
  - Ordered actions by increasing impact: Clear Workout History → Clear All App Data → Delete Account
  - Renamed "Clear All Data" to "Clear All App Data" for clarity
  - Added "Danger Zone" label for destructive actions
  - Moved Data Management section to bottom of Settings (after Help & Guides)

## [2.18.2] - 2026-01-24

### Fixed
- **Max Testing Navigation**: Fixed bug where exiting max cycle creation after starting from cycle completion card would navigate to a random old workout instead of returning to the completion modal
- **Max Testing Wizard Consistency**: Unified max testing wizard experience - both entry points (after cycle completion and from Create New Cycle) now show all exercises for selection rather than pre-populating from completed cycle

### Changed
- **Max Testing Visual Style**: Changed "MAX" indicator and "Max Test" badge from purple to blue to better match the app's color scheme
- **Ad-Hoc Workouts in Max Testing**: Added "Log Ad-Hoc Workout" button to max testing cycles, matching standard workout behavior

### Added
- **Clear Workout History**: New option in Settings (Account & Sync section) to start fresh without losing exercises or max records
  - Clears all completed sets, cycles, and scheduled workouts
  - Preserves exercise library, personal records (PRs), account, and settings
  - Syncs deletions to cloud for signed-in users
  - Includes clear warning about permanent data loss

### Removed
- **Fix Duplicate Workouts**: Removed the temporary troubleshooting function from Settings that was added during an earlier bug fix

## [2.17.1] - 2026-01-23

### Fixed
- **Weight Display**: Exercises with added weight now show scheduled weight on exercise tiles in Today workout view and schedule preview for future workouts
- **Mixed Mode Progression**: Simple progression exercises in Mixed cycles no longer incorrectly have reps adjusted by RFEM amount
- **Exercise Timer Sounds**: Timer countdown beeps and completion sound now work correctly on second and subsequent sets of the same exercise
- **Swipe Hint Text**: Updated hint to "Tap to edit details" for clearer functionality cue

## [2.17.0] - 2026-01-15

### Added
- **Capacitor Integration**: iOS App Store deployment infrastructure
  - Capacitor configuration for iOS native builds
  - RevenueCat IAP service with purchase/restore functionality
  - Connected haptics hook to @capacitor/haptics
  - Connected keyboard hook to @capacitor/keyboard
  - Paywall modal now handles real purchases on native
  - Auth provider syncs user ID with RevenueCat for cross-device purchases

### Technical
- Added @capacitor/core, @capacitor/cli, @capacitor/ios, @capacitor/haptics, @capacitor/keyboard, @capacitor/status-bar, @capacitor/app
- Added @revenuecat/purchases-capacitor for in-app purchases
- New cap:sync, cap:open, cap:build npm scripts

## [2.16.1] - 2026-01-15

### Changed
- **Today View Swipe Indicator**: Replaced exercise number and empty circle with back-to-back chevrons (‹›) as a visual hint for swipeability
  - Cleaner, more intuitive indicator that the tile is interactive
  - Removed set number display (1w, 2, 3, etc.) from left side of exercise tiles
- **Schedule Tab Set Counts**: Warmup sets are now excluded from all set count displays
  - Workout tiles show only work sets in the total count
  - Exercise type badges (Push, Pull, etc.) count only work sets
  - Provides more accurate representation of actual training volume

## [2.16.0] - 2026-01-15

### Added
- **iOS Preparation Hooks**: Created native-ready hooks with web fallbacks for future Capacitor integration
  - `useHaptics`: Provides haptic feedback using Vibration API (web) with Capacitor Haptics ready
    - `impact(style)`: Light/medium/heavy physical feedback
    - `notification(type)`: Success/warning/error semantic feedback
    - `selection()`: Light tap for UI selections
  - `useKeyboardHeight`: Tracks virtual keyboard height using visualViewport API (web) with Capacitor Keyboard ready
    - Returns `keyboardHeight`, `isKeyboardVisible`, `isSupported`
    - Enables proper input positioning when keyboard is open
- **Safe Area CSS Variables**: Added CSS custom properties for safe area insets
  - `--safe-area-inset-top/right/bottom/left` with env() fallbacks
  - New utility classes: `.safe-area-x`, `.safe-area-y`, `.safe-area-all`
- **Entitlement Integration Tests**: Added comprehensive test suite (38 tests)
  - Trial service tests: start, status, expiration, persistence
  - Entitlement service tests: access levels, feature gating, lock reasons
  - Integration tests: full trial lifecycle, state consistency

### Changed
- **Deprecated `useTheme` hook**: Added deprecation notice recommending `useThemeEffect` instead
  - `useThemeEffect` automatically applies theme changes via useEffect
  - `useTheme` requires manual `applyTheme()` calls
- **AppearanceSection**: Updated to use `useThemeEffect` instead of deprecated `useTheme`

### Technical Details
- iOS hooks designed for drop-in Capacitor plugin integration
- Web fallbacks provide graceful degradation
- Test count increased from 246 to 284 (+38 entitlement tests)

## [2.15.0] - 2026-01-15

### Changed
- **Settings Page Architecture Refactoring**: Decomposed monolithic Settings.tsx (1,162 lines) into focused section components for improved maintainability
  - Created `settingsSections/` subdirectory with 7 specialized section components
  - `AccountSection.tsx` (288 lines): Authentication, cloud sync, account management
  - `AppearanceSection.tsx` (234 lines): Theme, app mode, font size
  - `DataSection.tsx` (221 lines): Export, import, clear data, cleanup duplicates
  - `TimerSection.tsx` (190 lines): Rest timer settings and volume controls
  - `TrainingSection.tsx` (97 lines): Default values and display settings
  - `HelpSection.tsx` (95 lines): Help guides and about info
  - `SubscriptionSection.tsx` (47 lines): Trial banner and subscription status
  - Settings.tsx reduced to 67-line orchestrator (94% reduction)

### Technical Details
- Each section component is self-contained with its own state management
- Shared types extracted to `settingsSections/types.ts`
- Clean re-exports through `settingsSections/index.ts`
- Directory named `settingsSections` to avoid case-sensitivity conflicts on macOS
- No functional changes - pure structural refactoring

## [2.14.1] - 2026-01-15

### Changed
- **Performance: Bundle Size Optimization** - Reduced main bundle from 811 kB to 117 kB (85% reduction)
  - Implemented vendor chunk splitting: react (164 kB), supabase (172 kB), dexie (97 kB), lucide-react (30 kB)
  - Implemented route-based lazy loading for all page components
  - Pages now load on-demand with Suspense fallback skeleton
  - Removed ineffective dynamic imports from AuthProvider (replaced with static imports)
  
### Technical Details
- Added `build.rollupOptions.output.manualChunks` configuration to `vite.config.ts`
- Converted all page imports to use `React.lazy()` with named export wrapper pattern
- Wrapped Routes in `<Suspense fallback={<PageSkeleton />}>` for loading states
- Vendor chunks improve cache hit rates for returning users (these change less frequently)

### Bundle Breakdown
| Chunk | Size (gzip) |
|-------|-------------|
| Main bundle | 117 kB (30 kB) |
| vendor-supabase | 172 kB (45 kB) |
| vendor-react | 164 kB (53 kB) |
| vendor-dexie | 97 kB (32 kB) |
| Today page | 62 kB (16 kB) |
| Settings page | 32 kB (7 kB) |

## [2.14.0] - 2026-01-15

### Changed
- **Context Architecture Refactoring**: Reorganized all React context files to resolve HMR warnings and improve maintainability
  - Split `AuthContext.tsx` into `auth/` subdirectory with separate Provider, hook, and types files
  - Split `SyncContext.tsx` into `sync/` subdirectory with separate Provider and hook files
  - Split `EntitlementContext.tsx` into `entitlement/` subdirectory with separate Provider and hook files
  - Split `SyncedPreferencesContext.tsx` into `preferences/` subdirectory with separate Provider and hook files
  - Each context now follows the pattern: `Context.ts`, `Provider.tsx`, `use*.ts`, `types.ts`, `index.ts`
  - No functional changes - pure structural refactoring

### Fixed
- **ESLint Warnings Eliminated**: Resolved all 20 ESLint warnings
  - Fixed 10 unused error variable warnings in `Settings.tsx` and `audio.ts` (renamed `e` → `_e` or added logging)
  - Fixed 7 Fast Refresh HMR warnings by separating context providers from hooks
  - Fixed 2 console statement warnings in `logger.ts` with inline ESLint exceptions
  - Fixed 1 missing useEffect dependency in `useCycleCompletion.ts`
- **Improved Error Logging**: Added proper error logging to all catch blocks in Settings page
  - Uses scoped logger (`log.error`) for consistent debugging across the app

## [2.13.9] - 2026-01-14

### Changed
- **Timer Volume Default**: Changed default from 40% to 100%
  - Volume is relative to system volume (100% = full system volume)
  - Users can turn it down from there if needed
- **Timer Volume UI**: Added helper text clarifying volume is relative to system volume
- **Unmute Button**: Now restores to 100% instead of 40%

## [2.13.8] - 2026-01-14

### Fixed
- **RFEM Guide Animation Layout Shifts**: Replaced animated RFEM wave chart with static SVG
  - Removed `RFEMWaveAnimation` component entirely (was causing layout jumps on different font sizes)
  - Static chart now shows the wave pattern with fixed "RFEM rotates: 3 → 4 → 5 → 4" label

- **Accidental Taps While Scrolling**: Added vertical movement tracking to swipeable components
  - Now tracks both horizontal AND vertical finger movement
  - If vertical movement exceeds 10px, gesture is treated as scroll (not tap)
  - Prevents accidentally opening exercises/workouts when trying to scroll

### Added
- **Max Testing Warmup Reminder**: Added amber warning box at top of Max Testing workouts
  - Reminds users: "Warm up first! Before attempting each max test, do 2-3 lighter warmup sets"
  - Only shows during active max testing workouts (not completed/ad-hoc)

### Changed
- **Default Preferences for New Users**:
  - `appMode` now defaults to `'advanced'` (trial users see all features)
  - Weekly set goals for core, balance, mobility, other now default to 10 (was 0)

## [2.13.7] - 2026-01-14

### Fixed
- **Critical: Premature Cycle Completion Bug** - Fixed race condition where cycle was marked complete before final set was logged
  - Root cause: Completion check used stale React state (`completedScheduledSetIds.size + 1`) instead of actual DB count
  - Fix: Added `CompletedSetRepo.countCompletedScheduledSets()` method that queries actual DB count
  - Updated `handleQuickComplete`, `handleConfirmSkipSet`, and `handleSaveSet` to use DB counts
  
- **Cycle Completion Dismiss Behavior** - Fixed issue where dismissing cycle completion modal ejected user from their workout
  - Root cause: `handleDismissCycleCompletion` marked cycle as `status: 'completed'`, causing `CycleRepo.getActive()` to return null
  - Fix: Dismissing modal no longer marks cycle completed; cycle only marked completed when user explicitly creates new cycle or starts max testing
  - Added `cycleCompleteDismissed` state to track when modal was dismissed
  - User now stays on their completed workout view after dismissing

### Added
- **Inline Cycle Complete Actions**: When user dismisses cycle completion modal, shows card with:
  - "Test New Maxes" button to reopen cycle completion flow
  - "Create New Cycle" button to proceed directly to cycle creation
- Added `handleShowCycleCompletionModal` handler to reopen completion modal

## [2.13.6] - 2026-01-14

### Added
- **Max Testing Wizard Back Button**: Added back button on first step of Max Testing wizard
  - Back button now appears on all steps (previously only on steps 2+)
  - On first step, returns to cycle type selector
  - Consistent navigation behavior with training cycle wizard

## [2.13.5] - 2026-01-14

### Fixed
- **Cycle Wizard Back Button**: Back button on Basics step now returns to cycle type selector
  - Previously closed the wizard entirely, returning to Schedule page
  - Added `onBackToSelector` callback to properly navigate back to cycle type selection

### Changed
- **Cycle Type Selector Order**: Reordered options to group RFEM workflow together
  - Order is now: RFEM Training → Max Testing → Simple Progression → Mixed
  - Groups the core RFEM workflow (training + max testing) at the top
  - Locked Advanced options (Simple/Mixed) now appear at the bottom

## [2.13.4] - 2026-01-14

### Fixed
- **Cycle Wizard Default Names**: Default cycle names now appear in the Cycle Name field
  - "RFEM Cycle 1", "Progression Cycle 1", etc. now properly populate on wizard open
  - Previously showed only placeholder text "e.g., Winter 2025 Block 1"
  - Fixed by adding effect to set default name once cycle data loads

- **Cycle Wizard Back Button**: Fixed incorrect navigation when pressing Back on first step
  - Previously took user to an unintended "start" step when coming from cycle type selector
  - Now properly exits the wizard back to cycle type selection

## [2.13.3] - 2026-01-14

### Changed
- **Schedule Tab Completed Workouts**: Improved display of completed workout history
  - Completed workouts now sorted by completion time (most recent at top)
  - Ad-hoc workouts appear in chronological position with scheduled workouts
  - All completed workouts now display completion date (e.g., "Tue, Jan 14 • 8 sets")
  - Skipped workouts remain in separate section sorted by sequence

## [2.13.2] - 2026-01-14

### Added
- **Smart Default Cycle Names**: Cycles now auto-generate descriptive names based on type
  - Training cycles: "RFEM Cycle 1", "Progression Cycle 2", "Mixed Cycle 1"
  - Max testing: "Max Testing Cycle 1", "Max Testing Cycle 2"
  - Count is based on total cycles of that type (not just completed ones)
  - Users can still edit the name in the Basics step

## [2.13.1] - 2026-01-14

### Fixed
- **TrialBanner light mode**: Fixed styling to be readable in both light and dark modes
  - Added proper light mode colors for trial active, ending soon, and expired states
  - Compact and full variants now both support dark: prefixed classes

### Changed
- **Removed Start Date field from Cycle Wizard**: Cycles now automatically start "today"
  - Removed date picker from Basics step
  - Removed start date display from Review step
  - startDate is still tracked internally for stats filtering (Progress, Exercise Detail)
  - Matches existing MaxTestingWizard behavior which already defaulted to today

## [2.13.0] - 2026-01-14

### Added
- **Comprehensive Onboarding Redesign**: Complete overhaul of new user experience
  - **Welcome Screen**: Sets expectations with 2-minute overview promise
  - **RFEM Training Guide** (5 slides): Deep-dive into RFEM methodology
    - Problem with training to failure explained
    - Interactive RFEM calculator demo (adjust max reps to see target calculations)
    - Progress comparison chart (failure vs RFEM training curves)
    - Animated RFEM rotation wave showing workout-by-workout periodization
    - Acknowledgment of alternative progression modes (Simple, Mixed, Conditioning)
  - **App Tour** (4 slides): Visual walkthrough of key features
    - Today page with swipe gesture demo mockups
    - Exercises page with filtering and max tracking
    - Schedule page with calendar preview
    - Progress page with stats visualization
  - **Exercise Creation Step**: Streamlined first exercise creation
  - **Success Screen**: Clear next steps after first exercise

- **Revisitable Help Guides**: Access onboarding content anytime from Settings
  - New "Help & Guides" section in Settings page
  - "Learn About RFEM Training" - standalone RFEM guide access
  - "App Tour" - standalone feature walkthrough
  - Both guides work as full-screen overlays with skip functionality

### Changed
- **Onboarding Architecture**: Modular component system
  - `OnboardingFlow` orchestrates Welcome → RFEM → Tour → Exercise Creation
  - `RFEMGuide` and `AppTour` work both embedded and standalone
  - Shared `OnboardingSlide` and `OnboardingProgress` components
  - Visual components in `visuals/` directory for interactive elements

### Technical
- New component structure in `src/components/onboarding/`:
  - `types.ts` - TypeScript definitions for onboarding
  - `OnboardingSlide.tsx` - Shared slide layout with animations
  - `OnboardingProgress.tsx` - Progress indicator with module breaks
  - `RFEMGuide.tsx` - RFEM training module (5 slides)
  - `AppTour.tsx` - App feature tour (4 slides)
  - `visuals/RFEMCalculator.tsx` - Interactive max/target calculator
  - `visuals/ProgressComparisonChart.tsx` - SVG comparison chart
  - `visuals/RFEMWaveAnimation.tsx` - Animated periodization wave
- Settings page updated with Help & Guides section
- Previous onboarding preserved as `OnboardingFlowLegacy.tsx` for reference

## [2.12.1] - 2026-01-13

### Added
- **Timer Volume Control**: New setting to control the volume of timer sounds
  - Slider control (0-100%) in Settings under Rest Timer section
  - One-tap mute button to quickly silence/unmute
  - Test button to preview sound at current volume
  - Applies to both rest timers and exercise timers (countdown beeps and completion sounds)
  - Volume preference syncs across devices
  - Default volume: 40% (matches previous behavior)

### Fixed
- **Start Date field truncation**: Date input in cycle wizard basics step no longer gets clipped at right edge on large font sizes
  - Removed overflow-hidden wrapper, added proper width constraint
  - Calendar picker indicator now aligns properly

### Changed
- **Wizard width optimization**: Increased content width in cycle and max testing wizards
  - Full-size modal margin reduced from 16px to 8px per side
  - Full-size modal content padding reduced from 16px to 8px
  - Wizard step content horizontal padding reduced from 16px to 8px
  - Group cards padding reduced from 12px to 8px
  - MixedExerciseConfig tile padding reduced from 12px to 8px
  - Total horizontal space savings: ~24px per side, giving exercise names more room

### Technical
- New shared audio utility (`src/utils/audio.ts`) centralizes beep/sound functions
- `timerVolume` field added to UserPreferences (syncs via Supabase)
- RestTimer and ExerciseTimer components now accept volume prop
- New Supabase migration: `003_timer_volume.sql`

## [2.12.0] - 2026-01-13

### Added
- **Entitlement System for IAP Readiness**: Infrastructure to support iOS App Store in-app purchases
  - `EntitlementProvider` context provides global access to trial/purchase state
  - `PaywallModal` for purchase/upgrade prompts with tier comparison
  - `TrialBanner` component (compact and full variants) for trial status display
  - Types in `types/entitlement.ts`: `PurchaseTier`, `TrialStatus`, `LockReason`, etc.
  
- **Free Trial System**: 4-week trial starts automatically on first app launch
  - Trial status persisted to localStorage
  - Full Advanced access during trial period
  - Services: `trialService.ts`, `entitlementService.ts`
  
- **Settings Subscription Display**: Shows trial status and subscription info
  - Trial banner shows days remaining with urgency when ending (≤7 days)
  - Subscription card shows tier (Standard/Advanced) and renewal info
  - Hidden when not applicable

### Changed
- **CycleTypeSelector**: Advanced cycle types (Simple Progression, Mixed) now show as locked
  - Visible but disabled with lock icon and "Advanced" badge
  - Clicking opens paywall with contextual upgrade messaging
  - Fully accessible during trial or with Advanced purchase
  
- **Settings App Mode**: Advanced mode toggle gated by entitlement
  - Lock icon and "Upgrade" badge when not entitled
  - Paywall opens on click if locked
  - Free switching for users with Advanced access

### Technical
- New context: `EntitlementContext` with hooks `useEntitlement`, `useFeatureAccess`, `useGatedAction`
- Feature gating: effective access = max(purchase tier, trial status)
- Lock reasons: `trial_expired`, `standard_only`, `not_purchased`
- Web PWA: full access during trial; ready for Capacitor IAP integration
- New services: `trialService.ts`, `entitlementService.ts`
- New components: `PaywallModal`, `TrialBanner`

### Notes
- This version prepares the app for iOS App Store deployment
- IAP purchase flows are placeholders; will be implemented with Capacitor
- See `docs/IOS_APP_STORE_DEPLOYMENT_PLAN.md` for full deployment roadmap

### Fixed
- **syncService.test.ts**: Added missing `userPreferences` mock to db mock factory
  - Two tests were failing due to incomplete mock setup after userPreferences sync was added
  - All 246 tests now pass
- **dateUtils.test.ts**: Fixed timezone-sensitive test assertion
  - `converts date string without timezone to Date` test used local time methods on a UTC-parsed date
  - Changed to use `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()` for consistent results across timezones

## [2.11.1] - 2026-01-13

### Added
- **Exercise History View**: New collapsible section on Exercise Detail page showing all working sets
  - Displays workout sessions grouped by date (newest first)
  - Excludes warmup sets and skipped sets (0 reps) to show only meaningful training data
  - Supports both rep-based and time-based exercises
  - Shows weight when enabled for the exercise
  - Expand/collapse toggle with session count indicator
  - "Show More" pagination for exercises with extensive history
  - Empty state for exercises without workout history

- **Prior Maxes Section**: Redesigned max history display for standard exercises
  - Renamed from "Max History" to "Prior Maxes"
  - Date-first layout for better visual consistency with Exercise History
  - Maintains all existing functionality (weight display, current badge, notes)

- **Data Layer Enhancement**
  - `CompletedSetRepo.getWorkingSetHistory()`: New method to retrieve non-warmup, non-skipped sets
  - Efficiently filters warmup sets by looking up scheduled set metadata
  - Excludes sets with 0 reps (skipped sets)
  - Groups completed sets by calendar day into workout sessions

### Changed
- Exercise Detail page now shows both Prior Maxes and Exercise History sections
- Exercise History available for all exercise types (standard and conditioning)
- Improved visual hierarchy on Exercise Detail page

### Technical
- New components: `ExerciseHistorySection`, `PriorMaxesSection`
- 7 new repository tests for `getWorkingSetHistory()` method
- Feature plan documented in `docs/FEATURE_PLAN_EXERCISE_HISTORY.md`

## [2.10.0] - 2026-01-13

### Added
- **Phase 4: Testing Expansion** — 49 new tests (237 total, up from 188)
  - `useWorkoutDisplay.test.ts`: 14 tests for workout display state management
  - `useAdHocWorkout.test.ts`: 18 tests for ad-hoc workout operations
  - `transformers.test.ts`: 17 tests for sync data transformations
  - Test setup infrastructure with React Testing Library and jsdom
  - Created `src/test/setup.ts` for common test configuration

- **Phase 5: Documentation**
  - `docs/ARCHITECTURE.md`: Complete architecture overview
    - Tech stack, directory structure, data flow diagrams
    - Key systems (scheduler, sync, state management)
    - Component architecture and PWA features
  - `docs/DATABASE_SCHEMA.md`: Comprehensive database documentation
    - Local (IndexedDB) and remote (Supabase) schemas
    - All tables with field types and indexes
    - Data transformation examples and sync strategy
  - JSDoc documentation for all repository methods
    - ExerciseRepo, MaxRecordRepo, CompletedSetRepo
    - CycleRepo, ScheduledWorkoutRepo
  - Updated CSS documentation for dark surface utility classes

### Changed
- Updated vite.config.ts with vitest test configuration
- Clarified dark surface CSS classes are actively used (not legacy)

### Technical
- Phases 4 & 5 complete
- All code review items now addressed
- Test coverage significantly improved for hooks and sync transformers

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
