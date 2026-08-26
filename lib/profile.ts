import type { UserGoals } from '@/types';
import { getUserGoals, saveUserGoals } from '@/utils/storage';
import { supabase } from './supabase';

export const DEFAULT_GOALS: UserGoals = {
  name: 'Friend',
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

/**
 * Has the signed-in user finished onboarding? Sourced from the `onboarded`
 * column on their profile row (not a device-local flag) so it's correct
 * after a reinstall, on a second device, or — the bug this fixes — when a
 * *different* account signs in on a browser where someone else already
 * onboarded. Returns null when it genuinely can't be determined (no
 * session, or the network call failed) so the caller can fall back to a
 * per-user local flag.
 */
export async function fetchOnboarded(): Promise<boolean | null> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('onboarded')
    .eq('id', userId)
    .maybeSingle();

  if (error) return null;
  return data?.onboarded ?? false;
}

/** Writes the chosen goals and marks onboarding complete, in one update. */
export async function completeOnboarding(goals: UserGoals): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return;

  await supabase
    .from('profiles')
    .update({
      display_name: goals.name,
      calorie_goal: goals.calorieGoal,
      protein_goal: goals.proteinGoal,
      onboarded: true,
    })
    .eq('id', userId);
}

// Remote profile is the source of truth when reachable; AsyncStorage is
// the offline cache/fallback.
export async function fetchGoals(): Promise<UserGoals> {
  const cached = await getUserGoals();
  const fallback = cached ?? DEFAULT_GOALS;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return fallback;

  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, calorie_goal, protein_goal, install_date')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return fallback;

  // The profile's install_date is authoritative (set when the account was
  // created) — the local cache would show a previous account's date on a
  // shared browser, or today's date on a fresh device.
  const parsedInstall = data.install_date ? new Date(data.install_date) : null;
  const installDate =
    parsedInstall && !Number.isNaN(parsedInstall.getTime())
      ? parsedInstall.toISOString()
      : fallback.installDate;

  const goals: UserGoals = {
    name: data.display_name,
    calorieGoal: data.calorie_goal,
    proteinGoal: data.protein_goal,
    installDate,
  };
  await saveUserGoals(goals);
  return goals;
}
