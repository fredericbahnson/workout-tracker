/**
 * StartStep Component
 *
 * Initial step for creating a new cycle.
 * Allows starting fresh or cloning from a previous cycle.
 */

import { Plus, Copy, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';
import type { StartStepProps } from '../types';

export function StartStep({
  cloneableCycles,
  onStartFresh,
  onCloneFromCycle,
  onCancel,
}: StartStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Create New Cycle
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Start fresh or copy settings from a previous cycle
        </p>
      </div>

      <div className="space-y-3">
        {/* Start Fresh Option */}
        <button
          onClick={onStartFresh}
          className="w-full p-4 text-left rounded-xl border-2 border-gray-200 dark:border-dark-border hover:border-primary-500 dark:hover:border-primary-500 transition-colors bg-white dark:bg-gray-800"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
              <Plus className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">Start Fresh</div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Create a new cycle from scratch with default settings
              </p>
            </div>
          </div>
        </button>

        {/* Clone from Previous Cycle */}
        {cloneableCycles.length > 0 && (
          <>
            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-dark-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-gray-50 dark:bg-gray-900 text-sm text-gray-500 dark:text-gray-400">
                  or clone from previous
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {cloneableCycles.slice(0, 5).map(cycle => (
                <button
                  key={cycle.id}
                  onClick={() => onCloneFromCycle(cycle)}
                  className="w-full p-4 text-left rounded-xl border-2 border-gray-200 dark:border-dark-border hover:border-primary-500 dark:hover:border-primary-500 transition-colors bg-white dark:bg-gray-800"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <Copy className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {cycle.name}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {cycle.numberOfWeeks} weeks • {cycle.workoutDaysPerWeek} days/week •{' '}
                        {cycle.groups.length} groups
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(cycle.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="pt-4">
        <Button variant="secondary" onClick={onCancel} className="w-full">
          Cancel
        </Button>
      </div>
    </div>
  );
}
