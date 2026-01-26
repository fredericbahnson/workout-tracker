/**
 * StaticSwipeDemo Component
 *
 * A static visual demonstration of swipe gestures for onboarding.
 * Shows a partially swiped card with revealed background and directional arrow.
 * Replaces the interactive SwipeDemo to avoid iOS WebView touch offset issues.
 */

import { CheckCircle, X } from 'lucide-react';

interface StaticSwipeDemoProps {
  mode: 'complete' | 'skip';
  exercise: string;
  targetReps: number;
}

export function StaticSwipeDemo({ mode, exercise, targetReps }: StaticSwipeDemoProps) {
  const isComplete = mode === 'complete';

  // Card offset to show the background action
  const cardOffset = isComplete ? 60 : -60;

  return (
    <div className="flex flex-col">
      {/* Main demo container */}
      <div className="relative overflow-hidden rounded-xl h-[88px]">
        {/* Background action indicator */}
        <div
          className={`absolute inset-0 flex items-center rounded-xl ${
            isComplete ? 'justify-start pl-4 bg-green-500' : 'justify-end pr-4 bg-red-500'
          }`}
        >
          <div className="flex items-center gap-2 text-white">
            {isComplete ? (
              <>
                <CheckCircle className="w-6 h-6" />
                <span className="font-semibold">Complete</span>
              </>
            ) : (
              <>
                <span className="font-semibold">Skip</span>
                <X className="w-6 h-6" />
              </>
            )}
          </div>
        </div>

        {/* Static card positioned with offset */}
        <div
          className={`relative bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border-2 ${
            isComplete ? 'border-green-400' : 'border-red-400'
          }`}
          style={{
            transform: `translateX(${cardOffset}px)`,
          }}
        >
          {/* Set card content */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                {exercise}
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                Target:{' '}
                <span className="font-medium text-primary-600 dark:text-primary-400">
                  {targetReps} reps
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-400">1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
