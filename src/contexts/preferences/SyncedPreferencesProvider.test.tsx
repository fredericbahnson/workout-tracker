/**
 * Regression tests for the health-disclaimer gating in SyncedPreferencesProvider.
 *
 * The health disclaimer is a LEGAL hard stop: it must never flash past a user
 * who hasn't acknowledged it, and must not re-appear for users who have.
 * These tests pin the loading/acknowledgment derivation:
 * - unknown state (live query in flight) reads as loading, never as unacknowledged
 * - live-query re-runs (undefined) keep the last resolved preferences
 * - loading is derived synchronously from auth/sync state (no stale frame)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SyncedPreferencesProvider } from './SyncedPreferencesProvider';
import { useSyncedPreferences } from './useSyncedPreferences';
import { defaultPrefs } from './types';
import type { UserPreferences } from '@/types';

// Mutable state the mocks read from — mutate between renders to simulate transitions
const mockState: {
  liveQueryResult: UserPreferences | null | undefined;
  user: { id: string } | null;
  isConfigured: boolean;
  lastSyncTime: Date | null;
} = {
  liveQueryResult: undefined,
  user: null,
  isConfigured: false,
  lastSyncTime: null,
};

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: () => mockState.liveQueryResult,
}));

vi.mock('../sync', () => ({
  useSyncItem: () => ({ syncItem: vi.fn() }),
  useSync: () => ({ lastSyncTime: mockState.lastSyncTime }),
}));

vi.mock('../auth', () => ({
  useAuth: () => ({ user: mockState.user, isConfigured: mockState.isConfigured }),
}));

function Probe() {
  const { isLoading, hasAcknowledgedHealthDisclaimer, preferences } = useSyncedPreferences();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="acknowledged">{String(hasAcknowledgedHealthDisclaimer)}</span>
      <span data-testid="volume">{preferences.timerVolume}</span>
    </div>
  );
}

function renderProvider() {
  return render(
    <SyncedPreferencesProvider>
      <Probe />
    </SyncedPreferencesProvider>
  );
}

const acknowledgedPrefs: UserPreferences = {
  ...defaultPrefs,
  id: 'prefs-1',
  timerVolume: 70,
  healthDisclaimerAcknowledgedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  // localStorage is a vi.fn() stub (src/test/setup.ts) — drive getItem directly
  vi.mocked(localStorage.getItem).mockReturnValue(null);
  mockState.liveQueryResult = undefined;
  mockState.user = null;
  mockState.isConfigured = false;
  mockState.lastSyncTime = null;
});

describe('SyncedPreferencesProvider health-disclaimer gating', () => {
  it('reports loading (not unacknowledged) while the first preferences read is in flight', () => {
    mockState.liveQueryResult = undefined;
    renderProvider();
    expect(screen.getByTestId('loading').textContent).toBe('true');
  });

  it('hard-stops an unacknowledged user once preferences resolve', () => {
    mockState.liveQueryResult = { ...defaultPrefs, id: 'prefs-1' };
    renderProvider();
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('acknowledged').textContent).toBe('false');
  });

  it('recognizes acknowledgment from synced preferences without the localStorage flag', () => {
    mockState.liveQueryResult = acknowledgedPrefs;
    renderProvider();
    expect(screen.getByTestId('acknowledged').textContent).toBe('true');
  });

  it('recognizes acknowledgment from the device localStorage flag alone', () => {
    vi.mocked(localStorage.getItem).mockImplementation(key =>
      key === 'ascend-health-disclaimer-acknowledged' ? 'true' : null
    );
    mockState.liveQueryResult = { ...defaultPrefs, id: 'prefs-1' };
    renderProvider();
    expect(screen.getByTestId('acknowledged').textContent).toBe('true');
  });

  it('REGRESSION: keeps last resolved preferences while the live query re-runs (no disclaimer flash)', () => {
    mockState.liveQueryResult = acknowledgedPrefs;
    const { rerender } = renderProvider();
    expect(screen.getByTestId('acknowledged').textContent).toBe('true');

    // Simulate the lastSyncTime dep change: useLiveQuery returns undefined mid-re-query
    mockState.liveQueryResult = undefined;
    rerender(
      <SyncedPreferencesProvider>
        <Probe />
      </SyncedPreferencesProvider>
    );

    // Must NOT fall back to defaults: still acknowledged, still not loading,
    // and the last known preference values remain in place
    expect(screen.getByTestId('acknowledged').textContent).toBe('true');
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('volume').textContent).toBe('70');
  });

  it('holds the gate closed for an online authenticated user until the initial sync completes', () => {
    mockState.user = { id: 'user-1' };
    mockState.isConfigured = true;
    mockState.lastSyncTime = null;
    mockState.liveQueryResult = { ...defaultPrefs, id: 'prefs-1' };
    renderProvider();
    // Derived synchronously — true on the very first render, no stale frame
    expect(screen.getByTestId('loading').textContent).toBe('true');
  });

  it('releases the gate once the initial sync completes', () => {
    mockState.user = { id: 'user-1' };
    mockState.isConfigured = true;
    mockState.lastSyncTime = new Date();
    mockState.liveQueryResult = acknowledgedPrefs;
    renderProvider();
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('acknowledged').textContent).toBe('true');
  });
});
