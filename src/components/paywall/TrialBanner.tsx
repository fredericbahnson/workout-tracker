/**
 * Trial Banner
 *
 * Displays trial status at the top of the app or in settings.
 * Shows days remaining and prompts to subscribe as trial ends.
 */

import { useEntitlement, useSyncedPreferences } from '@/contexts';
import { Clock, Zap, AlertTriangle, ChevronRight } from 'lucide-react';

interface TrialBannerProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function TrialBanner({ variant = 'compact', className = '' }: TrialBannerProps) {
  const { trial, purchase, canUseTrialForAdvanced, showPaywall } = useEntitlement();
  const { preferences } = useSyncedPreferences();
  const isInAdvancedMode = preferences.appMode === 'advanced';

  // Don't show if user has advanced purchase (they have full access)
  if (purchase?.tier === 'advanced') {
    return null;
  }

  // Standard purchaser with active trial
  if (purchase?.tier === 'standard' && trial.isActive) {
    // Already using advanced mode via trial - show active trial status
    if (isInAdvancedMode) {
      if (variant === 'compact') {
        return (
          <div
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
              bg-purple-100 text-purple-700
              dark:bg-purple-500/20 dark:text-purple-300
              ${className}
            `}
          >
            <Zap className="w-3 h-3" />
            <span>
              Advanced trial: {trial.daysRemaining} day{trial.daysRemaining !== 1 ? 's' : ''} left
            </span>
          </div>
        );
      }

      // Full variant - show trial is active with upgrade option
      return (
        <button
          onClick={() => showPaywall('advanced', 'standard_only')}
          className={`
            w-full text-left rounded-lg p-4
            bg-purple-50 border border-purple-200
            dark:bg-purple-900/30 dark:border-purple-600/30
            hover:bg-purple-100 dark:hover:bg-purple-900/50
            transition-colors cursor-pointer
            ${className}
          `}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/30 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-purple-800 dark:text-purple-200">
                Advanced Trial Active
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {trial.daysRemaining} day{trial.daysRemaining !== 1 ? 's' : ''} remaining. All
                Advanced features are unlocked.
              </p>
              <span className="inline-flex items-center mt-2 text-sm text-purple-600 dark:text-purple-400 font-medium">
                Upgrade to keep access
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </span>
            </div>
          </div>
        </button>
      );
    }

    // In standard mode - offer to try advanced (if trial available)
    if (canUseTrialForAdvanced) {
      if (variant === 'compact') {
        return (
          <button
            onClick={() => showPaywall('advanced', 'standard_can_use_trial')}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
              transition-colors
              bg-purple-100 text-purple-700 hover:bg-purple-200
              dark:bg-purple-500/20 dark:text-purple-300 dark:hover:bg-purple-500/30
              ${className}
            `}
          >
            <Clock className="w-3 h-3" />
            <span>
              {trial.daysRemaining} day{trial.daysRemaining !== 1 ? 's' : ''} Advanced trial
            </span>
          </button>
        );
      }

      // Full variant for standard purchasers
      return (
        <div
          className={`
            rounded-lg p-4
            bg-purple-50 border border-purple-200
            dark:bg-purple-900/30 dark:border-purple-600/30
            ${className}
          `}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/30 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-purple-800 dark:text-purple-200">
                Advanced Trial Available
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {trial.daysRemaining} day{trial.daysRemaining !== 1 ? 's' : ''} left to try Advanced
                features like Simple and Mixed cycles.
              </p>
              <button
                onClick={() => showPaywall('advanced', 'standard_can_use_trial')}
                className="mt-3 px-4 py-1.5 bg-purple-500 hover:bg-purple-600 text-white font-medium text-sm rounded-lg transition-colors"
              >
                Try Advanced
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Standard purchaser with expired trial - don't show banner
    return null;
  }

  // Don't show for standard purchasers with expired trial
  if (purchase?.tier === 'standard') {
    return null;
  }

  // Trial active (no purchase)
  if (trial.isActive) {
    const isEnding = trial.daysRemaining <= 7;

    if (variant === 'compact') {
      return (
        <button
          onClick={() => showPaywall('advanced', 'not_purchased')}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
            transition-colors
            ${
              isEnding
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500/30'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/30'
            }
            ${className}
          `}
        >
          <Clock className="w-3 h-3" />
          <span>
            {trial.daysRemaining} day{trial.daysRemaining !== 1 ? 's' : ''} left
          </span>
        </button>
      );
    }

    // Full variant
    return (
      <div
        className={`
          rounded-lg p-4
          ${
            isEnding
              ? 'bg-amber-50 border border-amber-200 dark:bg-amber-900/30 dark:border-amber-600/30'
              : 'bg-blue-50 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-600/30'
          }
          ${className}
        `}
      >
        <div className="flex items-start gap-3">
          <div
            className={`
            w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
            ${isEnding ? 'bg-amber-100 dark:bg-amber-500/30' : 'bg-blue-100 dark:bg-blue-500/30'}
          `}
          >
            {isEnding ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            ) : (
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div className="flex-1">
            <h3
              className={`font-medium ${isEnding ? 'text-amber-800 dark:text-amber-200' : 'text-blue-800 dark:text-blue-200'}`}
            >
              {isEnding ? 'Trial Ending Soon' : 'Free Trial Active'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {trial.daysRemaining} day{trial.daysRemaining !== 1 ? 's' : ''} remaining.{' '}
              {isEnding
                ? 'Subscribe now to keep all features.'
                : 'Enjoy full access to all features.'}
            </p>
            <button
              onClick={() => showPaywall('standard', 'not_purchased')}
              className={`mt-3 px-4 py-1.5 font-medium text-sm rounded-lg transition-colors ${
                isEnding
                  ? 'bg-amber-500 hover:bg-amber-600 text-white dark:text-black'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isEnding ? 'View Plans' : 'Buy Now'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Trial expired
  if (trial.hasExpired) {
    if (variant === 'compact') {
      return (
        <button
          onClick={() => showPaywall('advanced', 'trial_expired')}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
            bg-red-100 text-red-700 hover:bg-red-200
            dark:bg-red-500/20 dark:text-red-300 dark:hover:bg-red-500/30
            transition-colors
            ${className}
          `}
        >
          <AlertTriangle className="w-3 h-3" />
          <span>Trial Expired</span>
        </button>
      );
    }

    // Full variant
    return (
      <div
        className={`
          rounded-lg p-4 
          bg-red-50 border border-red-200 
          dark:bg-red-900/30 dark:border-red-600/30 
          ${className}
        `}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-red-800 dark:text-red-200">Trial Ended</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Your free trial has ended. Subscribe to continue using Ascend.
            </p>
            <button
              onClick={() => showPaywall('advanced', 'trial_expired')}
              className="mt-3 px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white font-medium text-sm rounded-lg transition-colors"
            >
              View Plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No trial started yet (shouldn't happen in normal flow)
  return null;
}
