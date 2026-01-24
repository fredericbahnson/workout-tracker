/**
 * Entitlement Provider
 *
 * Provides entitlement state (trial status, purchase status, feature access)
 * throughout the application. This context is the source of truth for
 * whether features should be accessible.
 */

import { useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { EntitlementStatus, PurchaseTier, LockReason } from '@/types/entitlement';
import { entitlementService } from '@/services/entitlementService';
import { trialService } from '@/services/trialService';
import { useAuth } from '@/contexts/auth';
import { EntitlementContext } from './EntitlementContext';
import { defaultEntitlementStatus, type PaywallState } from './types';

interface EntitlementProviderProps {
  children: ReactNode;
}

export function EntitlementProvider({ children }: EntitlementProviderProps) {
  const { user } = useAuth();
  const [entitlement, setEntitlement] = useState<EntitlementStatus>(defaultEntitlementStatus);
  const [paywall, setPaywall] = useState<PaywallState>({
    isOpen: false,
    requiredTier: 'advanced',
    reason: null,
  });

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      try {
        const status = await entitlementService.initialize();
        setEntitlement(status);
      } catch (error) {
        console.error('[Entitlement] Failed to initialize:', error);
        // On error, give trial status at minimum
        const trial = trialService.getTrialStatus();
        setEntitlement({
          ...defaultEntitlementStatus,
          trial,
          effectiveLevel: trial.isActive ? 'advanced' : 'none',
          canAccessStandard: trial.isActive,
          canAccessAdvanced: trial.isActive,
          isLoading: false,
        });
      }
    };

    init();
  }, []);

  // Refresh entitlement when user changes (login/logout/switch account)
  useEffect(() => {
    const refreshOnUserChange = async () => {
      try {
        // Small delay to allow RevenueCat to sync with new user ID
        await new Promise(resolve => setTimeout(resolve, 500));
        const status = await entitlementService.getEntitlementStatus();
        setEntitlement(status);
      } catch (error) {
        console.error('[Entitlement] Failed to refresh on user change:', error);
      }
    };

    // Only refresh after initial load (user can be null on first render)
    if (!entitlement.isLoading) {
      refreshOnUserChange();
    }
  }, [user?.id]); // Refresh when user ID changes

  // Refresh entitlement status
  const refreshEntitlement = useCallback(async () => {
    try {
      const status = await entitlementService.getEntitlementStatus();
      setEntitlement(status);
    } catch (error) {
      console.error('[Entitlement] Failed to refresh:', error);
    }
  }, []);

  // Show paywall modal
  const showPaywall = useCallback((tier: PurchaseTier, reason?: LockReason) => {
    setPaywall({
      isOpen: true,
      requiredTier: tier,
      reason: reason || null,
    });
  }, []);

  // Close paywall modal
  const closePaywall = useCallback(() => {
    setPaywall(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Memoize context value
  const value = useMemo(
    () => ({
      ...entitlement,
      showPaywall,
      closePaywall,
      paywall,
      refreshEntitlement,
    }),
    [entitlement, showPaywall, closePaywall, paywall, refreshEntitlement]
  );

  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}
