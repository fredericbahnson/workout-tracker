# Implementation Plan: Standard/Advanced App Mode

**Version:** 1.0  
**Date:** January 10, 2026  
**Feature:** User-controlled Standard/Advanced mode selector  
**Target Version:** 2.6.0

---

## Executive Summary

This document outlines the implementation plan for adding a Standard/Advanced mode toggle to Ascend. This feature allows users to choose between a simplified RFEM-focused experience (Standard) and the full-featured app (Advanced), preparing the app for potential tiered access in future App Store distribution.

### Key Objectives

1. Add persistent app mode preference to user settings
2. Filter cycle creation options based on selected mode
3. Maintain backward compatibility with existing functionality
4. Prepare infrastructure for future monetization/subscription model

---

## Architecture Overview

### Current State

The app currently offers three cycle progression modes via `CycleTypeSelector`:
- **RFEM Training Cycle** - Periodized progression based on max reps
- **Simple Progression Cycle** - Traditional rep/weight increments
- **Mixed Cycle** - Per-exercise RFEM or Simple configuration
- **Max Testing** - Establish/re-test maximum reps

### Proposed State

| App Mode | Available Cycle Types |
|----------|----------------------|
| **Standard** | RFEM Training, Max Testing |
| **Advanced** | RFEM Training, Simple Progression, Mixed Cycle, Max Testing |

---

## Implementation Phases

### Phase 1: Type Definitions & Store Updates

#### 1.1 Add App Mode Type

**File:** `src/types/constants.ts`

```typescript
/**
 * App feature mode.
 * - standard: RFEM-focused simplified experience
 * - advanced: Full feature set with all progression modes
 */
export type AppMode = 'standard' | 'advanced';

export const APP_MODE_LABELS: Record<AppMode, string> = {
  standard: 'Standard',
  advanced: 'Advanced',
};
```

**File:** `src/types/index.ts`

Add export:
```typescript
export type { AppMode } from './constants';
export { APP_MODE_LABELS } from './constants';
```

#### 1.2 Update App Store

**File:** `src/stores/appStore.ts`

Add to the store interface and implementation:

```typescript
import type { AppMode } from '@/types';

interface AppState {
  // ... existing properties
  
  // App mode
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
}

// In the store implementation:
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // ... existing state
      
      // App mode - default to advanced for existing users
      appMode: 'advanced',
      setAppMode: (mode) => set({ appMode: mode }),
    }),
    {
      name: 'ascend-settings',
      partialize: (state) => ({ 
        // ... existing persisted fields
        appMode: state.appMode,
      }),
    }
  )
);
```

**Migration Note:** Defaulting to `'advanced'` ensures existing users retain full functionality. New users can choose during onboarding (Phase 4, optional).

---

### Phase 2: Utility Functions

#### 2.1 Create Mode Utility Functions

**File:** `src/utils/appMode.ts` (new file)

```typescript
/**
 * App Mode Utilities
 * 
 * Helper functions for checking app mode and feature availability.
 */

import type { AppMode, ProgressionMode } from '@/types';

/**
 * Check if the app is in Standard mode.
 */
export function isStandardMode(mode: AppMode): boolean {
  return mode === 'standard';
}

/**
 * Check if the app is in Advanced mode.
 */
export function isAdvancedMode(mode: AppMode): boolean {
  return mode === 'advanced';
}

/**
 * Get available progression modes based on app mode.
 * Standard: Only RFEM
 * Advanced: RFEM, Simple, Mixed
 */
export function getAvailableProgressionModes(appMode: AppMode): ProgressionMode[] {
  if (appMode === 'standard') {
    return ['rfem'];
  }
  return ['rfem', 'simple', 'mixed'];
}

/**
 * Check if a specific progression mode is available in the current app mode.
 */
export function isProgressionModeAvailable(
  progressionMode: ProgressionMode, 
  appMode: AppMode
): boolean {
  return getAvailableProgressionModes(appMode).includes(progressionMode);
}

/**
 * Check if Simple Progression is available (Advanced mode only).
 */
export function isSimpleProgressionAvailable(appMode: AppMode): boolean {
  return isAdvancedMode(appMode);
}

/**
 * Check if Mixed Cycle is available (Advanced mode only).
 */
export function isMixedCycleAvailable(appMode: AppMode): boolean {
  return isAdvancedMode(appMode);
}
```

**File:** `src/utils/index.ts`

Add export:
```typescript
export * from './appMode';
```

---

