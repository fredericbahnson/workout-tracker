import { useContext } from 'react';
import { SyncedPreferencesContext } from './SyncedPreferencesContext';

export function useSyncedPreferences() {
  const context = useContext(SyncedPreferencesContext);
  if (context === undefined) {
    throw new Error('useSyncedPreferences must be used within a SyncedPreferencesProvider');
  }
  return context;
}
