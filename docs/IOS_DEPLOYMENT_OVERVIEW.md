# Ascend v2.16.0 → iOS App Store Deployment

## Overview

Ascend is **ready for iOS App Store deployment**. The v2.16.0 release includes all the entitlement infrastructure, iOS preparation hooks, and feature gating needed to support In-App Purchases.

## Documentation

| Document | Purpose |
|----------|---------|
| `docs/IOS_DEPLOYMENT_PLAN.md` | **Comprehensive deployment plan** |
| `docs/IOS_DEPLOYMENT_OVERVIEW.md` | This overview document |

## What's Already Built (v2.16.0)

### Entitlement System ✅

| Component | File | Status |
|-----------|------|--------|
| Trial Service | `src/services/trialService.ts` | Complete |
| Entitlement Service | `src/services/entitlementService.ts` | Complete (web) |
| Entitlement Context | `src/contexts/entitlement/` | Complete |
| Feature Access Hooks | `useFeatureAccess`, `useGatedAction` | Complete |
| Paywall Modal | `src/components/paywall/PaywallModal.tsx` | Complete |
| Trial Banner | `src/components/paywall/TrialBanner.tsx` | Complete |
| Integration Tests | `src/services/*.test.ts` | 38 tests passing |

### iOS Preparation Hooks ✅

| Hook | File | Status |
|------|------|--------|
| Haptics | `src/hooks/useHaptics.ts` | Ready for Capacitor |
| Keyboard Height | `src/hooks/useKeyboardHeight.ts` | Ready for Capacitor |
| Safe Area CSS | `src/index.css` | Complete |

### Feature Gating ✅

- Standard vs Advanced mode toggle in settings
- Cycle type selector with locked states
- Gated action hooks that trigger paywall

## What Still Needs Implementation

| Task | Effort | Notes |
|------|--------|-------|
| Capacitor installation | 2-4 hours | Creates `ios/` directory |
| RevenueCat integration | 1-2 days | `iapService.ts` |
| Connect hooks to Capacitor | 2-4 hours | Minor updates to existing hooks |
| App Store Connect setup | 2-4 hours | Products, metadata |
| App icons & screenshots | 4-8 hours | Asset creation |
| TestFlight testing | 2-3 days | IAP sandbox testing |
| Submission | 1-2 hours | Plus Apple review time |

## Updated Timeline: ~2 Weeks

| Phase | Duration | What's Done |
|-------|----------|-------------|
| Capacitor Setup | 2-4 hours | — |
| IAP Integration | 1-2 days | Entitlement service ready |
| App Store Prep | 1-2 days | — |
| TestFlight | 2-3 days | — |
| Submission | 1-2 days | — |
| **Total** | **~2 weeks** | Down from 3-4 weeks |

## Key Decisions Required

| Decision | Current Default | Notes |
|----------|----------------|-------|
| **Standard Pricing** | TBD | Suggested: $4.99 lifetime |
| **Advanced Pricing** | TBD | Suggested: $9.99 lifetime |
| **Purchase Type** | Non-consumable | Simpler than subscriptions |
| **Trial Duration** | 28 days | Current implementation |
| **Bundle ID** | `com.betterdays.ascend` | Change requires new project |

## Quick Start

```bash
# Verify current build
cd /path/to/ascend
npm install
npm run build
npm test -- --run  # Expect 284+ tests passing

# Then follow docs/IOS_DEPLOYMENT_PLAN.md
```

## Next Steps

1. **Review** `docs/IOS_DEPLOYMENT_PLAN.md`
2. **Decide** on pricing and purchase type
3. **Verify** Apple Developer Program membership
4. **Start** Phase 1: Capacitor Setup

## Changelog Since Original Plan

The original plan (v1.0) was created against v2.11.1. Since then:

- **v2.12.0**: Exercise history feature
- **v2.13.x**: Cycle completion fixes, UI improvements
- **v2.14.0**: Context architecture refactoring, bundle optimization
- **v2.15.0**: Settings page decomposition
- **v2.16.0**: iOS preparation hooks, entitlement tests

All this work means the iOS deployment can proceed much faster than originally estimated.
