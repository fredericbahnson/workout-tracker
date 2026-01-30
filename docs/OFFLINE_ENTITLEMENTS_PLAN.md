# Offline Entitlements & Web Platform Support

## Overview

This document outlines the plan to add offline entitlement support to Ascend, ensuring users can access their purchased features even when offline, and extending full entitlement checking to the web platform (PWA).

---

## Problem Statement

### Original Issue: Offline Login

When a user with a valid purchase opens the app **offline**, the following occurs:

1. `AuthProvider` restores the cached Supabase session → user appears logged in ✅
2. `EntitlementProvider.initialize()` calls `entitlementService.initialize()`
3. `entitlementService` calls `iapService.getPurchaseInfo()`
4. `iapService` tries to call RevenueCat's `getCustomerInfo()` → **fails (no network)**
5. `getPurchaseInfo()` returns `null` (no purchase info)
6. `entitlementService` falls back to trial status only
7. If trial is expired → **user sees paywall despite having paid**

### Impact

- Paying customers see a paywall when offline
- Standard purchasers lose access to RFEM/Max Testing features when offline
- Advanced purchasers lose access to all features when offline
- Especially problematic on mobile where connectivity is intermittent

### Extended Scope: Web Platform Parity

The web app (PWA) currently has no entitlement checking because RevenueCat's Capacitor SDK only works on native platforms. Users who purchase on iOS cannot access their entitlements when using the web app.

---

## Current Architecture

| Component | Storage | Offline Support |
|-----------|---------|-----------------|
| Training data (exercises, sets, cycles) | IndexedDB (Dexie) | ✅ Full - sync queue handles offline changes |
| User preferences | IndexedDB + sync | ✅ Full |
| Trial status | localStorage | ✅ Full - `trialService.ts` reads/writes locally |
| Supabase auth session | localStorage (via Supabase SDK) | ✅ Partial - cached session can be restored |
| Purchase/entitlement info | RevenueCat API only | ❌ **None** |

### Key Files

```
src/services/iapService.ts          - RevenueCat integration, no caching
src/services/entitlementService.ts  - Coordinates trial + purchase, no offline fallback
src/services/trialService.ts        - Trial only, already works offline
src/contexts/entitlement/           - Entitlement context and provider
src/contexts/auth/AuthProvider.tsx  - Manages Supabase auth, clears data on logout
```

---

## Solution Design

### Approach: Supabase Sync + Local Caching

Store entitlement status in a Supabase table, synchronized from native app purchases, with local caching for offline access on all platforms.

```
┌─────────────────────────────────────────────────────────────────┐
│                         iOS App                                  │
│  Purchase → RevenueCat → iapService                             │
│                              ↓                                   │
│                    Sync to Supabase table                       │
│                    (user_entitlements)                          │
│                              ↓                                   │
│                    Cache locally                                 │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ user_entitlements                                        │   │
│  │ - user_id (FK to auth.users)                            │   │
│  │ - tier ('standard' | 'advanced')                        │   │
│  │ - purchase_type ('lifetime' | 'subscription')           │   │
│  │ - purchased_at                                          │   │
│  │ - expires_at (null for lifetime)                        │   │
│  │ - will_renew                                            │   │
│  │ - product_id                                            │   │
│  │ - updated_at                                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Web App (PWA)                                 │
│  Online:  Read from Supabase → Cache locally                    │
│  Offline: Read from local cache                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Service Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                     entitlementService.ts                          │
│  (Coordinator - determines access based on trial + purchase)       │
└────────────────────────────────────────────────────────────────────┘
                    │                           │
         ┌──────────┴──────────┐     ┌─────────┴─────────┐
         │                     │     │                    │
         ▼                     ▼     ▼                    │
┌─────────────────┐  ┌─────────────────────┐             │
│ trialService.ts │  │ entitlementSync.ts  │             │
│ (localStorage)  │  │ (Supabase + cache)  │             │
└─────────────────┘  └─────────────────────┘             │
                              │                          │
              ┌───────────────┼───────────────┐          │
              │               │               │          │
              ▼               ▼               ▼          ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐
     │ Supabase     │ │ Local Cache  │ │ iapService.ts        │
     │ (online)     │ │ (offline)    │ │ (native RevenueCat)  │
     └──────────────┘ └──────────────┘ └──────────────────────┘
```

---

## Decisions Made

### Staleness Thresholds

| Threshold | Duration | Behavior |
|-----------|----------|----------|
| Stale | 7 days | Cache still usable, triggers refresh when online |
| Max Age | 60 days | Cache not trusted, must fetch fresh (aligned with session validity) |

### UI Behavior

