/**
 * CycleWizard Component
 *
 * Multi-step wizard for creating and editing training cycles.
 * Supports three progression modes: RFEM, Simple, and Mixed.
 *
 * This component orchestrates the wizard flow while delegating
 * state management to useCycleWizardState and UI to step components.
 */

import type { Cycle, ProgressionMode } from '@/types';
import {
  useCycleWizardState,
  WizardProgress,
  WizardNavigation,
  EditModeModal,
  StartStep,
  ScheduleModeStep,
  ScheduleStep,
  GroupsStep,
  ProgressionStep,
  GoalsStep,
  ReviewStep,
} from './wizard';

interface CycleWizardProps {
  onComplete: () => void;
  onCancel: () => void;
  editCycle?: Cycle;
  initialProgressionMode?: ProgressionMode;
}

export function CycleWizard({
  onComplete,
  onCancel,
  editCycle,
  initialProgressionMode,
}: CycleWizardProps) {
  const {
    // State
    progressionMode,
    currentStep,
    setCurrentStep,
    isCreating,
    error,
    setEditMode,
    showEditModeChoice,
    setShowEditModeChoice,

    // Form state
    name,
    setName,
    numberOfWeeks,
    setNumberOfWeeks,
    workoutDaysPerWeek,
    setWorkoutDaysPerWeek,
    groups,
    weeklySetGoals,
    setWeeklySetGoals,
    groupRotation,
    setGroupRotation,
    rfemRotation,
    setRfemRotation,
    conditioningWeeklyRepIncrement,
    setConditioningWeeklyRepIncrement,
    includeWarmupSets,
    setIncludeWarmupSets,
    includeTimedWarmups,
    setIncludeTimedWarmups,
    schedulingMode,
    setSchedulingMode,
    selectedDays,
    setSelectedDays,
    startDate,

    // Data
    exercises,
    exerciseMap,
    cycleProgress,
    cloneableCycles,
    defaults,

    // Validation & Navigation
    validation,
    canProceed,
    displaySteps,

    // Actions
    nextStep,
    prevStep,
    handleStartFresh,
    handleCloneFromCycle,
    handleCreate,

    // Group management
    addGroup,
    removeGroup,
    updateGroupName,
    addExerciseToGroup,
    removeExerciseFromGroup,
    updateAssignment,
  } = useCycleWizardState({ editCycle, initialProgressionMode, onComplete });

  return (
    <div className="flex flex-col h-full">
      {/* Progress indicator - hide on start step */}
      {currentStep !== 'start' && <WizardProgress steps={displaySteps} currentStep={currentStep} />}

      {/* Step content - reduced horizontal padding for more content width */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {currentStep === 'start' && (
          <StartStep
            cloneableCycles={cloneableCycles}
            onStartFresh={handleStartFresh}
            onCloneFromCycle={handleCloneFromCycle}
            onCancel={onCancel}
          />
        )}

        {currentStep === 'schedule_mode' && (
          <ScheduleModeStep schedulingMode={schedulingMode} onSelectMode={setSchedulingMode} />
        )}

        {currentStep === 'schedule' && (
          <ScheduleStep
            name={name}
            setName={setName}
            schedulingMode={schedulingMode}
            selectedDays={selectedDays}
            setSelectedDays={setSelectedDays}
            workoutDaysPerWeek={workoutDaysPerWeek}
            setWorkoutDaysPerWeek={setWorkoutDaysPerWeek}
            numberOfWeeks={numberOfWeeks}
            setNumberOfWeeks={setNumberOfWeeks}
            startDate={startDate}
          />
        )}

        {currentStep === 'groups' && (
          <GroupsStep
            groups={groups}
            exercises={exercises || []}
            exerciseMap={exerciseMap}
            defaults={defaults}
            progressionMode={progressionMode}
            onAddGroup={addGroup}
            onRemoveGroup={removeGroup}
            onUpdateGroupName={updateGroupName}
            onAddExercise={addExerciseToGroup}
            onRemoveExercise={removeExerciseFromGroup}
            onUpdateAssignment={updateAssignment}
          />
        )}

        {currentStep === 'progression' && progressionMode === 'simple' && (
          <ProgressionStep
            groups={groups}
            exerciseMap={exerciseMap}
            onUpdateProgression={updateAssignment}
          />
        )}

        {currentStep === 'goals' && (
          <GoalsStep
            progressionMode={progressionMode}
            weeklySetGoals={weeklySetGoals}
            setWeeklySetGoals={setWeeklySetGoals}
            groups={groups}
            groupRotation={groupRotation}
            setGroupRotation={setGroupRotation}
            rfemRotation={rfemRotation}
            setRfemRotation={setRfemRotation}
            conditioningWeeklyRepIncrement={conditioningWeeklyRepIncrement}
            setConditioningWeeklyRepIncrement={setConditioningWeeklyRepIncrement}
            workoutDaysPerWeek={workoutDaysPerWeek}
            includeWarmupSets={includeWarmupSets}
            setIncludeWarmupSets={setIncludeWarmupSets}
            includeTimedWarmups={includeTimedWarmups}
            setIncludeTimedWarmups={setIncludeTimedWarmups}
          />
        )}

        {currentStep === 'review' && (
          <ReviewStep
            progressionMode={progressionMode}
            name={name}
            numberOfWeeks={numberOfWeeks}
            workoutDaysPerWeek={workoutDaysPerWeek}
            groups={groups}
            exerciseMap={exerciseMap}
            weeklySetGoals={weeklySetGoals}
            groupRotation={groupRotation}
            rfemRotation={rfemRotation}
            includeWarmupSets={includeWarmupSets}
            includeTimedWarmups={includeTimedWarmups}
            validation={validation}
          />
        )}
      </div>

      {/* Navigation - hide on start step (it has its own buttons) */}
      {currentStep !== 'start' && (
        <WizardNavigation
          currentStep={currentStep}
          canProceed={canProceed()}
          isCreating={isCreating}
          isEditing={!!editCycle}
          onBack={
            currentStep === 'schedule_mode' && !editCycle
              ? initialProgressionMode
                ? onCancel // Exit wizard if came from cycle type selector
                : () => setCurrentStep('start') // Go to start step if started fresh
              : prevStep
          }
          onNext={nextStep}
          onCancel={onCancel}
          onSubmit={handleCreate}
        />
      )}

      {/* Edit Mode Choice Modal */}
      <EditModeModal
        isOpen={showEditModeChoice}
        completedCount={cycleProgress?.passed || 0}
        onContinue={() => {
          setEditMode('continue');
          setShowEditModeChoice(false);
          handleCreate();
        }}
        onRestart={() => {
          setEditMode('restart');
          setShowEditModeChoice(false);
          handleCreate();
        }}
        onClose={() => setShowEditModeChoice(false)}
      />
    </div>
  );
}
