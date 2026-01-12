/**
 * CycleWizard Types
 * 
 * Shared type definitions for the cycle wizard components.
 */

import type { 
  Cycle, 
  Group, 
  Exercise, 
  ExerciseAssignment, 
  ExerciseType, 
  ProgressionMode 
} from '@/types';

// Wizard step definitions
export type WizardStep = 'start' | 'basics' | 'groups' | 'progression' | 'goals' | 'review';

export interface StepDefinition {
  key: WizardStep;
  label: string;
}

// Step configuration by progression mode
export const RFEM_STEPS: StepDefinition[] = [
  { key: 'start', label: 'Start' },
  { key: 'basics', label: 'Basics' },
  { key: 'groups', label: 'Groups' },
  { key: 'goals', label: 'Goals' },
  { key: 'review', label: 'Review' }
];

export const SIMPLE_STEPS: StepDefinition[] = [
  { key: 'start', label: 'Start' },
  { key: 'basics', label: 'Basics' },
  { key: 'groups', label: 'Groups' },
  { key: 'progression', label: 'Targets' },
  { key: 'goals', label: 'Goals' },
  { key: 'review', label: 'Review' }
];

export const MIXED_STEPS: StepDefinition[] = [
  { key: 'start', label: 'Start' },
  { key: 'basics', label: 'Basics' },
  { key: 'groups', label: 'Exercises' },
  { key: 'goals', label: 'Goals' },
  { key: 'review', label: 'Review' }
];

/**
 * Get steps array for the given progression mode
 */
export function getStepsForMode(mode: ProgressionMode): StepDefinition[] {
  switch (mode) {
    case 'simple': return SIMPLE_STEPS;
    case 'mixed': return MIXED_STEPS;
    default: return RFEM_STEPS;
  }
}

// Validation result type
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Edit mode for modifying existing cycles
export type EditMode = 'continue' | 'restart' | null;

// Wizard form state
export interface WizardFormState {
  name: string;
  startDate: string;
  numberOfWeeks: number;
  workoutDaysPerWeek: number;
  groups: Group[];
  weeklySetGoals: Record<ExerciseType, number>;
  groupRotation: string[];
  rfemRotation: number[];
  conditioningWeeklyRepIncrement: number;
  includeWarmupSets: boolean;
  includeTimedWarmups: boolean;
}

// Props for step components
export interface StartStepProps {
  cloneableCycles: Cycle[];
  onStartFresh: () => void;
  onCloneFromCycle: (cycle: Cycle) => void;
  onCancel: () => void;
}

export interface BasicsStepProps {
  name: string;
  setName: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  numberOfWeeks: number;
  setNumberOfWeeks: (v: number) => void;
  workoutDaysPerWeek: number;
  setWorkoutDaysPerWeek: (v: number) => void;
}

export interface GroupsStepProps {
  groups: Group[];
  exercises: Exercise[];
  exerciseMap: Map<string, Exercise>;
  defaults: { defaultConditioningReps: number };
  progressionMode: ProgressionMode;
  onAddGroup: () => void;
  onRemoveGroup: (id: string) => void;
  onUpdateGroupName: (id: string, name: string) => void;
  onAddExercise: (groupId: string, exerciseId: string) => void;
  onRemoveExercise: (groupId: string, exerciseId: string) => void;
  onUpdateAssignment: (groupId: string, exerciseId: string, updates: Partial<ExerciseAssignment>) => void;
}

export interface ProgressionStepProps {
  groups: Group[];
  exerciseMap: Map<string, Exercise>;
  onUpdateProgression: (groupId: string, exerciseId: string, updates: Partial<ExerciseAssignment>) => void;
}

export interface GoalsStepProps {
  progressionMode: ProgressionMode;
  weeklySetGoals: Record<ExerciseType, number>;
  setWeeklySetGoals: (v: Record<ExerciseType, number>) => void;
  groups: Group[];
  groupRotation: string[];
  setGroupRotation: (v: string[]) => void;
  rfemRotation: number[];
  setRfemRotation: (v: number[]) => void;
  conditioningWeeklyRepIncrement: number;
  setConditioningWeeklyRepIncrement: (v: number) => void;
  workoutDaysPerWeek: number;
  includeWarmupSets: boolean;
  setIncludeWarmupSets: (v: boolean) => void;
  includeTimedWarmups: boolean;
  setIncludeTimedWarmups: (v: boolean) => void;
}

export interface ReviewStepProps {
  progressionMode: ProgressionMode;
  name: string;
  startDate: string;
  numberOfWeeks: number;
  workoutDaysPerWeek: number;
  groups: Group[];
  exerciseMap: Map<string, Exercise>;
  weeklySetGoals: Record<ExerciseType, number>;
  groupRotation: string[];
  rfemRotation: number[];
  includeWarmupSets: boolean;
  includeTimedWarmups: boolean;
  validation: ValidationResult;
}

// Helper component props
export interface MixedExerciseConfigProps {
  exercise: Exercise;
  assignment: ExerciseAssignment;
  defaults: { defaultConditioningReps: number };
  onUpdate: (updates: Partial<ExerciseAssignment>) => void;
  onRemove: () => void;
}

export interface SimpleProgressionFieldsProps {
  exercise: Exercise;
  assignment: ExerciseAssignment;
  isTimeBased: boolean;
  isWeighted: boolean;
  onUpdate: (updates: Partial<ExerciseAssignment>) => void;
}

export interface ExerciseProgressionEditorProps {
  exercise: Exercise;
  assignment: ExerciseAssignment;
  isTimeBased: boolean;
  lastCompletedSet: import('@/types').CompletedSet | null;
  onUpdate: (updates: Partial<ExerciseAssignment>) => void;
}

export interface WizardProgressProps {
  steps: StepDefinition[];
  currentStep: WizardStep;
}

export interface WizardNavigationProps {
  currentStep: WizardStep;
  canProceed: boolean;
  isCreating: boolean;
  isEditing: boolean;
  onBack: () => void;
  onNext: () => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export interface EditModeModalProps {
  isOpen: boolean;
  completedCount: number;
  onContinue: () => void;
  onRestart: () => void;
  onClose: () => void;
}
