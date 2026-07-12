/**
 * Trial Service
 *
 * Manages the 4-week free trial period for new users.
 * Trial provides full access to all features (Advanced level).
 *
 * Trial anchoring:
 * 1. Signed-in users: the trial is anchored to the ACCOUNT creation date
 *    (Supabase `user.created_at`, passed in by the caller). Server-side,
 *    per-user truth — a new account gets a fresh trial on any device, and
 *    reinstalling or adding a device does NOT reset the trial.
 * 2. Local-only mode (no Supabase configured): falls back to a device-level
 *    start date stored in localStorage on first launch.
 *
 * DEV builds honor a localStorage override (`ascend_trial_override_start`)
 * that takes precedence over both anchors, so trial states can be simulated
 * regardless of the signed-in account's age.
 */

import type { TrialStatus } from '@/types/entitlement';
import { TRIAL_CONFIG } from '@/types/entitlement';
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('Trial');

const TRIAL_DURATION_MS = TRIAL_CONFIG.DURATION_DAYS * 24 * 60 * 60 * 1000;

/** DEV-only: overrides the trial start date for testing trial states. */
const DEV_OVERRIDE_KEY = 'ascend_trial_override_start';

/**
 * Read and validate a date stored in localStorage.
 */
function getStoredDate(key: string): Date | null {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    const date = new Date(stored);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

/**
 * Parse an anchor date passed by the caller (Date or ISO string).
 */
function parseAnchor(anchor: Date | string | null | undefined): Date | null {
  if (!anchor) return null;
  const date = anchor instanceof Date ? anchor : new Date(anchor);
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Get the stored device-level trial start date (local-only mode).
 */
function getTrialStart(): Date | null {
  return getStoredDate(TRIAL_CONFIG.STORAGE_KEY);
}

/**
 * Store the device-level trial start date.
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
   * Start the device-level trial if not already started.
   * Only relevant in local-only mode — signed-in users are anchored to
   * their account creation date instead.
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
   * @param anchor - Trial start anchor for signed-in users (account
   *   creation date). When omitted or invalid, falls back to the
   *   device-level localStorage start date.
   */
  getTrialStatus(anchor?: Date | string | null): TrialStatus {
    const devOverride = import.meta.env.DEV ? getStoredDate(DEV_OVERRIDE_KEY) : null;
    const startedAt = devOverride ?? parseAnchor(anchor) ?? getTrialStart();

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
   * @param anchor - Optional account-creation anchor (see getTrialStatus)
   */
  isInTrial(anchor?: Date | string | null): boolean {
    return this.getTrialStatus(anchor).isActive;
  },

  /**
   * Check if trial has been used and expired.
   * @param anchor - Optional account-creation anchor (see getTrialStatus)
   */
  hasTrialExpired(anchor?: Date | string | null): boolean {
    return this.getTrialStatus(anchor).hasExpired;
  },

  /**
   * Get days remaining in trial.
   * Returns 0 if trial expired or not started.
   * @param anchor - Optional account-creation anchor (see getTrialStatus)
   */
  getDaysRemaining(anchor?: Date | string | null): number {
    return this.getTrialStatus(anchor).daysRemaining;
  },

  /**
   * Reset trial (for testing/development only).
   * Clears both the device-level start date and the DEV override.
   */
  resetTrial(): void {
    if (import.meta.env.DEV) {
      try {
        localStorage.removeItem(TRIAL_CONFIG.STORAGE_KEY);
        localStorage.removeItem(DEV_OVERRIDE_KEY);
        log.debug('Trial reset (dev only)');
      } catch {
        // Ignore
      }
    }
  },

  /**
   * Force expire trial (for testing/development only).
   * Writes the DEV override so it applies to account-anchored trials too.
   */
  forceExpireTrial(): void {
    if (import.meta.env.DEV) {
      const expiredStart = new Date(
        Date.now() - (TRIAL_CONFIG.DURATION_DAYS + 1) * 24 * 60 * 60 * 1000
      );
      try {
        localStorage.setItem(DEV_OVERRIDE_KEY, expiredStart.toISOString());
        log.debug('Trial force expired (dev only)');
      } catch {
        // Ignore
      }
    }
  },

  /**
   * Simulate a trial that started N days ago (for testing/development only).
   * Useful for testing the trial-ending countdown states.
   */
  setTrialStartedDaysAgo(days: number): void {
    if (import.meta.env.DEV) {
      const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      try {
        localStorage.setItem(DEV_OVERRIDE_KEY, start.toISOString());
        log.debug('Trial start overridden (dev only)', { daysAgo: days });
      } catch {
        // Ignore
      }
    }
  },
};
