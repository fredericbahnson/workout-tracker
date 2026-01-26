/**
 * CycleIntroModal Component
 *
 * Shows a condensed version of the CycleGuide when user
 * first opens the CycleWizard. Can be dismissed permanently.
 */

import { useState } from 'react';
import { X, Calendar, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAppStore } from '@/stores/appStore';

interface CycleIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export function CycleIntroModal({ isOpen, onClose, onContinue }: CycleIntroModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const setOnboardingMilestone = useAppStore(state => state.setOnboardingMilestone);

  if (!isOpen) return null;

  const handleContinue = () => {
    if (dontShowAgain) {
      setOnboardingMilestone('cycleIntroSeen', true);
    }
    onContinue();
  };

  const handleClose = () => {
    if (dontShowAgain) {
      setOnboardingMilestone('cycleIntroSeen', true);
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto pointer-events-auto animate-in zoom-in-95 fade-in duration-200">
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-dark-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                Creating a Training Cycle
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 -m-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* What is a cycle */}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">What's a cycle?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                A cycle is a structured training period (typically 4 weeks) where you set your goals
                and Ascend generates your daily workouts.
              </p>
            </div>

            {/* What you decide */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">You decide:</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-primary-500">•</span>
                  <span>How many days per week you'll train</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-500">•</span>
                  <span>Which exercises to include</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-500">•</span>
                  <span>Target sets per exercise per week</span>
                </li>
              </ul>
            </div>

            {/* What Ascend does */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="font-medium text-emerald-700 dark:text-emerald-300">
                  Ascend handles:
                </h4>
              </div>
              <ul className="space-y-2 text-sm text-emerald-700 dark:text-emerald-300">
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Distributing sets across your training days</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Calculating target reps based on your maxes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Rotating intensity with the wave pattern</span>
                </li>
              </ul>
            </div>

            {/* Don't show again */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={e => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Don't show this again
              </span>
            </label>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-dark-border">
            <Button onClick={handleContinue} className="w-full">
              Create My Cycle
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
