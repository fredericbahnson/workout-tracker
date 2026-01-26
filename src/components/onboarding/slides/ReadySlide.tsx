/**
 * ReadySlide Component
 *
 * Success summary with clear next-step options.
 * Final slide of the quick start phase.
 */

import { useState, useEffect } from 'react';
import { CheckCircle, Plus, Calendar, Play, BookOpen } from 'lucide-react';

export type NextAction = 'add-more' | 'create-cycle' | 'start-training' | 'learn-rfem';

interface ReadySlideProps {
  exerciseName: string;
  maxReps: number | null;
  onSelectAction: (action: NextAction) => void;
}

export function ReadySlide({ exerciseName, maxReps, onSelectAction }: ReadySlideProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const nextActions = [
    {
      id: 'add-more' as NextAction,
      icon: <Plus className="w-5 h-5" />,
      title: 'Add More Exercises',
      description: 'Build your exercise library',
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      id: 'create-cycle' as NextAction,
      icon: <Calendar className="w-5 h-5" />,
      title: 'Create a Training Cycle',
      description: 'Set up scheduled workouts',
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      id: 'start-training' as NextAction,
      icon: <Play className="w-5 h-5" />,
      title: 'Start Training Now',
      description: 'Log an ad-hoc workout',
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      recommended: true,
    },
    {
      id: 'learn-rfem' as NextAction,
      icon: <BookOpen className="w-5 h-5" />,
      title: 'Learn About RFEM',
      description: 'Understand the progression system',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
  ];

  return (
    <div
      className={`
        flex flex-col h-full transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-sm mx-auto text-center">
          {/* Success icon */}
          <div
            className={`
              w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30
              flex items-center justify-center
              transition-transform duration-500 delay-100
              ${isVisible ? 'scale-100' : 'scale-90'}
            `}
          >
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>

          {/* Headline */}
          <h2
            className={`
              text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2
              transition-all duration-500 delay-150
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
            `}
          >
            You're All Set!
          </h2>

          {/* Summary */}
          <div
            className={`
              bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6
              transition-all duration-500 delay-200
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
            `}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-gray-100">{exerciseName}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {maxReps ? `Max: ${maxReps} reps` : 'Max not set yet'}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>

          {/* What's next */}
          <p
            className={`
              text-gray-600 dark:text-gray-400 mb-6
              transition-all duration-500 delay-300
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
            `}
          >
            What would you like to do next?
          </p>

          {/* Action options */}
          <div
            className={`
              space-y-3
              transition-all duration-500 delay-400
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            {nextActions.map(action => (
              <button
                key={action.id}
                onClick={() => onSelectAction(action.id)}
                className={`
                  w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all
                  ${
                    action.recommended
                      ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/10 hover:border-primary-400 dark:hover:border-primary-600'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <div className={`p-2 rounded-lg ${action.bgColor}`}>
                  <span className={action.color}>{action.icon}</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {action.title}
                    </span>
                    {action.recommended && (
                      <span className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 px-1.5 py-0.5 rounded">
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {action.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
