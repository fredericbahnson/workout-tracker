/**
 * ExerciseSuggestionChips Component
 *
 * Quick selection chips for common bodyweight exercises.
 * Used in the onboarding flow to streamline first exercise creation.
 */

import { Check } from 'lucide-react';

export interface ExerciseSuggestion {
  name: string;
  type: 'push' | 'pull' | 'legs' | 'core';
}

const SUGGESTIONS: ExerciseSuggestion[] = [
  { name: 'Pull-ups', type: 'pull' },
  { name: 'Push-ups', type: 'push' },
  { name: 'Squats', type: 'legs' },
  { name: 'Dips', type: 'push' },
  { name: 'Rows', type: 'pull' },
  { name: 'Lunges', type: 'legs' },
];

interface ExerciseSuggestionChipsProps {
  selectedExercise: string | null;
  onSelect: (suggestion: ExerciseSuggestion) => void;
  className?: string;
}

export function ExerciseSuggestionChips({
  selectedExercise,
  onSelect,
  className = '',
}: ExerciseSuggestionChipsProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-sm text-gray-600 dark:text-gray-400">Quick select or type your own:</p>
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map(suggestion => {
          const isSelected = selectedExercise === suggestion.name;
          return (
            <button
              key={suggestion.name}
              type="button"
              onClick={() => onSelect(suggestion)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                transition-all duration-150
                ${
                  isSelected
                    ? 'bg-primary-500 text-white ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              {isSelected && <Check className="w-3.5 h-3.5" />}
              {suggestion.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { SUGGESTIONS as EXERCISE_SUGGESTIONS };
