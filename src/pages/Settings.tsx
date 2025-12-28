import { useState, useRef } from 'react';
import { Sun, Moon, Monitor, Download, Upload, Trash2, CheckCircle, AlertCircle, Timer, Cloud, CloudOff, RefreshCw, User, LogOut, Mail, UserX, Key } from 'lucide-react';
import { exportData, importData, db } from '../data/db';
import { useAppStore, useTheme, type RepDisplayMode } from '../stores/appStore';
import { useAuth, useSync } from '../contexts';
import { PageHeader } from '../components/layout';
import { Card, CardContent, Button, Modal, NumberInput, Badge, Select, Input, TimeDurationInput } from '../components/ui';
import { EXERCISE_TYPES, EXERCISE_TYPE_LABELS } from '../types';

export function SettingsPage() {
  const { theme, setTheme, applyTheme } = useTheme();
  const { defaults, setDefaults, setWeeklySetGoal, repDisplayMode, setRepDisplayMode, restTimer, setRestTimer } = useAppStore();
  const { user, isLoading: authLoading, isConfigured, signIn, signUp, signOut, deleteAccount, updatePassword } = useAuth();
  const { status: syncStatus, lastSyncTime, lastError: syncError, sync, isSyncing } = useSync();
  
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
                
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
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
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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

        {/* Defaults */}
        <Card>
          <CardContent className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Default Values
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <NumberInput
                label="Default Max (RFEM)"
                value={defaults.defaultMaxReps}
                onChange={v => setDefaults({ defaultMaxReps: v })}
                min={1}
              />
              <NumberInput
                label="Default Reps (Conditioning)"
                value={defaults.defaultConditioningReps}
                onChange={v => setDefaults({ defaultConditioningReps: v })}
                min={1}
              />
            </div>

            <NumberInput
              label="Weekly Rep Increase (Conditioning)"
              value={defaults.conditioningWeeklyIncrement}
              onChange={v => setDefaults({ conditioningWeeklyIncrement: v })}
              min={0}
            />

            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
                Default Weekly Sets per Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {EXERCISE_TYPES.filter(t => t !== 'other').map(type => (
                  <div key={type} className="flex items-center gap-2">
                    <Badge variant={type} className="w-16 justify-center text-[10px]">
                      {EXERCISE_TYPE_LABELS[type]}
                    </Badge>
                    <NumberInput
                      value={defaults.weeklySetGoals[type]}
                      onChange={v => setWeeklySetGoal(type, v)}
                      min={0}
                    />
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
              label="Rep Totals Display"
              value={repDisplayMode}
              onChange={e => setRepDisplayMode(e.target.value as RepDisplayMode)}
              options={[
                { value: 'week', label: 'This Week' },
                { value: 'cycle', label: 'This Cycle' },
                { value: 'allTime', label: 'All Time' }
              ]}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              How to display rep totals on exercise detail pages
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
                onClick={() => setRestTimer({ enabled: !restTimer.enabled })}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${restTimer.enabled 
                    ? 'bg-primary-600' 
                    : 'bg-gray-200 dark:bg-gray-700'
                  }
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${restTimer.enabled ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {restTimer.enabled && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <TimeDurationInput
                  label="Default rest duration"
                  value={restTimer.defaultDurationSeconds}
                  onChange={v => setRestTimer({ defaultDurationSeconds: v })}
                  minSeconds={10}
                  maxSeconds={600}
                />
              </div>
            )}
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

            <hr className="border-gray-200 dark:border-gray-700" />

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
              Ascend v0.13.2
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Progressive calisthenics strength training
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clear Data Confirmation */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear All Data"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete all data? This will permanently remove all exercises, 
            max records, completed sets, and cycles. This action cannot be undone.
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Consider exporting a backup first.
          </p>
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              onClick={() => setShowClearConfirm(false)} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleClearData} 
              disabled={isClearing}
              className="flex-1"
            >
              {isClearing ? 'Clearing...' : 'Clear All Data'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Auth Modal */}
      <Modal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setAuthError(null); }}
        title={authMode === 'signin' ? 'Sign In' : 'Create Account'}
      >
        <div className="space-y-4">
          {authError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{authError}</p>
            </div>
          )}
          
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoFocus
          />
          
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={authMode === 'signup' ? 'At least 6 characters' : ''}
          />
          
          <Button 
            className="w-full"
            onClick={handleAuthSubmit}
            disabled={isAuthSubmitting || !email || !password}
          >
            <Mail className="w-4 h-4 mr-2" />
            {isAuthSubmitting 
              ? (authMode === 'signin' ? 'Signing in...' : 'Creating account...')
              : (authMode === 'signin' ? 'Sign In' : 'Create Account')
            }
          </Button>
          
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {authMode === 'signin' ? (
              <>
                Don't have an account?{' '}
                <button 
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                  onClick={() => { setAuthMode('signup'); setAuthError(null); }}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button 
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                  onClick={() => { setAuthMode('signin'); setAuthError(null); }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </Modal>

      {/* Delete Account Confirmation */}
      <Modal
        isOpen={showDeleteAccountConfirm}
        onClose={() => setShowDeleteAccountConfirm(false)}
        title="Delete Account"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete your account? This will permanently remove:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>Your account and login credentials</li>
            <li>All cloud-synced data</li>
            <li>All local data on this device</li>
          </ul>
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              onClick={() => setShowDeleteAccountConfirm(false)} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteAccount} 
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={showChangePassword}
        onClose={() => { setShowChangePassword(false); setNewPassword(''); setConfirmPassword(''); }}
        title="Change Password"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (6+ characters)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              onClick={() => { setShowChangePassword(false); setNewPassword(''); setConfirmPassword(''); }} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleChangePassword} 
              disabled={isChangingPassword || !newPassword || !confirmPassword}
              className="flex-1"
            >
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
