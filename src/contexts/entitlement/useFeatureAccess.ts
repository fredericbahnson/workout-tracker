import { useCallback } from 'react';
import type { PurchaseTier } from '@/types/entitlement';
import { useEntitlement } from './useEntitlement';

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
