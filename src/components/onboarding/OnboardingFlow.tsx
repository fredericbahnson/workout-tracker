/**
 * OnboardingFlow Component
 *
 * Orchestrates the complete onboarding experience with the new flow:
 *
 * Phase 1: Identity & Value (2 slides)
 *   - IdentitySlide: Calisthenics identity hook
 *   - ValuePropositionSlide: Key differentiators, trial mention
 *
 * Phase 2: Experience Preview (2 slides)
 *   - DayInLifeSlide: What a typical day looks like
 *   - SwipeDemoSlide: Interactive swipe practice (must complete)
 *
 * Phase 3: Quick Start (3 slides)
 *   - FirstExerciseSlide: Create first exercise with suggestion chips
 *   - RecordMaxSlide: Establish baseline (optional)
 *   - ReadySlide: Success with next-step options
 *
 * Phase 4: RFEM Deep Dive (optional, accessible from Ready slide or Settings)
 *   - Condensed RFEMGuide (3 slides)
 *
 * Total: 7 required slides + 3 optional RFEM slides
 */

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';
import { ExerciseRepo, MaxRecordRepo } from '@/data/repositories';
import { createScopedLogger } from '@/utils/logger';
import { useAppStore } from '@/stores/appStore';
import { OnboardingProgress } from './OnboardingProgress';
import { RFEMGuide, RFEM_GUIDE_SLIDES } from './RFEMGuide';
import { AppTour, APP_TOUR_SLIDES } from './AppTour';
import {
  IdentitySlide,
  ValuePropositionSlide,
  DayInLifeSlide,
  SwipeCompleteSlide,
  SwipeSkipSlide,
  TapToEditSlide,
  FirstExerciseSlide,
  RecordMaxSlide,
  ExerciseSuccessSlide,
  type FirstExerciseData,
} from './slides';

const log = createScopedLogger('Onboarding');

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

// Phase definitions
type OnboardingPhase =
  | 'identity'
  | 'value'
  | 'day-in-life'
  | 'swipe-complete'
  | 'swipe-skip'
  | 'tap-to-edit'
  | 'first-exercise'
  | 'record-max'
  | 'ready'
  | 'app-tour'
  | 'rfem-deep-dive';

// Slides in the main flow (excluding RFEM deep dive)
// 9 initial slides + 4 app tour slides = 13
const MAIN_FLOW_SLIDES = 9 + APP_TOUR_SLIDES;
const TOTAL_SLIDES_WITH_RFEM = MAIN_FLOW_SLIDES + RFEM_GUIDE_SLIDES;

