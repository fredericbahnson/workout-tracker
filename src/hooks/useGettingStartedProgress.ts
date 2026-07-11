import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/data/db';
import { useAppStore } from '@/stores/appStore';
import { deriveGettingStarted, type GettingStartedState } from '@/utils/gettingStarted';

interface UseGettingStartedProgressResult extends GettingStartedState {
  /** Permanently hide the checklist for this device */
  dismiss: () => void;
}

/**
 * Live getting-started checklist state for the Today page.
 *
 * Progress derives from database counts (see utils/gettingStarted.ts for
 * why milestones flags aren't used); dismissal persists in the app store.
 * While counts are still loading, shouldShow is false so the card never
 * flashes in for established users.
 */
export function useGettingStartedProgress(): UseGettingStartedProgressResult {
  const exerciseCount = useLiveQuery(() => db.exercises.count(), []);
  const maxRecordCount = useLiveQuery(() => db.maxRecords.count(), []);
  const cycleCount = useLiveQuery(() => db.cycles.count(), []);
  const completedSetCount = useLiveQuery(() => db.completedSets.count(), []);

  const dismissed = useAppStore(state => state.gettingStartedDismissed);
  const setGettingStartedDismissed = useAppStore(state => state.setGettingStartedDismissed);

  const isLoading =
    exerciseCount === undefined ||
    maxRecordCount === undefined ||
    cycleCount === undefined ||
    completedSetCount === undefined;

  const state = deriveGettingStarted({
    exerciseCount: exerciseCount ?? 0,
    maxRecordCount: maxRecordCount ?? 0,
    cycleCount: cycleCount ?? 0,
    completedSetCount: completedSetCount ?? 0,
    dismissed,
  });

  return {
    ...state,
    shouldShow: state.shouldShow && !isLoading,
    dismiss: () => setGettingStartedDismissed(true),
  };
}
