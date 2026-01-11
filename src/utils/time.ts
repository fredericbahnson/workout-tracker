/**
 * Time Utilities
 * 
 * Functions for formatting and parsing time values.
 */

/**
 * Format seconds to MM:SS display string.
 * 
 * @param seconds - Total seconds
 * @returns Formatted string like "1:30"
 * 
 * @example
 * formatTime(90) // "1:30"
 * formatTime(45) // "0:45"
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parse various time input formats to seconds.
 * 
 * Supported formats:
 * - Pure number: "30" → 30 seconds
 * - Seconds suffix: "30s" → 30 seconds
 * - Minutes suffix: "1m" → 60 seconds
 * - Combined: "1m30s" or "1m 30s" → 90 seconds
 * - Colon format: "1:30" → 90 seconds
 * 
 * @param input - Time string to parse
 * @returns Total seconds, or null if invalid format
 * 
 * @example
 * parseTimeInput("30") // 30
 * parseTimeInput("1m30s") // 90
 * parseTimeInput("1:30") // 90
 * parseTimeInput("invalid") // null
 */
export function parseTimeInput(input: string): number | null {
  const trimmed = input.trim().toLowerCase();
  
  // Try pure number (treat as seconds)
  const pureNum = parseInt(trimmed, 10);
  if (!isNaN(pureNum) && trimmed === String(pureNum)) {
    return pureNum;
  }
  
  // Try "Xs" format
  const secMatch = trimmed.match(/^(\d+)s$/);
  if (secMatch) {
    return parseInt(secMatch[1], 10);
  }
  
  // Try "Xm" format
  const minMatch = trimmed.match(/^(\d+)m$/);
  if (minMatch) {
    return parseInt(minMatch[1], 10) * 60;
  }
  
  // Try "XmYs" format (with optional space)
  const minSecMatch = trimmed.match(/^(\d+)m\s*(\d+)s?$/);
  if (minSecMatch) {
    return parseInt(minSecMatch[1], 10) * 60 + parseInt(minSecMatch[2], 10);
  }
  
  // Try "X:YY" format
  const colonMatch = trimmed.match(/^(\d+):(\d{1,2})$/);
  if (colonMatch) {
    return parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);
  }
  
  return null;
}

/**
 * Format seconds to comprehensive duration string.
 * 
 * @param totalSeconds - Total seconds to format
 * @returns Formatted string like "2d 3h 45m 30s"
 * 
 * @example
 * formatDuration(90) // "1m 30s"
 * formatDuration(3661) // "1h 1m 1s"
 * formatDuration(0) // "0s"
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds === 0) return '0s';
  
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  
  return parts.join(' ');
}
