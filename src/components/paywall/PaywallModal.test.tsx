/**
 * PaywallModal Tests
 *
 * Tests for the paywall modal component with mocked entitlement context.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaywallModal } from './PaywallModal';
import type { TrialStatus } from '@/types/entitlement';

// Mock the contexts
const mockRefreshEntitlement = vi.fn();
const mockSetAppMode = vi.fn();

const defaultTrialStatus: TrialStatus = {
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

interface MockEntitlementValue {
  trial: TrialStatus;
  isNativePlatform: boolean;
  refreshEntitlement: typeof mockRefreshEntitlement;
}

interface MockPreferencesValue {
  preferences: { appMode: 'standard' | 'advanced' };
  setAppMode: typeof mockSetAppMode;
}

let mockEntitlementValue: MockEntitlementValue;
let mockPreferencesValue: MockPreferencesValue;

vi.mock('@/contexts', () => ({
  useEntitlement: () => mockEntitlementValue,
  useSyncedPreferences: () => mockPreferencesValue,
}));

vi.mock('@/services/entitlementService', () => ({
  entitlementService: {
    getLockMessage: vi.fn(reason => {
      switch (reason) {
        case 'trial_expired':
          return 'Your trial has ended.';
        case 'standard_only':
          return 'Upgrade to Advanced for this feature.';
        default:
          return 'This feature requires a purchase.';
      }
    }),
  },
}));

vi.mock('@/services/iapService', () => ({
  iapService: {
    getOfferings: vi.fn().mockResolvedValue([
      {
        identifier: 'default',
        packages: [
          { identifier: 'standard', priceString: '$4.99', productTitle: 'Standard' },
          { identifier: 'advanced', priceString: '$9.99', productTitle: 'Advanced' },
        ],
      },
    ]),
    purchase: vi.fn(),
    restorePurchases: vi.fn(),
  },
}));

describe('PaywallModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    requiredTier: 'advanced' as const,
    reason: 'trial_expired' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockEntitlementValue = {
      trial: defaultTrialStatus,
      isNativePlatform: false,
      refreshEntitlement: mockRefreshEntitlement,
    };
    mockPreferencesValue = {
      preferences: { appMode: 'standard' },
      setAppMode: mockSetAppMode,
    };
  });

  describe('display', () => {
    it('should display the modal when isOpen is true', () => {
      render(<PaywallModal {...defaultProps} />);

      expect(screen.queryByRole('dialog')).not.toBeNull();
    });

    it('should not display when isOpen is false', () => {
      render(<PaywallModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('should display trial expired banner when trial has expired', () => {
      mockEntitlementValue.trial = expiredTrialStatus;

      render(<PaywallModal {...defaultProps} reason="trial_expired" />);

      expect(screen.queryByText(/4-week free trial has ended/i)).not.toBeNull();
    });

    it('should display trial info section when trial is active', () => {
      mockEntitlementValue.trial = { ...defaultTrialStatus, daysRemaining: 14 };
      mockPreferencesValue.preferences.appMode = 'standard';

      render(<PaywallModal {...defaultProps} reason={null} />);

      // When in trial with standard mode, shows the upgrade prompt
      expect(screen.queryByRole('button', { name: /Enable Advanced Trial/i })).not.toBeNull();
    });
  });

  describe('trial upgrade flow', () => {
    it('should show Enable Advanced Trial button when user can upgrade for free', () => {
      mockEntitlementValue.trial = defaultTrialStatus;
      mockPreferencesValue.preferences.appMode = 'standard';

      render(<PaywallModal {...defaultProps} reason={null} />);

      expect(screen.queryByRole('button', { name: /Enable Advanced Trial/i })).not.toBeNull();
    });

    it('should call setAppMode when enabling advanced trial', async () => {
      mockEntitlementValue.trial = defaultTrialStatus;
      mockPreferencesValue.preferences.appMode = 'standard';
      mockSetAppMode.mockResolvedValue(undefined);

      render(<PaywallModal {...defaultProps} reason={null} />);

      const enableButton = screen.getByRole('button', { name: /Enable Advanced Trial/i });
      fireEvent.click(enableButton);

      await waitFor(() => {
        expect(mockSetAppMode).toHaveBeenCalledWith('advanced');
      });
    });

    it('should close modal after successful trial upgrade', async () => {
      mockEntitlementValue.trial = defaultTrialStatus;
      mockPreferencesValue.preferences.appMode = 'standard';
      mockSetAppMode.mockResolvedValue(undefined);

      const onClose = vi.fn();
      render(<PaywallModal {...defaultProps} onClose={onClose} reason={null} />);

      const enableButton = screen.getByRole('button', { name: /Enable Advanced Trial/i });
      fireEvent.click(enableButton);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('web platform', () => {
    beforeEach(() => {
      mockEntitlementValue.isNativePlatform = false;
      mockEntitlementValue.trial = expiredTrialStatus;
    });

    it('should show iOS app prompt on web', () => {
      render(<PaywallModal {...defaultProps} />);

      expect(screen.queryByText(/Purchases are available in the iOS app/i)).not.toBeNull();
    });

    it('should show Get the iOS App button', () => {
      render(<PaywallModal {...defaultProps} />);

      expect(screen.queryByRole('button', { name: /Get the iOS App/i })).not.toBeNull();
    });
  });

  describe('native platform', () => {
    beforeEach(() => {
      mockEntitlementValue.isNativePlatform = true;
      mockEntitlementValue.trial = expiredTrialStatus;
    });

    it('should show restore purchases button on native', () => {
      render(<PaywallModal {...defaultProps} />);

      // There are multiple restore buttons (one in content, one in footer)
      const restoreButtons = screen.queryAllByRole('button', { name: /Restore Purchases/i });
      expect(restoreButtons.length).toBeGreaterThan(0);
    });
  });

  describe('close behavior', () => {
    it('should call onClose when Maybe Later is clicked', () => {
      const onClose = vi.fn();
      mockEntitlementValue.trial = expiredTrialStatus;
      mockEntitlementValue.isNativePlatform = true;

      render(<PaywallModal {...defaultProps} onClose={onClose} />);

      const laterButton = screen.getByRole('button', { name: /Maybe Later/i });
      fireEvent.click(laterButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should show Cancel instead of Maybe Later during trial upgrade flow', () => {
      mockEntitlementValue.trial = defaultTrialStatus;
      mockPreferencesValue.preferences.appMode = 'standard';

      render(<PaywallModal {...defaultProps} reason={null} />);

      expect(screen.queryByRole('button', { name: /Cancel/i })).not.toBeNull();
      expect(screen.queryByRole('button', { name: /Maybe Later/i })).toBeNull();
    });
  });

  describe('loading states', () => {
    it('should disable button during trial upgrade', async () => {
      mockEntitlementValue.trial = defaultTrialStatus;
      mockPreferencesValue.preferences.appMode = 'standard';
      // Make setAppMode hang to show loading state
      mockSetAppMode.mockImplementation(() => new Promise(() => {}));

      render(<PaywallModal {...defaultProps} reason={null} />);

      const enableButton = screen.getByRole('button', { name: /Enable Advanced Trial/i });
      fireEvent.click(enableButton);

      await waitFor(() => {
        expect(enableButton).toHaveProperty('disabled', true);
      });
    });
  });

  describe('legal links', () => {
    it('should display Terms of Service link', () => {
      render(<PaywallModal {...defaultProps} />);

      expect(screen.queryByText('Terms of Service')).not.toBeNull();
    });

    it('should display Privacy Policy link', () => {
      render(<PaywallModal {...defaultProps} />);

      expect(screen.queryByText('Privacy Policy')).not.toBeNull();
    });
  });
});
