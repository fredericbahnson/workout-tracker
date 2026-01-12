# Ascend Codebase Review v2.7.x (Updated)

**Review Date:** January 2026  
**Reviewer Role:** Senior Full-Stack Developer  
**Codebase Version:** 2.7.6  
**Review Scope:** Complete application review for best practices, maintainability, and optimization

**Update Notes:**
- ✅ Item 3.1 (Weight Unit Hardcoded) - COMPLETED in v2.7.4
- ✅ Cycle wizard layout issues - FIXED in v2.7.5 and v2.7.6

---

## Executive Summary

The Ascend codebase is well-architected with clear separation of concerns, consistent patterns, and solid TypeScript usage. The application demonstrates professional-grade practices including:

- ✅ Clean repository pattern for data access
- ✅ Comprehensive sync infrastructure with offline support
- ✅ Well-documented constants and configuration
- ✅ Centralized styling utilities
- ✅ Scoped logging system
- ✅ TypeScript strict mode enabled
- ✅ **Centralized weight unit configuration** (added v2.7.4)

However, there are opportunities for improvement in code organization, reducing duplication, and preparing for future scalability. This review identifies **27 actionable items** (originally 28, 1 completed) organized into **5 implementation phases**.

---

## Table of Contents

1. [Critical Issues](#1-critical-issues)
2. [Code Organization Issues](#2-code-organization-issues)
3. [Hardcoded Values](#3-hardcoded-values)
4. [Redundant/Deprecated Code](#4-redundantdeprecated-code)
5. [Refactoring Opportunities](#5-refactoring-opportunities)
6. [Missing Infrastructure](#6-missing-infrastructure)
7. [Testing Gaps](#7-testing-gaps)
8. [Documentation Gaps](#8-documentation-gaps)
9. [Performance Considerations](#9-performance-considerations)
10. [Phased Implementation Plan](#10-phased-implementation-plan)

---

## 1. Critical Issues

### 1.1 No Issues Found ✅

No critical bugs or security vulnerabilities were identified. The codebase is production-ready.

---

## 2. Code Organization Issues

### 2.1 Duplicate Date Utility Files

**Location:** `src/utils/date.ts` and `src/utils/dateUtils.ts`

**Issue:** Two separate date utility files exist:
- `date.ts` contains only `isToday()` (14 lines)
- `dateUtils.ts` is the comprehensive date utility module (252 lines)

**Impact:** Confusion about which file to use; `isToday` logic could be more robust using existing `dateUtils` functions.

**Recommendation:** Consolidate `isToday` into `dateUtils.ts` and delete `date.ts`.

```typescript
// Add to dateUtils.ts
export function isToday(value: DateLike): boolean {
  return isSameDay(value, now());
}
```

---

### 2.2 Migration Files in Inconsistent Locations

**Location:** 
- `supabase-migration-user-preferences.sql` (root)
- `supabase/supabase-migration-app-mode.sql` (supabase folder)

**Issue:** Database migration files are stored inconsistently.

**Recommendation:** Move all migrations to `supabase/migrations/` with naming convention:
```
supabase/migrations/
├── 001_initial_schema.sql
├── 002_user_preferences.sql
└── 003_app_mode.sql
```

---

### 2.3 Version Constant Not Exported

**Location:** `src/constants/version.ts`

**Issue:** `APP_VERSION` is not re-exported from `src/constants/index.ts`, requiring direct import.

**Recommendation:** Add to `src/constants/index.ts`:
```typescript
export { APP_VERSION } from './version';
```

---

### 2.4 Utils Index Missing dateUtils Export

**Location:** `src/utils/index.ts`

**Issue:** `dateUtils.ts` functions are not exported from the utils barrel file, requiring direct imports.

**Recommendation:** Add to `src/utils/index.ts`:
```typescript
export * from './dateUtils';
```

---

## 3. Hardcoded Values

### 3.1 Weight Unit Hardcoded as "lbs" — ✅ COMPLETED (v2.7.4)

**Status:** ✅ RESOLVED

**Solution Implemented:**
- Created `src/constants/units.ts` with `WEIGHT_UNIT` configuration
- Added formatting utilities: `formatWeight()`, `formatWeightAt()`, `formatWeightIncrement()`, `formatWeightLabel()`, `getWeightUnitLabel()`
- Updated 10 components to use centralized formatters
- Enables future lbs/kg user preference support

**Files Updated:**
- `src/constants/units.ts` (NEW)
- `src/constants/index.ts` (added export)
- `src/components/exercises/ExerciseCard.tsx`
- `src/components/exercises/ExerciseForm.tsx`
- `src/components/exercises/MaxRecordForm.tsx`
- `src/components/workouts/QuickLogForm.tsx`
- `src/components/workouts/today/EditCompletedSetModal.tsx`
- `src/components/workouts/today/ScheduledSetsList.tsx`
- `src/components/cycles/wizard/steps/ReviewStep.tsx`
- `src/components/cycles/wizard/components/SimpleProgressionFields.tsx`
- `src/components/cycles/wizard/components/ExerciseProgressionEditor.tsx`
- `src/pages/ExerciseDetail.tsx`

---

### 3.2 Default Timer Durations Scattered

**Location:** `src/types/preferences.ts`

**Current:**
```typescript
restTimer: { enabled: false, durationSeconds: 180 },
maxTestRestTimer: { enabled: false, durationSeconds: 300 },
```

**Recommendation:** Move magic numbers to training constants:

```typescript
// src/constants/training.ts
export const TIMER = {
  DEFAULT_REST_SECONDS: 180,       // 3 minutes
  DEFAULT_MAX_TEST_REST_SECONDS: 300, // 5 minutes
} as const;
```

---

## 4. Redundant/Deprecated Code

### 4.1 Theme Logic Duplication

**Locations:**
- `src/App.tsx` (lines 105-129) - applies theme on mount
- `src/stores/appStore.ts` `useTheme()` hook (lines 77-93) - also applies theme

**Issue:** Same theme application logic exists in two places.

**Recommendation:** Remove theme logic from `App.tsx` and use only `useTheme()` hook, or extract to a dedicated `useThemeEffect()` hook.

---

### 4.2 Legacy Dark Surface Classes

**Location:** `src/index.css` (lines 103-110)

```css
/* Dark surface colors for cards/elevated elements - legacy support */
.dark .dark-surface { ... }
.dark .dark-elevated { ... }
```

**Recommendation:** Audit usage and remove if no longer needed, or document why legacy support is required.

---

### 4.3 Unused TypeScript Exclude Pattern

**Location:** `tsconfig.json` (line 25)

```json
"exclude": ["src/**/*.test.ts", "src/**/*.test.tsx"]
```

**Issue:** Tests are excluded from compilation but Vitest handles this. This exclusion may cause IDE issues with test file type checking.

**Recommendation:** Consider removing the exclude or using a separate `tsconfig.test.json`.

---

### 4.4 Deprecated onUpdateConditioningReps — ✅ REMOVED (v2.7.5)

**Status:** ✅ RESOLVED

**Solution Implemented:**
- Removed `onUpdateConditioningReps` prop from `GroupsStepProps` interface
- `GroupsStep` now uses the more flexible `onUpdateAssignment` for conditioning exercises
- Supports both rep-based and time-based conditioning exercises

---

## 5. Refactoring Opportunities

### 5.1 Settings Page State Consolidation

**Location:** `src/pages/Settings.tsx` (838 lines, 19 useState calls)

**Current State:**
```typescript
const [showClearConfirm, setShowClearConfirm] = useState(false);
const [showAuthModal, setShowAuthModal] = useState(false);
const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [authError, setAuthError] = useState<string | null>(null);
const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
// ... 12 more useState calls
```

**Recommendation:** Extract into `useSettingsState` reducer hook:

```typescript
// src/hooks/useSettingsState.ts
type SettingsState = {
  modals: {
    clearConfirm: boolean;
    auth: boolean;
    deleteAccount: boolean;
    changePassword: boolean;
  };
  auth: {
    mode: 'signin' | 'signup';
    email: string;
    password: string;
    error: string | null;
    isSubmitting: boolean;
  };
  // ...
};

type SettingsAction = 
  | { type: 'OPEN_MODAL'; modal: keyof SettingsState['modals'] }
  | { type: 'CLOSE_MODAL'; modal: keyof SettingsState['modals'] }
  | { type: 'SET_AUTH_FIELD'; field: string; value: string }
  // ...
```

---

### 5.2 Extract FilterChip Component

**Location:** `src/pages/Exercises.tsx` (lines 113-139)

**Current:** Filter buttons are inline with repeated styling.

**Recommendation:** Extract to reusable component:

```typescript
// src/components/ui/FilterChip.tsx
interface FilterChipProps {
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
}

export function FilterChip({ label, count, isActive, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        isActive
          ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      }`}
    >
      {label}{count !== undefined && ` (${count})`}
    </button>
  );
}
```

---

### 5.3 SyncService Encapsulation

**Location:** `src/services/syncService.ts`

**Issue:** Module-level mutable state:
```typescript
let currentSyncStatus: SyncStatus = 'idle';
let lastSyncTime: Date | null = null;
let statusListeners: Set<(status: SyncStatus) => void> = new Set();
```

**Recommendation:** Encapsulate in a class or use a more structured state management approach.

---

### 5.4 Cycle Wizard Layout — ✅ FIXED (v2.7.5, v2.7.6)

**Status:** ✅ RESOLVED

**Issue:** In cycle creation wizard, conditioning exercises had inline input fields and badges that squeezed exercise names into narrow columns on mobile.

**Solution Implemented:**

*v2.7.5:*
- Moved conditioning input below exercise name row in `GroupsStep.tsx`
- Added "Cond" badge for visual clarity
- Now properly supports time-based conditioning (was only handling reps)

*v2.7.6:*
- Stacked secondary badges (Cond, Wt) vertically below type badge
- Gives exercise names maximum horizontal space
- Shortened badge labels: "Conditioning" → "Cond", "Weighted" → "Wt"
- Applied consistently across GroupsStep, MixedExerciseConfig, ExerciseProgressionEditor

---

### 5.5 Create Generic ConfirmModal

**Location:** Multiple components have inline confirmation dialogs

**Recommendation:** Extract a reusable `ConfirmModal` component:

```typescript
// src/components/ui/ConfirmModal.tsx
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  isLoading?: boolean;
}
```

---

## 6. Missing Infrastructure

### 6.1 No ESLint Configuration

**Issue:** No `.eslintrc` or `eslint.config.js` file present.

**Recommendation:** Add ESLint with TypeScript and React plugins:

```javascript
// eslint.config.js
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    plugins: { '@typescript-eslint': typescript, react, 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
```

---

### 6.2 No Prettier Configuration

**Issue:** No `.prettierrc` file for consistent formatting.

**Recommendation:**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

---

### 6.3 No Pre-commit Hooks

**Issue:** No automated checks before commits.

**Recommendation:** Add Husky + lint-staged:
```bash
npm install -D husky lint-staged
npx husky init
```

```json
// package.json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,css,md}": ["prettier --write"]
}
```

---

### 6.4 No Error Boundary Logging

**Location:** `src/components/ErrorBoundary.tsx`

**Issue:** Errors are caught but not reported to any service.

**Recommendation:** Add error reporting integration (Sentry, LogRocket):

```typescript
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  logger.error('ErrorBoundary', error, { 
    componentStack: errorInfo.componentStack,
    level: this.props.level 
  });
  
  // Future: Send to error tracking
  // Sentry.captureException(error, { extra: errorInfo });
}
```

---

## 7. Testing Gaps

### 7.1 Current Test Coverage

| Area | Files | Coverage |
|------|-------|----------|
| Services | 2 | scheduler.ts, syncService.ts |
| Utils | 1 | dateUtils.ts |
| Repositories | 1 | All repositories |
| **Components** | 0 | ❌ No component tests |
| **Hooks** | 0 | ❌ No hook tests |
| **Pages** | 0 | ❌ No page tests |

### 7.2 Recommended Testing Additions

**Priority 1 - Critical Business Logic:**
- `src/services/scheduler.ts` - Already covered ✅
- `src/hooks/useWorkoutDisplay.ts` - Needs tests
- `src/hooks/useAdHocWorkout.ts` - Needs tests

**Priority 2 - Data Layer:**
- All repositories - Already covered ✅
- Sync transformers - Needs tests

**Priority 3 - UI Components:**
- `ExerciseForm` - Complex form logic
- `CycleWizard` - Multi-step form
- `SwipeableSetCard` - Gesture handling

---

## 8. Documentation Gaps

### 8.1 Missing JSDoc on Public Functions

**Locations:** Various repository methods, utility functions

**Example - Missing:**
```typescript
// src/data/repositories/ExerciseRepo.ts
async getAll(): Promise<Exercise[]> {
  // No documentation
}
```

**Recommended:**
```typescript
/**
 * Retrieves all exercises from the local database.
 * Results are sorted by creation date (newest first).
 * 
 * @returns Promise resolving to array of all exercises
 */
async getAll(): Promise<Exercise[]> {
```

---

### 8.2 Missing Architecture Documentation

**Recommendation:** Create `docs/ARCHITECTURE.md` covering:
- Data flow (IndexedDB → Repositories → Components)
- Sync architecture (local-first, cloud sync)
- State management strategy (Zustand vs Context)
- Component hierarchy

---

### 8.3 Missing API Documentation

**Recommendation:** Create `docs/DATABASE_SCHEMA.md` documenting:
- All Supabase tables
- Column definitions and constraints
- Relationships between tables
- RLS policies

---

## 9. Performance Considerations

### 9.1 Memoization Opportunities

**Location:** `src/pages/Today.tsx`

**Current:** Multiple `useMemo` calls are correct, but some computed values could benefit from memoization:

```typescript
// Line 193 - Good use of useMemo
const groupedAdHocSets = useMemo(() => ...);
```

**Recommendation:** Audit all pages for expensive computations that should be memoized.

---

### 9.2 Bundle Size

**Current:** 755KB (gzipped: 205KB)

**Observations:**
- Lucide React icons are tree-shaken correctly
- No obvious heavy dependencies

**Recommendation:** Monitor bundle size with each release. Consider code splitting for:
- Cycle wizard (large component tree)
- Settings page (rarely visited)

---

### 9.3 Live Query Optimization

**Location:** Multiple pages use `useLiveQuery`

**Observation:** Dependencies are correctly specified, queries are reasonably scoped.

**Recommendation:** Consider adding indexes for frequently queried fields if performance degrades with larger datasets.

---

## 10. Phased Implementation Plan

### Completed Work

| Version | Items Completed |
|---------|----------------|
| v2.7.4 | 3.1 - Weight unit centralization |
| v2.7.5 | 5.4 - Cycle wizard layout fix (input row), 4.4 - Removed deprecated prop |
| v2.7.6 | 5.4 - Cycle wizard layout fix (badge stacking) |

---

### Phase 1: Quick Wins (2-3 hours)
*Low risk, high impact, no architectural changes*

| Item | Description | Risk | Effort | Status |
|------|-------------|------|--------|--------|
| 2.1 | Consolidate date utilities | Low | 15 min | ⬜ |
| 2.3 | Export APP_VERSION from constants | Low | 5 min | ⬜ |
| 2.4 | Export dateUtils from utils index | Low | 5 min | ⬜ |
| 3.2 | Move timer defaults to constants | Low | 15 min | ⬜ |
| 2.2 | Organize migration files | Low | 15 min | ⬜ |

**Verification:** Run `npm run build && npm test` after each change.

---

### Phase 2: Code Quality Infrastructure (2-3 hours)
*Sets up tooling for ongoing quality*

| Item | Description | Risk | Effort | Status |
|------|-------------|------|--------|--------|
| 6.1 | Add ESLint configuration | Low | 45 min | ⬜ |
| 6.2 | Add Prettier configuration | Low | 30 min | ⬜ |
| 6.3 | Add pre-commit hooks | Low | 30 min | ⬜ |
| - | Fix any linting errors | Low | 30 min | ⬜ |

**Verification:** Commit should trigger linting; `npm run lint` should pass.

---

### Phase 3: Refactoring - Extracting Patterns (3-5 hours)
*Improves maintainability without changing behavior*

| Item | Description | Risk | Effort | Status |
|------|-------------|------|--------|--------|
| 5.2 | Extract FilterChip component | Low | 30 min | ⬜ |
| 5.5 | Create generic ConfirmModal | Low | 45 min | ⬜ |
| 4.1 | Consolidate theme logic | Medium | 30 min | ⬜ |
| ~~3.1~~ | ~~Create weight unit constants~~ | ~~Medium~~ | ~~1 hour~~ | ✅ v2.7.4 |
| 5.1 | Extract useSettingsState hook | Medium | 2 hours | ⬜ |

**Verification:** 
- Visual regression testing on affected pages
- Run full test suite
- Manual testing of Settings page

---

### Phase 4: Testing Expansion (4-6 hours)
*Improves confidence for future changes*

| Item | Description | Risk | Effort | Status |
|------|-------------|------|--------|--------|
| 7.2 | Add useWorkoutDisplay tests | Low | 1.5 hours | ⬜ |
| 7.2 | Add useAdHocWorkout tests | Low | 1.5 hours | ⬜ |
| 7.2 | Add sync transformer tests | Low | 1 hour | ⬜ |
| - | Setup component testing with React Testing Library | Low | 1 hour | ⬜ |

**Verification:** Coverage report should show improvement.

---

### Phase 5: Documentation & Polish (3-4 hours)
*Improves onboarding and maintainability*

| Item | Description | Risk | Effort | Status |
|------|-------------|------|--------|--------|
| 8.2 | Create ARCHITECTURE.md | Low | 1.5 hours | ⬜ |
| 8.3 | Create DATABASE_SCHEMA.md | Low | 1 hour | ⬜ |
| 8.1 | Add JSDoc to public repository methods | Low | 1 hour | ⬜ |
| 4.2 | Audit and document legacy CSS classes | Low | 30 min | ⬜ |

**Verification:** Documentation review for accuracy.

---

## Summary

### Progress

| Phase | Original Hours | Remaining Hours | Status |
|-------|---------------|-----------------|--------|
| Phase 1 | 2-3 | 2-3 | ⬜ Not Started |
| Phase 2 | 2-3 | 2-3 | ⬜ Not Started |
| Phase 3 | 4-6 | 3-5 | 🟡 1 item complete |
| Phase 4 | 4-6 | 4-6 | ⬜ Not Started |
| Phase 5 | 3-4 | 3-4 | ⬜ Not Started |
| **Total** | **15-22** | **14-21** | - |

### By Priority

**Immediate (This Sprint):**
- Phase 1: Quick Wins
- Phase 2: Code Quality Infrastructure

**Next Sprint:**
- Phase 3: Refactoring (remaining items)

**Backlog:**
- Phase 4: Testing Expansion
- Phase 5: Documentation

### Success Criteria

- [ ] All phases complete without breaking existing functionality
- [x] `npm run build` succeeds
- [x] `npm test` passes (188+ tests)
- [ ] No visual regressions
- [x] Bundle size remains stable (±5%) — Currently 755KB

---

## Appendix: Files Changed Per Phase

### Already Completed (v2.7.4 + v2.7.5 + v2.7.6)
```
# v2.7.4 - Weight unit centralization
src/constants/units.ts (new)
src/constants/index.ts (add units export)
src/components/exercises/ExerciseCard.tsx
src/components/exercises/ExerciseForm.tsx
src/components/exercises/MaxRecordForm.tsx
src/components/workouts/QuickLogForm.tsx
src/components/workouts/today/EditCompletedSetModal.tsx
src/components/workouts/today/ScheduledSetsList.tsx
src/pages/ExerciseDetail.tsx

# v2.7.5 + v2.7.6 - Cycle wizard layout fixes
src/components/cycles/wizard/steps/GroupsStep.tsx
src/components/cycles/wizard/steps/ReviewStep.tsx
src/components/cycles/wizard/components/MixedExerciseConfig.tsx
src/components/cycles/wizard/components/SimpleProgressionFields.tsx
src/components/cycles/wizard/components/ExerciseProgressionEditor.tsx
src/components/cycles/wizard/types.ts
src/components/cycles/CycleWizard.tsx
```

### Phase 1
```
src/utils/date.ts (delete)
src/utils/dateUtils.ts (add isToday)
src/utils/index.ts (add dateUtils export)
src/constants/index.ts (add version export)
src/constants/training.ts (add TIMER constants)
src/types/preferences.ts (use TIMER constants)
supabase/migrations/ (reorganize)
```

### Phase 2
```
eslint.config.js (new)
.prettierrc (new)
.husky/pre-commit (new)
package.json (add scripts)
```

### Phase 3 (Remaining)
```
src/components/ui/FilterChip.tsx (new)
src/components/ui/ConfirmModal.tsx (new)
src/components/ui/index.ts (exports)
src/pages/Exercises.tsx (use FilterChip)
src/pages/Settings.tsx (refactor state)
src/hooks/useSettingsState.ts (new)
src/stores/appStore.ts (consolidate theme)
src/App.tsx (remove theme logic)
```

### Phase 4
```
src/hooks/useWorkoutDisplay.test.ts (new)
src/hooks/useAdHocWorkout.test.ts (new)
src/services/sync/transformers.test.ts (new)
vitest.config.ts (add React Testing Library)
```

### Phase 5
```
docs/ARCHITECTURE.md (new)
docs/DATABASE_SCHEMA.md (new)
src/data/repositories/*.ts (add JSDoc)
```
