import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui';
import { QuickLogForm } from '@/components/workouts/QuickLogForm';
import { ExerciseTimer } from '@/components/workouts/ExerciseTimer';
import { ExerciseStopwatch } from '@/components/workouts/ExerciseStopwatch';
import type { Exercise, ScheduledSet } from '@/types';

interface ScheduledSetData {
  set: ScheduledSet;
  targetReps: number;
  targetWeight?: number; // Target weight for simple progression mode
}

interface ScheduledSetModalProps {
  /** The scheduled set being logged, or null if modal is closed */
  scheduledSet: ScheduledSetData | null;
  /** The exercise associated with the set */
  exercise: Exercise | null;
  /** Whether a log operation is in progress */
  isLogging: boolean;
  /** Timer volume 0-100 */
  timerVolume?: number;
  /** Called when user completes logging the set */
  onLogSet: (
    reps: number,
    notes: string,
    parameters: Record<string, string | number>,
    weight?: number
  ) => Promise<void>;
  /** Called when modal is closed */
  onClose: () => void;
}

/**
 * Modal for logging a scheduled set. Automatically shows the appropriate UI:
 * - Stopwatch for time-based max tests
 * - Timer for time-based regular sets
 * - Quick log form for rep-based sets or manual entry
 */
export function ScheduledSetModal({
  scheduledSet,
  exercise,
  isLogging,
  timerVolume = 40,
  onLogSet,
  onClose,
}: ScheduledSetModalProps) {
  const [showTimerMode, setShowTimerMode] = useState(false);
  const [showStopwatchMode, setShowStopwatchMode] = useState(false);

  // Auto-select timer/stopwatch mode based on exercise type
  useEffect(() => {
    if (scheduledSet && exercise) {
      if (exercise.measurementType === 'time') {
        if (scheduledSet.set.isMaxTest) {
          setShowStopwatchMode(true);
          setShowTimerMode(false);
        } else {
          setShowTimerMode(true);
          setShowStopwatchMode(false);
        }
      } else {
        setShowTimerMode(false);
        setShowStopwatchMode(false);
      }
    }
  }, [scheduledSet, exercise]);

  const handleClose = () => {
    setShowTimerMode(false);
    setShowStopwatchMode(false);
    onClose();
  };

  const isOpen = !!scheduledSet && !!exercise;
  const isMaxTest = scheduledSet?.set.isMaxTest ?? false;
  const isTimeBased = exercise?.measurementType === 'time';

  // Determine modal title
  let title = 'Complete Set';
  if (isMaxTest) {
    title = showStopwatchMode ? 'Max Test' : 'Record Max';
  } else if (showTimerMode) {
    title = 'Timed Hold';
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      {scheduledSet &&
        exercise &&
        (() => {
          // Show stopwatch for time-based max tests
          if (showStopwatchMode && isTimeBased && isMaxTest) {
            return (
              <ExerciseStopwatch
                exerciseName={exercise.name}
                previousMax={scheduledSet.set.previousMaxReps}
                onRecordMax={seconds => {
                  onLogSet(seconds, '', {}, undefined);
                }}
                onCancel={handleClose}
                onSkipToLog={() => setShowStopwatchMode(false)}
              />
            );
          }

          // Show timer for time-based exercises (non-max test)
          if (showTimerMode && isTimeBased) {
            return (
              <ExerciseTimer
                targetSeconds={scheduledSet.targetReps}
                exerciseName={exercise.name}
                onComplete={actualSeconds => {
                  onLogSet(actualSeconds, '', {}, undefined);
                }}
                onCancel={handleClose}
                onSkipToLog={() => setShowTimerMode(false)}
                volume={timerVolume}
              />
            );
          }

          // Show form for manual entry
          return (
            <QuickLogForm
              exercise={exercise}
              suggestedReps={scheduledSet.targetReps}
              suggestedWeight={scheduledSet.targetWeight}
              isMaxTest={isMaxTest}
              onSubmit={onLogSet}
              onCancel={handleClose}
              isLoading={isLogging}
            />
          );
        })()}
    </Modal>
  );
}
