import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, X, Plus, Minus } from 'lucide-react';
import { Button } from '../ui';

interface RestTimerProps {
  initialSeconds: number;
  onDismiss: () => void;
  onComplete?: () => void;
}

export function RestTimer({ initialSeconds, onDismiss, onComplete }: RestTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play a beep sound using Web Audio API
  const playBeep = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = 880; // A5 note
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Audio might not be available, that's okay
      console.log('Audio not available');
    }
  }, []);

  useEffect(() => {
    if (isRunning && secondsRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            playBeep();
            onComplete?.();
            return 0;
          }
          // Play beep for last 3 seconds
          if (prev <= 4) {
            playBeep();
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, secondsRemaining, playBeep, onComplete]);

  const togglePause = () => {
    setIsRunning(!isRunning);
  };

  const reset = () => {
    setSecondsRemaining(initialSeconds);
    setIsRunning(true);
    setIsComplete(false);
  };

  const addTime = (seconds: number) => {
    setSecondsRemaining(prev => Math.max(0, prev + seconds));
    if (isComplete) {
      setIsComplete(false);
      setIsRunning(true);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = secondsRemaining / initialSeconds;

  return (
    <div className="flex flex-col items-center p-6 space-y-6">
      {/* Timer Display */}
      <div className="relative w-48 h-48">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={2 * Math.PI * 88}
            strokeDashoffset={2 * Math.PI * 88 * (1 - progress)}
            strokeLinecap="round"
            className={`transition-all duration-1000 ${
              isComplete 
                ? 'text-green-500' 
                : secondsRemaining <= 10 
                  ? 'text-orange-500' 
                  : 'text-primary-500'
            }`}
          />
        </svg>
        
        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-gym-2xl ${
            isComplete 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-gray-900 dark:text-gray-100'
          }`}>
            {isComplete ? 'Done!' : formatTime(secondsRemaining)}
          </span>
          {!isComplete && (
            <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isRunning ? 'Rest' : 'Paused'}
            </span>
          )}
        </div>
      </div>

      {/* Quick adjust buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => addTime(-15)}
          disabled={secondsRemaining < 15 && !isComplete}
          className="text-gray-500"
        >
          <Minus className="w-4 h-4 mr-1" />
          15s
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => addTime(15)}
          className="text-gray-500"
        >
          <Plus className="w-4 h-4 mr-1" />
          15s
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => addTime(30)}
          className="text-gray-500"
        >
          <Plus className="w-4 h-4 mr-1" />
          30s
        </Button>
      </div>

      {/* Control buttons */}
      <div className="flex items-center gap-3">
        {!isComplete && (
          <Button
            variant="secondary"
            onClick={togglePause}
            className="w-24"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" />
                Resume
              </>
            )}
          </Button>
        )}
        
        <Button
          variant="secondary"
          onClick={reset}
          className="w-24"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Reset
        </Button>
        
        <Button
          variant="primary"
          onClick={onDismiss}
          className="w-24"
        >
          <X className="w-4 h-4 mr-1" />
          {isComplete ? 'Done' : 'Skip'}
        </Button>
      </div>
    </div>
  );
}
