/**
 * MaxTestingIntroModal Component
 *
 * Shows an introduction to max testing when user first
 * creates a max testing cycle. Can be dismissed permanently.
 */

import { useState } from 'react';
import { X, Trophy, Target, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAppStore } from '@/stores/appStore';

interface MaxTestingIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export function MaxTestingIntroModal({ isOpen, onClose, onContinue }: MaxTestingIntroModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const setOnboardingMilestone = useAppStore(state => state.setOnboardingMilestone);

  if (!isOpen) return null;

  const handleContinue = () => {
    if (dontShowAgain) {
      setOnboardingMilestone('maxTestingIntroSeen', true);
    }
    onContinue();
  };

  const handleClose = () => {
    if (dontShowAgain) {
      setOnboardingMilestone('maxTestingIntroSeen', true);
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
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Max Testing Week</h2>
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
            {/* What is max testing */}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Time to test your limits!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                A max testing week is dedicated to establishing new personal records. Your new maxes
                will be used to calculate training targets for your next cycle.
              </p>
            </div>

            {/* When to test */}
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
              <h4 className="font-medium text-amber-700 dark:text-amber-300 mb-2">
                Best time to test:
              </h4>
              <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>After completing a training cycle</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>When you feel stronger than your targets suggest</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>After a rest/deload period</span>
                </li>
              </ul>
            </div>

            {/* How it works */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h4 className="font-medium text-gray-900 dark:text-gray-100">How it works:</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold flex-shrink-0">
                    1
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-900 dark:text-gray-100">Warmup sets</strong> at
                    50%, 70%, and 85% of your current max
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs font-bold flex-shrink-0">
                    2
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-900 dark:text-gray-100">Max attempt</strong> — go
                    all out with good form
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">
                    3
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-900 dark:text-gray-100">Record updated</strong> —
                    your new PR is saved automatically
                  </div>
                </div>
              </div>
            </div>

            {/* Tip */}
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <p className="text-sm text-primary-700 dark:text-primary-300">
                <strong>Tip:</strong> Give yourself extra rest before max testing day for the best
                results.
              </p>
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
              Set Up Max Testing
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
