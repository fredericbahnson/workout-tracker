/**
 * Entitlement Cache
 *
 * localStorage-based cache for PurchaseInfo, keyed per user.
 * Provides offline access to entitlement data when RevenueCat
 * or Supabase is unavailable.
 *
 * Cache has two time-based thresholds:
 * - Stale (7 days): Cache is usable but should be refreshed when online
 * - Max age (60 days): Cache is not trusted and returns null
 */

import type { PurchaseInfo } from '@/types/entitlement';
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('EntitlementCache');

const STORAGE_KEY = 'ascend_entitlement_cache';

/** 7 days in milliseconds */
const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

/** 60 days in milliseconds */
const MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000;

/**
 * Serialized form stored in localStorage.
 * Dates are stored as ISO strings for JSON compatibility.
 */
interface CachedEntitlement {
  userId: string;
  purchaseInfo: SerializedPurchaseInfo | null;
  cachedAt: string;
}

/** PurchaseInfo with dates as ISO strings for JSON serialization */
interface SerializedPurchaseInfo {
  tier: PurchaseInfo['tier'];
  type: PurchaseInfo['type'];
  purchasedAt: string;
  expiresAt: string | null;
  willRenew?: boolean;
  productId?: string;
}

/** Result of loading from cache */
export interface CacheLoadResult {
  purchaseInfo: PurchaseInfo | null;
  isStale: boolean;
  cachedAt: Date;
}

function serializePurchaseInfo(info: PurchaseInfo): SerializedPurchaseInfo {
  return {
    tier: info.tier,
    type: info.type,
    purchasedAt: info.purchasedAt.toISOString(),
    expiresAt: info.expiresAt ? info.expiresAt.toISOString() : null,
    willRenew: info.willRenew,
    productId: info.productId,
  };
}

function deserializePurchaseInfo(serialized: SerializedPurchaseInfo): PurchaseInfo {
  return {
    tier: serialized.tier,
    type: serialized.type,
    purchasedAt: new Date(serialized.purchasedAt),
    expiresAt: serialized.expiresAt ? new Date(serialized.expiresAt) : null,
    willRenew: serialized.willRenew,
    productId: serialized.productId,
  };
}

export const entitlementCache = {
  /**
   * Save entitlement data to localStorage, bound to a specific user.
   */
  save(userId: string, purchaseInfo: PurchaseInfo | null): void {
    try {
      const cached: CachedEntitlement = {
        userId,
        purchaseInfo: purchaseInfo ? serializePurchaseInfo(purchaseInfo) : null,
        cachedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
      log.debug('Cached entitlement for user', { userId });
    } catch (error) {
      log.error('Failed to save entitlement cache', { error });
    }
  },

  /**
   * Load entitlement from cache.
   * Returns null if:
   * - No cache exists
   * - Cache belongs to a different user
   * - Cache is older than MAX_AGE_MS (60 days)
   * - Cache data is corrupted
   */
  load(userId: string): CacheLoadResult | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const cached: CachedEntitlement = JSON.parse(raw);

      // Verify user ID matches
      if (cached.userId !== userId) {
        log.debug('Cache user ID mismatch, ignoring');
        return null;
      }

      // Check max age
      const cachedAt = new Date(cached.cachedAt);
      if (isNaN(cachedAt.getTime())) {
        log.debug('Invalid cachedAt date, ignoring');
        return null;
      }

      const age = Date.now() - cachedAt.getTime();
      if (age > MAX_AGE_MS) {
        log.debug('Cache exceeded max age, ignoring');
        return null;
      }

      // Determine staleness
      const isStale = age > STALE_THRESHOLD_MS;

      // Deserialize purchase info
      const purchaseInfo = cached.purchaseInfo
        ? deserializePurchaseInfo(cached.purchaseInfo)
        : null;

      return { purchaseInfo, isStale, cachedAt };
    } catch (error) {
      log.error('Failed to load entitlement cache', { error });
      return null;
    }
  },

  /**
   * Clear the entitlement cache.
   * Called on sign out and account deletion.
   */
  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      log.debug('Entitlement cache cleared');
    } catch (error) {
      log.error('Failed to clear entitlement cache', { error });
    }
  },

  /**
   * Check if a PurchaseInfo represents a currently valid purchase.
   * - Lifetime purchases are always valid
   * - Subscriptions are valid if expiresAt is in the future
   */
  isPurchaseValid(purchaseInfo: PurchaseInfo | null): boolean {
    if (!purchaseInfo) return false;
    if (purchaseInfo.type === 'lifetime') return true;
    if (!purchaseInfo.expiresAt) return true;
    return purchaseInfo.expiresAt > new Date();
  },
};