### Phase 3: UI Components

#### 3.1 Create App Mode Selector Component

**File:** `src/components/settings/AppModeSelector.tsx` (new file)

```typescript
/**
 * AppModeSelector Component
 * 
 * Toggle control for switching between Standard and Advanced app modes.
 * Used in Settings page.
 */

import { Zap, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import type { AppMode } from '@/types';

interface AppModeSelectorProps {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
}

export function AppModeSelector({ mode, onChange }: AppModeSelectorProps) {
  const options: Array<{
    value: AppMode;
    label: string;
    description: string;
    icon: typeof Zap;
    gradient: string;
  }> = [
    {
      value: 'standard',
      label: 'Standard',
      description: 'RFEM-based training with max testing cycles',
      icon: Zap,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      value: 'advanced',
      label: 'Advanced',
      description: 'All progression modes including simple and mixed cycles',
      icon: Sparkles,
      gradient: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            App Mode
          </h3>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Choose your training experience
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          {options.map(({ value, label, description, icon: Icon, gradient }) => (
            <button
              key={value}
              onClick={() => onChange(value)}
              className={`
                p-3 rounded-xl border-2 text-left transition-all
                ${mode === value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <div className={`
                w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} 
                flex items-center justify-center mb-2
              `}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                {label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {description}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**File:** `src/components/settings/index.ts`

Add export:
```typescript
export * from './AppModeSelector';
```

#### 3.2 Update CycleTypeSelector Component

**File:** `src/components/cycles/CycleTypeSelector.tsx`

Modify to accept `appMode` prop and conditionally render options:

```typescript
import { Calendar, Target, ArrowRight, TrendingUp, Layers } from 'lucide-react';
import { Button } from '@/components/ui';
import { isAdvancedMode } from '@/utils/appMode';
import type { ProgressionMode, AppMode } from '@/types';

interface CycleTypeSelectorProps {
  appMode: AppMode;
  onSelectTraining: (mode: ProgressionMode) => void;
  onSelectMaxTesting: () => void;
  onCancel: () => void;
}

export function CycleTypeSelector({ 
  appMode,
  onSelectTraining, 
  onSelectMaxTesting, 
  onCancel 
}: CycleTypeSelectorProps) {
  const showAdvancedOptions = isAdvancedMode(appMode);
  
  return (
    <div className="p-4 space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          What would you like to create?
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Choose the type of cycle to set up
        </p>
      </div>

      <div className="space-y-3">
        {/* RFEM Training Cycle Option - Always visible */}
        <button
          onClick={() => onSelectTraining('rfem')}
          className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-dark-border hover:border-primary-500 dark:hover:border-primary-500 bg-white dark:bg-dark-surface transition-colors text-left group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  RFEM Training Cycle
                </h3>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Periodized progression based on your max reps. 
                Targets calculated automatically using RFEM percentages.
              </p>
            </div>
          </div>
        </button>

        {/* Simple Progression Cycle Option - Advanced only */}
        {showAdvancedOptions && (
          <button
            onClick={() => onSelectTraining('simple')}
            className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-dark-border hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-dark-surface transition-colors text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Simple Progression Cycle
                  </h3>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Set your own rep targets for each exercise. 
                  Optionally add reps each workout or week.
                </p>
              </div>
            </div>
          </button>
        )}

        {/* Mixed Cycle Option - Advanced only */}
        {showAdvancedOptions && (
          <button
            onClick={() => onSelectTraining('mixed')}
            className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-dark-border hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-dark-surface transition-colors text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Mixed Cycle
                  </h3>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Configure RFEM or simple progression individually for each exercise. 
                  Best for combining different training approaches.
                </p>
              </div>
            </div>
          </button>
        )}

        {/* Max Testing Option - Always visible */}
        <button
          onClick={onSelectMaxTesting}
          className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-dark-border hover:border-purple-500 dark:hover:border-purple-500 bg-white dark:bg-dark-surface transition-colors text-left group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Max Rep Testing
                </h3>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Establish or re-test your maximum reps for exercises. 
                Includes warmup sets and records new maxes automatically.
              </p>
            </div>
          </div>
        </button>
      </div>

      <div className="pt-4">
        <Button variant="ghost" onClick={onCancel} className="w-full">
          Cancel
        </Button>
      </div>
    </div>
  );
}
```

---

### Phase 4: Page Updates

#### 4.1 Update Settings Page

**File:** `src/pages/Settings.tsx`

Add the App Mode selector card near the top of the settings (after Account & Sync):

```typescript
import { AppModeSelector } from '@/components/settings';

export function SettingsPage() {
  const { 
    // ... existing destructuring
    appMode, 
    setAppMode 
  } = useAppStore();

  // ... existing code

  return (
    <>
      <PageHeader title="Settings" />

      <div className="px-4 py-4 space-y-4">
        {/* Message */}
        {/* ... existing message code */}

        {/* Account / Cloud Sync */}
        {/* ... existing account card */}

        {/* App Mode - NEW */}
        <AppModeSelector mode={appMode} onChange={setAppMode} />

        {/* Theme */}
        {/* ... rest of existing cards */}
      </div>

      {/* ... existing modals */}
    </>
  );
}
```

#### 4.2 Update Schedule Page

**File:** `src/pages/Schedule.tsx`

Pass `appMode` to `CycleTypeSelector`:

```typescript
import { useAppStore } from '@/stores/appStore';

export function SchedulePage() {
  // ... existing hooks
  const { defaults, appMode } = useAppStore();

  // ... existing code

  // Update CycleTypeSelectorModal component
  function CycleTypeSelectorModal({ 
    isOpen, 
    appMode,
    onSelectTraining, 
    onSelectMaxTesting, 
    onClose 
  }: { 
    isOpen: boolean;
    appMode: AppMode;
    onSelectTraining: (mode: ProgressionMode) => void;
    onSelectMaxTesting: () => void;
    onClose: () => void;
  }) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Create New Cycle">
        <CycleTypeSelector
          appMode={appMode}
          onSelectTraining={onSelectTraining}
          onSelectMaxTesting={onSelectMaxTesting}
          onCancel={onClose}
        />
      </Modal>
    );
  }

  // Update all usages of CycleTypeSelectorModal to include appMode prop:
  // <CycleTypeSelectorModal appMode={appMode} ... />
}
```

---

### Phase 5: Testing & Validation

#### 5.1 Test Cases

**Unit Tests:** `src/utils/appMode.test.ts` (new file)

```typescript
import { describe, it, expect } from 'vitest';
import {
  isStandardMode,
  isAdvancedMode,
  getAvailableProgressionModes,
  isProgressionModeAvailable,
} from './appMode';

describe('appMode utilities', () => {
  describe('isStandardMode', () => {
    it('returns true for standard mode', () => {
      expect(isStandardMode('standard')).toBe(true);
    });
    
    it('returns false for advanced mode', () => {
      expect(isStandardMode('advanced')).toBe(false);
    });
  });

  describe('isAdvancedMode', () => {
    it('returns true for advanced mode', () => {
      expect(isAdvancedMode('advanced')).toBe(true);
    });
    
    it('returns false for standard mode', () => {
      expect(isAdvancedMode('standard')).toBe(false);
    });
  });

  describe('getAvailableProgressionModes', () => {
    it('returns only rfem for standard mode', () => {
      expect(getAvailableProgressionModes('standard')).toEqual(['rfem']);
    });

    it('returns all modes for advanced mode', () => {
      expect(getAvailableProgressionModes('advanced')).toEqual(['rfem', 'simple', 'mixed']);
    });
  });

  describe('isProgressionModeAvailable', () => {
    it('rfem is available in standard mode', () => {
      expect(isProgressionModeAvailable('rfem', 'standard')).toBe(true);
    });

    it('simple is not available in standard mode', () => {
      expect(isProgressionModeAvailable('simple', 'standard')).toBe(false);
    });

    it('mixed is not available in standard mode', () => {
      expect(isProgressionModeAvailable('mixed', 'standard')).toBe(false);
    });

    it('all modes are available in advanced mode', () => {
      expect(isProgressionModeAvailable('rfem', 'advanced')).toBe(true);
      expect(isProgressionModeAvailable('simple', 'advanced')).toBe(true);
      expect(isProgressionModeAvailable('mixed', 'advanced')).toBe(true);
    });
  });
});
```

#### 5.2 Manual Testing Checklist

- [ ] Settings page displays App Mode selector
- [ ] Mode persists across app restarts
- [ ] Standard mode shows only RFEM and Max Testing in CycleTypeSelector
- [ ] Advanced mode shows all cycle types
- [ ] Existing cycles remain accessible regardless of mode
- [ ] Mode can be changed without affecting existing data
- [ ] UI updates immediately when mode changes

---

## Phase 6: Optional Enhancements (Future)

### 6.1 Onboarding Mode Selection

Add mode selection to the onboarding flow for new users:

**File:** `src/components/onboarding/OnboardingFlow.tsx`

Add a new slide after the existing slides, before exercise creation:

```typescript
{
  id: 'mode-selection',
  icon: Sparkles,
  title: 'Choose Your Experience',
  description: 'Select Standard for focused RFEM training, or Advanced for full control over your progression.',
  gradient: 'from-indigo-500 to-purple-500',
  isInteractive: true, // Flag to render AppModeSelector
}
```

### 6.2 Settings Badge/Indicator

Show current mode in header or navigation:

```typescript
// In Layout.tsx or PageHeader.tsx
{appMode === 'standard' && (
  <Badge className="text-2xs">Standard</Badge>
)}
```

### 6.3 Future Monetization Hooks

When preparing for App Store distribution, the mode toggle could be converted to:

```typescript
interface AppFeatureAccess {
  mode: AppMode;
  isSubscribed: boolean;
  canAccessAdvanced: boolean;
}

// In subscription context
function checkAdvancedAccess(): boolean {
  // Check subscription status, IAP, etc.
}
```

---

## File Change Summary

### New Files

| File | Purpose |
|------|---------|
| `src/utils/appMode.ts` | App mode utility functions |
| `src/utils/appMode.test.ts` | Unit tests for mode utilities |
| `src/components/settings/AppModeSelector.tsx` | Mode toggle component |

### Modified Files

| File | Changes |
|------|---------|
| `src/types/constants.ts` | Add `AppMode` type and labels |
| `src/types/index.ts` | Export new type |
| `src/utils/index.ts` | Export new utilities |
| `src/stores/appStore.ts` | Add `appMode` state and setter |
| `src/components/cycles/CycleTypeSelector.tsx` | Accept `appMode` prop, filter options |
| `src/components/settings/index.ts` | Export `AppModeSelector` |
| `src/pages/Settings.tsx` | Add App Mode section |
| `src/pages/Schedule.tsx` | Pass `appMode` to CycleTypeSelector |

---

## Implementation Order

1. **Type definitions** (`src/types/constants.ts`, `src/types/index.ts`)
2. **Utility functions** (`src/utils/appMode.ts`, `src/utils/index.ts`)
3. **Store update** (`src/stores/appStore.ts`)
4. **AppModeSelector component** (`src/components/settings/AppModeSelector.tsx`)
5. **Update CycleTypeSelector** (`src/components/cycles/CycleTypeSelector.tsx`)
6. **Update Settings page** (`src/pages/Settings.tsx`)
7. **Update Schedule page** (`src/pages/Schedule.tsx`)
8. **Write tests** (`src/utils/appMode.test.ts`)
9. **Manual testing**
10. **Update version** (`src/constants/version.ts`)
11. **Update CHANGELOG** (`CHANGELOG.md`)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Existing users lose features | Low | High | Default to 'advanced' mode |
| Store migration issues | Low | Medium | Zustand handles missing keys gracefully |
| UI confusion | Medium | Low | Clear mode descriptions and easy toggle |
| Breaking existing cycles | None | High | Mode only affects creation, not existing data |

---

## Estimated Effort

| Phase | Estimated Time |
|-------|----------------|
| Phase 1: Types & Store | 30 minutes |
| Phase 2: Utilities | 20 minutes |
| Phase 3: UI Components | 1 hour |
| Phase 4: Page Updates | 45 minutes |
| Phase 5: Testing | 45 minutes |
| **Total** | **~3.5 hours** |

---

## Acceptance Criteria

1. ✅ App mode can be toggled in Settings
2. ✅ Mode preference persists across sessions
3. ✅ Standard mode hides Simple and Mixed cycle options
4. ✅ Advanced mode shows all cycle options
5. ✅ Existing users default to Advanced mode
6. ✅ No impact on existing cycles or data
7. ✅ All new code includes appropriate TypeScript types
8. ✅ Utility functions have unit test coverage
9. ✅ Code follows existing architectural patterns

---

## Appendix: Complete Code Listings

The code examples in this document are designed to integrate seamlessly with the existing codebase patterns. Key conventions followed:

- **JSDoc comments** for exported functions
- **React.memo** for presentational components where beneficial
- **Tailwind CSS** for styling consistency
- **Lucide icons** matching existing icon usage
- **Type-safe props** with TypeScript interfaces
- **Path aliases** (`@/`) for imports
- **Scoped logger** for debugging (if needed)
