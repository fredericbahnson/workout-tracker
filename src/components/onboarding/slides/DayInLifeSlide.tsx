/**
 * DayInLifeSlide Component
 *
 * Shows what a typical day using Ascend looks like.
 * Experience preview before interactive demo.
 */

import { ArrowRight, Home, ChevronRight, Check } from 'lucide-react';
import { OnboardingSlide } from '../OnboardingSlide';

interface DayInLifeSlideProps {
  onNext: () => void;
}

export function DayInLifeSlide({ onNext }: DayInLifeSlideProps) {
  // Mock set cards to show the Today page appearance
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

  return (
    <OnboardingSlide
      icon={<Home className="w-10 h-10" />}
      headline="Your Daily Workout View"
      variant="tour"
      gradient="from-primary-500 to-cyan-500"
      body={
        <div className="space-y-4">
          <p>Open the app, see your sets, swipe to complete. That's it.</p>

          {/* Mock Today page */}
          <div className="bg-gray-100 dark:bg-gray-800/80 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Today's Workout</span>
              <span className="text-gray-500 dark:text-gray-400">2/6 sets</span>
            </div>
            <MockSetCard exercise="Pull-ups" reps={8} completed />
            <MockSetCard exercise="Push-ups" reps={12} completed />
            <MockSetCard exercise="Pull-ups" reps={8} />
            <MockSetCard exercise="Push-ups" reps={12} />
          </div>

          {/* How it works bullets */}
          <div className="space-y-2 text-sm text-left">
            <div className="flex items-start gap-2">
              <span className="text-primary-500 font-bold mt-0.5">1</span>
              <span className="text-gray-700 dark:text-gray-300">
                See your <strong>target reps</strong> for each set
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary-500 font-bold mt-0.5">2</span>
              <span className="text-gray-700 dark:text-gray-300">
                <strong>Swipe right</strong> to mark complete
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary-500 font-bold mt-0.5">3</span>
              <span className="text-gray-700 dark:text-gray-300">
                <strong>Rest timer</strong> starts automatically
              </span>
            </div>
          </div>
        </div>
      }
      primaryAction={{
        label: 'Try It Yourself',
        onClick: onNext,
        icon: <ArrowRight className="w-5 h-5" />,
      }}
    />
  );
}
