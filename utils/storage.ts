import type { DailyLog, MealEntry, UserGoals } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayKey } from './dateHelpers';

const GOALS_KEY = 'user_goals';
const ONBOARDING_KEY = 'onboarding_complete';
const LOG_PREFIX = 'log_';

// ─── User Goals ────────────────────────────────────────

export async function saveUserGoals(goals: UserGoals): Promise<void> {
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

export async function getUserGoals(): Promise<UserGoals | null> {
  const data = await AsyncStorage.getItem(GOALS_KEY);
  return data ? JSON.parse(data) : null;
}

// ─── Onboarding ────────────────────────────────────────

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

export async function isOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === 'true';
}

// ─── Daily Logs ────────────────────────────────────────

function logKey(date: string): string {
  return `${LOG_PREFIX}${date}`;
}

export async function getDailyLog(date: string): Promise<DailyLog> {
  const data = await AsyncStorage.getItem(logKey(date));
  if (data) {
    return JSON.parse(data);
  }
  return {
    date,
    meals: [],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  };
}

export async function getTodayLog(): Promise<DailyLog> {
  return getDailyLog(getTodayKey());
}

function recalcTotals(meals: MealEntry[]): Pick<DailyLog, 'totalCalories' | 'totalProtein' | 'totalCarbs' | 'totalFat'> {
  return {
    totalCalories: meals.reduce((sum, m) => sum + m.calories, 0),
    totalProtein: meals.reduce((sum, m) => sum + m.protein, 0),
    totalCarbs: meals.reduce((sum, m) => sum + m.carbs, 0),
    totalFat: meals.reduce((sum, m) => sum + m.fat, 0),
  };
}

export async function addMealToLog(date: string, meal: MealEntry): Promise<DailyLog> {
  const log = await getDailyLog(date);
  log.meals.push(meal);
  const totals = recalcTotals(log.meals);
  const updated: DailyLog = { ...log, ...totals };
  await AsyncStorage.setItem(logKey(date), JSON.stringify(updated));
  return updated;
}

export async function removeMealFromLog(date: string, mealId: string): Promise<DailyLog> {
  const log = await getDailyLog(date);
  log.meals = log.meals.filter((m) => m.id !== mealId);
  const totals = recalcTotals(log.meals);
  const updated: DailyLog = { ...log, ...totals };
  await AsyncStorage.setItem(logKey(date), JSON.stringify(updated));
  return updated;
}

export async function clearDailyLog(date: string): Promise<void> {
  await AsyncStorage.removeItem(logKey(date));
}

export async function clearAllData(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const logKeys = keys.filter((k) => k.startsWith(LOG_PREFIX));
  await AsyncStorage.multiRemove([...logKeys, GOALS_KEY, ONBOARDING_KEY]);
}

export async function getMultipleDailyLogs(dates: string[]): Promise<DailyLog[]> {
  const keys = dates.map(logKey);
  const pairs = await AsyncStorage.multiGet(keys);
  return pairs.map(([_, value], i) => {
    if (value) {
      return JSON.parse(value);
    }
    return {
      date: dates[i],
      meals: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    } as DailyLog;
  });
}
