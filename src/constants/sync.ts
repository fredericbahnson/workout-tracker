/**
 * Sync and Retry Constants
 *
 * Configuration values for cloud synchronization and retry logic.
 * Used by syncService for exponential backoff and queue processing.
 */

// =============================================================================
// Retry Configuration
// =============================================================================

/** Maximum number of retry attempts before giving up on a sync operation */
export const MAX_RETRY_COUNT = 5;

/** Base delay in milliseconds for exponential backoff (doubles each retry) */
export const RETRY_BASE_MS = 1000;

/** Maximum delay in milliseconds for exponential backoff */
export const RETRY_MAX_MS = 30000;

/**
 * Calculate retry delay with exponential backoff.
 * @param retryCount - Current retry attempt (1-based)
 * @returns Delay in milliseconds
 */
export function calculateRetryDelay(retryCount: number): number {
  return Math.min(RETRY_BASE_MS * Math.pow(2, retryCount - 1), RETRY_MAX_MS);
}
