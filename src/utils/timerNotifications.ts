import { Capacitor } from '@capacitor/core';
import { createScopedLogger } from './logger';

const log = createScopedLogger('TimerNotifications');

let nextNotificationId = 1;

/**
 * Schedule a local notification for timer completion.
 *
 * On native (Capacitor): uses @capacitor/local-notifications.
 * On web: uses the Notification API if permission is granted.
 *
 * @returns Notification ID for cancellation, or null if scheduling failed
 */
export async function scheduleTimerNotification(
  durationSeconds: number,
  title: string,
  body: string
): Promise<number | null> {
  const id = nextNotificationId++;

  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      // Request permission lazily
      const permResult = await LocalNotifications.requestPermissions();
      if (permResult.display !== 'granted') {
        log.debug('Notification permission not granted');
        return null;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            schedule: {
              at: new Date(Date.now() + durationSeconds * 1000),
            },
          },
        ],
      });

      log.debug('Scheduled native notification', { id, durationSeconds });
      return id;
    } catch (e) {
      log.debug('Failed to schedule native notification', { error: e });
      return null;
    }
  }

  // Web fallback using Notification API
  if ('Notification' in window) {
    try {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      if (Notification.permission === 'granted') {
        const timeoutId = window.setTimeout(() => {
          new Notification(title, { body });
        }, durationSeconds * 1000);

        // Store timeout ID using the notification ID for cancellation
        webNotificationTimeouts.set(id, timeoutId);
        log.debug('Scheduled web notification', { id, durationSeconds });
        return id;
      }
    } catch (e) {
      log.debug('Failed to schedule web notification', { error: e });
    }
  }

  return null;
}

// Track web notification timeouts for cancellation
const webNotificationTimeouts = new Map<number, number>();

/**
 * Cancel a previously scheduled notification.
 */
export async function cancelTimerNotification(id: number): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.cancel({ notifications: [{ id }] });
      log.debug('Cancelled native notification', { id });
    } catch (e) {
      log.debug('Failed to cancel native notification', { error: e });
    }
    return;
  }

  // Web fallback
  const timeoutId = webNotificationTimeouts.get(id);
  if (timeoutId !== undefined) {
    clearTimeout(timeoutId);
    webNotificationTimeouts.delete(id);
    log.debug('Cancelled web notification', { id });
  }
}
