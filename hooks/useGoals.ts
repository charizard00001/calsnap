import { DEFAULT_GOALS, fetchGoals, syncProfileGoals } from '@/lib/profile';
import type { UserGoals } from '@/types';
import { saveUserGoals } from '@/utils/storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoals,
    placeholderData: DEFAULT_GOALS,
  });
}

export function useUpdateGoals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (partial: Partial<UserGoals>) => {
      const current = queryClient.getQueryData<UserGoals>(['goals']) ?? DEFAULT_GOALS;
      const updated = { ...current, ...partial };
      await saveUserGoals(updated);
      syncProfileGoals(updated).catch(() => {});
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['goals'], updated);
    },
  });
}
