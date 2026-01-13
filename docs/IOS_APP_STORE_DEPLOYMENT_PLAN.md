# Ascend iOS App Store Deployment Plan

**Document Version:** 1.0  
**Created:** 2026-01-13  
**Target Version:** 3.0.0  
**Status:** Planning

---

## Executive Summary

This document provides a complete roadmap for deploying Ascend to the Apple App Store, including:

1. **Capacitor integration** to wrap the existing PWA as a native iOS app
2. **In-App Purchase (IAP) implementation** with 4-week free trial
3. **Two-tier monetization**: Standard (limited) and Advanced (full features)
4. **Flexible architecture** supporting future subscription models
5. **Step-by-step instructions** for first-time App Store deployment

### Monetization Model

| Tier | Features | Pricing Model |
|------|----------|---------------|
| Free Trial | All features (4 weeks) | N/A |
| Standard | RFEM + Max Testing cycles only | Lower price point |
| Advanced | All features (Simple, Mixed cycles) | Higher price point |

The architecture supports both one-time purchase and subscription models — the decision can be deferred until App Store submission.

---

## Table of Contents

1. [Prerequisites & Accounts](#1-prerequisites--accounts)
2. [Development Environment Setup](#2-development-environment-setup)
3. [Capacitor Integration](#3-capacitor-integration)
4. [iOS Project Configuration](#4-ios-project-configuration)
5. [In-App Purchase Implementation](#5-in-app-purchase-implementation)
6. [Entitlement & Feature Gating](#6-entitlement--feature-gating)
7. [App Store Connect Setup](#7-app-store-connect-setup)
8. [TestFlight Beta Testing](#8-testflight-beta-testing)
9. [App Store Submission](#9-app-store-submission)
10. [Post-Launch Maintenance](#10-post-launch-maintenance)
11. [Implementation Phases](#11-implementation-phases)
12. [Appendices](#appendices)

---

## 1. Prerequisites & Accounts

### 1.1 Required Accounts

| Account | Purpose | Cost | URL |
|---------|---------|------|-----|
| **Apple Developer Program** | App Store distribution, TestFlight | $99/year | https://developer.apple.com/programs/ |
| **App Store Connect** | App management, IAP setup | Included with Developer Program | https://appstoreconnect.apple.com |
| **Supabase** (existing) | Backend, auth | Free tier sufficient | https://supabase.com |
| **Vercel** (existing) | Web deployment | Free tier sufficient | https://vercel.com |

> **Note:** You mentioned having an Apple Developer account already. Verify it's the **Apple Developer Program** ($99/year) not just a free Apple ID developer account.

### 1.2 Required Hardware

| Item | Purpose | Notes |
|------|---------|-------|
| **Mac** | Xcode, iOS builds | Required — no alternative for iOS builds |
| **iPhone** (recommended) | Physical device testing | Simulator works but physical testing recommended before submission |
| **iOS version** | Testing | Test on iOS 15+ (your app's minimum target) |

### 1.3 Required Software

| Software | Version | Purpose | Installation |
|----------|---------|---------|--------------|
| **Xcode** | 15.0+ | iOS builds, signing | Mac App Store |
| **Xcode Command Line Tools** | Latest | CLI builds | `xcode-select --install` |
| **Node.js** | 18+ | Build tooling | https://nodejs.org |
| **CocoaPods** | Latest | iOS dependency management | `sudo gem install cocoapods` |
| **Homebrew** | Latest | Package management | https://brew.sh |

### 1.4 Pre-Flight Checklist

Before starting, verify:

- [ ] Apple Developer Program membership is active
- [ ] Mac has latest macOS and Xcode installed
- [ ] Node.js 18+ installed
- [ ] Xcode Command Line Tools installed
- [ ] CocoaPods installed
- [ ] Current Ascend codebase builds and tests pass
- [ ] Supabase project is active with auth configured
- [ ] Standard/Advanced mode feature is implemented (v2.7.0+)

---

## 2. Development Environment Setup

### 2.1 Install Required Tools

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js via Homebrew (or use nvm)
brew install node

# Verify Node.js version
node --version  # Should be 18+

# Install CocoaPods
sudo gem install cocoapods

# Verify Xcode Command Line Tools
xcode-select --install  # Will say "already installed" if present

# Verify Xcode
xcodebuild -version  # Should show Xcode 15+
```

### 2.2 Clone and Prepare Project

```bash
# Navigate to your project directory
cd /path/to/ascend

# Ensure all dependencies are installed
npm install

# Verify the build works
npm run build

# Verify tests pass
npm test
```

### 2.3 Create iOS Development Certificate

Before building for iOS, you need signing certificates:

1. Open **Xcode** → Preferences → Accounts
2. Sign in with your Apple Developer account
3. Select your team → "Manage Certificates"
4. Click "+" → "Apple Development" certificate
5. Xcode will create and download the certificate

---

## 3. Capacitor Integration

### 3.1 Install Capacitor

```bash
# Install Capacitor core and CLI
npm install @capacitor/core @capacitor/cli

# Install iOS platform
npm install @capacitor/ios

# Initialize Capacitor
npx cap init "Ascend" "com.betterdays.ascend" --web-dir dist
```

> **Important:** The bundle identifier `com.betterdays.ascend` should be unique. Replace with your preferred identifier format.

### 3.2 Create Capacitor Configuration

Create or update `capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.betterdays.ascend',
  appName: 'Ascend',
  webDir: 'dist',
  
  // iOS-specific configuration
  ios: {
    // Use embedded web assets (not remote URL)
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    // Enable edge-to-edge
    backgroundColor: '#121212',
    // Scroll behavior
    scrollEnabled: true,
  },
  
  // Server configuration
  server: {
    // For production: serve from bundled assets
    // For development: can point to localhost
    // url: 'http://localhost:5173',  // Uncomment for dev
    cleartext: false,
  },
  
  // Plugins configuration
  plugins: {
    // Splash screen (optional)
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#121212',
      showSpinner: false,
    },
  },
};

export default config;
```

### 3.3 Add iOS Platform

```bash
# Build the web app first
npm run build

# Add iOS platform
npx cap add ios

# Sync web assets to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

### 3.4 Update package.json Scripts

Add Capacitor-related scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src/",
    "cap:sync": "npm run build && npx cap sync ios",
    "cap:open": "npx cap open ios",
    "cap:build": "npm run build && npx cap sync ios && npx cap open ios"
  }
}
```

### 3.5 Capacitor Plugins for iOS Features

Install recommended plugins for native capabilities:

```bash
# Status bar (control appearance)
npm install @capacitor/status-bar

# Haptic feedback
npm install @capacitor/haptics

# Local notifications (future: workout reminders)
npm install @capacitor/local-notifications

# App (lifecycle, info)
npm install @capacitor/app

# Keyboard (handle soft keyboard)
npm install @capacitor/keyboard

# Sync plugins to iOS
npx cap sync ios
```

---

## 4. iOS Project Configuration

### 4.1 Xcode Project Settings

After running `npx cap open ios`, configure in Xcode:

1. **Select the "App" target** in the project navigator
2. **General tab:**
   - Display Name: `Ascend`
   - Bundle Identifier: `com.betterdays.ascend`
   - Version: `3.0.0`
   - Build: `1`
   - Deployment Target: `iOS 15.0` (or your minimum)
   - Device Orientation: Portrait (uncheck Landscape options)

3. **Signing & Capabilities tab:**
   - Team: Select your Apple Developer team
   - Enable "Automatically manage signing"
   - Add capabilities:
     - **In-App Purchase** (required for IAP)
     - **Push Notifications** (optional, for future)

### 4.2 App Icons

You need app icons in various sizes. Create an icon set:

| Size | Usage | Filename |
|------|-------|----------|
| 1024×1024 | App Store | `AppIcon-1024.png` |
| 180×180 | iPhone @3x | `AppIcon-60@3x.png` |
| 120×120 | iPhone @2x | `AppIcon-60@2x.png` |
| 167×167 | iPad Pro | `AppIcon-83.5@2x.png` |
| 152×152 | iPad | `AppIcon-76@2x.png` |
| 120×120 | Spotlight @3x | `AppIcon-40@3x.png` |
| 80×80 | Spotlight @2x | `AppIcon-40@2x.png` |
| 87×87 | Settings @3x | `AppIcon-29@3x.png` |
| 58×58 | Settings @2x | `AppIcon-29@2x.png` |

**Option A: Use existing PWA icon**
Your existing `pwa-512x512.png` can be scaled. Use a tool like:
- https://appicon.co (online generator)
- Sketch, Figma, or similar

**Option B: Generate with ImageMagick**
```bash
# From your 512x512 source
convert pwa-512x512.png -resize 1024x1024 AppIcon-1024.png
convert pwa-512x512.png -resize 180x180 AppIcon-60@3x.png
# ... etc
```

Place icons in: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### 4.3 Launch Screen

Configure the launch screen in `ios/App/App/Base.lproj/LaunchScreen.storyboard` or use Capacitor's splash screen plugin.

### 4.4 Info.plist Configuration

Update `ios/App/App/Info.plist` with:

```xml
<key>CFBundleDisplayName</key>
<string>Ascend</string>

<key>NSCameraUsageDescription</key>
<string>Ascend needs camera access for future features.</string>

<!-- Required for App Store -->
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

---

## 5. In-App Purchase Implementation

### 5.1 IAP Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    In-App Purchase Architecture                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  StoreKit    │───▶│  IAP Service │───▶│ Entitlement  │       │
│  │  (Apple)     │    │  (Capacitor) │    │  Context     │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                 │                │
│                                                 ▼                │
│                            ┌──────────────────────────────┐     │
│                            │      Feature Gating          │     │
│                            │                              │     │
│                            │  ┌────────┐  ┌────────────┐ │     │
│                            │  │Standard│  │  Advanced  │ │     │
│                            │  │  Mode  │  │   Mode     │ │     │
│                            │  └────────┘  └────────────┘ │     │
│                            └──────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Install IAP Plugin

We'll use the `capacitor-plugin-purchases` plugin which wraps RevenueCat, or implement directly with `@capawesome/capacitor-purchases` for StoreKit 2.

**Option A: RevenueCat (Recommended for simplicity)**

RevenueCat handles receipt validation, subscription status, and analytics:

```bash
npm install @revenuecat/purchases-capacitor
npx cap sync ios
```

**Option B: Direct StoreKit 2 (More control, more work)**

```bash
npm install capacitor-iap
npx cap sync ios
```

**Recommendation:** Use RevenueCat for first implementation. It's free up to $2,500/month revenue and handles the complex parts of IAP (receipt validation, subscription management, cross-platform).

### 5.3 RevenueCat Setup

1. **Create RevenueCat Account**: https://www.revenuecat.com
2. **Create a Project** for Ascend
3. **Add iOS App** with your Bundle ID
4. **Get API Key** (public key for iOS)

### 5.4 Configure Products in App Store Connect

Before coding, set up products in App Store Connect:

1. Go to **App Store Connect** → Your App → **Monetization** → **In-App Purchases**
2. Create products:

**Product 1: Standard Mode**
- Reference Name: `ascend_standard`
- Product ID: `com.betterdays.ascend.standard`
- Type: Non-Consumable (lifetime) OR Auto-Renewable Subscription
- Price: $4.99 (example)

**Product 2: Advanced Mode**
- Reference Name: `ascend_advanced`
- Product ID: `com.betterdays.ascend.advanced`
- Type: Non-Consumable (lifetime) OR Auto-Renewable Subscription
- Price: $9.99 (example)

**For Subscriptions (if chosen):**
- Create a Subscription Group: "Ascend Pro"
- Add subscription durations (monthly, yearly)
- Configure intro offers (4-week free trial)

### 5.5 Create IAP Service

Create `src/services/iapService.ts`:

```typescript
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

export type EntitlementLevel = 'none' | 'standard' | 'advanced';

export interface EntitlementStatus {
  level: EntitlementLevel;
  isTrialActive: boolean;
  trialExpiresAt?: Date;
  purchaseDate?: Date;
  expiresDate?: Date; // For subscriptions
}

const REVENUECAT_API_KEY = 'your_api_key_here'; // Move to env var

class IAPService {
  private initialized = false;
  
  /**
   * Initialize RevenueCat SDK.
   * Call once at app startup.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Only initialize on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('[IAP] Skipping initialization on web');
      return;
    }
    
    try {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      await Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
      });
      this.initialized = true;
      console.log('[IAP] RevenueCat initialized');
    } catch (error) {
      console.error('[IAP] Failed to initialize:', error);
    }
  }
  
  /**
   * Get current entitlement status.
   */
  async getEntitlementStatus(): Promise<EntitlementStatus> {
    // Web fallback: no IAP, default to advanced (for development)
    if (!Capacitor.isNativePlatform()) {
      return {
        level: 'advanced', // Full access on web
        isTrialActive: false,
      };
    }
    
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      
      // Check for active entitlements
      const entitlements = customerInfo.customerInfo.entitlements.active;
      
      if (entitlements['advanced']) {
        return {
          level: 'advanced',
          isTrialActive: false,
          purchaseDate: new Date(entitlements['advanced'].originalPurchaseDate),
          expiresDate: entitlements['advanced'].expirationDate 
            ? new Date(entitlements['advanced'].expirationDate)
            : undefined,
        };
      }
      
      if (entitlements['standard']) {
        return {
          level: 'standard',
          isTrialActive: false,
          purchaseDate: new Date(entitlements['standard'].originalPurchaseDate),
          expiresDate: entitlements['standard'].expirationDate
            ? new Date(entitlements['standard'].expirationDate)
            : undefined,
        };
      }
      
      // Check trial status
      const offerings = await Purchases.getOfferings();
      // Trial logic would go here based on offering configuration
      
      return {
        level: 'none',
        isTrialActive: false,
      };
    } catch (error) {
      console.error('[IAP] Failed to get entitlement:', error);
      return {
        level: 'none',
        isTrialActive: false,
      };
    }
  }
  
  /**
   * Get available products for purchase.
   */
  async getOfferings() {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }
    
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('[IAP] Failed to get offerings:', error);
      return null;
    }
  }
  
  /**
   * Purchase a package.
   */
  async purchase(packageToPurchase: any): Promise<EntitlementStatus> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Purchases not available on web');
    }
    
    try {
      const result = await Purchases.purchasePackage({ aPackage: packageToPurchase });
      return this.getEntitlementStatus();
    } catch (error: any) {
      if (error.code === 'PURCHASE_CANCELLED') {
        console.log('[IAP] Purchase cancelled by user');
      } else {
        console.error('[IAP] Purchase failed:', error);
      }
      throw error;
    }
  }
  
  /**
   * Restore previous purchases.
   */
  async restorePurchases(): Promise<EntitlementStatus> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Purchases not available on web');
    }
    
    try {
      await Purchases.restorePurchases();
      return this.getEntitlementStatus();
    } catch (error) {
      console.error('[IAP] Restore failed:', error);
      throw error;
    }
  }
  
  /**
   * Associate user ID with RevenueCat (for cross-device).
   */
  async setUserId(userId: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      await Purchases.logIn({ appUserID: userId });
    } catch (error) {
      console.error('[IAP] Failed to set user ID:', error);
    }
  }
}

export const iapService = new IAPService();
```

### 5.6 Create Trial Manager

Create `src/services/trialService.ts` for managing the 4-week free trial:

```typescript
import { Capacitor } from '@capacitor/core';

const TRIAL_STORAGE_KEY = 'ascend_trial_start';
const TRIAL_DURATION_MS = 28 * 24 * 60 * 60 * 1000; // 28 days (4 weeks)

export interface TrialStatus {
  isActive: boolean;
  startedAt: Date | null;
  expiresAt: Date | null;
  daysRemaining: number;
  hasExpired: boolean;
}

class TrialService {
  /**
   * Start the trial if not already started.
   */
  startTrialIfNeeded(): TrialStatus {
    const existing = this.getTrialStart();
    if (!existing) {
      const now = new Date();
      localStorage.setItem(TRIAL_STORAGE_KEY, now.toISOString());
    }
    return this.getTrialStatus();
  }
  
  /**
   * Get trial start date.
   */
  private getTrialStart(): Date | null {
    const stored = localStorage.getItem(TRIAL_STORAGE_KEY);
    return stored ? new Date(stored) : null;
  }
  
  /**
   * Get current trial status.
   */
  getTrialStatus(): TrialStatus {
    const startedAt = this.getTrialStart();
    
    if (!startedAt) {
      return {
        isActive: false,
        startedAt: null,
        expiresAt: null,
        daysRemaining: 0,
        hasExpired: false,
      };
    }
    
    const expiresAt = new Date(startedAt.getTime() + TRIAL_DURATION_MS);
    const now = new Date();
    const msRemaining = expiresAt.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
    const hasExpired = msRemaining <= 0;
    const isActive = !hasExpired;
    
    return {
      isActive,
      startedAt,
      expiresAt,
      daysRemaining,
      hasExpired,
    };
  }
  
  /**
   * Check if user is in trial period.
   */
  isInTrial(): boolean {
    return this.getTrialStatus().isActive;
  }
  
  /**
   * Reset trial (for testing only).
   */
  resetTrial(): void {
    if (process.env.NODE_ENV === 'development') {
      localStorage.removeItem(TRIAL_STORAGE_KEY);
    }
  }
}

export const trialService = new TrialService();
```

---

## 6. Entitlement & Feature Gating

### 6.1 Create Entitlement Context

Create `src/contexts/EntitlementContext.tsx`:

```typescript
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { iapService, EntitlementStatus, EntitlementLevel } from '@/services/iapService';
import { trialService, TrialStatus } from '@/services/trialService';

interface EntitlementContextValue {
  // Current status
  entitlement: EntitlementStatus | null;
  trial: TrialStatus;
  isLoading: boolean;
  
  // Derived state
  effectiveLevel: EntitlementLevel; // What features user can access
  canAccessAdvanced: boolean;
  canAccessStandard: boolean;
  shouldShowPaywall: boolean;
  
  // Actions
  refreshEntitlement: () => Promise<void>;
  purchase: (packageId: string) => Promise<void>;
  restorePurchases: () => Promise<void>;
}

const EntitlementContext = createContext<EntitlementContextValue | undefined>(undefined);

export function EntitlementProvider({ children }: { children: ReactNode }) {
  const [entitlement, setEntitlement] = useState<EntitlementStatus | null>(null);
  const [trial, setTrial] = useState<TrialStatus>(() => trialService.getTrialStatus());
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      // Start trial if needed (on first launch)
      trialService.startTrialIfNeeded();
      setTrial(trialService.getTrialStatus());
      
      // Initialize IAP service
      await iapService.initialize();
      
      // Get entitlement status
      const status = await iapService.getEntitlementStatus();
      setEntitlement(status);
      setIsLoading(false);
    };
    
    init();
  }, []);
  
  // Compute effective access level
  const effectiveLevel: EntitlementLevel = (() => {
    // If user has purchased, use that
    if (entitlement?.level === 'advanced') return 'advanced';
    if (entitlement?.level === 'standard') return 'standard';
    
    // If in trial, give full access
    if (trial.isActive) return 'advanced';
    
    // No purchase, no trial = no access
    return 'none';
  })();
  
  const canAccessAdvanced = effectiveLevel === 'advanced';
  const canAccessStandard = effectiveLevel === 'advanced' || effectiveLevel === 'standard';
  const shouldShowPaywall = effectiveLevel === 'none' && Capacitor.isNativePlatform();
  
  const refreshEntitlement = useCallback(async () => {
    setIsLoading(true);
    const status = await iapService.getEntitlementStatus();
    setEntitlement(status);
    setTrial(trialService.getTrialStatus());
    setIsLoading(false);
  }, []);
  
  const purchase = useCallback(async (packageId: string) => {
    // Implementation depends on RevenueCat package structure
    // Would get package from offerings and call iapService.purchase()
    await refreshEntitlement();
  }, [refreshEntitlement]);
  
  const restorePurchases = useCallback(async () => {
    setIsLoading(true);
    await iapService.restorePurchases();
    await refreshEntitlement();
  }, [refreshEntitlement]);
  
  return (
    <EntitlementContext.Provider
      value={{
        entitlement,
        trial,
        isLoading,
        effectiveLevel,
        canAccessAdvanced,
        canAccessStandard,
        shouldShowPaywall,
        refreshEntitlement,
        purchase,
        restorePurchases,
      }}
    >
      {children}
    </EntitlementContext.Provider>
  );
}

export function useEntitlement() {
  const context = useContext(EntitlementContext);
  if (!context) {
    throw new Error('useEntitlement must be used within EntitlementProvider');
  }
  return context;
}
```

### 6.2 Update App Mode Logic

Modify the existing `AppMode` feature to integrate with entitlements:

```typescript
// src/utils/featureAccess.ts

import type { AppMode } from '@/types';
import type { EntitlementLevel } from '@/services/iapService';

/**
 * Determine if a feature is accessible based on entitlement and app mode.
 * 
 * Logic:
 * 1. If user has Advanced entitlement → follow their appMode preference
 * 2. If user has Standard entitlement → forced to Standard mode
 * 3. If in trial → full access (Advanced)
 * 4. If no entitlement and trial expired → paywall
 */
export function getEffectiveAppMode(
  userPreference: AppMode,
  entitlementLevel: EntitlementLevel
): AppMode {
  switch (entitlementLevel) {
    case 'advanced':
      // User can choose their preference
      return userPreference;
    case 'standard':
      // Forced to standard regardless of preference
      return 'standard';
    case 'none':
      // Should be behind paywall, but fallback to standard
      return 'standard';
  }
}

/**
 * Check if user can switch to Advanced mode.
 */
export function canSwitchToAdvanced(entitlementLevel: EntitlementLevel): boolean {
  return entitlementLevel === 'advanced';
}

/**
 * Get upgrade prompt message.
 */
export function getUpgradeMessage(entitlementLevel: EntitlementLevel): string | null {
  if (entitlementLevel === 'standard') {
    return 'Upgrade to Advanced to unlock Simple Progression and Mixed cycle types.';
  }
  return null;
}
```

### 6.3 Update CycleTypeSelector

Modify `src/components/cycles/CycleTypeSelector.tsx` to integrate entitlement:

```typescript
// Add to existing CycleTypeSelector.tsx

import { useEntitlement } from '@/contexts/EntitlementContext';

export function CycleTypeSelector({ /* existing props */ }) {
  const { canAccessAdvanced } = useEntitlement();
  const { preferences } = useSyncedPreferences();
  
  // Filter available cycle types based on BOTH app mode AND entitlement
  const availableCycleTypes = useMemo(() => {
    // If user doesn't have advanced entitlement, force standard mode behavior
    const effectiveMode = canAccessAdvanced ? preferences.appMode : 'standard';
    return getAvailableCycleTypes(effectiveMode);
  }, [canAccessAdvanced, preferences.appMode]);
  
  // Show upgrade prompt for locked options
  const handleLockedOptionClick = (cycleType: CycleType) => {
    if (!canAccessAdvanced) {
      // Show paywall/upgrade modal
      openPaywall('advanced');
    }
  };
  
  // ... rest of component
}
```

### 6.4 Create Paywall Component

Create `src/components/paywall/Paywall.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useEntitlement } from '@/contexts/EntitlementContext';
import { iapService } from '@/services/iapService';
import { CreditCard, Star, Zap, Check } from 'lucide-react';

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  recommendedTier?: 'standard' | 'advanced';
}

export function Paywall({ isOpen, onClose, recommendedTier = 'advanced' }: PaywallProps) {
  const { trial, purchase, restorePurchases, isLoading } = useEntitlement();
  const [offerings, setOfferings] = useState<any>(null);
  const [purchasing, setPurchasing] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      iapService.getOfferings().then(setOfferings);
    }
  }, [isOpen]);
  
  const handlePurchase = async (packageId: string) => {
    setPurchasing(true);
    try {
      await purchase(packageId);
      onClose();
    } catch (error) {
      // Handle error
    } finally {
      setPurchasing(false);
    }
  };
  
  const handleRestore = async () => {
    setPurchasing(true);
    try {
      await restorePurchases();
      onClose();
    } catch (error) {
      // Handle error
    } finally {
      setPurchasing(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose Your Plan">
      <div className="space-y-6">
        {/* Trial status banner */}
        {trial.hasExpired ? (
          <div className="bg-amber-900/30 border border-amber-600/50 rounded-lg p-4">
            <p className="text-amber-200 text-sm">
              Your free trial has ended. Choose a plan to continue using Ascend.
            </p>
          </div>
        ) : trial.isActive && (
          <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-4">
            <p className="text-blue-200 text-sm">
              {trial.daysRemaining} days left in your free trial.
            </p>
          </div>
        )}
        
        {/* Plan options */}
        <div className="grid gap-4">
          {/* Standard Plan */}
          <div className={`
            border rounded-lg p-4
            ${recommendedTier === 'standard' ? 'border-blue-500' : 'border-zinc-700'}
          `}>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-lg">Standard</h3>
              {recommendedTier === 'standard' && (
                <span className="text-xs bg-blue-500 px-2 py-0.5 rounded">Recommended</span>
              )}
            </div>
            <p className="text-zinc-400 text-sm mb-3">
              RFEM-based training with max testing cycles.
            </p>
            <ul className="space-y-1 mb-4">
              <FeatureItem>RFEM Training Cycles</FeatureItem>
              <FeatureItem>Max Rep Testing</FeatureItem>
              <FeatureItem>Cloud Sync</FeatureItem>
              <FeatureItem>All core features</FeatureItem>
            </ul>
            <Button
              onClick={() => handlePurchase('standard')}
              disabled={purchasing}
              className="w-full"
            >
              {offerings?.availablePackages?.[0]?.product?.priceString || '$4.99'}
            </Button>
          </div>
          
          {/* Advanced Plan */}
          <div className={`
            border rounded-lg p-4
            ${recommendedTier === 'advanced' ? 'border-purple-500' : 'border-zinc-700'}
          `}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold text-lg">Advanced</h3>
              {recommendedTier === 'advanced' && (
                <span className="text-xs bg-purple-500 px-2 py-0.5 rounded">Recommended</span>
              )}
            </div>
            <p className="text-zinc-400 text-sm mb-3">
              Full feature access with all progression modes.
            </p>
            <ul className="space-y-1 mb-4">
              <FeatureItem>Everything in Standard</FeatureItem>
              <FeatureItem included>Simple Progression Cycles</FeatureItem>
              <FeatureItem included>Mixed Mode Cycles</FeatureItem>
              <FeatureItem included>Future premium features</FeatureItem>
            </ul>
            <Button
              onClick={() => handlePurchase('advanced')}
              disabled={purchasing}
              variant="primary"
              className="w-full"
            >
              {offerings?.availablePackages?.[1]?.product?.priceString || '$9.99'}
            </Button>
          </div>
        </div>
        
        {/* Restore purchases */}
        <button
          onClick={handleRestore}
          disabled={purchasing}
          className="w-full text-center text-sm text-zinc-400 hover:text-zinc-300"
        >
          Restore Purchases
        </button>
      </div>
    </Modal>
  );
}

function FeatureItem({ children, included = true }: { children: React.ReactNode; included?: boolean }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <Check className={`w-4 h-4 ${included ? 'text-green-400' : 'text-zinc-500'}`} />
      <span className={included ? '' : 'text-zinc-500'}>{children}</span>
    </li>
  );
}
```

---

## 7. App Store Connect Setup

### 7.1 Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platforms:** iOS
   - **Name:** Ascend
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** com.betterdays.ascend
   - **SKU:** ascend-ios (unique identifier)
   - **User Access:** Full Access

### 7.2 App Information

Fill in the **App Information** section:

| Field | Value |
|-------|-------|
| Name | Ascend |
| Subtitle | Calisthenics Strength Training |
| Category | Health & Fitness |
| Secondary Category | Lifestyle (optional) |
| Content Rights | Does not contain third-party content |
| Age Rating | Complete the questionnaire (likely 4+) |

### 7.3 Pricing and Availability

1. Go to **Pricing and Availability**
2. **Price:** Free (app is free to download)
3. **Availability:** All territories (or select specific ones)

### 7.4 Configure In-App Purchases

Go to **Monetization** → **In-App Purchases**:

**For Non-Consumable (One-time purchase):**

1. Click **+** → **Non-Consumable**
2. Create Standard tier:
   - Reference Name: `Ascend Standard`
   - Product ID: `com.betterdays.ascend.standard`
   - Price: Select price tier (e.g., $4.99)
   - Localization: Add display name and description
   
3. Create Advanced tier:
   - Reference Name: `Ascend Advanced`
   - Product ID: `com.betterdays.ascend.advanced`
   - Price: Select price tier (e.g., $9.99)
   - Localization: Add display name and description

**For Auto-Renewable Subscription:**

1. Go to **Subscriptions** tab
2. Create Subscription Group: `Ascend Pro`
3. Add subscription tiers with:
   - Free trial period: 4 weeks
   - Monthly/Yearly options
   - Upgrade/downgrade behavior

### 7.5 Required Metadata

Before submission, you'll need:

| Asset | Requirements |
|-------|--------------|
| **Screenshots** | iPhone 6.7" (1290×2796), 6.5" (1284×2778), 5.5" (1242×2208) |
| **App Icon** | 1024×1024 PNG, no alpha |
| **Description** | Max 4000 characters |
| **Keywords** | Max 100 characters, comma-separated |
| **Support URL** | Public URL for support |
| **Privacy Policy URL** | Required for IAP apps |

### 7.6 Privacy Policy Requirements

You MUST have a privacy policy for apps with:
- User accounts
- In-App Purchases
- Data collection

Create a privacy policy page at your domain (e.g., `https://ascend.betterdays.app/privacy`) covering:

1. Data collected (email, workout data)
2. How data is used
3. Third parties (Supabase, RevenueCat)
4. User rights (deletion, export)
5. Contact information

### 7.7 App Privacy (Nutrition Labels)

App Store requires privacy "nutrition labels." For Ascend:

**Data Types Collected:**
- **Contact Info:** Email address
- **Health & Fitness:** Workout data
- **User Content:** Exercise configurations

**Data Linked to User:** Yes (account-based)
**Data Used for Tracking:** No

---

## 8. TestFlight Beta Testing

### 8.1 Build and Upload

```bash
# Ensure latest build
npm run build

# Sync to iOS
npx cap sync ios

# Open Xcode
npx cap open ios
```

In Xcode:

1. Select **Product** → **Archive**
2. Wait for archive to complete
3. In **Organizer**, select the archive
4. Click **Distribute App** → **App Store Connect** → **Upload**
5. Wait for upload and processing (10-30 minutes)

### 8.2 TestFlight Setup

In App Store Connect:

1. Go to your app → **TestFlight** tab
2. **Internal Testing:**
   - Add yourself and team members as testers
   - Builds appear immediately (no review)
   - Limit: 100 testers

3. **External Testing:**
   - Create a test group
   - Add email addresses or share public link
   - Requires Beta App Review (usually 24-48 hours)
   - Limit: 10,000 testers

### 8.3 Testing Checklist

Before submission, verify on physical device:

**Core Functionality:**
- [ ] App launches successfully
- [ ] Onboarding flow completes
- [ ] User can sign up/sign in
- [ ] Cloud sync works
- [ ] All navigation works
- [ ] Workout logging works
- [ ] Cycle creation works (Standard mode)
- [ ] Cycle creation works (Advanced mode)
- [ ] Settings page accessible

**IAP Testing:**
- [ ] Trial starts on first launch
- [ ] Trial countdown displays correctly
- [ ] Paywall appears after trial expires
- [ ] Standard purchase works (sandbox)
- [ ] Advanced purchase works (sandbox)
- [ ] Restore purchases works
- [ ] Feature gating works correctly
- [ ] Upgrade prompts appear for locked features

**Edge Cases:**
- [ ] Offline behavior works
- [ ] App handles network errors gracefully
- [ ] Background/foreground transitions work
- [ ] Data persists after app restart

---

## 9. App Store Submission

### 9.1 Pre-Submission Checklist

- [ ] All TestFlight testing complete
- [ ] Screenshots prepared for all required sizes
- [ ] App description written
- [ ] Keywords researched and selected
- [ ] Privacy policy published
- [ ] Support URL active
- [ ] All metadata fields completed
- [ ] IAP products configured and approved
- [ ] Build uploaded and processed

### 9.2 Submit for Review

1. Go to App Store Connect → Your App
2. Select the build to submit
3. Complete all required fields under **App Review Information:**
   - Demo account (if needed): Provide test credentials
   - Contact info: Your email and phone
   - Notes: Explain any non-obvious functionality

4. Click **Submit for Review**

### 9.3 Review Timeline

- **Initial Review:** 24-48 hours (typical), up to several days
- **Rejection:** You'll receive specific feedback
- **Approval:** App goes live immediately or on scheduled date

### 9.4 Common Rejection Reasons

| Reason | Prevention |
|--------|------------|
| Crashes/bugs | Thorough TestFlight testing |
| Incomplete functionality | Ensure all features work |
| Misleading metadata | Accurate descriptions |
| Privacy issues | Complete privacy policy |
| IAP issues | Test thoroughly in sandbox |
| Performance issues | Test on older devices |

### 9.5 Responding to Rejection

If rejected:

1. Read the rejection details carefully
2. Fix the issues
3. Upload new build
4. Reply in Resolution Center
5. Resubmit

---

## 10. Post-Launch Maintenance

### 10.1 Update Process

For each update:

```bash
# 1. Make code changes
# 2. Update version in package.json
# 3. Update version in Xcode (General → Version)
# 4. Increment build number

npm run build
npx cap sync ios

# 5. Archive and upload (same as initial)
# 6. Submit for review
```

### 10.2 Version Strategy

| Update Type | Version Change | Review Required |
|-------------|---------------|-----------------|
| Bug fix | 3.0.1 → 3.0.2 | Yes |
| Minor feature | 3.0.x → 3.1.0 | Yes |
| Major release | 3.x.x → 4.0.0 | Yes |

### 10.3 Certificate Management

- **Distribution certificate:** Valid for 1 year
- **Provisioning profile:** Valid for 1 year
- **Set reminders** to renew before expiration
- Xcode usually handles renewal automatically

### 10.4 Monitoring

Set up monitoring for:

- **App Store Connect:** Reviews, crash reports
- **RevenueCat:** Purchase analytics
- **Supabase:** Database usage, auth metrics

---

## 11. Implementation Phases

### Phase 1: Development Setup (Week 1)
**Estimated Time:** 1-2 days

- [ ] Verify Apple Developer Program membership
- [ ] Install Xcode and dependencies
- [ ] Set up development certificates
- [ ] Initialize Capacitor in project
- [ ] Create basic iOS build

### Phase 2: iOS Configuration (Week 1)
**Estimated Time:** 1-2 days

- [ ] Configure Xcode project settings
- [ ] Generate and import app icons
- [ ] Configure Info.plist
- [ ] Test basic build on simulator
- [ ] Test on physical device

### Phase 3: IAP Implementation (Week 2)
**Estimated Time:** 3-4 days

- [ ] Set up RevenueCat account
- [ ] Create products in App Store Connect
- [ ] Implement IAP service
- [ ] Implement trial service
- [ ] Create entitlement context
- [ ] Update feature gating logic

### Phase 4: UI Integration (Week 2-3)
**Estimated Time:** 2-3 days

- [ ] Create paywall component
- [ ] Update cycle type selector
- [ ] Update settings page
- [ ] Add trial status displays
- [ ] Test all IAP flows

### Phase 5: App Store Preparation (Week 3)
**Estimated Time:** 2-3 days

- [ ] Create screenshots
- [ ] Write app description
- [ ] Publish privacy policy
- [ ] Complete App Store Connect metadata
- [ ] Configure IAP products

### Phase 6: Testing (Week 3-4)
**Estimated Time:** 3-5 days

- [ ] Internal TestFlight testing
- [ ] IAP sandbox testing
- [ ] External beta testing (optional)
- [ ] Fix identified issues

### Phase 7: Submission (Week 4)
**Estimated Time:** 1 day + review time

- [ ] Final build upload
- [ ] Submit for review
- [ ] Respond to any rejection feedback
- [ ] Launch!

### Total Timeline Estimate

| Phase | Duration |
|-------|----------|
| Setup & Configuration | 3-4 days |
| IAP Implementation | 3-4 days |
| UI Integration | 2-3 days |
| App Store Prep | 2-3 days |
| Testing | 3-5 days |
| Submission & Review | 1-7 days |
| **Total** | **3-4 weeks** |

---

## Appendices

### Appendix A: File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `capacitor.config.ts` | Create | Capacitor configuration |
| `package.json` | Modify | Add Capacitor dependencies and scripts |
| `src/services/iapService.ts` | Create | In-App Purchase handling |
| `src/services/trialService.ts` | Create | Trial period management |
| `src/contexts/EntitlementContext.tsx` | Create | Entitlement state management |
| `src/utils/featureAccess.ts` | Create | Feature gating utilities |
| `src/components/paywall/Paywall.tsx` | Create | Purchase UI |
| `src/components/cycles/CycleTypeSelector.tsx` | Modify | Entitlement integration |
| `src/pages/Settings.tsx` | Modify | Subscription status display |
| `src/App.tsx` | Modify | Add EntitlementProvider |
| `ios/` | Create | Capacitor iOS project |

### Appendix B: Cost Summary

| Item | Cost | Frequency |
|------|------|-----------|
| Apple Developer Program | $99 | Annual |
| RevenueCat | Free | Up to $2,500/mo revenue |
| Supabase | Free | Current tier |
| Vercel | Free | Current tier |
| **Total Ongoing** | **~$99/year** | |

### Appendix C: Decision Points

**Before Implementation, Decide:**

1. **Pricing:**
   - Standard: $ ______
   - Advanced: $ ______

2. **Purchase Type:**
   - [ ] Non-consumable (one-time)
   - [ ] Auto-renewable subscription
   - [ ] Both

3. **Trial Duration:**
   - Current plan: 4 weeks
   - Adjust? ______

4. **Future Features:**
   - What should be Standard vs Advanced?
   - What new features are planned?

### Appendix D: RevenueCat Configuration

After creating RevenueCat account, configure:

1. **Products** (map to App Store Connect)
2. **Offerings** (current offering with packages)
3. **Entitlements** (standard, advanced)
4. **Webhooks** (optional, for server-side validation)

### Appendix E: Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [RevenueCat Documentation](https://docs.revenuecat.com)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-13 | Claude | Initial document |
