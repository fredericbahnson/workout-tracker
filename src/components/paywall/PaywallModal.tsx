/**
 * Paywall Modal
 *
 * Displays when user tries to access a locked feature.
 * On native (iOS), this will show purchase options.
 * On web, it shows information about the iOS app.
 */

import { useState, useEffect } from 'react';
import { Modal, Button } from '@/components/ui';
import { useEntitlement, useSyncedPreferences } from '@/contexts';
import { entitlementService } from '@/services/entitlementService';
import { iapService, type OfferingInfo } from '@/services/iapService';
import { Check, Lock, Star, Zap, Clock, ExternalLink, Loader2, Settings } from 'lucide-react';
import type { PurchaseTier, LockReason } from '@/types';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredTier: PurchaseTier;
  reason: LockReason | null;
}

export function PaywallModal({ isOpen, onClose, requiredTier, reason }: PaywallModalProps) {
  const { trial, purchase, isNativePlatform, refreshEntitlement } = useEntitlement();
  const { preferences, setAppMode } = useSyncedPreferences();

  // State for IAP
  const [offerings, setOfferings] = useState<OfferingInfo[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has paid for Advanced but is in Standard mode
  // They just need to switch app mode, no purchase needed
  const hasPurchasedAdvanced = purchase?.tier === 'advanced';
  const isInStandardMode = preferences.appMode === 'standard';
  const canSwitchToAdvanced = hasPurchasedAdvanced && isInStandardMode;

  // Check if user is in trial and using standard mode (can enable advanced for free)
  // Don't show this option when reason is 'not_purchased' - user explicitly wants to purchase
  const canEnableAdvancedForFree =
    !canSwitchToAdvanced &&
    trial.isActive &&
    preferences.appMode === 'standard' &&
    reason !== 'not_purchased';

  // Handle enabling advanced mode for free during trial
  const handleEnableAdvanced = async () => {
    setLoading(true);
    try {
      await setAppMode('advanced');
      onClose();
    } catch {
      setError('Failed to enable advanced mode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load offerings when modal opens on native platform
  useEffect(() => {
    if (isOpen && isNativePlatform) {
      const loadOfferings = async () => {
        try {
          const result = await iapService.getOfferings();
          setOfferings(result);
        } catch {
          // Offerings failed to load - will show placeholder prices
        }
      };
      loadOfferings();
    }
  }, [isOpen, isNativePlatform]);

  // Handle purchase
  const handlePurchase = async (packageId: string) => {
    setLoading(true);
    setError(null);

    try {
      await iapService.purchase(packageId);
      await refreshEntitlement();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Purchase failed. Please try again.';
      // Don't show error for user cancellation
      if (!message.includes('cancel')) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle restore purchases
  const handleRestore = async () => {
    setLoading(true);
    setError(null);

    try {
      const purchaseInfo = await iapService.restorePurchases();
      await refreshEntitlement();
      if (purchaseInfo) {
        onClose();
      } else {
        setError('No purchases found to restore.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get package price from offerings
  const getPackagePrice = (packageId: string): string | null => {
    if (!offerings) return null;
    for (const offering of offerings) {
      const pkg = offering.packages.find(p => p.identifier === packageId);
      if (pkg) return pkg.priceString;
    }
    return null;
  };

  // Handle switching to advanced mode (for users who already purchased)
  const handleSwitchToAdvanced = async () => {
    setLoading(true);
    try {
      await setAppMode('advanced');
      onClose();
    } catch {
      setError('Failed to switch to advanced mode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get contextual messages
  const title = canSwitchToAdvanced
    ? 'Switch to Advanced Mode?'
    : canEnableAdvancedForFree
      ? 'Advanced Mode Required'
      : getTitle(reason);
  const message = canSwitchToAdvanced
    ? 'You have already purchased Advanced. Would you like to enable Advanced mode to access this feature?'
    : canEnableAdvancedForFree
      ? 'This feature requires Advanced mode. You can turn it on for free in Settings during your free trial.'
      : reason
        ? entitlementService.getLockMessage(reason)
        : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        {/* Status message */}
        <div className="text-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              canSwitchToAdvanced
                ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                : 'bg-gradient-to-br from-amber-500 to-orange-500'
            }`}
          >
            {canSwitchToAdvanced ? (
              <Zap className="w-8 h-8 text-white" />
            ) : canEnableAdvancedForFree ? (
              <Settings className="w-8 h-8 text-white" />
            ) : (
              <Lock className="w-8 h-8 text-white" />
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
        </div>

        {/* Trial status banner - don't show if user already purchased */}
        {!canSwitchToAdvanced && trial.hasExpired && (
          <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-600/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-200">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">Your 4-week free trial has ended.</p>
            </div>
          </div>
        )}

        {!canSwitchToAdvanced && trial.isActive && !canEnableAdvancedForFree && (
          <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-600/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-200">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">
                {trial.daysRemaining} day{trial.daysRemaining !== 1 ? 's' : ''} left in your free
                trial.
              </p>
            </div>
          </div>
        )}

        {/* Feature comparison - show both tiers when not specifically requiring advanced */}
        {!canSwitchToAdvanced &&
          !canEnableAdvancedForFree &&
          requiredTier !== 'advanced' &&
          reason !== 'standard_only' && (
            <div className="space-y-4">
              {/* Standard tier */}
              <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Standard</h3>
                  {isNativePlatform && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                      {getPackagePrice('standard') || ''}
                    </span>
                  )}
                </div>
                <ul className="space-y-2 text-sm">
                  <FeatureItem included>RFEM Training Cycles</FeatureItem>
                  <FeatureItem included>Max Rep Testing</FeatureItem>
                  <FeatureItem included>Cloud Sync</FeatureItem>
                  <FeatureItem included>Progress Tracking</FeatureItem>
                  <FeatureItem included={false}>Simple Progression Cycles</FeatureItem>
                  <FeatureItem included={false}>Mixed Cycles</FeatureItem>
                </ul>
              </div>

              {/* Advanced tier */}
              <div className="border-2 border-purple-500 rounded-lg p-4 bg-purple-500/10">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Advanced</h3>
                  <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded ml-auto">
                    {isNativePlatform
                      ? getPackagePrice('advanced') || 'Full Access'
                      : 'Full Access'}
                  </span>
                </div>
                <ul className="space-y-2 text-sm">
                  <FeatureItem included>Everything in Standard</FeatureItem>
                  <FeatureItem included highlight>
                    Simple Progression Cycles
                  </FeatureItem>
                  <FeatureItem included highlight>
                    Mixed Mode Cycles
                  </FeatureItem>
                  <FeatureItem included highlight>
                    Future premium features
                  </FeatureItem>
                </ul>
              </div>
            </div>
          )}

        {/* Advanced only - when specifically requiring advanced tier */}
        {!canSwitchToAdvanced &&
          !canEnableAdvancedForFree &&
          (requiredTier === 'advanced' || reason === 'standard_only') && (
            <div className="border-2 border-purple-500 rounded-lg p-4 bg-purple-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Advanced</h3>
                <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded ml-auto">
                  {isNativePlatform ? getPackagePrice('advanced') || 'Full Access' : 'Full Access'}
                </span>
              </div>
              <ul className="space-y-2 text-sm">
                <FeatureItem included>Everything in Standard</FeatureItem>
                <FeatureItem included highlight>
                  Simple Progression Cycles
                </FeatureItem>
                <FeatureItem included highlight>
                  Mixed Mode Cycles
                </FeatureItem>
                <FeatureItem included highlight>
                  Future premium features
                </FeatureItem>
              </ul>
            </div>
          )}

        {/* Error message */}
        {error && (
          <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-3">
            <p className="text-sm text-red-200 text-center">{error}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          {canSwitchToAdvanced ? (
            // User has purchased Advanced but is in Standard mode - just offer to switch
            <Button
              onClick={handleSwitchToAdvanced}
              className="w-full"
              variant="primary"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              <Zap className="w-4 h-4 mr-2" />
              Enable Advanced Mode
            </Button>
          ) : canEnableAdvancedForFree ? (
            // User is in trial with standard mode - offer to enable advanced for free
            <>
              <Button
                onClick={handleEnableAdvanced}
                className="w-full"
                variant="primary"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Enable Advanced Trial
              </Button>
              {isNativePlatform && (
                <Button
                  onClick={() => handlePurchase('advanced')}
                  className="w-full"
                  variant="secondary"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {getPackagePrice('advanced') || 'Purchase Advanced'}
                </Button>
              )}
            </>
          ) : isNativePlatform ? (
            // Native: Show purchase buttons based on required tier
            <>
              {/* Show both options when not specifically requiring advanced */}
              {requiredTier !== 'advanced' && reason !== 'standard_only' && (
                <>
                  <Button
                    onClick={() => handlePurchase('advanced')}
                    className="w-full"
                    variant="primary"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    <Zap className="w-4 h-4 mr-2" />
                    {getPackagePrice('advanced') || 'Get Advanced'}
                  </Button>
                  <Button
                    onClick={() => handlePurchase('standard')}
                    className="w-full"
                    variant="secondary"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    <Star className="w-4 h-4 mr-2" />
                    {getPackagePrice('standard') || 'Get Standard'}
                  </Button>
                </>
              )}
              {/* Show only advanced option when requiring advanced tier */}
              {(requiredTier === 'advanced' || reason === 'standard_only') && (
                <Button
                  onClick={() => handlePurchase('advanced')}
                  className="w-full"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  <Zap className="w-4 h-4 mr-2" />
                  {reason === 'standard_only'
                    ? getPackagePrice('advanced') || 'Upgrade to Advanced'
                    : getPackagePrice('advanced') || 'Get Advanced'}
                </Button>
              )}
              <Button onClick={handleRestore} variant="ghost" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Restore Purchases
              </Button>
            </>
          ) : (
            // Web: Direct to App Store (placeholder)
            <>
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                Purchases are available in the iOS app.
              </div>
              <Button
                onClick={() => {
                  // TODO: Link to App Store when available
                  onClose();
                }}
                className="w-full"
                variant="primary"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Get the iOS App
              </Button>
            </>
          )}

          <Button onClick={onClose} variant="ghost" className="w-full" disabled={loading}>
            {canSwitchToAdvanced || canEnableAdvancedForFree ? 'Cancel' : 'Maybe Later'}
          </Button>
        </div>

        {/* Legal links placeholder */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-500">
          <button className="hover:underline">Terms of Service</button>
          {' · '}
          <button className="hover:underline">Privacy Policy</button>
          {' · '}
          <button className="hover:underline">Restore Purchases</button>
        </div>
      </div>
    </Modal>
  );
}

function FeatureItem({
  children,
  included,
  highlight = false,
}: {
  children: React.ReactNode;
  included: boolean;
  highlight?: boolean;
}) {
  return (
    <li className="flex items-center gap-2">
      <Check
        className={`w-4 h-4 flex-shrink-0 ${
          included ? (highlight ? 'text-purple-400' : 'text-green-400') : 'text-gray-600'
        }`}
      />
      <span className={included ? '' : 'text-gray-500 line-through'}>{children}</span>
    </li>
  );
}

function getTitle(reason: LockReason | null): string {
  switch (reason) {
    case 'trial_expired':
      return 'Trial Ended';
    case 'standard_only':
      return 'Upgrade Required';
    case 'not_purchased':
      return 'Premium Feature';
    default:
      return 'Unlock Feature';
  }
}
