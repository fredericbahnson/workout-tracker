/**
 * Entitlement Service Integration Tests
 *
 * Tests the trial and entitlement system behavior including:
 * - Trial activation and expiration
 * - Access level determination
 * - Feature gating logic
 * - Lock reason messaging
 * - userId parameter for web platform entitlement lookup
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { entitlementService } from './entitlementService';
import { trialService } from './trialService';
import { TRIAL_CONFIG } from '@/types/entitlement';

// Mock entitlementSync for userId-aware tests
const mockGetEntitlement = vi.fn();

vi.mock('./entitlementSync', () => ({
  entitlementSync: {
    getEntitlement: (...args: unknown[]) => mockGetEntitlement(...args),
    syncToSupabase: vi.fn().mockResolvedValue(undefined),
    refreshFromSupabase: vi.fn().mockResolvedValue(null),
  },
}));

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

describe('Trial Service', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('startTrialIfNeeded', () => {
    it('should start trial on first call', () => {
      const status = trialService.startTrialIfNeeded();

      expect(status.isActive).toBe(true);
      expect(status.hasExpired).toBe(false);
      expect(status.startedAt).toBeInstanceOf(Date);
      expect(status.expiresAt).toBeInstanceOf(Date);
      expect(status.daysRemaining).toBe(TRIAL_CONFIG.DURATION_DAYS);
    });

    it('should not restart trial on subsequent calls', () => {
      const firstStatus = trialService.startTrialIfNeeded();
      const firstStartDate = firstStatus.startedAt!.toISOString();

      // Advance time by 1 day
      vi.advanceTimersByTime(24 * 60 * 60 * 1000);

      const secondStatus = trialService.startTrialIfNeeded();

      expect(secondStatus.startedAt!.toISOString()).toBe(firstStartDate);
      expect(secondStatus.daysRemaining).toBe(TRIAL_CONFIG.DURATION_DAYS - 1);
    });

    it('should persist trial start date in localStorage', () => {
      trialService.startTrialIfNeeded();

      const stored = localStorageMock.getItem(TRIAL_CONFIG.STORAGE_KEY);
      expect(stored).toBeTruthy();
      expect(() => new Date(stored!)).not.toThrow();
    });
  });

  describe('getTrialStatus', () => {
    it('should return inactive status when trial not started', () => {
      const status = trialService.getTrialStatus();

      expect(status.isActive).toBe(false);
      expect(status.hasExpired).toBe(false);
      expect(status.startedAt).toBeNull();
      expect(status.expiresAt).toBeNull();
      expect(status.daysRemaining).toBe(0);
    });

    it('should return active status during trial period', () => {
      trialService.startTrialIfNeeded();

      // Advance time by half the trial period
      const halfTrialMs = (TRIAL_CONFIG.DURATION_DAYS / 2) * 24 * 60 * 60 * 1000;
      vi.advanceTimersByTime(halfTrialMs);

      const status = trialService.getTrialStatus();

      expect(status.isActive).toBe(true);
      expect(status.hasExpired).toBe(false);
      expect(status.daysRemaining).toBeGreaterThan(0);
      expect(status.daysRemaining).toBeLessThan(TRIAL_CONFIG.DURATION_DAYS);
    });

    it('should return expired status after trial period', () => {
      trialService.startTrialIfNeeded();

      // Advance time past trial duration
      const pastTrialMs = (TRIAL_CONFIG.DURATION_DAYS + 1) * 24 * 60 * 60 * 1000;
      vi.advanceTimersByTime(pastTrialMs);

      const status = trialService.getTrialStatus();

      expect(status.isActive).toBe(false);
      expect(status.hasExpired).toBe(true);
      expect(status.daysRemaining).toBe(0);
    });

    it('should calculate days remaining correctly', () => {
      const startTime = Date.now();
      trialService.startTrialIfNeeded();

      // Test at various points during trial
      const testPoints = [0, 7, 14, 21, 27];

      for (const days of testPoints) {
        vi.setSystemTime(new Date(startTime + days * 24 * 60 * 60 * 1000));
        const status = trialService.getTrialStatus();
        expect(status.daysRemaining).toBe(TRIAL_CONFIG.DURATION_DAYS - days);
      }
    });
  });

  describe('isInTrial', () => {
    it('should return false when trial not started', () => {
      expect(trialService.isInTrial()).toBe(false);
    });

    it('should return true during active trial', () => {
      trialService.startTrialIfNeeded();
      expect(trialService.isInTrial()).toBe(true);
    });

    it('should return false after trial expires', () => {
      trialService.startTrialIfNeeded();
      vi.advanceTimersByTime((TRIAL_CONFIG.DURATION_DAYS + 1) * 24 * 60 * 60 * 1000);
      expect(trialService.isInTrial()).toBe(false);
    });
  });

  describe('hasTrialExpired', () => {
    it('should return false when trial not started', () => {
      expect(trialService.hasTrialExpired()).toBe(false);
    });

    it('should return false during active trial', () => {
      trialService.startTrialIfNeeded();
      expect(trialService.hasTrialExpired()).toBe(false);
    });

    it('should return true after trial expires', () => {
      trialService.startTrialIfNeeded();
      vi.advanceTimersByTime((TRIAL_CONFIG.DURATION_DAYS + 1) * 24 * 60 * 60 * 1000);
      expect(trialService.hasTrialExpired()).toBe(true);
    });
  });
});

describe('Entitlement Service', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialize', () => {
    it('should start trial on first initialization', async () => {
      const status = await entitlementService.initialize();

      expect(status.trial.isActive).toBe(true);
      expect(status.effectiveLevel).toBe('advanced'); // Trial gives advanced access
    });

    it('should return current status on subsequent initializations', async () => {
      await entitlementService.initialize();

      // Advance time by 10 days
      vi.advanceTimersByTime(10 * 24 * 60 * 60 * 1000);

      const status = await entitlementService.initialize();

      expect(status.trial.isActive).toBe(true);
      expect(status.trial.daysRemaining).toBe(TRIAL_CONFIG.DURATION_DAYS - 10);
    });
  });

  describe('getEntitlementStatus', () => {
    it('should grant advanced access during active trial', async () => {
      trialService.startTrialIfNeeded();

      const status = await entitlementService.getEntitlementStatus();

      expect(status.effectiveLevel).toBe('advanced');
      expect(status.canAccessStandard).toBe(true);
      expect(status.canAccessAdvanced).toBe(true);
    });

    it('should deny access after trial expires (no purchase)', async () => {
      trialService.startTrialIfNeeded();
      vi.advanceTimersByTime((TRIAL_CONFIG.DURATION_DAYS + 1) * 24 * 60 * 60 * 1000);

      const status = await entitlementService.getEntitlementStatus();

      expect(status.effectiveLevel).toBe('none');
      expect(status.canAccessStandard).toBe(false);
      expect(status.canAccessAdvanced).toBe(false);
      expect(status.trial.hasExpired).toBe(true);
    });

    it('should report non-native platform for web', async () => {
      const status = await entitlementService.getEntitlementStatus();

      expect(status.isNativePlatform).toBe(false);
    });

    it('should not be loading after status is retrieved', async () => {
      const status = await entitlementService.getEntitlementStatus();

      expect(status.isLoading).toBe(false);
    });
  });

  describe('checkAccess', () => {
    describe('with active trial', () => {
      beforeEach(() => {
        trialService.startTrialIfNeeded();
      });

      it('should allow access to none tier', async () => {
        const result = await entitlementService.checkAccess('none');

        expect(result.isLocked).toBe(false);
        expect(result.reason).toBeNull();
      });

      it('should allow access to standard tier', async () => {
        const result = await entitlementService.checkAccess('standard');

        expect(result.isLocked).toBe(false);
        expect(result.reason).toBeNull();
      });

      it('should allow access to advanced tier', async () => {
        const result = await entitlementService.checkAccess('advanced');

        expect(result.isLocked).toBe(false);
        expect(result.reason).toBeNull();
      });
    });

    describe('with expired trial (no purchase)', () => {
      beforeEach(() => {
        trialService.startTrialIfNeeded();
        vi.advanceTimersByTime((TRIAL_CONFIG.DURATION_DAYS + 1) * 24 * 60 * 60 * 1000);
      });

      it('should allow access to none tier', async () => {
        const result = await entitlementService.checkAccess('none');

        expect(result.isLocked).toBe(false);
      });

      it('should lock standard tier with trial_expired reason', async () => {
        const result = await entitlementService.checkAccess('standard');

        expect(result.isLocked).toBe(true);
        expect(result.reason).toBe('trial_expired');
        expect(result.requiredTier).toBe('standard');
      });

      it('should lock advanced tier with trial_expired reason', async () => {
        const result = await entitlementService.checkAccess('advanced');

        expect(result.isLocked).toBe(true);
        expect(result.reason).toBe('trial_expired');
        expect(result.requiredTier).toBe('advanced');
      });
    });

    describe('without trial started', () => {
      it('should lock standard tier with not_purchased reason', async () => {
        const result = await entitlementService.checkAccess('standard');

        expect(result.isLocked).toBe(true);
        expect(result.reason).toBe('not_purchased');
      });

      it('should lock advanced tier with not_purchased reason', async () => {
        const result = await entitlementService.checkAccess('advanced');

        expect(result.isLocked).toBe(true);
        expect(result.reason).toBe('not_purchased');
      });
    });
  });

  describe('isAdvancedLocked', () => {
    it('should return false during active trial', async () => {
      trialService.startTrialIfNeeded();

      const isLocked = await entitlementService.isAdvancedLocked();

      expect(isLocked).toBe(false);
    });

    it('should return true after trial expires', async () => {
      trialService.startTrialIfNeeded();
      vi.advanceTimersByTime((TRIAL_CONFIG.DURATION_DAYS + 1) * 24 * 60 * 60 * 1000);

      const isLocked = await entitlementService.isAdvancedLocked();

      expect(isLocked).toBe(true);
    });

    it('should return true when trial never started', async () => {
      const isLocked = await entitlementService.isAdvancedLocked();

      expect(isLocked).toBe(true);
    });
  });

  describe('getLockMessage', () => {
    it('should return correct message for trial_expired', () => {
      const message = entitlementService.getLockMessage('trial_expired');

      expect(message).toContain('trial has ended');
    });

    it('should return correct message for standard_only', () => {
      const message = entitlementService.getLockMessage('standard_only');

      expect(message).toContain('Advanced');
      expect(message).toContain('Upgrade');
    });

    it('should return correct message for not_purchased', () => {
      const message = entitlementService.getLockMessage('not_purchased');

      expect(message).toContain('trial');
    });
  });

  describe('getUpgradeCtaText', () => {
    it('should return "View Plans" for trial_expired', () => {
      const cta = entitlementService.getUpgradeCtaText('trial_expired');

      expect(cta).toBe('View Plans');
    });

    it('should return "Upgrade to Advanced" for standard_only', () => {
      const cta = entitlementService.getUpgradeCtaText('standard_only');

      expect(cta).toBe('Upgrade to Advanced');
    });

    it('should return "Start Free Trial" for not_purchased', () => {
      const cta = entitlementService.getUpgradeCtaText('not_purchased');

      expect(cta).toBe('Start Free Trial');
    });
  });
});

describe('Trial and Entitlement Integration', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should provide full access flow during trial lifecycle', async () => {
    // Day 0: Initialize - trial starts
    const initialStatus = await entitlementService.initialize();
    expect(initialStatus.effectiveLevel).toBe('advanced');
    expect(initialStatus.canAccessAdvanced).toBe(true);
    expect(initialStatus.trial.daysRemaining).toBe(TRIAL_CONFIG.DURATION_DAYS);

    // Day 14: Mid-trial
    vi.advanceTimersByTime(14 * 24 * 60 * 60 * 1000);
    const midStatus = await entitlementService.getEntitlementStatus();
    expect(midStatus.effectiveLevel).toBe('advanced');
    expect(midStatus.canAccessAdvanced).toBe(true);
    expect(midStatus.trial.daysRemaining).toBe(TRIAL_CONFIG.DURATION_DAYS - 14);

    // Day 27: Near end of trial (still active)
    vi.advanceTimersByTime(13 * 24 * 60 * 60 * 1000);
    const nearEndStatus = await entitlementService.getEntitlementStatus();
    expect(nearEndStatus.trial.isActive).toBe(true);
    expect(nearEndStatus.trial.daysRemaining).toBe(1);

    // Day 28+: Trial expired (after full duration)
    vi.advanceTimersByTime(2 * 24 * 60 * 60 * 1000);
    const expiredStatus = await entitlementService.getEntitlementStatus();
    expect(expiredStatus.effectiveLevel).toBe('none');
    expect(expiredStatus.canAccessAdvanced).toBe(false);
    expect(expiredStatus.canAccessStandard).toBe(false);
    expect(expiredStatus.trial.hasExpired).toBe(true);

    // Check feature locking after expiration
    const advancedAccess = await entitlementService.checkAccess('advanced');
    expect(advancedAccess.isLocked).toBe(true);
    expect(advancedAccess.reason).toBe('trial_expired');
  });

  it('should maintain trial state across multiple getEntitlementStatus calls', async () => {
    await entitlementService.initialize();

    // Call getEntitlementStatus multiple times
    const status1 = await entitlementService.getEntitlementStatus();
    const status2 = await entitlementService.getEntitlementStatus();
    const status3 = await entitlementService.getEntitlementStatus();

    // All should return consistent results
    expect(status1.trial.startedAt!.toISOString()).toBe(status2.trial.startedAt!.toISOString());
    expect(status2.trial.startedAt!.toISOString()).toBe(status3.trial.startedAt!.toISOString());
    expect(status1.effectiveLevel).toBe(status2.effectiveLevel);
    expect(status2.effectiveLevel).toBe(status3.effectiveLevel);
  });
});

describe('Entitlement Service - userId Web Platform Support', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.useFakeTimers();
    mockGetEntitlement.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return entitlement from sync when userId is provided on web', async () => {
    // Expire trial so only purchase provides access
    trialService.startTrialIfNeeded();
    vi.advanceTimersByTime((TRIAL_CONFIG.DURATION_DAYS + 1) * 24 * 60 * 60 * 1000);

    mockGetEntitlement.mockResolvedValue({
      tier: 'advanced',
      type: 'lifetime',
      purchasedAt: new Date('2025-06-01T00:00:00Z'),
      expiresAt: null,
      willRenew: false,
      productId: 'com.ascend.advanced.lifetime',
    });

    const status = await entitlementService.getEntitlementStatus(undefined, 'user-123');

    expect(mockGetEntitlement).toHaveBeenCalledWith('user-123');
    expect(status.purchase).not.toBeNull();
    expect(status.purchase!.tier).toBe('advanced');
    expect(status.effectiveLevel).toBe('advanced');
    expect(status.canAccessAdvanced).toBe(true);
  });

  it('should return null purchase when no userId is provided on web', async () => {
    // Expire trial
    trialService.startTrialIfNeeded();
    vi.advanceTimersByTime((TRIAL_CONFIG.DURATION_DAYS + 1) * 24 * 60 * 60 * 1000);

    const status = await entitlementService.getEntitlementStatus();

    // Without userId, web gets no purchase info
    expect(status.purchase).toBeNull();
    expect(status.effectiveLevel).toBe('none');
  });

  it('should pass userId through initialize', async () => {
    mockGetEntitlement.mockResolvedValue(null);

    await entitlementService.initialize('user-456');

    // initialize calls getEntitlementStatus internally, which calls getPurchaseInfo(userId)
    // On web (non-native), this delegates to entitlementSync.getEntitlement
    expect(mockGetEntitlement).toHaveBeenCalledWith('user-456');
  });

  it('should grant standard access when user has standard purchase via sync', async () => {
    // Expire trial
    trialService.startTrialIfNeeded();
    vi.advanceTimersByTime((TRIAL_CONFIG.DURATION_DAYS + 1) * 24 * 60 * 60 * 1000);

    mockGetEntitlement.mockResolvedValue({
      tier: 'standard',
      type: 'lifetime',
      purchasedAt: new Date('2025-06-01T00:00:00Z'),
      expiresAt: null,
      willRenew: false,
    });

    const status = await entitlementService.getEntitlementStatus(undefined, 'user-std');

    expect(status.purchase!.tier).toBe('standard');
    expect(status.effectiveLevel).toBe('standard');
    expect(status.canAccessStandard).toBe(true);
    expect(status.canAccessAdvanced).toBe(false);
  });
});
