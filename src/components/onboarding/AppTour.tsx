/**
 * AppTour Component
 *
 * Guided tour of key app features and navigation.
 * Can be used standalone (from Settings) or as part of onboarding flow.
 */

import { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Home,
  Dumbbell,
  Calendar,
  TrendingUp,
  ChevronRight,
  Hand,
  Timer,
  BarChart3,
  Target,
  X,
  Edit3,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { OnboardingSlide } from './OnboardingSlide';
import { OnboardingProgress } from './OnboardingProgress';

interface AppTourProps {
  onComplete: () => void;
  onBack?: () => void;
  showProgress?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
  /** Start at a specific slide (0-indexed) */
  initialSlide?: number;
  /** Whether this is standalone mode (from Settings) */
  standalone?: boolean;
  /** Callback for RFEM learning option on final slide */
  onLearnRFEM?: () => void;
}

const TOTAL_SLIDES = 4;

export function AppTour({
  onComplete,
  onBack,
  showProgress = true,
  showSkip = false,
  onSkip,
  initialSlide = 0,
  standalone = false,
  onLearnRFEM,
}: AppTourProps) {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);

  const handleNext = () => {
    if (currentSlide >= TOTAL_SLIDES - 1) {
      onComplete();
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide === 0) {
      onBack?.();
    } else {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const isFirstSlide = currentSlide === 0;

  // Mock UI components for tour demonstrations
  const MockSetCard = ({
    exercise,
    reps,
    isCompleted = false,
  }: {
    exercise: string;
    reps: number;
    isCompleted?: boolean;
  }) => (
    <div
      className={`
        relative bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border
        ${isCompleted ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700'}
      `}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{exercise}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Target: {reps} reps</div>
        </div>
        {isCompleted ? (
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </div>
    </div>
  );

  const MockExerciseCard = ({ name, type, max }: { name: string; type: string; max?: number }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{type}</div>
        </div>
        {max && (
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">Max</div>
            <div className="font-semibold text-primary-600 dark:text-primary-400 text-sm">
              {max}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Slide content
  const renderSlideContent = () => {
    switch (currentSlide) {
      case 0:
        return (
          <OnboardingSlide
            icon={<Home className="w-10 h-10" />}
            headline="Everything Starts on Today"
            variant="tour"
            gradient="from-primary-500 to-cyan-500"
            body={
              <div className="space-y-4">
                <p>The Today page shows your scheduled workout and tracks your progress.</p>

                {/* Mock Today UI */}
                <div className="bg-gray-100 dark:bg-gray-800/80 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span className="font-medium">Today's Workout</span>
                    <span>3/8 sets</span>
                  </div>
                  <MockSetCard exercise="Pushups" reps={12} isCompleted={true} />
                  <div className="relative">
                    <MockSetCard exercise="Rows" reps={10} />
                    {/* Swipe indicator */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 pr-2 animate-pulse">
                      <Hand className="w-4 h-4 text-primary-500 rotate-90" />
                      <ArrowRight className="w-3 h-3 text-primary-500" />
                    </div>
                  </div>
                  <MockSetCard exercise="Squats" reps={15} />
                </div>

                <div className="space-y-2 text-sm text-left">
                  <div className="flex items-center gap-2">
                    <Hand className="w-4 h-4 text-primary-500 rotate-90" />
                    <span>Swipe right to complete at target</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-primary-500" />
                    <span>Rest timer starts automatically</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-primary-500" />
                    <span>Tap + to add extra sets anytime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-primary-500" />
                    <span>Swipe left to skip a set</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-primary-500" />
                    <span>Tap to edit details of the set</span>
                  </div>
                </div>
              </div>
            }
            primaryAction={{
              label: 'Next: Exercises',
              onClick: handleNext,
              icon: <ArrowRight className="w-5 h-5" />,
            }}
            secondaryAction={
              onBack && isFirstSlide ? { label: 'Back', onClick: handlePrev } : undefined
            }
          />
        );

      case 1:
        return (
          <OnboardingSlide
            icon={<Dumbbell className="w-10 h-10" />}
            headline="Build Your Exercise Library"
            variant="tour"
            gradient="from-orange-500 to-amber-500"
            body={
              <div className="space-y-4">
                <p>Add exercises you want to train and track your progress.</p>

                {/* Mock Exercises UI */}
                <div className="bg-gray-100 dark:bg-gray-800/80 rounded-xl p-3 space-y-2">
                  {/* Filter chips */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-500 text-white">
                      All
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      Push
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      Pull
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      Legs
                    </span>
                  </div>
                  <MockExerciseCard name="Pushups" type="Push • Reps" max={15} />
                  <MockExerciseCard name="Pull-ups" type="Pull • Reps" max={8} />
                  <MockExerciseCard name="Plank" type="Core • Time" />
                </div>

                <div className="space-y-2 text-sm text-left">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary-500" />
                    <span>Track reps or time-based exercises</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary-500" />
                    <span>Your max is tracked automatically</span>
                  </div>
                </div>
              </div>
            }
            primaryAction={{
              label: 'Next: Training Cycles',
              onClick: handleNext,
              icon: <ArrowRight className="w-5 h-5" />,
            }}
          />
        );

      case 2:
        return (
          <OnboardingSlide
            icon={<Calendar className="w-10 h-10" />}
            headline="Structured Training Cycles"
            variant="tour"
            gradient="from-purple-500 to-pink-500"
            body={
              <div className="space-y-4">
                <p>Create training cycles where you set the goals, and Ascend handles the rest.</p>

                {/* Mock Calendar UI */}
                <div className="bg-gray-100 dark:bg-gray-800/80 rounded-xl p-3">
                  <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <div key={i} className="text-gray-400 dark:text-gray-500 font-medium">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {[...Array(7)].map((_, i) => (
                      <div
                        key={i}
                        className={`
                          aspect-square rounded-md flex items-center justify-center text-xs
                          ${i === 1 || i === 3 || i === 5 ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium' : 'text-gray-600 dark:text-gray-400'}
                          ${i === 3 ? 'ring-2 ring-primary-500' : ''}
                        `}
                      >
                        {i + 8}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                    <span className="text-primary-600 dark:text-primary-400 font-medium">
                      3 workouts
                    </span>{' '}
                    this week
                  </div>
                </div>

                <div className="space-y-2 text-sm text-left">
                  <div className="flex items-start gap-2">
                    <span className="text-primary-500 mt-0.5">•</span>
                    <span>
                      <strong>Pick your exercises</strong> — choose what you want to train
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary-500 mt-0.5">•</span>
                    <span>
                      <strong>Set your volume goals</strong> — how many sets per week
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary-500 mt-0.5">•</span>
                    <span>
                      <strong>Ascend generates workouts</strong> — always know what to do
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  The cycle wizard walks you through each step in about a minute. Or skip cycles
                  entirely and log workouts freestyle.
                </p>
              </div>
            }
            primaryAction={{
              label: 'Next: Track Progress',
              onClick: handleNext,
              icon: <ArrowRight className="w-5 h-5" />,
            }}
          />
        );

      case 3:
        return (
          <OnboardingSlide
            icon={<TrendingUp className="w-10 h-10" />}
            headline="See Your Growth Over Time"
            variant="tour"
            gradient="from-emerald-500 to-teal-500"
            body={
              <div className="space-y-4">
                <p>The Progress page tracks your achievements and trends.</p>

                {/* Mock Progress UI */}
                <div className="bg-gray-100 dark:bg-gray-800/80 rounded-xl p-3 space-y-3">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">247</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">Total Sets</div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        3,182
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">Total Reps</div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        12
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">PRs Set</div>
                    </div>
                  </div>

                  {/* Mini chart */}
                  <div className="h-12 flex items-end gap-1 px-2">
                    {[40, 55, 45, 70, 65, 80, 75].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-primary-400 dark:bg-primary-500 rounded-t"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                    Last 7 workouts
                  </div>
                </div>

                <div className="space-y-2 text-sm text-left">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary-500" />
                    <span>Volume trends and statistics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span>Personal records per exercise</span>
                  </div>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sync with an account to access your data on any device. Visit{' '}
                  <strong>Settings</strong> to customize rest timers, training defaults, and more.
                </p>
              </div>
            }
            primaryAction={{
              label: standalone ? 'Done' : 'Start Training',
              onClick: handleNext,
              icon: <ArrowRight className="w-5 h-5" />,
            }}
            secondaryAction={
              onLearnRFEM
                ? {
                    label: 'Learn About RFEM First',
                    onClick: onLearnRFEM,
                  }
                : undefined
            }
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-dark-bg flex flex-col z-50 safe-area-top safe-area-bottom">
      {/* Progress indicator */}
      {showProgress && (
        <OnboardingProgress
          totalSteps={TOTAL_SLIDES}
          currentStep={currentSlide}
          onSkip={onSkip}
          showSkip={showSkip}
        />
      )}

      {/* Navigation back button (when not first slide) */}
      {!isFirstSlide && (
        <div className="absolute top-6 left-4 z-10">
          <Button variant="ghost" size="sm" onClick={handlePrev} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Slide content */}
      <div className="flex-1 overflow-y-auto" key={currentSlide}>
        {renderSlideContent()}
      </div>
    </div>
  );
}

export { TOTAL_SLIDES as APP_TOUR_SLIDES };
