/**
 * useTodayModals Hook
 * 
 * Manages all modal/dialog state for the Today page.
 * Consolidates 10+ useState calls into a single reducer-based hook.
 */

import { useReducer, useCallback } from 'react';
import type { Exercise, ScheduledSet, ScheduledWorkout, CompletedSet, ProgressionMode } from '@/types';

// Types for modal data payloads
export interface ScheduledSetModalData {
  set: ScheduledSet;
  workout: ScheduledWorkout;
  targetReps: number;
  targetWeight?: number;
}

export interface SkipSetModalData {
  set: ScheduledSet;
  workout: ScheduledWorkout;
  targetReps: number;
}

export interface EditCompletedSetModalData {
  completedSet: CompletedSet;
  exercise: Exercise;
}

// All possible modal types
export type TodayModalType =
  | 'exercisePicker'
  | 'cycleWizard'
  | 'cycleTypeSelector'
  | 'skipWorkoutConfirm'
  | 'endWorkoutConfirm'
  | 'restTimer'
  | 'scheduledSet'
  | 'skipSetConfirm'
  | 'editCompletedSet';

// Modal state shape
interface ModalState {
  // Boolean modals (no data)
  exercisePicker: boolean;
  cycleWizard: boolean;
  cycleTypeSelector: boolean;
  skipWorkoutConfirm: boolean;
  endWorkoutConfirm: boolean;
  restTimer: boolean;
  
  // Modals with associated data
  scheduledSet: ScheduledSetModalData | null;
  skipSetConfirm: SkipSetModalData | null;
  editCompletedSet: EditCompletedSetModalData | null;
  
  // Related state
  selectedExercise: Exercise | null;
  wizardProgressionMode: ProgressionMode;
  restTimerDuration: number;
  isLogging: boolean;
}

// Actions
type ModalAction =
  | { type: 'OPEN_MODAL'; modal: TodayModalType }
  | { type: 'CLOSE_MODAL'; modal: TodayModalType }
  | { type: 'CLOSE_ALL' }
  | { type: 'SET_SCHEDULED_SET'; data: ScheduledSetModalData | null }
  | { type: 'SET_SKIP_SET'; data: SkipSetModalData | null }
  | { type: 'SET_EDIT_COMPLETED_SET'; data: EditCompletedSetModalData | null }
  | { type: 'SET_SELECTED_EXERCISE'; exercise: Exercise | null }
  | { type: 'SET_WIZARD_MODE'; mode: ProgressionMode }
  | { type: 'SET_REST_TIMER_DURATION'; duration: number }
  | { type: 'SET_IS_LOGGING'; isLogging: boolean };

const initialState: ModalState = {
  exercisePicker: false,
  cycleWizard: false,
  cycleTypeSelector: false,
  skipWorkoutConfirm: false,
  endWorkoutConfirm: false,
  restTimer: false,
  scheduledSet: null,
  skipSetConfirm: null,
  editCompletedSet: null,
  selectedExercise: null,
  wizardProgressionMode: 'rfem',
  restTimerDuration: 90,
  isLogging: false,
};

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'OPEN_MODAL':
      return { ...state, [action.modal]: true };
      
    case 'CLOSE_MODAL':
      // For modals with data, also clear the data
      if (action.modal === 'scheduledSet') {
        return { ...state, scheduledSet: null };
      }
      if (action.modal === 'skipSetConfirm') {
        return { ...state, skipSetConfirm: null };
      }
      if (action.modal === 'editCompletedSet') {
        return { ...state, editCompletedSet: null };
      }
      return { ...state, [action.modal]: false };
      
    case 'CLOSE_ALL':
      return { ...initialState, wizardProgressionMode: state.wizardProgressionMode };
      
    case 'SET_SCHEDULED_SET':
      return { ...state, scheduledSet: action.data };
      
    case 'SET_SKIP_SET':
      return { ...state, skipSetConfirm: action.data };
      
    case 'SET_EDIT_COMPLETED_SET':
      return { ...state, editCompletedSet: action.data };
      
    case 'SET_SELECTED_EXERCISE':
      return { ...state, selectedExercise: action.exercise };
      
    case 'SET_WIZARD_MODE':
      return { ...state, wizardProgressionMode: action.mode };
      
    case 'SET_REST_TIMER_DURATION':
      return { ...state, restTimerDuration: action.duration };
      
    case 'SET_IS_LOGGING':
      return { ...state, isLogging: action.isLogging };
      
    default:
      return state;
  }
}

interface UseTodayModalsOptions {
  defaultRestTimerDuration?: number;
}