- **Silent operation**: No UI indicator when using cached entitlement data
- Entitlement checks work transparently whether online or offline

### Web Platform Behavior

- Web app will have **full entitlement checking parity** with native app
- Online: Read from Supabase
- Offline: Read from local cache (if available from previous online session)

### RevenueCat Webhooks

- **Not implementing webhooks** at this time
- Rationale: Ascend uses **lifetime purchases**, not subscriptions
- For lifetime purchases, app-driven sync is sufficient
- Only gap: refund scenario where user never opens native app again (cache expires in 60 days)
- Webhooks can be added later if subscription options are introduced

### Tampering Tolerance

- Accepted that a sophisticated user could theoretically edit their Supabase row directly
- Acceptable risk for a fitness app
- Would require user to know Supabase internals and use API directly

### Authentication Requirement

- **First login always requires network connectivity** (standard pattern)
- Supabase authentication requires server verification of credentials
- Offline access is only available for previously-authenticated users
- This is the same pattern used by Gmail, Slack, banking apps, etc.

---

## Session Validity & Offline Duration

### Overview

Multiple time boundaries affect how long a user can remain offline while still having full app functionality. Understanding these helps set appropriate expectations and configuration.

### Time Boundaries

| Component | Duration | What Happens When Expired |
|-----------|----------|---------------------------|
| **Supabase Access Token** | 1 hour | Can't make authenticated API calls (auto-refreshes if refresh token valid) |
| **Supabase Refresh Token** | **30 days** (configured) | Must re-authenticate with credentials |
| **Entitlement Cache (Stale)** | 7 days | Still works, triggers refresh when online |
| **Entitlement Cache (Max Age)** | 60 days | Not trusted, must fetch fresh |

### The Limiting Factor: Refresh Token

The **refresh token expiry** is the critical boundary for offline access:

**Within 30 days offline:**
- User can access the app with cached session
- Entitlements work from local cache
- When back online: refresh token gets new access token, sync resumes normally

**After 30 days offline:**
- Cached session exists but refresh token is expired
- App continues to work offline (cached data still accessible)
- When back online: Supabase SDK fails to refresh → user signed out
- User must re-enter credentials to continue

### Supabase Configuration (Required)

Update the refresh token expiry in **Supabase Dashboard → Authentication → Settings**:

| Setting | Default | Recommended |
|---------|---------|-------------|
| JWT Expiry | 3600 (1 hour) | Keep as-is |
| Refresh Token Expiry | 604800 (1 week) | **2592000 (30 days)** |

This gives users a 30-day window of offline access before requiring re-authentication.

### Aligned Timeframes

With the recommended 30-day refresh token:

| Boundary | Duration | Rationale |
|----------|----------|-----------|
| Supabase Refresh Token | 30 days | Maximum offline session duration |
| Entitlement Cache Stale | 7 days | Prompt refresh when online, but still usable |
| Entitlement Cache Max | 60 days | Beyond session validity, provides buffer |

### Graceful Degradation

The existing `AuthProvider` already handles token expiry gracefully when offline:

```typescript
// Handle token refresh errors gracefully when offline
if (event === 'TOKEN_REFRESHED' && !session && !navigator.onLine) {
  log.debug('Token refresh failed while offline - keeping existing session');
  return; // Don't clear user when offline
}
```

This keeps the user "logged in" locally even when tokens expire, as long as they remain offline. The session is only invalidated when they return online and the refresh fails.

### User Experience Summary

| Scenario | Duration Offline | Experience |
|----------|------------------|------------|
| Short offline period | < 7 days | Seamless, entitlements from cache |
| Medium offline period | 7-30 days | Works, entitlement cache marked stale but usable |
| Long offline period | 30-60 days | Works offline, must re-login when back online |
| Very long offline | > 60 days | Works offline, must re-login, entitlements refreshed from Supabase |

---

## Implementation Plan

### Phase 1: Database & Configuration Setup

#### Configure Supabase Authentication Settings

**Location:** Supabase Dashboard → Authentication → Settings

Update the following setting:

| Setting | Value |
|---------|-------|
| Refresh Token Expiry | 2592000 (30 days) |

This extends the offline session validity from the default 1 week to 30 days.

#### Create Supabase Migration

**File:** `supabase/migrations/008_user_entitlements.sql`

Create as a markdown reference document (manual implementation).

**Schema:**

