import { describe, expect, it } from 'vitest';
import { rowsToDailyLogs, type MealRow } from '@/lib/dailyLogMapper';

function row(overrides: Partial<MealRow> = {}): MealRow {
  return {
    id: 'r1',
    meal_type: 'lunch',
    photo_path: null,
    user_note: null,
    food_name: 'Rice bowl',
    description: null,
    calories: 500,
    protein: 20,
    carbs: 80,
    fat: 12,
    confidence: 'medium',
    logged_at: '2026-08-26T12:30:00.000Z',
    ...overrides,
  };
}

describe('rowsToDailyLogs', () => {
  it('creates an empty log for every requested date', () => {
    const byDate = rowsToDailyLogs([], ['2026-08-25', '2026-08-26'], {});
    expect([...byDate.keys()]).toEqual(['2026-08-25', '2026-08-26']);
    expect(byDate.get('2026-08-25')).toMatchObject({ meals: [], totalCalories: 0 });
  });

  it('sums macro totals per day', () => {
    const date = '2026-08-26';
    const localNoon = new Date(2026, 7, 26, 12, 0, 0).toISOString();
    const byDate = rowsToDailyLogs(
      [
        row({ id: 'a', logged_at: localNoon, calories: 500, protein: 20, carbs: 80, fat: 12 }),
        row({ id: 'b', logged_at: localNoon, calories: 300, protein: 10, carbs: 40, fat: 8 }),
      ],
      [date],
      {}
    );
    const log = byDate.get(date)!;
    expect(log.meals).toHaveLength(2);
    expect(log.totalCalories).toBe(800);
    expect(log.totalProtein).toBe(30);
    expect(log.totalCarbs).toBe(120);
    expect(log.totalFat).toBe(20);
  });

  it('drops rows whose local day is not in the requested range', () => {
    const localNoon = new Date(2026, 7, 20, 12, 0, 0).toISOString();
    const byDate = rowsToDailyLogs([row({ logged_at: localNoon })], ['2026-08-26'], {});
    expect(byDate.get('2026-08-26')!.meals).toHaveLength(0);
  });

  it('resolves a photo path through the signed-url map, blank when absent', () => {
    const localNoon = new Date(2026, 7, 26, 12, 0, 0).toISOString();
    const withPhoto = rowsToDailyLogs(
      [row({ photo_path: 'user/1.jpg', logged_at: localNoon })],
      ['2026-08-26'],
      { 'user/1.jpg': 'https://signed.example/1.jpg' }
    );
    expect(withPhoto.get('2026-08-26')!.meals[0].photoUri).toBe('https://signed.example/1.jpg');

    const missing = rowsToDailyLogs(
      [row({ photo_path: 'user/2.jpg', logged_at: localNoon })],
      ['2026-08-26'],
      {}
    );
    expect(missing.get('2026-08-26')!.meals[0].photoUri).toBe('');
  });

  it('coalesces null note/description to empty strings', () => {
    const localNoon = new Date(2026, 7, 26, 12, 0, 0).toISOString();
    const byDate = rowsToDailyLogs(
      [row({ user_note: null, description: null, logged_at: localNoon })],
      ['2026-08-26'],
      {}
    );
    const meal = byDate.get('2026-08-26')!.meals[0];
    expect(meal.userNote).toBe('');
    expect(meal.description).toBe('');
  });
});
