/**
 * HealthDisclaimer Component
 *
 * Mandatory health and safety acknowledgment screen.
 * This screen CANNOT be skipped and must be acknowledged before
 * the user can access any app features.
 *
 * Legal purpose: Establishes informed consent and assumption of risk.
 */

import { Heart, CheckCircle, AlertTriangle } from 'lucide-react';
import { OnboardingSlide } from './OnboardingSlide';

interface HealthDisclaimerProps {
  onAcknowledge: () => void;
  isLoading?: boolean;
}

export function HealthDisclaimer({ onAcknowledge, isLoading = false }: HealthDisclaimerProps) {
  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-dark-bg flex flex-col z-50 safe-area-top safe-area-bottom">
      {/* No progress bar - this is mandatory */}
      {/* No skip button - this cannot be bypassed */}

      <OnboardingSlide
        icon={<Heart className="w-10 h-10" />}
        headline="Your Health Comes First"
        variant="health"
        isLoading={isLoading}
        scrollable={true}
        inlineActions={true}
        body={
          <div className="space-y-4 text-left">
            <p className="text-gray-700 dark:text-gray-300">
              Before you start training with Ascend, please read and acknowledge the following:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong className="text-amber-800 dark:text-amber-200">
                    Consult your doctor
                  </strong>
                  <p className="text-amber-700 dark:text-amber-300 mt-1">
                    Before starting any new exercise program, especially if you have existing health
                    conditions, injuries, or concerns.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                <Heart className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <strong className="text-gray-900 dark:text-gray-100">Listen to your body</strong>
                  <p className="mt-1">
                    Stop immediately if you experience pain, dizziness, shortness of breath, or any
                    discomfort during exercise.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <strong className="text-gray-900 dark:text-gray-100">You are responsible</strong>
                  <p className="mt-1">
                    For exercising safely, using proper form, and staying within your capabilities.
                    Ascend provides workout tracking and suggestions, not medical advice.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">
              By tapping "I Understand & Agree" below, you acknowledge that physical exercise
              carries inherent risks including the possibility of injury, and you accept full
              responsibility for your health and safety while using this app. See our{' '}
              <a
                href="https://fredericbahnson.com/ascend/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 underline"
              >
                Terms of Service
              </a>{' '}
              for complete details.
            </p>
          </div>
        }
        primaryAction={{
          label: isLoading ? 'Saving...' : 'I Understand & Agree',
          onClick: onAcknowledge,
          icon: <CheckCircle className="w-5 h-5" />,
        }}
        // No secondary action - cannot go back, cannot skip
      />
    </div>
  );
}
