import { CheckCircle2, Circle, ChevronRight, X, Rocket } from 'lucide-react';
import { Card } from '@/components/ui';
import type { GettingStartedStep, GettingStartedStepId } from '@/utils/gettingStarted';

interface GettingStartedCardProps {
  steps: GettingStartedStep[];
  onStepClick: (id: GettingStartedStepId) => void;
  onDismiss: () => void;
}

/**
 * Dismissible setup checklist shown on Today until the user has created a
 * cycle and logged their first sets. Rows for unmet actionable steps are
 * tappable; 'first-workout' completes on its own once sets are logged.
 */
export function GettingStartedCard({ steps, onStepClick, onDismiss }: GettingStartedCardProps) {
  const doneCount = steps.filter(step => step.done).length;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Rocket className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              Getting started
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {doneCount} of {steps.length} done
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss getting started checklist"
          className="p-2 -m-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1">
        {steps.map(step => {
          const actionable = !step.done && step.id !== 'first-workout';
          const row = (
            <>
              {step.done ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
              )}
              <span
                className={`flex-1 text-left text-sm ${
                  step.done
                    ? 'text-gray-400 dark:text-gray-500 line-through'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {step.label}
              </span>
              {actionable && <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
            </>
          );

          return actionable ? (
            <button
              key={step.id}
              onClick={() => onStepClick(step.id)}
              className="w-full flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {row}
            </button>
          ) : (
            <div key={step.id} className="flex items-center gap-3 py-2 px-2 -mx-2">
              {row}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
