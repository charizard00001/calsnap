import type { DailyLog, MealEntry } from '@/types';
import { parseDateKey } from '@/utils/dateHelpers';
import { getAllLocalMeals, getDailyLog, setDailyLog } from '@/utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';
import { getCurrentUserId } from './currentUser';
import { getPendingIds, markSynced } from './pendingMeals';
import { rowsToDailyLogs, type MealRow } from './dailyLogMapper';
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

/** Downscale to 1280px JPEG for storage; falls back to the original on error. */
async function compressForUpload(uri: string): Promise<string> {
  try {
    const out = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1280 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return out.uri;
  } catch {
    return uri;
  }
}

async function uploadMealPhoto(userId: string, meal: MealEntry): Promise<string | null> {
  try {
    // The picker hands back a full-resolution frame — several megabytes on a
    // modern phone, and uploading that was the slowest thing in the whole
    // logging flow. A 1280px JPEG is far more than the card and the
    // full-screen viewer ever display.
    const compressed = await compressForUpload(meal.photoUri);
    const response = await fetch(compressed);
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

/**
 * Pushes a newly logged meal up.
 *
 * The row goes in FIRST, on its own, and the photo follows. It used to be the
 * other way round — the insert waited on a multi-megabyte upload, so for five
 * to fifteen seconds the meal existed only on the device. Any refetch in that
 * window came back without it, which is what made a just-logged meal appear,
 * vanish, and then come back.
 */
export async function syncMealToSupabase(meal: MealEntry): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const { error } = await supabase.from('meals').insert({
    id: meal.id,
    user_id: userId,
    meal_type: meal.mealType,
    photo_path: null,
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
  if (error) return;

  markSynced(meal.id);

  if (!meal.photoUri) return;
  const photoPath = await uploadMealPhoto(userId, meal);
  if (photoPath) {
    await supabase.from('meals').update({ photo_path: photoPath }).eq('id', meal.id);
  }
}

export async function updateMealInSupabase(
  mealId: string,
  updates: Partial<Pick<MealEntry, 'foodName' | 'calories' | 'protein' | 'carbs' | 'fat' | 'mealType' | 'userNote'>>
): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const row: Record<string, unknown> = {};
  if (updates.foodName !== undefined) row.food_name = updates.foodName;
  if (updates.calories !== undefined) row.calories = updates.calories;
  if (updates.protein !== undefined) row.protein = updates.protein;
  if (updates.carbs !== undefined) row.carbs = updates.carbs;
  if (updates.fat !== undefined) row.fat = updates.fat;
  if (updates.mealType !== undefined) row.meal_type = updates.mealType;
  if (updates.userNote !== undefined) row.user_note = updates.userNote;

  await supabase.from('meals').update(row).eq('id', mealId);
}

export async function deleteMealFromSupabase(mealId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  await supabase.from('meals').delete().eq('id', mealId);
}

// Supabase is the source of truth since the TanStack Query migration, so
// clearing only the local cache does nothing lasting — the next refetch
// pulls the rows straight back. These delete remotely first, then locally.

export async function deleteMealsForDate(date: string): Promise<void> {
  const userId = await getCurrentUserId();
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
  const userId = await getCurrentUserId();
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

  const userId = await getCurrentUserId();
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
  const userId = await getCurrentUserId();
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
  // Signing is its own round trip; skip it entirely for a photo-less range.
  const photoUrls = paths.length > 0 ? await signedPhotoUrls(paths) : {};
  const byDate = rowsToDailyLogs(rows as MealRow[], dates, photoUrls);

  const merged = await mergePendingMeals(dates, byDate);

  await Promise.all(dates.map((date) => setDailyLog(date, merged.get(date)!)));
  return dates.map((date) => merged.get(date)!);
}

/**
 * Keeps locally-logged meals the server hasn't confirmed yet. Without this a
 * refetch that lands mid-sync returns the day without them and writes that
 * back over the local cache, so the meal blinks out of the UI.
 */
async function mergePendingMeals(
  dates: string[],
  byDate: Map<string, DailyLog>
): Promise<Map<string, DailyLog>> {
  const pending = await getPendingIds();
  if (pending.size === 0) return byDate;

  await Promise.all(
    dates.map(async (date) => {
      const server = byDate.get(date);
      if (!server) return;

      const seen = new Set(server.meals.map((m) => m.id));
      const local = await getDailyLog(date);
      const missing = local.meals.filter((m) => pending.has(m.id) && !seen.has(m.id));
      if (missing.length === 0) return;

      const meals = [...server.meals, ...missing];
      byDate.set(date, {
        date,
        meals,
        totalCalories: meals.reduce((s, m) => s + m.calories, 0),
        totalProtein: meals.reduce((s, m) => s + m.protein, 0),
        totalCarbs: meals.reduce((s, m) => s + m.carbs, 0),
        totalFat: meals.reduce((s, m) => s + m.fat, 0),
      });
    })
  );

  return byDate;
}

export async function fetchDailyLog(date: string): Promise<DailyLog> {
  const [log] = await fetchDailyLogsRange([date]);
  return log;
}
