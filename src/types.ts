export type Category = 'arroz' | 'macarrão' | 'batata' | 'frango' | 'carne' | 'ovo' | 'peixe' | 'feijão' | 'lentilha' | 'legumes' | 'verduras' | 'frutas' | 'bebidas' | 'refeição pronta' | 'laticínios' | 'pães' | 'doces' | 'castanhas' | 'óleos' | 'cereais' | 'lanches' | 'outros';

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
  date: string; // YYYY-MM-DD
  meals: Meal[];
  water?: number; // in ml
}

export interface UserGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tdee: number;
  waterGoal: number; // in ml
  goalType: 'lose' | 'maintain' | 'gain';
  dietType: 'balanced' | 'lowcarb' | 'highprotein';
}

export interface UserProfile {
  name: string;
  photoUrl?: string;
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: number; // 1.2 to 1.9
  goalType: 'lose' | 'maintain' | 'gain';
  dietType: 'balanced' | 'lowcarb' | 'highprotein';
}
