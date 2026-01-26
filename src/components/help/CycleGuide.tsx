/**
 * CycleGuide Component
 *
 * Explains how training cycles work in Ascend.
 * 3 slides covering what cycles are, what you control, and what Ascend handles.
 */

import { useState } from 'react';
import { ArrowRight, ArrowLeft, Calendar, Settings, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import { OnboardingSlide, OnboardingProgress } from '@/components/onboarding';

interface CycleGuideProps {
  onComplete: () => void;
  showProgress?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
}

const TOTAL_SLIDES = 3;

export function CycleGuide({
  onComplete,
  showProgress = true,
  showSkip = true,
  onSkip,
}: CycleGuideProps) {
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
            icon={<Calendar className="w-10 h-10" />}
            headline="Cycles = Your Training Plan"
            variant="tour"
            gradient="from-purple-500 to-pink-500"
            body={
              <div className="space-y-4">
                <p>
                  A cycle is a structured training period with specific goals. Think of it as your
                  roadmap for the next few weeks.
                </p>

                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <div className="text-center mb-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Example Weekly Schedule
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { day: 'Mon', workout: 'A', isWorkout: true },
                      { day: 'Tue', workout: null, isWorkout: false },
                      { day: 'Wed', workout: 'B', isWorkout: true },
                      { day: 'Thu', workout: null, isWorkout: false },
                      { day: 'Fri', workout: 'A', isWorkout: true },
                      { day: 'Sat', workout: 'B', isWorkout: true },
                      { day: 'Sun', workout: null, isWorkout: false },
                    ].map(({ day, workout, isWorkout }) => (
                      <div
                        key={day}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                          isWorkout
                            ? 'bg-primary-100 dark:bg-primary-900/30'
                            : 'bg-white dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`text-sm font-medium ${
                            isWorkout
                              ? 'text-primary-700 dark:text-primary-300'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {day}
                        </span>
                        <span
                          className={`text-sm ${
                            isWorkout
                              ? 'font-semibold text-primary-600 dark:text-primary-400'
                              : 'text-gray-400 dark:text-gray-500'
                          }`}
                        >
                          {isWorkout ? `Workout ${workout}` : 'Recovery'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  At the end of each cycle, you can test new maxes and start fresh.
                </p>
              </div>
            }
            primaryAction={{
              label: 'What You Control',
              onClick: handleNext,
              icon: <ArrowRight className="w-5 h-5" />,
            }}
          />
        );

      case 1:
        return (
          <OnboardingSlide
            icon={<Settings className="w-10 h-10" />}
            headline="You Control the Basics"
            variant="tour"
            gradient="from-blue-500 to-cyan-500"
            body={
              <div className="space-y-4">
                <p>When creating a cycle, you decide:</p>

                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                      1
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        Training Days
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        How many days per week you want to train
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                      2
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">Exercises</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Which exercises to include in the cycle
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                      3
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        Weekly Volume
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Target sets per exercise per week
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
            primaryAction={{
              label: 'What Ascend Handles',
              onClick: handleNext,
              icon: <ArrowRight className="w-5 h-5" />,
            }}
          />
        );

      case 2:
        return (
          <OnboardingSlide
            icon={<Sparkles className="w-10 h-10" />}
            headline="Ascend Handles the Rest"
            variant="tour"
            gradient="from-emerald-500 to-teal-500"
            body={
              <div className="space-y-4">
                <p>Once you set your preferences, Ascend automatically:</p>

                <div className="space-y-2 text-left">
                  <div className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>Distributes sets</strong> across your training days
                    </span>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>Calculates targets</strong> using RFEM or your chosen mode
                    </span>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>Rotates intensity</strong> with the wave pattern
                    </span>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>Generates warmups</strong> for each exercise
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You just show up and train. Ascend tells you exactly what to do.
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

export { TOTAL_SLIDES as CYCLE_GUIDE_SLIDES };
