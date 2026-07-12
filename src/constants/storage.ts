/**
 * localStorage keys shared across modules.
 */

/**
 * Device-level record that the person using this device acknowledged the
 * health disclaimer. Kept alongside the synced preference field so the
 * acknowledgment survives clearLocalDatabase() on sign-in.
 *
 * LEGAL: must be removed on sign-out so a different person signing in on
 * this device gets their own hard-stop disclaimer.
 */
export const HEALTH_DISCLAIMER_STORAGE_KEY = 'ascend-health-disclaimer-acknowledged';
