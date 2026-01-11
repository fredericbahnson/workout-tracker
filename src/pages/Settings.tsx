import { useState, useRef } from 'react';
import { Sun, Moon, Monitor, Download, Upload, Trash2, CheckCircle, AlertCircle, Timer, Cloud, CloudOff, RefreshCw, User, LogOut, UserX, Key, Type, Wrench } from 'lucide-react';
import { exportData, importData, db } from '@/data/db';
import { ScheduledWorkoutRepo } from '@/data/repositories';
import { useAppStore, useTheme, type RepDisplayMode, type FontSize } from '@/stores/appStore';
import { useAuth, useSync, useSyncedPreferences, useSyncItem } from '@/contexts';
import { PageHeader } from '@/components/layout';
import { Card, CardContent, Button, NumberInput, Badge, Select, TimeDurationInput } from '@/components/ui';
import { AuthModal, DeleteAccountModal, ChangePasswordModal, ClearDataModal } from '@/components/settings';
import { EXERCISE_TYPES, EXERCISE_TYPE_LABELS } from '@/types';
import { APP_VERSION } from '@/constants/version';

export function SettingsPage() {
  const { theme, setTheme, applyTheme } = useTheme();
  const { repDisplayMode, setRepDisplayMode, fontSize, setFontSize } = useAppStore();
  const { 
    preferences, 
    setDefaultMaxReps, 
    setDefaultConditioningReps, 
    setConditioningWeeklyIncrement, 
    setWeeklySetGoal, 
    setRestTimer, 
    setMaxTestRestTimer 
  } = useSyncedPreferences();
  const { user, isLoading: authLoading, isConfigured, signIn, signUp, signOut, deleteAccount, updatePassword } = useAuth();
  const { status: syncStatus, lastSyncTime, lastError: syncError, sync, isSyncing } = useSync();
  const { deleteItem, hardDeleteItem } = useSyncItem();
  
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAuthSubmit = async () => {
    setAuthError(null);
    setIsAuthSubmitting(true);
    
    try {
      const result = authMode === 'signin' 
        ? await signIn(email, password)
        : await signUp(email, password);
      
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
        // Account deleted - page will redirect to auth gate
        setMessage({ type: 'success', text: 'Account and data deleted successfully.' });
      }
    } catch (e) {
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
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to change password.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);
    try {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workout-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Backup exported successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export backup.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setMessage(null);
    try {
      const text = await file.text();
      const result = await importData(text);
      if (result.success) {
        setMessage({ type: 'success', text: 'Backup imported successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to import backup.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to read backup file.' });
    } finally {
      setIsImporting(false);
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCleanupDuplicates = async () => {
    setIsCleaningDuplicates(true);
    setMessage(null);
    try {
      const deletedIds = await ScheduledWorkoutRepo.cleanupDuplicates();
      
      if (deletedIds.length > 0) {
        // Hard delete from cloud so they don't come back
        let successCount = 0;
        let failCount = 0;
        for (const id of deletedIds) {
          try {
            // Use hardDeleteItem for permanent removal from cloud
            const success = await hardDeleteItem('scheduled_workouts', id);
            if (success) {
              successCount++;
            } else {
              // If hard delete fails, try soft delete as fallback
              const softSuccess = await deleteItem('scheduled_workouts', id);
              if (softSuccess) successCount++;
              else failCount++;
            }
          } catch (e) {
            failCount++;
          }
        }
        
        if (failCount > 0) {
          setMessage({ 
            type: 'success', 
            text: `Removed ${deletedIds.length} duplicate(s). ${successCount} synced to cloud, ${failCount} may return on next sync.` 
          });
        } else {
          setMessage({ type: 'success', text: `Removed ${deletedIds.length} duplicate workout(s) and synced to cloud.` });
        }
      } else {
        setMessage({ type: 'success', text: 'No duplicate workouts found.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to cleanup duplicates.' });
    } finally {
      setIsCleaningDuplicates(false);
    }
  };

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      // Clear all tables instead of deleting database (which can cause issues)
      await db.transaction('rw', [db.exercises, db.maxRecords, db.completedSets, db.cycles, db.scheduledWorkouts], async () => {
        await db.exercises.clear();
        await db.maxRecords.clear();
        await db.completedSets.clear();
        await db.cycles.clear();
        await db.scheduledWorkouts.clear();
      });
      setShowClearConfirm(false);
      setMessage({ type: 'success', text: 'All data cleared.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to clear data.' });
    } finally {
      setIsClearing(false);
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;

  const fontSizeOptions: { value: FontSize; label: string }[] = [
    { value: 'small', label: 'Small' },
    { value: 'default', label: 'Default' },
    { value: 'large', label: 'Large' },
    { value: 'xl', label: 'XL' },
  ];

  return (
    <>
      <PageHeader title="Settings" />

      <div className="px-4 py-4 space-y-4">
        {/* Message */}
        {message && (
          <div className={`
            flex items-center gap-2 px-4 py-3 rounded-lg
            ${message.type === 'success' 
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            }
          `}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Account / Cloud Sync */}
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Account & Sync
              </h3>
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
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {user.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setShowChangePassword(true)} className="text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
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
                      {syncStatus === 'syncing' || isSyncing ? 'Syncing...' :
                       syncStatus === 'offline' ? 'Offline' :
                       syncStatus === 'error' ? 'Sync error' :
                       lastSyncTime ? `Last sync: ${lastSyncTime.toLocaleTimeString()}` : 'Ready to sync'}
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
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {syncError}
                  </p>
                )}
                
                <div className="pt-3 border-t border-gray-200 dark:border-dark-border">
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
                    onClick={() => { setAuthMode('signin'); setShowAuthModal(true); }}
                  >
                    Sign In
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                  >
                    Sign Up
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardContent>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Appearance
            </h3>
            <div className="flex gap-2">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleThemeChange(value)}
                  className={`
                    flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors
                    ${theme === value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${theme === value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'}`} />
                  <span className={`text-sm font-medium ${theme === value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Font Size */}
        <Card>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <Type className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Font Size
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {fontSizeOptions.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFontSize(value)}
                  className={`
                    flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors
                    ${fontSize === value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <span className={`font-medium ${
                    value === 'small' ? 'text-xs' : 
                    value === 'default' ? 'text-sm' : 
                    value === 'large' ? 'text-base' : 
                    'text-lg'
                  } ${fontSize === value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    Aa
                  </span>
                  <span className={`text-xs ${fontSize === value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Defaults */}
        <Card>
          <CardContent className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Default Values
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <NumberInput
                label="Default Max (RFEM)"
                value={preferences.defaultMaxReps}
                onChange={v => setDefaultMaxReps(v)}
                min={1}
              />
              <NumberInput
                label="Default Reps (Conditioning)"
                value={preferences.defaultConditioningReps}
                onChange={v => setDefaultConditioningReps(v)}
                min={1}
              />
            </div>

            <NumberInput
              label="Weekly Rep Increase (Conditioning)"
              value={preferences.conditioningWeeklyIncrement}
              onChange={v => setConditioningWeeklyIncrement(v)}
              min={0}
            />

            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
                Default Weekly Sets per Type
              </label>
              <div className="space-y-2">
                {EXERCISE_TYPES.filter(t => t !== 'other').map(type => (
                  <div key={type} className="flex flex-wrap items-center gap-2">
                    <Badge variant={type} className="w-20 justify-center text-2xs flex-shrink-0">
                      {EXERCISE_TYPE_LABELS[type]}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <NumberInput
                        value={preferences.weeklySetGoals[type]}
                        onChange={v => setWeeklySetGoal(type, v)}
                        min={0}
                        className="w-16 flex-shrink-0"
                      />
                      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">/wk</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardContent className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Display Settings
            </h3>
            
            <Select
              label="Progress Totals Timeframe"
              value={repDisplayMode}
              onChange={e => setRepDisplayMode(e.target.value as RepDisplayMode)}
              options={[
                { value: 'week', label: 'This Week' },
                { value: 'cycle', label: 'This Cycle' },
                { value: 'allTime', label: 'All Time' }
              ]}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Timeframe for totals on Progress tab and exercise detail pages
            </p>
          </CardContent>
        </Card>

        {/* Rest Timer Settings */}
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Rest Timer
              </h3>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">Enable rest timer</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Show timer prompt after completing each set
                </p>
              </div>
              <button
                onClick={() => setRestTimer({ enabled: !preferences.restTimer.enabled })}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${preferences.restTimer.enabled 
                    ? 'bg-primary-600' 
                    : 'bg-gray-200 dark:bg-gray-700'
                  }
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${preferences.restTimer.enabled ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {preferences.restTimer.enabled && (
              <div className="pt-2 border-t border-gray-200 dark:border-dark-border">
                <TimeDurationInput
                  label="Default rest duration"
                  value={preferences.restTimer.durationSeconds}
                  onChange={v => setRestTimer({ durationSeconds: v })}
                  minSeconds={10}
                  maxSeconds={600}
                />
              </div>
            )}

            {/* Max Testing Rest Timer */}
            <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Max testing rest timer</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Show timer after each max test set
                  </p>
                </div>
                <button
                  onClick={() => setMaxTestRestTimer({ enabled: !preferences.maxTestRestTimer.enabled })}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${preferences.maxTestRestTimer.enabled 
                      ? 'bg-primary-600' 
                      : 'bg-gray-200 dark:bg-gray-700'
                    }
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${preferences.maxTestRestTimer.enabled ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>

              {preferences.maxTestRestTimer.enabled && (
                <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-800">
                  <TimeDurationInput
                    label="Default max test rest duration"
                    value={preferences.maxTestRestTimer.durationSeconds}
                    onChange={v => setMaxTestRestTimer({ durationSeconds: v })}
                    minSeconds={30}
                    maxSeconds={900}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardContent className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Data Management
            </h3>
            
            <Button 
              variant="secondary" 
              className="w-full justify-start"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Backup'}
            </Button>

            <Button 
              variant="secondary" 
              className="w-full justify-start"
              onClick={handleImportClick}
              disabled={isImporting}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? 'Importing...' : 'Import Backup'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />

            <hr className="border-gray-200 dark:border-dark-border" />

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Troubleshooting
            </p>
            
            <Button 
              variant="secondary" 
              className="w-full justify-start"
              onClick={handleCleanupDuplicates}
              disabled={isCleaningDuplicates}
            >
              <Wrench className="w-4 h-4 mr-2" />
              {isCleaningDuplicates ? 'Cleaning...' : 'Fix Duplicate Workouts'}
            </Button>

            <hr className="border-gray-200 dark:border-dark-border" />

            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={() => setShowClearConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data
            </Button>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardContent>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              About
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ascend v{APP_VERSION}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Progressive calisthenics strength training
            </p>
          </CardContent>
        </Card>
      </div>

      <ClearDataModal
        isOpen={showClearConfirm}
        isClearing={isClearing}
        onConfirm={handleClearData}
        onClose={() => setShowClearConfirm(false)}
      />

      <AuthModal
        isOpen={showAuthModal}
        mode={authMode}
        email={email}
        password={password}
        error={authError}
        isSubmitting={isAuthSubmitting}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onModeChange={(mode) => { setAuthMode(mode); setAuthError(null); }}
        onSubmit={handleAuthSubmit}
        onClose={() => { setShowAuthModal(false); setAuthError(null); }}
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
    </>
  );
}
