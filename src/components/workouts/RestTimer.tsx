import { Play, Pause, RotateCcw, X, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui';
import { useCountdownTimer } from '@/hooks/useCountdownTimer';

interface RestTimerProps {
  initialSeconds: number;
  onDismiss: () => void;
  onComplete?: () => void;
  /** Volume 0-100, default 40 */
  volume?: number;
}

export function RestTimer({ initialSeconds, onDismiss, onComplete, volume = 40 }: RestTimerProps) {
  const { timeRemaining, isRunning, isComplete, start, pause, reset, addTime } = useCountdownTimer({
    totalSeconds: initialSeconds,
    volume,
    onComplete,
    autoStart: true,
  });

  const togglePause = () => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  };

  const handleReset = () => {
    reset();
    start();
  };

  const handleAddTime = (seconds: number) => {
    addTime(seconds);
    // If adding time from completed state, auto-start
    if (isComplete && seconds > 0) {
      // Small delay to let state update
      setTimeout(() => start(), 0);
    }
  };

  const formatTimeDisplay = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = timeRemaining / initialSeconds;

  return (
    <div className="flex flex-col items-center p-6 space-y-6">
      {/* Timer Display */}
      <div className="relative w-48 h-48">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 192 192">
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={2 * Math.PI * 88}
            strokeDashoffset={2 * Math.PI * 88 * (1 - progress)}
            strokeLinecap="round"
            className={`transition-all duration-1000 ${
              isComplete
                ? 'text-green-500'
                : timeRemaining <= 10
                  ? 'text-orange-500'
                  : 'text-primary-500'
            }`}
          />
        </svg>

        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-gym-2xl ${
              isComplete ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            {isComplete ? 'Done!' : formatTimeDisplay(timeRemaining)}
          </span>
          {!isComplete && (
            <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isRunning ? 'Rest' : 'Paused'}
            </span>
          )}
        </div>
      </div>

      {/* Quick adjust buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAddTime(-15)}
          disabled={timeRemaining < 15 && !isComplete}
          className="text-gray-500"
        >
          <Minus className="w-4 h-4 mr-1" />
          15s
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAddTime(15)}
          className="text-gray-500"
        >
          <Plus className="w-4 h-4 mr-1" />
          15s
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAddTime(30)}
          className="text-gray-500"
        >
          <Plus className="w-4 h-4 mr-1" />
          30s
        </Button>
      </div>

      {/* Control buttons */}
      <div className="flex items-center gap-3">
        {!isComplete && (
          <Button variant="secondary" onClick={togglePause} className="w-24">
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" />
                Resume
              </>
            )}
          </Button>
        )}

        <Button variant="secondary" onClick={handleReset} className="w-24">
          <RotateCcw className="w-4 h-4 mr-1" />
          Reset
        </Button>

        <Button variant="primary" onClick={onDismiss} className="w-24">
          <X className="w-4 h-4 mr-1" />
          {isComplete ? 'Done' : 'Skip'}
        </Button>
      </div>
    </div>
  );
}
