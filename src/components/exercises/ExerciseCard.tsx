import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { EXERCISE_TYPE_LABELS, formatTime, type Exercise, type MaxRecord } from '@/types';

interface ExerciseCardProps {
  exercise: Exercise;
  latestMax?: MaxRecord;
  onClick?: () => void;
}

export function ExerciseCard({ exercise, latestMax, onClick }: ExerciseCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/exercises/${exercise.id}`);
    }
  };

  // Format weight string
  const formatWeight = (weight?: number) => {
    if (weight === undefined || weight <= 0) return null;
    return `@ ${weight} lbs`;
  };

  // Determine the value to display
  const getDisplayValue = () => {
    if (exercise.mode === 'conditioning') {
      // Conditioning: show base reps/time
      if (exercise.measurementType === 'time') {
        const baseTime = exercise.defaultConditioningTime;
        if (!baseTime) return null;
        const weightStr = exercise.weightEnabled ? formatWeight(exercise.defaultWeight) : null;
        return weightStr ? `Base: ${formatTime(baseTime)} ${weightStr}` : `Base: ${formatTime(baseTime)}`;
      } else {
        const baseReps = exercise.defaultConditioningReps;
        if (!baseReps) return null;
        const weightStr = exercise.weightEnabled ? formatWeight(exercise.defaultWeight) : null;
        return weightStr ? `Base: ${baseReps} ${weightStr}` : `Base: ${baseReps}`;
      }
    } else {
      // Standard: show max reps/time
      if (!latestMax) return null;
      if (exercise.measurementType === 'time') {
        if (!latestMax.maxTime) return null;
        const weightStr = exercise.weightEnabled ? formatWeight(latestMax.weight) : null;
        return weightStr ? `Max: ${formatTime(latestMax.maxTime)} ${weightStr}` : `Max: ${formatTime(latestMax.maxTime)}`;
      } else {
        if (!latestMax.maxReps) return null;
        const weightStr = exercise.weightEnabled ? formatWeight(latestMax.weight) : null;
        return weightStr ? `Max: ${latestMax.maxReps} ${weightStr}` : `Max: ${latestMax.maxReps}`;
      }
    }
  };

  const displayValue = getDisplayValue();

  return (
    <Card 
      variant="interactive" 
      className="p-4"
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {exercise.name}
            </h3>
            {exercise.mode === 'conditioning' && (
              <Badge variant="outline" className="text-2xs">COND</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={exercise.type}>
              {EXERCISE_TYPE_LABELS[exercise.type]}
            </Badge>
            {displayValue && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {displayValue}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>
    </Card>
  );
}
