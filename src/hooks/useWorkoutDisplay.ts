import { useState, useCallback } from 'react';
import { isToday } from '../utils';
import type { ScheduledWorkout } from '../types';

// localStorage key for persisting dismissed workout ID across navigation
const DISMISSED_WORKOUT_KEY = 'ascend_dismissed_workout_id';

function getDismissedWorkoutId(): string | null {
  try {
    return localStorage.getItem(DISMISSED_WORKOUT_KEY);
  } catch {
    return null;
  }
}

function setDismissedWorkoutId(workoutId: string | null): void {
  try {
    if (workoutId) {
      localStorage.setItem(DISMISSED_WORKOUT_KEY, workoutId);
    } else {
      localStorage.removeItem(DISMISSED_WORKOUT_KEY);
    }
  } catch {
    // Ignore localStorage errors
  }
}

interface UseWorkoutDisplayParams {
  /** Most recently completed workout */
  lastCompletedWorkout: ScheduledWorkout | null | undefined;
  /** Next pending workout in the cycle */
  nextPendingWorkout: ScheduledWorkout | null | undefined;
  /** Any in-progress ad-hoc workout */
  inProgressAdHocWorkout: ScheduledWorkout | null | undefined;
}

interface UseWorkoutDisplayResult {
  /** The workout to display in the UI */
  displayWorkout: ScheduledWorkout | null | undefined;
  /** Whether we're showing a completed workout */
  isShowingCompletedWorkout: boolean;
  /** Whether the displayed workout is an ad-hoc workout */
  isShowingAdHocWorkout: boolean;
  /** Call when a workout is completed to show the completion view */
  markWorkoutCompleted: (workoutId: string) => void;
  /** Call when user wants to proceed to next workout */
  handleProceedToNextWorkout: () => void;
  /** Dismiss the completion view without persisting (e.g., when starting ad-hoc workout) */
  dismissCompletionView: () => void;
  /** Clear the dismissed workout ID (e.g., when starting new ad-hoc) */
  clearDismissedWorkout: () => void;
  /** Reset all completion state (e.g., when canceling ad-hoc workout) */
  resetCompletionState: () => void;
}

/**
 * Manages which workout to display on the Today page.
 * Handles completion view state and persistence across navigation.
 * 
 * Display priority:
 * 1. In-progress ad-hoc workout
 * 2. Just-completed workout (completion view)
 * 3. Next pending workout
 */
export function useWorkoutDisplay({
  lastCompletedWorkout,
  nextPendingWorkout,
  inProgressAdHocWorkout,
}: UseWorkoutDisplayParams): UseWorkoutDisplayResult {
  // Track just-completed workout in this session
  const [justCompletedWorkoutId, setJustCompletedWorkoutId] = useState<string | null>(null);
  const [showCompletionView, setShowCompletionView] = useState(false);
  const [completionDismissed, setCompletionDismissed] = useState(false);

  // Determine if we should show the completed workout view
  const shouldShowCompletedWorkout = useCallback((): boolean => {
    // If there's an in-progress ad-hoc workout, don't show completed view
    if (inProgressAdHocWorkout) return false;
    
    // If user dismissed the completion view (in this session), don't show it
    if (completionDismissed) return false;
    
    // If user just completed a workout this session
    if (showCompletionView && justCompletedWorkoutId) return true;
    
    // If workout was completed today (on app reopen), check if it was dismissed
    if (lastCompletedWorkout?.completedAt && isToday(new Date(lastCompletedWorkout.completedAt))) {
      // Check if this specific workout was already dismissed (persisted across navigation)
      const dismissedId = getDismissedWorkoutId();
      if (dismissedId === lastCompletedWorkout.id) {
        return false;
      }
      return true;
    }
    
    return false;
  }, [inProgressAdHocWorkout, completionDismissed, showCompletionView, justCompletedWorkoutId, lastCompletedWorkout]);

  // The workout to display in the UI
  // Priority: in-progress ad-hoc > completed view > next pending
  const displayWorkout = inProgressAdHocWorkout 
    ? inProgressAdHocWorkout 
    : shouldShowCompletedWorkout() 
      ? lastCompletedWorkout 
      : nextPendingWorkout;
  
  const isShowingCompletedWorkout = !inProgressAdHocWorkout && shouldShowCompletedWorkout();
  const isShowingAdHocWorkout = displayWorkout?.isAdHoc === true;

  // Mark a workout as just completed (triggers completion view)
  const markWorkoutCompleted = useCallback((workoutId: string) => {
    setJustCompletedWorkoutId(workoutId);
    setShowCompletionView(true);
    setCompletionDismissed(false);
    setDismissedWorkoutId(null); // Clear any previously dismissed workout
  }, []);

  // Proceed to next workout after viewing completion
  const handleProceedToNextWorkout = useCallback(() => {
    // Save the dismissed workout ID to localStorage so it persists across navigation
    const workoutIdToDismiss = justCompletedWorkoutId || lastCompletedWorkout?.id;
    if (workoutIdToDismiss) {
      setDismissedWorkoutId(workoutIdToDismiss);
    }
    setShowCompletionView(false);
    setJustCompletedWorkoutId(null);
    setCompletionDismissed(true);
  }, [justCompletedWorkoutId, lastCompletedWorkout?.id]);

  // Clear the dismissed workout ID
  const clearDismissedWorkout = useCallback(() => {
    setDismissedWorkoutId(null);
  }, []);

  // Dismiss the completion view without persisting to localStorage
  const dismissCompletionView = useCallback(() => {
    setCompletionDismissed(true);
    setShowCompletionView(false);
  }, []);

  // Reset all completion state (e.g., when canceling ad-hoc workout)
  const resetCompletionState = useCallback(() => {
    setCompletionDismissed(false);
    setShowCompletionView(false);
    setJustCompletedWorkoutId(null);
  }, []);

  return {
    displayWorkout,
    isShowingCompletedWorkout,
    isShowingAdHocWorkout,
    markWorkoutCompleted,
    handleProceedToNextWorkout,
    dismissCompletionView,
    clearDismissedWorkout,
    resetCompletionState,
  };
}
