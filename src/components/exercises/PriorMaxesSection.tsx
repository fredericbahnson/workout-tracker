/**
 * PriorMaxesSection Component
 *
 * Displays max record history for a standard exercise.
 * Formatted consistently with ExerciseHistorySection for visual alignment.
 */

import { TrendingUp } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { formatTime, type MaxRecord, type Exercise } from '@/types';
import { formatWeightAt } from '@/constants';

interface PriorMaxesSectionProps {
  maxRecords: MaxRecord[];
  exercise: Exercise;
}

export function PriorMaxesSection({ maxRecords, exercise }: PriorMaxesSectionProps) {
  if (!maxRecords || maxRecords.length === 0) {
    return null;
  }

  const isTimeBased = exercise.measurementType === 'time';

  const formatValue = (record: MaxRecord): string => {
    if (isTimeBased) {
      return record.maxTime ? formatTime(record.maxTime) : '—';
    }
    return record.maxReps ? `${record.maxReps} reps` : '—';
  };

  const formatDateDisplay = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div>
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        Prior Maxes
      </h2>
      <div className="space-y-2">
        {maxRecords.map((record, index) => (
          <Card key={record.id} className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[90px]">
                  {formatDateDisplay(record.recordedAt)}
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatValue(record)}
                </span>
                {record.weight !== undefined && record.weight > 0 && (
                  <span className="text-sm text-purple-600 dark:text-purple-400">
                    {formatWeightAt(record.weight)}
                  </span>
                )}
                {index === 0 && (
                  <Badge className="text-2xs" variant="outline">
                    Current
                  </Badge>
                )}
              </div>
            </div>
            {record.notes && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{record.notes}</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
