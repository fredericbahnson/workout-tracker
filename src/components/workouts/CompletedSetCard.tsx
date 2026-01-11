import { Card, Badge } from '@/components/ui';
import { EXERCISE_TYPE_LABELS, type CompletedSet, type Exercise } from '@/types';

interface CompletedSetCardProps {
  completedSet: CompletedSet;
  exercise?: Exercise;
}

export function CompletedSetCard({ completedSet, exercise }: CompletedSetCardProps) {
  const time = new Date(completedSet.completedAt).toLocaleTimeString([], { 
    hour: 'numeric', 
    minute: '2-digit' 
  });

  const hasParameters = Object.keys(completedSet.parameters).length > 0;

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {completedSet.actualReps} reps
            </span>
            {exercise && (
              <Badge variant={exercise.type} className="text-2xs">
                {EXERCISE_TYPE_LABELS[exercise.type]}
              </Badge>
            )}
          </div>
          {exercise && (
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {exercise.name}
            </p>
          )}
          {completedSet.notes && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              {completedSet.notes}
            </p>
          )}
          {hasParameters && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(completedSet.parameters).map(([key, value]) => (
                <span 
                  key={key}
                  className="text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded"
                >
                  {key}: {value}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
          {time}
        </span>
      </div>
    </Card>
  );
}