```sql
-- Migration: 008_user_entitlements.sql
-- Description: Add user_entitlements table for cross-platform entitlement sync

CREATE TABLE user_entitlements (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('standard', 'advanced')),
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('lifetime', 'subscription')),
  purchased_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ, -- null for lifetime purchases
  will_renew BOOLEAN DEFAULT false,
  product_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for faster lookups (though user_id is already PK)
CREATE INDEX idx_user_entitlements_updated_at ON user_entitlements(updated_at);

-- Enable Row Level Security
ALTER TABLE user_entitlements ENABLE ROW LEVEL SECURITY;

-- Users can read their own entitlement
CREATE POLICY "Users can read own entitlement"
  ON user_entitlements FOR SELECT
  USING (auth.uid() = user_id);

-- Users can upsert their own entitlement (app writes after purchase)
CREATE POLICY "Users can upsert own entitlement"
  ON user_entitlements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entitlement"
  ON user_entitlements FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own entitlement (for cleanup/refund scenarios)
CREATE POLICY "Users can delete own entitlement"
  ON user_entitlements FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_entitlements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_entitlements_updated_at
  BEFORE UPDATE ON user_entitlements
  FOR EACH ROW
  EXECUTE FUNCTION update_user_entitlements_updated_at();
```

---

### Phase 2: Local Caching Service

#### Create `src/services/entitlementCache.ts`

**Purpose:** Local storage caching of entitlement data for offline access.

**Key Functions:**

```typescript
interface CachedEntitlement {
  userId: string;
  purchaseInfo: PurchaseInfo | null;
  cachedAt: string; // ISO date
  appVersion?: string;
}

const entitlementCache = {
  // Save entitlement with user binding
  save(userId: string, purchaseInfo: PurchaseInfo | null): void;
  
  // Retrieve if exists and belongs to user
  load(userId: string): {
    purchaseInfo: PurchaseInfo | null;
    isStale: boolean;
    cachedAt: Date;
  } | null;
  
  // Remove cache (called on logout)
  clear(): void;
  
  // Check if subscription hasn't expired
  isPurchaseValid(purchaseInfo: PurchaseInfo | null): boolean;
};
```

**Security Features:**
- Cache tied to specific user ID
- Different user = no data returned
- Staleness detection (7 days)
- Max age enforcement (60 days)
- Subscription expiration checking

---

### Phase 3: Supabase Sync Service

#### Create `src/services/entitlementSync.ts`

**Purpose:** Synchronize entitlements between RevenueCat, Supabase, and local cache.

**Key Functions:**

```typescript
const entitlementSync = {
  // Get entitlement (tries Supabase, falls back to cache)
  async getEntitlement(userId: string): Promise<PurchaseInfo | null>;
  
  // Save entitlement to Supabase and cache
  async syncToSupabase(userId: string, purchaseInfo: PurchaseInfo): Promise<void>;
  
  // Remove entitlement from Supabase (refund/revoke scenario)
  async removeEntitlement(userId: string): Promise<void>;
  
  // Force refresh from Supabase (ignores cache)
  async refreshFromSupabase(userId: string): Promise<PurchaseInfo | null>;
};
```

**Behavior:**

| Scenario | Action |
|----------|--------|
| Online, Supabase has data | Return data, update cache |
| Online, Supabase empty | Return null, clear cache |
| Online, Supabase error | Fall back to cache |
| Offline | Return cached data if valid |

---

### Phase 4: Update IAP Service

#### Modify `src/services/iapService.ts`

**Changes:**

1. **Track current user ID:**
   ```typescript
   private currentUserId: string | null = null;
   ```

