/**
 * Entitlement Cache Tests
 *
 * Tests for localStorage-based entitlement caching, including:
 * - Save/load round-trip
 * - User ID isolation
 * - Staleness detection (7 days)
 * - Max age expiry (60 days)
 * - Subscription expiration checking
 * - Lifetime validity
 * - Corrupted JSON handling
 * - Date serialization round-trip
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { PurchaseInfo } from '@/types/entitlement';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

import { entitlementCache } from './entitlementCache';

const makePurchaseInfo = (overrides?: Partial<PurchaseInfo>): PurchaseInfo => ({
  tier: 'advanced',
  type: 'lifetime',
  purchasedAt: new Date('2025-06-01T00:00:00Z'),
  expiresAt: null,
  willRenew: false,
  productId: 'com.ascend.advanced.lifetime',
  ...overrides,
});

describe('entitlementCache', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-07-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('save and load', () => {
    it('should round-trip PurchaseInfo correctly', () => {
      const info = makePurchaseInfo();
      entitlementCache.save('user-1', info);

      const result = entitlementCache.load('user-1');

      expect(result).not.toBeNull();
      expect(result!.purchaseInfo).not.toBeNull();
      expect(result!.purchaseInfo!.tier).toBe('advanced');
      expect(result!.purchaseInfo!.type).toBe('lifetime');
      expect(result!.purchaseInfo!.purchasedAt).toEqual(new Date('2025-06-01T00:00:00Z'));
      expect(result!.purchaseInfo!.expiresAt).toBeNull();
      expect(result!.purchaseInfo!.willRenew).toBe(false);
      expect(result!.purchaseInfo!.productId).toBe('com.ascend.advanced.lifetime');
    });

    it('should save and load null purchaseInfo', () => {
      entitlementCache.save('user-1', null);

      const result = entitlementCache.load('user-1');

      expect(result).not.toBeNull();
      expect(result!.purchaseInfo).toBeNull();
    });

    it('should round-trip Date objects through serialization', () => {
      const info = makePurchaseInfo({
        type: 'subscription',
        purchasedAt: new Date('2025-03-15T10:30:00Z'),
        expiresAt: new Date('2025-12-15T10:30:00Z'),
      });

      entitlementCache.save('user-1', info);
      const result = entitlementCache.load('user-1');

      expect(result!.purchaseInfo!.purchasedAt).toBeInstanceOf(Date);
      expect(result!.purchaseInfo!.expiresAt).toBeInstanceOf(Date);
      expect(result!.purchaseInfo!.purchasedAt.toISOString()).toBe('2025-03-15T10:30:00.000Z');
      expect(result!.purchaseInfo!.expiresAt!.toISOString()).toBe('2025-12-15T10:30:00.000Z');
    });
  });

  describe('user ID isolation', () => {
    it('should return null when loading for a different user', () => {
      entitlementCache.save('user-1', makePurchaseInfo());

      const result = entitlementCache.load('user-2');

      expect(result).toBeNull();
    });

    it('should return data for the correct user', () => {
      entitlementCache.save('user-1', makePurchaseInfo());

      const result = entitlementCache.load('user-1');

      expect(result).not.toBeNull();
      expect(result!.purchaseInfo!.tier).toBe('advanced');
    });
  });

  describe('staleness detection', () => {
    it('should not be stale when freshly cached', () => {
      entitlementCache.save('user-1', makePurchaseInfo());

      const result = entitlementCache.load('user-1');

      expect(result!.isStale).toBe(false);
    });

    it('should be stale after 7 days', () => {
      entitlementCache.save('user-1', makePurchaseInfo());

      // Advance past stale threshold (7 days + 1 ms)
      vi.advanceTimersByTime(7 * 24 * 60 * 60 * 1000 + 1);

      const result = entitlementCache.load('user-1');

      expect(result).not.toBeNull();
      expect(result!.isStale).toBe(true);
    });

    it('should not be stale at exactly 6 days', () => {
      entitlementCache.save('user-1', makePurchaseInfo());

      vi.advanceTimersByTime(6 * 24 * 60 * 60 * 1000);

      const result = entitlementCache.load('user-1');

      expect(result!.isStale).toBe(false);
    });
  });

  describe('max age expiry', () => {
    it('should return null after 60 days', () => {
      entitlementCache.save('user-1', makePurchaseInfo());

      // Advance past max age (60 days + 1 ms)
      vi.advanceTimersByTime(60 * 24 * 60 * 60 * 1000 + 1);

      const result = entitlementCache.load('user-1');

      expect(result).toBeNull();
    });

    it('should return data at 59 days', () => {
      entitlementCache.save('user-1', makePurchaseInfo());

      vi.advanceTimersByTime(59 * 24 * 60 * 60 * 1000);

      const result = entitlementCache.load('user-1');

      expect(result).not.toBeNull();
      expect(result!.isStale).toBe(true); // also stale at 59 days
    });
  });

  describe('isPurchaseValid', () => {
    it('should return false for null purchaseInfo', () => {
      expect(entitlementCache.isPurchaseValid(null)).toBe(false);
    });

    it('should return true for lifetime purchases', () => {
      const info = makePurchaseInfo({ type: 'lifetime', expiresAt: null });

      expect(entitlementCache.isPurchaseValid(info)).toBe(true);
    });

    it('should return true for subscription with future expiry', () => {
      const info = makePurchaseInfo({
        type: 'subscription',
        expiresAt: new Date('2026-01-01T00:00:00Z'),
      });

      expect(entitlementCache.isPurchaseValid(info)).toBe(true);
    });

    it('should return false for subscription with past expiry', () => {
      const info = makePurchaseInfo({
        type: 'subscription',
        expiresAt: new Date('2025-01-01T00:00:00Z'),
      });

      expect(entitlementCache.isPurchaseValid(info)).toBe(false);
    });

    it('should return true for subscription with no expiresAt', () => {
      const info = makePurchaseInfo({
        type: 'subscription',
        expiresAt: null,
      });

      expect(entitlementCache.isPurchaseValid(info)).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove cached data', () => {
      entitlementCache.save('user-1', makePurchaseInfo());

      entitlementCache.clear();

      const result = entitlementCache.load('user-1');
      expect(result).toBeNull();
    });
  });

  describe('corrupted data handling', () => {
    it('should return null for corrupted JSON', () => {
      localStorageMock.setItem('ascend_entitlement_cache', '{invalid json');

      const result = entitlementCache.load('user-1');

      expect(result).toBeNull();
    });

    it('should return null for invalid cachedAt date', () => {
      const corrupted = JSON.stringify({
        userId: 'user-1',
        purchaseInfo: null,
        cachedAt: 'not-a-date',
      });
      localStorageMock.setItem('ascend_entitlement_cache', corrupted);

      const result = entitlementCache.load('user-1');

      expect(result).toBeNull();
    });
  });
});
