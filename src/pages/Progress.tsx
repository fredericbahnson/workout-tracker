import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { BarChart3, TrendingUp, Calendar, Dumbbell, ChevronDown } from 'lucide-react';
import { CompletedSetRepo, ExerciseRepo, CycleRepo } from '../data/repositories';
import { useAppStore, type RepDisplayMode } from '../stores/appStore';
import { PageHeader } from '../components/layout';
import { Card, CardContent, Badge, EmptyState, Button } from '../components/ui';
import { EXERCISE_TYPE_LABELS, EXERCISE_TYPES, type ExerciseType, type CompletedSet, type Exercise } from '../types';

const TIME_PERIOD_LABELS: Record<RepDisplayMode, string> = {
  week: 'This Week',
  cycle: 'This Cycle',
  allTime: 'All Time'
};

export function ProgressPage() {
  const { repDisplayMode, setRepDisplayMode } = useAppStore();
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  // Get active cycle for cycle-based filtering
  const activeCycle = useLiveQuery(() => CycleRepo.getActive(), []);

  // Get all completed sets
  const allSets = useLiveQuery(() => CompletedSetRepo.getAll(), []);
  const exercises = useLiveQuery(() => ExerciseRepo.getAll(), []);

  // Create exercise lookup map
  const exerciseMap = new Map(exercises?.map(ex => [ex.id, ex]) || []);

  // Filter sets based on time period
  const getFilteredSets = (): CompletedSet[] => {
    if (!allSets) return [];
    
    const now = new Date();
    
    if (repDisplayMode === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return allSets.filter(s => new Date(s.completedAt) >= startOfWeek);
    } else if (repDisplayMode === 'cycle' && activeCycle) {
      const cycleStart = new Date(activeCycle.startDate);
      return allSets.filter(s => new Date(s.completedAt) >= cycleStart);
    }
    return allSets;
  };

  const filteredSets = getFilteredSets();

  // Calculate stats
  const stats = {
    totalSets: filteredSets.length,
    totalReps: filteredSets.reduce((sum, s) => sum + s.actualReps, 0),
    uniqueExercises: new Set(filteredSets.map(s => s.exerciseId)).size,
    workoutDays: new Set(
      filteredSets.map(s => new Date(s.completedAt).toDateString())
    ).size
  };

  // Group by type
  const setsByType: Partial<Record<ExerciseType, number>> = filteredSets.reduce((acc, set) => {
    const exercise = exerciseMap.get(set.exerciseId);
    if (exercise) {
      acc[exercise.type] = (acc[exercise.type] || 0) + 1;
    }
    return acc;
  }, {} as Partial<Record<ExerciseType, number>>);

  // Reps by exercise
  const repsByExercise = filteredSets.reduce((acc, set) => {
    if (!acc[set.exerciseId]) {
      acc[set.exerciseId] = { sets: 0, reps: 0 };
    }
    acc[set.exerciseId].sets += 1;
    acc[set.exerciseId].reps += set.actualReps;
    return acc;
  }, {} as Record<string, { sets: number; reps: number }>);

  const exerciseStats = Object.entries(repsByExercise)
    .map(([id, data]) => ({
      exercise: exerciseMap.get(id),
      sets: data.sets,
      reps: data.reps
    }))
    .filter((item): item is { exercise: Exercise; sets: number; reps: number } => item.exercise !== undefined)
    .sort((a, b) => b.reps - a.reps);

  // Group by day of week (for last 30 days regardless of filter)
  const recentSets = allSets?.filter(s => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(s.completedAt) >= thirtyDaysAgo;
  }) || [];

  const setsByDayOfWeek = recentSets.reduce((acc, set) => {
    const day = new Date(set.completedAt).toLocaleDateString(undefined, { weekday: 'short' });
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!allSets || allSets.length === 0) {
    return (
      <>
        <PageHeader title="Progress" />
        <div className="px-4 py-8">
          <EmptyState
            icon={BarChart3}
            title="No workout data yet"
            description="Start logging sets to see your progress here."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="Progress" 
        action={
          <div className="relative">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowPeriodPicker(!showPeriodPicker)}
            >
              {TIME_PERIOD_LABELS[repDisplayMode]}
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
            {showPeriodPicker && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowPeriodPicker(false)} 
                />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[140px]">
                  {(['week', 'cycle', 'allTime'] as RepDisplayMode[]).map(mode => (
                    <button
                      key={mode}
                      onClick={() => {
                        setRepDisplayMode(mode);
                        setShowPeriodPicker(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        repDisplayMode === mode
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {TIME_PERIOD_LABELS[mode]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Overview Stats */}
        <Card>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalSets}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Sets</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalReps.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Reps</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.workoutDays}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Workout Days</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.uniqueExercises}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Exercises</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reps by Exercise */}
        {exerciseStats.length > 0 && (
          <Card>
            <CardContent>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                <Dumbbell className="w-4 h-4" />
                Reps by Exercise
              </h3>
              <div className="space-y-2">
                {exerciseStats.map(({ exercise, sets, reps }) => (
                  <div key={exercise.id} className="flex items-center gap-3 py-2 px-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <Badge variant={exercise.type} className="text-[10px]">
                      {EXERCISE_TYPE_LABELS[exercise.type]}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {exercise.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {reps.toLocaleString()} reps
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {sets} sets
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sets by Type */}
        <Card>
          <CardContent>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Sets by Type
            </h3>
            <div className="space-y-2">
              {EXERCISE_TYPES.map(type => {
                const count = setsByType[type] || 0;
                const percentage = stats.totalSets > 0 
                  ? Math.round((count / stats.totalSets) * 100) 
                  : 0;
                
                return (
                  <div key={type} className="flex items-center gap-3">
                    <Badge variant={type} className="w-20 justify-center">
                      {EXERCISE_TYPE_LABELS[type]}
                    </Badge>
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          type === 'push' ? 'bg-rose-500' :
                          type === 'pull' ? 'bg-blue-500' :
                          type === 'legs' ? 'bg-emerald-500' :
                          type === 'core' ? 'bg-amber-500' :
                          type === 'balance' ? 'bg-purple-500' :
                          type === 'mobility' ? 'bg-cyan-500' :
                          'bg-gray-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Activity by Day (always last 30 days) */}
        <Card>
          <CardContent>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Activity by Day (Last 30 Days)
            </h3>
            <div className="flex justify-between gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => {
                const count = setsByDayOfWeek[day] || 0;
                const maxCount = Math.max(...Object.values(setsByDayOfWeek), 1);
                const intensity = count / maxCount;
                
                return (
                  <div key={day} className="flex-1 text-center">
                    <div 
                      className="h-16 rounded-lg mb-1 transition-colors"
                      style={{ 
                        backgroundColor: count > 0 
                          ? `rgba(14, 165, 233, ${0.2 + intensity * 0.8})` 
                          : undefined 
                      }}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">{day}</p>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {count}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