// Get slide index for progress indicator
function getSlideIndex(
  phase: OnboardingPhase,
  appTourSlide: number = 0,
  rfemSlide: number = 0
): number {
  switch (phase) {
    case 'identity':
      return 0;
    case 'value':
      return 1;
    case 'day-in-life':
      return 2;
    case 'swipe-complete':
      return 3;
    case 'swipe-skip':
      return 4;
    case 'tap-to-edit':
      return 5;
    case 'first-exercise':
      return 6;
    case 'record-max':
      return 7;
    case 'ready':
      return 8;
    case 'app-tour':
      return 9 + appTourSlide;
    case 'rfem-deep-dive':
      return MAIN_FLOW_SLIDES + rfemSlide;
    default:
      return 0;
  }
}

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [phase, setPhase] = useState<OnboardingPhase>('identity');
  const [showRFEM, setShowRFEM] = useState(false);

  // Exercise creation state
  const [exerciseData, setExerciseData] = useState<FirstExerciseData | null>(null);
  const [maxReps, setMaxReps] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Milestone tracking
  const setOnboardingMilestone = useAppStore(state => state.setOnboardingMilestone);

  // Phase navigation
  const handleIdentityComplete = () => {
    setOnboardingMilestone('identityShown', true);
    setPhase('value');
  };

  const handleValueComplete = () => {
    setPhase('day-in-life');
  };

  const handleDayInLifeComplete = () => {
    setPhase('swipe-complete');
  };

  const handleSwipeCompleteComplete = () => {
    setPhase('swipe-skip');
  };

  const handleSwipeSkipComplete = () => {
    setPhase('tap-to-edit');
  };

  const handleTapToEditComplete = () => {
    setOnboardingMilestone('swipeDemoPracticed', true);
    setPhase('first-exercise');
  };

  const handleFirstExerciseComplete = (data: FirstExerciseData) => {
    setExerciseData(data);
    setPhase('record-max');
  };

  const handleRecordMaxComplete = async (reps: number | null) => {
    setMaxReps(reps);
    setIsCreating(true);

    try {
      if (!exerciseData) {
        throw new Error('Exercise data not found');
      }

      log.debug('Creating exercise:', exerciseData.name);

      // Create the exercise
      const exercise = await ExerciseRepo.create({
        name: exerciseData.name,
        type: exerciseData.type as 'push' | 'pull' | 'legs' | 'core' | 'other',
        mode: 'standard',
        measurementType: 'reps',
        notes: '',
        customParameters: [],
      });

      log.debug('Exercise created:', exercise.id);
      setOnboardingMilestone('firstExerciseCreated', true);

      // Create initial max record if provided
      if (reps && reps > 0) {
        await MaxRecordRepo.create(exercise.id, reps, undefined, 'Initial max during onboarding');
        log.debug('Initial max recorded:', reps);
        setOnboardingMilestone('firstMaxRecorded', true);
      }

      setPhase('ready');
    } catch (err) {
      log.error(err as Error);
      // Still proceed to ready screen even on error
      setPhase('ready');
    } finally {
      setIsCreating(false);
    }
  };

  const handleExerciseSuccessContinue = () => {
    setPhase('app-tour');
  };

  const handleAppTourComplete = () => {
    onComplete();
  };

  const handleRFEMComplete = () => {
    setOnboardingMilestone('rfemDeepDiveSeen', true);
    onComplete();
  };

  const handleBack = () => {
    switch (phase) {
      case 'value':
        setPhase('identity');
        break;
      case 'day-in-life':
        setPhase('value');
        break;
      case 'swipe-complete':
        setPhase('day-in-life');
        break;
      case 'swipe-skip':
        setPhase('swipe-complete');
        break;
      case 'tap-to-edit':
        setPhase('swipe-skip');
        break;
      case 'first-exercise':
        setPhase('tap-to-edit');
        break;
      case 'record-max':
        setPhase('first-exercise');
        break;
      case 'ready':
        setPhase('record-max');
        break;
      case 'app-tour':
        setPhase('ready');
        break;
      case 'rfem-deep-dive':
        setShowRFEM(false);
        setPhase('app-tour');
        break;
      default:
        break;
    }
  };

  // Calculate progress
  const totalSteps = showRFEM ? TOTAL_SLIDES_WITH_RFEM : MAIN_FLOW_SLIDES;
  const currentStep = getSlideIndex(phase);

  // Render App Tour
  if (phase === 'app-tour') {
    return (
      <AppTour
        onComplete={handleAppTourComplete}
        onBack={() => setPhase('ready')}
        onLearnRFEM={() => {
          setShowRFEM(true);
          setPhase('rfem-deep-dive');
        }}
        showProgress={true}
        showSkip={true}
        onSkip={onComplete}
        standalone={false}
      />
    );
  }

  // Render RFEM deep dive
  if (phase === 'rfem-deep-dive') {
    return (
      <RFEMGuide
        onComplete={handleRFEMComplete}
        onBack={handleBack}
        showProgress={true}
        showSkip={true}
        onSkip={onComplete}
        standalone={false}
      />
    );
  }

  // Main onboarding phases
  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-dark-bg flex flex-col z-50 safe-area-top safe-area-bottom">
      {/* Progress indicator */}
      <OnboardingProgress
        totalSteps={totalSteps}
        currentStep={currentStep}
        moduleBreaks={[2, 6]} // After Value, after gesture demos
        onSkip={onSkip}
        showSkip={phase !== 'identity'} // No skip on welcome/identity
      />

      {/* Back button (when applicable) */}
      {phase !== 'identity' && (
        <div className="absolute top-6 left-4 z-10">
          <Button variant="ghost" size="sm" onClick={handleBack} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* All slides in scroll container - matches SwipeableSetCard's working environment */}
      <div className="flex-1 overflow-y-auto" key={phase}>
        {phase === 'identity' && <IdentitySlide onNext={handleIdentityComplete} />}

        {phase === 'value' && <ValuePropositionSlide onNext={handleValueComplete} />}

        {phase === 'day-in-life' && <DayInLifeSlide onNext={handleDayInLifeComplete} />}

        {phase === 'swipe-complete' && (
          <SwipeCompleteSlide onComplete={handleSwipeCompleteComplete} />
        )}

        {phase === 'swipe-skip' && <SwipeSkipSlide onComplete={handleSwipeSkipComplete} />}

        {phase === 'tap-to-edit' && <TapToEditSlide onComplete={handleTapToEditComplete} />}

        {phase === 'first-exercise' && <FirstExerciseSlide onNext={handleFirstExerciseComplete} />}

        {phase === 'record-max' && exerciseData && (
          <RecordMaxSlide exerciseName={exerciseData.name} onNext={handleRecordMaxComplete} />
        )}

        {phase === 'ready' && exerciseData && (
          <ExerciseSuccessSlide
            exerciseName={exerciseData.name}
            maxReps={maxReps}
            onContinue={handleExerciseSuccessContinue}
          />
        )}
      </div>

      {/* Loading overlay */}
      {isCreating && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Creating exercise...</p>
          </div>
        </div>
      )}
    </div>
  );
}
