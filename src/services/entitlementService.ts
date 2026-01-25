/**
 * Entitlement Service
 *
 * Coordinates trial status and purchase status to determine feature access.
 * This is the web/PWA implementation - when running on iOS via Capacitor,
 * the IAP service will provide purchase information.
 *
 * Access Logic:
 * 1. If user has Advanced purchase → Advanced access
 * 2. If user has Standard purchase → Standard access
 * 3. If trial is active → Advanced access (full features during trial)
 * 4. If trial expired and no purchase → No access (show paywall)
 *
 * On web (PWA), we don't have IAP, so:
 * - Trial functions normally
 * - After trial, users are prompted to use the iOS app for purchase
 * - OR we can give web users full access (business decision)
 */

import { Capacitor } from '@capacitor/core';
import type {
  EntitlementStatus,
  PurchaseInfo,
  PurchaseTier,
  LockedFeatureInfo,
  LockReason,
} from '@/types/entitlement';
import type { AppMode } from '@/types/preferences';
import { trialService } from './trialService';
import { iapService } from './iapService';

/**
 * Check if running on a native platform (iOS/Android via Capacitor).
 */
function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Get purchase info from IAP service.
 * Returns null on web platform.
 */
async function getPurchaseInfo(): Promise<PurchaseInfo | null> {
  if (!isNativePlatform()) return null;
  return iapService.getPurchaseInfo();
}

import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('Entitlement');

/**
 * Entitlement Service singleton.
 */
export const entitlementService = {
  /**
   * Initialize entitlement tracking.
   * Call once at app startup.
   */
  async initialize(): Promise<EntitlementStatus> {
    // ALWAYS start trial first - this must happen regardless of IAP status
    trialService.startTrialIfNeeded();

    // Initialize IAP service on native platforms
    if (isNativePlatform()) {
      try {
        await iapService.initialize();
      } catch (error) {
        log.error('IAP initialization failed, continuing with trial only', { error });
        // Continue - trial is already started, we can still function
      }
    }

    // Get current status
    return this.getEntitlementStatus();
  },

  /**
   * Get complete entitlement status.
   * @param appMode - Optional current app mode to determine access for standard purchasers with active trial
   */
  async getEntitlementStatus(appMode?: AppMode): Promise<EntitlementStatus> {
    const trial = trialService.getTrialStatus();
    const purchase = await getPurchaseInfo();
    const native = isNativePlatform();

    // Determine effective access level
    let effectiveLevel: PurchaseTier = 'none';

    if (purchase) {
      // Check if subscription is still valid
      const isValid = !purchase.expiresAt || purchase.expiresAt > new Date();
      if (isValid) {
        effectiveLevel = purchase.tier;
      }
    }

    // If no valid purchase but trial is active, give full access
    if (effectiveLevel === 'none' && trial.isActive) {
      effectiveLevel = 'advanced';
    }

    // Check if standard purchaser can use trial for advanced features
    // This allows them to "resume" their trial if they want advanced access
    const canUseTrialForAdvanced =
      purchase?.tier === 'standard' && trial.isActive && trial.daysRemaining > 0;

    // Determine advanced access:
    // 1. Advanced purchasers always have access
    // 2. Standard purchasers with active trial can access advanced IF they're in advanced mode
    // 3. Non-purchasers with active trial have access
    let canAccessAdvanced = effectiveLevel === 'advanced';

    // Special case: standard purchaser in advanced mode with active trial gets advanced access
    if (purchase?.tier === 'standard' && trial.isActive && appMode === 'advanced') {
      canAccessAdvanced = true;
    }

    // On web (non-native), we might want to give full access
    // This is a business decision - for now, enforce trial on web too
    // Uncomment below to give web users full access:
    // if (!native) {
    //   effectiveLevel = 'advanced';
    // }

    return {
      trial,
      purchase,
      effectiveLevel,
      canAccessStandard: effectiveLevel !== 'none',
      canAccessAdvanced,
      canUseTrialForAdvanced: canUseTrialForAdvanced ?? false,
      isNativePlatform: native,
      isLoading: false,
    };
  },

  /**
   * Check if a specific feature tier is accessible.
   * @param requiredTier - The tier required for the feature
   * @param appMode - Optional current app mode for mode-aware access checking
   */
  async checkAccess(requiredTier: PurchaseTier, appMode?: AppMode): Promise<LockedFeatureInfo> {
    const status = await this.getEntitlementStatus(appMode);

    // 'none' tier is always accessible (shouldn't really be used)
    if (requiredTier === 'none') {
      return { isLocked: false, reason: null, requiredTier };
    }

    // Check Standard access
    if (requiredTier === 'standard') {
      if (status.canAccessStandard) {
        return { isLocked: false, reason: null, requiredTier };
      }
      // Locked - determine reason
      const reason: LockReason = status.trial.hasExpired ? 'trial_expired' : 'not_purchased';
      return { isLocked: true, reason, requiredTier };
    }

    // Check Advanced access
    if (requiredTier === 'advanced') {
      if (status.canAccessAdvanced) {
        return { isLocked: false, reason: null, requiredTier };
      }
      // Locked - determine reason
      let reason: LockReason;
      if (status.purchase?.tier === 'standard') {
        // Standard purchaser - check if they can use trial for advanced
        reason = status.canUseTrialForAdvanced ? 'standard_can_use_trial' : 'standard_only';
      } else if (status.trial.hasExpired) {
        reason = 'trial_expired';
      } else {
        reason = 'not_purchased';
      }
      return { isLocked: true, reason, requiredTier };
    }

    // Unknown tier - treat as locked
    return { isLocked: true, reason: 'not_purchased', requiredTier };
  },

  /**
   * Check if Advanced features are locked.
   * Convenience method for the common case.
   */
  async isAdvancedLocked(): Promise<boolean> {
    const status = await this.getEntitlementStatus();
    return !status.canAccessAdvanced;
  },

  /**
   * Get a user-friendly message for why a feature is locked.
   */
  getLockMessage(reason: LockReason): string {
    switch (reason) {
      case 'trial_expired':
        return 'Your free trial has ended. Subscribe or purchase to continue using this feature.';
      case 'standard_only':
        return 'This feature requires Advanced. Upgrade your subscription to unlock it.';
      case 'standard_can_use_trial':
        return 'This feature requires Advanced mode. You can use your remaining trial days to access it.';
      case 'not_purchased':
        return 'Start your free trial or subscribe to access this feature.';
      default:
        return 'This feature requires a subscription.';
    }
  },

  /**
   * Get the upgrade CTA text based on lock reason.
   */
  getUpgradeCtaText(reason: LockReason): string {
    switch (reason) {
      case 'trial_expired':
        return 'View Plans';
      case 'standard_only':
        return 'Upgrade to Advanced';
      case 'standard_can_use_trial':
        return 'Resume Trial';
      case 'not_purchased':
        return 'Start Free Trial';
      default:
        return 'View Plans';
    }
  },
};
