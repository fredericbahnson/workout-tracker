/**
 * useScheduleModals Hook
 * 
 * Manages all modal/dialog state for the Schedule page.
 * Consolidates multiple useState calls into a single reducer-based hook.
 */

import { useReducer, useCallback } from 'react';
import type { ScheduledWorkout, CompletedSet, ProgressionMode } from '@/types';

// Modal state shape
interface ScheduleModalState {
  // Boolean modals
  cycleWizard: boolean;
  cycleTypeSelector: boolean;
  maxTestingWizard: boolean;
  calendarView: boolean;
  
  // Modals with associated data
  previewWorkout: ScheduledWorkout | null;
  historyWorkout: ScheduledWorkout | null;
  workoutToDelete: ScheduledWorkout | null;
  
  // Related state
  historyCompletedSets: CompletedSet[];
  isEditingCycle: boolean;
  wizardProgressionMode: ProgressionMode;
  isDeleting: boolean;
  
  // Calendar state
  selectedCalendarDate: Date | null;
  selectedDateWorkouts: ScheduledWorkout[];
}

// Actions
type ScheduleModalAction =
  | { type: 'OPEN_CYCLE_WIZARD'; isEditing?: boolean }
  | { type: 'CLOSE_CYCLE_WIZARD' }
  | { type: 'OPEN_CYCLE_TYPE_SELECTOR' }
  | { type: 'CLOSE_CYCLE_TYPE_SELECTOR' }
  | { type: 'OPEN_MAX_TESTING_WIZARD' }
  | { type: 'CLOSE_MAX_TESTING_WIZARD' }
  | { type: 'SET_WIZARD_MODE'; mode: ProgressionMode }
  | { type: 'SET_PREVIEW_WORKOUT'; workout: ScheduledWorkout | null }
  | { type: 'SET_HISTORY_WORKOUT'; workout: ScheduledWorkout | null; completedSets: CompletedSet[] }
  | { type: 'CLOSE_HISTORY' }
  | { type: 'SET_WORKOUT_TO_DELETE'; workout: ScheduledWorkout | null }
  | { type: 'SET_IS_DELETING'; isDeleting: boolean }
  | { type: 'TOGGLE_CALENDAR_VIEW' }
  | { type: 'SET_CALENDAR_VIEW'; show: boolean }
  | { type: 'SET_SELECTED_DATE'; date: Date | null; workouts: ScheduledWorkout[] }
  | { type: 'CLEAR_SELECTED_DATE' };

const initialState: ScheduleModalState = {
  cycleWizard: false,
  cycleTypeSelector: false,
  maxTestingWizard: false,
  calendarView: false,
  previewWorkout: null,
  historyWorkout: null,
  workoutToDelete: null,
  historyCompletedSets: [],
  isEditingCycle: false,
  wizardProgressionMode: 'rfem',
  isDeleting: false,
  selectedCalendarDate: null,
  selectedDateWorkouts: [],
};

function scheduleModalReducer(state: ScheduleModalState, action: ScheduleModalAction): ScheduleModalState {
  switch (action.type) {
    case 'OPEN_CYCLE_WIZARD':
      return { 
        ...state, 
        cycleWizard: true, 
        isEditingCycle: action.isEditing ?? false,
        cycleTypeSelector: false,
      };
      
    case 'CLOSE_CYCLE_WIZARD':
      return { ...state, cycleWizard: false, isEditingCycle: false };
      
    case 'OPEN_CYCLE_TYPE_SELECTOR':
      return { ...state, cycleTypeSelector: true };
      
    case 'CLOSE_CYCLE_TYPE_SELECTOR':
      return { ...state, cycleTypeSelector: false };
      
    case 'OPEN_MAX_TESTING_WIZARD':
      return { ...state, maxTestingWizard: true };
      
    case 'CLOSE_MAX_TESTING_WIZARD':
      return { ...state, maxTestingWizard: false };
      
    case 'SET_WIZARD_MODE':
      return { ...state, wizardProgressionMode: action.mode };
      
    case 'SET_PREVIEW_WORKOUT':
      return { ...state, previewWorkout: action.workout };
      
    case 'SET_HISTORY_WORKOUT':
      return { 
        ...state, 
        historyWorkout: action.workout, 
        historyCompletedSets: action.completedSets,
      };
      
    case 'CLOSE_HISTORY':
      return { 
        ...state, 
        historyWorkout: null, 
        historyCompletedSets: [],
      };
      
    case 'SET_WORKOUT_TO_DELETE':
      return { ...state, workoutToDelete: action.workout };
      
    case 'SET_IS_DELETING':
      return { ...state, isDeleting: action.isDeleting };
      
    case 'TOGGLE_CALENDAR_VIEW':
      return { ...state, calendarView: !state.calendarView };
      
    case 'SET_CALENDAR_VIEW':
      return { ...state, calendarView: action.show };
      
    case 'SET_SELECTED_DATE':
      return { 
        ...state, 
        selectedCalendarDate: action.date, 
        selectedDateWorkouts: action.workouts,
      };
      
    case 'CLEAR_SELECTED_DATE':
      return { 
        ...state, 
        selectedCalendarDate: null, 
        selectedDateWorkouts: [],
      };
      
    default:
      return state;
  }
}

