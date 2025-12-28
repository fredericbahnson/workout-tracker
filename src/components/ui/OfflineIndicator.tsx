import { WifiOff, RefreshCw, CloudOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks';
import { useEffect, useState } from 'react';
import { useSync } from '../../contexts';

export function OfflineIndicator() {
  const { isOnline, wasOffline, clearWasOffline } = useOnlineStatus();
  const { queueCount } = useSync();
  const [showReconnected, setShowReconnected] = useState(false);

  // Show "reconnected" message briefly when coming back online
  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        clearWasOffline();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, clearWasOffline]);

  // Show pending changes indicator when online but have queued items
  if (isOnline && !showReconnected && queueCount > 0) {
    return (
      <div className="bg-blue-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm">
        <CloudOff className="w-4 h-4" />
        <span>{queueCount} change{queueCount !== 1 ? 's' : ''} pending sync</span>
      </div>
    );
  }

  if (isOnline && !showReconnected) {
    return null;
  }

  if (showReconnected) {
    return (
      <div className="bg-green-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm">
        <RefreshCw className="w-4 h-4" />
        <span>Back online — syncing...</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm">
      <WifiOff className="w-4 h-4" />
      <span>You're offline — changes saved locally</span>
    </div>
  );
}
