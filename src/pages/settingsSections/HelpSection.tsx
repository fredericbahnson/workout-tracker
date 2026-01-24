import { useState } from 'react';
import { BookOpen, Smartphone, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { RFEMGuide, AppTour } from '@/components/onboarding';
import { APP_VERSION } from '@/constants';

export function HelpSection() {
  const [showRFEMGuide, setShowRFEMGuide] = useState(false);
  const [showAppTour, setShowAppTour] = useState(false);

  return (
    <>
      {/* Help & Guides */}
      <Card>
        <CardContent className="space-y-1">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Help & Guides
          </h3>

          <button
            onClick={() => setShowRFEMGuide(true)}
            className="w-full flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Learn About RFEM Training
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Understand the progression system
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => setShowAppTour(true)}
            className="w-full flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">App Tour</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Review key features and navigation
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardContent>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">About</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ascend v{APP_VERSION}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Progressive fitness training</p>
          <a
            href="https://www.fredericbahnson.com/ascend"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            www.fredericbahnson.com/ascend
          </a>
        </CardContent>
      </Card>

      {/* Help Guides */}
      {showRFEMGuide && (
        <RFEMGuide
          onComplete={() => setShowRFEMGuide(false)}
          showProgress={true}
          showSkip={true}
          onSkip={() => setShowRFEMGuide(false)}
          standalone={true}
        />
      )}

      {showAppTour && (
        <AppTour
          onComplete={() => setShowAppTour(false)}
          showProgress={true}
          showSkip={true}
          onSkip={() => setShowAppTour(false)}
          standalone={true}
        />
      )}
    </>
  );
}
