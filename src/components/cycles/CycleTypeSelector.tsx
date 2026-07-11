import {
  Calendar,
  Target,
  ArrowRight,
  TrendingUp,
  Layers,
  Lock,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useSyncedPreferences, useEntitlement } from '@/contexts';
import type { ProgressionMode } from '@/types';

interface CycleTypeSelectorProps {
  onSelectTraining: (mode: ProgressionMode) => void;
  onSelectMaxTesting: () => void;
  onCancel: () => void;
}

interface CycleOptionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind gradient classes for the icon tile, e.g. 'from-primary-500 to-primary-600' */
  gradient: string;
  /** Tailwind hover border/arrow color classes, e.g. 'hover:border-primary-500 dark:hover:border-primary-500' */
  hoverBorder: string;
  arrowHover: string;
  locked?: boolean;
  /** Badge shown when locked: which tier unlocks this option */
  lockedBadge?: 'Standard' | 'Advanced';
  onClick: () => void;
}

function CycleOptionCard({
  title,
  description,
  icon: Icon,
  gradient,
  hoverBorder,
  arrowHover,
  locked,
  lockedBadge,
  onClick,
}: CycleOptionCardProps) {
  if (locked) {
    return (
      <button
        onClick={onClick}
        className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface transition-colors text-left group opacity-60 hover:opacity-80"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-500 dark:text-gray-400">{title}</h3>
              <span
                className={
                  lockedBadge === 'Standard'
                    ? 'text-xs bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded'
                    : 'text-xs bg-purple-500/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded'
                }
              >
                {lockedBadge}
              </span>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{description}</p>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl border-2 border-gray-200 dark:border-dark-border ${hoverBorder} bg-white dark:bg-dark-surface transition-colors text-left group`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            <ArrowRight className={`w-5 h-5 text-gray-400 ${arrowHover} transition-colors`} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
}

export function CycleTypeSelector({
  onSelectTraining,
  onSelectMaxTesting,
  onCancel,
}: CycleTypeSelectorProps) {
  const { preferences } = useSyncedPreferences();
  const {
    canAccessStandard,
    canAccessAdvanced,
    canUseTrialForAdvanced,
    showPaywall,
    trial,
    purchase,
  } = useEntitlement();

  // User can access advanced features if:
  // 1. They have an Advanced purchase, OR
  // 2. They're in their free trial, OR
  // 3. Their app mode preference is Advanced AND they have access
  const isAdvancedMode = preferences.appMode === 'advanced';
  const canUseAdvancedCycles = canAccessAdvanced && isAdvancedMode;

  // Handler for locked advanced options (Simple / Mixed)
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

  // Handler for locked standard options (RFEM Training / Max Testing) —
  // only reachable when the trial has expired with no purchase
  const handleStandardLockedClick = () => {
    showPaywall('standard', trial.hasExpired ? 'trial_expired' : 'not_purchased');
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
        <CycleOptionCard
          title="RFEM Training Cycle"
          description="Periodized progression based on your max reps. Targets calculated automatically using RFEM percentages."
          icon={Calendar}
          gradient="from-primary-500 to-primary-600"
          hoverBorder="hover:border-primary-500 dark:hover:border-primary-500"
          arrowHover="group-hover:text-primary-500"
          locked={!canAccessStandard}
          lockedBadge="Standard"
          onClick={canAccessStandard ? () => onSelectTraining('rfem') : handleStandardLockedClick}
        />

        <CycleOptionCard
          title="Max Rep Testing"
          description="Establish or re-test your maximum reps for exercises. Includes warmup sets and records new maxes automatically."
          icon={Target}
          gradient="from-purple-500 to-purple-600"
          hoverBorder="hover:border-purple-500 dark:hover:border-purple-500"
          arrowHover="group-hover:text-purple-500"
          locked={!canAccessStandard}
          lockedBadge="Standard"
          onClick={canAccessStandard ? onSelectMaxTesting : handleStandardLockedClick}
        />

        <CycleOptionCard
          title="Simple Progression Cycle"
          description="Set your own rep targets for each exercise. Optionally add reps each workout or week."
          icon={TrendingUp}
          gradient="from-emerald-500 to-emerald-600"
          hoverBorder="hover:border-emerald-500 dark:hover:border-emerald-500"
          arrowHover="group-hover:text-emerald-500"
          locked={!canUseAdvancedCycles}
          lockedBadge="Advanced"
          onClick={canUseAdvancedCycles ? () => onSelectTraining('simple') : handleLockedClick}
        />

        <CycleOptionCard
          title="Mixed Cycle"
          description="Configure RFEM or simple progression individually for each exercise. Best for combining different training approaches."
          icon={Layers}
          gradient="from-indigo-500 to-purple-600"
          hoverBorder="hover:border-indigo-500 dark:hover:border-indigo-500"
          arrowHover="group-hover:text-indigo-500"
          locked={!canUseAdvancedCycles}
          lockedBadge="Advanced"
          onClick={canUseAdvancedCycles ? () => onSelectTraining('mixed') : handleLockedClick}
        />
      </div>

      <div className="pt-4">
        <Button variant="ghost" onClick={onCancel} className="w-full">
          Cancel
        </Button>
      </div>
    </div>
  );
}
