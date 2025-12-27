import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Card, Badge } from '../ui';
import { EXERCISE_TYPE_LABELS, type Exercise, type MaxRecord } from '../../types';

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

  return (
    <Card 
      variant="interactive" 
      className="p-4"
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {exercise.name}
            </h3>
            {exercise.mode === 'conditioning' && (
              <Badge variant="outline" className="text-[10px]">COND</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={exercise.type}>
              {EXERCISE_TYPE_LABELS[exercise.type]}
            </Badge>
            {latestMax && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Max: {latestMax.maxReps}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>
    </Card>
  );
}
