import { Sun, Moon, Monitor, Type, Layers, Lock } from 'lucide-react';
import { useAppStore, useThemeEffect, type FontSize } from '@/stores/appStore';
import { useSyncedPreferences, useEntitlement } from '@/contexts';
import { Card, CardContent, SelectionCard } from '@/components/ui';

export function AppearanceSection() {
  // useThemeEffect handles theme application automatically via useEffect
  const { theme, setTheme } = useThemeEffect();
  const { fontSize, setFontSize } = useAppStore();
  const { preferences, setAppMode } = useSyncedPreferences();
  const { canAccessAdvanced, canUseTrialForAdvanced, showPaywall, purchase, trial } =
    useEntitlement();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    // setTheme will trigger the effect in useThemeEffect to apply the theme
    setTheme(newTheme);
  };

  const handleAdvancedModeSelect = () => {
    if (canAccessAdvanced) {
      setAppMode('advanced');
    } else {
      const reason = canUseTrialForAdvanced
        ? 'standard_can_use_trial'
        : purchase?.tier === 'standard'
          ? 'standard_only'
          : trial.hasExpired
            ? 'trial_expired'
            : 'not_purchased';
      showPaywall('advanced', reason);
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;

  const fontSizeOptions: { value: FontSize; label: string; sampleClass: string }[] = [
    { value: 'small', label: 'Small', sampleClass: 'text-xs' },
    { value: 'default', label: 'Default', sampleClass: 'text-sm' },
    { value: 'large', label: 'Large', sampleClass: 'text-base' },
    { value: 'xl', label: 'XL', sampleClass: 'text-lg' },
  ];

  return (
    <>
      {/* Theme */}
      <Card>
        <CardContent>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Appearance</h3>
          <div className="flex gap-2" role="radiogroup" aria-label="Theme">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <SelectionCard
                key={value}
                selected={theme === value}
                onSelect={() => handleThemeChange(value)}
                title={label}
                icon={
                  <Icon
                    className={`w-5 h-5 ${
                      theme === value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'
                    }`}
                  />
                }
                className="flex-1 gap-2"
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* App Mode */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">App Mode</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Choose between a simplified interface or full feature access.
          </p>
          <div className="space-y-2" role="radiogroup" aria-label="App mode">
            <SelectionCard
              layout="row"
              indicator="radio"
              selected={preferences.appMode === 'standard'}
              onSelect={() => setAppMode('standard')}
              title="Standard"
              description="RFEM-based training and max testing cycles"
            />
            <SelectionCard
              layout="row"
              indicator="radio"
              selected={preferences.appMode === 'advanced' && canAccessAdvanced}
              onSelect={handleAdvancedModeSelect}
              disabled={!canAccessAdvanced}
              title="Advanced"
              description="All cycle types including simple progression and mixed"
              trailing={
                !canAccessAdvanced ? (
                  <div className="flex items-center gap-2">
                    <Lock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs bg-purple-500/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                      Upgrade
                    </span>
                  </div>
                ) : undefined
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Font Size */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <Type className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Font Size</h3>
          </div>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Font size">
            {fontSizeOptions.map(({ value, label, sampleClass }) => (
              <SelectionCard
                key={value}
                selected={fontSize === value}
                onSelect={() => setFontSize(value)}
                title={label}
                icon={
                  <span
                    className={`font-medium ${sampleClass} ${
                      fontSize === value
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Aa
                  </span>
                }
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
