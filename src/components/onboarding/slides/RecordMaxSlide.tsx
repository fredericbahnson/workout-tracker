/**
 * RecordMaxSlide Component
 *
 * Low-pressure framing for establishing initial baseline.
 * "What's your best?" rather than "Max reps".
 */

import { useState, useEffect } from 'react';
import { Trophy, ArrowRight, HelpCircle } from 'lucide-react';
import { Button, NumberInput } from '@/components/ui';

interface RecordMaxSlideProps {
  exerciseName: string;
  onNext: (maxReps: number | null) => void;
}

export function RecordMaxSlide({ exerciseName, onNext }: RecordMaxSlideProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [maxReps, setMaxReps] = useState<number>(10);
  const [showTip, setShowTip] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    onNext(maxReps > 0 ? maxReps : null);
  };

  const handleSkip = () => {
    onNext(null);
  };

  return (
    <div
      className={`
        flex flex-col h-full transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="max-w-sm w-full">
          {/* Icon */}
          <div
            className={`
              w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500
              flex items-center justify-center shadow-lg
              transition-transform duration-500 delay-100
              ${isVisible ? 'scale-100' : 'scale-90'}
            `}
          >
            <Trophy className="w-10 h-10 text-white" />
          </div>

          {/* Headline */}
          <h2
            className={`
              text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2
              transition-all duration-500 delay-150
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
            `}
          >
            What's Your Best?
          </h2>

          <p
            className={`
              text-gray-600 dark:text-gray-400 text-center mb-8
              transition-all duration-500 delay-200
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
            `}
          >
            How many <strong className="text-gray-900 dark:text-gray-100">{exerciseName}</strong>{' '}
            can you do in one set,{' '}
            <span className="font-semibold text-primary-600 dark:text-primary-400">
              with good form
            </span>
            ?
          </p>

          {/* Max input */}
          <div
            className={`
              bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 text-center
              transition-all duration-500 delay-300
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <NumberInput
                value={maxReps}
                onChange={setMaxReps}
                min={1}
                max={100}
                className="w-24 text-center text-2xl font-bold"
              />
              <span className="text-lg text-gray-600 dark:text-gray-400">reps</span>
            </div>

            {/* Tip toggle */}
            <button
              type="button"
              onClick={() => setShowTip(!showTip)}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Not sure?
            </button>

            {/* Tip content */}
            {showTip && (
              <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-left text-sm text-primary-700 dark:text-primary-300">
                <p className="mb-2">
                  <strong>It's okay to estimate!</strong>
                </p>
                <p>
                  Think of a recent workout where you pushed hard but kept good form. That number is
                  your starting point. You can update it anytime.
                </p>
              </div>
            )}
          </div>

          {/* Why this matters */}
          <p
            className={`
              text-xs text-gray-500 dark:text-gray-400 text-center mt-4
              transition-all duration-500 delay-400
              ${isVisible ? 'opacity-100' : 'opacity-0'}
            `}
          >
            Ascend uses this to calculate your training targets
          </p>
        </div>
      </div>

      {/* Actions - fixed at bottom */}
      <div
        className={`
          px-6 pb-24 pt-4 space-y-3
          transition-all duration-500 delay-500
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
      >
        <Button
          onClick={handleSubmit}
          disabled={maxReps < 1}
          className="w-full py-3 text-base font-medium"
        >
          Save & Continue
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        <Button variant="ghost" onClick={handleSkip} className="w-full py-2 text-sm">
          I'll set this later
        </Button>
      </div>
    </div>
  );
}
