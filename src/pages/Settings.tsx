import { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { TrialBanner } from '@/components/paywall';
import { useEntitlement } from '@/contexts';
import {
  AccountSection,
  AppearanceSection,
  SubscriptionSection,
  TrainingSection,
  TimerSection,
  DataSection,
  HelpSection,
  type SettingsMessage,
} from './settingsSections';

export function SettingsPage() {
  const [message, setMessage] = useState<SettingsMessage | null>(null);
  const { trial, purchase } = useEntitlement();

  return (
    <>
      <PageHeader title="Settings" />

      <div className="px-4 py-4 space-y-4">
        {/* Message Banner */}
        {message && message.text && (
          <div
            className={`
            flex items-center gap-2 px-4 py-3 rounded-lg
            ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            }
          `}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Account & Sync */}
        <AccountSection setMessage={setMessage} />

        {/* Trial Banner - shown when trial is active (even with standard purchase) or expired without purchase */}
        {(trial.isActive || (!purchase && trial.hasExpired)) && <TrialBanner variant="full" />}

        {/* Appearance, App Mode, Font Size */}
        <AppearanceSection />

        {/* Training Defaults & Display Settings */}
        <TrainingSection />

        {/* Rest Timer Settings */}
        <TimerSection />

        {/* Help & About */}
        <HelpSection />

        {/* Subscription Status */}
        <SubscriptionSection />

        {/* Data Management */}
        <DataSection setMessage={setMessage} />
      </div>
    </>
  );
}
