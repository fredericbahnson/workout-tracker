/**
 * Entitlement Sync Service
 *
 * Coordinates between Supabase (remote), local cache, and the app.
 * Provides entitlement data on all platforms (native + web) with
 * offline fallback via local caching.
 *
 * Flow:
 * - Online: Query Supabase, cache result, return
 * - Offline/Error: Fall back to local cache
 * - After purchase: Cache immediately, upsert to Supabase (best-effort)
 */

import { supabase } from '@/data/supabase';
import type { PurchaseInfo } from '@/types/entitlement';
import type { RemoteUserEntitlement } from '@/services/sync/types';
import { entitlementCache } from './entitlementCache';
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('EntitlementSync');

function remoteToLocalPurchaseInfo(remote: RemoteUserEntitlement): PurchaseInfo {
  return {
    tier: remote.tier,
    type: remote.purchase_type,
    purchasedAt: new Date(remote.purchased_at),
    expiresAt: remote.expires_at ? new Date(remote.expires_at) : null,
    willRenew: remote.will_renew,
    productId: remote.product_id ?? undefined,
  };
}

function localToRemoteEntitlement(
  userId: string,
  info: PurchaseInfo
): Omit<RemoteUserEntitlement, 'updated_at'> {
  return {
    user_id: userId,
    tier: info.tier as 'standard' | 'advanced',
    purchase_type: info.type,
    purchased_at: info.purchasedAt.toISOString(),
    expires_at: info.expiresAt ? info.expiresAt.toISOString() : null,
    will_renew: info.willRenew ?? false,
    product_id: info.productId ?? null,
  };
}

export const entitlementSync = {
  /**
   * Get entitlement for a user.
   * Tries Supabase first (when online), falls back to local cache.
   */
  async getEntitlement(userId: string): Promise<PurchaseInfo | null> {
    // Try Supabase first if online
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('user_entitlements')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) {
          // PGRST116 = no rows found, which is a valid "no entitlement" state
          if (error.code === 'PGRST116') {
            log.debug('No entitlement found in Supabase');
            entitlementCache.save(userId, null);
            return null;
          }
          throw error;
        }

        const purchaseInfo = remoteToLocalPurchaseInfo(data as RemoteUserEntitlement);
        entitlementCache.save(userId, purchaseInfo);

        if (entitlementCache.isPurchaseValid(purchaseInfo)) {
          return purchaseInfo;
        }
        return null;
      } catch (error) {
        log.error('Supabase fetch failed, falling back to cache', { error });
        // Fall through to cache
      }
    }

    // Offline or Supabase error: use cache
    const cached = entitlementCache.load(userId);
    if (cached && entitlementCache.isPurchaseValid(cached.purchaseInfo)) {
      log.debug('Using cached entitlement', { isStale: cached.isStale });
      return cached.purchaseInfo;
    }

    return null;
  },

  /**
   * Sync entitlement to Supabase and local cache.
   * Caches immediately, then upserts to Supabase (best-effort).
   */
  async syncToSupabase(userId: string, purchaseInfo: PurchaseInfo): Promise<void> {
    // Always cache locally first
    entitlementCache.save(userId, purchaseInfo);

    if (!navigator.onLine) {
      log.debug('Offline, skipping Supabase sync (cached locally)');
      return;
    }

    try {
      const remote = localToRemoteEntitlement(userId, purchaseInfo);
      const { error } = await supabase.from('user_entitlements').upsert(remote, {
        onConflict: 'user_id',
      });

      if (error) {
        log.error('Failed to upsert entitlement to Supabase', { error });
      } else {
        log.debug('Entitlement synced to Supabase');
      }
    } catch (error) {
      log.error('Supabase sync error', { error });
    }
  },

  /**
   * Force refresh from Supabase, ignoring cache.
   * Returns null if offline or Supabase is unavailable.
   */
  async refreshFromSupabase(userId: string): Promise<PurchaseInfo | null> {
    if (!navigator.onLine) {
      log.debug('Offline, cannot refresh from Supabase');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('user_entitlements')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          entitlementCache.save(userId, null);
          return null;
        }
        throw error;
      }

      const purchaseInfo = remoteToLocalPurchaseInfo(data as RemoteUserEntitlement);
      entitlementCache.save(userId, purchaseInfo);

      if (entitlementCache.isPurchaseValid(purchaseInfo)) {
        return purchaseInfo;
      }
      return null;
    } catch (error) {
      log.error('Failed to refresh from Supabase', { error });
      return null;
    }
  },
};
