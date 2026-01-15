# Ascend iOS App Store Deployment Plan

**Document Version:** 2.0  
**Last Updated:** 2026-01-15  
**Base Version:** 2.16.0  
**Target Version:** 3.0.0  
**Status:** Ready for Implementation

---

## Executive Summary

This document provides an **updated roadmap** for deploying Ascend to the Apple App Store. It reflects the significant groundwork already completed in v2.16.0, including the entitlement system, iOS preparation hooks, and feature gating infrastructure.

### What's Already Built (v2.16.0)

| Component | Status | Location |
|-----------|--------|----------|
| Trial Service | ✅ Complete | `src/services/trialService.ts` |
| Entitlement Service | ✅ Complete (web) | `src/services/entitlementService.ts` |
| Entitlement Context | ✅ Complete | `src/contexts/entitlement/` |
| Paywall Modal | ✅ Complete | `src/components/paywall/PaywallModal.tsx` |
| Trial Banner | ✅ Complete | `src/components/paywall/TrialBanner.tsx` |
| Feature Gating Hooks | ✅ Complete | `useFeatureAccess`, `useGatedAction` |
| Haptics Hook | ✅ Ready for Capacitor | `src/hooks/useHaptics.ts` |
| Keyboard Height Hook | ✅ Ready for Capacitor | `src/hooks/useKeyboardHeight.ts` |
| Safe Area CSS | ✅ Complete | `src/index.css` |
| App Mode (Standard/Advanced) | ✅ Complete | Throughout app |
| Integration Tests | ✅ 38 tests | `src/services/*.test.ts` |

### What Still Needs to Be Done

| Task | Effort | Phase |
|------|--------|-------|
| Capacitor installation & iOS project | 2-4 hours | 1 |
| RevenueCat integration | 1-2 days | 2 |
| Connect existing hooks to Capacitor plugins | 2-4 hours | 2 |
| App Store Connect setup | 2-4 hours | 3 |
| App icons and screenshots | 4-8 hours | 3 |
| Privacy policy page | 1-2 hours | 3 |
| TestFlight testing | 2-3 days | 4 |
| App Store submission | 1-2 hours + review | 5 |

### Updated Timeline: ~2 Weeks

The original plan estimated 3-4 weeks. With the entitlement infrastructure already in place, this is reduced to approximately **2 weeks** of active development.

---

## Table of Contents

