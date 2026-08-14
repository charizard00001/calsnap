import { deleteMealFromSupabase, fetchDailyLog, fetchDailyLogsRange, syncMealToSupabase } from '@/lib/mealsRepository';
import type { DailyLog, MealEntry } from '@/types';
import { addMealToLog, removeMealFromLog } from '@/utils/storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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

export function useAddMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, meal }: { date: string; meal: MealEntry }) => {
      const updated = await addMealToLog(date, meal);
      syncMealToSupabase(meal).catch(() => {});
      return { date, updated };
    },
    onSuccess: ({ date, updated }) => {
      queryClient.setQueryData<DailyLog>(['dailyLog', date], updated);
      queryClient.invalidateQueries({ queryKey: ['dailyLogs'] });
    },
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
    onSuccess: ({ date, updated }) => {
      queryClient.setQueryData<DailyLog>(['dailyLog', date], updated);
      queryClient.invalidateQueries({ queryKey: ['dailyLogs'] });
    },
  });
}
