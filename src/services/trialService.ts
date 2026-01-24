/**
 * Trial Service
 *
 * Manages the 4-week free trial period for new users.
 * Trial provides full access to all features (Advanced level).
 *
 * The trial starts automatically on first app launch and is stored
 * locally. This simple approach works because:
 * 1. Users who reinstall get a new trial (acceptable trade-off)
 * 2. No server-side complexity needed
 * 3. When IAP is added, purchases will override trial status anyway
 */

import type { TrialStatus } from '@/types/entitlement';
import { TRIAL_CONFIG } from '@/types/entitlement';
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('Trial');

const TRIAL_DURATION_MS = TRIAL_CONFIG.DURATION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Get the stored trial start date.
 */
function getTrialStart(): Date | null {
  try {
    const stored = localStorage.getItem(TRIAL_CONFIG.STORAGE_KEY);
    if (!stored) return null;
    const date = new Date(stored);
    // Validate it's a real date
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

/**
 * Store the trial start date.
 */
function setTrialStart(date: Date): void {
  try {
    localStorage.setItem(TRIAL_CONFIG.STORAGE_KEY, date.toISOString());
  } catch (error) {
    log.error('Failed to store trial start', { error });
  }
}

/**
 * Trial Service singleton.
 */
export const trialService = {
  /**
   * Start the trial if not already started.
   * Safe to call multiple times - only starts trial once.
   * @returns Current trial status after starting (if needed)
   */
  startTrialIfNeeded(): TrialStatus {
    const existing = getTrialStart();
    if (!existing) {
      const now = new Date();
      setTrialStart(now);
      log.debug('Started free trial', { startedAt: now.toISOString() });
    }
    return this.getTrialStatus();
  },

  /**
   * Get current trial status.
   */
  getTrialStatus(): TrialStatus {
    const startedAt = getTrialStart();

    // Trial never started
    if (!startedAt) {
      return {
        isActive: false,
        startedAt: null,
        expiresAt: null,
        daysRemaining: 0,
        hasExpired: false,
      };
    }

    const expiresAt = new Date(startedAt.getTime() + TRIAL_DURATION_MS);
    const now = new Date();
    const msRemaining = expiresAt.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
    const hasExpired = msRemaining <= 0;
    const isActive = !hasExpired;

    return {
      isActive,
      startedAt,
      expiresAt,
      daysRemaining,
      hasExpired,
    };
  },

  /**
   * Check if user is currently in trial period.
   */
  isInTrial(): boolean {
    return this.getTrialStatus().isActive;
  },

  /**
   * Check if trial has been used and expired.
   */
  hasTrialExpired(): boolean {
    const status = this.getTrialStatus();
    return status.hasExpired;
  },

  /**
   * Get days remaining in trial.
   * Returns 0 if trial expired or not started.
   */
  getDaysRemaining(): number {
    return this.getTrialStatus().daysRemaining;
  },

  /**
   * Reset trial (for testing/development only).
   * In production, this should not be exposed to users.
   */
  resetTrial(): void {
    if (import.meta.env.DEV) {
      try {
        localStorage.removeItem(TRIAL_CONFIG.STORAGE_KEY);
        log.debug('Trial reset (dev only)');
      } catch {
        // Ignore
      }
    }
  },

  /**
   * Force expire trial (for testing/development only).
   * Sets trial start to 29 days ago.
   */
  forceExpireTrial(): void {
    if (import.meta.env.DEV) {
      const expiredStart = new Date(
        Date.now() - (TRIAL_CONFIG.DURATION_DAYS + 1) * 24 * 60 * 60 * 1000
      );
      setTrialStart(expiredStart);
      log.debug('Trial force expired (dev only)');
    }
  },
};
