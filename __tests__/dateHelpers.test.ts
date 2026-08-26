import { describe, expect, it } from 'vitest';
import {
  formatDateKey,
  getDayOfTraining,
  getLastNDays,
  parseDateKey,
} from '@/utils/dateHelpers';

describe('formatDateKey / parseDateKey', () => {
  it('formats a date as YYYY-MM-DD in local time', () => {
    expect(formatDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(formatDateKey(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('round-trips a key through parse and format', () => {
    for (const key of ['2026-01-01', '2026-08-26', '2026-12-31', '2024-02-29']) {
      expect(formatDateKey(parseDateKey(key))).toBe(key);
    }
  });

  it('parses to local midnight, not UTC', () => {
    const d = parseDateKey('2026-08-26');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7);
    expect(d.getDate()).toBe(26);
    expect(d.getHours()).toBe(0);
  });
});

describe('getLastNDays', () => {
  it('returns n keys, newest first, ending today', () => {
    const days = getLastNDays(7);
    expect(days).toHaveLength(7);
    expect(days[0]).toBe(formatDateKey(new Date()));
  });

  it('produces strictly descending, contiguous days', () => {
    const days = getLastNDays(5);
    for (let i = 1; i < days.length; i++) {
      const prev = parseDateKey(days[i - 1]).getTime();
      const cur = parseDateKey(days[i]).getTime();
      expect(prev - cur).toBe(86_400_000);
    }
  });
});

describe('getDayOfTraining', () => {
  it('counts the install day as day 1', () => {
    const today = new Date();
    expect(getDayOfTraining(today.toISOString())).toBe(1);
  });

  it('counts a week later as day 8', () => {
    const weekAgo = new Date(Date.now() - 7 * 86_400_000);
    expect(getDayOfTraining(weekAgo.toISOString())).toBe(8);
  });
});
