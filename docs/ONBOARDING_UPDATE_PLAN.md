# Onboarding Update Plan

This document contains specific changes to improve the Ascend onboarding flow based on a gap analysis between the current onboarding and the actual app usage patterns documented in the user guide.

## Context

The current onboarding effectively introduces RFEM concepts and gesture interactions, but has gaps when compared to what users actually need to know for core app usage. These changes address the most impactful gaps without adding slides or significant length.

---

## Summary of Changes

| # | Location | Change | Rationale |
|---|----------|--------|-----------|
| 1 | `FirstExerciseSlide.tsx` | Add Measurement Type selector (Reps/Time) | Users creating time-based exercises (planks, holds) need this option |
| 2 | `ExerciseSuggestionChips.tsx` | Update chips to include measurement type; add one time-based example | Consistency with measurement type addition |
| 3 | `OnboardingFlow.tsx` | Pass measurement type through exercise creation flow | Wire up the new field |
| 4 | `AppTour.tsx` - Slide 0 (Today) | Change "Log ad-hoc sets anytime" → "Tap + to add extra sets anytime" | Clearer language that matches actual UI |
| 5 | `AppTour.tsx` - Slide 2 (Cycles) | Add sentence about wizard walkthrough | Sets expectations for cycle creation process |
| 6 | `AppTour.tsx` - Slide 3 (Progress) | Add tip about Settings | Acknowledges Settings tab exists |
| 7 | `ReadySlide.tsx` | Update text to mention ad-hoc mode as alternative | Reduces pressure, shows flexibility for users not ready for cycles |

---

## Detailed Implementation

### Change 1: Add Measurement Type to FirstExerciseSlide

**File:** `src/components/onboarding/slides/FirstExerciseSlide.tsx`

**Current state:** The slide collects `name` and `type` only.

**Required changes:**

1. Add state for measurement type:
```typescript
const [measurementType, setMeasurementType] = useState<'reps' | 'time'>('reps');
```

2. Add a toggle or segmented control below the Type selector. Use a simple two-option toggle styled consistently with the existing form:

```tsx
{/* Measurement Type Toggle */}
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
    Measurement
  </label>
  <div className="flex gap-2">
    <button
      type="button"
      onClick={() => setMeasurementType('reps')}
      className={`
        flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors
        ${measurementType === 'reps'
          ? 'bg-primary-500 text-white'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }
      `}
    >
      Reps
    </button>
    <button
      type="button"
      onClick={() => setMeasurementType('time')}
      className={`
        flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors
        ${measurementType === 'time'
          ? 'bg-primary-500 text-white'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }
      `}
    >
      Time
    </button>
  </div>
  <p className="text-xs text-gray-500 dark:text-gray-400">
    {measurementType === 'reps' 
      ? 'Count repetitions (push-ups, pull-ups, squats)' 
      : 'Track duration (planks, holds, stretches)'}
  </p>
</div>
```

3. Update the `FirstExerciseData` interface to include measurement type:
```typescript
export interface FirstExerciseData {
  name: string;
  type: string;
  measurementType: 'reps' | 'time';
}
```

4. Update `handleSubmit` to include measurement type:
```typescript
const handleSubmit = () => {
  if (!name.trim()) return;
  onNext({ name: name.trim(), type, measurementType });
};
```

---

### Change 2: Update ExerciseSuggestionChips

**File:** `src/components/onboarding/visuals/ExerciseSuggestionChips.tsx`

**Current state:** Chips only have `name` and `type`.

**Required changes:**

1. Update the `ExerciseSuggestion` interface:
```typescript
export interface ExerciseSuggestion {
  name: string;
  type: 'push' | 'pull' | 'legs' | 'core';
  measurementType: 'reps' | 'time';
}
```

2. Update the `SUGGESTIONS` array to include measurement type, and add one time-based exercise:
```typescript
const SUGGESTIONS: ExerciseSuggestion[] = [
  { name: 'Pull-ups', type: 'pull', measurementType: 'reps' },
  { name: 'Push-ups', type: 'push', measurementType: 'reps' },
  { name: 'Squats', type: 'legs', measurementType: 'reps' },
  { name: 'Dips', type: 'push', measurementType: 'reps' },
  { name: 'Rows', type: 'pull', measurementType: 'reps' },
  { name: 'Plank', type: 'core', measurementType: 'time' },
];
```

