import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { EXERCISE_TYPE_LABELS, formatTime, type Exercise, type MaxRecord } from '@/types';
import { formatWeight, formatWeightAt } from '@/constants';

interface ExerciseCardProps {
  exercise: Exercise;
  latestMax?: MaxRecord;
  onClick?: () => void;
}

export const ExerciseCard = memo(function ExerciseCard({
  exercise,
  latestMax,
  onClick,
}: ExerciseCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/exercises/${exercise.id}`);
    }
  };

  // Determine the value to display
  const getDisplayValue = () => {
    const isTimeBased = exercise.measurementType === 'time';
    const isWeighted = exercise.weightEnabled === true;
    // Time-based uses MM:SS format (no unit needed), reps-based uses "reps"
    const unit = isTimeBased ? '' : ' reps';

    if (exercise.mode === 'conditioning') {
      // Conditioning: show base reps/time and/or weight
      const baseValue = isTimeBased
        ? exercise.defaultConditioningTime
        : exercise.defaultConditioningReps;
      const weight = isWeighted ? exercise.defaultWeight : undefined;

      const parts: string[] = [];

      if (baseValue) {
        const formattedValue = isTimeBased ? formatTime(baseValue) : baseValue;
        parts.push(`Base: ${formattedValue}${unit}`);
      }

      if (weight && weight > 0) {
        parts.push(formatWeight(weight));
      }

      if (parts.length === 0) return null;

      // Join with " @ " if both base and weight present, otherwise just return what we have
      if (baseValue && weight && weight > 0) {
        const formattedValue = isTimeBased ? formatTime(baseValue) : baseValue;
        return `Base: ${formattedValue}${unit} ${formatWeightAt(weight)}`;
      }
      return parts.join('');
    } else {
      // Standard: show max reps/time and/or weight
      const maxValue = isTimeBased ? latestMax?.maxTime : latestMax?.maxReps;
      const weight = isWeighted ? (latestMax?.weight ?? exercise.defaultWeight) : undefined;

      const parts: string[] = [];

      if (maxValue) {
        const formattedValue = isTimeBased ? formatTime(maxValue) : maxValue;
        parts.push(`Max: ${formattedValue}${unit}`);
      }

      if (weight && weight > 0) {
        if (maxValue) {
          // Weight alongside max
          const formattedValue = isTimeBased ? formatTime(maxValue) : maxValue;
          return `Max: ${formattedValue}${unit} ${formatWeightAt(weight)}`;
        } else {
          // Weight only (no max record yet)
          parts.push(`Weight: ${formatWeight(weight)}`);
        }
      }

      if (parts.length === 0) return null;
      return parts.join('');
    }
  };

  const displayValue = getDisplayValue();

  return (
    <Card variant="interactive" className="p-4" onClick={handleClick}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">{exercise.name}</h3>
            {exercise.mode === 'conditioning' && (
              <Badge variant="outline" className="text-2xs">
                COND
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={exercise.type}>{EXERCISE_TYPE_LABELS[exercise.type]}</Badge>
            {displayValue && (
              <span className="text-sm text-gray-500 dark:text-gray-400">{displayValue}</span>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>
    </Card>
  );
});
