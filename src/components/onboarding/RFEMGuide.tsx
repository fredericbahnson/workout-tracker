/**
 * RFEMGuide Component
 *
 * Comprehensive explanation of RFEM training methodology.
 * Can be used standalone (from Settings) or as part of onboarding flow.
 */

import { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Target,
  TrendingUp,
  Repeat,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { OnboardingSlide } from './OnboardingSlide';
import { OnboardingProgress } from './OnboardingProgress';
import { RFEMCalculator, ProgressComparisonChart, RFEMWaveAnimation } from './visuals';

interface RFEMGuideProps {
  onComplete: () => void;
  onBack?: () => void;
  showProgress?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
  /** Start at a specific slide (0-indexed) */
  initialSlide?: number;
  /** Whether this is standalone mode (from Settings) */
  standalone?: boolean;
}

const TOTAL_SLIDES = 5;

export function RFEMGuide({
  onComplete,
  onBack,
  showProgress = true,
  showSkip = false,
  onSkip,
  initialSlide = 0,
  standalone = false,
}: RFEMGuideProps) {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);

  const handleNext = () => {
    if (currentSlide >= TOTAL_SLIDES - 1) {
      onComplete();
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide === 0) {
      onBack?.();
    } else {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const isFirstSlide = currentSlide === 0;

  // Slide content
  const renderSlideContent = () => {
    switch (currentSlide) {
      case 0:
        return (
          <OnboardingSlide
            icon={<AlertTriangle className="w-10 h-10" />}
            headline="What If You Could Get Stronger... Without Burning Out?"
            variant="rfem"
            gradient="from-orange-500 to-red-500"
            body={
              <div className="space-y-3">
                <p>Most people train to failure every set. It feels productive, but it actually:</p>
                <ul className="text-left space-y-1.5 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Creates excessive fatigue that hurts next session</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Increases injury risk as form breaks down</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>Makes progress unpredictable</span>
                  </li>
                </ul>
                <p className="text-emerald-600 dark:text-emerald-400 font-medium pt-2">
                  Elite athletes discovered something better.
                </p>
              </div>
            }
            primaryAction={{
              label: 'See the Solution',
              onClick: handleNext,
              icon: <ArrowRight className="w-5 h-5" />,
            }}
            secondaryAction={
              onBack && isFirstSlide ? { label: 'Back', onClick: handlePrev } : undefined
            }
          />
        );

      case 1:
        return (
          <OnboardingSlide
            icon={<Target className="w-10 h-10" />}
            headline="RFEM: Reps From Established Max"
            variant="rfem"
            body={
              <div className="space-y-4">
                <p>
                  Instead of grinding to failure, you train at strategic rep targets{' '}
                  <strong>below</strong> your max.
                </p>
                <RFEMCalculator initialMax={15} interactive={true} />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You're always working hard, but never destroying yourself.
                </p>
              </div>
            }
            primaryAction={{
              label: 'Why This Works',
              onClick: handleNext,
              icon: <ArrowRight className="w-5 h-5" />,
            }}
          />
        );

      case 2:
        return (
          <OnboardingSlide
            icon={<TrendingUp className="w-10 h-10" />}
            headline="More Volume, Better Recovery, Faster Progress"
            variant="rfem"
            body={
              <div className="space-y-4">
                <p>When you don't go to failure:</p>
                <ul className="text-left space-y-1.5 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span>
                      <strong>Recover faster</strong> — ready to train again sooner
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span>
                      <strong>Accumulate more volume</strong> — more total reps over time
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span>
                      <strong>Better technique</strong> — form stays clean when not exhausted
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span>
                      <strong>Sustainable progress</strong> — no burnout cycles
                    </span>
                  </li>
                </ul>
                <ProgressComparisonChart animate={true} />
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  Train more frequently and consistently — the real key to long-term gains.
                </p>
              </div>
            }
            primaryAction={{
              label: 'How Ascend Uses RFEM',
              onClick: handleNext,
              icon: <ArrowRight className="w-5 h-5" />,
            }}
          />
        );

      case 3:
        return (
          <OnboardingSlide
            icon={<Repeat className="w-10 h-10" />}
            headline="Automatic Intensity Waves"
            variant="rfem"
            body={
              <div className="space-y-4">
                <p>Ascend rotates your RFEM values from workout to workout:</p>
                <RFEMWaveAnimation animate={true} />
                <p className="text-sm">
                  This creates{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    natural periodization
                  </strong>{' '}
                  without you having to think about it.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You can use the app's built-in defaults, or customize the RFEM rotation values
                  yourself when creating a cycle.
                </p>
              </div>
            }
            primaryAction={{
              label: 'Other Training Styles',
              onClick: handleNext,
              icon: <ArrowRight className="w-5 h-5" />,
            }}
          />
        );

      case 4:
        return (
          <OnboardingSlide
            icon={<Layers className="w-10 h-10" />}
            headline="RFEM Is the Default, Not the Only Option"
            variant="rfem"
            gradient="from-purple-500 to-pink-500"
            body={
              <div className="space-y-4">
                <p>Ascend also supports:</p>
                <div className="space-y-3 text-left">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                      <span>🎯</span>
                      <span>Simple Progression</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Traditional approach: add reps or weight each session
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                      <span>🔀</span>
                      <span>Mixed Mode</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Use RFEM for some exercises, simple for others
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                      <span>🏃</span>
                      <span>Conditioning Mode</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Set a baseline and add reps each week (great for finishers)
                    </p>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  You're in control of how you want to train each exercise.
                </p>
              </div>
            }
            primaryAction={{
              label: standalone ? 'Done' : 'Explore the App',
              onClick: handleNext,
              icon: <ArrowRight className="w-5 h-5" />,
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-dark-bg flex flex-col z-50 safe-area-top safe-area-bottom">
      {/* Progress indicator */}
      {showProgress && (
        <OnboardingProgress
          totalSteps={TOTAL_SLIDES}
          currentStep={currentSlide}
          onSkip={onSkip}
          showSkip={showSkip}
        />
      )}

      {/* Navigation back button (when not first slide) */}
      {!isFirstSlide && (
        <div className="absolute top-6 left-4 z-10">
          <Button variant="ghost" size="sm" onClick={handlePrev} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Slide content */}
      <div className="flex-1 overflow-y-auto" key={currentSlide}>
        {renderSlideContent()}
      </div>
    </div>
  );
}

export { TOTAL_SLIDES as RFEM_GUIDE_SLIDES };
