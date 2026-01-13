/**
 * CalendarDateModal Component
 *
 * Modal showing workouts completed on a specific calendar date.
 */

import { CheckCircle, ChevronRight } from 'lucide-react';
import { Modal, Card, Badge } from '@/components/ui';
import type { ScheduledWorkout, Cycle } from '@/types';

interface CalendarDateModalProps {
  date: Date | null;
  workouts: ScheduledWorkout[];
  allCycles?: Cycle[];
  activeCycle?: Cycle | null;
  onWorkoutClick: (workout: ScheduledWorkout) => void;
  onClose: () => void;
}

export function CalendarDateModal({
  date,
  workouts,
  allCycles,
  activeCycle,
  onWorkoutClick,
  onClose,
}: CalendarDateModalProps) {
  if (!date) return null;

  // Helper to get group name from any cycle
  const getGroupName = (workout: ScheduledWorkout): string | undefined => {
    if (workout.isAdHoc) return undefined;
    // Try active cycle first
    const activeGroup = activeCycle?.groups.find(g => g.id === workout.groupId);
    if (activeGroup) return activeGroup.name;
    // Search all cycles
    for (const cycle of allCycles || []) {
      const group = cycle.groups.find(g => g.id === workout.groupId);
      if (group) return group.name;
    }
    return undefined;
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={date.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })}
    >
      <div className="space-y-2">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {workouts.length} workout{workouts.length !== 1 ? 's' : ''} completed
        </p>
        {workouts.map(workout => {
          const groupName = getGroupName(workout);
          const isAdHoc = workout.isAdHoc;

          return (
            <Card
              key={workout.id}
              className={`p-3 cursor-pointer transition-colors ${
                isAdHoc
                  ? 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100/50 dark:hover:bg-blue-900/20'
                  : 'bg-green-50/50 dark:bg-green-900/10 hover:bg-green-100/50 dark:hover:bg-green-900/20'
              }`}
              onClick={() => onWorkoutClick(workout)}
            >
              <div className="flex items-center gap-3">
                <CheckCircle
                  className={`w-5 h-5 ${isAdHoc ? 'text-blue-500' : 'text-green-500'} flex-shrink-0`}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {isAdHoc
                        ? workout.customName || 'Ad Hoc Workout'
                        : `#${workout.sequenceNumber} ${groupName || 'Workout'}`}
                    </span>
                    {isAdHoc && (
                      <Badge className="text-2xs bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        Ad Hoc
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isAdHoc
                      ? 'Logged sets'
                      : `Week ${workout.weekNumber} • ${workout.scheduledSets.length} sets`}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </Card>
          );
        })}
      </div>
    </Modal>
  );
}
