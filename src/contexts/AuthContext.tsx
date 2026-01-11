import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/data/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('Auth');

interface AuthContextType {
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
  clearNewUserFlag: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const isConfigured = isSupabaseConfigured();

  // Helper to clear all local database tables
  const clearLocalDatabase = async () => {
    const { db } = await import('../data/db');
    await db.transaction('rw', [db.exercises, db.maxRecords, db.completedSets, db.cycles, db.scheduledWorkouts, db.syncQueue], async () => {
      await db.exercises.clear();
      await db.maxRecords.clear();
      await db.completedSets.clear();
      await db.cycles.clear();
      await db.scheduledWorkouts.clear();
      await db.syncQueue.clear();
    });
  };

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    // Handle email confirmation redirect (hash contains tokens)
    // Supabase puts auth tokens in URL hash after email confirmation
    const handleEmailConfirmation = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        // Clear the hash from URL without triggering navigation
        window.history.replaceState(null, '', window.location.pathname);
      }
    };
    
    handleEmailConfirmation();

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          // If offline or network error, try to use cached session
          // Supabase stores session in localStorage
          log.debug('getSession error (may be offline):', error.message);
          
          // Still try to get the user from the cached session
          // onAuthStateChange will handle restoring from localStorage
        }
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      })
      .catch((err) => {
        // Network error - still set loading to false
        log.debug('getSession failed (may be offline):', err);
        setIsLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        log.debug('Auth event:', event);
        
        // Handle token refresh errors gracefully when offline
        if (event === 'TOKEN_REFRESHED' && !session && !navigator.onLine) {
          log.debug('Token refresh failed while offline - keeping existing session');
          return; // Don't clear user when offline
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Check if this is a new user (email confirmation or fresh signup)
        if (event === 'SIGNED_IN' && session) {
          // Check if user was created recently (within last 5 minutes)
          const createdAt = new Date(session.user.created_at);
          const now = new Date();
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
          
          if (createdAt > fiveMinutesAgo) {
            setIsNewUser(true);
          }
          
          // Sync will be triggered by the sync service
          window.dispatchEvent(new CustomEvent('auth-signed-in'));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [isConfigured]);

  const signUp = async (email: string, password: string) => {
    if (!isConfigured) {
      return { error: new Error('Supabase not configured') };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      }
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) {
      return { error: new Error('Supabase not configured') };
    }

    // Clear local database before signing in to prevent data leakage between accounts
    try {
      await clearLocalDatabase();
    } catch (e) {
      log.error(e as Error);
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (!isConfigured) return;
    
    // Clear local IndexedDB tables before signing out
    try {
      await clearLocalDatabase();
    } catch (e) {
      log.error(e as Error);
    }
    
    // Reset onboarding flag so next user sees onboarding
    const { useAppStore } = await import('../stores/appStore');
    useAppStore.getState().setHasCompletedOnboarding(false);
    
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsNewUser(false);
  };

  const deleteAccount = async () => {
    if (!isConfigured || !user) {
      return { error: new Error('Not authenticated') };
    }

    try {
      // Call the database function to delete the user account and all data
      const { error: rpcError } = await supabase.rpc('delete_user_account');
      
      if (rpcError) {
        log.error(new Error(rpcError.message), { code: rpcError.code });
        return { error: new Error(rpcError.message) };
      }
      
      // Clear local IndexedDB tables
      await clearLocalDatabase();
      
      // Clear localStorage
      localStorage.clear();
      
      // Sign out (session is already invalid since user was deleted)
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setIsNewUser(false);
      
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const resetPassword = async (email: string) => {
    if (!isConfigured) {
      return { error: new Error('Supabase not configured') };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    return { error: error as Error | null };
  };

  const updatePassword = async (newPassword: string) => {
    if (!isConfigured) {
      return { error: new Error('Supabase not configured') };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    return { error: error as Error | null };
  };

  const clearNewUserFlag = () => {
    setIsNewUser(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      isConfigured,
      isNewUser,
      signUp,
      signIn,
      signOut,
      deleteAccount,
      resetPassword,
      updatePassword,
      clearNewUserFlag,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
