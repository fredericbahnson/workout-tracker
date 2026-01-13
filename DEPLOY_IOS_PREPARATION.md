# Ascend v2.11.1 → iOS Preparation

## Overview

This package contains the comprehensive iOS App Store deployment plan added to the existing v2.11.1 codebase. No code changes have been made — this is a planning document to review before beginning implementation.

## New Documentation

- `docs/IOS_APP_STORE_DEPLOYMENT_PLAN.md` — Complete roadmap for iOS deployment

## What's Included

The deployment plan covers:

1. **Prerequisites & Accounts** — What you need before starting
2. **Development Environment** — Mac, Xcode, tools setup
3. **Capacitor Integration** — Wrapping the PWA as iOS app
4. **iOS Project Configuration** — Xcode settings, icons, Info.plist
5. **In-App Purchase Implementation** — RevenueCat, StoreKit, trial management
6. **Entitlement & Feature Gating** — Linking IAP to Standard/Advanced modes
7. **App Store Connect Setup** — Products, metadata, privacy
8. **TestFlight Beta Testing** — Internal and external testing
9. **App Store Submission** — Review process and common issues
10. **Post-Launch Maintenance** — Updates, certificates, monitoring
11. **Implementation Phases** — Week-by-week breakdown

## Key Decisions Required

Before implementation begins, you'll need to decide:

| Decision | Options |
|----------|---------|
| **Pricing** | What price tier for Standard? Advanced? |
| **Purchase Type** | One-time, subscription, or both? |
| **Trial Duration** | 4 weeks as planned, or adjust? |
| **Bundle ID** | `com.betterdays.ascend` or different? |

## Estimated Timeline

| Phase | Duration |
|-------|----------|
| Setup & Configuration | 3-4 days |
| IAP Implementation | 3-4 days |
| UI Integration | 2-3 days |
| App Store Prep | 2-3 days |
| Testing | 3-5 days |
| Submission & Review | 1-7 days |
| **Total** | **3-4 weeks** |

## Next Steps

1. Review the deployment plan thoroughly
2. Make decisions on pricing and purchase type
3. Verify Apple Developer Program membership is active
4. Set up Mac development environment
5. Begin Phase 1: Development Setup

## Implementation Order (Recommended)

The Standard/Advanced mode feature planned in `docs/IMPLEMENTATION_PLAN_APP_MODE.md` should be implemented **before** iOS deployment to ensure the feature gating infrastructure is in place.

Suggested order:
1. Implement App Mode feature (v2.7.0) — currently planned but not yet implemented
2. Deploy and test on PWA
3. Begin iOS deployment (v3.0.0)

This ensures the web app has the Standard/Advanced toggle working before adding IAP complexity.

## Questions?

Review the detailed plan in `docs/IOS_APP_STORE_DEPLOYMENT_PLAN.md` and let me know if you need:
- Clarification on any section
- Alternative approaches
- Deeper implementation details for specific components
- Updated estimates based on your constraints
