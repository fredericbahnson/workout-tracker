import { useState } from 'react';
import { BarChart3, ChevronUp, ChevronDown } from 'lucide-react';
import { Card } from '../../ui';
import { CompletedSetCard } from '../CompletedSetCard';
import type { Exercise, CompletedSet } from '../../../types';

interface TodayStatsProps {
  /** Total sets completed today */
  totalSets: number;
  /** Total reps completed today */
  totalReps: number;
  /** Number of unique exercises done today */
  exerciseCount: number;
  /** Ad-hoc sets (not from scheduled workouts) to display in expanded view */
  adHocSets: CompletedSet[];
  /** Map of exercise ID to exercise data */
  exerciseMap: Map<string, Exercise>;
}

/**
 * Collapsible stats summary showing today's workout totals.
 * Expands to show detailed stats and ad-hoc sets.
 */
export function TodayStats({
  totalSets,
  totalReps,
  exerciseCount,
  adHocSets,
  exerciseMap,
}: TodayStatsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (totalSets === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          <span>Today's Stats</span>
          <span className="text-gray-400 dark:text-gray-500">
            • {totalSets} sets • {totalReps} reps
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      
      {isExpanded && (
        <Card className="p-4 mt-3">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalSets}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sets Today</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalReps}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Reps to Date</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {exerciseCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Exercises</p>
            </div>
          </div>
          
          {/* Ad-hoc completed sets shown in expanded view */}
          {adHocSets.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Additional Sets
              </h3>
              {adHocSets.map(set => (
                <CompletedSetCard 
                  key={set.id} 
                  completedSet={set} 
                  exercise={exerciseMap.get(set.exerciseId)}
                />
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
