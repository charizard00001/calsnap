import {
  deleteMealFromSupabase,
  fetchDailyLog,
  fetchDailyLogsRange,
  syncMealToSupabase,
  updateMealInSupabase,
} from '@/lib/mealsRepository';
import { markPending } from '@/lib/pendingMeals';
import type { DailyLog, MealEntry } from '@/types';
import { addMealToLog, removeMealFromLog, updateMealInLog } from '@/utils/storage';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

export function useDailyLog(date: string) {
  return useQuery({
    queryKey: ['dailyLog', date],
    queryFn: () => fetchDailyLog(date),
  });
}

export function useDailyLogsRange(dates: string[]) {
  return useQuery({
    queryKey: ['dailyLogs', dates.join(',')],
    queryFn: () => fetchDailyLogsRange(dates),
    enabled: dates.length > 0,
  });
}

/**
 * Writes the new day straight into every cached range that covers it.
 *
 * Ranges used to just be invalidated, which meant History and Insights sat on
 * stale numbers until a refetch came back — three network round trips later,
 * or not until the screen was reopened. The day is already computed here, so
 * patch it in and let the background refetch only confirm.
 */
function patchRanges(queryClient: QueryClient, date: string, updated: DailyLog): void {
  queryClient.setQueryData<DailyLog>(['dailyLog', date], updated);

  queryClient.setQueriesData<DailyLog[]>({ queryKey: ['dailyLogs'] }, (logs) => {
    if (!logs) return logs;
    let hit = false;
    const next = logs.map((log) => {
      if (log.date !== date) return log;
      hit = true;
      return updated;
    });
    return hit ? next : logs;
  });

  // Still refetch, but in the background — the UI is already correct.
  queryClient.invalidateQueries({ queryKey: ['dailyLogs'], refetchType: 'active' });
}

export function useAddMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, meal }: { date: string; meal: MealEntry }) => {
      // Flagged before the local write so a refetch that lands mid-sync
      // knows to keep this meal rather than overwrite it away.
      markPending(meal.id);
      const updated = await addMealToLog(date, meal);
      syncMealToSupabase(meal).catch(() => {});
      return { date, updated };
    },
    onSuccess: ({ date, updated }) => patchRanges(queryClient, date, updated),
  });
}

export function useUpdateMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      date,
      mealId,
      updates,
    }: {
      date: string;
      mealId: string;
      updates: Partial<
        Pick<MealEntry, 'foodName' | 'calories' | 'protein' | 'carbs' | 'fat' | 'mealType' | 'userNote'>
      >;
    }) => {
      const updated = await updateMealInLog(date, mealId, updates);
      updateMealInSupabase(mealId, updates).catch(() => {});
      return { date, updated };
    },
    onSuccess: ({ date, updated }) => patchRanges(queryClient, date, updated),
  });
}

export function useRemoveMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, mealId }: { date: string; mealId: string }) => {
      const updated = await removeMealFromLog(date, mealId);
      deleteMealFromSupabase(mealId).catch(() => {});
      return { date, updated };
    },
    onSuccess: ({ date, updated }) => patchRanges(queryClient, date, updated),
  });
}