export function useTodayModals(options: UseTodayModalsOptions = {}) {
  const [state, dispatch] = useReducer(modalReducer, {
    ...initialState,
    restTimerDuration: options.defaultRestTimerDuration ?? initialState.restTimerDuration,
  });

  // Boolean modal controls
  const openModal = useCallback((modal: TodayModalType) => {
    dispatch({ type: 'OPEN_MODAL', modal });
  }, []);

  const closeModal = useCallback((modal: TodayModalType) => {
    dispatch({ type: 'CLOSE_MODAL', modal });
  }, []);

  const closeAllModals = useCallback(() => {
    dispatch({ type: 'CLOSE_ALL' });
  }, []);

  // Exercise picker
  const openExercisePicker = useCallback(() => {
    dispatch({ type: 'OPEN_MODAL', modal: 'exercisePicker' });
  }, []);

  const closeExercisePicker = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL', modal: 'exercisePicker' });
  }, []);

  const selectExercise = useCallback((exercise: Exercise) => {
    dispatch({ type: 'SET_SELECTED_EXERCISE', exercise });
    dispatch({ type: 'CLOSE_MODAL', modal: 'exercisePicker' });
  }, []);

  const clearSelectedExercise = useCallback(() => {
    dispatch({ type: 'SET_SELECTED_EXERCISE', exercise: null });
  }, []);

  // Cycle wizard
  const openCycleWizard = useCallback((mode?: ProgressionMode) => {
    if (mode) {
      dispatch({ type: 'SET_WIZARD_MODE', mode });
    }
    dispatch({ type: 'OPEN_MODAL', modal: 'cycleWizard' });
  }, []);

  const closeCycleWizard = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL', modal: 'cycleWizard' });
  }, []);

  const openCycleTypeSelector = useCallback(() => {
    dispatch({ type: 'OPEN_MODAL', modal: 'cycleTypeSelector' });
  }, []);

  const closeCycleTypeSelector = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL', modal: 'cycleTypeSelector' });
  }, []);

  const selectCycleType = useCallback((mode: ProgressionMode) => {
    dispatch({ type: 'SET_WIZARD_MODE', mode });
    dispatch({ type: 'CLOSE_MODAL', modal: 'cycleTypeSelector' });
    dispatch({ type: 'OPEN_MODAL', modal: 'cycleWizard' });
  }, []);

  // Scheduled set modal
  const openScheduledSetModal = useCallback((data: ScheduledSetModalData) => {
    dispatch({ type: 'SET_SCHEDULED_SET', data });
  }, []);

  const closeScheduledSetModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL', modal: 'scheduledSet' });
  }, []);

  // Skip set confirm
  const openSkipSetConfirm = useCallback((data: SkipSetModalData) => {
    dispatch({ type: 'SET_SKIP_SET', data });
  }, []);

  const closeSkipSetConfirm = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL', modal: 'skipSetConfirm' });
  }, []);

  // Edit completed set
  const openEditCompletedSet = useCallback((data: EditCompletedSetModalData) => {
    dispatch({ type: 'SET_EDIT_COMPLETED_SET', data });
  }, []);

  const closeEditCompletedSet = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL', modal: 'editCompletedSet' });
  }, []);

  // Skip/end workout confirms
  const openSkipWorkoutConfirm = useCallback(() => {
    dispatch({ type: 'OPEN_MODAL', modal: 'skipWorkoutConfirm' });
  }, []);

  const closeSkipWorkoutConfirm = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL', modal: 'skipWorkoutConfirm' });
  }, []);

  const openEndWorkoutConfirm = useCallback(() => {
    dispatch({ type: 'OPEN_MODAL', modal: 'endWorkoutConfirm' });
  }, []);

  const closeEndWorkoutConfirm = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL', modal: 'endWorkoutConfirm' });
  }, []);

  // Rest timer
  const openRestTimer = useCallback((duration?: number) => {
    if (duration !== undefined) {
      dispatch({ type: 'SET_REST_TIMER_DURATION', duration });
    }
    dispatch({ type: 'OPEN_MODAL', modal: 'restTimer' });
  }, []);

  const closeRestTimer = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL', modal: 'restTimer' });
  }, []);

  const setRestTimerDuration = useCallback((duration: number) => {
    dispatch({ type: 'SET_REST_TIMER_DURATION', duration });
  }, []);

  // Logging state
  const setIsLogging = useCallback((isLogging: boolean) => {
    dispatch({ type: 'SET_IS_LOGGING', isLogging });
  }, []);

  return {
    // State
    showExercisePicker: state.exercisePicker,
    showCycleWizard: state.cycleWizard,
    showCycleTypeSelector: state.cycleTypeSelector,
    showSkipWorkoutConfirm: state.skipWorkoutConfirm,
    showEndWorkoutConfirm: state.endWorkoutConfirm,
    showRestTimer: state.restTimer,
    selectedScheduledSet: state.scheduledSet,
    setToSkip: state.skipSetConfirm,
    editingCompletedSet: state.editCompletedSet,
    selectedExercise: state.selectedExercise,
    wizardProgressionMode: state.wizardProgressionMode,
    restTimerDuration: state.restTimerDuration,
    isLogging: state.isLogging,

    // Generic controls
    openModal,
    closeModal,
    closeAllModals,

    // Exercise picker
    openExercisePicker,
    closeExercisePicker,
    selectExercise,
    clearSelectedExercise,

    // Cycle wizard
    openCycleWizard,
    closeCycleWizard,
    openCycleTypeSelector,
    closeCycleTypeSelector,
    selectCycleType,
    setWizardProgressionMode: (mode: ProgressionMode) => dispatch({ type: 'SET_WIZARD_MODE', mode }),

    // Scheduled set
    openScheduledSetModal,
    closeScheduledSetModal,

    // Skip set
    openSkipSetConfirm,
    closeSkipSetConfirm,

    // Edit completed set
    openEditCompletedSet,
    closeEditCompletedSet,

    // Skip/end workout
    openSkipWorkoutConfirm,
    closeSkipWorkoutConfirm,
    openEndWorkoutConfirm,
    closeEndWorkoutConfirm,

    // Rest timer
    openRestTimer,
    closeRestTimer,
    setRestTimerDuration,

    // Logging
    setIsLogging,
  };
}
