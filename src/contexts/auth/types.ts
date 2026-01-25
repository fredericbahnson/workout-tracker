import type { User, Session } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  isNewUser: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  resendVerificationEmail: (email: string) => Promise<{ error: Error | null }>;
  clearNewUserFlag: () => void;
}
