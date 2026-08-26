import type { DailyLog, MealEntry } from '@/types';
import { formatDateKey } from '@/utils/dateHelpers';

// Pure row → DailyLog mapping, split out of mealsRepository so it can be
// unit-tested without the Supabase client (and everything it drags in).

export interface MealRow {
  id: string;
  meal_type: MealEntry['mealType'];
  photo_path: string | null;
  user_note: string | null;
  food_name: string;
  description: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: MealEntry['confidence'];
  logged_at: string;
}

/**
 * Buckets meal rows into one DailyLog per requested date (local time),
 * resolving each row's photo via the pre-signed `photoUrls` map and
 * accumulating the day's macro totals. Rows whose local day falls outside
 * `dates` are dropped.
 */
export function rowsToDailyLogs(
  rows: MealRow[],
  dates: string[],
  photoUrls: Record<string, string>
): Map<string, DailyLog> {
  const byDate = new Map<string, DailyLog>(
    dates.map((date) => [
      date,
      { date, meals: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
    ])
  );

  for (const row of rows) {
    const date = formatDateKey(new Date(row.logged_at));
    const log = byDate.get(date);
    if (!log) continue; // outside the requested range

    log.meals.push({
      id: row.id,
      timestamp: row.logged_at,
      mealType: row.meal_type,
      photoUri: row.photo_path ? photoUrls[row.photo_path] ?? '' : '',
      userNote: row.user_note ?? '',
      foodName: row.food_name,
      description: row.description ?? '',
      calories: row.calories,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
      confidence: row.confidence,
    });
    log.totalCalories += row.calories;
    log.totalProtein += row.protein;
    log.totalCarbs += row.carbs;
    log.totalFat += row.fat;
  }

  return byDate;
}
