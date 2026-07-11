/**
 * WizardNavigation Component
 *
 * Navigation buttons at the bottom of the wizard (Back/Next/Create).
 * When Next/Create is disabled, shows the reason above the buttons so the
 * user is never stuck wondering why.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';
import type { WizardNavigationProps } from '../types';

export function WizardNavigation({
  currentStep,
  isFirstStep,
  canProceed,
  disabledReason,
  isCreating,
  isEditing,
  onBack,
  onNext,
  onCancel,
  onSubmit,
}: WizardNavigationProps) {
  const isReviewStep = currentStep === 'review';

  return (
    <div className="border-t border-gray-200 dark:border-dark-border">
      {!canProceed && disabledReason && (
        <p className="px-4 pt-3 text-xs text-center text-gray-500 dark:text-gray-400">
          {disabledReason}
        </p>
      )}
      <div className="flex gap-3 p-4">
        {isFirstStep ? (
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            {isEditing ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </>
            )}
          </Button>
        ) : (
          <Button variant="secondary" onClick={onBack} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        )}

        {isReviewStep ? (
          <Button onClick={onSubmit} disabled={!canProceed || isCreating} className="flex-1">
            {isCreating ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Cycle'}
          </Button>
        ) : (
          <Button onClick={onNext} disabled={!canProceed} className="flex-1">
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
