/**
 * OnboardingFlow Component
 *
 * Orchestrates the complete onboarding experience:
 * 1. Welcome slide
 * 2. RFEM Guide module (5 slides)
 * 3. App Tour module (4 slides)
 * 4. Exercise creation step
 *
 * Total: 11 slides including welcome and exercise creation
 */

import { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Plus,
  Home,
  AlertCircle,
  Dumbbell,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { ExerciseForm } from '@/components/exercises';
import { ExerciseRepo, MaxRecordRepo } from '@/data/repositories';
import { createScopedLogger } from '@/utils/logger';
import type { ExerciseFormData } from '@/types';
import { OnboardingSlide } from './OnboardingSlide';
import { OnboardingProgress } from './OnboardingProgress';
import { RFEMGuide, RFEM_GUIDE_SLIDES } from './RFEMGuide';
import { AppTour, APP_TOUR_SLIDES } from './AppTour';

const log = createScopedLogger('Onboarding');

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

// Module definitions for progress tracking
const MODULES = {
  WELCOME: 1,
  RFEM: RFEM_GUIDE_SLIDES,
  TOUR: APP_TOUR_SLIDES,
  EXERCISE: 1,
};

const TOTAL_STEPS = MODULES.WELCOME + MODULES.RFEM + MODULES.TOUR + MODULES.EXERCISE;

// Module break points (indices where new modules start)
const MODULE_BREAKS = [
  MODULES.WELCOME, // After welcome
  MODULES.WELCOME + MODULES.RFEM, // After RFEM
  MODULES.WELCOME + MODULES.RFEM + MODULES.TOUR, // After Tour
];

type OnboardingPhase = 'welcome' | 'rfem' | 'tour' | 'exercise' | 'success';

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [phase, setPhase] = useState<OnboardingPhase>('welcome');
  const [currentStep, setCurrentStep] = useState(0);

  // Exercise creation state
  const [isCreating, setIsCreating] = useState(false);
  const [createdExerciseName, setCreatedExerciseName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Calculate overall progress step
  const getOverallStep = () => {
    switch (phase) {
      case 'welcome':
        return 0;
      case 'rfem':
        return MODULES.WELCOME + currentStep;
      case 'tour':
        return MODULES.WELCOME + MODULES.RFEM + currentStep;
      case 'exercise':
      case 'success':
        return MODULES.WELCOME + MODULES.RFEM + MODULES.TOUR;
      default:
        return 0;
    }
  };

  // Phase navigation
  const handleWelcomeComplete = () => {
    setPhase('rfem');
    setCurrentStep(0);
  };

  const handleRFEMComplete = () => {
    setPhase('tour');
    setCurrentStep(0);
  };

  const handleTourComplete = () => {
    setPhase('exercise');
    setCurrentStep(0);
  };

  const handleBackFromRFEM = () => {
    setPhase('welcome');
    setCurrentStep(0);
  };

  const handleBackFromTour = () => {
    setPhase('rfem');
    setCurrentStep(RFEM_GUIDE_SLIDES - 1);
  };

  // Exercise creation handlers
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

      const exercise = await ExerciseRepo.create(exerciseToCreate);
      log.debug('Exercise created:', exercise.id);

      // Create initial max record if provided (standard exercises)
      if (exerciseData.measurementType === 'reps' && initialMax && initialMax > 0) {
        await MaxRecordRepo.create(
          exercise.id,
          initialMax,
          undefined,
          'Initial max during onboarding'
        );
        log.debug('Initial max reps recorded:', initialMax);
      } else if (exerciseData.measurementType === 'time' && initialMaxTime && initialMaxTime > 0) {
        await MaxRecordRepo.create(
          exercise.id,
          undefined,
          initialMaxTime,
          'Initial max during onboarding'
        );
        log.debug('Initial max time recorded:', initialMaxTime);
      }

      setCreatedExerciseName(data.name);
      setPhase('success');
      setIsCreating(false);
    } catch (err) {
      log.error(err as Error);
      setError(err instanceof Error ? err.message : 'Failed to create exercise. Please try again.');
      setIsCreating(false);
    }
  };

  const handleAddAnother = () => {
    setError(null);
    setPhase('exercise');
  };

  const handleBackFromExercise = () => {
    setPhase('tour');
    setCurrentStep(APP_TOUR_SLIDES - 1);
  };

  // Render based on current phase
  switch (phase) {
    case 'welcome':
      return (
        <div className="fixed inset-0 bg-gray-50 dark:bg-dark-bg flex flex-col z-50 safe-area-top safe-area-bottom">
          <OnboardingProgress
            totalSteps={TOTAL_STEPS}
            currentStep={getOverallStep()}
            moduleBreaks={MODULE_BREAKS}
            onSkip={onSkip}
            showSkip={true}
          />
          <OnboardingSlide
            image="/pwa-192x192.png"
            headline="Welcome to Ascend"
            body={
              <div className="space-y-4">
                <p className="text-lg">Smart strength training that adapts to you.</p>
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <p>In the next 2 minutes, you'll learn:</p>
                  <ul className="text-left space-y-1 mt-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-0.5">•</span>
                      <span>A training approach used by elite athletes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-0.5">•</span>
                      <span>How Ascend automates your programming</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-0.5">•</span>
                      <span>Everything you need to start training</span>
                    </li>
                  </ul>
                </div>
              </div>
            }
            primaryAction={{
              label: "Let's Go",
              onClick: handleWelcomeComplete,
              icon: <ArrowRight className="w-5 h-5" />,
            }}
          />
        </div>
      );

    case 'rfem':
      return (
        <RFEMGuide
          onComplete={handleRFEMComplete}
          onBack={handleBackFromRFEM}
          showProgress={true}
          showSkip={true}
          onSkip={onSkip}
          standalone={false}
        />
      );

    case 'tour':
      return (
        <AppTour
          onComplete={handleTourComplete}
          onBack={handleBackFromTour}
          showProgress={true}
          showSkip={true}
          onSkip={onSkip}
          standalone={false}
        />
      );

    case 'exercise':
      return (
        <div className="fixed inset-0 bg-gray-50 dark:bg-dark-bg flex flex-col z-50 safe-area-top safe-area-bottom">
          {/* Header */}
          <div className="px-4 py-4 flex items-center justify-between border-b border-gray-200 dark:border-dark-border">
            <button
              onClick={handleBackFromExercise}
              className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Create Your First Exercise
            </h2>
            <button
              onClick={onSkip}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Skip
            </button>
          </div>

          {/* Form content */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-sm mx-auto space-y-6">
              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Encouragement */}
              <div className="flex items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                <Dumbbell className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                <p className="text-sm text-primary-700 dark:text-primary-300">
                  Start with your favorite exercise—the one you're most excited to track.
                </p>
              </div>

              {/* Use the full ExerciseForm component */}
              <ExerciseForm
                onSubmit={handleCreateExercise}
                onCancel={onSkip}
                isLoading={isCreating}
              />
            </div>
          </div>
        </div>
      );

    case 'success':
      return (
        <div className="fixed inset-0 bg-gray-50 dark:bg-dark-bg flex flex-col items-center justify-center p-6 z-50 safe-area-top safe-area-bottom">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {createdExerciseName} Added!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Your first exercise is ready. You can:
            </p>

            <div className="space-y-2 text-left mb-8">
              <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="text-primary-500 font-bold">•</span>
                <span>
                  <strong className="text-gray-900 dark:text-gray-100">Add more exercises</strong>{' '}
                  to build your library
                </span>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="text-primary-500 font-bold">•</span>
                <span>
                  <strong className="text-gray-900 dark:text-gray-100">
                    Create a training cycle
                  </strong>{' '}
                  to start scheduled workouts
                </span>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="text-primary-500 font-bold">•</span>
                <span>
                  <strong className="text-gray-900 dark:text-gray-100">
                    Log an ad-hoc workout now
                  </strong>{' '}
                  on the Today page
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={handleAddAnother} variant="secondary" className="w-full py-3">
                <Plus className="w-5 h-5 mr-2" />
                Add Another Exercise
              </Button>

              <Button onClick={onComplete} className="w-full py-3">
                <Home className="w-5 h-5 mr-2" />
                Start Using Ascend
              </Button>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
