import { createContext } from 'react';
import type { SyncContextType } from './types';

export const SyncContext = createContext<SyncContextType | undefined>(undefined);
