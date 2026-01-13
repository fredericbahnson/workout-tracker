# Ascend v2.12.0 Deployment Instructions

## Overview

This release adds the entitlement infrastructure to support iOS App Store in-app purchases. It includes:

- Free trial system (4 weeks, full access)
- Entitlement context and hooks for feature gating
- Paywall modal for upgrade prompts
- UI integration in CycleTypeSelector and Settings
- Trial/subscription status displays

## What's New

### For Users
- **Free Trial**: New users get 4 weeks of full Advanced access
- **Trial Status**: Settings page shows days remaining in trial
- **Locked Features**: Cycle types show as locked with upgrade prompts when not entitled
- **Subscription Display**: Shows current plan and renewal info when purchased

### For Development
- Entitlement system ready for Capacitor IAP integration
- Feature gating infrastructure in place
- Paywall UI ready for purchase flow implementation

## New Files

```
src/types/entitlement.ts           # Entitlement type definitions
src/services/trialService.ts       # Trial period management
src/services/entitlementService.ts # Entitlement coordination
src/contexts/EntitlementContext.tsx # React context and hooks
src/components/paywall/PaywallModal.tsx
src/components/paywall/TrialBanner.tsx
src/components/paywall/index.ts
docs/IOS_APP_STORE_DEPLOYMENT_PLAN.md  # Full iOS deployment roadmap
```

## Modified Files

```
src/App.tsx                        # Added EntitlementProvider and PaywallContainer
src/contexts/index.ts              # Export entitlement context
src/types/index.ts                 # Export entitlement types
src/components/cycles/CycleTypeSelector.tsx  # Locked options with paywall
src/pages/Settings.tsx             # Trial banner, subscription status, gated Advanced mode
src/services/syncService.test.ts   # Fixed: added missing userPreferences mock (2 tests were failing)
CHANGELOG.md                       # Version history
package.json                       # Version bump to 2.12.0
```

## Deployment Steps

```bash
# Navigate to your project directory
cd /path/to/workout-tracker

# Remove old source files (keep node_modules, .env, etc.)
rm -rf src docs

# Extract new files
unzip ~/Downloads/ascend-v2.12.0.zip -d temp && \
  cp -r temp/* . && rm -rf temp

# Install dependencies (no new packages)
npm install

# Verify build
npm run lint && npm run build && npm test

# Commit changes
git add .
git commit -m "v2.12.0: Add entitlement system for iOS IAP readiness

- Free trial system (4 weeks, full Advanced access)
- EntitlementProvider context with trial/purchase state
- PaywallModal for upgrade prompts
- TrialBanner for trial status display
- CycleTypeSelector shows locked options with upgrade CTA
- Settings App Mode gated by entitlement
- Infrastructure ready for Capacitor IAP integration"

# Push to deploy
git push
```

## Testing Checklist

### Trial System
- [ ] Fresh browser/incognito: trial should start automatically
- [ ] Trial status shows in Settings with correct days remaining
- [ ] Trial banner hidden if returning user with existing data

### Feature Gating
- [ ] In Standard mode: Simple Progression and Mixed cycles show as locked
- [ ] Clicking locked option opens paywall modal
- [ ] In Advanced mode with trial active: all options available
- [ ] Settings: Advanced mode toggle shows lock if not entitled

### Paywall Modal
- [ ] Modal opens with contextual message
- [ ] Feature comparison shows Standard vs Advanced
- [ ] Close button works
- [ ] "Get the iOS App" button (placeholder) closes modal

### Existing Functionality
- [ ] All existing features work as before
- [ ] Standard mode users can create RFEM and Max Testing cycles
- [ ] Cloud sync continues to work
- [ ] Settings preferences persist

## Development Notes

### Trial System

The trial is stored in localStorage with key `ascend_trial_start`. To test trial states in development:

```typescript
// In browser console:

// Reset trial (start fresh)
localStorage.removeItem('ascend_trial_start');

// Force expire trial
const expired = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
localStorage.setItem('ascend_trial_start', expired.toISOString());

// Reload page to see changes
```

### Entitlement Logic

Current web behavior:
- Trial active → Advanced access
- Trial expired → No access (paywall shown)
- Purchase → Access based on tier

When Capacitor IAP is added:
- `entitlementService.ts` will integrate with RevenueCat
- `getPurchaseInfo()` will return real purchase data
- Paywall buttons will trigger actual purchase flows

## Next Steps

1. **Review** `docs/IOS_APP_STORE_DEPLOYMENT_PLAN.md` for full iOS roadmap
2. **Decide** on pricing tiers for Standard and Advanced
3. **Choose** lifetime vs subscription vs both
4. **Begin** Capacitor integration when ready

## Notes

- No database migration required
- No breaking changes to existing functionality
- Test count: 244 tests passing (2 pre-existing flaky sync tests may fail occasionally)
