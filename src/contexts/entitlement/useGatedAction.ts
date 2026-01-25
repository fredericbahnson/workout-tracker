import { useCallback } from 'react';
import type { PurchaseTier, LockReason } from '@/types/entitlement';
import { useEntitlement } from './useEntitlement';

/**
 * Hook to get a gated action handler.
 * If user doesn't have access, shows paywall instead of executing action.
 */
export function useGatedAction<T extends (...args: unknown[]) => unknown>(
  action: T,
  requiredTier: PurchaseTier,
  lockReason?: LockReason
): T {
  const {
    canAccessStandard,
    canAccessAdvanced,
    canUseTrialForAdvanced,
    showPaywall,
    trial,
    purchase,
  } = useEntitlement();

  return useCallback(
    ((...args: Parameters<T>) => {
      // Check access
      const hasAccess =
        requiredTier === 'none' ||
        (requiredTier === 'standard' && canAccessStandard) ||
        (requiredTier === 'advanced' && canAccessAdvanced);

      if (!hasAccess) {
        // Determine reason if not provided
        let reason: LockReason;
        if (lockReason) {
          reason = lockReason;
        } else if (requiredTier === 'advanced' && canUseTrialForAdvanced) {
          // Standard purchaser with active trial can use trial for advanced
          reason = 'standard_can_use_trial';
        } else if (requiredTier === 'advanced' && purchase?.tier === 'standard') {
          // Standard purchaser with expired trial
          reason = 'standard_only';
        } else if (trial.hasExpired) {
          reason = 'trial_expired';
        } else {
          reason = 'not_purchased';
        }
        showPaywall(requiredTier, reason);
        return;
      }

      return action(...args);
    }) as T,
    [
      action,
      requiredTier,
      lockReason,
      canAccessStandard,
      canAccessAdvanced,
      canUseTrialForAdvanced,
      showPaywall,
      trial,
      purchase,
    ]
  );
}
