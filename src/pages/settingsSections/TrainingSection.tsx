import { useSyncedPreferences } from '@/contexts';
import { useAppStore, type RepDisplayMode } from '@/stores/appStore';
import { Card, CardContent, NumberInput, Badge, Select } from '@/components/ui';
import { EXERCISE_TYPES, EXERCISE_TYPE_LABELS } from '@/types';

export function TrainingSection() {
  const {
    preferences,
    setDefaultMaxReps,
    setDefaultConditioningReps,
    setConditioningWeeklyIncrement,
    setWeeklySetGoal,
  } = useSyncedPreferences();
  const { repDisplayMode, setRepDisplayMode } = useAppStore();

  return (
    <>
      {/* Defaults */}
      <Card>
        <CardContent className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Default Values</h3>

          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Default Max (RFEM)"
              value={preferences.defaultMaxReps}
              onChange={v => setDefaultMaxReps(v)}
              min={1}
            />
            <NumberInput
              label="Default Reps (Conditioning)"
              value={preferences.defaultConditioningReps}
              onChange={v => setDefaultConditioningReps(v)}
              min={1}
            />
          </div>

          <NumberInput
            label="Weekly Rep Increase (Conditioning)"
            value={preferences.conditioningWeeklyIncrement}
            onChange={v => setConditioningWeeklyIncrement(v)}
            min={0}
          />

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
              Default Weekly Sets per Type
            </label>
            <div className="space-y-2">
              {EXERCISE_TYPES.filter(t => t !== 'other').map(type => (
                <div key={type} className="flex flex-wrap items-center gap-2">
                  <Badge variant={type} className="w-20 justify-center text-2xs flex-shrink-0">
                    {EXERCISE_TYPE_LABELS[type]}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <NumberInput
                      value={preferences.weeklySetGoals[type]}
                      onChange={v => setWeeklySetGoal(type, v)}
                      min={0}
                      className="w-16 flex-shrink-0"
                    />
                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      /wk
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardContent className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Display Settings</h3>

          <Select
            label="Progress Totals Timeframe"
            value={repDisplayMode}
            onChange={e => setRepDisplayMode(e.target.value as RepDisplayMode)}
            options={[
              { value: 'week', label: 'This Week' },
              { value: 'cycle', label: 'This Cycle' },
              { value: 'allTime', label: 'All Time' },
            ]}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Timeframe for totals on Progress tab and exercise detail pages
          </p>
        </CardContent>
      </Card>
    </>
  );
}
