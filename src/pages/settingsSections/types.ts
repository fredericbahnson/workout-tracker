/**
 * Shared types for Settings page section components
 */

export type SettingsMessage = { type: 'success' | 'error'; text: string };

export interface SettingsSectionProps {
  setMessage: (message: SettingsMessage) => void;
}
