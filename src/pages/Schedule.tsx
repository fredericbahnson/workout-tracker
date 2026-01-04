import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Calendar, CheckCircle, Circle, Clock, ChevronRight, Plus, SkipForward, History, Edit2, Trash2 } from 'lucide-react';
import { CycleRepo, ScheduledWorkoutRepo, ExerciseRepo, MaxRecordRepo, CompletedSetRepo } from '../data/repositories';
import { calculateTargetReps } from '../services/scheduler';
import { useAppStore } from '../stores/appStore';
import { useSyncItem } from '../contexts/SyncContext';
import { PageHeader } from '../components/layout';
import { Card, Badge, EmptyState, Button, Modal } from '../components/ui';
import { CycleWizard, CycleTypeSelector, MaxTestingWizard } from '../components/cycles';
import { SwipeableWorkoutCard } from '../components/workouts';
import { EXERCISE_TYPES, EXERCISE_TYPE_LABELS, type ScheduledWorkout, type Exercise, type ScheduledSet, type CompletedSet } from '../types';

export function SchedulePage() {
  const navigate = useNavigate();
  const { defaults } = useAppStore();
  const { deleteItem } = useSyncItem();
  const [showCycleWizard, setShowCycleWizard] = useState(false);
  const [isEditingCycle, setIsEditingCycle] = useState(false);  // true = edit existing, false = create new
  const [showCycleTypeSelector, setShowCycleTypeSelector] = useState(false);
  const [showMaxTestingWizard, setShowMaxTestingWizard] = useState(false);
  const [previewWorkout, setPreviewWorkout] = useState<ScheduledWorkout | null>(null);
  const [historyWorkout, setHistoryWorkout] = useState<ScheduledWorkout | null>(null);
  const [historyCompletedSets, setHistoryCompletedSets] = useState<CompletedSet[]>([]);
  const [workoutToDelete, setWorkoutToDelete] = useState<ScheduledWorkout | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Live queries
  const activeCycle = useLiveQuery(() => CycleRepo.getActive(), []);
  
  const allWorkouts = useLiveQuery(async () => {
    if (!activeCycle) return [];
    return ScheduledWorkoutRepo.getByCycleId(activeCycle.id);
  }, [activeCycle?.id]);

  const exercises = useLiveQuery(() => ExerciseRepo.getAll(), []);
  const maxRecords = useLiveQuery(() => MaxRecordRepo.getLatestForAllExercises(), []);

  const exerciseMap = new Map<string, Exercise>();
  exercises?.forEach(ex => exerciseMap.set(ex.id, ex));

  // Split workouts into pending, done, and skipped
  const pendingWorkouts = allWorkouts?.filter(w => w.status === 'pending' || w.status === 'partial') || [];
  const doneWorkouts = allWorkouts?.filter(w => w.status === 'completed') || [];
  const skippedWorkouts = allWorkouts?.filter(w => w.status === 'skipped') || [];
  const passedWorkouts = allWorkouts?.filter(w => w.status === 'completed' || w.status === 'skipped') || [];

  const getStatusIcon = (status: ScheduledWorkout['status']) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-500' };
      case 'partial':
        return { icon: Clock, color: 'text-yellow-500' };
      case 'skipped':
        return { icon: SkipForward, color: 'text-gray-400' };
      default:
        return { icon: Circle, color: 'text-gray-300 dark:text-gray-600' };
    }
  };

  // Get sets summary by type for a workout
  const getSetsSummary = (workout: ScheduledWorkout) => {
    const summary: Record<string, number> = {};
    workout.scheduledSets.forEach(set => {
      summary[set.exerciseType] = (summary[set.exerciseType] || 0) + 1;
    });
    return summary;
  };

  // Get target reps/time for a set
  const getTargetReps = (set: ScheduledSet, workout: ScheduledWorkout): number => {
    if (!activeCycle) return 0;
    const maxRecord = maxRecords?.get(set.exerciseId);
    return calculateTargetReps(
      set, 
      workout, 
      maxRecord, 
      activeCycle.conditioningWeeklyRepIncrement,
      activeCycle.conditioningWeeklyTimeIncrement || 5,
      defaults.defaultMaxReps
    );
  };

  const handleWorkoutClick = (workout: ScheduledWorkout) => {
    setPreviewWorkout(workout);
  };

  const handleHistoryClick = async (workout: ScheduledWorkout) => {
    setHistoryWorkout(workout);
    const completedSets = await CompletedSetRepo.getForScheduledWorkout(workout.id);
    setHistoryCompletedSets(completedSets);
  };

  const handleDeleteWorkout = async () => {
    if (!workoutToDelete) return;
    
    setIsDeleting(true);
    try {
      await ScheduledWorkoutRepo.delete(workoutToDelete.id);
      await deleteItem('scheduled_workouts', workoutToDelete.id);
      
      // If we were previewing this workout, close the preview
      if (previewWorkout?.id === workoutToDelete.id) {
        setPreviewWorkout(null);
      }
      
      setWorkoutToDelete(null);
    } catch (error) {
      console.error('Failed to delete workout:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!activeCycle) {
    return (
      <>
        <PageHeader 
          title="Schedule" 
          action={
            <Button onClick={() => setShowCycleTypeSelector(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Create Cycle
            </Button>
          }
        />
        <div className="px-4 py-8">
          <EmptyState
            icon={Calendar}
            title="No active cycle"
            description="Create a training cycle to see your workout queue."
            action={
              <Button onClick={() => setShowCycleTypeSelector(true)}>
                Create Cycle
              </Button>
            }
          />
        </div>

        {/* Cycle Type Selector Modal */}
        <Modal
          isOpen={showCycleTypeSelector}
          onClose={() => setShowCycleTypeSelector(false)}
          title="Create New Cycle"
        >
          <CycleTypeSelector
            onSelectTraining={() => {
              setShowCycleTypeSelector(false);
              setIsEditingCycle(false);
              setShowCycleWizard(true);
            }}
            onSelectMaxTesting={() => {
              setShowCycleTypeSelector(false);
              setShowMaxTestingWizard(true);
            }}
            onCancel={() => setShowCycleTypeSelector(false)}
          />
        </Modal>

        {/* Cycle Wizard Modal */}
        <Modal
          isOpen={showCycleWizard}
          onClose={() => setShowCycleWizard(false)}
          title="Create Training Cycle"
          size="full"
        >
          <div className="h-[80vh]">
            <CycleWizard
              onComplete={() => setShowCycleWizard(false)}
              onCancel={() => setShowCycleWizard(false)}
            />
          </div>
        </Modal>

        {/* Max Testing Wizard */}
        {showMaxTestingWizard && (
          <MaxTestingWizard
            onComplete={() => setShowMaxTestingWizard(false)}
            onCancel={() => setShowMaxTestingWizard(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="Schedule" 
        subtitle={`${activeCycle.name} • ${passedWorkouts.length}/${allWorkouts?.length || 0} done`}
      />

      <div className="px-4 py-4 space-y-6">
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            variant="primary"
            size="sm"
            onClick={() => setShowCycleTypeSelector(true)}
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-1" />
            Create New Cycle
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => {
              setIsEditingCycle(true);
              setShowCycleWizard(true);
            }}
            className="flex-1"
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Edit Cycle
          </Button>
        </div>

        {/* Cycle Progress or Cycle Complete */}
        {pendingWorkouts.length === 0 && passedWorkouts.length > 0 ? (
          /* Cycle Complete */
          <Card className="p-6 text-center">
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
              🎉 Cycle Complete!
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              You've finished all {passedWorkouts.length} workouts
              {skippedWorkouts.length > 0 && ` (${doneWorkouts.length} completed, ${skippedWorkouts.length} skipped)`}.
            </p>
            <Button onClick={() => setShowCycleTypeSelector(true)}>
              Start New Cycle
            </Button>
          </Card>
        ) : (
          /* Cycle Progress */
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Cycle Progress
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Week {Math.min(
                  Math.ceil((passedWorkouts.length + 1) / activeCycle.workoutDaysPerWeek),
                  activeCycle.numberOfWeeks
                )} of {activeCycle.numberOfWeeks}
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${((passedWorkouts.length) / (allWorkouts?.length || 1)) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>
                {passedWorkouts.length} / {allWorkouts?.length || 0} passed
                {skippedWorkouts.length > 0 && ` (${skippedWorkouts.length} skipped)`}
              </span>
              <span>{pendingWorkouts.length} remaining</span>
            </div>
          </Card>
        )}

        {/* Upcoming Workouts */}
        {pendingWorkouts.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              Upcoming ({pendingWorkouts.length})
            </h2>
            <div className="space-y-2">
              {pendingWorkouts.map((workout, index) => {
                const group = activeCycle.groups.find(g => g.id === workout.groupId);
                const setsSummary = getSetsSummary(workout);
                const isNext = index === 0;
                
                return (
                  <SwipeableWorkoutCard
                    key={workout.id}
                    onSwipeLeft={() => setWorkoutToDelete(workout)}
                    onTap={() => handleWorkoutClick(workout)}
                  >
                    <Card
                      className={`p-3 ${isNext ? 'ring-2 ring-primary-500' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`
                          w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0
                          ${isNext 
                            ? 'bg-primary-600 text-white' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }
                        `}>
                          <span className="text-xs font-medium">#{workout.sequenceNumber}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {group?.name || 'Workout'}
                            </span>
                            {isNext && (
                              <Badge className="text-[10px] bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                                NEXT
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Week {workout.weekNumber} • RFEM -{workout.rfem} • {workout.scheduledSets.length} sets
                          </p>
                          
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {Object.entries(setsSummary).map(([type, count]) => (
                              <Badge 
                                key={type} 
                                variant={type as any} 
                                className="text-[10px]"
                              >
                                {count} {EXERCISE_TYPE_LABELS[type as keyof typeof EXERCISE_TYPE_LABELS]}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                      </div>
                    </Card>
                  </SwipeableWorkoutCard>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Workouts */}
        {passedWorkouts.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
              <History className="w-4 h-4" />
              Completed ({doneWorkouts.length})
              {skippedWorkouts.length > 0 && ` + ${skippedWorkouts.length} skipped`}
            </h2>
            <div className="space-y-2">
              {passedWorkouts.slice().reverse().map(workout => {
                const group = activeCycle.groups.find(g => g.id === workout.groupId);
                const status = getStatusIcon(workout.status);
                const isSkipped = workout.status === 'skipped';
                
                return (
                  <Card
                    key={workout.id}
                    className={`p-3 cursor-pointer transition-colors ${isSkipped 
                      ? 'bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50' 
                      : 'bg-green-50/50 dark:bg-green-900/10 hover:bg-green-100/50 dark:hover:bg-green-900/20'
                    }`}
                    onClick={() => handleHistoryClick(workout)}
                  >
                    <div className="flex items-center gap-3">
                      <status.icon className={`w-5 h-5 ${status.color} flex-shrink-0`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isSkipped 
                            ? 'text-gray-500 dark:text-gray-400' 
                            : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            #{workout.sequenceNumber} {group?.name}
                          </span>
                          {isSkipped && (
                            <Badge className="text-[10px] bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                              Skipped
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Week {workout.weekNumber} • {workout.scheduledSets.length} sets
                          {workout.completedAt && (
                            <> • {new Date(workout.completedAt).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                      
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Workout Preview Modal */}
      <Modal
        isOpen={!!previewWorkout}
        onClose={() => setPreviewWorkout(null)}
        title={`Workout #${previewWorkout?.sequenceNumber}`}
        size="lg"
      >
        {previewWorkout && (() => {
          // Group sets by type for this preview
          const groupedPreviewSets = EXERCISE_TYPES.map(type => ({
            type,
            sets: previewWorkout.scheduledSets
              .filter(set => set.exerciseType === type)
              .sort((a, b) => {
                const exA = exerciseMap.get(a.exerciseId);
                const exB = exerciseMap.get(b.exerciseId);
                return (exA?.name || '').localeCompare(exB?.name || '');
              })
          })).filter(group => group.sets.length > 0);

          // Check if this is the next workout
          const isNextWorkout = pendingWorkouts.length > 0 && pendingWorkouts[0].id === previewWorkout.id;

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {activeCycle?.groups.find(g => g.id === previewWorkout.groupId)?.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Week {previewWorkout.weekNumber} • RFEM -{previewWorkout.rfem}
                  </p>
                </div>
                <Badge className="text-sm">
                  {previewWorkout.scheduledSets.length} sets
                </Badge>
              </div>

              <div className="space-y-4">
                {groupedPreviewSets.map(group => (
                  <div key={group.type}>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      {EXERCISE_TYPE_LABELS[group.type]}
                    </h4>
                    <div className="space-y-2">
                      {group.sets.map(set => {
                        const exercise = exerciseMap.get(set.exerciseId);
                        if (!exercise) return null;
                        const targetReps = getTargetReps(set, previewWorkout);

                        return (
                          <div
                            key={set.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                          >
                            <span className="flex-1 text-gray-900 dark:text-gray-100">
                              {exercise.name}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {targetReps} reps
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  {isNextWorkout && (
                    <Button 
                      className="flex-1"
                      onClick={() => {
                        setPreviewWorkout(null);
                        navigate('/');
                      }}
                    >
                      Start Workout
                    </Button>
                  )}
                  <Button 
                    variant="secondary" 
                    className={isNextWorkout ? "flex-1" : "w-full"}
                    onClick={() => setPreviewWorkout(null)}
                  >
                    Close
                  </Button>
                </div>
                
                <Button 
                  variant="secondary"
                  className="w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => {
                    setWorkoutToDelete(previewWorkout);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Workout
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* History Detail Modal */}
      <Modal
        isOpen={!!historyWorkout}
        onClose={() => {
          setHistoryWorkout(null);
          setHistoryCompletedSets([]);
        }}
        title={`Workout #${historyWorkout?.sequenceNumber} Details`}
        size="lg"
      >
        {historyWorkout && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {activeCycle?.groups.find(g => g.id === historyWorkout.groupId)?.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Week {historyWorkout.weekNumber} • {historyWorkout.completedAt 
                    ? new Date(historyWorkout.completedAt).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Skipped'
                  }
                </p>
              </div>
              <Badge className={historyWorkout.status === 'skipped' 
                ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              }>
                {historyWorkout.status === 'skipped' ? 'Skipped' : 'Completed'}
              </Badge>
            </div>

            {historyWorkout.status === 'skipped' ? (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                This workout was skipped
              </div>
            ) : (
              <div className="space-y-4">
                {historyCompletedSets.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 py-2">
                    No set data recorded
                  </p>
                ) : (() => {
                  // Separate scheduled sets from ad-hoc sets
                  const scheduledSets = historyCompletedSets.filter(cs => cs.scheduledSetId !== null);
                  const adHocSets = historyCompletedSets.filter(cs => cs.scheduledSetId === null);
                  
                  // Group scheduled sets by exercise type
                  const groupedScheduledSets = EXERCISE_TYPES.map(type => ({
                    type,
                    sets: scheduledSets
                      .filter(cs => {
                        const ex = exerciseMap.get(cs.exerciseId);
                        return ex?.type === type;
                      })
                      .sort((a, b) => {
                        const exA = exerciseMap.get(a.exerciseId);
                        const exB = exerciseMap.get(b.exerciseId);
                        return (exA?.name || '').localeCompare(exB?.name || '');
                      })
                  })).filter(group => group.sets.length > 0);
                  
                  // Group ad-hoc sets by exercise type
                  const groupedAdHocSets = EXERCISE_TYPES.map(type => ({
                    type,
                    sets: adHocSets
                      .filter(cs => {
                        const ex = exerciseMap.get(cs.exerciseId);
                        return ex?.type === type;
                      })
                      .sort((a, b) => {
                        const exA = exerciseMap.get(a.exerciseId);
                        const exB = exerciseMap.get(b.exerciseId);
                        return (exA?.name || '').localeCompare(exB?.name || '');
                      })
                  })).filter(group => group.sets.length > 0);

                  return (
                    <div className="space-y-6">
                      {/* Scheduled Sets */}
                      {scheduledSets.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Scheduled Sets ({scheduledSets.length})
                          </h4>
                          {groupedScheduledSets.map(group => (
                            <div key={group.type}>
                              <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                {EXERCISE_TYPE_LABELS[group.type]}
                              </h5>
                              <div className="space-y-2">
                                {group.sets.map(completedSet => {
                                  const exercise = exerciseMap.get(completedSet.exerciseId);
                                  const wasSkipped = completedSet.actualReps === 0 && completedSet.notes === 'Skipped';
                                  return (
                                    <div 
                                      key={completedSet.id}
                                      className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                                        wasSkipped 
                                          ? 'bg-orange-50 dark:bg-orange-900/20' 
                                          : 'bg-gray-50 dark:bg-gray-800/50'
                                      }`}
                                    >
                                      <span className="text-sm text-gray-900 dark:text-gray-100">
                                        {exercise?.name || 'Unknown Exercise'}
                                      </span>
                                      <div className="text-sm">
                                        {wasSkipped ? (
                                          <span className="text-orange-600 dark:text-orange-400">Skipped</span>
                                        ) : (
                                          <>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                              {completedSet.actualReps}
                                            </span>
                                            <span className="text-gray-500 dark:text-gray-400">
                                              {' '}/ {completedSet.targetReps}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Ad-hoc Sets */}
                      {adHocSets.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            Additional Sets ({adHocSets.length})
                          </h4>
                          {groupedAdHocSets.map(group => (
                            <div key={group.type}>
                              <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                {EXERCISE_TYPE_LABELS[group.type]}
                              </h5>
                              <div className="space-y-2">
                                {group.sets.map(completedSet => {
                                  const exercise = exerciseMap.get(completedSet.exerciseId);
                                  return (
                                    <div 
                                      key={completedSet.id}
                                      className="flex items-center justify-between py-2 px-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                                    >
                                      <span className="text-sm text-gray-900 dark:text-gray-100">
                                        {exercise?.name || 'Unknown Exercise'}
                                      </span>
                                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                        {completedSet.actualReps}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => {
                setHistoryWorkout(null);
                setHistoryCompletedSets([]);
              }}
            >
              Close
            </Button>
          </div>
        )}
      </Modal>

      {/* Cycle Wizard Modal */}
      <Modal
        isOpen={showCycleWizard}
        onClose={() => setShowCycleWizard(false)}
        title={isEditingCycle ? "Edit Training Cycle" : "Create Training Cycle"}
        size="full"
      >
        <div className="h-[80vh]">
          <CycleWizard
            editCycle={isEditingCycle ? activeCycle : undefined}
            onComplete={() => setShowCycleWizard(false)}
            onCancel={() => setShowCycleWizard(false)}
          />
        </div>
      </Modal>

      {/* Cycle Type Selector Modal */}
      <Modal
        isOpen={showCycleTypeSelector}
        onClose={() => setShowCycleTypeSelector(false)}
        title="Create New Cycle"
      >
        <CycleTypeSelector
          onSelectTraining={() => {
            setShowCycleTypeSelector(false);
            setIsEditingCycle(false);
            setShowCycleWizard(true);
          }}
          onSelectMaxTesting={() => {
            setShowCycleTypeSelector(false);
            setShowMaxTestingWizard(true);
          }}
          onCancel={() => setShowCycleTypeSelector(false)}
        />
      </Modal>

      {/* Max Testing Wizard */}
      {showMaxTestingWizard && (
        <MaxTestingWizard
          onComplete={() => setShowMaxTestingWizard(false)}
          onCancel={() => setShowMaxTestingWizard(false)}
        />
      )}

      {/* Delete Workout Confirmation Modal */}
      <Modal
        isOpen={!!workoutToDelete}
        onClose={() => setWorkoutToDelete(null)}
        title="Delete Workout"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Warning:</strong> This action cannot be undone.
            </p>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete Workout #{workoutToDelete?.sequenceNumber}?
          </p>
          
          {workoutToDelete && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {activeCycle?.groups.find(g => g.id === workoutToDelete.groupId)?.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Week {workoutToDelete.weekNumber} • {workoutToDelete.scheduledSets.length} sets
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              className="flex-1"
              onClick={() => setWorkoutToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteWorkout}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Workout'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
