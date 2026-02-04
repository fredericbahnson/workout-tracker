import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getAudioContext,
  startAudioKeepAlive,
  stopAudioKeepAlive,
  playCountdownBeep,
  playCompletionSound,
  scheduleCountdownSounds,
} from '@/utils/audio';
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
  start: () => void;
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

  // Sound tracking refs
  const lastBeepRef = useRef<number | null>(null);
  const scheduledSoundsCancelRef = useRef<(() => void) | null>(null);
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

  // Cancel scheduled sounds
  const cancelScheduledSounds = useCallback(() => {
    if (scheduledSoundsCancelRef.current) {
      scheduledSoundsCancelRef.current();
      scheduledSoundsCancelRef.current = null;
    }
  }, []);

  // Complete the timer
  const completeTimer = useCallback(() => {
    clearTimer();
    cancelScheduledSounds();
    setTimeRemaining(0);
    setIsRunning(false);
    setIsComplete(true);
    playCompletionSound(volume);
    stopAudioKeepAlive();
    if (notificationIdRef.current !== null) {
      cancelTimerNotification(notificationIdRef.current);
      notificationIdRef.current = null;
    }
    onCompleteRef.current?.();
  }, [volume, clearTimer, cancelScheduledSounds]);

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
  const start = useCallback(() => {
    if (isComplete) return;

    // Init audio context from user gesture
    const ctx = getAudioContext();
    ctx.resume();
    startAudioKeepAlive();

    startTimeRef.current = Date.now();
    // pausedRemainingRef already holds the correct value

    setIsRunning(true);
    lastBeepRef.current = null;

    // Schedule local notification
    const remaining = pausedRemainingRef.current;
    scheduleTimerNotification(remaining, 'Timer Complete', 'Your timer has finished.').then(id => {
      notificationIdRef.current = id;
    });

    // Start interval at 250ms for responsiveness
    clearTimer();
    intervalRef.current = window.setInterval(tick, 250);
  }, [isComplete, tick, clearTimer]);

  const pause = useCallback(() => {
    if (!isRunning) return;

    // Capture remaining time based on wall clock
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    pausedRemainingRef.current = Math.max(0, pausedRemainingRef.current - elapsed);

    clearTimer();
    cancelScheduledSounds();
    stopAudioKeepAlive();
    setIsRunning(false);

    // Cancel notification
    if (notificationIdRef.current !== null) {
      cancelTimerNotification(notificationIdRef.current);
      notificationIdRef.current = null;
    }
  }, [isRunning, clearTimer, cancelScheduledSounds]);

  const reset = useCallback(() => {
    clearTimer();
    cancelScheduledSounds();
    stopAudioKeepAlive();
    pausedRemainingRef.current = totalSeconds;
    setTimeRemaining(totalSeconds);
    setIsRunning(false);
    setIsComplete(false);
    lastBeepRef.current = null;

    if (notificationIdRef.current !== null) {
      cancelTimerNotification(notificationIdRef.current);
      notificationIdRef.current = null;
    }
  }, [totalSeconds, clearTimer, cancelScheduledSounds]);

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
        // Cancel pre-scheduled sounds since timing changed
        cancelScheduledSounds();
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
    [isRunning, isComplete, cancelScheduledSounds]
  );

  // Reactive sound effects based on timeRemaining
  useEffect(() => {
    if (!isRunning || volume === 0) return;

    // Pre-schedule sounds when we hit 5 seconds
    if (timeRemaining === 5 && !scheduledSoundsCancelRef.current) {
      scheduledSoundsCancelRef.current = scheduleCountdownSounds(5, volume);
    }

    // Reactive countdown beeps as fallback (3, 2, 1)
    if (timeRemaining <= 3 && timeRemaining > 0 && lastBeepRef.current !== timeRemaining) {
      playCountdownBeep(volume);
      lastBeepRef.current = timeRemaining;
    }
  }, [timeRemaining, isRunning, volume]);

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
      cancelScheduledSounds();
      stopAudioKeepAlive();
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
