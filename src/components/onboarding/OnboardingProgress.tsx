/**
 * OnboardingProgress Component
 *
 * Progress indicator for the onboarding flow.
 * Shows dots for each step with visual distinction at module boundaries.
 */

import type { OnboardingProgressProps } from './types';

export function OnboardingProgress({
  totalSteps,
  currentStep,
  moduleBreaks = [],
  onSkip,
  showSkip = true,
}: OnboardingProgressProps) {
  // Create array of step indices
  const steps = Array.from({ length: totalSteps }, (_, i) => i);

  return (
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

      {/* Skip button */}
      {showSkip && onSkip && (
        <button
          onClick={onSkip}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          Skip
        </button>
      )}
    </div>
  );
}
