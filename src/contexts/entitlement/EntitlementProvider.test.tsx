/**
 * EntitlementProvider Tests
 *
 * Tests for the entitlement context provider including
 * paywall trigger logic and feature gating.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { EntitlementProvider } from './EntitlementProvider';
import { useEntitlement } from './useEntitlement';
import type { EntitlementStatus, TrialStatus, PurchaseInfo } from '@/types/entitlement';

// Mock entitlementService
const mockInitialize = vi.fn();
const mockGetEntitlementStatus = vi.fn();

vi.mock('@/services/entitlementService', () => ({
  entitlementService: {
    initialize: () => mockInitialize(),
    getEntitlementStatus: () => mockGetEntitlementStatus(),
  },
}));

// Mock trialService
const mockGetTrialStatus = vi.fn();

vi.mock('@/services/trialService', () => ({
  trialService: {
    getTrialStatus: () => mockGetTrialStatus(),
  },
}));

// Test component that uses the hook
function TestConsumer({
  onMount,
}: {
  onMount?: (value: ReturnType<typeof useEntitlement>) => void;
}) {
  const entitlement = useEntitlement();

  if (onMount) {
    onMount(entitlement);
  }

  return (
    <div>
      <span data-testid="loading">{String(entitlement.isLoading)}</span>
      <span data-testid="effective-level">{entitlement.effectiveLevel}</span>
      <span data-testid="can-access-standard">{String(entitlement.canAccessStandard)}</span>
      <span data-testid="can-access-advanced">{String(entitlement.canAccessAdvanced)}</span>
      <span data-testid="trial-active">{String(entitlement.trial.isActive)}</span>
      <span data-testid="paywall-open">{String(entitlement.paywall.isOpen)}</span>
      <button onClick={() => entitlement.showPaywall('advanced', 'trial_expired')}>
        Show Paywall
      </button>
      <button onClick={() => entitlement.closePaywall()}>Close Paywall</button>
      <button onClick={() => entitlement.refreshEntitlement()}>Refresh</button>
    </div>
  );
}

describe('EntitlementProvider', () => {
  const activeTrialStatus: TrialStatus = {
    isActive: true,
    startedAt: new Date(),
    expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    daysRemaining: 28,
    hasExpired: false,
  };

  const expiredTrialStatus: TrialStatus = {
    isActive: false,
    startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    daysRemaining: 0,
    hasExpired: true,
  };

  const defaultEntitlementStatus: EntitlementStatus = {
    trial: activeTrialStatus,
    purchase: null,
    effectiveLevel: 'advanced',
    canAccessStandard: true,
    canAccessAdvanced: true,
    isNativePlatform: false,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockInitialize.mockResolvedValue(defaultEntitlementStatus);
    mockGetTrialStatus.mockReturnValue(activeTrialStatus);
  });

  describe('initialization', () => {
    it('should initialize entitlement on mount', async () => {
      render(
        <EntitlementProvider>
          <TestConsumer />
        </EntitlementProvider>
      );

      await waitFor(() => {
        expect(mockInitialize).toHaveBeenCalled();
      });
    });

    it('should set loading state initially', () => {
      // Delay the initialization
      mockInitialize.mockImplementation(() => new Promise(() => {}));

      render(
        <EntitlementProvider>
          <TestConsumer />
        </EntitlementProvider>
      );

      expect(screen.getByTestId('loading').textContent).toBe('true');
    });

    it('should set loading to false after initialization', async () => {
      render(
        <EntitlementProvider>
          <TestConsumer />
        </EntitlementProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
    });

    it('should fall back to trial status on initialization error', async () => {
      mockInitialize.mockRejectedValue(new Error('Init failed'));
      mockGetTrialStatus.mockReturnValue(activeTrialStatus);

      render(
        <EntitlementProvider>
          <TestConsumer />
        </EntitlementProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
        expect(screen.getByTestId('trial-active').textContent).toBe('true');
        expect(screen.getByTestId('can-access-advanced').textContent).toBe('true');
      });
    });

    it('should deny access if trial expired and initialization fails', async () => {
      mockInitialize.mockRejectedValue(new Error('Init failed'));
      mockGetTrialStatus.mockReturnValue(expiredTrialStatus);

      render(
        <EntitlementProvider>
          <TestConsumer />
        </EntitlementProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('can-access-advanced').textContent).toBe('false');
        expect(screen.getByTestId('effective-level').textContent).toBe('none');
      });
    });
  });

  describe('context values', () => {
    it('should provide trial status', async () => {
      render(
        <EntitlementProvider>
          <TestConsumer />
        </EntitlementProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('trial-active').textContent).toBe('true');
      });
    });

    it('should provide effective level', async () => {
      render(
        <EntitlementProvider>
          <TestConsumer />
        </EntitlementProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('effective-level').textContent).toBe('advanced');
      });
    });

    it('should provide access flags', async () => {
      render(
        <EntitlementProvider>
          <TestConsumer />
        </EntitlementProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('can-access-standard').textContent).toBe('true');
        expect(screen.getByTestId('can-access-advanced').textContent).toBe('true');
      });
    });

    it('should provide purchase info when user has purchased', async () => {
      const purchaseInfo: PurchaseInfo = {
        tier: 'advanced',
        type: 'lifetime',
        purchasedAt: new Date(),
        expiresAt: null,
      };

      mockInitialize.mockResolvedValue({
        ...defaultEntitlementStatus,
        purchase: purchaseInfo,
      });

      let capturedValue: ReturnType<typeof useEntitlement> | null = null;

      render(
        <EntitlementProvider>
          <TestConsumer
            onMount={v => {
              capturedValue = v;
            }}
          />
        </EntitlementProvider>
      );

      await waitFor(() => {
        expect(capturedValue?.purchase).not.toBeNull();
        expect(capturedValue?.purchase?.tier).toBe('advanced');
      });
    });
  });

  describe('paywall trigger logic', () => {
    it('should have paywall closed initially', async () => {
      render(
        <EntitlementProvider>
          <TestConsumer />
        </EntitlementProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('paywall-open').textContent).toBe('false');
      });
    });

    it('should open paywall when showPaywall is called', async () => {
      render(
        <EntitlementProvider>
          <TestConsumer />
        </EntitlementProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      const showButton = screen.getByRole('button', { name: /Show Paywall/i });
      act(() => {
        showButton.click();
      });

      expect(screen.getByTestId('paywall-open').textContent).toBe('true');
    });

    it('should close paywall when closePaywall is called', async () => {
      render(
        <EntitlementProvider>
          <TestConsumer />
        </EntitlementProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Open first
      act(() => {
        screen.getByRole('button', { name: /Show Paywall/i }).click();
      });
      expect(screen.getByTestId('paywall-open').textContent).toBe('true');

      // Then close
      act(() => {
        screen.getByRole('button', { name: /Close Paywall/i }).click();
      });
      expect(screen.getByTestId('paywall-open').textContent).toBe('false');
    });

    it('should pass tier and reason to paywall state', async () => {
      let capturedPaywall: { isOpen: boolean; requiredTier: string; reason: string | null } | null =
        null;

      function PaywallTestConsumer() {
        const { showPaywall, paywall } = useEntitlement();
        capturedPaywall = paywall;

        return <button onClick={() => showPaywall('advanced', 'trial_expired')}>Show</button>;
      }

      render(
        <EntitlementProvider>
          <PaywallTestConsumer />
        </EntitlementProvider>
      );

      // Wait for init
      await waitFor(() => {
        expect(capturedPaywall?.isOpen).toBe(false);
      });

      act(() => {
        screen.getByRole('button', { name: /Show/i }).click();
      });

      expect(capturedPaywall?.isOpen).toBe(true);
      expect(capturedPaywall?.requiredTier).toBe('advanced');
      expect(capturedPaywall?.reason).toBe('trial_expired');
    });
  });

  describe('feature gating', () => {
    it('should grant access during active trial', async () => {
      mockInitialize.mockResolvedValue({
        ...defaultEntitlementStatus,
        trial: activeTrialStatus,
        effectiveLevel: 'advanced',
        canAccessStandard: true,
        canAccessAdvanced: true,
      });

      render(
        <EntitlementProvider>
          <TestConsumer />
        </EntitlementProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('can-access-advanced').textContent).toBe('true');
      });
    });

    it('should deny access after trial expires with no purchase', async () => {
      mockInitialize.mockResolvedValue({
        ...defaultEntitlementStatus,
        trial: expiredTrialStatus,
        effectiveLevel: 'none',
        canAccessStandard: false,
        canAccessAdvanced: false,
      });

      render(
        <EntitlementProvider>
          <TestConsumer />
        </EntitlementProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('can-access-advanced').textContent).toBe('false');
        expect(screen.getByTestId('can-access-standard').textContent).toBe('false');
      });
    });

    it('should grant standard access with standard purchase', async () => {
      mockInitialize.mockResolvedValue({
        ...defaultEntitlementStatus,
        trial: expiredTrialStatus,
        purchase: {
          tier: 'standard',
          type: 'lifetime',
          purchasedAt: new Date(),
          expiresAt: null,
        },
        effectiveLevel: 'standard',
        canAccessStandard: true,
        canAccessAdvanced: false,
      });

      render(
        <EntitlementProvider>
          <TestConsumer />
        </EntitlementProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('can-access-standard').textContent).toBe('true');
        expect(screen.getByTestId('can-access-advanced').textContent).toBe('false');
      });
    });

    it('should grant full access with advanced purchase', async () => {
      mockInitialize.mockResolvedValue({
        ...defaultEntitlementStatus,
        trial: expiredTrialStatus,
        purchase: {
          tier: 'advanced',
          type: 'lifetime',
          purchasedAt: new Date(),
          expiresAt: null,
        },
        effectiveLevel: 'advanced',
        canAccessStandard: true,
        canAccessAdvanced: true,
      });

      render(
        <EntitlementProvider>
          <TestConsumer />
        </EntitlementProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('can-access-standard').textContent).toBe('true');
        expect(screen.getByTestId('can-access-advanced').textContent).toBe('true');
      });
    });
  });

  describe('refresh entitlement', () => {
    it('should refresh entitlement status', async () => {
      mockGetEntitlementStatus.mockResolvedValue({
        ...defaultEntitlementStatus,
        effectiveLevel: 'standard',
      });

      render(
        <EntitlementProvider>
          <TestConsumer />
        </EntitlementProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      const refreshButton = screen.getByRole('button', { name: /Refresh/i });

      await act(async () => {
        refreshButton.click();
      });

      await waitFor(() => {
        expect(mockGetEntitlementStatus).toHaveBeenCalled();
      });
    });

    it('should handle refresh error gracefully', async () => {
      mockGetEntitlementStatus.mockRejectedValue(new Error('Refresh failed'));

      render(
        <EntitlementProvider>
          <TestConsumer />
        </EntitlementProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      const refreshButton = screen.getByRole('button', { name: /Refresh/i });

      // Should not throw
      await act(async () => {
        refreshButton.click();
      });

      // Original state should be preserved
      expect(screen.getByTestId('effective-level').textContent).toBe('advanced');
    });
  });

  describe('useEntitlement hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useEntitlement must be used within an EntitlementProvider');

      consoleSpy.mockRestore();
    });
  });
});
