# Deploy v2.13.0 - Onboarding Redesign

## Overview

This release introduces a comprehensive onboarding redesign with:
- 5-slide RFEM training guide with interactive demos
- 4-slide app tour with mockup visualizations
- Revisitable guides from Settings
- Modular component architecture

## Pre-Deployment Checklist

- [x] All 246 tests passing
- [x] TypeScript compilation clean
- [x] Production build successful
- [x] Version bumped to 2.13.0
- [x] CHANGELOG updated

## Changes Summary

### New Files
```
src/components/onboarding/
├── types.ts                  # TypeScript definitions
├── OnboardingSlide.tsx       # Shared slide component
├── OnboardingProgress.tsx    # Progress indicator
├── RFEMGuide.tsx            # RFEM training module (5 slides)
├── AppTour.tsx              # App tour module (4 slides)
├── OnboardingFlow.tsx       # New orchestrator (replaces old)
├── OnboardingFlowLegacy.tsx # Backup of original
└── visuals/
    ├── index.ts
    ├── RFEMCalculator.tsx   # Interactive calculator demo
    ├── ProgressComparisonChart.tsx
    └── RFEMWaveAnimation.tsx
```

### Modified Files
```
src/components/onboarding/index.ts  # Updated exports
src/pages/Settings.tsx              # Added Help & Guides section
package.json                        # Version 2.13.0
CHANGELOG.md                        # Release notes
```

## Database Migrations

**None required** - This release has no database schema changes.

## Deployment Steps

### 1. Pull Latest Code
```bash
git pull origin main
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Tests
```bash
npm test -- --run
```

Expected: 246 tests passing

### 4. Build for Production
```bash
npm run build
```

### 5. Preview Build (Optional)
```bash
npm run preview
```

### 6. Deploy to Vercel

#### Option A: Automatic (GitHub Integration)
Push to main branch - Vercel auto-deploys.

```bash
git add .
git commit -m "Release v2.13.0 - Onboarding Redesign"
git push origin main
```

#### Option B: Manual (Vercel CLI)
```bash
vercel --prod
```

## Post-Deployment Verification

### Test New Onboarding
1. Clear localStorage or use incognito mode
2. Navigate to the app
3. Verify welcome screen appears
4. Go through all 5 RFEM slides
5. Verify interactive calculator works (slide 2)
6. Verify animated wave works (slide 4)
7. Go through all 4 App Tour slides
8. Create first exercise
9. Verify success screen options

### Test Revisitable Guides
1. Go to Settings
2. Scroll to "Help & Guides" section
3. Tap "Learn About RFEM Training"
4. Verify full RFEM guide opens
5. Use Skip or complete to close
6. Tap "App Tour"
7. Verify full app tour opens
8. Use Skip or complete to close

### Test Existing Users
1. Log in with existing account
2. Verify no onboarding is shown (hasCompletedOnboarding = true)
3. Verify Settings Help & Guides section is available

## Rollback Plan

If issues arise:

1. In `src/App.tsx`, change:
```typescript
import { AuthGate, OnboardingFlow } from './components/onboarding';
```
To:
```typescript
import { AuthGate } from './components/onboarding';
import { OnboardingFlow } from './components/onboarding/OnboardingFlowLegacy';
```

2. Rebuild and redeploy.

## Known Considerations

- **Bundle Size**: Increased by ~30KB due to new components and SVG visualizations
- **Animation Performance**: Uses CSS transitions; tested on mobile devices
- **Reduced Motion**: Currently does not check `prefers-reduced-motion` (future enhancement)

## Feature Flags

None - this release is fully enabled for all users.

## Support Notes

- New users will see the full 11-step onboarding flow
- Existing users (hasCompletedOnboarding = true) will not see onboarding
- All users can access guides from Settings > Help & Guides