1. [Prerequisites Checklist](#1-prerequisites-checklist)
2. [Phase 1: Capacitor Setup](#2-phase-1-capacitor-setup)
3. [Phase 2: IAP Integration](#3-phase-2-iap-integration)
4. [Phase 3: App Store Preparation](#4-phase-3-app-store-preparation)
5. [Phase 4: TestFlight Testing](#5-phase-4-testflight-testing)
6. [Phase 5: Submission](#6-phase-5-submission)
7. [Code Changes Reference](#7-code-changes-reference)
8. [Decision Points](#8-decision-points)
9. [Appendices](#appendices)

---

## 1. Prerequisites Checklist

Complete these before starting development:

### Accounts & Access

- [ ] **Apple Developer Program** ($99/year) - Verify active membership at [developer.apple.com](https://developer.apple.com/account/)
- [ ] **RevenueCat Account** - Create at [revenuecat.com](https://www.revenuecat.com) (free tier)
- [ ] **App Store Connect** access - Same as Developer account

### Hardware & Software

- [ ] **Mac** with macOS 13+ (Ventura or later)
- [ ] **Xcode 15+** installed from Mac App Store
- [ ] **iPhone** for physical device testing (recommended)
- [ ] **CocoaPods** installed: `sudo gem install cocoapods`
- [ ] **Xcode CLI tools**: `xcode-select --install`

### Development Verification

```bash
# Verify your current Ascend build works
cd /path/to/ascend
npm install
npm run build
npm test -- --run

# Expected: Build succeeds, 284+ tests pass
```

### Key Decisions Required (See Section 8)

- [ ] Pricing for Standard tier
- [ ] Pricing for Advanced tier  
- [ ] One-time purchase vs. subscription
- [ ] Bundle identifier: `com.betterdays.ascend` or custom

---

## 2. Phase 1: Capacitor Setup

**Estimated Time:** 2-4 hours

### 2.1 Install Capacitor

```bash
cd /path/to/ascend

# Install Capacitor packages
npm install @capacitor/core @capacitor/cli @capacitor/ios

# Install required plugins
npm install @capacitor/status-bar @capacitor/haptics @capacitor/keyboard @capacitor/app

# Initialize Capacitor (creates capacitor.config.ts)
npx cap init "Ascend" "com.betterdays.ascend" --web-dir dist
```

### 2.2 Create Capacitor Configuration

Create `capacitor.config.ts` in project root:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.betterdays.ascend',
  appName: 'Ascend',
  webDir: 'dist',
  
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#121212',
    scrollEnabled: true,
  },
  
  server: {
    // Production: bundled assets (default)
    // Development: uncomment below for hot reload
    // url: 'http://YOUR_LOCAL_IP:5173',
    cleartext: false,
  },
  
  plugins: {
    StatusBar: {
      style: 'dark', // Light text for dark background
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#121212',
      showSpinner: false,
    },
  },
};

export default config;
```

### 2.3 Add iOS Platform

```bash
# Build web assets
npm run build

# Add iOS platform (creates ios/ directory)
npx cap add ios

# Sync web assets to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

### 2.4 Update package.json Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "cap:sync": "npm run build && npx cap sync ios",
    "cap:open": "npx cap open ios",
    "cap:build": "npm run build && npx cap sync ios && npx cap open ios"
  }
}
```

### 2.5 Configure Xcode Project

After `npx cap open ios`:

1. **Select "App" target** in project navigator
2. **General tab:**
   - Display Name: `Ascend`
   - Bundle Identifier: `com.betterdays.ascend`
   - Version: `3.0.0`
   - Build: `1`
   - Deployment Target: `iOS 15.0`
   - Orientation: Portrait only
3. **Signing & Capabilities:**
   - Team: Select your Apple Developer team
   - Enable "Automatically manage signing"
   - Add capability: **In-App Purchase**

### 2.6 Verify Basic Build

1. Select a simulator (e.g., iPhone 15 Pro)
2. Press Cmd+R to build and run
3. Verify the app launches and shows the PWA content

**Checkpoint:** App builds and runs in simulator ✓

---

## 3. Phase 2: IAP Integration

**Estimated Time:** 1-2 days

The entitlement infrastructure is already built. This phase connects it to actual purchases via RevenueCat.

### 3.1 Install RevenueCat

```bash
npm install @revenuecat/purchases-capacitor
npx cap sync ios
```

### 3.2 RevenueCat Dashboard Setup

1. **Create Project** at [app.revenuecat.com](https://app.revenuecat.com)
   - Name: "Ascend"
2. **Add iOS App**
   - Bundle ID: `com.betterdays.ascend`
   - Copy the **Public API Key** (starts with `appl_`)
3. **Create Entitlements:**
   - `standard` - Standard features
   - `advanced` - All features
4. **Create Products** (after App Store Connect setup):
   - Map App Store products to entitlements

### 3.3 Create IAP Service

Create `src/services/iapService.ts`:

```typescript
/**
 * In-App Purchase Service
 * 
 * Integrates RevenueCat for iOS purchases.
 * Web platform returns mock data for development/testing.
 */

import { Capacitor } from '@capacitor/core';
import type { PurchaseInfo, PurchaseTier } from '@/types/entitlement';

// RevenueCat types (imported when on native)
type CustomerInfo = {
  entitlements: {
    active: Record<string, {
      identifier: string;
      originalPurchaseDate: string;
      expirationDate?: string;
      willRenew: boolean;
      productIdentifier: string;
    }>;
  };
};

type Package = {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    priceString: string;
    price: number;
  };
};

type Offering = {
  identifier: string;
  availablePackages: Package[];
};

// RevenueCat API key - move to environment variable for production
const REVENUECAT_API_KEY = 'YOUR_API_KEY_HERE';

class IAPService {
  private initialized = false;
  private Purchases: typeof import('@revenuecat/purchases-capacitor').Purchases | null = null;
  
  /**
   * Initialize RevenueCat SDK.
   * Call once at app startup.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (!Capacitor.isNativePlatform()) {
      console.log('[IAP] Skipping initialization on web');
      return;
    }
    
    try {
      const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');
      this.Purchases = Purchases;
      
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      
      this.initialized = true;
      console.log('[IAP] RevenueCat initialized');
    } catch (error) {
      console.error('[IAP] Failed to initialize:', error);
    }
  }
  
  /**
   * Check if IAP is available on this platform.
   */
  isAvailable(): boolean {
    return Capacitor.isNativePlatform() && this.initialized;
  }
  
  /**
   * Get current purchase information.
   * Returns null if no purchase or on web.
   */
  async getPurchaseInfo(): Promise<PurchaseInfo | null> {
    if (!this.isAvailable() || !this.Purchases) return null;
    
    try {
      const result = await this.Purchases.getCustomerInfo();
      const info = result.customerInfo as CustomerInfo;
      const active = info.entitlements.active;
      
      // Check for Advanced entitlement first
      if (active['advanced']) {
        const ent = active['advanced'];
        return {
          tier: 'advanced',
          type: ent.expirationDate ? 'subscription' : 'lifetime',
          purchasedAt: new Date(ent.originalPurchaseDate),
          expiresAt: ent.expirationDate ? new Date(ent.expirationDate) : null,
          willRenew: ent.willRenew,
          productId: ent.productIdentifier,
        };
      }
      
      // Check for Standard entitlement
      if (active['standard']) {
        const ent = active['standard'];
        return {
          tier: 'standard',
          type: ent.expirationDate ? 'subscription' : 'lifetime',
          purchasedAt: new Date(ent.originalPurchaseDate),
          expiresAt: ent.expirationDate ? new Date(ent.expirationDate) : null,
          willRenew: ent.willRenew,
          productId: ent.productIdentifier,
        };
      }
      
      return null;
    } catch (error) {
      console.error('[IAP] Failed to get purchase info:', error);
      return null;
    }
  }
  
  /**
   * Get available products for purchase.
   */
  async getOfferings(): Promise<Offering | null> {
    if (!this.isAvailable() || !this.Purchases) return null;
    
    try {
      const result = await this.Purchases.getOfferings();
      return result.current as Offering | null;
    } catch (error) {
      console.error('[IAP] Failed to get offerings:', error);
      return null;
    }
  }
  
  /**
   * Purchase a package.
   */
  async purchase(packageId: string): Promise<PurchaseInfo | null> {
    if (!this.isAvailable() || !this.Purchases) {
      throw new Error('Purchases not available');
    }
    
    try {
      const offerings = await this.getOfferings();
      if (!offerings) throw new Error('No offerings available');
      
      const pkg = offerings.availablePackages.find(p => p.identifier === packageId);
      if (!pkg) throw new Error(`Package ${packageId} not found`);
      
      await this.Purchases.purchasePackage({ aPackage: pkg });
      return this.getPurchaseInfo();
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === 'PURCHASE_CANCELLED') {
        console.log('[IAP] Purchase cancelled by user');
        return null;
      }
      throw error;
    }
  }
  
  /**
   * Restore previous purchases.
   */
  async restorePurchases(): Promise<PurchaseInfo | null> {
    if (!this.isAvailable() || !this.Purchases) {
      throw new Error('Purchases not available');
    }
    
    try {
      await this.Purchases.restorePurchases();
      return this.getPurchaseInfo();
    } catch (error) {
      console.error('[IAP] Restore failed:', error);
      throw error;
    }
  }
  
  /**
   * Associate Supabase user ID with RevenueCat for cross-device sync.
   */
  async setUserId(userId: string): Promise<void> {
    if (!this.isAvailable() || !this.Purchases) return;
    
    try {
      await this.Purchases.logIn({ appUserID: userId });
    } catch (error) {
      console.error('[IAP] Failed to set user ID:', error);
    }
  }
  
  /**
   * Clear user ID on logout.
   */
  async clearUserId(): Promise<void> {
    if (!this.isAvailable() || !this.Purchases) return;
    
    try {
      await this.Purchases.logOut();
    } catch (error) {
      console.error('[IAP] Failed to clear user ID:', error);
    }
  }
}

export const iapService = new IAPService();
```

### 3.4 Update Entitlement Service

Modify `src/services/entitlementService.ts` to use IAP service:

```typescript
// Add import at top
import { iapService } from './iapService';
import { Capacitor } from '@capacitor/core';

// Update isNativePlatform function
function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

// Update getPurchaseInfo function
async function getPurchaseInfo(): Promise<PurchaseInfo | null> {
  if (!isNativePlatform()) {
    return null; // No purchases on web
  }
  return iapService.getPurchaseInfo();
}

// Update initialize method
async initialize(): Promise<EntitlementStatus> {
  // Initialize IAP on native platforms
  if (isNativePlatform()) {
    await iapService.initialize();
  }
  
  // Start trial if this is first launch
  trialService.startTrialIfNeeded();
  
  // Get current status
  return this.getEntitlementStatus();
}
```

### 3.5 Update Capacitor Hooks

Update `src/hooks/useHaptics.ts` to use Capacitor:

```typescript
// Add imports at top
import { Capacitor } from '@capacitor/core';

// Update isNativePlatform function
function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

// Update impact function to use Capacitor
const impact = useCallback(
  async (style: ImpactStyle = 'medium') => {
    if (!enabled) return;

    if (isNativePlatform()) {
      const { Haptics, ImpactStyle: CapImpactStyle } = await import('@capacitor/haptics');
      const styleMap = {
        light: CapImpactStyle.Light,
        medium: CapImpactStyle.Medium,
        heavy: CapImpactStyle.Heavy,
      };
      await Haptics.impact({ style: styleMap[style] });
      return;
    }

    // Web fallback
    vibrate(VIBRATION_PATTERNS.impact[style]);
  },
  [enabled, vibrate]
);

// Similar updates for notification() and selection()
```

Update `src/hooks/useKeyboardHeight.ts` to use Capacitor:

```typescript
// Add import
import { Capacitor } from '@capacitor/core';

// Update isNativePlatform
function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

// Update setupNativeListeners to use Capacitor Keyboard
const setupNativeListeners = useCallback(() => {
  if (!isNativePlatform()) return undefined;

  let showHandle: { remove: () => void } | undefined;
  let hideHandle: { remove: () => void } | undefined;

  (async () => {
    const { Keyboard } = await import('@capacitor/keyboard');

    showHandle = await Keyboard.addListener('keyboardWillShow', (info) => {
      setKeyboardHeight(info.keyboardHeight);
      setIsKeyboardVisible(true);
      onVisibilityChange?.(true, info.keyboardHeight);
    });

    hideHandle = await Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
      onVisibilityChange?.(false, 0);
    });
  })();

  return () => {
    showHandle?.remove();
    hideHandle?.remove();
  };
}, [onVisibilityChange]);
```

### 3.6 Update Paywall Modal

Update `src/components/paywall/PaywallModal.tsx` to handle actual purchases:

```typescript
// Add import
import { iapService } from '@/services/iapService';

// Add state for offerings and loading
const [offerings, setOfferings] = useState<Offering | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Load offerings when modal opens
useEffect(() => {
  if (isOpen && isNativePlatform) {
    iapService.getOfferings().then(setOfferings);
  }
}, [isOpen, isNativePlatform]);

// Purchase handler
const handlePurchase = async (packageId: string) => {
  setLoading(true);
  setError(null);
  try {
    await iapService.purchase(packageId);
    await refreshEntitlement();
    onClose();
  } catch (err) {
    setError('Purchase failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

// Restore handler
const handleRestore = async () => {
  setLoading(true);
  setError(null);
  try {
    await iapService.restorePurchases();
    await refreshEntitlement();
    onClose();
  } catch (err) {
    setError('Could not restore purchases.');
  } finally {
    setLoading(false);
  }
};
```

### 3.7 Link User ID to RevenueCat

In `src/contexts/auth/AuthProvider.tsx`, sync user ID with RevenueCat:

```typescript
// Add import
import { iapService } from '@/services/iapService';

// In the auth state change handler:
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    setUser(session?.user ?? null);
    
    // Sync user ID with RevenueCat
    if (session?.user) {
      iapService.setUserId(session.user.id);
    } else {
      iapService.clearUserId();
    }
  });
  
  return () => subscription.unsubscribe();
}, []);
```

**Checkpoint:** IAP service integrated, purchases functional in sandbox ✓

---

## 4. Phase 3: App Store Preparation

**Estimated Time:** 1-2 days

### 4.1 App Icons

Generate app icons in all required sizes. Use your existing `public/pwa-512x512.png` as source.

**Option A: Online Generator**
1. Go to [appicon.co](https://appicon.co)
2. Upload your 512x512 PNG
3. Download iOS icon set
4. Copy to `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

**Option B: Manual ImageMagick**
```bash
# From project root
cd public
convert pwa-512x512.png -resize 1024x1024 AppIcon-1024.png
convert pwa-512x512.png -resize 180x180 AppIcon-60@3x.png
convert pwa-512x512.png -resize 120x120 AppIcon-60@2x.png
convert pwa-512x512.png -resize 167x167 AppIcon-83.5@2x.png
convert pwa-512x512.png -resize 152x152 AppIcon-76@2x.png
convert pwa-512x512.png -resize 120x120 AppIcon-40@3x.png
convert pwa-512x512.png -resize 80x80 AppIcon-40@2x.png
convert pwa-512x512.png -resize 87x87 AppIcon-29@3x.png
convert pwa-512x512.png -resize 58x58 AppIcon-29@2x.png
```

### 4.2 Screenshots

Create screenshots for each required size:

| Device | Resolution | Count |
|--------|------------|-------|
| iPhone 6.7" | 1290 × 2796 | 3-10 |
| iPhone 6.5" | 1284 × 2778 | 3-10 |
| iPhone 5.5" | 1242 × 2208 | 3-10 |

**Recommended Screenshots:**
1. Today page with workout in progress
2. Schedule calendar view
3. Exercise detail with progress chart
4. Cycle creation wizard
5. Settings/subscription page

### 4.3 App Store Connect Configuration

Go to [App Store Connect](https://appstoreconnect.apple.com):

1. **Create New App**
   - Platform: iOS
   - Name: "Ascend - Workout Tracker"
   - Primary Language: English (U.S.)
   - Bundle ID: `com.betterdays.ascend`
   - SKU: `ascend-001`

2. **App Information**
   - Category: Health & Fitness
   - Content Rights: This app does not contain third-party content
   
3. **Pricing and Availability**
   - Price: Free (with IAP)
   - Available in all territories

4. **In-App Purchases** (Monetization → In-App Purchases)

   **Product 1: Standard (Lifetime)**
   - Reference Name: `Ascend Standard`
   - Product ID: `com.betterdays.ascend.standard.lifetime`
   - Type: Non-Consumable
   - Price: $4.99 (or your chosen price)
   - Display Name: "Ascend Standard"
   - Description: "Unlock RFEM training cycles and max testing forever."

   **Product 2: Advanced (Lifetime)**
   - Reference Name: `Ascend Advanced`
   - Product ID: `com.betterdays.ascend.advanced.lifetime`
   - Type: Non-Consumable
   - Price: $9.99 (or your chosen price)
   - Display Name: "Ascend Advanced"
   - Description: "Unlock all features including simple and mixed progression modes."

   *If using subscriptions instead, create Auto-Renewable Subscription products.*

### 4.4 Privacy Policy

Create a privacy policy page. Options:

**Option A: Host on your website**
- URL: `https://betterdays.com/ascend/privacy`

**Option B: Use a generator**
- [Termly](https://termly.io) - Free tier available
- [PrivacyPolicies.com](https://www.privacypolicies.com)

**Required Content:**
- What data is collected (email, workout data)
- How data is stored (Supabase, IndexedDB)
- Third-party services (Supabase, RevenueCat)
- User rights (data export, deletion)
- Contact information

### 4.5 App Store Listing

Complete the App Store listing:

**App Name:** Ascend - Workout Tracker

**Subtitle:** RFEM Bodyweight Training

**Description:**
```
Ascend helps you build strength with intelligent bodyweight training. Using the proven RFEM (Reps From Established Max) methodology, Ascend automatically adjusts your workouts based on your performance.

FEATURES:
• RFEM Training Cycles - Progressive overload without guesswork
• Max Rep Testing - Periodic assessment to update your training maxes
• Workout Scheduling - 1-6 training days per week
• Cloud Sync - Access your workouts across all devices
• Exercise Library - Comprehensive bodyweight exercise database
• Progress Tracking - See your improvement over time

ADVANCED FEATURES (Advanced tier):
• Simple Progression Cycles - Linear progression for any exercise
• Mixed Mode Cycles - Combine RFEM and simple progression

Start your 4-week free trial today!
```

**Keywords:**
```
workout,calisthenics,bodyweight,strength,training,fitness,RFEM,progressive,exercise
```

**Support URL:** `https://betterdays.com/support`

**Marketing URL:** `https://betterdays.com/ascend`

### 4.6 Update Info.plist

In `ios/App/App/Info.plist`, add:

```xml
<!-- App Transport Security -->
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <false/>
</dict>

<!-- Encryption declaration (no custom encryption) -->
<key>ITSAppUsesNonExemptEncryption</key>
<false/>

<!-- Display name -->
<key>CFBundleDisplayName</key>
<string>Ascend</string>
```

**Checkpoint:** App Store Connect configured, assets uploaded ✓

---

## 5. Phase 4: TestFlight Testing

**Estimated Time:** 2-3 days

### 5.1 Archive and Upload

1. **In Xcode:**
   - Select "Any iOS Device (arm64)" as build target
   - Product → Archive
   - Wait for archive to complete

2. **Upload to App Store Connect:**
   - Window → Organizer
   - Select the archive
   - Click "Distribute App"
   - Choose "App Store Connect" → "Upload"
   - Follow prompts to complete upload

3. **Wait for Processing:**
   - Takes 5-30 minutes
   - You'll receive email when ready

### 5.2 Internal Testing

1. Go to App Store Connect → TestFlight
2. Select the uploaded build
3. Add internal testers (your Apple ID)
4. Install via TestFlight app on device

### 5.3 Testing Checklist

**Core Functionality:**
- [ ] App launches successfully
- [ ] Dark mode displays correctly
- [ ] Safe areas render properly (notch, home indicator)
- [ ] Haptic feedback works
- [ ] Keyboard handling works correctly
- [ ] All navigation flows work
- [ ] Offline mode functions
- [ ] Cloud sync works
- [ ] Auth (sign up, sign in, sign out)

**Workout Features:**
- [ ] Create RFEM training cycle
- [ ] Create Max Testing cycle
- [ ] Log workout sets
- [ ] Rest timer functions
- [ ] Complete workout
- [ ] View exercise history
- [ ] Edit exercises

**Entitlement & IAP:**
- [ ] Trial starts on first launch
- [ ] Trial banner shows correct days remaining
- [ ] Advanced features locked after trial
- [ ] Paywall modal appears for locked features
- [ ] Standard purchase works (sandbox)
- [ ] Advanced purchase works (sandbox)
- [ ] Restore purchases works
- [ ] Feature unlocking works after purchase

**Edge Cases:**
- [ ] Network disconnection during sync
- [ ] App background/foreground transitions
- [ ] Low memory warnings
- [ ] Device rotation (if supported)

### 5.4 Sandbox Testing for IAP

1. **Create Sandbox Tester:**
   - App Store Connect → Users and Access → Sandbox Testers
   - Create test account with unique email

2. **Test Purchases:**
   - Sign out of App Store on device
   - In app, trigger purchase
   - Sign in with sandbox account when prompted
   - Complete purchase
   - Verify entitlement updates

3. **Test Restore:**
   - Delete and reinstall app
   - Tap "Restore Purchases"
   - Verify entitlements restore correctly

**Checkpoint:** All TestFlight tests pass ✓

---

## 6. Phase 5: Submission

**Estimated Time:** 1-2 hours + Apple review (24-48 hours typical)

### 6.1 Pre-Submission Checklist

- [ ] All TestFlight testing complete
- [ ] Screenshots uploaded for all sizes
- [ ] App description finalized
- [ ] Keywords set
- [ ] Privacy policy URL active
- [ ] Support URL active
- [ ] IAP products configured and tested
- [ ] Build processed and ready

### 6.2 Submit for Review

1. Go to App Store Connect → Your App
2. Select the version (e.g., 3.0.0)
3. Add the build
4. Complete "App Review Information":
   - Contact: Your name, email, phone
   - Demo Account: Optional (can provide test credentials if needed)
   - Notes: "4-week free trial included. IAP for Standard ($4.99) and Advanced ($9.99) tiers."

5. Answer Export Compliance (No encryption → No)
6. Answer Content Rights
7. Click **Submit for Review**

### 6.3 Common Rejection Reasons

| Issue | Prevention |
|-------|------------|
| Crashes | Thorough TestFlight testing |
| IAP doesn't work | Test in sandbox thoroughly |
| Missing privacy policy | Ensure URL is accessible |
| Misleading screenshots | Use actual app screenshots |
| Incomplete functionality | Test all flows end-to-end |

### 6.4 After Approval

1. **Release Options:**
   - Manually release
   - Automatic release on approval
   - Scheduled release date

2. **Monitor:**
   - App Store reviews
   - Crash reports in App Store Connect
   - RevenueCat dashboard for purchases

**Checkpoint:** App submitted and approved ✓

---

## 7. Code Changes Reference

### Files to Create

| File | Purpose |
|------|---------|
| `capacitor.config.ts` | Capacitor configuration |
| `src/services/iapService.ts` | RevenueCat integration |

### Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add Capacitor dependencies and scripts |
| `src/services/entitlementService.ts` | Integrate IAP service |
| `src/hooks/useHaptics.ts` | Connect to @capacitor/haptics |
| `src/hooks/useKeyboardHeight.ts` | Connect to @capacitor/keyboard |
| `src/components/paywall/PaywallModal.tsx` | Add purchase handlers |
| `src/contexts/auth/AuthProvider.tsx` | Sync user ID with RevenueCat |

### Directories Created by Capacitor

```
ios/
├── App/
│   ├── App/
│   │   ├── Assets.xcassets/    # App icons go here
│   │   ├── Info.plist          # iOS configuration
│   │   └── ...
│   ├── App.xcodeproj
│   └── Podfile
└── ...
```

---

## 8. Decision Points

Before implementation, finalize these decisions:

### Pricing

| Tier | One-Time | Monthly Sub | Annual Sub |
|------|----------|-------------|------------|
| Standard | $ _____ | $ _____ | $ _____ |
| Advanced | $ _____ | $ _____ | $ _____ |

**Recommendation:** Start with one-time purchases for simplicity. Add subscriptions later if desired.

### Purchase Type

- [ ] **Non-Consumable (Lifetime)** - One-time purchase, simpler
- [ ] **Auto-Renewable Subscription** - Recurring revenue, more complex
- [ ] **Both** - Offer choice (most complex)

**Recommendation:** Non-consumable for initial release.

### Trial Duration

Current: **28 days (4 weeks)**

- [ ] Keep 28 days
- [ ] Reduce to 14 days
- [ ] Reduce to 7 days

### Bundle Identifier

Default: `com.betterdays.ascend`

- [ ] Use default
- [ ] Custom: ________________

---

## Appendices

### A. Cost Summary

| Item | Cost | Frequency |
|------|------|-----------|
| Apple Developer Program | $99 | Annual |
| RevenueCat | $0 | Free up to $2,500/mo revenue |
| Supabase | $0 | Current tier |
| Vercel | $0 | Current tier |
| **Total** | **$99/year** | |

### B. Useful Commands

```bash
# Build and sync
npm run cap:sync

# Open Xcode
npm run cap:open

# View iOS logs
npx cap run ios --target "iPhone 15 Pro"

# Clean build
cd ios/App && xcodebuild clean
```

### C. RevenueCat Dashboard URLs

- Dashboard: https://app.revenuecat.com
- Documentation: https://docs.revenuecat.com
- iOS SDK: https://docs.revenuecat.com/docs/ios

### D. Apple Resources

- App Store Connect: https://appstoreconnect.apple.com
- Developer Portal: https://developer.apple.com
- Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/

### E. Post-Launch Update Process

```bash
# 1. Make code changes
# 2. Bump version in package.json
# 3. Rebuild
npm run cap:sync

# 4. In Xcode:
#    - Update Version (3.0.0 → 3.0.1)
#    - Increment Build (1 → 2)
#    - Archive and upload

# 5. Submit new version for review
```

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-13 | Initial plan |
| 2.0 | 2026-01-15 | Updated for v2.16.0, reflects existing entitlement infrastructure, reduced timeline |
