import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  toDate,
  toDateRequired,
  toISOString,
  compareDates,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
  isSameDay,
  addDays,
  now,
  formatDate,
  getRelativeTime,
  normalizeDates,
  normalizeDatesArray,
} from './dateUtils';

describe('dateUtils', () => {
  describe('toDate', () => {
    it('returns undefined for null', () => {
      expect(toDate(null)).toBeUndefined();
    });

    it('returns undefined for undefined', () => {
      expect(toDate(undefined)).toBeUndefined();
    });

    it('returns the same Date object for Date input', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      expect(toDate(date)).toBe(date);
    });

    it('converts ISO string to Date', () => {
      const isoString = '2024-01-15T10:30:00.000Z';
      const result = toDate(isoString);
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe(isoString);
    });

    it('converts date string without timezone to Date', () => {
      const dateString = '2024-01-15';
      const result = toDate(dateString);
      expect(result).toBeInstanceOf(Date);
      // Use UTC methods since date-only strings are parsed as UTC
      expect(result?.getUTCFullYear()).toBe(2024);
      expect(result?.getUTCMonth()).toBe(0); // January is 0
      expect(result?.getUTCDate()).toBe(15);
    });

    it('throws for invalid date string', () => {
      expect(() => toDate('not-a-date')).toThrow('Invalid date string');
    });
  });

  describe('toDateRequired', () => {
    it('throws for null', () => {
      expect(() => toDateRequired(null)).toThrow('Date value is required');
    });

    it('throws for undefined', () => {
      expect(() => toDateRequired(undefined)).toThrow('Date value is required');
    });

    it('returns Date for valid input', () => {
      const isoString = '2024-01-15T10:30:00.000Z';
      const result = toDateRequired(isoString);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe(isoString);
    });
  });

  describe('toISOString', () => {
    it('converts Date to ISO string', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      expect(toISOString(date)).toBe('2024-01-15T10:30:00.000Z');
    });

    it('normalizes and returns valid ISO string', () => {
      const isoString = '2024-01-15T10:30:00.000Z';
      expect(toISOString(isoString)).toBe(isoString);
    });

    it('throws for invalid date string', () => {
      expect(() => toISOString('invalid')).toThrow('Invalid date string');
    });
  });

  describe('compareDates', () => {
    it('returns negative when a < b', () => {
      const a = '2024-01-14T00:00:00.000Z';
      const b = '2024-01-15T00:00:00.000Z';
      expect(compareDates(a, b)).toBeLessThan(0);
    });

    it('returns positive when a > b', () => {
      const a = '2024-01-16T00:00:00.000Z';
      const b = '2024-01-15T00:00:00.000Z';
      expect(compareDates(a, b)).toBeGreaterThan(0);
    });

    it('returns 0 when dates are equal', () => {
      const a = '2024-01-15T00:00:00.000Z';
      const b = new Date('2024-01-15T00:00:00.000Z');
      expect(compareDates(a, b)).toBe(0);
    });

    it('works with mixed Date and string inputs', () => {
      const dateObj = new Date('2024-01-15T00:00:00.000Z');
      const isoString = '2024-01-14T00:00:00.000Z';
      expect(compareDates(dateObj, isoString)).toBeGreaterThan(0);
    });
  });

  describe('isAfter', () => {
    it('returns true when a is after b', () => {
      expect(isAfter('2024-01-16T00:00:00.000Z', '2024-01-15T00:00:00.000Z')).toBe(true);
    });

    it('returns false when a is before b', () => {
      expect(isAfter('2024-01-14T00:00:00.000Z', '2024-01-15T00:00:00.000Z')).toBe(false);
    });

    it('returns false when dates are equal', () => {
      expect(isAfter('2024-01-15T00:00:00.000Z', '2024-01-15T00:00:00.000Z')).toBe(false);
    });
  });

  describe('isBefore', () => {
    it('returns true when a is before b', () => {
      expect(isBefore('2024-01-14T00:00:00.000Z', '2024-01-15T00:00:00.000Z')).toBe(true);
    });

    it('returns false when a is after b', () => {
      expect(isBefore('2024-01-16T00:00:00.000Z', '2024-01-15T00:00:00.000Z')).toBe(false);
    });

    it('returns false when dates are equal', () => {
      expect(isBefore('2024-01-15T00:00:00.000Z', '2024-01-15T00:00:00.000Z')).toBe(false);
    });
  });

  describe('startOfDay', () => {
    it('returns midnight of the same day', () => {
      const date = new Date('2024-01-15T14:30:45.123Z');
      const result = startOfDay(date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('works with ISO string input', () => {
      const result = startOfDay('2024-01-15T14:30:45.123Z');
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });
  });

  describe('endOfDay', () => {
    it('returns 23:59:59.999 of the same day', () => {
      const date = new Date('2024-01-15T14:30:45.123Z');
      const result = endOfDay(date);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });
  });

  describe('isSameDay', () => {
    it('returns true for same day different times', () => {
      const a = new Date('2024-01-15T08:00:00.000Z');
      const b = new Date('2024-01-15T20:00:00.000Z');
      expect(isSameDay(a, b)).toBe(true);
    });

    it('returns false for different days', () => {
      const a = new Date('2024-01-15T00:00:00.000Z');
      const b = new Date('2024-01-16T00:00:00.000Z');
      expect(isSameDay(a, b)).toBe(false);
    });

    it('works with mixed inputs', () => {
      expect(isSameDay('2024-01-15T08:00:00.000Z', new Date('2024-01-15T20:00:00.000Z'))).toBe(
        true
      );
    });
  });

  describe('addDays', () => {
    it('adds positive days', () => {
      const date = new Date('2024-01-15T10:00:00.000Z');
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(20);
    });

    it('subtracts negative days', () => {
      const date = new Date('2024-01-15T10:00:00.000Z');
      const result = addDays(date, -5);
      expect(result.getDate()).toBe(10);
    });

    it('handles month boundaries', () => {
      const date = new Date('2024-01-30T10:00:00.000Z');
      const result = addDays(date, 5);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(4);
    });
  });

  describe('now', () => {
    it('returns current time', () => {
      const before = Date.now();
      const result = now();
      const after = Date.now();

      expect(result.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe('formatDate', () => {
    it('formats date with default options', () => {
      const date = new Date('2024-01-15T10:00:00.000Z');
      const result = formatDate(date);
      // Result depends on locale, just verify it returns a string
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('accepts custom options', () => {
      const date = new Date('2024-01-15T10:00:00.000Z');
      const result = formatDate(date, { year: 'numeric', month: 'long', day: 'numeric' });
      expect(result).toContain('2024');
      expect(result).toContain('15');
    });
  });

  describe('getRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns "just now" for recent times', () => {
      const date = new Date('2024-01-15T11:59:45.000Z'); // 15 seconds ago
      expect(getRelativeTime(date)).toBe('just now');
    });

    it('returns "X minutes ago" for minutes', () => {
      const date = new Date('2024-01-15T11:55:00.000Z'); // 5 minutes ago
      expect(getRelativeTime(date)).toBe('5 minutes ago');
    });

    it('returns "X hours ago" for hours', () => {
      const date = new Date('2024-01-15T09:00:00.000Z'); // 3 hours ago
      expect(getRelativeTime(date)).toBe('3 hours ago');
    });

    it('returns "yesterday" for 1 day ago', () => {
      const date = new Date('2024-01-14T12:00:00.000Z'); // 1 day ago
      expect(getRelativeTime(date)).toBe('yesterday');
    });

    it('returns "X days ago" for multiple days', () => {
      const date = new Date('2024-01-10T12:00:00.000Z'); // 5 days ago
      expect(getRelativeTime(date)).toBe('5 days ago');
    });
  });

  describe('normalizeDates', () => {
    it('converts string dates to Date objects', () => {
      const record = {
        id: '1',
        name: 'Test',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-16T10:00:00.000Z',
      };

      const result = normalizeDates(record, ['createdAt', 'updatedAt']);

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect((result.createdAt as Date).toISOString()).toBe('2024-01-15T10:00:00.000Z');
    });

    it('leaves non-date fields unchanged', () => {
      const record = {
        id: '1',
        name: 'Test',
        createdAt: '2024-01-15T10:00:00.000Z',
      };

      const result = normalizeDates(record, ['createdAt']);

      expect(result.id).toBe('1');
      expect(result.name).toBe('Test');
    });

    it('handles null/undefined date fields', () => {
      const record = {
        id: '1',
        createdAt: null,
        updatedAt: undefined,
      };

      const result = normalizeDates(record, ['createdAt', 'updatedAt']);

      expect(result.createdAt).toBeNull();
      expect(result.updatedAt).toBeUndefined();
    });

    it('preserves existing Date objects', () => {
      const existingDate = new Date('2024-01-15T10:00:00.000Z');
      const record = {
        id: '1',
        createdAt: existingDate,
      };

      const result = normalizeDates(record, ['createdAt']);

      expect(result.createdAt).toBeInstanceOf(Date);
      expect((result.createdAt as unknown as Date).toISOString()).toBe(existingDate.toISOString());
    });
  });

  describe('normalizeDatesArray', () => {
    it('normalizes dates in all records', () => {
      const records = [
        { id: '1', createdAt: '2024-01-15T10:00:00.000Z' },
        { id: '2', createdAt: '2024-01-16T10:00:00.000Z' },
      ];

      const result = normalizeDatesArray(records, ['createdAt']);

      expect(result).toHaveLength(2);
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[1].createdAt).toBeInstanceOf(Date);
    });

    it('returns empty array for empty input', () => {
      const result = normalizeDatesArray([], ['createdAt']);
      expect(result).toEqual([]);
    });
  });
});
