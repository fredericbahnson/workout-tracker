/**
 * Entitlement Context
 *
 * Provides entitlement state (trial status, purchase status, feature access)
 * throughout the application. This context is the source of truth for
 * whether features should be accessible.
 *
 * Usage:
 * ```tsx
 * const { canAccessAdvanced, trial, showPaywall } = useEntitlement();
 *
 * if (!canAccessAdvanced) {
 *   showPaywall('advanced');
 *   return;
 * }
 * ```
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { EntitlementStatus, PurchaseTier, TrialStatus, LockReason } from '@/types/entitlement';
import { entitlementService } from '@/services/entitlementService';
import { trialService } from '@/services/trialService';

interface PaywallState {
  isOpen: boolean;
  requiredTier: PurchaseTier;
  reason: LockReason | null;
}

interface EntitlementContextValue extends EntitlementStatus {
  /** Show the paywall modal for a specific tier */
  showPaywall: (tier: PurchaseTier, reason?: LockReason) => void;
  /** Close the paywall modal */
  closePaywall: () => void;
  /** Current paywall state */
  paywall: PaywallState;
  /** Refresh entitlement status (e.g., after purchase) */
  refreshEntitlement: () => Promise<void>;
}

const defaultTrialStatus: TrialStatus = {
  isActive: false,
  startedAt: null,
  expiresAt: null,
  daysRemaining: 0,
  hasExpired: false,
};

const defaultEntitlementStatus: EntitlementStatus = {
  trial: defaultTrialStatus,
  purchase: null,
  effectiveLevel: 'none',
  canAccessStandard: false,
  canAccessAdvanced: false,
  isNativePlatform: false,
  isLoading: true,
};

const EntitlementContext = createContext<EntitlementContextValue | undefined>(undefined);

interface EntitlementProviderProps {
  children: ReactNode;
}

export function EntitlementProvider({ children }: EntitlementProviderProps) {
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
  const value = useMemo<EntitlementContextValue>(
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

/**
 * Hook to access entitlement state.
 * Must be used within an EntitlementProvider.
 */
export function useEntitlement(): EntitlementContextValue {
  const context = useContext(EntitlementContext);
  if (!context) {
    throw new Error('useEntitlement must be used within an EntitlementProvider');
  }
  return context;
}

/**
 * Hook to check if a specific feature is accessible.
 * Returns a function that can be called with a tier to check access.
 */
export function useFeatureAccess() {
  const { canAccessStandard, canAccessAdvanced } = useEntitlement();

  return useCallback(
    (requiredTier: PurchaseTier): boolean => {
      if (requiredTier === 'none') return true;
      if (requiredTier === 'standard') return canAccessStandard;
      if (requiredTier === 'advanced') return canAccessAdvanced;
      return false;
    },
    [canAccessStandard, canAccessAdvanced]
  );
}

/**
 * Hook to get a gated action handler.
 * If user doesn't have access, shows paywall instead of executing action.
 */
export function useGatedAction<T extends (...args: unknown[]) => unknown>(
  action: T,
  requiredTier: PurchaseTier,
  lockReason?: LockReason
): T {
  const { canAccessStandard, canAccessAdvanced, showPaywall, trial } = useEntitlement();

  return useCallback(
    ((...args: Parameters<T>) => {
      // Check access
      const hasAccess =
        requiredTier === 'none' ||
        (requiredTier === 'standard' && canAccessStandard) ||
        (requiredTier === 'advanced' && canAccessAdvanced);

      if (!hasAccess) {
        // Determine reason if not provided
        const reason = lockReason || (trial.hasExpired ? 'trial_expired' : 'not_purchased');
        showPaywall(requiredTier, reason);
        return;
      }

      return action(...args);
    }) as T,
    [action, requiredTier, lockReason, canAccessStandard, canAccessAdvanced, showPaywall, trial]
  );
}
