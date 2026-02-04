import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdownTimer } from './useCountdownTimer';

// Mock audio utilities
vi.mock('@/utils/audio', () => ({
  getAudioContext: vi.fn(() => ({ resume: vi.fn() })),
  startAudioKeepAlive: vi.fn(),
  stopAudioKeepAlive: vi.fn(),
  playCountdownBeep: vi.fn(),
  playCompletionSound: vi.fn(),
  scheduleCountdownSounds: vi.fn(() => vi.fn()),
}));

// Mock timer notifications
vi.mock('@/utils/timerNotifications', () => ({
  scheduleTimerNotification: vi.fn(() => Promise.resolve(1)),
  cancelTimerNotification: vi.fn(() => Promise.resolve()),
}));

describe('useCountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Date, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useCountdownTimer({ totalSeconds: 60 }));

    expect(result.current.timeRemaining).toBe(60);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isComplete).toBe(false);
  });

  it('starts counting down on start()', () => {
    const { result } = renderHook(() => useCountdownTimer({ totalSeconds: 10 }));

    act(() => {
      result.current.start();
    });

    expect(result.current.isRunning).toBe(true);

    // Advance 3 seconds
    vi.spyOn(Date, 'now').mockReturnValue(3000);
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current.timeRemaining).toBe(7);
  });

  it('uses wall-clock time, not interval count', () => {
    const { result } = renderHook(() => useCountdownTimer({ totalSeconds: 10 }));

    act(() => {
      result.current.start();
    });

    // Simulate 5 seconds passing but only 1 interval tick
    vi.spyOn(Date, 'now').mockReturnValue(5000);
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current.timeRemaining).toBe(5);
  });

  it('completes when time reaches zero', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCountdownTimer({ totalSeconds: 5, onComplete }));

    act(() => {
      result.current.start();
    });

    vi.spyOn(Date, 'now').mockReturnValue(5000);
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current.timeRemaining).toBe(0);
    expect(result.current.isComplete).toBe(true);
    expect(result.current.isRunning).toBe(false);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('pauses and captures remaining time correctly', () => {
    const { result } = renderHook(() => useCountdownTimer({ totalSeconds: 10 }));

    act(() => {
      result.current.start();
    });

    // Advance 3 seconds then pause
    vi.spyOn(Date, 'now').mockReturnValue(3000);
    act(() => {
      vi.advanceTimersByTime(250);
    });
    act(() => {
      result.current.pause();
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.timeRemaining).toBe(7);

    // Advance real time while paused - should NOT change
    vi.spyOn(Date, 'now').mockReturnValue(10000);
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.timeRemaining).toBe(7);
  });

  it('resumes from paused state correctly', () => {
    const { result } = renderHook(() => useCountdownTimer({ totalSeconds: 10 }));

    // Start
    act(() => {
      result.current.start();
    });

    // Run 3s then pause
    vi.spyOn(Date, 'now').mockReturnValue(3000);
    act(() => {
      vi.advanceTimersByTime(250);
    });
    act(() => {
      result.current.pause();
    });

    // Resume at t=5000 (2s after pause, but pause captured 7s remaining)
    vi.spyOn(Date, 'now').mockReturnValue(5000);
    act(() => {
      result.current.start();
    });

    // Run 2 more seconds from resume point
    vi.spyOn(Date, 'now').mockReturnValue(7000);
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current.timeRemaining).toBe(5);
  });

  it('resets to initial state', () => {
    const { result } = renderHook(() => useCountdownTimer({ totalSeconds: 10 }));

    act(() => {
      result.current.start();
    });

    vi.spyOn(Date, 'now').mockReturnValue(3000);
    act(() => {
      vi.advanceTimersByTime(250);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.timeRemaining).toBe(10);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isComplete).toBe(false);
  });

  it('addTime adjusts time while paused', () => {
    const { result } = renderHook(() => useCountdownTimer({ totalSeconds: 10 }));

    act(() => {
      result.current.addTime(15);
    });

    expect(result.current.timeRemaining).toBe(25);

    act(() => {
      result.current.addTime(-5);
    });

    expect(result.current.timeRemaining).toBe(20);
  });

  it('addTime does not go below zero', () => {
    const { result } = renderHook(() => useCountdownTimer({ totalSeconds: 5 }));

    act(() => {
      result.current.addTime(-10);
    });

    expect(result.current.timeRemaining).toBe(0);
  });

  it('addTime resumes from completed state', () => {
    const { result } = renderHook(() => useCountdownTimer({ totalSeconds: 5 }));

    // Run to completion
    act(() => {
      result.current.start();
    });
    vi.spyOn(Date, 'now').mockReturnValue(5000);
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current.isComplete).toBe(true);

    // Add time from completed state
    act(() => {
      result.current.addTime(30);
    });

    expect(result.current.isComplete).toBe(false);
    expect(result.current.timeRemaining).toBe(30);
    // Should not auto-start
    expect(result.current.isRunning).toBe(false);
  });

  it('handles visibility change by recalculating time', () => {
    const { result } = renderHook(() => useCountdownTimer({ totalSeconds: 60 }));

    act(() => {
      result.current.start();
    });

    // Simulate backgrounding for 30 seconds
    vi.spyOn(Date, 'now').mockReturnValue(30000);

    // Simulate returning to foreground
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.timeRemaining).toBe(30);
  });

  it('completes if timer expired while backgrounded', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCountdownTimer({ totalSeconds: 10, onComplete }));

    act(() => {
      result.current.start();
    });

    // Simulate backgrounding past timer end
    vi.spyOn(Date, 'now').mockReturnValue(15000);

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.timeRemaining).toBe(0);
    expect(result.current.isComplete).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
