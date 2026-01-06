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
  const [audioInitialized, setAudioInitialized] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context on first user interaction
  const initAudio = useCallback(() => {
    if (audioInitialized) return;
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Resume context (required for iOS Safari)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      setAudioInitialized(true);
    } catch (e) {
      console.log('Audio context not available');
    }
  }, [audioInitialized]);

  // Play a beep sound using Web Audio API
  const playBeep = useCallback((isCompletion: boolean = false) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      // Resume if suspended (iOS requirement)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      if (isCompletion) {
        // Play a more distinct completion sound - three ascending tones
        const frequencies = [660, 880, 1100]; // E5, A5, C#6
        frequencies.forEach((freq, i) => {
          const oscillator = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          oscillator.frequency.value = freq;
          oscillator.type = 'sine';
          
          const startTime = ctx.currentTime + (i * 0.15);
          gainNode.gain.setValueAtTime(0.4, startTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + 0.3);
        });
      } else {
        // Single beep for countdown
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.value = 880; // A5 note
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {
      console.log('Audio playback failed:', e);
    }
  }, []);

  // Initialize audio on mount via any interaction
  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
      // Remove listeners after first interaction
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);
    };
    
    document.addEventListener('touchstart', handleInteraction, { once: true });
    document.addEventListener('click', handleInteraction, { once: true });
    
    // Also try to init immediately
    initAudio();
    
    return () => {
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);
    };
  }, [initAudio]);

  useEffect(() => {
    if (isRunning && secondsRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            playBeep(true); // Completion sound
            onComplete?.();
            return 0;
          }
          // Play beep for last 3 seconds
          if (prev <= 4) {
            playBeep(false);
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
    initAudio(); // Ensure audio is ready
    setIsRunning(!isRunning);
  };

  const reset = () => {
    initAudio(); // Ensure audio is ready
    setSecondsRemaining(initialSeconds);
    setIsRunning(true);
    setIsComplete(false);
  };

  const addTime = (seconds: number) => {
    initAudio(); // Ensure audio is ready
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
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 192 192">
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