2. **Update `setUserId()`:**
   - Store user ID for sync operations
   - Do NOT clear cache here (that's on logout)

3. **Update `getPurchaseInfo()`:**
   - After successful RevenueCat call, trigger sync to Supabase
   - On failure, fall back to `entitlementSync.getEntitlement()`

4. **Update `purchase()` and `restorePurchases()`:**
   - After successful operation, trigger sync to Supabase

**Flow (Native):**
```
getPurchaseInfo()
  → Try RevenueCat
  → On success: sync to Supabase, cache locally, return
  → On failure: return entitlementSync.getEntitlement()
```

---

### Phase 5: Update Entitlement Service

#### Modify `src/services/entitlementService.ts`

**Changes:**

1. **Replace direct `iapService.getPurchaseInfo()` calls:**
   - Native: Use iapService (which now syncs to Supabase)
   - Web: Use `entitlementSync.getEntitlement()` directly

2. **Update `getPurchaseInfo()` helper function:**
   ```typescript
   async function getPurchaseInfo(userId: string | null): Promise<PurchaseInfo | null> {
     if (isNativePlatform()) {
       // Native: RevenueCat is source of truth (with Supabase sync)
       return iapService.getPurchaseInfo();
     } else if (userId) {
       // Web: Supabase is source of truth (with local cache fallback)
       return entitlementSync.getEntitlement(userId);
     }
     return null;
   }
   ```

3. **Pass user ID through the service:**
   - `getEntitlementStatus()` needs access to user ID for web platform
   - Update function signature or use a different approach

---

### Phase 6: Update Auth Provider

#### Modify `src/contexts/auth/AuthProvider.tsx`

**Changes:**

1. **Import entitlement cache:**
   ```typescript
   import { entitlementCache } from '@/services/entitlementCache';
   ```

2. **Clear cache on sign out:**
   ```typescript
   const signOut = async () => {
     // ... existing code ...
     
     // Clear entitlement cache to prevent stale data for next user
     entitlementCache.clear();
     
     // ... rest of signOut ...
   };
   ```

3. **Clear cache on account deletion:**
   ```typescript
   const deleteAccount = async () => {
     // ... existing code ...
     
     entitlementCache.clear();
     
     // ... rest of deleteAccount ...
   };
   ```

---

### Phase 7: Add Type Definitions

#### Modify `src/services/sync/types.ts`

**Add remote entitlement type:**

```typescript
export interface RemoteUserEntitlement {
  user_id: string;
  tier: 'standard' | 'advanced';
  purchase_type: 'lifetime' | 'subscription';
  purchased_at: string; // ISO date
  expires_at: string | null;
  will_renew: boolean;
  product_id: string | null;
  updated_at: string; // ISO date
}
```

---

### Phase 8: Testing

#### Create `src/services/entitlementCache.test.ts`

**Test Cases:**

1. Save/load round-trip
2. User ID binding (different user = no data)
3. Staleness detection (7+ days old)
4. Max age enforcement (60+ days old)
5. Subscription expiration checking
6. Lifetime purchase validity
7. Cache clearing
8. Corrupted cache handling

#### Create `src/services/entitlementSync.test.ts`

**Test Cases:**

1. Online: fetch from Supabase, cache result
2. Online: Supabase empty, return null
3. Online: Supabase error, fall back to cache
4. Offline: return cached data
5. Offline: no cache, return null
6. Sync to Supabase after purchase
7. User ID mismatch protection

---

## File Summary

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/008_user_entitlements.sql` | Database migration (as markdown reference) |
| `src/services/entitlementCache.ts` | Local storage caching |
| `src/services/entitlementSync.ts` | Supabase sync logic |
| `src/services/entitlementCache.test.ts` | Cache unit tests |
| `src/services/entitlementSync.test.ts` | Sync unit tests |

### Files to Modify

| File | Changes |
|------|---------|
| `src/services/iapService.ts` | Track user ID, trigger Supabase sync |
| `src/services/entitlementService.ts` | Use sync service, support web platform |
| `src/contexts/auth/AuthProvider.tsx` | Clear cache on logout/delete |
| `src/services/sync/types.ts` | Add `RemoteUserEntitlement` type |

---

## Scenario Coverage

### Native App (iOS)

| Scenario | Behavior |
|----------|----------|
| Purchase | RevenueCat → Supabase sync → Local cache |
| Restore | RevenueCat → Supabase sync → Local cache |
| Online app open | RevenueCat refresh → Supabase sync → Access granted |
| Offline app open | Local cache → Access granted (if valid) |
| Refund + app open | RevenueCat shows no entitlement → Supabase cleared |

### Web App (PWA)

| Scenario | Behavior |
|----------|----------|
| Online, has purchase | Supabase read → Local cache → Access granted |
| Online, no purchase | Supabase read → Return null → Trial/paywall |
| Offline, has cache | Local cache → Access granted (if valid) |
| Offline, no cache | Return null → Trial/paywall |
| Cache expired (60+ days) | Treat as no cache |

### Cross-Platform

| Scenario | Behavior |
|----------|----------|
| Purchase on iOS, open web | Web reads Supabase → Gets entitlement ✅ |
| Purchase on iOS, web offline | Web uses cache (if previously online) |

---

## Security Summary

1. **User ID Binding:** Cache and Supabase data tied to specific user
2. **RLS Protection:** Users can only access their own entitlement row
3. **Cache Isolation:** Different user login = fresh state
4. **Logout Cleanup:** Cache cleared on sign out
5. **Accepted Risk:** User could theoretically edit their Supabase row directly

---

## What This Does NOT Change

- ✅ Sync queue behavior
- ✅ Training data storage
- ✅ Trial service
- ✅ Auth flow
- ✅ Supabase session handling
- ✅ Existing sync security

---

## Future Considerations

1. **RevenueCat Webhooks:** Can be added later if subscription options are introduced
2. **Server-Side Validation:** For higher-stakes apps, add Edge Function to validate with RevenueCat
3. **Cache Encryption:** If storing more sensitive data, consider encrypting localStorage
