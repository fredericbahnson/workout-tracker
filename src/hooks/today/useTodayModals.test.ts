/**
 * useTodayModals Tests - rest timer state
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTodayModals } from './useTodayModals';

describe('useTodayModals rest timer', () => {
  it('opens with the given duration and increments restTimerKey each time', () => {
    const { result } = renderHook(() => useTodayModals());

    expect(result.current.showRestTimer).toBe(false);
    const initialKey = result.current.restTimerKey;

    act(() => {
      result.current.openRestTimer(60);
    });
    expect(result.current.showRestTimer).toBe(true);
    expect(result.current.restTimerDuration).toBe(60);
    expect(result.current.restTimerKey).toBe(initialKey + 1);

    // Opening again mid-timer bumps the key so the banner remounts
    act(() => {
      result.current.openRestTimer(45);
    });
    expect(result.current.restTimerDuration).toBe(45);
    expect(result.current.restTimerKey).toBe(initialKey + 2);
  });

  it('keeps the previous duration when opened without one', () => {
    const { result } = renderHook(() => useTodayModals({ defaultRestTimerDuration: 120 }));

    act(() => {
      result.current.openRestTimer();
    });
    expect(result.current.restTimerDuration).toBe(120);
    expect(result.current.showRestTimer).toBe(true);
  });

  it('closes without touching the key', () => {
    const { result } = renderHook(() => useTodayModals());

    act(() => {
      result.current.openRestTimer(60);
    });
    const key = result.current.restTimerKey;

    act(() => {
      result.current.closeRestTimer();
    });
    expect(result.current.showRestTimer).toBe(false);
    expect(result.current.restTimerKey).toBe(key);
  });
});
