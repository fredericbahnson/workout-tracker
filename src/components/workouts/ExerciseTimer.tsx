import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Check, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatTime } from '@/types';
import { getAudioContext, playCountdownBeep, playCompletionSound } from '@/utils/audio';

interface ExerciseTimerProps {
  targetSeconds: number;
  exerciseName: string;
  onComplete: (actualSeconds: number) => void;
  onCancel: () => void;
  onSkipToLog: () => void;
  /** Volume 0-100, default 40 */
  volume?: number;
}

export function ExerciseTimer({
  targetSeconds,
  exerciseName,
  onComplete,
  onCancel,
  onSkipToLog,
  volume = 40,
}: ExerciseTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(targetSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const lastBeepRef = useRef<number | null>(null);

  const elapsedTime = targetSeconds - timeRemaining;

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle countdown beeps and completion
  useEffect(() => {
    if (isRunning && timeRemaining <= 3 && timeRemaining > 0) {
      // Play beep for 3, 2, 1
      if (lastBeepRef.current !== timeRemaining) {
        playCountdownBeep(volume);
        lastBeepRef.current = timeRemaining;
      }
    }

    if (timeRemaining === 0 && isRunning) {
      setIsRunning(false);
      setIsComplete(true);
      playCompletionSound(volume);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [timeRemaining, isRunning, volume]);

  const startTimer = useCallback(async () => {
    // Initialize audio context on user interaction (required by browsers)
    const ctx = getAudioContext();
    await ctx.resume();

    setIsRunning(true);
    lastBeepRef.current = null;

    intervalRef.current = window.setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    pauseTimer();
    setTimeRemaining(targetSeconds);
    setIsComplete(false);
    lastBeepRef.current = null;
  }, [targetSeconds, pauseTimer]);

  const handleLogElapsedTime = () => {
    onComplete(elapsedTime);
  };

  const handleLogTargetTime = () => {
    onComplete(targetSeconds);
  };

  // Calculate progress percentage
  const progress = ((targetSeconds - timeRemaining) / targetSeconds) * 100;

  return (
    <div className="flex flex-col items-center">
      {/* Exercise name */}
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6 text-center">
        {exerciseName}
      </h3>

      {/* Timer circle */}
      <div className="relative w-64 h-64 mb-8">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 256 256">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
            className={`transition-all duration-1000 ease-linear ${
              isComplete
                ? 'text-green-500'
                : timeRemaining <= 3
                  ? 'text-orange-500'
                  : 'text-primary-500'
            }`}
          />
        </svg>

        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-5xl font-bold tabular-nums ${
              isComplete
                ? 'text-green-600 dark:text-green-400'
                : timeRemaining <= 3 && isRunning
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            {formatTime(timeRemaining)}
          </span>
          {!isComplete && (
            <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Target: {formatTime(targetSeconds)}
            </span>
          )}
          {isComplete && (
            <span className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium">
              Complete!
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      {!isComplete ? (
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            {!isRunning ? (
              <Button
                onClick={startTimer}
                className="w-16 h-16 rounded-full p-0 flex items-center justify-center"
              >
                <Play className="w-8 h-8 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={pauseTimer}
                variant="secondary"
                className="w-16 h-16 rounded-full p-0 flex items-center justify-center"
              >
                <Pause className="w-8 h-8" />
              </Button>
            )}

            <Button
              onClick={resetTimer}
              variant="ghost"
              className="w-12 h-12 rounded-full p-0 flex items-center justify-center"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>

          {/* Show Log Elapsed button when paused with some time elapsed */}
          {!isRunning && elapsedTime > 0 && (
            <Button onClick={handleLogElapsedTime} variant="secondary" className="w-full max-w-xs">
              <Check className="w-4 h-4 mr-2" />
              Log {formatTime(elapsedTime)}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3 w-full max-w-xs mb-6">
          <Button onClick={handleLogTargetTime} className="w-full">
            <Check className="w-5 h-5 mr-2" />
            Log {formatTime(targetSeconds)}
          </Button>
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex gap-3 w-full max-w-xs">
        <Button onClick={onCancel} variant="ghost" className="flex-1">
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={onSkipToLog} variant="secondary" className="flex-1">
          Enter Time
        </Button>
      </div>
    </div>
  );
}
