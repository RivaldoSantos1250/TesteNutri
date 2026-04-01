export type Category = 'arroz' | 'macarrão' | 'batata' | 'frango' | 'carne' | 'ovo' | 'peixe' | 'feijão' | 'lentilha' | 'legumes' | 'frutas' | 'bebidas' | 'refeição pronta';

export type Unit = 'gramas' | 'colher' | 'concha' | 'unidade' | 'fatia';

export interface Food {
  id: string;
  name: string;
  category: Category;
  calories: number; // per 100g or per unit
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  baseUnit: Unit;
  baseAmount: number; // e.g. 100g or 1 unit
  isCheap?: boolean;
  isHighProtein?: boolean;
  isLowCarb?: boolean;
  isLowFat?: boolean;
  isLactoseFree?: boolean;
}

export interface MealItem {
  foodId: string;
  amount: number;
  unit: Unit;
}

export type MealType = 'café da manhã' | 'almoço' | 'lanche' | 'jantar' | 'ceia';

export interface Meal {
  type: MealType;
  items: MealItem[];
}

export interface DailyLog {
  userId: string;
  date: string; // YYYY-MM-DD
  meals: Meal[];
  waterIntake: number; // in ml
}

export interface UserGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tdee: number;
  waterGoal: number; // in ml
}

export interface ReminderSettings {
  water: { enabled: boolean; interval: number }; // interval in minutes
  meals: { enabled: boolean; times: string[] }; // HH:mm
  protein: { enabled: boolean; target: number }; // percentage of goal
}

export interface UserProfile {
  userId: string;
  name: string;
  photoUrl?: string;
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: number; // 1.2 to 1.9
  bmi?: number;
  bmr?: number;
  tdee?: number;
  reminders?: ReminderSettings;
}
