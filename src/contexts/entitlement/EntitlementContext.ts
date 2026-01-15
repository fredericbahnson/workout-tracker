import { createContext } from 'react';
import type { EntitlementContextValue } from './types';

export const EntitlementContext = createContext<EntitlementContextValue | undefined>(undefined);
