/**
 * ExerciseHistorySection Component
 *
 * Displays working set history for an exercise, grouped by workout session.
 * Excludes warmup sets to show only meaningful training data.
 */

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { History, ChevronDown, ChevronUp } from 'lucide-react';
import { CompletedSetRepo } from '@/data/repositories';
import { Card, EmptyState } from '@/components/ui';
import { formatTime } from '@/types';
import { formatWeightAt } from '@/constants';
import type { MeasurementType } from '@/types';

interface ExerciseHistorySectionProps {
  exerciseId: string;
  measurementType: MeasurementType;
  weightEnabled?: boolean;
}

/** Number of sessions to show initially */
const INITIAL_DISPLAY_COUNT = 5;
/** Number of sessions to load on "Show More" */
const LOAD_MORE_COUNT = 10;

export function ExerciseHistorySection({
  exerciseId,
  measurementType,
  weightEnabled,
}: ExerciseHistorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);

  // Fetch working set history (excludes warmups)
  const history = useLiveQuery(
    () => CompletedSetRepo.getWorkingSetHistory(exerciseId),
    [exerciseId]
  );

  // Calculate visible sessions
  const visibleSessions = useMemo(() => {
    if (!history) return [];
    return history.slice(0, displayCount);
  }, [history, displayCount]);

  const totalSessions = history?.length ?? 0;
  const hasMore = displayCount < totalSessions;
  const remainingCount = totalSessions - displayCount;

  const handleShowMore = () => {
    setDisplayCount(prev => Math.min(prev + LOAD_MORE_COUNT, totalSessions));
  };

  const handleToggleExpand = () => {
    setIsExpanded(prev => !prev);
    // Reset to initial count when collapsing
    if (isExpanded) {
      setDisplayCount(INITIAL_DISPLAY_COUNT);
    }
  };

  const formatValue = (value: number): string => {
    if (measurementType === 'time') {
      return formatTime(value);
    }
    return `${value} reps`;
  };

  const formatSetDisplay = (set: { actualReps: number; weight?: number }): string => {
    const valueStr = formatValue(set.actualReps);
    if (weightEnabled && set.weight && set.weight > 0) {
      return `${valueStr} ${formatWeightAt(set.weight)}`;
    }
    return valueStr;
  };

  const formatDateHeader = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Loading state
  if (history === undefined) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
      </div>
    );
  }

  // Empty state
  if (history.length === 0) {
    return (
      <div>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
          <History className="w-4 h-4" />
          Exercise History
        </h2>
        <EmptyState
          icon={History}
          title="No workout history"
          description="Complete a workout to start tracking your progress."
        />
      </div>
    );
  }

  return (
    <div>
      {/* Header with expand/collapse toggle */}
      <button
        onClick={handleToggleExpand}
        className="w-full flex items-center justify-between text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <span className="flex items-center gap-2">
          <History className="w-4 h-4" />
          Exercise History
          <span className="text-xs text-gray-400 dark:text-gray-500">
            ({totalSessions} {totalSessions === 1 ? 'session' : 'sessions'})
          </span>
        </span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="space-y-3">
          {visibleSessions.map((session, sessionIndex) => (
            <Card key={session.date.toISOString()} className="p-3">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                {formatDateHeader(session.date)}
              </div>
              <div className="space-y-1">
                {session.sets.map((set, setIndex) => (
                  <div
                    key={`${sessionIndex}-${setIndex}`}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="text-gray-400 dark:text-gray-500 w-4 text-right">•</span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {formatSetDisplay(set)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}

          {/* Show More button */}
          {hasMore && (
            <button
              onClick={handleShowMore}
              className="w-full py-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              Show More ({remainingCount} older {remainingCount === 1 ? 'session' : 'sessions'})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
