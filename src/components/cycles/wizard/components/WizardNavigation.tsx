/**
 * WizardNavigation Component
 *
 * Navigation buttons at the bottom of the wizard (Back/Next/Create).
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';
import type { WizardNavigationProps } from '../types';

export function WizardNavigation({
  currentStep,
  canProceed,
  isCreating,
  isEditing,
  onBack,
  onNext,
  onCancel,
  onSubmit,
}: WizardNavigationProps) {
  const isReviewStep = currentStep === 'review';
  const isScheduleModeStep = currentStep === 'schedule_mode';

  return (
    <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-dark-border">
      {isScheduleModeStep ? (
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
  );
}
