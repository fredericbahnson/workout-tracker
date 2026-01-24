import { useState } from 'react';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  User,
  LogOut,
  UserX,
  Key,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { createScopedLogger } from '@/utils/logger';
import { useAuth, useSync, useSyncItem } from '@/contexts';
import { db } from '@/data/db';
import { Card, CardContent, Button } from '@/components/ui';
import {
  AuthModal,
  DeleteAccountModal,
  ChangePasswordModal,
  ClearHistoryModal,
} from '@/components/settings';
import type { SettingsSectionProps } from './types';

const log = createScopedLogger('AccountSection');

export function AccountSection({ setMessage }: SettingsSectionProps) {
  const {
    user,
    isLoading: authLoading,
    isConfigured,
    signIn,
    signUp,
    signOut,
    deleteAccount,
    updatePassword,
  } = useAuth();
  const { status: syncStatus, lastSyncTime, lastError: syncError, sync, isSyncing } = useSync();
  const { hardDeleteItem } = useSyncItem();

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // Delete account modal state
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Clear history modal state
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  // Change password modal state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleAuthSubmit = async () => {
    setAuthError(null);
    setIsAuthSubmitting(true);

    try {
      const result =
        authMode === 'signin' ? await signIn(email, password) : await signUp(email, password);

      if (result.error) {
        setAuthError(result.error.message);
      } else {
        setShowAuthModal(false);
        setEmail('');
        setPassword('');
        if (authMode === 'signup') {
          setMessage({ type: 'success', text: 'Account created! Check your email to verify.' });
        } else {
          setMessage({ type: 'success', text: 'Signed in successfully!' });
        }
      }
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setMessage({ type: 'success', text: 'Signed out successfully.' });
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAccount();
      if (result.error) {
        setMessage({ type: 'error', text: `Failed to delete account: ${result.error.message}` });
      } else {
        setMessage({ type: 'success', text: 'Account and data deleted successfully.' });
      }
    } catch (error) {
      log.error(error as Error);
      setMessage({ type: 'error', text: 'Failed to delete account.' });
    } finally {
      setIsDeleting(false);
      setShowDeleteAccountConfirm(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await updatePassword(newPassword);
      if (result.error) {
        setMessage({ type: 'error', text: `Failed to change password: ${result.error.message}` });
      } else {
        setMessage({ type: 'success', text: 'Password changed successfully.' });
        setShowChangePassword(false);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      log.error(error as Error);
      setMessage({ type: 'error', text: 'Failed to change password.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleClearHistory = async () => {
    setIsClearingHistory(true);
    try {
      // Get all IDs to delete from cloud
      const completedSets = await db.completedSets.toArray();
      const cycles = await db.cycles.toArray();
      const scheduledWorkouts = await db.scheduledWorkouts.toArray();

      // Delete from cloud if user is signed in
      if (user) {
        // Delete completed sets from cloud
        for (const set of completedSets) {
          try {
            await hardDeleteItem('completed_sets', set.id);
          } catch (error) {
            log.error(error as Error, { operation: 'clearHistory', table: 'completed_sets' });
          }
        }

        // Delete scheduled workouts from cloud
        for (const workout of scheduledWorkouts) {
          try {
            await hardDeleteItem('scheduled_workouts', workout.id);
          } catch (error) {
            log.error(error as Error, { operation: 'clearHistory', table: 'scheduled_workouts' });
          }
        }

        // Delete cycles from cloud
        for (const cycle of cycles) {
          try {
            await hardDeleteItem('cycles', cycle.id);
          } catch (error) {
            log.error(error as Error, { operation: 'clearHistory', table: 'cycles' });
          }
        }
      }

      // Clear local tables (keep exercises and maxRecords)
      await db.transaction('rw', [db.completedSets, db.cycles, db.scheduledWorkouts], async () => {
        await db.completedSets.clear();
        await db.cycles.clear();
        await db.scheduledWorkouts.clear();
      });

      setShowClearHistoryConfirm(false);
      setMessage({
        type: 'success',
        text: 'Workout history cleared. Your exercises and records are preserved.',
      });
    } catch (error) {
      log.error(error as Error);
      setMessage({ type: 'error', text: 'Failed to clear workout history.' });
    } finally {
      setIsClearingHistory(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Account & Sync</h3>
          </div>

          {!isConfigured ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Cloud sync not configured. Data is stored locally only.
              </p>
            </div>
          ) : authLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : user ? (
            <>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {user.email}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChangePassword(true)}
                    className="text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Key className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {syncStatus === 'syncing' || isSyncing ? (
                    <RefreshCw className="w-4 h-4 text-primary-500 animate-spin" />
                  ) : syncStatus === 'offline' ? (
                    <CloudOff className="w-4 h-4 text-gray-400" />
                  ) : syncStatus === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <Cloud className="w-4 h-4 text-green-500" />
                  )}
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {syncStatus === 'syncing' || isSyncing
                      ? 'Syncing...'
                      : syncStatus === 'offline'
                        ? 'Offline'
                        : syncStatus === 'error'
                          ? 'Sync error'
                          : lastSyncTime
                            ? `Last sync: ${lastSyncTime.toLocaleTimeString()}`
                            : 'Ready to sync'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={sync}
                  disabled={isSyncing || syncStatus === 'syncing'}
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {syncError && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{syncError}</p>
              )}

              <div className="pt-3 border-t border-gray-200 dark:border-dark-border space-y-3">
                <button
                  onClick={() => setShowClearHistoryConfirm(true)}
                  className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear workout history
                </button>
                <button
                  onClick={() => setShowDeleteAccountConfirm(true)}
                  className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  <UserX className="w-4 h-4" />
                  Delete account and all data
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sign in to sync your data across devices
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setAuthMode('signin');
                    setShowAuthModal(true);
                  }}
                >
                  Sign In
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuthModal(true);
                  }}
                >
                  Sign Up
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AuthModal
        isOpen={showAuthModal}
        mode={authMode}
        email={email}
        password={password}
        error={authError}
        isSubmitting={isAuthSubmitting}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onModeChange={mode => {
          setAuthMode(mode);
          setAuthError(null);
        }}
        onSubmit={handleAuthSubmit}
        onClose={() => {
          setShowAuthModal(false);
          setAuthError(null);
        }}
      />

      <DeleteAccountModal
        isOpen={showDeleteAccountConfirm}
        isDeleting={isDeleting}
        onConfirm={handleDeleteAccount}
        onClose={() => setShowDeleteAccountConfirm(false)}
      />

      <ChangePasswordModal
        isOpen={showChangePassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        isChanging={isChangingPassword}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onConfirm={handleChangePassword}
        onClose={() => setShowChangePassword(false)}
      />

      <ClearHistoryModal
        isOpen={showClearHistoryConfirm}
        isClearing={isClearingHistory}
        onConfirm={handleClearHistory}
        onClose={() => setShowClearHistoryConfirm(false)}
      />
    </>
  );
}
