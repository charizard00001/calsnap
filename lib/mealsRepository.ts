import type { MealEntry } from '@/types';
import { getAllLocalMeals } from '@/utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// Best-effort sync of meals to Supabase. AsyncStorage (via store/useMealStore)
// stays the source of truth the UI reads from — these calls run in the
// background and never block or fail the local-first save/delete.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MIGRATION_FLAG_KEY = 'supabase_meals_migrated';

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
