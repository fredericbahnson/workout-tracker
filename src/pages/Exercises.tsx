import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Search, ListChecks, Filter } from 'lucide-react';
import { ExerciseRepo, MaxRecordRepo } from '@/data/repositories';
import { PageHeader } from '@/components/layout';
import { Button, Input, Modal, EmptyState } from '@/components/ui';
import { ExerciseCard, ExerciseForm } from '@/components/exercises';
import { createScopedLogger } from '@/utils/logger';
import {
  EXERCISE_TYPES,
  EXERCISE_TYPE_LABELS,
  type ExerciseType,
  type ExerciseFormData,
} from '@/types';

const log = createScopedLogger('Exercises');

export function ExercisesPage() {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ExerciseType | 'all'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live queries
  const exercises = useLiveQuery(() => ExerciseRepo.getAll(), []);
  const latestMaxes = useLiveQuery(() => MaxRecordRepo.getLatestForAllExercises(), []);

  const handleCreateExercise = async (data: ExerciseFormData) => {
    setIsCreating(true);
    setError(null);
    try {
      log.debug('Creating exercise:', data.name);
      const { initialMax, initialMaxTime, startingReps, startingTime, ...exerciseData } = data;

      // Add default conditioning values based on measurement type
      const exerciseToCreate = {
        ...exerciseData,
        defaultConditioningReps:
          exerciseData.mode === 'conditioning' && exerciseData.measurementType === 'reps'
            ? startingReps
            : undefined,
        defaultConditioningTime:
          exerciseData.mode === 'conditioning' && exerciseData.measurementType === 'time'
            ? startingTime
            : undefined,
      };

      const created = await ExerciseRepo.create(exerciseToCreate);
      log.debug('Exercise created:', created.id);

      // Create initial max record if provided (standard exercises)
      if (exerciseData.measurementType === 'reps' && initialMax && initialMax > 0) {
        await MaxRecordRepo.create(created.id, initialMax, undefined, 'Initial max');
        log.debug('Initial max reps recorded:', initialMax);
      } else if (exerciseData.measurementType === 'time' && initialMaxTime && initialMaxTime > 0) {
        await MaxRecordRepo.create(created.id, undefined, initialMaxTime, 'Initial max');
        log.debug('Initial max time recorded:', initialMaxTime);
      }

      setShowForm(false);
    } catch (err) {
      log.error(err as Error);
      setError(err instanceof Error ? err.message : 'Failed to create exercise. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Filter exercises
  const filteredExercises = exercises?.filter(ex => {
    const matchesSearch = !searchQuery || ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || ex.type === filterType;
    return matchesSearch && matchesType;
  });

  // Group exercises by type (for "All" view), sorted alphabetically within each type
  const groupedExercises = EXERCISE_TYPES.map(type => ({
    type,
    exercises: (filteredExercises || [])
      .filter(ex => ex.type === type)
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter(group => group.exercises.length > 0);

  // Count by type
  const typeCounts =
    exercises?.reduce(
      (acc, ex) => {
        acc[ex.type] = (acc[ex.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  return (
    <>
      <PageHeader
        title="Exercises"
        subtitle={exercises ? `${exercises.length} exercises` : undefined}
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search exercises..."
            className="pl-10"
          />
        </div>

        {/* Type Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          <button
            onClick={() => setFilterType('all')}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
              ${
                filterType === 'all'
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }
            `}
          >
            All ({exercises?.length || 0})
          </button>
          {EXERCISE_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${
                  filterType === type
                    ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }
              `}
            >
              {EXERCISE_TYPE_LABELS[type]} ({typeCounts[type] || 0})
            </button>
          ))}
        </div>

        {/* Exercise List */}
        {filteredExercises && filteredExercises.length > 0 ? (
          filterType === 'all' ? (
            // Grouped view when showing all
            <div className="space-y-6">
              {groupedExercises.map(group => (
                <div key={group.type}>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {EXERCISE_TYPE_LABELS[group.type]}
                  </h3>
                  <div className="space-y-2">
                    {group.exercises.map(exercise => (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        latestMax={latestMaxes?.get(exercise.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Flat list when filtering by specific type (sorted alphabetically)
            <div className="space-y-2">
              {[...filteredExercises]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(exercise => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    latestMax={latestMaxes?.get(exercise.id)}
                  />
                ))}
            </div>
          )
        ) : exercises && exercises.length > 0 ? (
          <EmptyState
            icon={Filter}
            title="No matching exercises"
            description="Try adjusting your search or filter."
          />
        ) : (
          <EmptyState
            icon={ListChecks}
            title="No exercises yet"
            description="Add your first exercise to get started."
            action={
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Exercise
              </Button>
            }
          />
        )}
      </div>

      {/* Add Exercise Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setError(null);
        }}
        title="Add Exercise"
        size="lg"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}
        <ExerciseForm
          onSubmit={handleCreateExercise}
          onCancel={() => {
            setShowForm(false);
            setError(null);
          }}
          isLoading={isCreating}
        />
      </Modal>
    </>
  );
}
