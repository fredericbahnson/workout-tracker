/**
 * MaxTestingGuide Component
 *
 * Explains how max testing cycles work in Ascend.
 * 2 slides covering when to test and how testing works.
 */

import { useState } from 'react';
import { ArrowRight, ArrowLeft, Trophy, Target } from 'lucide-react';
import { Button } from '@/components/ui';
import { OnboardingSlide, OnboardingProgress } from '@/components/onboarding';

interface MaxTestingGuideProps {
  onComplete: () => void;
  showProgress?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
}

const TOTAL_SLIDES = 2;

export function MaxTestingGuide({
  onComplete,
  showProgress = true,
  showSkip = true,
  onSkip,
}: MaxTestingGuideProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide >= TOTAL_SLIDES - 1) {
      onComplete();
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const isFirstSlide = currentSlide === 0;

  const renderSlideContent = () => {
    switch (currentSlide) {
      case 0:
        return (
          <OnboardingSlide
            icon={<Trophy className="w-10 h-10" />}
            headline="Time to Test Your Maxes"
            variant="tour"
            gradient="from-amber-500 to-orange-500"
            body={
              <div className="space-y-4">
                <p>
                  Max testing cycles are special weeks dedicated to establishing new personal
                  records.
                </p>

                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    When to Test
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        After completing a training cycle (every 4-6 weeks)
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        When you feel stronger than your targets suggest
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        After a deload or rest period
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Testing updates your max records, which recalculates all your training targets.
                </p>
              </div>
            }
            primaryAction={{
              label: 'How Testing Works',
              onClick: handleNext,
              icon: <ArrowRight className="w-5 h-5" />,
            }}
          />
        );

      case 1:
        return (
          <OnboardingSlide
            icon={<Target className="w-10 h-10" />}
            headline="How Max Testing Works"
            variant="tour"
            gradient="from-orange-500 to-red-500"
            body={
              <div className="space-y-4">
                <p>During a max testing session, Ascend guides you through:</p>

                <div className="space-y-3">
                  {/* Warmup phase */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold">
                        1
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">Warmups</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 pl-8">
                      Warm up each movement before max testing. Ascend can calculate warmup sets for
                      you once there is at least one max for reference.
                    </p>
                  </div>

                  {/* Max attempt phase */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs font-bold">
                        2
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        Max Attempt
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 pl-8">
                      Go all out with good form and log your new max
                    </p>
                  </div>

                  {/* PR recording */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 text-xs font-bold">
                        3
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        Record Updated
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 pl-8">
                      Your new PR is saved and future targets are recalculated
                    </p>
                  </div>
                </div>
              </div>
            }
            primaryAction={{
              label: 'Done',
              onClick: handleNext,
              icon: <ArrowRight className="w-5 h-5" />,
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-dark-bg flex flex-col z-50 safe-area-top safe-area-bottom">
      {showProgress && (
        <OnboardingProgress
          totalSteps={TOTAL_SLIDES}
          currentStep={currentSlide}
          onSkip={onSkip}
          showSkip={showSkip}
        />
      )}

      {!isFirstSlide && (
        <div className="absolute top-6 left-4 z-10">
          <Button variant="ghost" size="sm" onClick={handlePrev} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto" key={currentSlide}>
        {renderSlideContent()}
      </div>
    </div>
  );
}

export { TOTAL_SLIDES as MAX_TESTING_GUIDE_SLIDES };
