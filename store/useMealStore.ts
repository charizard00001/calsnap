import { deleteMealFromSupabase, syncMealToSupabase } from '@/lib/mealsRepository';
import type { DailyLog, MealEntry, UserGoals } from '@/types';
import { getTodayKey } from '@/utils/dateHelpers';
import {
    addMealToLog,
    clearAllData,
    clearDailyLog,
    getTodayLog,
    getUserGoals,
    removeMealFromLog,
    saveUserGoals,
} from '@/utils/storage';
import { create } from 'zustand';

interface MealStore {
  // State
  todayLog: DailyLog;
  goals: UserGoals;
  isLoading: boolean;

  // Actions
  loadToday: () => Promise<void>;
  loadGoals: () => Promise<void>;
  addMeal: (meal: MealEntry) => Promise<void>;
  removeMeal: (mealId: string) => Promise<void>;
  updateGoals: (goals: Partial<UserGoals>) => Promise<void>;
  clearToday: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const defaultGoals: UserGoals = {
  name: 'Sorcerer',
  calorieGoal: 2000,
  proteinGoal: 150,
  installDate: new Date().toISOString(),
};

const emptyLog: DailyLog = {
  date: getTodayKey(),
  meals: [],
  totalCalories: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalFat: 0,
};

export const useMealStore = create<MealStore>((set, get) => ({
  todayLog: emptyLog,
  goals: defaultGoals,
  isLoading: true,

  loadToday: async () => {
    const log = await getTodayLog();
    set({ todayLog: log, isLoading: false });
  },

  loadGoals: async () => {
    const goals = await getUserGoals();
    if (goals) {
      set({ goals });
    }
  },

  addMeal: async (meal: MealEntry) => {
    const today = getTodayKey();
    const updated = await addMealToLog(today, meal);
    set({ todayLog: updated });
    syncMealToSupabase(meal).catch(() => {});
  },

  removeMeal: async (mealId: string) => {
    const today = getTodayKey();
    const updated = await removeMealFromLog(today, mealId);
    set({ todayLog: updated });
    deleteMealFromSupabase(mealId).catch(() => {});
  },

  updateGoals: async (partial: Partial<UserGoals>) => {
    const current = get().goals;
    const updated = { ...current, ...partial };
    await saveUserGoals(updated);
    set({ goals: updated });
  },

  clearToday: async () => {
    const today = getTodayKey();
    await clearDailyLog(today);
    set({ todayLog: { ...emptyLog, date: today } });
  },

  clearAll: async () => {
    await clearAllData();
    const today = getTodayKey();
    set({
      todayLog: { ...emptyLog, date: today },
      goals: defaultGoals,
    });
  },
}));
