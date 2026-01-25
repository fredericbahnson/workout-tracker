import { Sun, Moon, Monitor, Type, Layers, Lock } from 'lucide-react';
import { useAppStore, useThemeEffect, type FontSize } from '@/stores/appStore';
import { useSyncedPreferences, useEntitlement } from '@/contexts';
import { Card, CardContent } from '@/components/ui';

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

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;

  const fontSizeOptions: { value: FontSize; label: string }[] = [
    { value: 'small', label: 'Small' },
    { value: 'default', label: 'Default' },
    { value: 'large', label: 'Large' },
    { value: 'xl', label: 'XL' },
  ];

  return (
    <>
      {/* Theme */}
      <Card>
        <CardContent>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Appearance</h3>
          <div className="flex gap-2">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleThemeChange(value)}
                className={`
                  flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors
                  ${
                    theme === value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <Icon
                  className={`w-5 h-5 ${theme === value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'}`}
                />
                <span
                  className={`text-sm font-medium ${theme === value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}
                >
                  {label}
                </span>
              </button>
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
          <div className="space-y-2">
            <button
              onClick={() => setAppMode('standard')}
              className={`
                w-full p-3 rounded-lg border-2 transition-colors text-left
                ${
                  preferences.appMode === 'standard'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`
                  w-4 h-4 rounded-full border-2 flex items-center justify-center
                  ${
                    preferences.appMode === 'standard'
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }
                `}
                >
                  {preferences.appMode === 'standard' && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1">
                  <span
                    className={`text-sm font-medium ${
                      preferences.appMode === 'standard'
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Standard
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    RFEM-based training and max testing cycles
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
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
              }}
              className={`
                w-full p-3 rounded-lg border-2 transition-colors text-left
                ${
                  preferences.appMode === 'advanced' && canAccessAdvanced
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : !canAccessAdvanced
                      ? 'border-gray-200 dark:border-dark-border opacity-60'
                      : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`
                  w-4 h-4 rounded-full border-2 flex items-center justify-center
                  ${
                    preferences.appMode === 'advanced' && canAccessAdvanced
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }
                `}
                >
                  {preferences.appMode === 'advanced' && canAccessAdvanced && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        preferences.appMode === 'advanced' && canAccessAdvanced
                          ? 'text-primary-600 dark:text-primary-400'
                          : !canAccessAdvanced
                            ? 'text-gray-500 dark:text-gray-500'
                            : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Advanced
                    </span>
                    {!canAccessAdvanced && <Lock className="w-3 h-3 text-gray-400" />}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    All cycle types including simple progression and mixed
                  </p>
                </div>
                {!canAccessAdvanced && (
                  <span className="text-xs bg-purple-500/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                    Upgrade
                  </span>
                )}
              </div>
            </button>
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
          <div className="grid grid-cols-2 gap-2">
            {fontSizeOptions.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFontSize(value)}
                className={`
                  flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors
                  ${
                    fontSize === value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <span
                  className={`font-medium ${
                    value === 'small'
                      ? 'text-xs'
                      : value === 'default'
                        ? 'text-sm'
                        : value === 'large'
                          ? 'text-base'
                          : 'text-lg'
                  } ${fontSize === value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}
                >
                  Aa
                </span>
                <span
                  className={`text-xs ${fontSize === value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'}`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
