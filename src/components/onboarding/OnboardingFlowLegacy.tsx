import { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Target,
  TrendingUp,
  Calendar,
  Dumbbell,
  CheckCircle,
  Plus,
  Home,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { ExerciseForm } from '@/components/exercises';
import { ExerciseRepo, MaxRecordRepo } from '@/data/repositories';
import { createScopedLogger } from '@/utils/logger';
import type { ExerciseFormData } from '@/types';

const log = createScopedLogger('Onboarding');

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

const SLIDES = [
  {
    id: 'welcome',
    icon: null, // Use app icon image instead
    title: 'Welcome to Ascend',
    description:
      'Your personal progressive fitness coach. Track your workouts, follow RFEM-based programming, and watch your strength grow.',
    gradient: 'from-indigo-500 to-cyan-500',
    useAppIcon: true,
  },
  {
    id: 'rfem',
    icon: Target,
    title: 'RFEM Training',
    description:
      "Reps From Established Max (RFEM) is your secret weapon. Instead of grinding to failure every set, you'll train at strategic rep targets below your max—building strength while managing fatigue.",
    gradient: 'from-orange-500 to-red-500',
  },
  {
    id: 'progress',
    icon: TrendingUp,
    title: 'Progressive Overload',
    description:
      'Set new personal records and Ascend automatically adjusts your workout targets. Your training evolves as you get stronger.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    id: 'cycles',
    icon: Calendar,
    title: 'Training Cycles',
    description:
      'Plan multi-week training cycles with automatic scheduling. Group exercises, rotate through different RFEM intensities, and never wonder what to do next.',
    gradient: 'from-purple-500 to-pink-500',
  },
];

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showExerciseCreation, setShowExerciseCreation] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [exerciseCreated, setExerciseCreated] = useState(false);
  const [createdExerciseName, setCreatedExerciseName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isLastSlide = currentSlide === SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      setShowExerciseCreation(true);
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (showExerciseCreation) {
      setShowExerciseCreation(false);
      setError(null);
    } else {
      setCurrentSlide(prev => Math.max(0, prev - 1));
    }
  };

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
      setExerciseCreated(true);
      setIsCreating(false);
    } catch (err) {
      log.error(err as Error);
      setError(err instanceof Error ? err.message : 'Failed to create exercise. Please try again.');
      setIsCreating(false);
    }
  };

  const handleAddAnother = () => {
    setError(null);
    setExerciseCreated(false);
  };

  // Success screen after exercise creation
  if (exerciseCreated) {
    return (
      <div className="fixed inset-0 bg-gray-50 dark:bg-dark-bg flex flex-col items-center justify-center p-6 z-50">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Exercise Created!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {createdExerciseName} has been added to your exercises.
          </p>

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
  }

  // Exercise creation screen
  if (showExerciseCreation) {
    return (
      <div className="fixed inset-0 bg-gray-50 dark:bg-dark-bg flex flex-col z-50 safe-area-top safe-area-bottom">
        {/* Header */}
        <div className="px-4 py-4 flex items-center justify-between border-b border-gray-200 dark:border-dark-border">
          <button
            onClick={handlePrev}
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
  }

  // Intro slides
  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-dark-bg flex flex-col z-50 safe-area-top safe-area-bottom">
      {/* Progress dots */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex gap-2">
          {SLIDES.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-6 bg-primary-500'
                  : index < currentSlide
                    ? 'w-1.5 bg-primary-300 dark:bg-primary-700'
                    : 'w-1.5 bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
        <button
          onClick={onSkip}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        {/* Icon */}
        {'useAppIcon' in slide && slide.useAppIcon ? (
          <img
            src="/pwa-192x192.png"
            alt="Ascend"
            className="w-24 h-24 mb-8 rounded-3xl shadow-lg"
          />
        ) : Icon ? (
          <div
            className={`w-24 h-24 mb-8 rounded-3xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center shadow-lg`}
          >
            <Icon className="w-12 h-12 text-white" />
          </div>
        ) : null}

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-4">
          {slide.title}
        </h2>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 text-center text-lg leading-relaxed max-w-sm">
          {slide.description}
        </p>
      </div>

      {/* Navigation */}
      <div className="px-6 py-6 flex gap-3">
        {currentSlide > 0 && (
          <Button variant="secondary" onClick={handlePrev} className="px-4">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <Button onClick={handleNext} className="flex-1 py-3 text-base font-medium">
          {isLastSlide ? (
            <>
              Create Your First Exercise
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          ) : (
            <>
              Next
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
