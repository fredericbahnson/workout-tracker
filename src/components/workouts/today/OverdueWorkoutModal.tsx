import { useState } from 'react';
import { Calendar, Play, SkipForward } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import type { ScheduledWorkout } from '@/types';

interface OverdueWorkoutModalProps {
  /** The overdue workout to display, or null if modal is closed */
  workout: ScheduledWorkout | null;
  /** Name of the workout group */
  groupName: string | undefined;
  /** Number of remaining overdue workouts after this one */
  remainingCount: number;
  /** Called when user chooses to do this workout */
  onDoWorkout: () => void;
  /** Called when user chooses to skip this workout */
  onSkip: (reason?: string) => void;
  /** Called to close the modal */
  onClose: () => void;
}

/**
 * Modal for handling an overdue workout.
 * Shows workout details with options to do the workout now or skip it.
 */
export function OverdueWorkoutModal({
  workout,
  groupName,
  remainingCount,
  onDoWorkout,
  onSkip,
  onClose,
}: OverdueWorkoutModalProps) {
  const [showSkipForm, setShowSkipForm] = useState(false);
  const [skipReason, setSkipReason] = useState('');

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSkip = () => {
    onSkip(skipReason.trim() || undefined);
    setShowSkipForm(false);
    setSkipReason('');
  };

  const handleClose = () => {
    setShowSkipForm(false);
    setSkipReason('');
    onClose();
  };

  if (!workout) return null;

  return (
    <Modal isOpen={!!workout} onClose={handleClose} title="Missed Workout">
      <div className="space-y-4">
        {/* Workout info */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-2">
            <Calendar className="w-4 h-4" />
            <span>Scheduled for {formatDate(new Date(workout.scheduledDate!))}</span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
            {groupName || 'Workout'} #{workout.sequenceNumber}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {workout.scheduledSets.length} sets planned
          </p>
        </div>

        {remainingCount > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {remainingCount} more missed workout{remainingCount !== 1 ? 's' : ''} after this
          </p>
        )}

        {/* Skip form or action buttons */}
        {showSkipForm ? (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Reason for skipping (optional)
            </label>
            <textarea
              value={skipReason}
              onChange={e => setSkipReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              placeholder="e.g., Was sick, traveling, etc."
              rows={2}
            />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowSkipForm(false)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSkip} className="flex-1">
                Skip Workout
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Button onClick={onDoWorkout} className="w-full">
              <Play className="w-4 h-4 mr-2" />
              Do This Workout
            </Button>
            <Button variant="secondary" onClick={() => setShowSkipForm(true)} className="w-full">
              <SkipForward className="w-4 h-4 mr-2" />
              Skip This Workout
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
