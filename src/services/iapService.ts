/**
 * In-App Purchase Service
 *
 * RevenueCat integration for iOS App Store purchases.
 * Only initializes on native platforms (iOS/Android).
 */

import { Capacitor } from '@capacitor/core';
import type { PurchaseInfo, PurchaseTier } from '@/types/entitlement';
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('IAP');

const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || '';

/** RevenueCat SDK types (dynamically imported) */
type Purchases = typeof import('@revenuecat/purchases-capacitor').Purchases;
type PurchasesOfferings = import('@revenuecat/purchases-capacitor').PurchasesOfferings;
type PurchasesPackage = import('@revenuecat/purchases-capacitor').PurchasesPackage;
type CustomerInfo = import('@revenuecat/purchases-capacitor').CustomerInfo;

/** Offering info for UI display */
export interface OfferingInfo {
  identifier: string;
  packages: PackageInfo[];
}

/** Package info for UI display */
export interface PackageInfo {
  identifier: string;
  productId: string;
  priceString: string;
  productTitle: string;
  productDescription: string;
}

class IAPService {
  private purchases: Purchases | null = null;
  private initialized = false;
  private isNative: boolean;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  /**
   * Initialize RevenueCat SDK.
   * Only initializes on native platforms.
   */
  async initialize(): Promise<void> {
    if (!this.isNative) {
      log.debug('Skipping initialization - not on native platform');
      return;
    }

    if (this.initialized) {
      log.debug('Already initialized');
      return;
    }

    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      this.purchases = Purchases;

      await Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
      });

      this.initialized = true;
      log.debug('RevenueCat initialized successfully');
    } catch (error) {
      log.error('Failed to initialize RevenueCat', { error });
      throw error;
    }
  }

  /**
   * Check if IAP is available (native platform and initialized).
   */
  isAvailable(): boolean {
    return this.isNative && this.initialized && this.purchases !== null;
  }

  /**
   * Get current purchase info from RevenueCat.
   * Returns null if no active purchase or not available.
   */
  async getPurchaseInfo(): Promise<PurchaseInfo | null> {
    if (!this.isAvailable() || !this.purchases) {
      log.debug('getPurchaseInfo: IAP not available');
      return null;
    }

    try {
      const { customerInfo } = await this.purchases.getCustomerInfo();
      log.debug('Customer info - ID:', customerInfo.originalAppUserId);
      log.debug(
        'Customer info - Active entitlements:',
        Object.keys(customerInfo.entitlements.active)
      );

      const purchaseInfo = this.mapCustomerInfoToPurchaseInfo(customerInfo);
      log.debug('Mapped purchase info:', purchaseInfo);

      return purchaseInfo;
    } catch (error) {
      log.error('Failed to get purchase info', { error });
      return null;
    }
  }

  /**
   * Get available offerings/products for purchase.
   */
  async getOfferings(): Promise<OfferingInfo[] | null> {
    if (!this.isAvailable() || !this.purchases) {
      return null;
    }

    try {
      const offerings = await this.purchases.getOfferings();
      return this.mapOfferings(offerings);
    } catch (error) {
      log.error('Failed to get offerings', { error });
      return null;
    }
  }

  /**
   * Execute a purchase for the given package ID.
   */
  async purchase(packageId: string): Promise<PurchaseInfo | null> {
    if (!this.isAvailable() || !this.purchases) {
      throw new Error('IAP not available');
    }

    try {
      // Get current offerings to find the package
      const offerings = await this.purchases.getOfferings();
      const pkg = this.findPackageById(offerings, packageId);

      if (!pkg) {
        throw new Error(`Package not found: ${packageId}`);
      }

      const { customerInfo } = await this.purchases.purchasePackage({
        aPackage: pkg,
      });

      return this.mapCustomerInfoToPurchaseInfo(customerInfo);
    } catch (error) {
      log.error('Purchase failed', { error });
      throw error;
    }
  }

  /**
   * Restore previous purchases.
   */
  async restorePurchases(): Promise<PurchaseInfo | null> {
    if (!this.isAvailable() || !this.purchases) {
      throw new Error('IAP not available');
    }

    try {
      const { customerInfo } = await this.purchases.restorePurchases();

      // Log detailed info for debugging
      log.debug('Restore result - Customer ID:', customerInfo.originalAppUserId);
      log.debug(
        'Restore result - Active entitlements:',
        Object.keys(customerInfo.entitlements.active)
      );

      const purchaseInfo = this.mapCustomerInfoToPurchaseInfo(customerInfo);
      log.debug('Mapped purchase info:', purchaseInfo);

      return purchaseInfo;
    } catch (error) {
      log.error('Restore purchases failed', { error });
      throw error;
    }
  }

  /**
   * Associate a Supabase user ID with RevenueCat.
   */
  async setUserId(userId: string): Promise<void> {
    if (!this.isAvailable() || !this.purchases) {
      return;
    }

    try {
      await this.purchases.logIn({ appUserID: userId });
      log.debug('User ID set', { userId });
    } catch (error) {
      log.error('Failed to set user ID', { error, userId });
      throw error;
    }
  }

  /**
   * Clear user ID on logout.
   */
  async clearUserId(): Promise<void> {
    if (!this.isAvailable() || !this.purchases) {
      return;
    }

    try {
      await this.purchases.logOut();
      log.debug('User ID cleared');
    } catch (error) {
      log.error('Failed to clear user ID', { error });
      throw error;
    }
  }

  /**
   * Map RevenueCat CustomerInfo to our PurchaseInfo type.
   * Checks for 'advanced' entitlement first, then 'standard'.
   */
  private mapCustomerInfoToPurchaseInfo(customerInfo: CustomerInfo): PurchaseInfo | null {
    const entitlements = customerInfo.entitlements.active;

    // Check for advanced entitlement first
    if (entitlements['advanced']) {
      return this.createPurchaseInfo(entitlements['advanced'], 'advanced');
    }

    // Then check for standard entitlement
    if (entitlements['standard']) {
      return this.createPurchaseInfo(entitlements['standard'], 'standard');
    }

    // No active entitlements
    return null;
  }

  /**
   * Create PurchaseInfo from RevenueCat entitlement.
   */
  private createPurchaseInfo(
    entitlement: {
      latestPurchaseDate: string;
      expirationDate: string | null;
      willRenew: boolean;
      productIdentifier: string;
    },
    tier: PurchaseTier
  ): PurchaseInfo {
    const expiresAt = entitlement.expirationDate ? new Date(entitlement.expirationDate) : null;

    return {
      tier,
      type: expiresAt ? 'subscription' : 'lifetime',
      purchasedAt: new Date(entitlement.latestPurchaseDate),
      expiresAt,
      willRenew: entitlement.willRenew,
      productId: entitlement.productIdentifier,
    };
  }

  /**
   * Map RevenueCat offerings to our OfferingInfo type.
   */
  private mapOfferings(offerings: PurchasesOfferings): OfferingInfo[] {
    const result: OfferingInfo[] = [];

    // Map current offering first if it exists
    if (offerings.current) {
      result.push(this.mapSingleOffering(offerings.current));
    }

    // Map all other offerings
    if (offerings.all) {
      for (const [identifier, offering] of Object.entries(offerings.all)) {
        // Skip if already added as current
        if (offerings.current?.identifier === identifier) {
          continue;
        }
        result.push(this.mapSingleOffering(offering));
      }
    }

    return result;
  }

  /**
   * Map a single RevenueCat offering.
   */
  private mapSingleOffering(offering: {
    identifier: string;
    availablePackages: PurchasesPackage[];
  }): OfferingInfo {
    return {
      identifier: offering.identifier,
      packages: offering.availablePackages.map(pkg => ({
        identifier: pkg.identifier,
        productId: pkg.product.identifier,
        priceString: pkg.product.priceString,
        productTitle: pkg.product.title,
        productDescription: pkg.product.description,
      })),
    };
  }

  /**
   * Find a package by ID across all offerings.
   */
  private findPackageById(
    offerings: PurchasesOfferings,
    packageId: string
  ): PurchasesPackage | null {
    // Check current offering first
    if (offerings.current) {
      const pkg = offerings.current.availablePackages.find(p => p.identifier === packageId);
      if (pkg) return pkg;
    }

    // Check all offerings
    if (offerings.all) {
      for (const offering of Object.values(offerings.all)) {
        const pkg = offering.availablePackages.find(p => p.identifier === packageId);
        if (pkg) return pkg;
      }
    }

    return null;
  }
}

export const iapService = new IAPService();
