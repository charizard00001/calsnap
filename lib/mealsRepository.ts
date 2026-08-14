import type { DailyLog, MealEntry } from '@/types';
import { formatDateKey, parseDateKey } from '@/utils/dateHelpers';
import { getAllLocalMeals, getDailyLog, setDailyLog } from '@/utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// Mutations write through to AsyncStorage first (instant, offline-safe),
// then push to Supabase in the background. Reads prefer Supabase when
// reachable — the source of truth for a second device — falling back to
// the AsyncStorage cache when offline or signed out.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MIGRATION_FLAG_KEY = 'supabase_meals_migrated';
// Signed URLs get written into the AsyncStorage day-log cache, so the TTL
// doubles as "how long cached meal photos keep working offline". At one
// hour, any meal older than that showed a broken image. A week covers
// realistic offline gaps; online reads re-sign on every refetch anyway.
const PHOTO_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

interface MealRow {
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

async function signedPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage
    .from('meal-photos')
    .createSignedUrls(paths, PHOTO_URL_TTL_SECONDS);
  if (error || !data) return {};

  const map: Record<string, string> = {};
  for (const entry of data) {
    if (entry.signedUrl && !entry.error) map[entry.path ?? ''] = entry.signedUrl;
  }
  return map;
}

function rowsToDailyLogs(rows: MealRow[], dates: string[], photoUrls: Record<string, string>): Map<string, DailyLog> {
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

async function uploadMealPhoto(userId: string, meal: MealEntry): Promise<string | null> {
  try {
    const response = await fetch(meal.photoUri);
    const arrayBuffer = await response.arrayBuffer();
    const path = `${userId}/${meal.id}.jpg`;

    const { error } = await supabase.storage
      .from('meal-photos')
      .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

    if (error) throw error;
    return path;
  } catch {
    return null;
  }
}

export async function syncMealToSupabase(meal: MealEntry): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return;

  const photoPath = await uploadMealPhoto(userId, meal);

  await supabase.from('meals').insert({
    id: meal.id,
    user_id: userId,
    meal_type: meal.mealType,
    photo_path: photoPath,
    user_note: meal.userNote,
    food_name: meal.foodName,
    description: meal.description,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    confidence: meal.confidence,
    logged_at: meal.timestamp,
  });
}

export async function deleteMealFromSupabase(mealId: string): Promise<void> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;

  await supabase.from('meals').delete().eq('id', mealId);
}

// Supabase is the source of truth since the TanStack Query migration, so
// clearing only the local cache does nothing lasting — the next refetch
// pulls the rows straight back. These delete remotely first, then locally.

export async function deleteMealsForDate(date: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;

  const dayStart = parseDateKey(date).toISOString();
  const dayEnd = new Date(parseDateKey(date).getTime() + 86_400_000).toISOString();

  const { data: rows } = await supabase
    .from('meals')
    .select('photo_path')
    .eq('user_id', userId)
    .gte('logged_at', dayStart)
    .lt('logged_at', dayEnd);

  await removeStoredPhotos(rows);

  await supabase
    .from('meals')
    .delete()
    .eq('user_id', userId)
    .gte('logged_at', dayStart)
    .lt('logged_at', dayEnd);
}

export async function deleteAllMealsFromSupabase(): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;

  const { data: rows } = await supabase
    .from('meals')
    .select('photo_path')
    .eq('user_id', userId);

  await removeStoredPhotos(rows);

  await supabase.from('meals').delete().eq('user_id', userId);

  // A wiped account shouldn't have the old local log re-uploaded by the
  // first-sign-in migration, so drop its "already migrated" flag guard.
  await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
}

async function removeStoredPhotos(rows: { photo_path: string | null }[] | null) {
  const paths = (rows ?? []).map((r) => r.photo_path).filter((p): p is string => !!p);
  if (paths.length === 0) return;
  await supabase.storage.from('meal-photos').remove(paths);
}

// One-time push of pre-existing local meals (from before an account
// existed) up to Supabase, so signing in doesn't silently strand a
// returning local-only user's history. Only runs when the account has no
// remote meals yet, so it never clobbers a second device's real data.
export async function migrateLocalMealsToSupabase(): Promise<void> {
  const alreadyMigrated = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
  if (alreadyMigrated) return;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;

  const { count } = await supabase
    .from('meals')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (count && count > 0) {
    await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    return;
  }

  const localMeals = await getAllLocalMeals();
  for (const meal of localMeals) {
    if (!UUID_RE.test(meal.id)) continue; // pre-dates UUID ids; leave local-only
    await syncMealToSupabase(meal).catch(() => {});
  }

  await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
}

// Fetches meals for `dates` from Supabase in a single query, buckets them
// by local day, and refreshes the AsyncStorage cache for each day. Falls
// back to whatever's cached locally when signed out or offline.
export async function fetchDailyLogsRange(dates: string[]): Promise<DailyLog[]> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId || dates.length === 0) {
    return Promise.all(dates.map(getDailyLog));
  }

  const sorted = [...dates].sort();
  const rangeStart = parseDateKey(sorted[0]).toISOString();
  const rangeEnd = new Date(parseDateKey(sorted[sorted.length - 1]).getTime() + 86_400_000).toISOString();

  const { data: rows, error } = await supabase
    .from('meals')
    .select('id, meal_type, photo_path, user_note, food_name, description, calories, protein, carbs, fat, confidence, logged_at')
    .eq('user_id', userId)
    .gte('logged_at', rangeStart)
    .lt('logged_at', rangeEnd);

  if (error || !rows) {
    return Promise.all(dates.map(getDailyLog));
  }

  const paths = rows.map((r) => r.photo_path).filter((p): p is string => !!p);
  const photoUrls = await signedPhotoUrls(paths);
  const byDate = rowsToDailyLogs(rows as MealRow[], dates, photoUrls);

  await Promise.all(dates.map((date) => setDailyLog(date, byDate.get(date)!)));
  return dates.map((date) => byDate.get(date)!);
}

export async function fetchDailyLog(date: string): Promise<DailyLog> {
  const [log] = await fetchDailyLogsRange([date]);
  return log;
}
