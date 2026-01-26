/**
 * SwipeSkipSlide Component
 *
 * Interactive slide where user practices the swipe-left-to-skip gesture.
 * Uses the SwipeDemo component for the actual interaction.
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { SwipeDemo } from '../visuals';

interface SwipeSkipSlideProps {
  onComplete: () => void;
}

export function SwipeSkipSlide({ onComplete }: SwipeSkipSlideProps) {
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
      {/* Content area - use explicit padding instead of justify-center to fix iOS touch target offset */}
      <div className="flex-1 flex flex-col items-center px-6 pt-12">
        {/* Icon */}
        <div
          className={`
            w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500
            flex items-center justify-center shadow-lg
            transition-transform duration-500 delay-100
            ${isVisible ? 'scale-100' : 'scale-90'}
          `}
        >
          <X className="w-10 h-10 text-white" />
        </div>

        {/* Headline */}
        <h2
          className={`
            text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-4
            transition-all duration-500 delay-150
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
          `}
        >
          Swipe Left to Skip
        </h2>

        {/* Instructions */}
        <p
          className={`
            text-gray-600 dark:text-gray-400 text-center mb-8
            transition-all duration-500 delay-200
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
          `}
        >
          Need to skip a set? Swipe left.
        </p>

        {/* Swipe Demo */}
        <div
          className={`
            w-full max-w-sm
            transition-all duration-500 delay-300
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          <SwipeDemo
            exercise="Pull-ups"
            targetReps={8}
            onComplete={onComplete}
            showHint={true}
            mode="skip"
          />
        </div>

        {/* Hint text */}
        <p
          className={`
            text-sm text-gray-500 dark:text-gray-400 text-center mt-6
            transition-all duration-500 delay-400
            ${isVisible ? 'opacity-100' : 'opacity-0'}
          `}
        >
          Skipped sets can always be revisited later
        </p>
      </div>
    </div>
  );
}
