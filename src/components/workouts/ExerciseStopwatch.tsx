import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Check, X, Trophy } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatTime } from '@/types';
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('Stopwatch');

interface ExerciseStopwatchProps {
  exerciseName: string;
  previousMax?: number; // Previous max time in seconds
  onRecordMax: (seconds: number) => void;
  onCancel: () => void;
  onSkipToLog: () => void;
}

// Audio context for generating sounds
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

function playStopSound() {
  // Single confirmation tone
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 660; // E5
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (e) {
    log.warn('Audio playback failed:', e);
  }
}

function playNewRecordSound() {
  // Celebratory ascending tones for new record
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const startTime = ctx.currentTime + (i * 0.12);
      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  } catch (e) {
    log.warn('Audio playback failed:', e);
  }
}

export function ExerciseStopwatch({ 
  exerciseName, 
  previousMax,
  onRecordMax, 
  onCancel,
  onSkipToLog 
}: ExerciseStopwatchProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const elapsedBeforeRef = useRef<number>(0);

  const isNewRecord = previousMax !== undefined && elapsedSeconds > previousMax;

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startStopwatch = useCallback(() => {
    // Initialize audio context on user interaction
    getAudioContext();
    
    setIsRunning(true);
    setIsStopped(false);
    startTimeRef.current = Date.now();
    
    intervalRef.current = window.setInterval(() => {
      if (startTimeRef.current) {
        const now = Date.now();
        const elapsed = Math.floor((now - startTimeRef.current) / 1000) + elapsedBeforeRef.current;
        setElapsedSeconds(elapsed);
      }
    }, 100); // Update frequently for smooth display
  }, []);

  const pauseStopwatch = useCallback(() => {
    setIsRunning(false);
    elapsedBeforeRef.current = elapsedSeconds;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [elapsedSeconds]);

  const stopStopwatch = useCallback(() => {
    pauseStopwatch();
    setIsStopped(true);
    
    if (isNewRecord) {
      playNewRecordSound();
    } else {
      playStopSound();
    }
  }, [pauseStopwatch, isNewRecord]);

  const resetStopwatch = useCallback(() => {
    pauseStopwatch();
    setElapsedSeconds(0);
    setIsStopped(false);
    elapsedBeforeRef.current = 0;
    startTimeRef.current = null;
  }, [pauseStopwatch]);

  const handleRecordMax = () => {
    onRecordMax(elapsedSeconds);
  };

  // Calculate visual progress (compared to previous max)
  const getProgressColor = () => {
    if (!previousMax) return 'text-primary-500';
    if (elapsedSeconds >= previousMax) return 'text-green-500';
    if (elapsedSeconds >= previousMax * 0.9) return 'text-yellow-500';
    return 'text-primary-500';
  };

  return (
    <div className="flex flex-col items-center">
      {/* Exercise name and max test indicator */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {exerciseName}
        </h3>
        <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
          Max Test
          {previousMax !== undefined && (
            <span className="text-gray-500 dark:text-gray-400 font-normal">
              {' '}• Previous: {formatTime(previousMax)}
            </span>
          )}
        </p>
      </div>

      {/* Stopwatch circle */}
      <div className="relative w-64 h-64 mb-6">
        {/* Background circle */}
        <svg className="w-full h-full" viewBox="0 0 256 256">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress indicator (if we have a previous max to compare against) */}
          {previousMax !== undefined && (
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * Math.max(0, 1 - elapsedSeconds / previousMax)}
              className={`transition-all duration-200 ${getProgressColor()}`}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
          )}
        </svg>
        
        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-bold tabular-nums ${
            isStopped && isNewRecord 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-gray-900 dark:text-gray-100'
          }`}>
            {formatTime(elapsedSeconds)}
          </span>
          {isStopped && isNewRecord && (
            <div className="flex items-center gap-1 mt-2 text-green-600 dark:text-green-400">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">New Record!</span>
            </div>
          )}
          {!isStopped && previousMax !== undefined && elapsedSeconds > 0 && (
            <span className={`text-sm mt-2 ${
              elapsedSeconds >= previousMax 
                ? 'text-green-600 dark:text-green-400 font-medium' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {elapsedSeconds >= previousMax 
                ? `+${formatTime(elapsedSeconds - previousMax)} over!`
                : `${formatTime(previousMax - elapsedSeconds)} to beat`
              }
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      {!isStopped ? (
        <div className="flex items-center gap-4 mb-6">
          {!isRunning ? (
            <Button
              onClick={startStopwatch}
              className="w-16 h-16 rounded-full p-0 flex items-center justify-center"
            >
              <Play className="w-8 h-8 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={stopStopwatch}
              variant="secondary"
              className="w-16 h-16 rounded-full p-0 flex items-center justify-center bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
            >
              <Pause className="w-8 h-8" />
            </Button>
          )}
          
          {elapsedSeconds > 0 && !isRunning && (
            <Button
              onClick={resetStopwatch}
              variant="ghost"
              className="w-12 h-12 rounded-full p-0 flex items-center justify-center"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3 w-full max-w-xs mb-6">
          <Button 
            onClick={handleRecordMax} 
            className={`w-full ${isNewRecord ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            <Check className="w-5 h-5 mr-2" />
            Record {formatTime(elapsedSeconds)} as Max
          </Button>
          <Button
            onClick={resetStopwatch}
            variant="secondary"
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex gap-3 w-full max-w-xs">
        <Button
          onClick={onCancel}
          variant="ghost"
          className="flex-1"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          onClick={onSkipToLog}
          variant="secondary"
          className="flex-1"
        >
          Enter Time
        </Button>
      </div>
    </div>
  );
}
