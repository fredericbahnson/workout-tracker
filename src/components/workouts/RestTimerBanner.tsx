/**
 * RestTimerBanner - non-blocking rest timer.
 *
 * Renders as a compact bar pinned above the bottom tab bar so the set list
 * stays visible and tappable while resting; tapping the bar expands it into
 * a bottom sheet with the full dial and controls.
 *
 * TIMING INVARIANTS (do not break):
 * - This component is the ONLY caller of useCountdownTimer for rest timers.
 *   The compact and expanded layouts are conditional JSX inside this one
 *   component, so expanding/collapsing never unmounts the hook instance and
 *   native sounds are never double-scheduled.
 * - useCountdownTimer reads its duration at mount only. To restart with a
 *   new duration (logging another set mid-timer), the host remounts this
 *   component via a changing React `key`; the old instance's unmount cleanup
 *   cancels its scheduled sounds before the new one auto-starts.
 */

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, X, Plus, Minus, ChevronDown, Timer } from 'lucide-react';
import { Button } from '@/components/ui';
import { useCountdownTimer } from '@/hooks/useCountdownTimer';

interface RestTimerBannerProps {
  initialSeconds: number;
  onDismiss: () => void;
  /** Volume 0-100, default 40 */
  volume?: number;
}

/** How long the green "Done!" state stays visible before auto-dismissing */
const AUTO_DISMISS_DELAY_MS = 2000;

function formatTimeDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function RestTimerBanner({ initialSeconds, onDismiss, volume = 40 }: RestTimerBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const autoDismissRef = useRef<number | null>(null);

  const { timeRemaining, isRunning, isComplete, start, pause, reset, addTime } = useCountdownTimer({
    totalSeconds: initialSeconds,
    volume,
    onComplete: () => {
      // Auto-dismiss shortly after completion; cancelled if the user re-arms
      autoDismissRef.current = window.setTimeout(() => {
        onDismiss();
      }, AUTO_DISMISS_DELAY_MS);
    },
    autoStart: true,
  });

  // Clear any pending auto-dismiss on unmount
  useEffect(() => {
    return () => {
      if (autoDismissRef.current !== null) {
        window.clearTimeout(autoDismissRef.current);
      }
    };
  }, []);

  const cancelAutoDismiss = () => {
    if (autoDismissRef.current !== null) {
      window.clearTimeout(autoDismissRef.current);
      autoDismissRef.current = null;
    }
  };

  const togglePause = () => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  };

  const handleReset = () => {
    cancelAutoDismiss();
    reset();
    start();
  };

  const handleAddTime = (seconds: number) => {
    cancelAutoDismiss();
    addTime(seconds);
    // If adding time from completed state, auto-start
    if (isComplete && seconds > 0) {
      // Small delay to let state update
      setTimeout(() => start(), 0);
    }
  };

  const progress = initialSeconds > 0 ? timeRemaining / initialSeconds : 0;
  const timeColorClass = isComplete
    ? 'text-green-600 dark:text-green-400'
    : timeRemaining <= 10
      ? 'text-orange-600 dark:text-orange-400'
      : 'text-gray-900 dark:text-gray-100';
  const ringColorClass = isComplete
    ? 'text-green-500'
    : timeRemaining <= 10
      ? 'text-orange-500'
      : 'text-primary-500';

  return (
    <>
      {/* Expanded bottom sheet (backdrop tap collapses, does NOT dismiss the timer) */}
      {expanded && (
        <div className="fixed inset-0 z-40" role="dialog" aria-label="Rest timer">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setExpanded(false)}
            aria-hidden="true"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-xl safe-area-bottom">
            <div className="max-w-lg mx-auto">
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setExpanded(false)}
                  aria-label="Collapse rest timer"
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col items-center px-6 pb-6 space-y-6">
                {/* Timer dial */}
                <div className="relative w-48 h-48">
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
                      className={`transition-all duration-1000 ${ringColorClass}`}
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                      className={`text-gym-2xl ${
                        isComplete
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-900 dark:text-gray-100'
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
            </div>
          </div>
        </div>
      )}

      {/* Compact bar - pinned above the bottom tab bar (h-16 + safe area) */}
      {!expanded && (
        <div
          className="fixed left-0 right-0 z-40"
          style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
          aria-label="Rest timer"
        >
          <div className="max-w-lg mx-auto px-2 pb-1">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-gray-900 shadow-lg px-3 py-2">
              {/* Expand target: icon + time */}
              <button
                onClick={() => setExpanded(true)}
                aria-expanded={false}
                aria-label="Expand rest timer"
                className="flex items-center gap-2 flex-1 min-w-0 text-left"
              >
                <Timer className={`w-5 h-5 flex-shrink-0 ${ringColorClass}`} />
                <span className={`text-lg font-semibold tabular-nums ${timeColorClass}`}>
                  {isComplete ? 'Done!' : formatTimeDisplay(timeRemaining)}
                </span>
                {!isComplete && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {isRunning ? 'Rest' : 'Paused'}
                  </span>
                )}
              </button>

              {!isComplete && (
                <>
                  <button
                    onClick={togglePause}
                    aria-label={isRunning ? 'Pause rest timer' : 'Resume rest timer'}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleAddTime(15)}
                    aria-label="Add 15 seconds"
                    className="px-2 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    +15s
                  </button>
                </>
              )}
              <button
                onClick={onDismiss}
                aria-label="Skip rest timer"
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
