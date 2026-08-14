import type { UserGoals } from '@/types';
import { getUserGoals, saveUserGoals } from '@/utils/storage';
import { supabase } from './supabase';

export const DEFAULT_GOALS: UserGoals = {
  name: 'Sorcerer',
  calorieGoal: 2000,
  proteinGoal: 150,
  installDate: new Date().toISOString(),
};

// Best-effort sync of goals to the user's Supabase profile row.
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

// Remote profile is the source of truth when reachable; AsyncStorage is
// the offline cache/fallback. installDate has no server column (it's
// purely a local "day X of training" counter), so it's always preserved
// from whatever's already cached locally.
export async function fetchGoals(): Promise<UserGoals> {
  const cached = await getUserGoals();
  const fallback = cached ?? DEFAULT_GOALS;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return fallback;

  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, calorie_goal, protein_goal')
    .eq('id', userId)
    .single();

  if (error || !data) return fallback;

  const goals: UserGoals = {
    name: data.display_name,
    calorieGoal: data.calorie_goal,
    proteinGoal: data.protein_goal,
    installDate: fallback.installDate,
  };
  await saveUserGoals(goals);
  return goals;
}
