/**
 * Getting-started checklist derivation.
 *
 * Progress is derived from live database counts rather than onboarding
 * milestone flags: flags are never written for users who skip onboarding
 * and don't sync across devices, while the database is always the truth.
 * Only the dismissed flag is persisted UI state (appStore).
 */

export type GettingStartedStepId =
  | 'add-exercises'
  | 'record-max'
  | 'create-cycle'
  | 'first-workout';

export interface GettingStartedStep {
  id: GettingStartedStepId;
  label: string;
  done: boolean;
}

export interface GettingStartedInput {
  exerciseCount: number;
  maxRecordCount: number;
  cycleCount: number;
  completedSetCount: number;
  dismissed: boolean;
}

export interface GettingStartedState {
  steps: GettingStartedStep[];
  allDone: boolean;
  shouldShow: boolean;
}

export function deriveGettingStarted({
  exerciseCount,
  maxRecordCount,
  cycleCount,
  completedSetCount,
  dismissed,
}: GettingStartedInput): GettingStartedState {
  const steps: GettingStartedStep[] = [
    { id: 'add-exercises', label: 'Add your exercises', done: exerciseCount > 0 },
    { id: 'record-max', label: 'Record a max', done: maxRecordCount > 0 },
    { id: 'create-cycle', label: 'Create your first cycle', done: cycleCount > 0 },
    { id: 'first-workout', label: 'Complete your first workout', done: completedSetCount > 0 },
  ];

  const allDone = steps.every(step => step.done);

  // Established users (a cycle exists AND sets have been logged) never see
  // the card, even if an individual step like "record a max" is unmet.
  const isEstablished = cycleCount > 0 && completedSetCount > 0;

  return {
    steps,
    allDone,
    shouldShow: !dismissed && !allDone && !isEstablished,
  };
}
