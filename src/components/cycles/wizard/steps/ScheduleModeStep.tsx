/**
 * ScheduleModeStep Component
 *
 * Full-screen step for selecting between Fixed Days and Flexible scheduling modes.
 * Presented as two large selectable cards with clear descriptions.
 */

import { CalendarDays, Shuffle } from 'lucide-react';
import type { SchedulingMode } from '@/types';

export interface ScheduleModeStepProps {
  schedulingMode: SchedulingMode;
  onSelectMode: (mode: SchedulingMode) => void;
}

export function ScheduleModeStep({ schedulingMode, onSelectMode }: ScheduleModeStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          How do you want to schedule workouts?
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choose how your workouts will be organized
        </p>
      </div>

      <div className="space-y-4">
        {/* Fixed Days Option */}
        <button
          type="button"
          onClick={() => onSelectMode('date')}
          className={`w-full text-left p-4 rounded-xl transition-all ${
            schedulingMode === 'date'
              ? 'border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-lg ${
                schedulingMode === 'date'
                  ? 'bg-primary-100 dark:bg-primary-900/40'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <CalendarDays
                className={`w-6 h-6 ${
                  schedulingMode === 'date'
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3
                  className={`font-semibold ${
                    schedulingMode === 'date'
                      ? 'text-primary-700 dark:text-primary-300'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  Fixed Days
                </h3>
                {schedulingMode !== 'date' && (
                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded">
                    Recommended
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Specific days each week like Mon, Wed, Fri. The app will show if you're on track,
                behind, or ahead.
              </p>
            </div>
            {/* Selection indicator */}
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                schedulingMode === 'date'
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              {schedulingMode === 'date' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </div>
        </button>

        {/* Flexible Option */}
        <button
          type="button"
          onClick={() => onSelectMode('sequence')}
          className={`w-full text-left p-4 rounded-xl transition-all ${
            schedulingMode === 'sequence'
              ? 'border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-lg ${
                schedulingMode === 'sequence'
                  ? 'bg-primary-100 dark:bg-primary-900/40'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <Shuffle
                className={`w-6 h-6 ${
                  schedulingMode === 'sequence'
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              />
            </div>
            <div className="flex-1">
              <h3
                className={`font-semibold ${
                  schedulingMode === 'sequence'
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                Flexible
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Work out at your own pace. Complete workouts in order whenever you're ready.
              </p>
            </div>
            {/* Selection indicator */}
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                schedulingMode === 'sequence'
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              {schedulingMode === 'sequence' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
