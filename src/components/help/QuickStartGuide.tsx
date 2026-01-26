/**
 * QuickStartGuide Component
 *
 * Condensed version of the quick start onboarding for returning users.
 * 3 slides: Getting Started, Daily Workflow, Next Steps.
 */

import { useState } from 'react';
import { ArrowRight, ArrowLeft, Rocket, Hand, Sparkles, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui';
import { OnboardingSlide, OnboardingProgress } from '@/components/onboarding';

interface QuickStartGuideProps {
  onComplete: () => void;
  showProgress?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
}

const TOTAL_SLIDES = 3;

export function QuickStartGuide({
  onComplete,
  showProgress = true,
  showSkip = true,
  onSkip,
}: QuickStartGuideProps) {
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

  // Mock set card for demonstration
  const MockSetCard = ({
    exercise,
    reps,
    completed = false,
  }: {
    exercise: string;
    reps: number;
    completed?: boolean;
  }) => (
    <div
      className={`
        flex items-center justify-between p-3 rounded-lg border
        ${
          completed
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }
      `}
    >
      <div>
        <div
          className={`font-medium text-sm ${completed ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-gray-100'}`}
        >
          {exercise}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Target: {reps} reps</div>
      </div>
      {completed ? (
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="w-3.5 h-3.5 text-white" />
        </div>
      ) : (
        <ChevronRight className="w-5 h-5 text-gray-400" />
      )}
    </div>
  );

  const renderSlideContent = () => {
    switch (currentSlide) {
      case 0:
        return (
          <OnboardingSlide
            icon={<Rocket className="w-10 h-10" />}
            headline="Getting Started with Ascend"
            variant="default"
            gradient="from-primary-500 to-cyan-500"
            body={
              <div className="space-y-4">
                <p>Welcome back! Here's a quick refresher on how Ascend works.</p>

                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
                      1
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        Add Exercises
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Build your library of movements to track
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
                      2
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        Record Your Maxes
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Establish baselines for each exercise
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
                      3
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        Create a Cycle (Optional)
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Or just log workouts freestyle
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
            primaryAction={{
              label: 'Your Daily Workflow',
              onClick: handleNext,
              icon: <ArrowRight className="w-5 h-5" />,
            }}
          />
        );

      case 1:
        return (
          <OnboardingSlide
            icon={<Hand className="w-10 h-10" />}
            headline="Your Daily Workflow"
            variant="tour"
            gradient="from-emerald-500 to-teal-500"
            body={
              <div className="space-y-4">
                <p>Training with Ascend is simple:</p>

                {/* Mock Today page */}
                <div className="bg-gray-100 dark:bg-gray-800/80 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Today's Sets
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">2/4 complete</span>
                  </div>
                  <MockSetCard exercise="Pull-ups" reps={8} completed />
                  <MockSetCard exercise="Push-ups" reps={12} completed />
                  <MockSetCard exercise="Pull-ups" reps={8} />
                  <MockSetCard exercise="Push-ups" reps={12} />
                </div>

                <div className="space-y-2 text-sm text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">1.</span>
                    <span>Open the app and see your sets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">2.</span>
                    <span>
                      <strong>Swipe right</strong> to complete at target
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">3.</span>
                    <span>Rest timer starts automatically</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">4.</span>
                    <span>Repeat until done!</span>
                  </div>
                </div>
              </div>
            }
            primaryAction={{
              label: 'What to Do Next',
              onClick: handleNext,
              icon: <ArrowRight className="w-5 h-5" />,
            }}
          />
        );

      case 2:
        return (
          <OnboardingSlide
            icon={<Sparkles className="w-10 h-10" />}
            headline="What to Do Next"
            variant="default"
            gradient="from-violet-500 to-purple-500"
            body={
              <div className="space-y-4">
                <p>Here are your options to get started:</p>

                <div className="space-y-3 text-left">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-primary-500">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      If you have no exercises yet...
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Go to the Exercises tab and add your first movement
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-emerald-500">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      If you want structured training...
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Go to Schedule and create a training cycle
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-amber-500">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      If you just want to log a workout...
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Go to Today and tap "Log Ad-Hoc Set"
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You can revisit this guide anytime from Settings → Help & Guides.
                </p>
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

export { TOTAL_SLIDES as QUICK_START_GUIDE_SLIDES };
