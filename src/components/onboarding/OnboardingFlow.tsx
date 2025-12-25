import { useState } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Target, 
  TrendingUp, 
  Calendar, 
  Dumbbell,
  CheckCircle,
  Mountain,
  Sparkles
} from 'lucide-react';
import { Button } from '../ui';
import { ExerciseRepo, MaxRecordRepo } from '../../data/repositories';
import { EXERCISE_TYPE_LABELS, type ExerciseType, type ExerciseMode } from '../../types';

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

const SLIDES = [
  {
    id: 'welcome',
    icon: Mountain,
    title: 'Welcome to Ascend',
    description: 'Your personal progressive calisthenics coach. Track your workouts, follow RFEM-based programming, and watch your strength grow.',
    gradient: 'from-indigo-500 to-cyan-500',
  },
  {
    id: 'rfem',
    icon: Target,
    title: 'RFEM Training',
    description: 'Reps From Established Max (RFEM) is your secret weapon. Instead of grinding to failure every set, you\'ll train at strategic rep targets below your max—building strength while managing fatigue.',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    id: 'progress',
    icon: TrendingUp,
    title: 'Progressive Overload',
    description: 'Set new personal records and Ascend automatically adjusts your workout targets. Your training evolves as you get stronger.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    id: 'cycles',
    icon: Calendar,
    title: 'Training Cycles',
    description: 'Plan multi-week training cycles with automatic scheduling. Group exercises, rotate through different RFEM intensities, and never wonder what to do next.',
    gradient: 'from-purple-500 to-pink-500',
  },
];

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showExerciseCreation, setShowExerciseCreation] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [exerciseCreated, setExerciseCreated] = useState(false);
  
  // Exercise form state
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseType, setExerciseType] = useState<ExerciseType>('push');
  const [exerciseMode, setExerciseMode] = useState<ExerciseMode>('standard');
  const [initialMax, setInitialMax] = useState('');

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
    } else {
      setCurrentSlide(prev => Math.max(0, prev - 1));
    }
  };

  const handleCreateExercise = async () => {
    if (!exerciseName.trim()) return;
    
    setIsCreating(true);
    try {
      // Create the exercise
      const exercise = await ExerciseRepo.create({
        name: exerciseName.trim(),
        type: exerciseType,
        mode: exerciseMode,
        notes: '',
        customParameters: [],
        weightEnabled: false,
      });

      // If they provided an initial max, record it
      if (initialMax && exerciseMode === 'standard') {
        const maxReps = parseInt(initialMax, 10);
        if (!isNaN(maxReps) && maxReps > 0) {
          await MaxRecordRepo.create(
            exercise.id,
            maxReps,
            'Initial max during onboarding'
          );
        }
      }

      setExerciseCreated(true);
      
      // Show success briefly then complete
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error('Failed to create exercise:', error);
      setIsCreating(false);
    }
  };

  // Success screen after exercise creation
  if (exerciseCreated) {
    return (
      <div className="fixed inset-0 bg-gray-50 dark:bg-[#121212] flex flex-col items-center justify-center p-6 z-50">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-bounce">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            You're all set!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {exerciseName} has been added. Time to start training!
          </p>
        </div>
      </div>
    );
  }

  // Exercise creation screen
  if (showExerciseCreation) {
    return (
      <div className="fixed inset-0 bg-gray-50 dark:bg-[#121212] flex flex-col z-50 safe-area-top safe-area-bottom">
        {/* Header */}
        <div className="px-4 py-4 flex items-center justify-between border-b border-gray-200 dark:border-[#2D2D4A]">
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
            {/* Encouragement */}
            <div className="flex items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
              <Dumbbell className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0" />
              <p className="text-sm text-primary-700 dark:text-primary-300">
                Start with your favorite exercise—the one you're most excited to track.
              </p>
            </div>

            {/* Exercise Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exercise Name
              </label>
              <input
                type="text"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                placeholder="e.g., Pull-ups, Push-ups, Squats"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-[#2D2D4A] bg-white dark:bg-[#1A1A2E] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                autoFocus
              />
            </div>

            {/* Exercise Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Movement Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['push', 'pull', 'legs', 'core'] as ExerciseType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setExerciseType(type)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      exerciseType === type
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-[#1A1A2E] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#252542]'
                    }`}
                  >
                    {EXERCISE_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercise Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Training Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExerciseMode('standard')}
                  className={`p-4 rounded-xl border-2 text-left transition-colors ${
                    exerciseMode === 'standard'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-[#2D2D4A] hover:border-gray-300 dark:hover:border-[#3D3D5A]'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">Standard</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    RFEM-based progression
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setExerciseMode('conditioning')}
                  className={`p-4 rounded-xl border-2 text-left transition-colors ${
                    exerciseMode === 'conditioning'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-[#2D2D4A] hover:border-gray-300 dark:hover:border-[#3D3D5A]'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">Conditioning</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Weekly rep increases
                  </div>
                </button>
              </div>
            </div>

            {/* Initial Max (only for standard mode) */}
            {exerciseMode === 'standard' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Max Reps <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={initialMax}
                  onChange={(e) => setInitialMax(e.target.value)}
                  placeholder="Your best set without stopping"
                  min="1"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-[#2D2D4A] bg-white dark:bg-[#1A1A2E] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  If you're not sure, you can set this later after testing.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer with CTA */}
        <div className="px-4 py-4 border-t border-gray-200 dark:border-[#2D2D4A]">
          <Button
            onClick={handleCreateExercise}
            disabled={!exerciseName.trim() || isCreating}
            className="w-full py-3 text-base font-medium"
          >
            {isCreating ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                Create & Start Training
              </span>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Intro slides
  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-[#121212] flex flex-col z-50 safe-area-top safe-area-bottom">
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
        <div className={`w-24 h-24 mb-8 rounded-3xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="w-12 h-12 text-white" />
        </div>

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
          <Button
            variant="secondary"
            onClick={handlePrev}
            className="px-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <Button
          onClick={handleNext}
          className="flex-1 py-3 text-base font-medium"
        >
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
