/**
 * WizardProgress Component
 *
 * Displays step progress indicator at the top of the wizard.
 */

import { Check, ChevronRight } from 'lucide-react';
import type { WizardProgressProps } from '../types';

export function WizardProgress({ steps, currentStep }: WizardProgressProps) {
  const currentIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-border">
      {steps.map((step, index) => {
        const isActive = step.key === currentStep;
        const isPast = currentIndex > index;

        return (
          <div key={step.key} className="flex items-center">
            <div
              className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : isPast
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
              }
            `}
            >
              {isPast ? <Check className="w-4 h-4" /> : index + 1}
            </div>
            <span
              className={`ml-2 text-sm font-medium hidden sm:inline
              ${isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}
            `}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <ChevronRight className="w-4 h-4 mx-2 text-gray-300 dark:text-gray-600" />
            )}
          </div>
        );
      })}
    </div>
  );
}
