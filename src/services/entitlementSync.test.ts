/**
 * Entitlement Sync Tests
 *
 * Tests for the Supabase sync + cache fallback coordinator, including:
 * - Online: Supabase has data, caches and returns
 * - Online: Supabase empty, caches null
 * - Online: Supabase error, falls back to cache
 * - Offline: returns cached data
 * - Offline: no cache, returns null
 * - syncToSupabase: caches immediately, upserts when online
 * - syncToSupabase: skips Supabase when offline
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { PurchaseInfo } from '@/types/entitlement';

// Mock Supabase
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockUpsert = vi.fn();

vi.mock('@/data/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      upsert: mockUpsert,
    })),
  },
}));

// Mock entitlementCache
vi.mock('./entitlementCache', () => ({
  entitlementCache: {
    save: vi.fn(),
    load: vi.fn(),
    clear: vi.fn(),
    isPurchaseValid: vi.fn(),
  },
}));

import { entitlementSync } from './entitlementSync';
import { entitlementCache } from './entitlementCache';

const mockPurchaseInfo: PurchaseInfo = {
  tier: 'advanced',
  type: 'lifetime',
  purchasedAt: new Date('2025-06-01T00:00:00Z'),
  expiresAt: null,
  willRenew: false,
  productId: 'com.ascend.advanced.lifetime',
};

const mockRemoteEntitlement = {
  user_id: 'user-1',
  tier: 'advanced' as const,
  purchase_type: 'lifetime' as const,
  purchased_at: '2025-06-01T00:00:00.000Z',
  expires_at: null,
  will_renew: false,
  product_id: 'com.ascend.advanced.lifetime',
  updated_at: '2025-07-01T00:00:00.000Z',
};

describe('entitlementSync', () => {
  let originalOnLine: boolean;

  beforeEach(() => {
    vi.clearAllMocks();
    originalOnLine = navigator.onLine;
    vi.mocked(entitlementCache.isPurchaseValid).mockReturnValue(true);
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true,
      configurable: true,
    });
  });

  function setOnline(online: boolean) {
    Object.defineProperty(navigator, 'onLine', {
      value: online,
      writable: true,
      configurable: true,
    });
  }

  describe('getEntitlement', () => {
    it('should return entitlement from Supabase when online', async () => {
      setOnline(true);
      mockSingle.mockResolvedValue({ data: mockRemoteEntitlement, error: null });

      const result = await entitlementSync.getEntitlement('user-1');

      expect(result).not.toBeNull();
      expect(result!.tier).toBe('advanced');
      expect(result!.type).toBe('lifetime');
      expect(result!.purchasedAt).toEqual(new Date('2025-06-01T00:00:00.000Z'));
      expect(result!.expiresAt).toBeNull();
      expect(entitlementCache.save).toHaveBeenCalled();
    });

    it('should return null when Supabase has no rows', async () => {
      setOnline(true);
      mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const result = await entitlementSync.getEntitlement('user-1');

      expect(result).toBeNull();
      expect(entitlementCache.save).toHaveBeenCalledWith('user-1', null);
    });

    it('should fall back to cache on Supabase error', async () => {
      setOnline(true);
      mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST500', message: 'error' } });
      vi.mocked(entitlementCache.load).mockReturnValue({
        purchaseInfo: mockPurchaseInfo,
        isStale: false,
        cachedAt: new Date(),
      });

      const result = await entitlementSync.getEntitlement('user-1');

      expect(result).not.toBeNull();
      expect(result!.tier).toBe('advanced');
    });

    it('should return cached data when offline', async () => {
      setOnline(false);
      vi.mocked(entitlementCache.load).mockReturnValue({
        purchaseInfo: mockPurchaseInfo,
        isStale: false,
        cachedAt: new Date(),
      });

      const result = await entitlementSync.getEntitlement('user-1');

      expect(result).not.toBeNull();
      expect(result!.tier).toBe('advanced');
      // Should not have called Supabase
      expect(mockSelect).not.toHaveBeenCalled();
    });

    it('should return null when offline and no cache', async () => {
      setOnline(false);
      vi.mocked(entitlementCache.load).mockReturnValue(null);

      const result = await entitlementSync.getEntitlement('user-1');

      expect(result).toBeNull();
    });

    it('should return null when offline and cached purchase is invalid', async () => {
      setOnline(false);
      vi.mocked(entitlementCache.load).mockReturnValue({
        purchaseInfo: mockPurchaseInfo,
        isStale: false,
        cachedAt: new Date(),
      });
      vi.mocked(entitlementCache.isPurchaseValid).mockReturnValue(false);

      const result = await entitlementSync.getEntitlement('user-1');

      expect(result).toBeNull();
    });

    it('should return null when online Supabase data has invalid purchase', async () => {
      setOnline(true);
      mockSingle.mockResolvedValue({ data: mockRemoteEntitlement, error: null });
      vi.mocked(entitlementCache.isPurchaseValid).mockReturnValue(false);

      const result = await entitlementSync.getEntitlement('user-1');

      expect(result).toBeNull();
      // Should still have cached the data
      expect(entitlementCache.save).toHaveBeenCalled();
    });
  });

  describe('syncToSupabase', () => {
    it('should cache locally immediately', async () => {
      setOnline(true);
      mockUpsert.mockResolvedValue({ error: null });

      await entitlementSync.syncToSupabase('user-1', mockPurchaseInfo);

      expect(entitlementCache.save).toHaveBeenCalledWith('user-1', mockPurchaseInfo);
    });

    it('should upsert to Supabase when online', async () => {
      setOnline(true);
      mockUpsert.mockResolvedValue({ error: null });

      await entitlementSync.syncToSupabase('user-1', mockPurchaseInfo);

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          tier: 'advanced',
          purchase_type: 'lifetime',
        }),
        { onConflict: 'user_id' }
      );
    });

    it('should skip Supabase when offline', async () => {
      setOnline(false);

      await entitlementSync.syncToSupabase('user-1', mockPurchaseInfo);

      // Should still cache locally
      expect(entitlementCache.save).toHaveBeenCalledWith('user-1', mockPurchaseInfo);
      // Should not call Supabase
      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it('should not throw on Supabase upsert error', async () => {
      setOnline(true);
      mockUpsert.mockResolvedValue({ error: { message: 'upsert failed' } });

      // Should not throw
      await expect(
        entitlementSync.syncToSupabase('user-1', mockPurchaseInfo)
      ).resolves.not.toThrow();

      // Should still have cached locally
      expect(entitlementCache.save).toHaveBeenCalled();
    });
  });

  describe('refreshFromSupabase', () => {
    it('should return null when offline', async () => {
      setOnline(false);

      const result = await entitlementSync.refreshFromSupabase('user-1');

      expect(result).toBeNull();
    });

    it('should fetch and cache from Supabase when online', async () => {
      setOnline(true);
      mockSingle.mockResolvedValue({ data: mockRemoteEntitlement, error: null });

      const result = await entitlementSync.refreshFromSupabase('user-1');

      expect(result).not.toBeNull();
      expect(result!.tier).toBe('advanced');
      expect(entitlementCache.save).toHaveBeenCalled();
    });

    it('should return null and cache null when no Supabase row exists', async () => {
      setOnline(true);
      mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const result = await entitlementSync.refreshFromSupabase('user-1');

      expect(result).toBeNull();
      expect(entitlementCache.save).toHaveBeenCalledWith('user-1', null);
    });
  });
});
