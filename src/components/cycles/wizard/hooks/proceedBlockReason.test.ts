/**
 * getProceedBlockReason Tests
 *
 * The pure function behind the wizard's disabled-Next explanations.
 */

import { describe, it, expect } from 'vitest';
import { getProceedBlockReason } from './useCycleWizardState';
import type { Exercise, Group } from '@/types';

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex-1',
    name: 'Push-ups',
    type: 'push',
    mode: 'standard',
    measurementType: 'reps',
    notes: '',
    customParameters: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const baseParams = {
  name: 'Cycle 1',
  schedulingMode: 'date' as const,
  selectedDays: [1, 3, 5] as (0 | 1 | 2 | 3 | 4 | 5 | 6)[],
  numberOfWeeks: 4,
  workoutDaysPerWeek: 3,
  groups: [
    {
      id: 'g1',
      name: 'Group A',
      exerciseAssignments: [{ exerciseId: 'ex-1' }],
    },
  ] as Group[],
  exerciseMap: new Map([['ex-1', makeExercise()]]),
  progressionMode: 'rfem' as const,
  groupRotation: ['g1'],
  rfemRotation: [4, 3, 2],
  validation: { valid: true, errors: [], warnings: [] },
};

describe('getProceedBlockReason', () => {
  it('returns null when every step is satisfied', () => {
    expect(getProceedBlockReason({ ...baseParams, currentStep: 'schedule' })).toBeNull();
    expect(getProceedBlockReason({ ...baseParams, currentStep: 'groups' })).toBeNull();
    expect(getProceedBlockReason({ ...baseParams, currentStep: 'goals' })).toBeNull();
    expect(getProceedBlockReason({ ...baseParams, currentStep: 'review' })).toBeNull();
  });

  it('explains a missing cycle name', () => {
    expect(getProceedBlockReason({ ...baseParams, currentStep: 'schedule', name: '  ' })).toBe(
      'Enter a cycle name to continue'
    );
  });

  it('explains missing workout days in date mode', () => {
    expect(
      getProceedBlockReason({ ...baseParams, currentStep: 'schedule', selectedDays: [] })
    ).toBe('Select at least one workout day');
  });

  it('explains empty groups', () => {
    expect(
      getProceedBlockReason({
        ...baseParams,
        currentStep: 'groups',
        groups: [{ id: 'g1', name: 'Group A', exerciseAssignments: [] }],
      })
    ).toBe('Add at least one exercise to a group');
  });

  it('explains missing simple-progression base values', () => {
    expect(
      getProceedBlockReason({
        ...baseParams,
        currentStep: 'progression',
        progressionMode: 'simple',
      })
    ).toBe('Set base reps or time for every exercise');

    expect(
      getProceedBlockReason({
        ...baseParams,
        currentStep: 'progression',
        progressionMode: 'simple',
        groups: [
          {
            id: 'g1',
            name: 'Group A',
            exerciseAssignments: [{ exerciseId: 'ex-1', simpleBaseReps: 10 }],
          },
        ],
      })
    ).toBeNull();
  });

  it('explains missing rotations on the goals step', () => {
    expect(getProceedBlockReason({ ...baseParams, currentStep: 'goals', groupRotation: [] })).toBe(
      'Add at least one group to the rotation'
    );
    expect(getProceedBlockReason({ ...baseParams, currentStep: 'goals', rfemRotation: [] })).toBe(
      'Add at least one RFEM value'
    );
    // Simple mode doesn't need an RFEM rotation
    expect(
      getProceedBlockReason({
        ...baseParams,
        currentStep: 'goals',
        progressionMode: 'simple',
        rfemRotation: [],
      })
    ).toBeNull();
  });

  it('surfaces the first validation error on review', () => {
    expect(
      getProceedBlockReason({
        ...baseParams,
        currentStep: 'review',
        validation: { valid: false, errors: ['Cycle name is required'], warnings: [] },
      })
    ).toBe('Cycle name is required');
  });
});
