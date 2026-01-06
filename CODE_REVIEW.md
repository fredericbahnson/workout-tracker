# Ascend Code Review Report

**Reviewer:** Senior Full-Stack Developer  
**Version Reviewed:** 1.1.5  
**Date:** January 2026

---

## Executive Summary

The Ascend codebase demonstrates solid architectural decisions—React 18 with TypeScript, offline-first with Dexie/IndexedDB, Supabase for cloud sync, Zustand for state management. The app works and the domain logic (RFEM calculations, cycle scheduling) is sound. However, the codebase has accumulated significant technical debt that will impede future development, make onboarding difficult, and increase bug risk.

**Severity Legend:**
- 🔴 **Critical** — Address before any new features
- 🟠 **High** — Address in next sprint
- 🟡 **Medium** — Address when working in affected areas
- ⚪ **Low** — Nice to have / cleanup

---

## 🔴 Critical Issues

### 1. Massive Component Files

| File | Lines | Recommended Max |
|------|-------|-----------------|
| `Today.tsx` | 1,597 | 300-400 |
| `CycleWizard.tsx` | 1,290 | 300-400 |
| `Settings.tsx` | 820 | 300-400 |
| `syncService.ts` | 683 | 400-500 |

**Problem:** These files are unmaintainable. A developer cannot hold the entire file in their head, making bugs more likely and debugging harder.

**Recommendation:** Extract into smaller, focused components and custom hooks:

```
Today.tsx should become:
├── Today.tsx (orchestrator, ~150 lines)
├── hooks/
│   ├── useWorkoutState.ts
│   ├── useSetCompletion.ts
│   └── useCycleProgress.ts
├── components/
│   ├── WorkoutView.tsx
│   ├── CompletionCelebration.tsx
│   ├── AdHocWorkoutManager.tsx
│   ├── SetLogger.tsx
│   └── WorkoutStats.tsx
```

**Impact of Not Fixing:** Every feature added to Today.tsx will be increasingly difficult. Bug fixes will risk regressions.

---

### 2. State Management Sprawl in Today.tsx

**Problem:** `Today.tsx` has **25+ useState calls**. This is a code smell indicating the component is doing too much.

```tsx
// Current state (partial list):
const [showExercisePicker, setShowExercisePicker] = useState(false);
const [showCycleWizard, setShowCycleWizard] = useState(false);
const [showCycleTypeSelector, setShowCycleTypeSelector] = useState(false);
const [showSkipConfirm, setShowSkipConfirm] = useState(false);
const [showEndConfirm, setShowEndConfirm] = useState(false);
const [showRestTimer, setShowRestTimer] = useState(false);
// ... 20+ more
```

**Recommendation:** Extract into custom hooks and/or useReducer:

```tsx
// Proposed refactor
const workoutModals = useWorkoutModals(); // handles all modal states
const setLogging = useSetLogging();        // handles set completion flow
const cycleFlow = useCycleFlow();          // handles cycle completion states
```

---

### 3. No Error Boundaries

**Problem:** If any component throws, the entire app crashes with a white screen. For a workout app, this is catastrophic—users could lose workout data mid-session.

**Recommendation:** Add error boundaries at key levels:

```tsx
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

// Usage in App.tsx
<ErrorBoundary fallback={<AppCrashScreen />}>
  <Layout>
    <ErrorBoundary fallback={<PageError />}>
      <Routes>...</Routes>
    </ErrorBoundary>
  </Layout>
</ErrorBoundary>
```

---

### 4. No Tests Despite vitest Configuration

**Problem:** `package.json` includes vitest but there are zero test files. For a data-centric app handling workout schedules and rep calculations, this is risky.

**Recommendation:** Start with critical business logic:

```
Priority test files:
1. scheduler.test.ts - Test RFEM calculations, set distribution
2. syncService.test.ts - Test conflict resolution, queue processing
3. repositories/*.test.ts - Test data layer operations
4. calculateTargetReps.test.ts - This is core business logic
```

**Minimum Coverage Target:** 80% on `/services` and `/data` folders.

---

## 🟠 High Priority Issues

### 5. Code Duplication in SwipeableSetCard

**Problem:** Touch and mouse handlers are nearly identical (~60 lines duplicated):

