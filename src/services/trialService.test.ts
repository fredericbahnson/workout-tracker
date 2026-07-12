/**
 * Regression tests for trial anchoring.
 *
 * The trial must be per-USER (anchored to the account creation date), not
 * per-device: a new account created on a device with old app state must get
 * a fresh 28-day trial, and the stale device-level localStorage start date
 * must be ignored for signed-in users.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trialService } from './trialService';
import { TRIAL_CONFIG } from '@/types/entitlement';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEV_OVERRIDE_KEY = 'ascend_trial_override_start';

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

/** Configure the localStorage stub (src/test/setup.ts) with stored values. */
function setStoredDates(entries: Record<string, string>) {
  vi.mocked(localStorage.getItem).mockImplementation(key => entries[key] ?? null);
}

beforeEach(() => {
  vi.mocked(localStorage.getItem).mockReturnValue(null);
});

describe('trialService account anchoring', () => {
  it('REGRESSION: a fresh account gets a full trial even with a stale device start date', () => {
    // Device has an expired device-level trial from months ago
    setStoredDates({ [TRIAL_CONFIG.STORAGE_KEY]: daysAgo(200).toISOString() });

    // Account created today — anchor wins over the stale device date
    const status = trialService.getTrialStatus(new Date().toISOString());

    expect(status.isActive).toBe(true);
    expect(status.hasExpired).toBe(false);
    expect(status.daysRemaining).toBe(TRIAL_CONFIG.DURATION_DAYS);
  });

  it('expires the trial based on the account age, not device state', () => {
    // Device has NO trial state at all; account is older than the trial window
    const status = trialService.getTrialStatus(daysAgo(TRIAL_CONFIG.DURATION_DAYS + 1));

    expect(status.hasExpired).toBe(true);
    expect(status.isActive).toBe(false);
    expect(status.daysRemaining).toBe(0);
  });

  it('accepts the anchor as an ISO string (Supabase user.created_at shape)', () => {
    const status = trialService.getTrialStatus(daysAgo(10).toISOString());
    expect(status.isActive).toBe(true);
    expect(status.daysRemaining).toBe(TRIAL_CONFIG.DURATION_DAYS - 10);
  });

  it('falls back to the device-level start date when no anchor is given (local-only mode)', () => {
    setStoredDates({ [TRIAL_CONFIG.STORAGE_KEY]: daysAgo(20).toISOString() });
    const status = trialService.getTrialStatus();
    expect(status.isActive).toBe(true);
    expect(status.daysRemaining).toBe(TRIAL_CONFIG.DURATION_DAYS - 20);
  });

  it('falls back to the device-level start date when the anchor is invalid', () => {
    setStoredDates({ [TRIAL_CONFIG.STORAGE_KEY]: daysAgo(5).toISOString() });
    const status = trialService.getTrialStatus('not-a-date');
    expect(status.daysRemaining).toBe(TRIAL_CONFIG.DURATION_DAYS - 5);
  });

  it('reports never-started when there is no anchor and no device state', () => {
    const status = trialService.getTrialStatus();
    expect(status.isActive).toBe(false);
    expect(status.hasExpired).toBe(false);
    expect(status.startedAt).toBe(null);
  });

  it('DEV override takes precedence over the account anchor (for testing trial states)', () => {
    // import.meta.env.DEV is true under vitest, so the override branch is live
    setStoredDates({ [DEV_OVERRIDE_KEY]: daysAgo(TRIAL_CONFIG.DURATION_DAYS + 1).toISOString() });
    const status = trialService.getTrialStatus(new Date());
    expect(status.hasExpired).toBe(true);
  });
});
