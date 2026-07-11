/**
 * RestTimerBanner Tests
 *
 * Verifies the single-hook-instance invariants: expanding/collapsing must not
 * reset the countdown (no remount), while a changed React key must remount
 * and restart it.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RestTimerBanner } from './RestTimerBanner';

// Mock native timer audio plugin (same pattern as useCountdownTimer.test.ts)
vi.mock('@/plugins/timerAudio', () => ({
  timerAudio: {
    scheduleCountdown: vi.fn(() => Promise.resolve()),
    cancelScheduledSounds: vi.fn(() => Promise.resolve()),
    stopKeepAlive: vi.fn(() => Promise.resolve()),
  },
}));

// Mock timer notifications
vi.mock('@/utils/timerNotifications', () => ({
  scheduleTimerNotification: vi.fn(() => Promise.resolve(1)),
  cancelTimerNotification: vi.fn(() => Promise.resolve()),
}));

describe('RestTimerBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Date, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the compact bar with the countdown', async () => {
    render(<RestTimerBanner initialSeconds={90} onDismiss={() => {}} />);
    // autoStart runs async on mount
    await act(async () => {});

    expect(screen.getByText('1:30')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Expand rest timer' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Skip rest timer' })).toBeTruthy();
  });

  it('counts down using wall-clock time', async () => {
    render(<RestTimerBanner initialSeconds={90} onDismiss={() => {}} />);
    await act(async () => {});

    vi.spyOn(Date, 'now').mockReturnValue(5000);
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(screen.getByText('1:25')).toBeTruthy();
  });

  it('preserves the countdown across expand and collapse (no remount)', async () => {
    render(<RestTimerBanner initialSeconds={90} onDismiss={() => {}} />);
    await act(async () => {});

    // Run 10 seconds down
    vi.spyOn(Date, 'now').mockReturnValue(10_000);
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.getByText('1:20')).toBeTruthy();

    // Expand -> full dial shows the same remaining time
    fireEvent.click(screen.getByRole('button', { name: 'Expand rest timer' }));
    expect(screen.getByText('1:20')).toBeTruthy();

    // Collapse -> still the same remaining time, not reset to 1:30
    fireEvent.click(screen.getByRole('button', { name: 'Collapse rest timer' }));
    expect(screen.getByText('1:20')).toBeTruthy();
    expect(screen.queryByText('1:30')).toBeNull();
  });

  it('restarts when remounted via a changed key', async () => {
    const { rerender } = render(
      <RestTimerBanner key={1} initialSeconds={90} onDismiss={() => {}} />
    );
    await act(async () => {});

    vi.spyOn(Date, 'now').mockReturnValue(10_000);
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.getByText('1:20')).toBeTruthy();

    // New key + new duration = fresh timer (this is how logging another set
    // mid-countdown replaces the running timer)
    rerender(<RestTimerBanner key={2} initialSeconds={60} onDismiss={() => {}} />);
    await act(async () => {});

    expect(screen.getByText('1:00')).toBeTruthy();
  });

  it('calls onDismiss when skip is tapped', async () => {
    const onDismiss = vi.fn();
    render(<RestTimerBanner initialSeconds={90} onDismiss={onDismiss} />);
    await act(async () => {});

    fireEvent.click(screen.getByRole('button', { name: 'Skip rest timer' }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('auto-dismisses shortly after completion', async () => {
    const onDismiss = vi.fn();
    render(<RestTimerBanner initialSeconds={10} onDismiss={onDismiss} />);
    await act(async () => {});

    // Run past completion
    vi.spyOn(Date, 'now').mockReturnValue(11_000);
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.getByText('Done!')).toBeTruthy();
    expect(onDismiss).not.toHaveBeenCalled();

    // Auto-dismiss fires ~2s later
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(onDismiss).toHaveBeenCalled();
  });

  it('backdrop tap collapses the expanded sheet without dismissing the timer', async () => {
    const onDismiss = vi.fn();
    render(<RestTimerBanner initialSeconds={90} onDismiss={onDismiss} />);
    await act(async () => {});

    fireEvent.click(screen.getByRole('button', { name: 'Expand rest timer' }));
    const dialog = screen.getByRole('dialog', { name: 'Rest timer' });
    const backdrop = dialog.firstElementChild as HTMLElement;
    fireEvent.click(backdrop);

    expect(onDismiss).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Expand rest timer' })).toBeTruthy();
  });
});
