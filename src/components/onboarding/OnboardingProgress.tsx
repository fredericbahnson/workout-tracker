/**
 * OnboardingProgress Component
 *
 * Progress indicator for the onboarding flow.
 * Shows dots for each step with visual distinction at module boundaries.
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import type { OnboardingProgressProps } from './types';

export function OnboardingProgress({
  totalSteps,
  currentStep,
  moduleBreaks = [],
  onSkip,
  showSkip = true,
}: OnboardingProgressProps) {
  const [showExitModal, setShowExitModal] = useState(false);

  // Create array of step indices
  const steps = Array.from({ length: totalSteps }, (_, i) => i);

  const handleSkipClick = () => {
    setShowExitModal(true);
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    onSkip?.();
  };

  return (
    <>
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {steps.map(index => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isModuleBreak = moduleBreaks.includes(index);

            return (
              <div key={index} className="flex items-center">
                {/* Module separator */}
                {isModuleBreak && index > 0 && (
                  <div className="w-2 h-px bg-gray-300 dark:bg-gray-600 mx-1" />
                )}

                {/* Progress dot */}
                <div
                  className={`
                    rounded-full transition-all duration-300
                    ${
                      isActive
                        ? 'w-6 h-1.5 bg-primary-500'
                        : isCompleted
                          ? 'w-1.5 h-1.5 bg-primary-400 dark:bg-primary-600'
                          : 'w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600'
                    }
                  `}
                />
              </div>
            );
          })}
        </div>

        {/* Exit button */}
        {showSkip && onSkip && (
          <button
            onClick={handleSkipClick}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Exit guide"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Exit confirmation modal */}
      <Modal isOpen={showExitModal} onClose={() => setShowExitModal(false)} title="Exit Guide?">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            You can come back to this content anytime in{' '}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              Settings → Help & Guides
            </span>
            .
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowExitModal(false)} className="flex-1">
              Continue
            </Button>
            <Button variant="ghost" onClick={handleConfirmExit} className="flex-1">
              Exit
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