Note: Replaced "Lunges" with "Plank" to include a time-based example. Plank is a universally known core exercise that naturally demonstrates the time measurement option.

---

### Change 3: Wire Up Measurement Type in OnboardingFlow

**File:** `src/components/onboarding/OnboardingFlow.tsx`

**Required changes:**

1. Update the exercise creation in `handleRecordMaxComplete` to use the measurement type:

Find this section (around line 163-169):
```typescript
// Create the exercise
const exercise = await ExerciseRepo.create({
  name: exerciseData.name,
  type: exerciseData.type as 'push' | 'pull' | 'legs' | 'core' | 'other',
  mode: 'standard',
  measurementType: 'reps',  // Currently hardcoded
  notes: '',
  customParameters: [],
});
```

Change to:
```typescript
// Create the exercise
const exercise = await ExerciseRepo.create({
  name: exerciseData.name,
  type: exerciseData.type as 'push' | 'pull' | 'legs' | 'core' | 'other',
  mode: 'standard',
  measurementType: exerciseData.measurementType,
  notes: '',
  customParameters: [],
});
```

2. Update `RecordMaxSlide` usage to handle time-based exercises. In the render section (around line 323-325):

```tsx
{phase === 'record-max' && exerciseData && (
  <RecordMaxSlide 
    exerciseName={exerciseData.name} 
    measurementType={exerciseData.measurementType}
    onNext={handleRecordMaxComplete} 
  />
)}
```

---

### Change 4: Update RecordMaxSlide for Time-Based Exercises

**File:** `src/components/onboarding/slides/RecordMaxSlide.tsx`

**Required changes:**

1. Add `measurementType` prop:
```typescript
interface RecordMaxSlideProps {
  exerciseName: string;
  measurementType: 'reps' | 'time';
  onNext: (maxValue: number | null) => void;
}
```

2. Update the component to handle both measurement types:

- Change state variable name from `maxReps` to `maxValue` for clarity
- Update the question text to be measurement-appropriate:

```tsx
<p className={`...`}>
  {measurementType === 'reps' ? (
    <>
      How many <strong className="text-gray-900 dark:text-gray-100">{exerciseName}</strong>{' '}
      can you do in one set,{' '}
      <span className="font-semibold text-primary-600 dark:text-primary-400">
        with good form
      </span>
      ?
    </>
  ) : (
    <>
      How long can you hold{' '}
      <strong className="text-gray-900 dark:text-gray-100">{exerciseName}</strong>{' '}
      <span className="font-semibold text-primary-600 dark:text-primary-400">
        with good form
      </span>
      ?
    </>
  )}
</p>
```

- Update the input section:

```tsx
<div className="flex items-center justify-center gap-4 mb-4">
  <NumberInput
    value={maxValue}
    onChange={setMaxValue}
    min={1}
    max={measurementType === 'reps' ? 100 : 600}
    className="w-24 text-center text-2xl font-bold"
  />
  <span className="text-lg text-gray-600 dark:text-gray-400">
    {measurementType === 'reps' ? 'reps' : 'seconds'}
  </span>
</div>
```

- Update the tip content to be measurement-appropriate:

```tsx
{showTip && (
  <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-left text-sm text-primary-700 dark:text-primary-300">
    <p className="mb-2">
      <strong>It's okay to estimate!</strong>
    </p>
    <p>
      {measurementType === 'reps'
        ? "Think of a recent workout where you pushed hard but kept good form. That number is your starting point. You can update it anytime."
        : "Think of a recent attempt where you held as long as possible with good form. That duration is your starting point. You can update it anytime."
      }
    </p>
  </div>
)}
```

---

### Change 5: Update App Tour - Today Page (Slide 0)

**File:** `src/components/onboarding/AppTour.tsx`

**Location:** Around line 167-169, in the feature list for slide 0.

**Current text:**
```tsx
<div className="flex items-center gap-2">
  <Dumbbell className="w-4 h-4 text-primary-500" />
  <span>Log ad-hoc sets anytime</span>
</div>
```

**Change to:**
```tsx
<div className="flex items-center gap-2">
  <Plus className="w-4 h-4 text-primary-500" />
  <span>Tap + to add extra sets anytime</span>
</div>
```

