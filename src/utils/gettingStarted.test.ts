import { describe, it, expect } from 'vitest';
import { deriveGettingStarted } from './gettingStarted';

const empty = {
  exerciseCount: 0,
  maxRecordCount: 0,
  cycleCount: 0,
  completedSetCount: 0,
  dismissed: false,
};

describe('deriveGettingStarted', () => {
  it('shows all four steps undone for a brand-new user', () => {
    const state = deriveGettingStarted(empty);
    expect(state.steps.length).toBe(4);
    expect(state.steps.every(s => !s.done)).toBe(true);
    expect(state.allDone).toBe(false);
    expect(state.shouldShow).toBe(true);
  });

  it('marks steps done from counts', () => {
    const state = deriveGettingStarted({
      ...empty,
      exerciseCount: 2,
      maxRecordCount: 1,
    });
    expect(state.steps.find(s => s.id === 'add-exercises')?.done).toBe(true);
    expect(state.steps.find(s => s.id === 'record-max')?.done).toBe(true);
    expect(state.steps.find(s => s.id === 'create-cycle')?.done).toBe(false);
    expect(state.steps.find(s => s.id === 'first-workout')?.done).toBe(false);
    expect(state.shouldShow).toBe(true);
  });

  it('hides when dismissed', () => {
    const state = deriveGettingStarted({ ...empty, dismissed: true });
    expect(state.shouldShow).toBe(false);
  });

  it('hides when all steps are done', () => {
    const state = deriveGettingStarted({
      exerciseCount: 3,
      maxRecordCount: 2,
      cycleCount: 1,
      completedSetCount: 10,
      dismissed: false,
    });
    expect(state.allDone).toBe(true);
    expect(state.shouldShow).toBe(false);
  });

  it('hides for established users even with unmet steps', () => {
    // Cycle + logged sets but never recorded a max (e.g. simple-progression user)
    const state = deriveGettingStarted({
      exerciseCount: 3,
      maxRecordCount: 0,
      cycleCount: 1,
      completedSetCount: 25,
      dismissed: false,
    });
    expect(state.allDone).toBe(false);
    expect(state.shouldShow).toBe(false);
  });

  it('still shows when a cycle exists but no sets are logged yet', () => {
    const state = deriveGettingStarted({
      exerciseCount: 3,
      maxRecordCount: 1,
      cycleCount: 1,
      completedSetCount: 0,
      dismissed: false,
    });
    expect(state.shouldShow).toBe(true);
    expect(state.steps.find(s => s.id === 'first-workout')?.done).toBe(false);
  });
});
