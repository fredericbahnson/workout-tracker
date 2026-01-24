import { useState, useRef } from 'react';
import { Download, Upload, Trash2, RotateCcw, UserX } from 'lucide-react';
import { exportData, importData, db } from '@/data/db';
import { createScopedLogger } from '@/utils/logger';
import { useAuth, useSyncItem } from '@/contexts';
import { Card, CardContent, Button } from '@/components/ui';
import { ClearDataModal, ClearHistoryModal, DeleteAccountModal } from '@/components/settings';
import type { SettingsSectionProps } from './types';

const log = createScopedLogger('DataSection');

export function DataSection({ setMessage }: SettingsSectionProps) {
  const { user, deleteAccount } = useAuth();
  const { hardDeleteItem } = useSyncItem();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setMessage({ type: 'success', text: '' }); // Clear any previous message
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
      log.error(error as Error);
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
    setMessage({ type: 'success', text: '' }); // Clear any previous message
    try {
      const text = await file.text();
      const result = await importData(text);
      if (result.success) {
        setMessage({ type: 'success', text: 'Backup imported successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to import backup.' });
      }
    } catch (error) {
      log.error(error as Error);
      setMessage({ type: 'error', text: 'Failed to read backup file.' });
    } finally {
      setIsImporting(false);
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      // Clear all tables instead of deleting database (which can cause issues)
      await db.transaction(
        'rw',
        [db.exercises, db.maxRecords, db.completedSets, db.cycles, db.scheduledWorkouts],
        async () => {
          await db.exercises.clear();
          await db.maxRecords.clear();
          await db.completedSets.clear();
          await db.cycles.clear();
          await db.scheduledWorkouts.clear();
        }
      );
      setShowClearConfirm(false);
      setMessage({ type: 'success', text: 'All app data cleared.' });
    } catch (error) {
      log.error(error as Error);
      setMessage({ type: 'error', text: 'Failed to clear data.' });
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAccount();
      if (result.error) {
        setMessage({ type: 'error', text: `Failed to delete account: ${result.error.message}` });
      } else {
        setMessage({ type: 'success', text: 'Account and all data deleted successfully.' });
      }
    } catch (error) {
      log.error(error as Error);
      setMessage({ type: 'error', text: 'Failed to delete account.' });
    } finally {
      setIsDeleting(false);
      setShowDeleteAccountConfirm(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Data Management</h3>

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

          <p className="text-xs text-gray-500 dark:text-gray-400">Danger Zone</p>

          <Button
            variant="ghost"
            className="w-full justify-start text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
            onClick={() => setShowClearHistoryConfirm(true)}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear Workout History
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
            onClick={() => setShowClearConfirm(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All App Data
          </Button>

          {user && (
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={() => setShowDeleteAccountConfirm(true)}
            >
              <UserX className="w-4 h-4 mr-2" />
              Delete Account and All Data
            </Button>
          )}
        </CardContent>
      </Card>

      <ClearHistoryModal
        isOpen={showClearHistoryConfirm}
        isClearing={isClearingHistory}
        onConfirm={handleClearHistory}
        onClose={() => setShowClearHistoryConfirm(false)}
      />

      <ClearDataModal
        isOpen={showClearConfirm}
        isClearing={isClearing}
        onConfirm={handleClearData}
        onClose={() => setShowClearConfirm(false)}
      />

      <DeleteAccountModal
        isOpen={showDeleteAccountConfirm}
        isDeleting={isDeleting}
        onConfirm={handleDeleteAccount}
        onClose={() => setShowDeleteAccountConfirm(false)}
      />
    </>
  );
}
