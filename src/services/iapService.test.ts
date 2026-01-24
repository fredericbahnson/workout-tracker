/**
 * iapService Tests
 *
 * Tests for In-App Purchase service with mocked Capacitor and RevenueCat.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Capacitor before importing iapService
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
  },
}));

// Mock RevenueCat SDK
const mockPurchases = {
  configure: vi.fn(),
  getCustomerInfo: vi.fn(),
  getOfferings: vi.fn(),
  purchasePackage: vi.fn(),
  restorePurchases: vi.fn(),
  logIn: vi.fn(),
  logOut: vi.fn(),
};

vi.mock('@revenuecat/purchases-capacitor', () => ({
  Purchases: mockPurchases,
}));

import { Capacitor } from '@capacitor/core';

describe('IAPService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('on web platform', () => {
    beforeEach(() => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    });

    it('should skip initialization on web', async () => {
      // Re-import to get fresh instance with web platform
      vi.resetModules();
      vi.doMock('@capacitor/core', () => ({
        Capacitor: {
          isNativePlatform: () => false,
        },
      }));

      const { iapService } = await import('./iapService');

      await iapService.initialize();

      expect(iapService.isAvailable()).toBe(false);
    });

    it('should return null for getPurchaseInfo on web', async () => {
      vi.resetModules();
      vi.doMock('@capacitor/core', () => ({
        Capacitor: {
          isNativePlatform: () => false,
        },
      }));

      const { iapService } = await import('./iapService');

      const result = await iapService.getPurchaseInfo();

      expect(result).toBeNull();
    });

    it('should return null for getOfferings on web', async () => {
      vi.resetModules();
      vi.doMock('@capacitor/core', () => ({
        Capacitor: {
          isNativePlatform: () => false,
        },
      }));

      const { iapService } = await import('./iapService');

      const result = await iapService.getOfferings();

      expect(result).toBeNull();
    });

    it('should throw error when attempting purchase on web', async () => {
      vi.resetModules();
      vi.doMock('@capacitor/core', () => ({
        Capacitor: {
          isNativePlatform: () => false,
        },
      }));

      const { iapService } = await import('./iapService');

      await expect(iapService.purchase('advanced')).rejects.toThrow('IAP not available');
    });

    it('should throw error when attempting restore on web', async () => {
      vi.resetModules();
      vi.doMock('@capacitor/core', () => ({
        Capacitor: {
          isNativePlatform: () => false,
        },
      }));

      const { iapService } = await import('./iapService');

      await expect(iapService.restorePurchases()).rejects.toThrow('IAP not available');
    });
  });

  describe('on native platform', () => {
    beforeEach(() => {
      vi.resetModules();
      vi.doMock('@capacitor/core', () => ({
        Capacitor: {
          isNativePlatform: () => true,
        },
      }));
    });

    it('should initialize RevenueCat on native', async () => {
      const mockConfigure = vi.fn().mockResolvedValue(undefined);
      vi.doMock('@revenuecat/purchases-capacitor', () => ({
        Purchases: {
          configure: mockConfigure,
        },
      }));

      const { iapService } = await import('./iapService');

      await iapService.initialize();

      expect(mockConfigure).toHaveBeenCalled();
      expect(iapService.isAvailable()).toBe(true);
    });

    it('should not reinitialize if already initialized', async () => {
      const mockConfigure = vi.fn().mockResolvedValue(undefined);
      vi.doMock('@revenuecat/purchases-capacitor', () => ({
        Purchases: {
          configure: mockConfigure,
        },
      }));

      const { iapService } = await import('./iapService');

      await iapService.initialize();
      await iapService.initialize();

      expect(mockConfigure).toHaveBeenCalledTimes(1);
    });

    it('should return purchase info for active entitlement', async () => {
      const mockCustomerInfo = {
        entitlements: {
          active: {
            advanced: {
              latestPurchaseDate: '2024-01-01T00:00:00Z',
              expirationDate: '2025-01-01T00:00:00Z',
              willRenew: true,
              productIdentifier: 'com.ascend.advanced.monthly',
            },
          },
        },
      };

      const mockConfigure = vi.fn().mockResolvedValue(undefined);
      const mockGetCustomerInfo = vi.fn().mockResolvedValue({ customerInfo: mockCustomerInfo });

      vi.doMock('@revenuecat/purchases-capacitor', () => ({
        Purchases: {
          configure: mockConfigure,
          getCustomerInfo: mockGetCustomerInfo,
        },
      }));

      const { iapService } = await import('./iapService');

      await iapService.initialize();
      const result = await iapService.getPurchaseInfo();

      expect(result).not.toBeNull();
      expect(result?.tier).toBe('advanced');
      expect(result?.type).toBe('subscription');
      expect(result?.willRenew).toBe(true);
    });

    it('should return null for no active entitlements', async () => {
      const mockCustomerInfo = {
        entitlements: {
          active: {},
        },
      };

      const mockConfigure = vi.fn().mockResolvedValue(undefined);
      const mockGetCustomerInfo = vi.fn().mockResolvedValue({ customerInfo: mockCustomerInfo });

      vi.doMock('@revenuecat/purchases-capacitor', () => ({
        Purchases: {
          configure: mockConfigure,
          getCustomerInfo: mockGetCustomerInfo,
        },
      }));

      const { iapService } = await import('./iapService');

      await iapService.initialize();
      const result = await iapService.getPurchaseInfo();

      expect(result).toBeNull();
    });

    it('should return offerings', async () => {
      const mockOfferings = {
        current: {
          identifier: 'default',
          availablePackages: [
            {
              identifier: 'advanced',
              product: {
                identifier: 'com.ascend.advanced',
                priceString: '$9.99',
                title: 'Advanced',
                description: 'Full access',
              },
            },
          ],
        },
        all: {},
      };

      const mockConfigure = vi.fn().mockResolvedValue(undefined);
      const mockGetOfferings = vi.fn().mockResolvedValue(mockOfferings);

      vi.doMock('@revenuecat/purchases-capacitor', () => ({
        Purchases: {
          configure: mockConfigure,
          getOfferings: mockGetOfferings,
        },
      }));

      const { iapService } = await import('./iapService');

      await iapService.initialize();
      const result = await iapService.getOfferings();

      expect(result).not.toBeNull();
      expect(result?.length).toBe(1);
      expect(result?.[0].packages[0].identifier).toBe('advanced');
      expect(result?.[0].packages[0].priceString).toBe('$9.99');
    });

    it('should handle purchase flow', async () => {
      const mockCustomerInfo = {
        entitlements: {
          active: {
            advanced: {
              latestPurchaseDate: '2024-01-01T00:00:00Z',
              expirationDate: null,
              willRenew: false,
              productIdentifier: 'com.ascend.advanced.lifetime',
            },
          },
        },
      };

      const mockOfferings = {
        current: {
          identifier: 'default',
          availablePackages: [
            {
              identifier: 'advanced',
              product: {
                identifier: 'com.ascend.advanced.lifetime',
                priceString: '$49.99',
                title: 'Advanced Lifetime',
                description: 'One-time purchase',
              },
            },
          ],
        },
        all: {},
      };

      const mockConfigure = vi.fn().mockResolvedValue(undefined);
      const mockGetOfferings = vi.fn().mockResolvedValue(mockOfferings);
      const mockPurchasePackage = vi.fn().mockResolvedValue({ customerInfo: mockCustomerInfo });

      vi.doMock('@revenuecat/purchases-capacitor', () => ({
        Purchases: {
          configure: mockConfigure,
          getOfferings: mockGetOfferings,
          purchasePackage: mockPurchasePackage,
        },
      }));

      const { iapService } = await import('./iapService');

      await iapService.initialize();
      const result = await iapService.purchase('advanced');

      expect(mockPurchasePackage).toHaveBeenCalled();
      expect(result?.tier).toBe('advanced');
      expect(result?.type).toBe('lifetime');
    });

    it('should throw error for non-existent package', async () => {
      const mockOfferings = {
        current: {
          identifier: 'default',
          availablePackages: [],
        },
        all: {},
      };

      const mockConfigure = vi.fn().mockResolvedValue(undefined);
      const mockGetOfferings = vi.fn().mockResolvedValue(mockOfferings);

      vi.doMock('@revenuecat/purchases-capacitor', () => ({
        Purchases: {
          configure: mockConfigure,
          getOfferings: mockGetOfferings,
        },
      }));

      const { iapService } = await import('./iapService');

      await iapService.initialize();

      await expect(iapService.purchase('nonexistent')).rejects.toThrow(
        'Package not found: nonexistent'
      );
    });

    it('should handle restore purchases', async () => {
      const mockCustomerInfo = {
        entitlements: {
          active: {
            standard: {
              latestPurchaseDate: '2024-01-01T00:00:00Z',
              expirationDate: null,
              willRenew: false,
              productIdentifier: 'com.ascend.standard',
            },
          },
        },
      };

      const mockConfigure = vi.fn().mockResolvedValue(undefined);
      const mockRestorePurchases = vi.fn().mockResolvedValue({ customerInfo: mockCustomerInfo });

      vi.doMock('@revenuecat/purchases-capacitor', () => ({
        Purchases: {
          configure: mockConfigure,
          restorePurchases: mockRestorePurchases,
        },
      }));

      const { iapService } = await import('./iapService');

      await iapService.initialize();
      const result = await iapService.restorePurchases();

      expect(mockRestorePurchases).toHaveBeenCalled();
      expect(result?.tier).toBe('standard');
    });

    it('should set user ID', async () => {
      const mockConfigure = vi.fn().mockResolvedValue(undefined);
      const mockLogIn = vi.fn().mockResolvedValue({});

      vi.doMock('@revenuecat/purchases-capacitor', () => ({
        Purchases: {
          configure: mockConfigure,
          logIn: mockLogIn,
        },
      }));

      const { iapService } = await import('./iapService');

      await iapService.initialize();
      await iapService.setUserId('user-123');

      expect(mockLogIn).toHaveBeenCalledWith({ appUserID: 'user-123' });
    });

    it('should clear user ID', async () => {
      const mockConfigure = vi.fn().mockResolvedValue(undefined);
      const mockLogOut = vi.fn().mockResolvedValue({});

      vi.doMock('@revenuecat/purchases-capacitor', () => ({
        Purchases: {
          configure: mockConfigure,
          logOut: mockLogOut,
        },
      }));

      const { iapService } = await import('./iapService');

      await iapService.initialize();
      await iapService.clearUserId();

      expect(mockLogOut).toHaveBeenCalled();
    });

    it('should handle initialization error', async () => {
      const mockConfigure = vi.fn().mockRejectedValue(new Error('SDK error'));

      vi.doMock('@revenuecat/purchases-capacitor', () => ({
        Purchases: {
          configure: mockConfigure,
        },
      }));

      const { iapService } = await import('./iapService');

      await expect(iapService.initialize()).rejects.toThrow('SDK error');
      expect(iapService.isAvailable()).toBe(false);
    });
  });
});
