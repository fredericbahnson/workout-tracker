import { Timer, Volume2, VolumeX } from 'lucide-react';
import { playTestSound, initAudioOnInteraction } from '@/utils/audio';
import { useSyncedPreferences } from '@/contexts';
import { Card, CardContent, TimeDurationInput } from '@/components/ui';

export function TimerSection() {
  const { preferences, setRestTimer, setMaxTestRestTimer, setTimerVolume } = useSyncedPreferences();

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Rest Timer</h3>
        </div>

        {/* Rest Timer Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">Enable rest timer</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Show timer prompt after completing each set
            </p>
          </div>
          <button
            onClick={() => setRestTimer({ enabled: !preferences.restTimer.enabled })}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${preferences.restTimer.enabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${preferences.restTimer.enabled ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {preferences.restTimer.enabled && (
          <div className="pt-2 border-t border-gray-200 dark:border-dark-border">
            <TimeDurationInput
              label="Default rest duration"
              value={preferences.restTimer.durationSeconds}
              onChange={v => setRestTimer({ durationSeconds: v })}
              minSeconds={10}
              maxSeconds={600}
            />
          </div>
        )}

        {/* Max Testing Rest Timer */}
        <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">Max testing rest timer</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Show timer after each max test set
              </p>
            </div>
            <button
              onClick={() =>
                setMaxTestRestTimer({ enabled: !preferences.maxTestRestTimer.enabled })
              }
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${
                  preferences.maxTestRestTimer.enabled
                    ? 'bg-primary-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${preferences.maxTestRestTimer.enabled ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {preferences.maxTestRestTimer.enabled && (
            <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-800">
              <TimeDurationInput
                label="Default max test rest duration"
                value={preferences.maxTestRestTimer.durationSeconds}
                onChange={v => setMaxTestRestTimer({ durationSeconds: v })}
                minSeconds={30}
                maxSeconds={900}
              />
            </div>
          )}
        </div>

        {/* Timer Volume */}
        <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-2 mb-1">
            {preferences.timerVolume === 0 ? (
              <VolumeX className="w-4 h-4 text-gray-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-gray-500" />
            )}
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Timer Sound</h4>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Volume relative to system volume (100% = system volume)
          </p>

          <div className="flex items-center gap-3">
            {/* Mute button */}
            <button
              onClick={() => {
                initAudioOnInteraction();
                setTimerVolume(preferences.timerVolume === 0 ? 100 : 0);
              }}
              className={`
                p-2 rounded-lg transition-colors
                ${
                  preferences.timerVolume === 0
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
              title={preferences.timerVolume === 0 ? 'Unmute' : 'Mute'}
            >
              {preferences.timerVolume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            {/* Volume slider */}
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={preferences.timerVolume}
              onChange={e => {
                initAudioOnInteraction();
                setTimerVolume(Number(e.target.value));
              }}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />

            {/* Volume percentage */}
            <span className="text-sm text-gray-500 dark:text-gray-400 w-10 text-right tabular-nums">
              {preferences.timerVolume}%
            </span>

            {/* Test button */}
            <button
              onClick={() => {
                initAudioOnInteraction();
                playTestSound(preferences.timerVolume);
              }}
              disabled={preferences.timerVolume === 0}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                ${
                  preferences.timerVolume === 0
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50'
                }
              `}
            >
              Test
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Volume for countdown beeps and completion sounds
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
