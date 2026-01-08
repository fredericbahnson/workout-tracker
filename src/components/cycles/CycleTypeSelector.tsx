import { Calendar, Target, ArrowRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui';
import type { ProgressionMode } from '@/types';

interface CycleTypeSelectorProps {
  onSelectTraining: (mode: ProgressionMode) => void;
  onSelectMaxTesting: () => void;
  onCancel: () => void;
}

export function CycleTypeSelector({ 
  onSelectTraining, 
  onSelectMaxTesting, 
  onCancel 
}: CycleTypeSelectorProps) {
  return (
    <div className="p-4 space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          What would you like to create?
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Choose the type of cycle to set up
        </p>
      </div>

      <div className="space-y-3">
        {/* RFEM Training Cycle Option */}
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
                Periodized progression based on your max reps. 
                Targets calculated automatically using RFEM percentages.
              </p>
            </div>
          </div>
        </button>

        {/* Simple Progression Cycle Option */}
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
                Set your own rep targets for each exercise. 
                Optionally add reps each workout or week.
              </p>
            </div>
          </div>
        </button>

        {/* Max Testing Option */}
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
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Max Rep Testing
                </h3>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Establish or re-test your maximum reps for exercises. 
                Includes warmup sets and records new maxes automatically.
              </p>
            </div>
          </div>
        </button>
      </div>

      <div className="pt-4">
        <Button variant="ghost" onClick={onCancel} className="w-full">
          Cancel
        </Button>
      </div>
    </div>
  );
}
