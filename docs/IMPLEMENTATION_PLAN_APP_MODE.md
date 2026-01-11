# Implementation Plan: Standard and Advanced App Modes

**Document Version:** 1.0  
**Created:** 2026-01-11  
**Target Version:** 2.7.0  
**Status:** Planning

## Executive Summary

This document outlines the implementation plan for adding Standard and Advanced app modes to Ascend. Standard mode provides a simplified interface focused on RFEM-based training, while Advanced mode exposes the full feature set including Simple Progression and Mixed cycle types.

The app mode preference will sync across devices via the existing `UserPreferences` infrastructure, ensuring consistent user experience across platforms. This architecture also prepares for future subscription-based feature gating.

---

## Table of Contents

1. [Requirements](#1-requirements)
2. [Architecture Overview](#2-architecture-overview)
3. [Implementation Phases](#3-implementation-phases)
4. [Detailed Implementation](#4-detailed-implementation)
5. [Database Migration](#5-database-migration)
6. [Testing Strategy](#6-testing-strategy)
7. [Future Considerations](#7-future-considerations)
8. [File Change Summary](#8-file-change-summary)

---

## 1. Requirements

### 1.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | User can select between Standard and Advanced modes | Must Have |
| FR-2 | Mode selection persists locally (IndexedDB) | Must Have |
| FR-3 | Mode selection syncs across devices via Supabase | Must Have |
| FR-4 | Standard mode limits cycle creation to RFEM and Max Testing only | Must Have |
| FR-5 | Advanced mode provides full access to all cycle types | Must Have |
| FR-6 | Default mode for new users is Standard | Must Have |
| FR-7 | Mode switch is accessible from Settings page | Must Have |
| FR-8 | Mode affects only cycle creation wizard, not existing cycles | Must Have |

### 1.2 Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | Mode switch should be instantaneous (no page reload) | Must Have |
| NFR-2 | Backward compatible with existing data | Must Have |
| NFR-3 | Architecture supports future subscription gating | Should Have |
| NFR-4 | Clear UI indication of current mode | Should Have |

### 1.3 Mode Feature Matrix

| Feature | Standard | Advanced |
|---------|----------|----------|
| RFEM Training Cycles | ✅ | ✅ |
| Max Rep Testing Cycles | ✅ | ✅ |
| Simple Progression Cycles | ❌ | ✅ |
| Mixed Cycles | ❌ | ✅ |
| Warmup Sets | ✅ | ✅ |
| Cloud Sync | ✅ | ✅ |
| All other features | ✅ | ✅ |

---

## 2. Architecture Overview

### 2.1 Current Preferences Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Preferences Flow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐         ┌───────────────────┐                │
│   │  appStore    │         │ SyncedPreferences │                │
│   │  (Zustand)   │         │    (Context)      │                │
│   ├──────────────┤         ├───────────────────┤                │
│   │ • theme      │         │ • defaultMaxReps  │                │
│   │ • fontSize   │         │ • weeklySetGoals  │                │
│   │ • repDisplay │         │ • restTimer       │                │
│   └──────┬───────┘         │ • etc.            │                │
│          │                 └─────────┬─────────┘                │
│          ▼                           ▼                          │
│   ┌──────────────┐         ┌───────────────────┐                │
│   │ localStorage │         │    IndexedDB      │                │
│   │ (device only)│         │  (local-first)    │                │
│   └──────────────┘         └─────────┬─────────┘                │
│                                      │                          │
│                                      ▼                          │
│                            ┌───────────────────┐                │
│                            │    Supabase       │                │
│                            │  (cloud sync)     │                │
│                            └───────────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Where App Mode Fits

The `appMode` setting should be stored in **SyncedPreferences** (not appStore) because:

1. **Cross-device consistency**: Users expect the same mode on all devices
2. **Subscription preparation**: Future subscription verification will happen server-side
3. **Architectural consistency**: It's a training-related preference, not a UI preference

### 2.3 Component Impact Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│                    Components Affected by Mode                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Settings.tsx                                                   │
│   └── New "App Mode" section with toggle/selector               │
│                                                                  │
│   CycleTypeSelector.tsx                                          │
│   └── Conditionally render cycle options based on mode          │
│                                                                  │
│   SyncedPreferencesContext.tsx                                   │
│   └── Add appMode state and setter                              │
│                                                                  │
│   UserPreferencesRepo.ts                                         │
│   └── Add setAppMode method                                     │
│                                                                  │
│   types/preferences.ts                                           │
│   └── Add AppMode type and field to UserPreferences             │
│                                                                  │
│   services/sync/types.ts                                         │
│   └── Add app_mode to RemoteUserPreferences                     │
│                                                                  │
│   services/sync/transformers.ts                                  │
│   └── Transform appMode <-> app_mode                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Implementation Phases

### Phase 1: Type System & Data Layer (Foundation)
**Estimated Time:** 1-2 hours  
**Risk:** Low

1. Define `AppMode` type
2. Add `appMode` to `UserPreferences` interface
3. Update `DEFAULT_USER_PREFERENCES`
4. Add `setAppMode` to `UserPreferencesRepo`

### Phase 2: Sync Infrastructure
**Estimated Time:** 1-2 hours  
**Risk:** Medium (requires DB migration)

1. Update `RemoteUserPreferences` type
2. Update sync transformers
3. Create Supabase migration script
4. Test sync round-trip

### Phase 3: Context & Hook Layer
**Estimated Time:** 1 hour  
**Risk:** Low

1. Add `appMode` to `SyncedPreferencesContext`
2. Add `setAppMode` setter function
3. Export new hook functionality

### Phase 4: UI Implementation
**Estimated Time:** 2-3 hours  
**Risk:** Low

1. Add mode selector to Settings page
2. Update `CycleTypeSelector` to filter options
3. Add visual indicator of current mode (optional)

### Phase 5: Testing & Validation
**Estimated Time:** 2-3 hours  
**Risk:** Low

1. Unit tests for new repo methods
2. Integration tests for sync
3. Manual testing of mode switching
4. Cross-device sync verification

---

## 4. Detailed Implementation

### 4.1 Type Definitions

**File:** `src/types/preferences.ts`

```typescript
/**
 * Application mode determines available features.
 * - standard: RFEM and Max Testing cycles only (simplified)
 * - advanced: All cycle types and features available
 */
export type AppMode = 'standard' | 'advanced';

export interface UserPreferences {
  id: string;
  
  /** Application mode - determines available features */
  appMode: AppMode;
  
  // ... existing fields ...
  defaultMaxReps: number;
  defaultConditioningReps: number;
  conditioningWeeklyIncrement: number;
  weeklySetGoals: WeeklySetGoals;
  restTimer: TimerSettings;
  maxTestRestTimer: TimerSettings;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_USER_PREFERENCES: Omit<UserPreferences, 'id' | 'createdAt' | 'updatedAt'> = {
  appMode: 'standard', // Default to standard for new users
  defaultMaxReps: 10,
  defaultConditioningReps: 30,
  conditioningWeeklyIncrement: 10,
  weeklySetGoals: {
    push: 10,
    pull: 10,
    legs: 10,
    core: 0,
    balance: 0,
    mobility: 0,
    other: 0,
  },
  restTimer: {
    enabled: false,
    durationSeconds: 180,
  },
  maxTestRestTimer: {
    enabled: false,
    durationSeconds: 300,
  },
};
```

### 4.2 Repository Updates

**File:** `src/data/repositories/UserPreferencesRepo.ts`

```typescript
// Add new method
async setAppMode(mode: AppMode): Promise<UserPreferences> {
  return this.save({ appMode: mode });
}
```

### 4.3 Sync Types

**File:** `src/services/sync/types.ts`

```typescript
export interface RemoteUserPreferences {
  id: string;
  user_id: string;
  app_mode: string; // 'standard' | 'advanced'
  default_max_reps: number;
  default_conditioning_reps: number;
  conditioning_weekly_increment: number;
  weekly_set_goals: unknown;
  rest_timer_enabled: boolean;
  rest_timer_duration_seconds: number;
  max_test_rest_timer_enabled: boolean;
  max_test_rest_timer_duration_seconds: number;
  created_at: string;
  updated_at: string;
}
```

### 4.4 Sync Transformers

**File:** `src/services/sync/transformers.ts`

```typescript
import type { AppMode } from '@/types';

export function remoteToLocalUserPreferences(remote: RemoteUserPreferences): UserPreferences {
  return {
    id: remote.id,
    appMode: (remote.app_mode as AppMode) || 'standard', // Fallback for existing records
    defaultMaxReps: remote.default_max_reps,
    defaultConditioningReps: remote.default_conditioning_reps,
    conditioningWeeklyIncrement: remote.conditioning_weekly_increment,
    weeklySetGoals: remote.weekly_set_goals as WeeklySetGoals,
    restTimer: {
      enabled: remote.rest_timer_enabled,
      durationSeconds: remote.rest_timer_duration_seconds,
    },
    maxTestRestTimer: {
      enabled: remote.max_test_rest_timer_enabled,
      durationSeconds: remote.max_test_rest_timer_duration_seconds,
    },
    createdAt: toDateRequired(remote.created_at),
    updatedAt: toDateRequired(remote.updated_at),
  };
}

export function localToRemoteUserPreferences(local: UserPreferences, userId: string) {
  return {
    id: local.id,
    user_id: userId,
    app_mode: local.appMode || 'standard',
    default_max_reps: local.defaultMaxReps,
    default_conditioning_reps: local.defaultConditioningReps,
    conditioning_weekly_increment: local.conditioningWeeklyIncrement,
    weekly_set_goals: local.weeklySetGoals,
    rest_timer_enabled: local.restTimer.enabled,
    rest_timer_duration_seconds: local.restTimer.durationSeconds,
    max_test_rest_timer_enabled: local.maxTestRestTimer.enabled,
    max_test_rest_timer_duration_seconds: local.maxTestRestTimer.durationSeconds,
    created_at: toISOString(local.createdAt),
    updated_at: toISOString(local.updatedAt),
  };
}
```

### 4.5 Context Updates

**File:** `src/contexts/SyncedPreferencesContext.tsx`

```typescript
import type { UserPreferences, TimerSettings, ExerciseType, AppMode } from '@/types';

interface SyncedPreferencesContextType {
  preferences: UserPreferences;
  isLoading: boolean;
  
  // Existing setters...
  setDefaultMaxReps: (value: number) => Promise<void>;
  setDefaultConditioningReps: (value: number) => Promise<void>;
  setConditioningWeeklyIncrement: (value: number) => Promise<void>;
  setWeeklySetGoal: (type: ExerciseType, value: number) => Promise<void>;
  setRestTimer: (settings: Partial<TimerSettings>) => Promise<void>;
  setMaxTestRestTimer: (settings: Partial<TimerSettings>) => Promise<void>;
  
  // New setter
  setAppMode: (mode: AppMode) => Promise<void>;
}

// In provider:
const setAppMode = useCallback(async (mode: AppMode) => {
  const updated = await UserPreferencesRepo.setAppMode(mode);
  await saveAndSync(updated);
}, [saveAndSync]);

// In return value:
return (
  <SyncedPreferencesContext.Provider value={{
    preferences,
    isLoading,
    setDefaultMaxReps,
    setDefaultConditioningReps,
    setConditioningWeeklyIncrement,
    setWeeklySetGoal,
    setRestTimer,
    setMaxTestRestTimer,
    setAppMode, // New
  }}>
    {children}
  </SyncedPreferencesContext.Provider>
);
```

### 4.6 CycleTypeSelector Updates

**File:** `src/components/cycles/CycleTypeSelector.tsx`

```typescript
import { useSyncedPreferences } from '@/contexts';

interface CycleTypeSelectorProps {
  onSelectTraining: (mode: ProgressionMode) => void;
  onSelectMaxTesting: () => void;
  onCancel: () => void;
}

export function CycleTypeSelector({ 
  onSelectTraining, 
  onSelectMaxTesting, 
  onCancel 
}: CycleTypeSelectorProps) {
  const { preferences } = useSyncedPreferences();
  const isAdvancedMode = preferences.appMode === 'advanced';

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
        {/* RFEM Training Cycle - Always visible */}
        <button onClick={() => onSelectTraining('rfem')} /* ... */ >
          {/* RFEM option content */}
        </button>

        {/* Simple Progression - Advanced mode only */}
        {isAdvancedMode && (
          <button onClick={() => onSelectTraining('simple')} /* ... */ >
            {/* Simple progression content */}
          </button>
        )}

        {/* Mixed Cycle - Advanced mode only */}
        {isAdvancedMode && (
          <button onClick={() => onSelectTraining('mixed')} /* ... */ >
            {/* Mixed cycle content */}
          </button>
        )}

        {/* Max Testing - Always visible */}
        <button onClick={onSelectMaxTesting} /* ... */ >
          {/* Max testing content */}
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

### 4.7 Settings Page Updates

**File:** `src/pages/Settings.tsx`

Add a new section for App Mode selection:

```tsx
// Import
import type { AppMode } from '@/types';

// In component, get from context
const { 
  preferences, 
  setAppMode,
  // ... other setters
} = useSyncedPreferences();

// Handler
const handleAppModeChange = async (mode: AppMode) => {
  await setAppMode(mode);
  setMessage({ type: 'success', text: `Switched to ${mode === 'advanced' ? 'Advanced' : 'Standard'} mode` });
};

// JSX - Add section after "About" or before "Training Defaults"
<Card>
  <CardContent className="p-6">
    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
      <Layers className="w-5 h-5" />
      App Mode
    </h2>
    
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
      Choose between a simplified interface or full feature access.
    </p>
    
    <div className="space-y-3">
      <button
        onClick={() => handleAppModeChange('standard')}
        className={`w-full p-4 rounded-xl border-2 transition-colors text-left ${
          preferences.appMode === 'standard'
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-200 dark:border-dark-border hover:border-primary-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            preferences.appMode === 'standard'
              ? 'border-primary-500 bg-primary-500'
              : 'border-gray-300 dark:border-gray-600'
          }`}>
            {preferences.appMode === 'standard' && (
              <div className="w-2 h-2 rounded-full bg-white" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Standard
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              RFEM-based training cycles and max testing. Perfect for KBoges-style calisthenics.
            </p>
          </div>
        </div>
      </button>
      
      <button
        onClick={() => handleAppModeChange('advanced')}
        className={`w-full p-4 rounded-xl border-2 transition-colors text-left ${
          preferences.appMode === 'advanced'
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-200 dark:border-dark-border hover:border-primary-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            preferences.appMode === 'advanced'
              ? 'border-primary-500 bg-primary-500'
              : 'border-gray-300 dark:border-gray-600'
          }`}>
            {preferences.appMode === 'advanced' && (
              <div className="w-2 h-2 rounded-full bg-white" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Advanced
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Full access to all cycle types including simple progression and mixed modes.
            </p>
          </div>
        </div>
      </button>
    </div>
  </CardContent>
</Card>
```

---

## 5. Database Migration

**File:** `supabase-migration-app-mode.sql`

```sql
-- Migration: Add app_mode column to user_preferences
-- Date: 2026-01-XX
-- Version: 2.7.0

-- =============================================================================
-- ADD APP_MODE COLUMN
-- =============================================================================

-- Add the app_mode column with default 'standard'
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS app_mode TEXT NOT NULL DEFAULT 'standard';

-- Add check constraint to ensure valid values
ALTER TABLE user_preferences 
ADD CONSTRAINT valid_app_mode CHECK (app_mode IN ('standard', 'advanced'));

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN user_preferences.app_mode IS 'Application mode: standard (RFEM only) or advanced (all features)';

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Verify the column was added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_preferences' AND column_name = 'app_mode';
```

### 5.1 Migration Steps

1. **Backup first**: Create a backup of the `user_preferences` table
2. **Run migration**: Execute the SQL in Supabase SQL editor
3. **Verify**: Check that all existing rows have `app_mode = 'standard'`
4. **Test**: Create a test user and verify the column works

### 5.2 Rollback Script

```sql
-- Rollback: Remove app_mode column
ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS valid_app_mode;
ALTER TABLE user_preferences DROP COLUMN IF EXISTS app_mode;
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

**File:** `src/data/repositories/UserPreferencesRepo.test.ts`

```typescript
describe('UserPreferencesRepo', () => {
  describe('setAppMode', () => {
    it('should set app mode to standard', async () => {
      const result = await UserPreferencesRepo.setAppMode('standard');
      expect(result.appMode).toBe('standard');
    });

    it('should set app mode to advanced', async () => {
      const result = await UserPreferencesRepo.setAppMode('advanced');
      expect(result.appMode).toBe('advanced');
    });

    it('should persist mode change', async () => {
      await UserPreferencesRepo.setAppMode('advanced');
      const prefs = await UserPreferencesRepo.get();
      expect(prefs.appMode).toBe('advanced');
    });

    it('should update timestamps on mode change', async () => {
      const before = await UserPreferencesRepo.get();
      await new Promise(r => setTimeout(r, 10));
      const after = await UserPreferencesRepo.setAppMode('advanced');
      expect(after.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime());
    });
  });
});
```

### 6.2 Integration Tests

**File:** `src/services/syncService.test.ts`

```typescript
describe('SyncService - User Preferences', () => {
  it('should sync app mode to cloud', async () => {
    // Set mode locally
    const prefs = await UserPreferencesRepo.setAppMode('advanced');
    
    // Sync to cloud
    await SyncService.syncItem('user_preferences', prefs, mockUserId);
    
    // Verify in cloud (mock or actual)
    const cloudPrefs = await fetchFromCloud('user_preferences', prefs.id);
    expect(cloudPrefs.app_mode).toBe('advanced');
  });

  it('should pull app mode from cloud', async () => {
    // Set up cloud data with advanced mode
    await seedCloudData({ app_mode: 'advanced' });
    
    // Pull from cloud
    await SyncService.pullFromCloud(mockUserId);
    
    // Verify local
    const localPrefs = await UserPreferencesRepo.get();
    expect(localPrefs.appMode).toBe('advanced');
  });
});
```

### 6.3 Manual Test Cases

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| TC-1: Default mode | New user opens app | Mode is 'standard' |
| TC-2: Switch to advanced | Settings → App Mode → Advanced | Mode changes, UI updates |
| TC-3: Cycle options in standard | Standard mode → New Cycle | Only RFEM and Max Testing visible |
| TC-4: Cycle options in advanced | Advanced mode → New Cycle | All 4 cycle types visible |
| TC-5: Cross-device sync | Change mode on device A | Device B shows same mode after sync |
| TC-6: Existing cycles unaffected | Switch modes | Previously created cycles work normally |
| TC-7: Offline mode change | Change mode while offline | Mode persists, syncs when online |

---

## 7. Future Considerations

### 7.1 Subscription Integration

When implementing subscription-based feature gating:

```typescript
// Future: Subscription-aware mode checking
interface SubscriptionStatus {
  tier: 'free' | 'premium';
  isActive: boolean;
  expiresAt?: Date;
}

function getEffectiveAppMode(
  userPreference: AppMode,
  subscription: SubscriptionStatus
): AppMode {
  // If user has premium subscription, allow their preference
  if (subscription.tier === 'premium' && subscription.isActive) {
    return userPreference;
  }
  
  // Free users are limited to standard mode
  return 'standard';
}
```

### 7.2 Feature Flag Architecture

Consider adding a more flexible feature flag system:

```typescript
interface FeatureFlags {
  simpleProgressionCycles: boolean;
  mixedCycles: boolean;
  // Future features...
  socialFeatures: boolean;
  advancedAnalytics: boolean;
}

function getFeatureFlags(appMode: AppMode): FeatureFlags {
  const standardFlags: FeatureFlags = {
    simpleProgressionCycles: false,
    mixedCycles: false,
    socialFeatures: false,
    advancedAnalytics: false,
  };
  
  const advancedFlags: FeatureFlags = {
    simpleProgressionCycles: true,
    mixedCycles: true,
    socialFeatures: false, // Not yet implemented
    advancedAnalytics: false, // Not yet implemented
  };
  
  return appMode === 'advanced' ? advancedFlags : standardFlags;
}
```

### 7.3 Analytics Events

Track mode usage for product decisions:

```typescript
// Track mode changes
analytics.track('app_mode_changed', {
  from: previousMode,
  to: newMode,
  timestamp: Date.now(),
});

// Track feature usage by mode
analytics.track('cycle_created', {
  cycleType: 'rfem',
  appMode: preferences.appMode,
});
```

---

## 8. File Change Summary

### 8.1 Files to Modify

| File | Changes |
|------|---------|
| `src/types/preferences.ts` | Add `AppMode` type, add `appMode` field |
| `src/types/index.ts` | Export `AppMode` type |
| `src/data/repositories/UserPreferencesRepo.ts` | Add `setAppMode` method |
| `src/services/sync/types.ts` | Add `app_mode` to `RemoteUserPreferences` |
| `src/services/sync/transformers.ts` | Update both transformers for `appMode` |
| `src/contexts/SyncedPreferencesContext.tsx` | Add `appMode` and `setAppMode` |
| `src/components/cycles/CycleTypeSelector.tsx` | Conditional rendering based on mode |
| `src/pages/Settings.tsx` | Add App Mode selector UI |

### 8.2 Files to Create

| File | Purpose |
|------|---------|
| `supabase-migration-app-mode.sql` | Database migration script |
| `src/data/repositories/UserPreferencesRepo.test.ts` | New test cases (if not exists) |

### 8.3 Estimated Total Changes

- **Lines added:** ~150-200
- **Lines modified:** ~50-75
- **New files:** 1-2
- **Total effort:** 8-12 hours

---

## Appendix A: Migration Checklist

- [ ] Create database backup
- [ ] Run migration on staging/test database
- [ ] Verify migration success
- [ ] Update type definitions
- [ ] Update repository methods
- [ ] Update sync transformers
- [ ] Update context and hooks
- [ ] Update CycleTypeSelector
- [ ] Update Settings page
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Manual testing on web
- [ ] Manual testing on mobile
- [ ] Cross-device sync testing
- [ ] Run migration on production
- [ ] Deploy new version
- [ ] Monitor for errors

---

## Appendix B: Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-11 | Claude | Initial document |