**Additional:** Add `Plus` to the lucide-react imports at the top of the file:
```typescript
import {
  ArrowRight,
  ArrowLeft,
  Home,
  Dumbbell,
  Calendar,
  TrendingUp,
  ChevronRight,
  Hand,
  Timer,
  BarChart3,
  Target,
  X,
  Edit3,
  Plus,  // Add this
} from 'lucide-react';
```

---

### Change 6: Update App Tour - Cycles Page (Slide 2)

**File:** `src/components/onboarding/AppTour.tsx`

**Location:** Around line 306-309, in the body content for slide 2.

**Current text:**
```tsx
<p className="text-sm text-gray-500 dark:text-gray-400">
  Or skip cycles entirely and log workouts freestyle.
</p>
```

**Change to:**
```tsx
<p className="text-sm text-gray-500 dark:text-gray-400">
  The cycle wizard walks you through each step in about a minute. Or skip cycles entirely and log workouts freestyle.
</p>
```

---

### Change 7: Update App Tour - Progress Page (Slide 3)

**File:** `src/components/onboarding/AppTour.tsx`

**Location:** Around line 380-383, in the body content for slide 3.

**Current text:**
```tsx
<p className="text-sm text-gray-500 dark:text-gray-400">
  Sync with an account to access your data on any device.
</p>
```

**Change to:**
```tsx
<p className="text-sm text-gray-500 dark:text-gray-400">
  Sync with an account to access your data on any device. Visit <strong>Settings</strong> to customize rest timers, training defaults, and more.
</p>
```

---

### Change 8: Update ExerciseSuccessSlide (ReadySlide)

**File:** `src/components/onboarding/slides/ReadySlide.tsx`

**Location:** Around line 86-94, the instruction text paragraph.

**Current text:**
```tsx
<p className={`...`}>
  You can add more exercises from the Exercises tab after finishing the tour.
</p>
```

**Change to:**
```tsx
<p className={`...`}>
  Add more exercises from the Exercises tab, then create a training cycle—or start logging workouts right away in ad-hoc mode.
</p>
```

---

## Testing Checklist

After implementing changes, verify:

- [ ] FirstExerciseSlide displays measurement type toggle
- [ ] Selecting "Plank" from chips sets measurement type to "time"
- [ ] Selecting a reps-based chip sets measurement type to "reps"
- [ ] Manually toggling measurement type works correctly
- [ ] RecordMaxSlide shows "reps" for reps-based exercises
- [ ] RecordMaxSlide shows "seconds" for time-based exercises
- [ ] Exercise is created with correct measurement type in database
- [ ] App Tour Today slide shows "Tap + to add extra sets anytime"
- [ ] App Tour Cycles slide mentions wizard walkthrough
- [ ] App Tour Progress slide mentions Settings
- [ ] ExerciseSuccessSlide mentions ad-hoc mode
- [ ] All animations and transitions still work smoothly
- [ ] No TypeScript errors
- [ ] All existing tests pass

---

## Files Modified

| File | Type of Change |
|------|----------------|
| `src/components/onboarding/slides/FirstExerciseSlide.tsx` | Add measurement type UI and state |
| `src/components/onboarding/slides/RecordMaxSlide.tsx` | Add measurement type prop, conditional UI |
| `src/components/onboarding/slides/ReadySlide.tsx` | Update instructional text |
| `src/components/onboarding/visuals/ExerciseSuggestionChips.tsx` | Update interface and suggestions array |
| `src/components/onboarding/OnboardingFlow.tsx` | Pass measurement type through flow |
| `src/components/onboarding/AppTour.tsx` | Update 3 slides with text changes, add Plus icon |

---

## Version Bump

After completing changes, bump version to next patch (or minor if preferred):
- Update `package.json` version
- Add changelog entry describing onboarding improvements

Suggested changelog entry:
```markdown
## [X.X.X] - YYYY-MM-DD

### Changed
- **Onboarding: Measurement Type Support** - Users can now choose between reps and time-based measurement when creating their first exercise
- **Onboarding: Improved Copy** - Updated App Tour text to better explain extra sets, cycle creation wizard, and Settings access
- **Onboarding: Ad-Hoc Mode Mention** - Exercise success screen now mentions ad-hoc mode as an alternative to cycles

### Added
- Plank added to exercise suggestion chips as time-based example
```
