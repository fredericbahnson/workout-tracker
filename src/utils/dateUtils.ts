/**
 * Date Utilities
 * 
 * Consistent date handling throughout the application.
 * 
 * Problem: IndexedDB can store Date objects, but they may get serialized to strings
 * during certain operations or when data passes through JSON serialization boundaries.
 * This causes inconsistent behavior where sometimes dates are Date objects and 
 * sometimes they're ISO strings.
 * 
 * Solution: These utilities ensure we always work with proper Date objects internally
 * and handle the conversion consistently.
 */

/**
 * Type representing a date that could be either a Date object or an ISO string.
 * Used for input parameters where we need to handle both cases.
 */
export type DateLike = Date | string;

/**
 * Ensures a value is a Date object.
 * Handles: Date objects, ISO strings, timestamps, null/undefined.
 * 
 * @param value - The value to convert to a Date
 * @returns A Date object, or undefined if the input is null/undefined
 * @throws Error if the value cannot be converted to a valid date
 * 
 * @example
 * toDate(new Date()) // Returns the same Date
 * toDate('2024-01-15T10:30:00.000Z') // Returns new Date('2024-01-15T10:30:00.000Z')
 * toDate(undefined) // Returns undefined
 */
export function toDate(value: DateLike | null | undefined): Date | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  
  if (value instanceof Date) {
    return value;
  }
  
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date string: ${value}`);
    }
    return parsed;
  }
  
  throw new Error(`Cannot convert to date: ${typeof value}`);
}

/**
 * Ensures a value is a Date object, with a required return type.
 * Throws if the value is null/undefined.
 * 
 * @param value - The value to convert to a Date
 * @returns A Date object
 * @throws Error if the value is null/undefined or invalid
 */
export function toDateRequired(value: DateLike | null | undefined): Date {
  const result = toDate(value);
  if (result === undefined) {
    throw new Error('Date value is required but was null or undefined');
  }
  return result;
}

/**
 * Safely converts a date to an ISO string.
 * Handles both Date objects and strings (passes through valid ISO strings).
 * 
 * @param value - The date value to convert
 * @returns An ISO string representation
 */
export function toISOString(value: DateLike): string {
  if (typeof value === 'string') {
    // Validate it's a valid date string by parsing and reformatting
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date string: ${value}`);
    }
    return parsed.toISOString();
  }
  
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  throw new Error(`Cannot convert to ISO string: ${typeof value}`);
}

/**
 * Compares two dates and returns which is more recent.
 * Handles both Date objects and ISO strings.
 * 
 * @returns negative if a < b, positive if a > b, 0 if equal
 */
export function compareDates(a: DateLike, b: DateLike): number {
  const dateA = toDateRequired(a);
  const dateB = toDateRequired(b);
  return dateA.getTime() - dateB.getTime();
}

/**
 * Checks if date a is after date b.
 */
export function isAfter(a: DateLike, b: DateLike): boolean {
  return compareDates(a, b) > 0;
}

/**
 * Checks if date a is before date b.
 */
export function isBefore(a: DateLike, b: DateLike): boolean {
  return compareDates(a, b) < 0;
}

/**
 * Gets the start of a day (midnight) for a given date.
 */
export function startOfDay(value: DateLike): Date {
  const date = toDateRequired(value);
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Gets the end of a day (23:59:59.999) for a given date.
 */
export function endOfDay(value: DateLike): Date {
  const date = toDateRequired(value);
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Checks if two dates are on the same calendar day.
 */
export function isSameDay(a: DateLike, b: DateLike): boolean {
  const dateA = toDateRequired(a);
  const dateB = toDateRequired(b);
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

/**
 * Adds days to a date.
 */
export function addDays(value: DateLike, days: number): Date {
  const date = toDateRequired(value);
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Creates a new Date for the current moment.
 * Centralized for consistency and easier testing.
 */
export function now(): Date {
  return new Date();
}

/**
 * Formats a date for display (localized).
 */
export function formatDate(value: DateLike, options?: Intl.DateTimeFormatOptions): string {
  const date = toDateRequired(value);
  return date.toLocaleDateString(undefined, options);
}

/**
 * Formats a date and time for display (localized).
 */
export function formatDateTime(value: DateLike, options?: Intl.DateTimeFormatOptions): string {
  const date = toDateRequired(value);
  return date.toLocaleString(undefined, options);
}

/**
 * Gets a relative time description (e.g., "2 days ago", "in 3 hours").
 */
export function getRelativeTime(value: DateLike): string {
  const date = toDateRequired(value);
  const nowDate = now();
  const diffMs = nowDate.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) {
    return formatDate(date);
  } else if (diffDays > 1) {
    return `${diffDays} days ago`;
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffHours > 1) {
    return `${diffHours} hours ago`;
  } else if (diffHours === 1) {
    return '1 hour ago';
  } else if (diffMinutes > 1) {
    return `${diffMinutes} minutes ago`;
  } else if (diffMinutes === 1) {
    return '1 minute ago';
  } else {
    return 'just now';
  }
}

/**
 * Normalizes a record's date fields from potential strings to Date objects.
 * This is a generic helper for repository use.
 * 
 * @param record - The record to normalize
 * @param dateFields - Array of field names that should be dates
 * @returns The record with date fields normalized to Date objects
 */
export function normalizeDates<T>(
  record: T,
  dateFields: (keyof T)[]
): T {
  const result = { ...record };
  
  for (const field of dateFields) {
    const value = result[field];
    if (value !== null && value !== undefined) {
      // Type assertion needed because we're dynamically setting fields
      (result as Record<string, unknown>)[field as string] = toDate(value as unknown as DateLike);
    }
  }
  
  return result;
}

/**
 * Normalizes an array of records' date fields.
 */
export function normalizeDatesArray<T>(
  records: T[],
  dateFields: (keyof T)[]
): T[] {
  return records.map(record => normalizeDates(record, dateFields));
}
