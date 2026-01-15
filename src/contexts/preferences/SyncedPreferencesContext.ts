import { createContext } from 'react';
import type { SyncedPreferencesContextType } from './types';

export const SyncedPreferencesContext = createContext<SyncedPreferencesContextType | undefined>(
  undefined
);
