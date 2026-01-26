/**
 * WhyTheseRepsSheet Component
 *
 * Bottom sheet explaining how a target was calculated.
 * Shows the formula for RFEM or Simple progression modes.
 */

import { X, HelpCircle, Calculator, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';

interface WhyTheseRepsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  targetReps: number;
  maxReps?: number;
  rfemValue?: number;
  progressionMode: 'rfem' | 'simple' | 'conditioning';
  /** For simple mode: base reps + increment */
  simpleBase?: number;
  simpleIncrement?: number;
  weekNumber?: number;
  onLearnMore?: () => void;
}

export function WhyTheseRepsSheet({
  isOpen,
  onClose,
  exerciseName,
  targetReps,
  maxReps,
  rfemValue,
  progressionMode,
  simpleBase,
  simpleIncrement,
  weekNumber,
  onLearnMore,
}: WhyTheseRepsSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300 safe-area-bottom">
        <div className="bg-white dark:bg-dark-surface rounded-t-2xl shadow-xl max-h-[80vh] overflow-y-auto">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-4 pb-4 flex items-center justify-between border-b border-gray-200 dark:border-dark-border">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary-500" />
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                Why {targetReps} Reps?
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 -m-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Exercise name */}
            <div className="text-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">For</span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {exerciseName}
              </h3>
            </div>

            {/* RFEM calculation */}
            {progressionMode === 'rfem' && maxReps && rfemValue && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium text-emerald-700 dark:text-emerald-300">
                    RFEM Calculation
                  </span>
                </div>

                {/* Formula visualization */}
                <div className="flex items-center justify-center gap-3 text-lg font-mono">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {maxReps}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Your Max</div>
                  </div>
                  <span className="text-gray-400">−</span>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {rfemValue}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">RFEM</div>
                  </div>
                  <span className="text-gray-400">=</span>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {targetReps}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Target</div>
                  </div>
                </div>

                <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300 text-center">
                  Training {rfemValue} reps below your max for optimal recovery
                </p>
              </div>
            )}

            {/* Simple progression calculation */}
            {progressionMode === 'simple' && simpleBase && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-700 dark:text-blue-300">
                    Simple Progression
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3 text-lg font-mono">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {simpleBase}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Base</div>
                  </div>
                  {simpleIncrement && weekNumber && (
                    <>
                      <span className="text-gray-400">+</span>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {simpleIncrement * (weekNumber - 1)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Week {weekNumber}
                        </div>
                      </div>
                    </>
                  )}
                  <span className="text-gray-400">=</span>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {targetReps}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Target</div>
                  </div>
                </div>

                <p className="mt-3 text-sm text-blue-700 dark:text-blue-300 text-center">
                  Adding {simpleIncrement} reps each week
                </p>
              </div>
            )}

            {/* Conditioning mode */}
            {progressionMode === 'conditioning' && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span className="font-medium text-amber-700 dark:text-amber-300">
                    Conditioning Mode
                  </span>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                    {targetReps}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Fixed target reps
                  </div>
                </div>

                <p className="mt-3 text-sm text-amber-700 dark:text-amber-300 text-center">
                  Conditioning exercises use consistent rep targets
                </p>
              </div>
            )}

            {/* Learn more */}
            {onLearnMore && progressionMode === 'rfem' && (
              <button
                onClick={onLearnMore}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-sm font-medium">Learn more about RFEM</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* Close button */}
            <Button onClick={onClose} variant="secondary" className="w-full">
              Got it
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
