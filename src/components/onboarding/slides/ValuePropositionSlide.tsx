/**
 * ValuePropositionSlide Component
 *
 * Second slide in the new onboarding flow.
 * Highlights key differentiators and mentions the free trial.
 */

import { ArrowRight, Zap, WifiOff, RefreshCw, Sparkles } from 'lucide-react';
import { OnboardingSlide } from '../OnboardingSlide';

interface ValuePropositionSlideProps {
  onNext: () => void;
}

export function ValuePropositionSlide({ onNext }: ValuePropositionSlideProps) {
  const features = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Intelligent Progression',
      description: 'Auto-calculated targets based on your performance',
      color: 'text-amber-500',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
      icon: <WifiOff className="w-5 h-5" />,
      title: 'Works Offline',
      description: 'Train anywhere without internet connection',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      icon: <RefreshCw className="w-5 h-5" />,
      title: 'Syncs Everywhere',
      description: 'Access your data on any device',
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
  ];

  return (
    <OnboardingSlide
      icon={<Sparkles className="w-10 h-10" />}
      headline="Train Smarter, Not Harder"
      variant="default"
      gradient="from-violet-500 to-purple-500"
      body={
        <div className="space-y-4">
          <p>Ascend handles the programming so you can focus on training.</p>

          {/* Feature cards */}
          <div className="space-y-2">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                  <span className={feature.color}>{feature.icon}</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {feature.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {feature.description}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trial badge */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                4-week free trial to get started
              </span>
            </div>
          </div>
        </div>
      }
      primaryAction={{
        label: 'See How It Works',
        onClick: onNext,
        icon: <ArrowRight className="w-5 h-5" />,
      }}
    />
  );
}
