import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Calendar, CalendarDays, CheckCircle, Circle, Clock, ChevronRight, Plus, SkipForward, History, Edit2, Dumbbell, List } from 'lucide-react';
import { CycleRepo, ScheduledWorkoutRepo, ExerciseRepo, MaxRecordRepo, CompletedSetRepo } from '@/data/repositories';
import { useSyncedPreferences } from '@/contexts';
import { useSyncItem } from '@/contexts/SyncContext';
import { PageHeader } from '@/components/layout';
import { Card, Badge, EmptyState, Button, Modal } from '@/components/ui';
import { CycleWizard, CycleTypeSelector, MaxTestingWizard } from '@/components/cycles';
import { SwipeableWorkoutCard, WorkoutCalendar } from '@/components/workouts';
import { WorkoutPreviewModal, WorkoutHistoryModal, DeleteWorkoutModal, CalendarDateModal } from '@/components/schedule';
import { createScopedLogger } from '@/utils/logger';
import { EXERCISE_TYPES, EXERCISE_TYPE_LABELS, type ScheduledWorkout, type Exercise, type CompletedSet, type ProgressionMode } from '@/types';

const log = createScopedLogger('Schedule');

export function SchedulePage() {
  const navigate = useNavigate();
  const { preferences } = useSyncedPreferences();
  const { syncItem, deleteItem } = useSyncItem();
  
  // Modal states
  const [showCycleWizard, setShowCycleWizard] = useState(false);
  const [isEditingCycle, setIsEditingCycle] = useState(false);
  const [showCycleTypeSelector, setShowCycleTypeSelector] = useState(false);
  const [showMaxTestingWizard, setShowMaxTestingWizard] = useState(false);
  const [wizardProgressionMode, setWizardProgressionMode] = useState<ProgressionMode>('rfem');
  const [previewWorkout, setPreviewWorkout] = useState<ScheduledWorkout | null>(null);
  const [historyWorkout, setHistoryWorkout] = useState<ScheduledWorkout | null>(null);
  const [historyCompletedSets, setHistoryCompletedSets] = useState<CompletedSet[]>([]);
  const [workoutToDelete, setWorkoutToDelete] = useState<ScheduledWorkout | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Calendar view state
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [selectedDateWorkouts, setSelectedDateWorkouts] = useState<ScheduledWorkout[]>([]);

  // Live queries
  const activeCycle = useLiveQuery(() => CycleRepo.getActive(), []);
  
  const allWorkouts = useLiveQuery(async () => {
    if (!activeCycle) return [];
    return ScheduledWorkoutRepo.getByCycleId(activeCycle.id);
  }, [activeCycle?.id]);

  const allCompletedWorkouts = useLiveQuery(() => ScheduledWorkoutRepo.getAllCompleted(), []);
  const allCycles = useLiveQuery(() => CycleRepo.getAll(), []);
  const exercises = useLiveQuery(() => ExerciseRepo.getAll(), []);
  const maxRecords = useLiveQuery(() => MaxRecordRepo.getLatestForAllExercises(), []);

  const exerciseMap = useMemo(() => {
    const map = new Map<string, Exercise>();
    exercises?.forEach(ex => map.set(ex.id, ex));
    return map;
  }, [exercises]);

  // Helper to get group name from any cycle
  const getGroupName = useCallback((workout: ScheduledWorkout): string | undefined => {
    if (workout.isAdHoc) return undefined;
    const activeGroup = activeCycle?.groups.find(g => g.id === workout.groupId);
    if (activeGroup) return activeGroup.name;
    for (const cycle of allCycles || []) {
      const group = cycle.groups.find(g => g.id === workout.groupId);
      if (group) return group.name;
    }
    return undefined;
  }, [activeCycle, allCycles]);

  // Split workouts - memoized for performance
  const { pendingWorkouts, doneWorkouts, skippedWorkouts, passedWorkouts } = useMemo(() => ({
    pendingWorkouts: allWorkouts?.filter(w => w.status === 'pending' || w.status === 'partial') || [],
    doneWorkouts: allWorkouts?.filter(w => w.status === 'completed') || [],
    skippedWorkouts: allWorkouts?.filter(w => w.status === 'skipped') || [],
    passedWorkouts: allWorkouts?.filter(w => w.status === 'completed' || w.status === 'skipped') || [],
  }), [allWorkouts]);

  const getStatusIcon = useCallback((status: ScheduledWorkout['status']) => {
    switch (status) {
      case 'completed': return { icon: CheckCircle, color: 'text-green-500' };
      case 'partial': return { icon: Clock, color: 'text-yellow-500' };
      case 'skipped': return { icon: SkipForward, color: 'text-gray-400' };
      default: return { icon: Circle, color: 'text-gray-300 dark:text-gray-600' };
    }
  }, []);

  const getSetsSummary = useCallback((workout: ScheduledWorkout) => {
    const summary: Record<string, number> = {};
    workout.scheduledSets.forEach(set => {
      summary[set.exerciseType] = (summary[set.exerciseType] || 0) + 1;
    });
    return summary;
  }, []);

  const handleWorkoutClick = (workout: ScheduledWorkout) => setPreviewWorkout(workout);

  const handleHistoryClick = async (workout: ScheduledWorkout) => {
    const sets = await CompletedSetRepo.getForScheduledWorkout(workout.id);
    setHistoryCompletedSets(sets);
    setHistoryWorkout(workout);
  };

  const handleCalendarDateSelect = (date: Date, workouts: ScheduledWorkout[]) => {
    setSelectedCalendarDate(date);
    setSelectedDateWorkouts(workouts);
  };

  const handleDeleteWorkout = async () => {
    if (!workoutToDelete) return;
    setIsDeleting(true);
    try {
      await ScheduledWorkoutRepo.delete(workoutToDelete.id);
      await deleteItem('scheduled_workouts', workoutToDelete.id);
      setWorkoutToDelete(null);
      setPreviewWorkout(null);
      log.info('Deleted workout', { workoutId: workoutToDelete.id });
    } catch (error) {
      log.error(error as Error, { context: 'deleteWorkout' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartAdHocWorkout = async () => {
    if (!activeCycle) return;
    
    // Count existing ad-hoc workouts in this cycle
    const adHocCount = await ScheduledWorkoutRepo.countAdHocWorkouts(activeCycle.id);
    const workoutName = `Ad Hoc Workout ${adHocCount + 1}`;
    
    // Get the max sequence number to place this workout in order
    const cycleWorkouts = await ScheduledWorkoutRepo.getByCycleId(activeCycle.id);
    const maxSequence = Math.max(...cycleWorkouts.map(w => w.sequenceNumber), 0);
    
    // Calculate current week based on progress
    const progress = await ScheduledWorkoutRepo.getCycleProgress(activeCycle.id);
    const currentWeek = Math.ceil((progress.passed + 1) / activeCycle.workoutDaysPerWeek) || 1;
    
    // Create ad-hoc workout
    const adHocWorkout = await ScheduledWorkoutRepo.create({
      cycleId: activeCycle.id,
      sequenceNumber: maxSequence + 0.5,
      weekNumber: currentWeek,
      dayInWeek: 1,
      groupId: 'ad-hoc',
      rfem: 0,
      scheduledSets: [],
      status: 'partial',
      isAdHoc: true,
      customName: workoutName
    });
    
    await syncItem('scheduled_workouts', adHocWorkout);
    navigate('/');
  };

  // Empty state
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
            action={<Button onClick={() => setShowCycleTypeSelector(true)}>Create Cycle</Button>}
          />
        </div>
        <CycleTypeSelectorModal
          isOpen={showCycleTypeSelector}
          onSelectTraining={(mode) => {
            setShowCycleTypeSelector(false);
            setIsEditingCycle(false);
            setWizardProgressionMode(mode);
            setShowCycleWizard(true);
          }}
          onSelectMaxTesting={() => {
            setShowCycleTypeSelector(false);
            setShowMaxTestingWizard(true);
          }}
          onClose={() => setShowCycleTypeSelector(false)}
        />
        <CycleWizardModal
          isOpen={showCycleWizard}
          editCycle={isEditingCycle ? activeCycle : undefined}
          progressionMode={wizardProgressionMode}
          onClose={() => setShowCycleWizard(false)}
        />
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
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button 
              variant="primary" size="sm" className="flex-1"
              onClick={() => setShowCycleTypeSelector(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Create New Cycle
            </Button>
            <Button 
              variant="secondary" size="sm" className="flex-1"
              onClick={() => { setIsEditingCycle(true); setShowCycleWizard(true); }}
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit Cycle
            </Button>
          </div>
          <Button variant="secondary" size="sm" className="w-full" onClick={handleStartAdHocWorkout}>
            <Dumbbell className="w-4 h-4 mr-1" />
            Log Ad-Hoc Workout
          </Button>
        </div>

        {/* View Toggle */}
        {(allCompletedWorkouts?.length || 0) > 0 && (
          <ViewToggle showCalendarView={showCalendarView} onToggle={setShowCalendarView} />
        )}

        {/* Calendar View */}
        {showCalendarView && (allCompletedWorkouts?.length || 0) > 0 && (
          <WorkoutCalendar workouts={allCompletedWorkouts || []} onSelectDate={handleCalendarDateSelect} />
        )}

        {/* List View */}
        {!showCalendarView && (
          <>
            {/* Cycle Progress or Complete */}
            {pendingWorkouts.length === 0 && passedWorkouts.length > 0 ? (
              <CycleCompleteCard
                totalWorkouts={passedWorkouts.length}
                completedCount={doneWorkouts.length}
                skippedCount={skippedWorkouts.length}
                onStartNewCycle={() => setShowCycleTypeSelector(true)}
              />
            ) : (
              <CycleProgressCard
                passedCount={passedWorkouts.length}
                totalCount={allWorkouts?.length || 0}
                skippedCount={skippedWorkouts.length}
                pendingCount={pendingWorkouts.length}
                currentWeek={Math.min(
                  Math.ceil((passedWorkouts.length + 1) / activeCycle.workoutDaysPerWeek),
                  activeCycle.numberOfWeeks
                )}
                totalWeeks={activeCycle.numberOfWeeks}
              />
            )}

            {/* Upcoming Workouts */}
            {pendingWorkouts.length > 0 && (
              <WorkoutSection
                title={`Upcoming (${pendingWorkouts.length})`}
                workouts={pendingWorkouts}
                activeCycle={activeCycle}
                onWorkoutClick={handleWorkoutClick}
                onWorkoutDelete={setWorkoutToDelete}
                getSetsSummary={getSetsSummary}
                variant="upcoming"
              />
            )}

            {/* Completed Workouts */}
            {doneWorkouts.length > 0 && (
              <WorkoutSection
                title={`Completed (${doneWorkouts.length})`}
                workouts={[...doneWorkouts].reverse()}
                activeCycle={activeCycle}
                onWorkoutClick={handleHistoryClick}
                getStatusIcon={getStatusIcon}
                getSetsSummary={getSetsSummary}
                variant="completed"
              />
            )}

            {/* Skipped Workouts */}
            {skippedWorkouts.length > 0 && (
              <WorkoutSection
                title={`Skipped (${skippedWorkouts.length})`}
                workouts={[...skippedWorkouts].reverse()}
                activeCycle={activeCycle}
                onWorkoutClick={handleHistoryClick}
                getStatusIcon={getStatusIcon}
                getSetsSummary={getSetsSummary}
                variant="skipped"
              />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <CycleTypeSelectorModal
        isOpen={showCycleTypeSelector}
        onSelectTraining={(mode) => {
          setShowCycleTypeSelector(false);
          setIsEditingCycle(false);
          setWizardProgressionMode(mode);
          setShowCycleWizard(true);
        }}
        onSelectMaxTesting={() => {
          setShowCycleTypeSelector(false);
          setShowMaxTestingWizard(true);
        }}
        onClose={() => setShowCycleTypeSelector(false)}
      />

      <CycleWizardModal
        isOpen={showCycleWizard}
        editCycle={isEditingCycle ? activeCycle : undefined}
        progressionMode={wizardProgressionMode}
        onClose={() => setShowCycleWizard(false)}
      />

      {showMaxTestingWizard && (
        <MaxTestingWizard
          onComplete={() => setShowMaxTestingWizard(false)}
          onCancel={() => setShowMaxTestingWizard(false)}
        />
      )}

      {previewWorkout && (
        <WorkoutPreviewModal
          workout={previewWorkout}
          exerciseMap={exerciseMap}
          maxRecords={maxRecords}
          activeCycle={activeCycle}
          groupName={getGroupName(previewWorkout)}
          isNextWorkout={pendingWorkouts.length > 0 && pendingWorkouts[0].id === previewWorkout.id}
          defaultMaxReps={preferences.defaultMaxReps}
          onStartWorkout={() => { setPreviewWorkout(null); navigate('/'); }}
          onDeleteWorkout={() => setWorkoutToDelete(previewWorkout)}
          onClose={() => setPreviewWorkout(null)}
        />
      )}

      {historyWorkout && (
        <WorkoutHistoryModal
          workout={historyWorkout}
          completedSets={historyCompletedSets}
          exerciseMap={exerciseMap}
          groupName={getGroupName(historyWorkout)}
          onClose={() => { setHistoryWorkout(null); setHistoryCompletedSets([]); }}
        />
      )}

      <DeleteWorkoutModal
        workout={workoutToDelete}
        groupName={workoutToDelete ? getGroupName(workoutToDelete) : undefined}
        isDeleting={isDeleting}
        onConfirm={handleDeleteWorkout}
        onClose={() => setWorkoutToDelete(null)}
      />

      {selectedCalendarDate && (
        <CalendarDateModal
          date={selectedCalendarDate}
          workouts={selectedDateWorkouts}
          allCycles={allCycles}
          activeCycle={activeCycle}
          onWorkoutClick={(workout) => {
            setSelectedCalendarDate(null);
            setSelectedDateWorkouts([]);
            handleHistoryClick(workout);
          }}
          onClose={() => { setSelectedCalendarDate(null); setSelectedDateWorkouts([]); }}
        />
      )}
    </>
  );
}

// Helper Components

function ViewToggle({ showCalendarView, onToggle }: { showCalendarView: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="flex justify-center">
      <div className="inline-flex rounded-lg border border-gray-200 dark:border-dark-border p-0.5 bg-gray-100 dark:bg-gray-800">
        <button
          onClick={() => onToggle(false)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            !showCalendarView 
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <List className="w-4 h-4" />
          List
        </button>
        <button
          onClick={() => onToggle(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            showCalendarView 
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Calendar
        </button>
      </div>
    </div>
  );
}

function CycleProgressCard({ 
  passedCount, totalCount, skippedCount, pendingCount, currentWeek, totalWeeks 
}: { 
  passedCount: number; totalCount: number; skippedCount: number; pendingCount: number; currentWeek: number; totalWeeks: number;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cycle Progress</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">Week {currentWeek} of {totalWeeks}</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary-500 rounded-full transition-all"
          style={{ width: `${(passedCount / totalCount) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span>{passedCount} / {totalCount} passed{skippedCount > 0 && ` (${skippedCount} skipped)`}</span>
        <span>{pendingCount} remaining</span>
      </div>
    </Card>
  );
}

function CycleCompleteCard({ 
  totalWorkouts, completedCount, skippedCount, onStartNewCycle 
}: { 
  totalWorkouts: number; completedCount: number; skippedCount: number; onStartNewCycle: () => void;
}) {
  return (
    <Card className="p-6 text-center">
      <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">🎉 Cycle Complete!</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        You've finished all {totalWorkouts} workouts
        {skippedCount > 0 && ` (${completedCount} completed, ${skippedCount} skipped)`}.
      </p>
      <Button onClick={onStartNewCycle}>Start New Cycle</Button>
    </Card>
  );
}

interface WorkoutSectionProps {
  title: string;
  workouts: ScheduledWorkout[];
  activeCycle: NonNullable<ReturnType<typeof CycleRepo.getActive> extends Promise<infer T> ? T : never>;
  onWorkoutClick: (workout: ScheduledWorkout) => void;
  onWorkoutDelete?: (workout: ScheduledWorkout) => void;
  getStatusIcon?: (status: ScheduledWorkout['status']) => { icon: typeof CheckCircle; color: string };
  getSetsSummary: (workout: ScheduledWorkout) => Record<string, number>;
  variant: 'upcoming' | 'completed' | 'skipped';
}

function WorkoutSection({ 
  title, workouts, activeCycle, onWorkoutClick, onWorkoutDelete, getStatusIcon, getSetsSummary, variant 
}: WorkoutSectionProps) {
  return (
    <div>
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{title}</h2>
      <div className="space-y-2">
        {workouts.map((workout, index) => {
          const group = activeCycle.groups.find(g => g.id === workout.groupId);
          const setsSummary = getSetsSummary(workout);
          const isNext = variant === 'upcoming' && index === 0;
          const isLastOfWeek = workout.sequenceNumber % activeCycle.workoutDaysPerWeek === 0;
          const hasMoreWorkouts = index < workouts.length - 1;
          const showWeekDivider = variant === 'upcoming' && isLastOfWeek && hasMoreWorkouts;
          const StatusIcon = getStatusIcon?.(workout.status);

          const cardContent = (
            <Card className={`p-3 ${isNext ? 'ring-2 ring-primary-500' : ''}`}>
              <div className="flex items-start gap-3">
                {variant === 'upcoming' ? (
                  <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${
                    isNext ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}>
                    <span className="text-xs font-medium">#{workout.sequenceNumber}</span>
                  </div>
                ) : StatusIcon ? (
                  <StatusIcon.icon className={`w-5 h-5 ${StatusIcon.color} flex-shrink-0 mt-0.5`} />
                ) : null}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {workout.isAdHoc ? (workout.customName || 'Ad Hoc Workout') : (group?.name || 'Workout')}
                    </span>
                    {isNext && (
                      <Badge className="text-2xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">NEXT</Badge>
                    )}
                    {workout.isAdHoc && (
                      <Badge className="text-2xs bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">Ad Hoc</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {workout.isAdHoc ? (
                      workout.completedAt && new Date(workout.completedAt).toLocaleDateString()
                    ) : (
                      <>Week {workout.weekNumber} • RFEM -{workout.rfem} • {workout.scheduledSets.length} sets</>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {EXERCISE_TYPES.filter(type => setsSummary[type]).map(type => (
                      <Badge key={type} variant={type} className="text-2xs">
                        {EXERCISE_TYPE_LABELS[type]}: {setsSummary[type]}
                      </Badge>
                    ))}
                  </div>
                </div>

                {variant !== 'upcoming' ? (
                  <History className="w-4 h-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
              </div>
            </Card>
          );

          return (
            <div key={workout.id}>
              {variant === 'upcoming' && onWorkoutDelete ? (
                <SwipeableWorkoutCard
                  onSwipeLeft={() => onWorkoutDelete(workout)}
                  onTap={() => onWorkoutClick(workout)}
                >
                  {cardContent}
                </SwipeableWorkoutCard>
              ) : (
                <div onClick={() => onWorkoutClick(workout)} className="cursor-pointer">
                  {cardContent}
                </div>
              )}
              {showWeekDivider && (
                <div className="flex items-center gap-2 py-3">
                  <div className="flex-1 border-t border-gray-200 dark:border-dark-border" />
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Week {workout.weekNumber + 1}
                  </span>
                  <div className="flex-1 border-t border-gray-200 dark:border-dark-border" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CycleTypeSelectorModal({ 
  isOpen, onSelectTraining, onSelectMaxTesting, onClose 
}: { 
  isOpen: boolean;
  onSelectTraining: (mode: ProgressionMode) => void;
  onSelectMaxTesting: () => void;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Cycle">
      <CycleTypeSelector
        onSelectTraining={onSelectTraining}
        onSelectMaxTesting={onSelectMaxTesting}
        onCancel={onClose}
      />
    </Modal>
  );
}

function CycleWizardModal({ 
  isOpen, editCycle, progressionMode, onClose 
}: { 
  isOpen: boolean;
  editCycle?: NonNullable<Awaited<ReturnType<typeof CycleRepo.getActive>>>;
  progressionMode: ProgressionMode;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editCycle ? "Edit Cycle" : "Create Training Cycle"} size="full">
      <div className="h-[80vh]">
        <CycleWizard
          onComplete={onClose}
          onCancel={onClose}
          editCycle={editCycle}
          initialProgressionMode={progressionMode}
        />
      </div>
    </Modal>
  );
}
