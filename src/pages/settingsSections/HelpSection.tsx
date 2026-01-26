/**
 * HelpSection Component
 *
 * Redesigned Help & Guides with topic-based organization.
 *
 * Structure:
 * - Getting Started
 *   - Quick Start Guide
 *   - Try the Swipe Demo
 *   - Feature Tour
 * - Training Concepts
 *   - Understanding RFEM
 *   - How Cycles Work
 *   - Max Testing Explained
 * - About
 */

import { useState } from 'react';
import {
  Rocket,
  Hand,
  BookOpen,
  Calendar,
  Trophy,
  Smartphone,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { RFEMGuide, AppTour } from '@/components/onboarding';
import { SwipeDemo } from '@/components/onboarding/visuals';
import { CycleGuide, MaxTestingGuide, QuickStartGuide } from '@/components/help';
import { APP_VERSION } from '@/constants';

type GuideType =
  | 'quick-start'
  | 'swipe-demo'
  | 'rfem'
  | 'cycles'
  | 'max-testing'
  | 'app-tour'
  | null;

interface HelpItemProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  onClick: () => void;
}

function HelpItem({ icon, iconBg, title, description, onClick }: HelpItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        <div className="text-left">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{description}</div>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400" />
    </button>
  );
}

export function HelpSection() {
  const [activeGuide, setActiveGuide] = useState<GuideType>(null);
  const [showSwipeDemo, setShowSwipeDemo] = useState(false);

  const closeGuide = () => setActiveGuide(null);

  // Swipe Demo Modal
  if (showSwipeDemo) {
    return (
      <div className="fixed inset-0 bg-gray-50 dark:bg-dark-bg z-50 safe-area-top safe-area-bottom">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-4 py-4 flex items-center justify-between border-b border-gray-200 dark:border-dark-border">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Try the Swipe Demo</h2>
            <button
              onClick={() => setShowSwipeDemo(false)}
              className="text-sm text-primary-600 dark:text-primary-400 font-medium"
            >
              Done
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Hand className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Swipe to Complete
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-8 max-w-xs">
              Practice the swipe gesture you'll use during workouts
            </p>
            <div className="w-full max-w-sm">
              <SwipeDemo
                exercise="Push-ups"
                targetReps={12}
                onComplete={() => setShowSwipeDemo(false)}
                showHint={true}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Getting Started */}
      <Card>
        <CardContent className="space-y-1">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Getting Started
          </h3>

          <HelpItem
            icon={<Rocket className="w-4 h-4 text-primary-600 dark:text-primary-400" />}
            iconBg="bg-primary-100 dark:bg-primary-900/30"
            title="Quick Start Guide"
            description="Get up and running in minutes"
            onClick={() => setActiveGuide('quick-start')}
          />

          <HelpItem
            icon={<Hand className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
            iconBg="bg-cyan-100 dark:bg-cyan-900/30"
            title="Try the Swipe Demo"
            description="Practice the core gesture"
            onClick={() => setShowSwipeDemo(true)}
          />

          <HelpItem
            icon={<Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
            iconBg="bg-blue-100 dark:bg-blue-900/30"
            title="Feature Tour"
            description="Explore key features and navigation"
            onClick={() => setActiveGuide('app-tour')}
          />
        </CardContent>
      </Card>

      {/* Training Concepts */}
      <Card>
        <CardContent className="space-y-1">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Training Concepts
          </h3>

          <HelpItem
            icon={<BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
            title="Understanding RFEM"
            description="Learn the progression system"
            onClick={() => setActiveGuide('rfem')}
          />

          <HelpItem
            icon={<Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
            iconBg="bg-purple-100 dark:bg-purple-900/30"
            title="How Cycles Work"
            description="Structured training explained"
            onClick={() => setActiveGuide('cycles')}
          />

          <HelpItem
            icon={<Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
            iconBg="bg-amber-100 dark:bg-amber-900/30"
            title="Max Testing Explained"
            description="When and how to test PRs"
            onClick={() => setActiveGuide('max-testing')}
          />
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardContent>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Info className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">About</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ascend v{APP_VERSION}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Progressive calisthenics training
              </p>
              <a
                href="https://www.fredericbahnson.com/ascend"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                www.fredericbahnson.com/ascend
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guide Modals */}
      {activeGuide === 'quick-start' && (
        <QuickStartGuide
          onComplete={closeGuide}
          showProgress={true}
          showSkip={true}
          onSkip={closeGuide}
        />
      )}

      {activeGuide === 'rfem' && (
        <RFEMGuide
          onComplete={closeGuide}
          showProgress={true}
          showSkip={true}
          onSkip={closeGuide}
          standalone={true}
        />
      )}

      {activeGuide === 'cycles' && (
        <CycleGuide
          onComplete={closeGuide}
          showProgress={true}
          showSkip={true}
          onSkip={closeGuide}
        />
      )}

      {activeGuide === 'max-testing' && (
        <MaxTestingGuide
          onComplete={closeGuide}
          showProgress={true}
          showSkip={true}
          onSkip={closeGuide}
        />
      )}

      {activeGuide === 'app-tour' && (
        <AppTour
          onComplete={closeGuide}
          showProgress={true}
          showSkip={true}
          onSkip={closeGuide}
          standalone={true}
        />
      )}
    </>
  );
}
