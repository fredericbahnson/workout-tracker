/**
 * ExerciseSuccessSlide Component
 *
 * Congratulations slide after creating first exercise.
 * Directs user to continue with the App Tour.
 */

import { useState, useEffect } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';

interface ExerciseSuccessSlideProps {
  exerciseName: string;
  maxReps: number | null;
  measurementType?: 'reps' | 'time';
  onContinue: () => void;
}

export function ExerciseSuccessSlide({
  exerciseName,
  maxReps,
  measurementType = 'reps',
  onContinue,
}: ExerciseSuccessSlideProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`
        flex flex-col h-full transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-sm mx-auto text-center">
          {/* Success icon */}
          <div
            className={`
              w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30
              flex items-center justify-center
              transition-transform duration-500 delay-100
              ${isVisible ? 'scale-100' : 'scale-90'}
            `}
          >
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>

          {/* Headline */}
          <h2
            className={`
              text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2
              transition-all duration-500 delay-150
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
            `}
          >
            First Exercise Created!
          </h2>

          {/* Summary */}
          <div
            className={`
              bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6
              transition-all duration-500 delay-200
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
            `}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-gray-100">{exerciseName}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {maxReps
                    ? `Max: ${maxReps} ${measurementType === 'reps' ? 'reps' : 'seconds'}`
                    : 'Max not set yet'}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>

          {/* Instruction text */}
          <p
            className={`
              text-gray-600 dark:text-gray-400 mb-8
              transition-all duration-500 delay-300
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
            `}
          >
            Add more exercises from the Exercises tab, then create a training cycle—or start logging
            workouts right away in ad-hoc mode.
          </p>

          {/* Continue button */}
          <div
            className={`
              transition-all duration-500 delay-400
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            <Button onClick={onContinue} size="lg" className="w-full">
              Continue Tour
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export with alias for backward compatibility
export { ExerciseSuccessSlide as ReadySlide };
