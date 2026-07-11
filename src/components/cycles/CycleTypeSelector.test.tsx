/**
 * CycleTypeSelector Tests
 *
 * Covers the entitlement gating on cycle creation:
 * - Active trial (or purchase): RFEM / Max Testing selectable, Simple / Mixed follow advanced access
 * - Expired trial, no purchase: ALL options locked; standard options open the standard paywall
 * - Standard purchaser post-trial: RFEM / Max Testing work, Simple / Mixed open the advanced paywall
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CycleTypeSelector } from './CycleTypeSelector';
import type { TrialStatus, PurchaseInfo } from '@/types/entitlement';

const mockShowPaywall = vi.fn();

const activeTrial: TrialStatus = {
  isActive: true,
  startedAt: new Date(),
  expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
  daysRemaining: 28,
  hasExpired: false,
};

const expiredTrial: TrialStatus = {
  isActive: false,
  startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  daysRemaining: 0,
  hasExpired: true,
};

const standardPurchase: PurchaseInfo = {
  tier: 'standard',
  type: 'lifetime',
  purchasedAt: new Date(),
  expiresAt: null,
  willRenew: false,
  productId: 'standard_lifetime',
};

interface MockEntitlementValue {
  canAccessStandard: boolean;
  canAccessAdvanced: boolean;
  canUseTrialForAdvanced: boolean;
  showPaywall: typeof mockShowPaywall;
  trial: TrialStatus;
  purchase: PurchaseInfo | null;
}

let mockEntitlementValue: MockEntitlementValue;
let mockAppMode: 'standard' | 'advanced';

vi.mock('@/contexts', () => ({
  useEntitlement: () => mockEntitlementValue,
  useSyncedPreferences: () => ({ preferences: { appMode: mockAppMode } }),
}));

describe('CycleTypeSelector', () => {
  const onSelectTraining = vi.fn();
  const onSelectMaxTesting = vi.fn();
  const onCancel = vi.fn();

  const renderSelector = () =>
    render(
      <CycleTypeSelector
        onSelectTraining={onSelectTraining}
        onSelectMaxTesting={onSelectMaxTesting}
        onCancel={onCancel}
      />
    );

  beforeEach(() => {
    vi.clearAllMocks();
    mockAppMode = 'advanced';
    mockEntitlementValue = {
      canAccessStandard: true,
      canAccessAdvanced: true,
      canUseTrialForAdvanced: false,
      showPaywall: mockShowPaywall,
      trial: activeTrial,
      purchase: null,
    };
  });

  describe('active trial', () => {
    it('selects RFEM training when tapped', () => {
      renderSelector();
      fireEvent.click(screen.getByText('RFEM Training Cycle'));
      expect(onSelectTraining).toHaveBeenCalledWith('rfem');
      expect(mockShowPaywall).not.toHaveBeenCalled();
    });

    it('selects max testing when tapped', () => {
      renderSelector();
      fireEvent.click(screen.getByText('Max Rep Testing'));
      expect(onSelectMaxTesting).toHaveBeenCalled();
      expect(mockShowPaywall).not.toHaveBeenCalled();
    });

    it('selects simple and mixed cycles in advanced mode', () => {
      renderSelector();
      fireEvent.click(screen.getByText('Simple Progression Cycle'));
      expect(onSelectTraining).toHaveBeenCalledWith('simple');
      fireEvent.click(screen.getByText('Mixed Cycle'));
      expect(onSelectTraining).toHaveBeenCalledWith('mixed');
    });
  });

  describe('expired trial without purchase', () => {
    beforeEach(() => {
      mockEntitlementValue.canAccessStandard = false;
      mockEntitlementValue.canAccessAdvanced = false;
      mockEntitlementValue.trial = expiredTrial;
    });

    it('shows the standard paywall instead of selecting RFEM training', () => {
      renderSelector();
      fireEvent.click(screen.getByText('RFEM Training Cycle'));
      expect(mockShowPaywall).toHaveBeenCalledWith('standard', 'trial_expired');
      expect(onSelectTraining).not.toHaveBeenCalled();
    });

    it('shows the standard paywall instead of selecting max testing', () => {
      renderSelector();
      fireEvent.click(screen.getByText('Max Rep Testing'));
      expect(mockShowPaywall).toHaveBeenCalledWith('standard', 'trial_expired');
      expect(onSelectMaxTesting).not.toHaveBeenCalled();
    });

    it('shows the advanced paywall for simple/mixed cycles', () => {
      renderSelector();
      fireEvent.click(screen.getByText('Simple Progression Cycle'));
      expect(mockShowPaywall).toHaveBeenCalledWith('advanced', 'trial_expired');
      expect(onSelectTraining).not.toHaveBeenCalled();
    });

    it('marks standard options with a Standard badge', () => {
      renderSelector();
      expect(screen.getAllByText('Standard').length).toBe(2);
      expect(screen.getAllByText('Advanced').length).toBe(2);
    });
  });

  describe('standard purchaser after trial', () => {
    beforeEach(() => {
      mockEntitlementValue.canAccessStandard = true;
      mockEntitlementValue.canAccessAdvanced = false;
      mockEntitlementValue.trial = expiredTrial;
      mockEntitlementValue.purchase = standardPurchase;
    });

    it('selects RFEM training normally', () => {
      renderSelector();
      fireEvent.click(screen.getByText('RFEM Training Cycle'));
      expect(onSelectTraining).toHaveBeenCalledWith('rfem');
      expect(mockShowPaywall).not.toHaveBeenCalled();
    });

    it('shows the advanced upgrade paywall for simple cycles', () => {
      renderSelector();
      fireEvent.click(screen.getByText('Simple Progression Cycle'));
      expect(mockShowPaywall).toHaveBeenCalledWith('advanced', 'standard_only');
      expect(onSelectTraining).not.toHaveBeenCalled();
    });
  });

  it('calls onCancel from the cancel button', () => {
    renderSelector();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