```tsx
const handleTouchEnd = useCallback((_e: React.TouchEvent) => {
  // 30+ lines of logic
}, [...]);

const handleMouseUp = useCallback(() => {
  // Same 30+ lines copy-pasted
}, [...]);
```

**Recommendation:** Extract shared logic:

```tsx
const handleSwipeEnd = useCallback((translateX: number, duration: number) => {
  const velocity = Math.abs(translateX) / duration;
  // shared logic here
}, [onSwipeRight, onSwipeLeft, onTap]);

const handleTouchEnd = useCallback((e: React.TouchEvent) => {
  handleSwipeEnd(translateX, Date.now() - startTimeRef.current);
}, [handleSwipeEnd, translateX]);
```

---

### 6. Sync Service Lacks Exponential Backoff

**Problem:** The retry logic uses a simple counter with no delay:

```tsx
if (newRetryCount >= 5) {
  // Give up after 5 retries
  await db.syncQueue.delete(queueItem.id);
}
```

**Recommendation:** Implement exponential backoff:

```tsx
const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
await new Promise(resolve => setTimeout(resolve, delay));
```

---

### 7. Date Handling Inconsistencies

**Problem:** The codebase mixes Date objects and ISO strings inconsistently, leading to potential timezone bugs:

```tsx
// In types - uses Date
createdAt: Date;

// In sync service - converts to/from strings
created_at: local.createdAt.toISOString(),
createdAt: new Date(remote.created_at),

// In components - sometimes uses isToday with new Date()
isToday(new Date(lastCompletedWorkout.completedAt))
```

**Recommendation:** Establish a clear convention:
1. Store as ISO strings in both IndexedDB and Supabase
2. Convert to Date only at the UI layer when needed
3. Use a date utility library (date-fns is already lightweight)

---

### 8. No Centralized Error Handling

**Problem:** Errors are logged inconsistently with `console.error` and messages vary:

```tsx
// syncService.ts
console.error('Error syncing exercises:', error);
console.error(`Failed to process queue item ${queueItem.id}:`, error);

// AuthContext.tsx
console.log('getSession error (may be offline):', error.message);
console.error('Failed to clear local database on signin:', e);
```

**Recommendation:** Create an error service:

```tsx
// src/services/errorService.ts
export const ErrorService = {
  log(context: string, error: unknown, metadata?: object) {
    console.error(`[${context}]`, error, metadata);
    // Future: Send to Sentry/LogRocket
  },
  
  notify(message: string, options?: { duration?: number }) {
    // Show toast notification to user
  }
};
```

---

### 9. TypeScript Path Aliases Not Used

**Problem:** tsconfig.json defines path aliases but they're never used:

```json
"paths": {
  "@/*": ["src/*"]
}
```

All imports use relative paths:
```tsx
import { PageHeader } from '../components/layout';
import { Button, Modal } from '../ui';
import { CycleRepo } from '../../data/repositories';
```

**Recommendation:** Use the configured aliases:

```tsx
import { PageHeader } from '@/components/layout';
import { Button, Modal } from '@/components/ui';
import { CycleRepo } from '@/data/repositories';
```

**Note:** Requires updating vite.config.ts to recognize the alias:
```ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
},
```

---

## 🟡 Medium Priority Issues

### 10. Magic Numbers Throughout Codebase

**Problem:**
```tsx
// SwipeableSetCard.tsx
const SWIPE_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 0.3;

// scheduler.ts
return Math.max(5, Math.round(prevMax * 0.2)); // What is 0.2?
return Math.max(5, max - workout.rfem * 3);    // Why * 3?

// Various
const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
```

**Recommendation:** Create a constants file:

```tsx
// src/constants/index.ts
export const SWIPE = {
  THRESHOLD_PX: 80,
  VELOCITY_THRESHOLD: 0.3,
  MAX_TRANSLATE_PX: 120,
  RESISTANCE: 0.4,
};

export const TRAINING = {
  WARMUP_PERCENTAGE: 0.2,
  TIME_RFEM_MULTIPLIER: 3, // seconds per RFEM point
  MIN_WARMUP_SECONDS: 5,
  MIN_WARMUP_REPS: 1,
};

export const AUTH = {
  NEW_USER_WINDOW_MS: 5 * 60 * 1000, // 5 minutes
};
```

---

### 11. Accessibility Gaps

**Problem:** Interactive elements lack proper ARIA attributes:

