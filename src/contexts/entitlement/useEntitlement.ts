import { useContext } from 'react';
import { EntitlementContext } from './EntitlementContext';
import type { EntitlementContextValue } from './types';

/**
 * Hook to access entitlement state.
 * Must be used within an EntitlementProvider.
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
export function useEntitlement(): EntitlementContextValue {
  const context = useContext(EntitlementContext);
  if (!context) {
    throw new Error('useEntitlement must be used within an EntitlementProvider');
  }
  return context;
}
