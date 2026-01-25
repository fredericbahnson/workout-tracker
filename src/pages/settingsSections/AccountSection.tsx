import { useState } from 'react';
import { Cloud, CloudOff, RefreshCw, User, LogOut, Key, AlertCircle } from 'lucide-react';
import { createScopedLogger } from '@/utils/logger';
import { useAuth, useSync } from '@/contexts';
import { Card, CardContent, Button } from '@/components/ui';
import { AuthModal, ChangePasswordModal } from '@/components/settings';
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
    updatePassword,
    resendVerificationEmail,
  } = useAuth();
  const { status: syncStatus, lastSyncTime, lastError: syncError, sync, isSyncing } = useSync();

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'verify'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // Change password modal state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleAuthSubmit = async () => {
    // Capture the current mode at the start (before async operations)
    const isSignup = authMode === 'signup';

    setAuthError(null);
    setIsAuthSubmitting(true);

    try {
      const result = isSignup ? await signUp(email, password) : await signIn(email, password);

      if (result.error) {
        // Check if the error is due to unverified email
        const errorMessage = result.error.message.toLowerCase();
        if (
          errorMessage.includes('email not confirmed') ||
          errorMessage.includes('not confirmed')
        ) {
          setAuthMode('verify');
          setAuthError(null);
        } else {
          setAuthError(result.error.message);
        }
      } else {
        if (isSignup) {
          // Switch to verification screen after successful signup
          setAuthMode('verify');
          setPassword('');
        } else {
          setShowAuthModal(false);
          setEmail('');
          setPassword('');
          setMessage({ type: 'success', text: 'Signed in successfully!' });
        }
      }
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setAuthError(null);
    const result = await resendVerificationEmail(email);
    if (result.error) {
      setAuthError(result.error.message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setMessage({ type: 'success', text: 'Signed out successfully.' });
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
        onResendVerification={handleResendVerification}
        onClose={() => {
          setShowAuthModal(false);
          setAuthError(null);
          setAuthMode('signin');
        }}
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
    </>
  );
}