```tsx
// SwipeableSetCard - no keyboard support
<div
  onTouchStart={handleTouchStart}
  onMouseDown={handleMouseDown}
>

// Modal - no focus trap
<div className="fixed inset-0 z-50">
```

**Recommendation:**
```tsx
// SwipeableSetCard
<div
  role="button"
  tabIndex={0}
  aria-label={`Complete set: ${exerciseName}`}
  onKeyDown={(e) => {
    if (e.key === 'Enter') onTap();
    if (e.key === 'ArrowRight') onSwipeRight();
  }}
>

// Modal - use focus-trap-react or similar
import { FocusTrap } from 'focus-trap-react';
<FocusTrap>
  <div className="modal-content">...</div>
</FocusTrap>
```

---

### 12. Missing React Optimizations

**Problem:** Pure components that re-render unnecessarily:

```tsx
// ExerciseCard.tsx - renders on every parent update
export function ExerciseCard({ exercise, onClick }: ExerciseCardProps) {
```

**Recommendation:**
```tsx
export const ExerciseCard = memo(function ExerciseCard({ 
  exercise, 
  onClick 
}: ExerciseCardProps) {
  // ...
});
```

Also add useMemo for expensive computations:
```tsx
// Today.tsx
const groupedSetsRemaining = useMemo(
  () => groupSetsByType(scheduledSetsRemaining),
  [scheduledSetsRemaining]
);
```

---

### 13. Inline Tailwind Class Sprawl

**Problem:** Extremely long class strings that are hard to read and maintain:

