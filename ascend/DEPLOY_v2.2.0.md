# Ascend v2.2.0 Deployment Instructions

## Overview

Phase 3 polish release with path aliases, accessibility improvements, UI standardization, and code cleanup.

## What Changed

### Path Aliases
All relative imports converted to `@/` path aliases:
- `from '../../types'` → `from '@/types'`
- `from '../../../components/ui'` → `from '@/components/ui'`
- 141 imports updated

### Accessibility Improvements

**Modal Focus Trapping:**
- Focus trapped within modal when open
- Tab/Shift+Tab cycles through focusable elements
- Focus returns to trigger element on close
- ARIA attributes: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`

**SwipeableSetCard Keyboard Support:**
- `Enter`/`Space`: Open details (same as tap)
- `Arrow Right`: Complete set (same as swipe right)
- `Arrow Left`: Skip set (same as swipe left)
- Visible focus indicator for keyboard users
- Descriptive `aria-label` for screen readers

### UI Standardization

**New Tailwind Theme Tokens:**
```js
dark: {
  bg: '#121212',
  surface: '#1A1A2E',
  elevated: '#252538',
  border: '#2D2D4A',        // NEW
  'border-hover': '#3D3D5A', // NEW
}

fontSize: {
  '2xs': '0.625rem',  // NEW - 10px for badges
}
```

**Replaced Hard-Coded Values:**
| Before | After | Count |
|--------|-------|-------|
| `bg-[#1A1A2E]` | `bg-dark-surface` | 16 |
| `bg-[#121212]` | `bg-dark-bg` | 11 |
| `border-[#2D2D4A]` | `border-dark-border` | 43 |
| `text-[10px]` | `text-2xs` | 11 |

**New Constants File (`src/constants/ui.ts`):**
- `SWIPE_THRESHOLD`, `VELOCITY_THRESHOLD`
- `SWIPE_RESISTANCE`, `SWIPE_MAX_TRANSLATE`
- `SWIPE_ANIMATION_DURATION`, `TAP_THRESHOLD`

### Code Cleanup

**Removed unused code:**
- `EXERCISE_TYPE_COLORS` from types
- `CardHeader`, `CardFooter` exports (components still exist)
- `Z_INDEX`, `ANIMATION_DURATION` unused constants
- Duplicate `isToday` function in WorkoutCalendar

**CSS improvements:**
- Added CSS custom properties for dark mode colors
- Centralized color definitions

## Deployment

```bash
cd ~/code/workout-tracker

# Remove old source files
rm -rf src

# Extract new version
unzip -o ~/Downloads/ascend-v2.2.0.zip

# Commit and push
git add .
git commit -m "v2.2.0: Phase 3 Polish

Path Aliases:
- Convert 141 relative imports to @/ aliases
- Add Vite resolve alias configuration

Accessibility:
- Modal focus trapping with ARIA attributes
- SwipeableSetCard keyboard support (Enter/Space/Arrows)
- Descriptive aria-labels for screen readers

UI Standardization:
- Add dark-border, dark-border-hover theme tokens
- Add text-2xs (10px) font size
- Replace all hard-coded hex colors with theme tokens
- Extract swipe gesture constants to shared file

Code Cleanup:
- Remove unused EXERCISE_TYPE_COLORS
- Remove unused CardHeader/CardFooter exports
- Remove duplicate isToday function
- Add CSS custom properties for theming

Build: 696 kB (191 kB gzipped)
Tests: 112 passing"

git push
```

## Testing Checklist

### Accessibility
- [ ] Tab through modal - focus stays trapped
- [ ] Close modal - focus returns to trigger
- [ ] Tab to swipeable set card
- [ ] Press Enter - opens details
- [ ] Press Right Arrow - completes set
- [ ] Press Left Arrow - skips set
- [ ] Screen reader announces set details

### Visual
- [ ] Dark mode colors consistent
- [ ] No visual regressions
- [ ] Badge text readable (text-2xs)
- [ ] Borders consistent in dark mode

### Functionality
- [ ] All existing features work
- [ ] Swipe gestures still work on touch
- [ ] No console errors

## Rollback

If issues occur:
```bash
git revert HEAD
git push
```

## Files Changed

### New Files
- `src/constants/ui.ts` - Swipe gesture constants
- `src/constants/index.ts` - Barrel export

### Modified Files
- `vite.config.ts` - Path alias configuration
- `tailwind.config.js` - New theme tokens
- `src/index.css` - CSS custom properties
- `src/components/ui/Modal.tsx` - Focus trapping
- `src/components/workouts/SwipeableSetCard.tsx` - Keyboard support
- `src/components/workouts/SwipeableWorkoutCard.tsx` - Use constants
- `src/components/workouts/WorkoutCalendar.tsx` - Use shared isToday
- `src/components/workouts/today/ScheduledSetsList.tsx` - Aria labels
- `src/components/ui/index.ts` - Remove unused exports
- `src/types/index.ts` - Remove unused constant
- 40+ files with import path updates
