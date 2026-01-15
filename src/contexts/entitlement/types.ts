import type { EntitlementStatus, PurchaseTier, TrialStatus, LockReason } from '@/types/entitlement';

export interface PaywallState {
  isOpen: boolean;
  requiredTier: PurchaseTier;
  reason: LockReason | null;
}

export interface EntitlementContextValue extends EntitlementStatus {
  /** Show the paywall modal for a specific tier */
  showPaywall: (tier: PurchaseTier, reason?: LockReason) => void;
  /** Close the paywall modal */
  closePaywall: () => void;
  /** Current paywall state */
  paywall: PaywallState;
  /** Refresh entitlement status (e.g., after purchase) */
  refreshEntitlement: () => Promise<void>;
}

export const defaultTrialStatus: TrialStatus = {
  isActive: false,
  startedAt: null,
  expiresAt: null,
  daysRemaining: 0,
  hasExpired: false,
};

export const defaultEntitlementStatus: EntitlementStatus = {
  trial: defaultTrialStatus,
  purchase: null,
  effectiveLevel: 'none',
  canAccessStandard: false,
  canAccessAdvanced: false,
  isNativePlatform: false,
  isLoading: true,
};
