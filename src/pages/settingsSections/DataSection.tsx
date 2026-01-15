import { useState, useRef } from 'react';
import { Download, Upload, Trash2, Wrench } from 'lucide-react';
import { exportData, importData, db } from '@/data/db';
import { createScopedLogger } from '@/utils/logger';
import { ScheduledWorkoutRepo } from '@/data/repositories';
import { useSyncItem } from '@/contexts';
import { Card, CardContent, Button } from '@/components/ui';
import { ClearDataModal } from '@/components/settings';
import type { SettingsSectionProps } from './types';

const log = createScopedLogger('DataSection');

export function DataSection({ setMessage }: SettingsSectionProps) {
  const { deleteItem, hardDeleteItem } = useSyncItem();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
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

  const handleCleanupDuplicates = async () => {
    setIsCleaningDuplicates(true);
    setMessage({ type: 'success', text: '' }); // Clear any previous message
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
          } catch (error) {
            log.error(error as Error);
            failCount++;
          }
        }

        if (failCount > 0) {
          setMessage({
            type: 'success',
            text: `Removed ${deletedIds.length} duplicate(s). ${successCount} synced to cloud, ${failCount} may return on next sync.`,
          });
        } else {
          setMessage({
            type: 'success',
            text: `Removed ${deletedIds.length} duplicate workout(s) and synced to cloud.`,
          });
        }
      } else {
        setMessage({ type: 'success', text: 'No duplicate workouts found.' });
      }
    } catch (error) {
      log.error(error as Error);
      setMessage({ type: 'error', text: 'Failed to cleanup duplicates.' });
    } finally {
      setIsCleaningDuplicates(false);
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
      setMessage({ type: 'success', text: 'All data cleared.' });
    } catch (error) {
      log.error(error as Error);
      setMessage({ type: 'error', text: 'Failed to clear data.' });
    } finally {
      setIsClearing(false);
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

          <p className="text-xs text-gray-500 dark:text-gray-400">Troubleshooting</p>

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

      <ClearDataModal
        isOpen={showClearConfirm}
        isClearing={isClearing}
        onConfirm={handleClearData}
        onClose={() => setShowClearConfirm(false)}
      />
    </>
  );
}
