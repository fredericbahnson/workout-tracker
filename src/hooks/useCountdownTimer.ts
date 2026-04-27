import { useState, useEffect, useRef, useCallback } from 'react';
import { timerAudio } from '@/plugins/timerAudio';
import { scheduleTimerNotification, cancelTimerNotification } from '@/utils/timerNotifications';

interface UseCountdownTimerOptions {
  /** Total duration in seconds */
  totalSeconds: number;
  /** Volume 0-100, default 40 */
  volume?: number;
  /** Called when timer reaches zero */
  onComplete?: () => void;
  /** Whether to auto-start on mount */
  autoStart?: boolean;
}

interface UseCountdownTimerReturn {
  timeRemaining: number;
  isRunning: boolean;
  isComplete: boolean;
  start: () => Promise<void>;
  pause: () => void;
  reset: () => void;
  addTime: (seconds: number) => void;
}

export function useCountdownTimer({
  totalSeconds,
  volume = 40,
  onComplete,
  autoStart = false,
}: UseCountdownTimerOptions): UseCountdownTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Wall-clock refs
  const startTimeRef = useRef<number>(0);
  const pausedRemainingRef = useRef<number>(totalSeconds);
  const intervalRef = useRef<number | null>(null);

  const notificationIdRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Cleanup interval helper
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Complete the timer.
  // The native plugin schedules its own keep-alive stop at completion+1s via
  // DispatchWorkItem, and that work item is cancelled cleanly when the next
  // scheduleCountdown is called. Don't duplicate it here with a JS setTimeout —
  // a stale setTimeout from a previous timer can fire during the next timer
  // and kill its keep-alive, which compounds across sets.
  const completeTimer = useCallback(() => {
    clearTimer();
    setTimeRemaining(0);
    setIsRunning(false);
    setIsComplete(true);
    if (notificationIdRef.current !== null) {
      cancelTimerNotification(notificationIdRef.current);
      notificationIdRef.current = null;
    }
    onCompleteRef.current?.();
  }, [clearTimer]);

  // Tick function: compute time from wall clock
  const tick = useCallback(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const remaining = Math.max(0, pausedRemainingRef.current - elapsed);
    const rounded = Math.ceil(remaining);

    if (remaining <= 0) {
      completeTimer();
    } else {
      setTimeRemaining(rounded);
    }
  }, [completeTimer]);

  // Start or resume the timer
  const start = useCallback(async () => {
    if (isComplete) return;

    startTimeRef.current = Date.now();
    // pausedRemainingRef already holds the correct value

    setIsRunning(true);

    // Hand the entire countdown to the native plugin immediately.
    // JS setInterval gets throttled/suspended in the background on iOS, so
    // deferring the schedule until timeRemaining===5 is unreliable for long timers.
    const remaining = pausedRemainingRef.current;
    if (volume > 0) {
      timerAudio.scheduleCountdown({ secondsRemaining: remaining, volume });
    }

    // Schedule local notification
    scheduleTimerNotification(remaining, 'Timer Complete', 'Your timer has finished.').then(id => {
      notificationIdRef.current = id;
    });

    // Start interval at 250ms for responsiveness
    clearTimer();
    intervalRef.current = window.setInterval(tick, 250);
  }, [isComplete, volume, tick, clearTimer]);

  const pause = useCallback(() => {
    if (!isRunning) return;

    // Capture remaining time based on wall clock
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    pausedRemainingRef.current = Math.max(0, pausedRemainingRef.current - elapsed);

    clearTimer();
    timerAudio.cancelScheduledSounds();
    timerAudio.stopKeepAlive();
    setIsRunning(false);

    // Cancel notification
    if (notificationIdRef.current !== null) {
      cancelTimerNotification(notificationIdRef.current);
      notificationIdRef.current = null;
    }
  }, [isRunning, clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    timerAudio.cancelScheduledSounds();
    timerAudio.stopKeepAlive();
    pausedRemainingRef.current = totalSeconds;
    setTimeRemaining(totalSeconds);
    setIsRunning(false);
    setIsComplete(false);

    if (notificationIdRef.current !== null) {
      cancelTimerNotification(notificationIdRef.current);
      notificationIdRef.current = null;
    }
  }, [totalSeconds, clearTimer]);

  const addTime = useCallback(
    (seconds: number) => {
      if (isRunning) {
        // Adjust the pausedRemaining so the wall-clock math stays correct
        pausedRemainingRef.current += seconds;
        // Also reschedule notification
        if (notificationIdRef.current !== null) {
          cancelTimerNotification(notificationIdRef.current);
        }
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const newRemaining = Math.max(0, pausedRemainingRef.current - elapsed);
        scheduleTimerNotification(newRemaining, 'Timer Complete', 'Your timer has finished.').then(
          id => {
            notificationIdRef.current = id;
          }
        );
        // Reschedule countdown sounds against the new completion time
        timerAudio.cancelScheduledSounds();
        if (volume > 0 && newRemaining > 0) {
          timerAudio.scheduleCountdown({ secondsRemaining: newRemaining, volume });
        }
      } else if (isComplete && seconds > 0) {
        // Resume from completed state with added time
        pausedRemainingRef.current = seconds;
        setTimeRemaining(seconds);
        setIsComplete(false);
        // Don't auto-start, let user press play
      } else {
        // Paused, not complete
        pausedRemainingRef.current = Math.max(0, pausedRemainingRef.current + seconds);
        setTimeRemaining(Math.max(0, Math.ceil(pausedRemainingRef.current)));
      }
    },
    [isRunning, isComplete, volume]
  );

  // Handle visibility change: recalculate on return from background
  useEffect(() => {
    if (!isRunning) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Recalculate immediately
        tick();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, tick]);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart) {
      start();
    }
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      timerAudio.cancelScheduledSounds();
      timerAudio.stopKeepAlive();
      if (notificationIdRef.current !== null) {
        cancelTimerNotification(notificationIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    timeRemaining,
    isRunning,
    isComplete,
    start,
    pause,
    reset,
    addTime,
  };
}