```tsx
className={`
  w-full px-3 py-2 rounded-lg border transition-colors
  bg-white dark:bg-[#1A1A2E]
  text-gray-900 dark:text-gray-100
  border-gray-300 dark:border-[#2D2D4A]
  focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none
  placeholder:text-gray-400 dark:placeholder:text-gray-500
  disabled:bg-gray-50 disabled:dark:bg-[#121212] disabled:cursor-not-allowed
  ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
  ${className}
`}
```

**Recommendation:** Use Tailwind's @apply or create style constants:

```tsx
// src/styles/inputs.ts
export const inputBase = cn(
  'w-full px-3 py-2 rounded-lg border transition-colors',
  'bg-white dark:bg-dark-surface',
  'text-gray-900 dark:text-gray-100',
  'border-gray-300 dark:border-dark-elevated',
  'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none',
  'placeholder:text-gray-400 dark:placeholder:text-gray-500',
  'disabled:bg-gray-50 disabled:dark:bg-dark-bg disabled:cursor-not-allowed'
);

// Usage
className={cn(inputBase, error && 'border-red-500', className)}
```

**Note:** Consider adding `clsx` or `tailwind-merge` for proper class merging.

---

### 14. Repository Pattern Inconsistencies

**Problem:** Repositories have inconsistent method signatures:

```tsx
// ExerciseRepo
async create(data: ExerciseFormData): Promise<Exercise>

// MaxRecordRepo  
async create(
  exerciseId: string, 
  maxReps?: number, 
  maxTime?: number, 
  notes: string = '', 
  weight?: number
): Promise<MaxRecord>

// CompletedSetRepo
async create(data: QuickLogData, scheduledWorkoutId?: string): Promise<CompletedSet>
```

**Recommendation:** Standardize on object parameters:

```tsx
async create(data: CreateMaxRecordInput): Promise<MaxRecord>

interface CreateMaxRecordInput {
  exerciseId: string;
  maxReps?: number;
  maxTime?: number;
  notes?: string;
  weight?: number;
}
```

---

### 15. Missing Loading States

**Problem:** Some operations don't show loading indicators:

```tsx
// handleCloneFromCycle - no loading state
const handleCloneFromCycle = (sourceCycle: Cycle) => {
  // ... synchronous state updates, but if this grows...
};

// Initial data fetches in useLiveQuery don't show loading
const exercises = useLiveQuery(() => ExerciseRepo.getAll(), []);
// exercises is undefined while loading, but UI doesn't always handle this
```

**Recommendation:** Always handle loading states:

```tsx
if (exercises === undefined) {
  return <LoadingSkeleton />;
}
```

---

## ⚪ Low Priority Issues

### 16. Console Statements in Production

```tsx
// syncService.ts
console.log(`Queued ${operation} for ${table}:${itemId}`);
console.log(`Queue processed: ${processed} successful, ${failed} failed`);
console.log('Back online - processing sync queue...');

// AuthContext.tsx
console.log('Auth event:', event);
```

**Recommendation:** Use a logger that can be disabled in production:

```tsx
const logger = {
  debug: (...args) => {
    if (import.meta.env.DEV) console.log(...args);
  },
  error: console.error, // Always log errors
};
```

---

### 17. Missing JSDoc on Complex Functions

**Problem:** Core business logic lacks documentation:

```tsx
export function calculateTargetReps(
  set: ScheduledSet,
  workout: ScheduledWorkout,
  maxRecord: MaxRecord | undefined,
  conditioningWeeklyIncrement: number,
  conditioningWeeklyTimeIncrement: number = 5,
  defaultMax: number = 10
): number {
  // 40+ lines of logic with no explanation
```

**Recommendation:**
```tsx
/**
 * Calculates target reps/time for a scheduled set based on exercise mode and workout context.
 * 
 * For standard exercises: max - RFEM (progressive underload for recovery)
 * For conditioning: base + (week - 1) * increment (progressive overload)
 * For max testing warmup: 20% of previous max
 * For max testing: 0 (indicates "go to max")
 * 
 * @param set - The scheduled set to calculate targets for
 * @param workout - The workout containing RFEM and week info
 * @param maxRecord - User's current max for this exercise (optional)
 * @param conditioningWeeklyIncrement - Reps to add per week for conditioning
 * @param conditioningWeeklyTimeIncrement - Seconds to add per week for time-based
 * @param defaultMax - Fallback max if no record exists
 * @returns Target reps (for rep-based) or seconds (for time-based exercises)
 */
```

---

### 18. Inconsistent Naming Conventions

**Problem:**
```tsx
// Event handlers - mixed patterns
onComplete vs handleComplete
onSwipeRight vs handleQuickComplete
onAuthComplete vs handleAuthSubmit

// Async patterns - mixed
const result = await signIn(...);  // uses await
supabase.auth.getSession().then(...);  // uses .then()
```

**Recommendation:** Establish conventions:
- `handle*` for internal handlers defined in the component
- `on*` for props passed from parent
- Always use async/await (unless chaining is clearer)

---

### 19. Hardcoded Colors Outside Theme

**Problem:** Some colors bypass the theme system:

```tsx
// Input.tsx
dark:bg-[#1A1A2E]
dark:border-[#2D2D4A]

// Should use
dark:bg-dark-surface
dark:border-dark-elevated
```

---

### 20. Supabase Types Not Generated

**Problem:** Remote interfaces are manually defined:

```tsx
interface RemoteExercise {
  id: string;
  user_id: string;
  // ... manually maintained
}
```

**Recommendation:** Use Supabase CLI to generate types:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

---

## Recommended Action Plan

### Phase 1: Stabilization (1-2 weeks)
1. Add Error Boundaries ✓ (prevents white screen crashes)
2. Add critical tests for scheduler.ts and syncService.ts
3. Fix date handling inconsistencies

### Phase 2: Refactoring (2-3 weeks)
1. Break up Today.tsx into smaller components
2. Extract custom hooks for state management
3. Implement exponential backoff in sync
4. Add centralized error handling

### Phase 3: Polish (1-2 weeks)
1. Set up path aliases throughout
2. Add accessibility improvements
3. Apply React.memo and useMemo optimizations
4. Extract Tailwind class constants

### Phase 4: Maintenance (ongoing)
1. Add tests for new features
2. Keep component sizes under 400 lines
3. Document complex business logic

---

## Files Requiring Immediate Attention

| File | Priority | Primary Issues |
|------|----------|----------------|
| `src/pages/Today.tsx` | 🔴 | Size, state sprawl |
| `src/components/cycles/CycleWizard.tsx` | 🔴 | Size |
| `src/services/syncService.ts` | 🟠 | Retry logic, error handling |
| `src/components/workouts/SwipeableSetCard.tsx` | 🟠 | Code duplication |
| `src/App.tsx` | 🟠 | Needs Error Boundary |

---

## Conclusion

The core architecture is sound and the app works. The issues identified are primarily maintainability concerns that will compound over time. The highest-impact improvement would be breaking up the massive component files—this single change would make the codebase significantly easier to work with and reduce bug risk.

None of these recommendations require changing functionality. All can be implemented incrementally without disrupting the existing user experience.
