# Ascend v2.9.0 Deployment Instructions

## Overview

This release completes Phase 3 (Refactoring - Extracting Patterns) from the code review plan.

## Changes Summary

### Phase 3: Refactoring — COMPLETE

| Item | Component | Description |
|------|-----------|-------------|
| 5.2 | FilterChip | Reusable filter chip/button component |
| 5.5 | ConfirmModal | Generic confirmation modal |
| 4.1 | useThemeEffect | Consolidated theme logic |
| 5.1 | useSettingsState | Reducer-based Settings state management |

### New Files

| File | Description |
|------|-------------|
| `src/components/ui/FilterChip.tsx` | Toggle-style filter button with active state |
| `src/components/ui/ConfirmModal.tsx` | Generic confirm/cancel modal dialog |
| `src/hooks/useSettingsState.ts` | Reducer hook for Settings page state |

### Modified Files

| File | Changes |
|------|---------|
| `src/components/ui/index.ts` | Added FilterChip, ConfirmModal exports |
| `src/hooks/index.ts` | Added useSettingsState export |
| `src/pages/Exercises.tsx` | Uses FilterChip instead of inline buttons |
| `src/stores/appStore.ts` | Added useThemeEffect hook |
| `src/App.tsx` | Uses useThemeEffect, removed duplicate theme logic |

## New Components

### FilterChip
```tsx
import { FilterChip } from '@/components/ui';

<FilterChip
  label="All"
  count={10}
  isActive={true}
  onClick={() => setFilter('all')}
/>
```

### ConfirmModal
```tsx
import { ConfirmModal } from '@/components/ui';

<ConfirmModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Item"
  message="Are you sure?"
  confirmLabel="Delete"
  confirmVariant="danger"
  isLoading={isDeleting}
/>
```

### useSettingsState (for future Settings.tsx refactoring)
```tsx
import { useSettingsState } from '@/hooks';

const { state, actions } = useSettingsState();
actions.openModal('auth');
actions.setMessage({ type: 'success', text: 'Saved!' });
```

## Deployment Commands

```bash
cd /path/to/workout-tracker

# Extract archive
unzip ~/Downloads/ascend-v2.9.0.zip -d temp && \
  cp -r temp/* . && rm -rf temp

# Install dependencies (no new deps in this release)
npm install

# Verify
npm run lint
npm run build
npm test

# Deploy
git add .
git commit -m "v2.9.0: Phase 3 refactoring complete

New components:
- FilterChip: Reusable filter toggle button
- ConfirmModal: Generic confirmation dialog
- useSettingsState: Reducer-based state management hook
- useThemeEffect: Consolidated theme application

Changes:
- Exercises page uses FilterChip component
- App.tsx uses useThemeEffect (removed duplicate theme logic)
- All new components exported from ui/index.ts and hooks/index.ts"
git push
```

## Verification Checklist

- [ ] Exercises page filter chips work correctly
- [ ] Theme switching works (light/dark/system)
- [ ] System theme detection works
- [ ] Version displays as v2.9.0 in Settings
- [ ] `npm run lint` shows 0 errors
- [ ] `npm run build` succeeds
- [ ] `npm test` passes (188+ tests)

## Rollback

If issues occur:
```bash
git revert HEAD
git push
```

## Notes

- useSettingsState hook is available for future Settings.tsx refactoring
- Existing Settings.tsx code continues to work unchanged
- FilterChip and ConfirmModal are available for use in other pages
- useThemeEffect should be used instead of useTheme for new code
