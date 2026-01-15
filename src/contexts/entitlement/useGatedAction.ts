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
