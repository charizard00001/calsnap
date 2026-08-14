import type { MealEntry } from '@/types';
import { supabase } from './supabase';

// Best-effort sync of meals to Supabase. AsyncStorage (via store/useMealStore)
// stays the source of truth the UI reads from — these calls run in the
// background and never block or fail the local-first save/delete.

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
