import { Calendar, Target, ArrowRight, TrendingUp, Layers, Lock } from 'lucide-react';
import { Button } from '@/components/ui';
import { useSyncedPreferences, useEntitlement } from '@/contexts';
import type { ProgressionMode } from '@/types';

interface CycleTypeSelectorProps {
  onSelectTraining: (mode: ProgressionMode) => void;
  onSelectMaxTesting: () => void;
  onCancel: () => void;
}

export function CycleTypeSelector({
  onSelectTraining,
  onSelectMaxTesting,
  onCancel,
}: CycleTypeSelectorProps) {
  const { preferences } = useSyncedPreferences();
  const { canAccessAdvanced, canUseTrialForAdvanced, showPaywall, trial, purchase } =
    useEntitlement();

  // User can access advanced features if:
  // 1. They have an Advanced purchase, OR
  // 2. They're in their free trial, OR
  // 3. Their app mode preference is Advanced AND they have access
  const isAdvancedMode = preferences.appMode === 'advanced';
  const canUseAdvancedCycles = canAccessAdvanced && isAdvancedMode;

  // Handler for locked options
  const handleLockedClick = () => {
    if (!canAccessAdvanced) {
      // User needs to purchase/subscribe or can use their trial
      const reason = canUseTrialForAdvanced
        ? 'standard_can_use_trial'
        : purchase?.tier === 'standard'
          ? 'standard_only'
          : trial.hasExpired
            ? 'trial_expired'
            : 'not_purchased';
      showPaywall('advanced', reason);
    } else {
      // User has access but is in Standard mode - they can switch in Settings
      // Check if they can use trial for advanced
      const reason = canUseTrialForAdvanced ? 'standard_can_use_trial' : 'standard_only';
      showPaywall('advanced', reason);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          What would you like to create?
        </h2>
        <p className="text-gray-500 dark:text-gray-400">Choose the type of cycle to set up</p>
      </div>

      <div className="space-y-3">
        {/* RFEM Training Cycle Option - Always visible */}
        <button
          onClick={() => onSelectTraining('rfem')}
          className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-dark-border hover:border-primary-500 dark:hover:border-primary-500 bg-white dark:bg-dark-surface transition-colors text-left group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  RFEM Training Cycle
                </h3>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Periodized progression based on your max reps. Targets calculated automatically
                using RFEM percentages.
              </p>
            </div>
          </div>
        </button>

        {/* Max Testing Option - Always visible, grouped with RFEM */}
        <button
          onClick={onSelectMaxTesting}
          className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-dark-border hover:border-purple-500 dark:hover:border-purple-500 bg-white dark:bg-dark-surface transition-colors text-left group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Max Rep Testing</h3>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Establish or re-test your maximum reps for exercises. Includes warmup sets and
                records new maxes automatically.
              </p>
            </div>
          </div>
        </button>

        {/* Simple Progression Cycle Option - Show locked if not advanced */}
        {canUseAdvancedCycles ? (
          <button
            onClick={() => onSelectTraining('simple')}
            className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-dark-border hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-dark-surface transition-colors text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Simple Progression Cycle
                  </h3>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Set your own rep targets for each exercise. Optionally add reps each workout or
                  week.
                </p>
              </div>
            </div>
          </button>
        ) : (
          <button
            onClick={handleLockedClick}
            className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface transition-colors text-left group opacity-60 hover:opacity-80"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-500 dark:text-gray-400">
                    Simple Progression Cycle
                  </h3>
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                    Advanced
                  </span>
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Set your own rep targets for each exercise. Optionally add reps each workout or
                  week.
                </p>
              </div>
            </div>
          </button>
        )}

        {/* Mixed Cycle Option - Show locked if not advanced */}
        {canUseAdvancedCycles ? (
          <button
            onClick={() => onSelectTraining('mixed')}
            className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-dark-border hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-dark-surface transition-colors text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Mixed Cycle</h3>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Configure RFEM or simple progression individually for each exercise. Best for
                  combining different training approaches.
                </p>
              </div>
            </div>
          </button>
        ) : (
          <button
            onClick={handleLockedClick}
            className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface transition-colors text-left group opacity-60 hover:opacity-80"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-500 dark:text-gray-400">Mixed Cycle</h3>
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                    Advanced
                  </span>
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Configure RFEM or simple progression individually for each exercise. Best for
                  combining different training approaches.
                </p>
              </div>
            </div>
          </button>
        )}
      </div>

      <div className="pt-4">
        <Button variant="ghost" onClick={onCancel} className="w-full">
          Cancel
        </Button>
      </div>
    </div>
  );
}
