export interface MealEntry {
  id: string;
  timestamp: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  photoUri: string;
  userNote: string;
  foodName: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: 'low' | 'medium' | 'high';
}

export interface DailyLog {
  date: string; // 'YYYY-MM-DD'
  meals: MealEntry[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface UserGoals {
  name: string;
  calorieGoal: number;
  proteinGoal: number;
  installDate: string; // ISO string, for 'Day X of Training' counter
}

export interface NutritionResult {
  foodName: string;
  description: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: 'low' | 'medium' | 'high';
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type ConfidenceGrade = 'S' | 'A' | 'B' | 'C';

export function confidenceToGrade(confidence: 'low' | 'medium' | 'high'): ConfidenceGrade {
  switch (confidence) {
    case 'high':
      return 'S';
    case 'medium':
      return 'A';
    case 'low':
      return 'B';
    default:
      return 'C';
  }
}
