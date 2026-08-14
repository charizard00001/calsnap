import type { UserGoals } from '@/types';
import { supabase } from './supabase';

// Best-effort sync of goals to the user's Supabase profile row.
// Local AsyncStorage stays the source of truth read from; this just
// keeps the account-level copy current for cross-device access later.
export async function syncProfileGoals(goals: UserGoals): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return;

  await supabase
    .from('profiles')
    .update({
      display_name: goals.name,
      calorie_goal: goals.calorieGoal,
      protein_goal: goals.proteinGoal,
    })
    .eq('id', userId);
}
