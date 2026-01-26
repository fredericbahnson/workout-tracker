/**
 * FirstExerciseSlide Component
 *
 * Streamlined exercise creation with suggestion chips.
 * Simplified form compared to the full ExerciseForm.
 */

import { useState, useEffect } from 'react';
import { Dumbbell, ArrowRight } from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';
import { ExerciseSuggestionChips, type ExerciseSuggestion } from '../visuals';
import { EXERCISE_TYPES, EXERCISE_TYPE_LABELS } from '@/types';

export interface FirstExerciseData {
  name: string;
  type: string;
}

interface FirstExerciseSlideProps {
  onNext: (data: FirstExerciseData) => void;
}

export function FirstExerciseSlide({ onNext }: FirstExerciseSlideProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('push');

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSuggestionSelect = (suggestion: ExerciseSuggestion) => {
    setName(suggestion.name);
    setType(suggestion.type);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onNext({ name: name.trim(), type });
  };

  const typeOptions = EXERCISE_TYPES.map(t => ({
    value: t,
    label: EXERCISE_TYPE_LABELS[t],
  }));

  return (
    <div
      className={`
        flex flex-col h-full transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-sm mx-auto pb-48">
          {/* Icon */}
          <div
            className={`
              w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500
              flex items-center justify-center shadow-lg
              transition-transform duration-500 delay-100
              ${isVisible ? 'scale-100' : 'scale-90'}
            `}
          >
            <Dumbbell className="w-10 h-10 text-white" />
          </div>

          {/* Headline */}
          <h2
            className={`
              text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2
              transition-all duration-500 delay-150
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
            `}
          >
            Create Your First Exercise
          </h2>

          <p
            className={`
              text-gray-600 dark:text-gray-400 text-center mb-6
              transition-all duration-500 delay-200
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
            `}
          >
            Start with the exercise you're most excited to track
          </p>

          {/* Form */}
          <div
            className={`
              space-y-6
              transition-all duration-500 delay-300
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            {/* Suggestion chips */}
            <ExerciseSuggestionChips selectedExercise={name} onSelect={handleSuggestionSelect} />

            {/* Exercise name input */}
            <Input
              label="Exercise Name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Or type your own..."
            />

            {/* Type selector */}
            <Select
              label="Exercise Type"
              value={type}
              onChange={e => setType(e.target.value)}
              options={typeOptions}
            />

            {/* Helpful note */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              You can add more exercises and customize details later
            </p>
          </div>
        </div>
      </div>

      {/* Action button - fixed at bottom */}
      <div
        className={`
          px-6 pb-6 pt-4
          transition-all duration-500 delay-400
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
      >
        <Button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="w-full py-3 text-base font-medium"
        >
          Continue
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
