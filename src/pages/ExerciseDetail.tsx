import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Edit, Trash2, TrendingUp, AlertTriangle } from 'lucide-react';
import { ExerciseRepo, MaxRecordRepo, CompletedSetRepo, CycleRepo } from '@/data/repositories';
import { useAppStore } from '@/stores/appStore';
import { PageHeader } from '@/components/layout';
import { Button, Card, CardContent, Badge, Modal, EmptyState } from '@/components/ui';
import {
  ExerciseForm,
  ExerciseHistorySection,
  MaxRecordForm,
  PriorMaxesSection,
} from '@/components/exercises';
import { formatWeightIncrement } from '@/constants';
import { EXERCISE_TYPE_LABELS, formatTime, type ExerciseFormData } from '@/types';

export function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { repDisplayMode } = useAppStore();

  const [showEditForm, setShowEditForm] = useState(false);
  const [showMaxForm, setShowMaxForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRecordingMax, setIsRecordingMax] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Live queries
  const exercise = useLiveQuery(() => (id ? ExerciseRepo.getById(id) : undefined), [id]);

  const maxRecords = useLiveQuery(() => (id ? MaxRecordRepo.getAllForExercise(id) : []), [id]);

  const activeCycle = useLiveQuery(() => CycleRepo.getActive(), []);

  // Get stats based on display mode
  const stats = useLiveQuery(async () => {
    if (!id) return { totalSets: 0, totalReps: 0 };

    if (repDisplayMode === 'week') {
      // This week
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      return CompletedSetRepo.getStatsForDateRange(id, startOfWeek, endOfWeek);
    } else if (repDisplayMode === 'cycle' && activeCycle) {
      // This cycle
      return CompletedSetRepo.getStatsForCycle(id, new Date(activeCycle.startDate));
    } else {
      // All time
      const allStats = await CompletedSetRepo.getStats(id);
      return { totalSets: allStats.totalSets, totalReps: allStats.totalReps };
    }
  }, [id, repDisplayMode, activeCycle?.id]);

  const latestMax = maxRecords?.[0];

  if (!exercise) {
    return (
      <>
        <PageHeader title="Exercise" backTo="/exercises" />
        <div className="px-4 py-8">
          <EmptyState
            icon={AlertTriangle}
            title="Exercise not found"
            description="This exercise may have been deleted."
            action={<Button onClick={() => navigate('/exercises')}>Back to Exercises</Button>}
          />
        </div>
      </>
    );
  }

  const handleUpdate = async (data: ExerciseFormData) => {
    if (!id) return;
    setIsUpdating(true);
    try {
      await ExerciseRepo.update(id, data);
      setShowEditForm(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRecordMax = async (maxValue: number, notes: string, weight?: number) => {
    if (!id || !exercise) return;
    setIsRecordingMax(true);
    try {
      const isTimeBased = exercise.measurementType === 'time';
      await MaxRecordRepo.create(
        id,
        isTimeBased ? undefined : maxValue, // maxReps
        isTimeBased ? maxValue : undefined, // maxTime
        notes,
        weight
      );
      setShowMaxForm(false);
    } finally {
      setIsRecordingMax(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await ExerciseRepo.delete(id);
      await MaxRecordRepo.deleteAllForExercise(id);
      navigate('/exercises');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title={exercise.name}
        backTo="/exercises"
        action={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowEditForm(true)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Exercise Info Card */}
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={exercise.type}>{EXERCISE_TYPE_LABELS[exercise.type]}</Badge>
              {exercise.mode === 'conditioning' && <Badge variant="outline">Conditioning</Badge>}
              {exercise.weightEnabled && (
                <Badge
                  variant="outline"
                  className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                >
                  +Weight
                </Badge>
              )}
            </div>

            {exercise.notes && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{exercise.notes}</p>
            )}

            {exercise.customParameters.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Custom Parameters</p>
                <div className="flex flex-wrap gap-1">
                  {exercise.customParameters.map(param => (
                    <span
                      key={param.name}
                      className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded"
                    >
                      {param.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardContent>
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
              {repDisplayMode === 'week'
                ? 'This Week'
                : repDisplayMode === 'cycle'
                  ? 'This Cycle'
                  : 'All Time'}
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                {exercise.mode === 'conditioning' ? (
                  // Conditioning exercise: show Base Reps or Base Time
                  <>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {exercise.measurementType === 'time'
                        ? exercise.defaultConditioningTime
                          ? formatTime(exercise.defaultConditioningTime)
                          : '—'
                        : exercise.defaultConditioningReps || '—'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {exercise.measurementType === 'time' ? 'Base Time' : 'Base Reps'}
                    </p>
                  </>
                ) : (
                  // Standard exercise: show Current Max
                  <>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {exercise.measurementType === 'time'
                        ? latestMax?.maxTime
                          ? formatTime(latestMax.maxTime)
                          : '—'
                        : latestMax?.maxReps || '—'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Current Max
                      {latestMax?.weight !== undefined && latestMax.weight > 0 && (
                        <span className="block text-purple-600 dark:text-purple-400">
                          {formatWeightIncrement(latestMax.weight)}
                        </span>
                      )}
                    </p>
                  </>
                )}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats?.totalSets || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sets</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {exercise.measurementType === 'time'
                    ? stats?.totalReps
                      ? formatTime(stats.totalReps)
                      : '0:00'
                    : stats?.totalReps || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {exercise.measurementType === 'time' ? 'Total Time' : 'Total Reps'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Record Max Button */}
        {exercise.mode === 'standard' && (
          <Button onClick={() => setShowMaxForm(true)} className="w-full">
            <TrendingUp className="w-4 h-4 mr-2" />
            Record New Max
          </Button>
        )}

        {/* Prior Maxes - only for standard exercises */}
        {exercise.mode === 'standard' && maxRecords && maxRecords.length > 0 && (
          <PriorMaxesSection maxRecords={maxRecords} exercise={exercise} />
        )}

        {/* Exercise History - for all exercises */}
        <ExerciseHistorySection
          exerciseId={exercise.id}
          measurementType={exercise.measurementType}
          weightEnabled={exercise.weightEnabled}
        />
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        title="Edit Exercise"
        size="lg"
      >
        <ExerciseForm
          initialData={exercise}
          onSubmit={handleUpdate}
          onCancel={() => setShowEditForm(false)}
          isLoading={isUpdating}
        />
      </Modal>

      {/* Record Max Modal */}
      <Modal isOpen={showMaxForm} onClose={() => setShowMaxForm(false)} title="Record New Max">
        <MaxRecordForm
          currentMax={latestMax?.maxReps}
          currentMaxWeight={latestMax?.weight}
          weightEnabled={exercise.weightEnabled}
          defaultWeight={exercise.defaultWeight}
          onSubmit={handleRecordMax}
          onCancel={() => setShowMaxForm(false)}
          isLoading={isRecordingMax}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Exercise"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <strong>{exercise.name}</strong>? This will also delete
            all max records for this exercise.
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Note: Historical completed sets will be preserved but may affect reporting.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
