/**
 * Centralized Logger Utility
 *
 * Provides consistent logging throughout the application with:
 * - Log level filtering (debug logs hidden in production)
 * - Contextual prefixes for easier debugging
 * - Structured error logging with optional metadata
 *
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.debug('SyncService', 'Starting sync...');
 *   logger.error('SyncService', error, { userId: '123' });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Get the minimum log level based on environment.
 * In production, only warnings and errors are logged.
 * In development, all logs are shown.
 */
function getMinLogLevel(): LogLevel {
  // Vite uses import.meta.env.PROD / import.meta.env.DEV
  if (typeof import.meta !== 'undefined' && import.meta.env?.PROD) {
    return 'warn';
  }
  return 'debug';
}

const minLevel = getMinLogLevel();

/**
 * Check if a log level should be displayed based on current environment.
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

/**
 * Format a timestamp for log output.
 */
function getTimestamp(): string {
  return new Date().toISOString().substring(11, 23); // HH:mm:ss.sss
}

/**
 * Logger object with methods for each log level.
 *
 * Each method takes a context string (typically the module/component name)
 * followed by the message and optional additional arguments.
 */
export const logger = {
  /**
   * Debug-level logging. Hidden in production.
   * Use for verbose development information.
   *
   * @param context - Module or component name
   * @param message - Log message
   * @param args - Additional data to log
   */
  debug(context: string, message: string, ...args: unknown[]): void {
    if (shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.log(`[${getTimestamp()}] [${context}]`, message, ...args);
    }
  },

  /**
   * Info-level logging. Hidden in production.
   * Use for general operational information.
   *
   * @param context - Module or component name
   * @param message - Log message
   * @param args - Additional data to log
   */
  info(context: string, message: string, ...args: unknown[]): void {
    if (shouldLog('info')) {
      // eslint-disable-next-line no-console
      console.info(`[${getTimestamp()}] [${context}]`, message, ...args);
    }
  },

  /**
   * Warning-level logging. Shown in production.
   * Use for recoverable issues or deprecation notices.
   *
   * @param context - Module or component name
   * @param message - Warning message
   * @param args - Additional data to log
   */
  warn(context: string, message: string, ...args: unknown[]): void {
    if (shouldLog('warn')) {
      console.warn(`[${getTimestamp()}] [${context}]`, message, ...args);
    }
  },

  /**
   * Error-level logging. Always shown.
   * Use for errors that need attention.
   *
   * @param context - Module or component name
   * @param message - Error message or Error object
   * @param metadata - Optional structured data about the error
   */
  error(context: string, message: string | Error, metadata?: Record<string, unknown>): void {
    if (shouldLog('error')) {
      const errorMessage = message instanceof Error ? message.message : message;
      const errorStack = message instanceof Error ? message.stack : undefined;

      console.error(`[${getTimestamp()}] [${context}]`, errorMessage);

      if (errorStack) {
        console.error(errorStack);
      }

      if (metadata && Object.keys(metadata).length > 0) {
        console.error('Metadata:', metadata);
      }

      // Future: Send to error tracking service (Sentry, LogRocket, etc.)
      // if (import.meta.env.PROD) {
      //   ErrorTracking.capture(message, { context, ...metadata });
      // }
    }
  },
};

/**
 * Create a scoped logger that automatically includes the context.
 * Useful for modules that make many log calls.
 *
 * @param context - The context to prefix all logs with
 * @returns A logger object with the same methods but context pre-filled
 *
 * @example
 * const log = createScopedLogger('SyncService');
 * log.debug('Starting sync...');
 * log.error(error, { table: 'exercises' });
 */
export function createScopedLogger(context: string) {
  return {
    debug: (message: string, ...args: unknown[]) => logger.debug(context, message, ...args),
    info: (message: string, ...args: unknown[]) => logger.info(context, message, ...args),
    warn: (message: string, ...args: unknown[]) => logger.warn(context, message, ...args),
    error: (message: string | Error, metadata?: Record<string, unknown>) =>
      logger.error(context, message, metadata),
  };
}