export function useScheduleModals() {
  const [state, dispatch] = useReducer(scheduleModalReducer, initialState);

  // Cycle wizard controls
  const openCycleWizard = useCallback((isEditing = false) => {
    dispatch({ type: 'OPEN_CYCLE_WIZARD', isEditing });
  }, []);

  const closeCycleWizard = useCallback(() => {
    dispatch({ type: 'CLOSE_CYCLE_WIZARD' });
  }, []);

  const openCycleTypeSelector = useCallback(() => {
    dispatch({ type: 'OPEN_CYCLE_TYPE_SELECTOR' });
  }, []);

  const closeCycleTypeSelector = useCallback(() => {
    dispatch({ type: 'CLOSE_CYCLE_TYPE_SELECTOR' });
  }, []);

  const selectCycleType = useCallback((mode: ProgressionMode) => {
    dispatch({ type: 'SET_WIZARD_MODE', mode });
    dispatch({ type: 'CLOSE_CYCLE_TYPE_SELECTOR' });
    dispatch({ type: 'OPEN_CYCLE_WIZARD' });
  }, []);

  // Max testing wizard
  const openMaxTestingWizard = useCallback(() => {
    dispatch({ type: 'OPEN_MAX_TESTING_WIZARD' });
  }, []);

  const closeMaxTestingWizard = useCallback(() => {
    dispatch({ type: 'CLOSE_MAX_TESTING_WIZARD' });
  }, []);

  // Preview workout
  const openPreviewWorkout = useCallback((workout: ScheduledWorkout) => {
    dispatch({ type: 'SET_PREVIEW_WORKOUT', workout });
  }, []);

  const closePreviewWorkout = useCallback(() => {
    dispatch({ type: 'SET_PREVIEW_WORKOUT', workout: null });
  }, []);

  // History workout
  const openHistoryWorkout = useCallback((workout: ScheduledWorkout, completedSets: CompletedSet[]) => {
    dispatch({ type: 'SET_HISTORY_WORKOUT', workout, completedSets });
  }, []);

  const closeHistoryWorkout = useCallback(() => {
    dispatch({ type: 'CLOSE_HISTORY' });
  }, []);

  // Delete workout
  const openDeleteConfirm = useCallback((workout: ScheduledWorkout) => {
    dispatch({ type: 'SET_WORKOUT_TO_DELETE', workout });
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    dispatch({ type: 'SET_WORKOUT_TO_DELETE', workout: null });
  }, []);

  const setIsDeleting = useCallback((isDeleting: boolean) => {
    dispatch({ type: 'SET_IS_DELETING', isDeleting });
  }, []);

  // Calendar view
  const toggleCalendarView = useCallback(() => {
    dispatch({ type: 'TOGGLE_CALENDAR_VIEW' });
  }, []);

  const setCalendarView = useCallback((show: boolean) => {
    dispatch({ type: 'SET_CALENDAR_VIEW', show });
  }, []);

  const selectCalendarDate = useCallback((date: Date, workouts: ScheduledWorkout[]) => {
    dispatch({ type: 'SET_SELECTED_DATE', date, workouts });
  }, []);

  const clearSelectedDate = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTED_DATE' });
  }, []);

  return {
    // State
    showCycleWizard: state.cycleWizard,
    showCycleTypeSelector: state.cycleTypeSelector,
    showMaxTestingWizard: state.maxTestingWizard,
    showCalendarView: state.calendarView,
    previewWorkout: state.previewWorkout,
    historyWorkout: state.historyWorkout,
    historyCompletedSets: state.historyCompletedSets,
    workoutToDelete: state.workoutToDelete,
    isEditingCycle: state.isEditingCycle,
    wizardProgressionMode: state.wizardProgressionMode,
    isDeleting: state.isDeleting,
    selectedCalendarDate: state.selectedCalendarDate,
    selectedDateWorkouts: state.selectedDateWorkouts,

    // Cycle wizard
    openCycleWizard,
    closeCycleWizard,
    openCycleTypeSelector,
    closeCycleTypeSelector,
    selectCycleType,
    setWizardProgressionMode: (mode: ProgressionMode) => dispatch({ type: 'SET_WIZARD_MODE', mode }),

    // Max testing
    openMaxTestingWizard,
    closeMaxTestingWizard,

    // Preview
    openPreviewWorkout,
    closePreviewWorkout,

    // History
    openHistoryWorkout,
    closeHistoryWorkout,

    // Delete
    openDeleteConfirm,
    closeDeleteConfirm,
    setIsDeleting,

    // Calendar
    toggleCalendarView,
    setCalendarView,
    selectCalendarDate,
    clearSelectedDate,
  };
}
