/**
 * Entitlement Types
 *
 * Types for managing feature access based on trial status and purchases.
 * Designed to support both one-time purchases and subscriptions.
 */

/**
 * User's purchased tier level.
 * - none: No purchase made
 * - standard: Standard features only (RFEM, Max Testing)
 * - advanced: All features unlocked
 */
export type PurchaseTier = 'none' | 'standard' | 'advanced';

/**
 * Type of purchase made.
 * - lifetime: One-time purchase, never expires
 * - subscription: Recurring subscription, has expiration date
 */
export type PurchaseType = 'lifetime' | 'subscription';

/**
 * Current trial status.
 */
export interface TrialStatus {
  /** Whether the trial period is currently active */
  isActive: boolean;
  /** When the trial started (null if never started) */
  startedAt: Date | null;
  /** When the trial expires (null if never started) */
  expiresAt: Date | null;
  /** Days remaining in trial (0 if expired or not started) */
  daysRemaining: number;
  /** Whether the trial has been used and expired */
  hasExpired: boolean;
}

/**
 * Purchase information for a single tier.
 */
export interface PurchaseInfo {
  /** The tier purchased */
  tier: PurchaseTier;
  /** Type of purchase */
  type: PurchaseType;
  /** When the purchase was made */
  purchasedAt: Date;
  /** When the subscription expires (null for lifetime) */
  expiresAt: Date | null;
  /** Whether the subscription is set to auto-renew */
  willRenew?: boolean;
  /** Product ID from the store */
  productId?: string;
}

/**
 * Complete entitlement status combining trial and purchase info.
 */
export interface EntitlementStatus {
  /** Current trial status */
  trial: TrialStatus;
  /** Current purchase info (null if no purchase) */
  purchase: PurchaseInfo | null;
  /** The effective access level (derived from trial + purchase) */
  effectiveLevel: PurchaseTier;
  /** Whether user can access Standard features */
  canAccessStandard: boolean;
  /** Whether user can access Advanced features */
  canAccessAdvanced: boolean;
  /** Whether standard purchaser can use remaining trial for advanced features */
  canUseTrialForAdvanced: boolean;
  /** Whether we're running on a native platform with IAP */
  isNativePlatform: boolean;
  /** Whether entitlement data is still loading */
  isLoading: boolean;
}

/**
 * Reason why a feature is locked.
 */
export type LockReason =
  | 'trial_expired' // Trial ended, no purchase
  | 'standard_only' // Has Standard purchase, needs Advanced (trial expired)
  | 'standard_can_use_trial' // Has Standard purchase, can use remaining trial for advanced
  | 'not_purchased'; // No purchase and no trial

/**
 * Information about a locked feature.
 */
export interface LockedFeatureInfo {
  /** Whether the feature is locked */
  isLocked: boolean;
  /** Why the feature is locked (null if not locked) */
  reason: LockReason | null;
  /** The tier required to unlock this feature */
  requiredTier: PurchaseTier;
}

/**
 * Trial configuration constants.
 */
export const TRIAL_CONFIG = {
  /** Duration of free trial in days */
  DURATION_DAYS: 28,
  /** LocalStorage key for trial start date */
  STORAGE_KEY: 'ascend_trial_start',
} as const;
