import { Dumbbell } from 'lucide-react';
import { Modal, Button, EmptyState } from '@/components/ui';
import { ExerciseCard } from '@/components/exercises';
import { EXERCISE_TYPES, EXERCISE_TYPE_LABELS, type Exercise } from '@/types';

interface ExercisePickerModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** List of all exercises */
  exercises: Exercise[] | undefined;
  /** Called when modal is closed */
  onClose: () => void;
  /** Called when an exercise is selected */
  onSelectExercise: (exercise: Exercise) => void;
  /** Called when user wants to navigate to add exercises */
  onNavigateToAddExercises: () => void;
}

/**
 * Modal for selecting an exercise to log a set.
 * Groups exercises by type and shows empty state when no exercises exist.
 */
export function ExercisePickerModal({
  isOpen,
  exercises,
  onClose,
  onSelectExercise,
  onNavigateToAddExercises,
}: ExercisePickerModalProps) {
  const hasExercises = exercises && exercises.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Exercise" size="lg">
      {hasExercises ? (
        <div className="space-y-4">
          {EXERCISE_TYPES.map(type => {
            const typeExercises = exercises
              .filter(ex => ex.type === type)
              .sort((a, b) => a.name.localeCompare(b.name));

            if (typeExercises.length === 0) return null;

            return (
              <div key={type}>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {EXERCISE_TYPE_LABELS[type]}
                </h4>
                <div className="space-y-2">
                  {typeExercises.map(exercise => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      onClick={() => onSelectExercise(exercise)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Dumbbell}
          title="No exercises yet"
          description="Add some exercises first to start logging sets."
          action={<Button onClick={onNavigateToAddExercises}>Add Exercises</Button>}
        />
      )}
    </Modal>
  );
}
