/**
 * IdentitySlide Component
 *
 * First slide in the new onboarding flow.
 * Establishes the calisthenics identity hook and shows who this app is for.
 */

import { ArrowRight } from 'lucide-react';
import { OnboardingSlide } from '../OnboardingSlide';

interface IdentitySlideProps {
  onNext: () => void;
}

export function IdentitySlide({ onNext }: IdentitySlideProps) {
  return (
    <OnboardingSlide
      image="/pwa-192x192.png"
      headline="Built for Everyone"
      variant="default"
      gradient="from-primary-500 to-cyan-500"
      body={
        <div className="space-y-4">
          <p className="text-lg">
            Whether you're working on your first push-up or chasing muscle-ups, Ascend adapts to
            your journey.
          </p>

          {/* Progression examples */}
          <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Incline Rows
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Horizontal Rows
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                    Pull-ups
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Knee Push-ups
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Push-ups
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                    Archer Push-ups
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Train at home, at the park, or wherever you are. No gym required.
          </p>
        </div>
      }
      primaryAction={{
        label: "Let's Go",
        onClick: onNext,
        icon: <ArrowRight className="w-5 h-5" />,
      }}
    />
  );
}
