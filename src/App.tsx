/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Trash2, ChevronRight, ChevronLeft, 
  Calculator, History, ShoppingCart, Save, Copy, 
  ArrowRightLeft, AlertTriangle, CheckCircle2, 
  Utensils, Coffee, Sun, Moon, Star, Filter,
  TrendingUp, Info, Settings, Calendar, Camera, User,
  Droplets, GlassWater, Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from './lib/utils';
import { 
  Food, Category, Unit, MealItem, MealType, 
  Meal, DailyLog, UserGoals, UserProfile 
} from './types';
import { FOODS, UNIT_CONVERSIONS } from './data/foods';

const MEAL_TYPES: MealType[] = ['café da manhã', 'almoço', 'lanche', 'jantar', 'ceia'];

const INITIAL_GOALS: UserGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
  tdee: 2000,
  waterGoal: 2500,
  goalType: 'maintain',
  dietType: 'balanced'
};

export default function App() {
  // --- State ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [goals, setGoals] = useState<UserGoals>(INITIAL_GOALS);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    photoUrl: '',
    weight: 70,
    height: 170,
    age: 30,
    gender: 'male',
    activityLevel: 1.2,
    goalType: 'maintain',
    dietType: 'balanced'
  });
  const [hasProfile, setHasProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'daily' | 'water' | 'history' | 'shopping' | 'settings'>('daily');
  const [isAddingFood, setIsAddingFood] = useState<{ mealType: MealType } | null>(null);
  const [selectedFoodForAmount, setSelectedFoodForAmount] = useState<Food | null>(null);
  const [amountInput, setAmountInput] = useState<number>(100);
  const [unitInput, setUnitInput] = useState<Unit>('gramas');
  const [isSubstituting, setIsSubstituting] = useState<{ mealType: MealType, itemIndex: number, category: Category } | null>(null);
  const [filters, setFilters] = useState({
    cheap: false,
    highProtein: false,
    lowCarb: false,
    lowFat: false,
    lactoseFree: false
  });
  const [manualCalories, setManualCalories] = useState<string>(INITIAL_GOALS.calories.toString());
  const [aggressiveWarning, setAggressiveWarning] = useState<{ show: boolean, pendingCalories: number } | null>(null);

  // --- Persistence ---
  useEffect(() => {
    const savedLogs = localStorage.getItem('nutriplan_logs');
    const savedGoals = localStorage.getItem('nutriplan_goals');
    const savedProfile = localStorage.getItem('nutriplan_profile');
    const isSetupComplete = localStorage.getItem('nutriplan_setup_complete');
    
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedGoals) {
      const parsedGoals = JSON.parse(savedGoals);
      setGoals(parsedGoals);
      setManualCalories(parsedGoals.calories.toString());
    }
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
    if (isSetupComplete === 'true') {
      setHasProfile(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('nutriplan_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('nutriplan_goals', JSON.stringify(goals));
    setManualCalories(goals.calories.toString());
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('nutriplan_profile', JSON.stringify(profile));
  }, [profile]);

  // --- Derived Data ---
  const currentLog = useMemo(() => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    return logs.find(l => l.date === dateStr) || { date: dateStr, meals: [], water: 0 };
  }, [logs, currentDate]);

  const totals = useMemo(() => {
    const res = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    currentLog.meals.forEach(meal => {
      meal.items.forEach(item => {
        const food = FOODS.find(f => f.id === item.foodId);
        if (food) {
          const factor = (item.amount * (UNIT_CONVERSIONS[item.unit] || 1)) / food.baseAmount;
          res.calories += food.calories * factor;
          res.protein += food.protein * factor;
          res.carbs += food.carbs * factor;
          res.fat += food.fat * factor;
          res.fiber += (food.fiber || 0) * factor;
        }
      });
    });
    return res;
  }, [currentLog]);

  const filteredFoods = useMemo(() => {
    return FOODS.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
      const matchesFilters = 
        (!filters.cheap || f.isCheap) &&
        (!filters.highProtein || f.isHighProtein) &&
        (!filters.lowCarb || f.isLowCarb) &&
        (!filters.lowFat || f.isLowFat) &&
        (!filters.lactoseFree || f.isLactoseFree);
      return matchesSearch && matchesCategory && matchesFilters;
    });
  }, [searchQuery, selectedCategory, filters]);

  const streak = useMemo(() => {
    let count = 0;
    let checkDate = currentDate;
    
    const todayStr = format(checkDate, 'yyyy-MM-dd');
    const todayLog = logs.find(l => l.date === todayStr);
    const todayHasLogs = todayLog && todayLog.meals.some(m => m.items.length > 0);
    
    if (todayHasLogs) {
      count++;
    }
    
    checkDate = subDays(currentDate, 1);
    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const log = logs.find(l => l.date === dateStr);
      if (log && log.meals.some(m => m.items.length > 0)) {
        count++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }
    return count;
  }, [logs, currentDate]);

  const yesterdayComparison = useMemo(() => {
    const yesterdayStr = format(subDays(currentDate, 1), 'yyyy-MM-dd');
    const yesterdayLog = logs.find(l => l.date === yesterdayStr);
    
    if (!yesterdayLog || !yesterdayLog.meals.some(m => m.items.length > 0)) return null;

    let yesterdayCalories = 0;
    yesterdayLog.meals.forEach(meal => {
      meal.items.forEach(item => {
        const food = FOODS.find(f => f.id === item.foodId);
        if (food) {
          const factor = (item.amount * (UNIT_CONVERSIONS[item.unit] || 1)) / food.baseAmount;
          yesterdayCalories += food.calories * factor;
        }
      });
    });

    const diff = totals.calories - yesterdayCalories;
    return {
      calories: yesterdayCalories,
      diff: diff
    };
  }, [logs, currentDate, totals.calories]);

  // --- Autonomous Suggestions ---
  const autonomousSuggestion = useMemo(() => {
    const calorieDiff = goals.calories - totals.calories;
    const proteinDiff = goals.protein - totals.protein;
    const waterDiff = goals.waterGoal - (currentLog.water || 0);
    const fatDiff = goals.fat - totals.fat;

    if (totals.calories === 0) return "Comece seu dia registrando sua primeira refeição!";

    if (totals.calories > goals.calories + 100) {
      return "Você excedeu sua meta calórica. Foque em vegetais e hidratação no restante do dia.";
    }

    if (proteinDiff > 30) {
      return "Sua meta de proteína ainda está longe. Que tal adicionar ovos, frango ou iogurte?";
    }

    if (waterDiff > goals.waterGoal * 0.5) {
      return "Lembre-se de beber água! A hidratação ajuda no controle do apetite e metabolismo.";
    }

    if (totals.carbs > goals.carbs + 20) {
      return "Carboidratos um pouco acima da meta. Tente priorizar proteínas na próxima refeição.";
    }

    if (fatDiff > 15 && totals.calories > goals.calories * 0.7) {
      return "Você ainda tem margem para gorduras boas. Que tal um pouco de abacate ou castanhas?";
    }

    if (calorieDiff > 200 && calorieDiff < 500) {
      return "Quase lá! Você tem uma margem boa para um lanche saudável ou jantar leve.";
    }

    return "Ótimo progresso! Sua distribuição de nutrientes está equilibrada hoje.";
  }, [totals, goals, currentLog.water]);

  const timeOfDayTip = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 10) return { icon: <Coffee size={14} />, text: "Café da manhã rico em fibras ajuda na saciedade." };
    if (hour < 14) return { icon: <Sun size={14} />, text: "Almoço equilibrado evita a sonolência da tarde." };
    if (hour < 18) return { icon: <Utensils size={14} />, text: "Um lanche proteico agora evita exageros no jantar." };
    return { icon: <Moon size={14} />, text: "Refeições leves à noite melhoram a qualidade do sono." };
  }, []);

  // --- Handlers ---
  const addFoodToMeal = (foodId: string, amount: number, unit: Unit, mealType: MealType) => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    setLogs(prevLogs => {
      const logExists = prevLogs.some(l => l.date === dateStr);
      if (!logExists) {
        return [...prevLogs, { date: dateStr, meals: [{ type: mealType, items: [{ foodId, amount, unit }] }], water: 0 }];
      }
      return prevLogs.map(log => {
        if (log.date !== dateStr) return log;
        const mealExists = log.meals.some(m => m.type === mealType);
        const newMeals = mealExists 
          ? log.meals.map(m => m.type === mealType ? { ...m, items: [...m.items, { foodId, amount, unit }] } : m)
          : [...log.meals, { type: mealType, items: [{ foodId, amount, unit }] }];
        return { ...log, meals: newMeals };
      });
    });
    setIsAddingFood(null);
  };

  const removeFoodFromMeal = (mealType: MealType, itemIndex: number) => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    setLogs(prevLogs => prevLogs.map(log => {
      if (log.date !== dateStr) return log;
      return {
        ...log,
        meals: log.meals.map(m => {
          if (m.type !== mealType) return m;
          const newItems = [...m.items];
          newItems.splice(itemIndex, 1);
          return { ...m, items: newItems };
        })
      };
    }));
  };

  const substituteFood = (mealType: MealType, itemIndex: number, newFoodId: string) => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    setLogs(prevLogs => prevLogs.map(log => {
      if (log.date !== dateStr) return log;
      return {
        ...log,
        meals: log.meals.map(m => {
          if (m.type !== mealType) return m;
          const newItems = [...m.items];
          newItems[itemIndex] = { ...newItems[itemIndex], foodId: newFoodId };
          return { ...m, items: newItems };
        })
      };
    }));
    setIsSubstituting(null);
  };

  const duplicateMeal = (mealType: MealType) => {
    const yesterday = subDays(currentDate, 1);
    const dateStr = format(yesterday, 'yyyy-MM-dd');
    const prevLog = logs.find(l => l.date === dateStr);
    if (!prevLog) return;

    const prevMeal = prevLog.meals.find(m => m.type === mealType);
    if (!prevMeal) return;

    const todayStr = format(currentDate, 'yyyy-MM-dd');
    setLogs(prevLogs => {
      const logExists = prevLogs.some(l => l.date === todayStr);
      if (!logExists) {
        return [...prevLogs, { date: todayStr, meals: [{ type: mealType, items: [...prevMeal.items] }], water: 0 }];
      }
      return prevLogs.map(log => {
        if (log.date !== todayStr) return log;
        const mealExists = log.meals.some(m => m.type === mealType);
        const newMeals = mealExists 
          ? log.meals.map(m => m.type === mealType ? { ...m, items: [...m.items, ...prevMeal.items] } : m)
          : [...log.meals, { type: mealType, items: [...prevMeal.items] }];
        return { ...log, meals: newMeals };
      });
    });
  };

  const saveProfileAndCalculate = () => {
    if (!profile.name) {
      alert("Por favor, insira seu nome.");
      return;
    }
    calculateTDEE();
    setHasProfile(true);
    localStorage.setItem('nutriplan_setup_complete', 'true');
  };

  const updateWater = (amount: number) => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    setLogs(prevLogs => {
      const logExists = prevLogs.some(l => l.date === dateStr);
      if (!logExists) {
        return [...prevLogs, { date: dateStr, meals: [], water: Math.max(0, amount) }];
      }
      return prevLogs.map(log => {
        if (log.date !== dateStr) return log;
        return { ...log, water: Math.max(0, (log.water || 0) + amount) };
      });
    });
  };

  const calculateTDEE = () => {
    const { weight, height, age, gender, activityLevel, goalType, dietType } = profile;
    
    // Mifflin-St Jeor Equation
    // Men: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
    // Women: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr += (gender === 'male' ? 5 : -161);
    
    const tdee = Math.round(bmr * activityLevel);
    
    // Adjust calories based on goal
    let calories = tdee;
    if (goalType === 'lose') calories -= 500;
    if (goalType === 'gain') calories += 500;

    // Limitar calorias automaticamente
    if (gender === 'female' && calories < 1300) {
      calories = 1300;
    }
    if (gender === 'male' && calories < 1500) {
      calories = 1500;
    }

    // Adjust macros based on diet type
    let pRatio = 0.25, cRatio = 0.45, fRatio = 0.30;
    
    if (dietType === 'lowcarb') {
      pRatio = 0.35; cRatio = 0.15; fRatio = 0.50;
    } else if (dietType === 'highprotein') {
      pRatio = 0.40; cRatio = 0.35; fRatio = 0.25;
    }

    setGoals({
      ...goals,
      tdee,
      calories,
      protein: Math.round((calories * pRatio) / 4),
      carbs: Math.round((calories * cRatio) / 4),
      fat: Math.round((calories * fRatio) / 9),
      waterGoal: Math.round(weight * 35),
      goalType,
      dietType
    });
  };

  const updateGoalsWithCalories = (calories: number) => {
    let pRatio = 0.25, cRatio = 0.45, fRatio = 0.30;
    if (profile.dietType === 'lowcarb') {
      pRatio = 0.35; cRatio = 0.15; fRatio = 0.50;
    } else if (profile.dietType === 'highprotein') {
      pRatio = 0.40; cRatio = 0.35; fRatio = 0.25;
    }
    setGoals(prev => ({
      ...prev,
      calories,
      protein: Math.round((calories * pRatio) / 4),
      carbs: Math.round((calories * cRatio) / 4),
      fat: Math.round((calories * fRatio) / 9),
    }));
  };

  const handleManualCalorieBlur = () => {
    const val = Number(manualCalories);
    if (isNaN(val) || val <= 0) {
      setManualCalories(goals.calories.toString());
      return;
    }

    const limit = profile.gender === 'female' ? 1300 : 1500;
    if (val < limit) {
      setAggressiveWarning({ show: true, pendingCalories: val });
    } else {
      updateGoalsWithCalories(val);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for local storage
        alert("A foto deve ter menos de 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const shoppingList = useMemo(() => {
    const list: Record<string, { amount: number; unit: Unit }> = {};
    currentLog.meals.forEach(meal => {
      meal.items.forEach(item => {
        const food = FOODS.find(f => f.id === item.foodId);
        if (food) {
          if (list[food.name]) {
            list[food.name].amount += item.amount;
          } else {
            list[food.name] = { amount: item.amount, unit: item.unit };
          }
        }
      });
    });
    return Object.entries(list).map(([name, data]) => ({ name, ...data }));
  }, [currentLog]);

  // --- Components ---
  const ProgressBar = ({ label, current, target, color, unit = 'g' }: { label: string, current: number, target: number, color: string, unit?: string }) => {
    const percentage = Math.min((current / target) * 100, 100);
    const isOver = current > target;
    return (
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-zinc-500 uppercase tracking-wider">{label}</span>
          <span className={cn(isOver ? "text-red-500" : "text-zinc-900")}>
            {Math.round(current)} / {target}{unit}
          </span>
        </div>
        <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            className={cn("h-full rounded-full", color)}
          />
        </div>
      </div>
    );
  };

  const DarkProgressBar = ({ label, current, target, color, unit = 'g' }: { label: string, current: number, target: number, color: string, unit?: string }) => {
    const percentage = Math.min((current / target) * 100, 100) || 0;
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</span>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            className={cn("h-full rounded-full", color)}
          />
        </div>
        <span className="text-xs font-bold text-white">{Math.round(current)}<span className="text-[10px] text-zinc-400 font-medium ml-0.5">{unit}</span></span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F5F3] text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
      {!hasProfile ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-xl border border-zinc-100 space-y-8"
          >
            <div className="text-center space-y-2">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="w-24 h-24 bg-zinc-100 rounded-3xl flex items-center justify-center text-zinc-400 overflow-hidden border-2 border-zinc-100">
                  {profile.photoUrl ? (
                    <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={48} />
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-zinc-900 rounded-2xl flex items-center justify-center text-white cursor-pointer hover:bg-zinc-800 transition-colors shadow-lg">
                  <Camera size={18} />
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>
              <h1 className="text-3xl font-black tracking-tighter">Bem-vindo ao NutriPlan</h1>
              <p className="text-zinc-500 text-sm">Vamos configurar seu perfil para calcular suas metas.</p>
            </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Seu Nome</label>
                  <input 
                    type="text" 
                    placeholder="Como podemos te chamar?"
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Objetivo</label>
                    <select 
                      value={profile.goalType}
                      onChange={(e) => setProfile({...profile, goalType: e.target.value as any})}
                      className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-zinc-900 outline-none appearance-none"
                    >
                      <option value="lose">Perder Peso</option>
                      <option value="maintain">Manter Peso</option>
                      <option value="gain">Ganhar Massa</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Tipo de Dieta</label>
                    <select 
                      value={profile.dietType}
                      onChange={(e) => setProfile({...profile, dietType: e.target.value as any})}
                      className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-zinc-900 outline-none appearance-none"
                    >
                      <option value="balanced">Equilibrada</option>
                      <option value="lowcarb">Low Carb</option>
                      <option value="highprotein">Alta Proteína</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Peso (kg)</label>
                  <input 
                    type="number" 
                    value={profile.weight}
                    onChange={(e) => setProfile({...profile, weight: Number(e.target.value)})}
                    className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Altura (cm)</label>
                  <input 
                    type="number" 
                    value={profile.height}
                    onChange={(e) => setProfile({...profile, height: Number(e.target.value)})}
                    className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Idade</label>
                  <input 
                    type="number" 
                    value={profile.age}
                    onChange={(e) => setProfile({...profile, age: Number(e.target.value)})}
                    className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Gênero</label>
                  <select 
                    value={profile.gender}
                    onChange={(e) => setProfile({...profile, gender: e.target.value as 'male' | 'female'})}
                    className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-zinc-900 outline-none appearance-none"
                  >
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Nível de Atividade</label>
                <select 
                  value={profile.activityLevel}
                  onChange={(e) => setProfile({...profile, activityLevel: Number(e.target.value)})}
                  className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-zinc-900 outline-none appearance-none"
                >
                  <option value={1.2}>Sedentário (pouco exercício)</option>
                  <option value={1.375}>Leve (1-3 dias/semana)</option>
                  <option value={1.55}>Moderado (3-5 dias/semana)</option>
                  <option value={1.725}>Intenso (6-7 dias/semana)</option>
                  <option value={1.9}>Atleta (trabalho físico pesado)</option>
                </select>
              </div>

              <button 
                onClick={saveProfileAndCalculate}
                className="w-full bg-zinc-900 text-white font-bold py-4 rounded-2xl hover:bg-zinc-800 transition-all active:scale-[0.98] mt-4"
              >
                Começar Minha Dieta
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
        <>
          {/* Header */}
          <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-400 overflow-hidden border border-zinc-200">
                {profile.photoUrl ? (
                  <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={20} />
                )}
              </div>
              <div className="flex flex-col">
                <h1 className="font-bold text-sm tracking-tight leading-none">NutriPlan</h1>
                <span className="text-[10px] text-zinc-400 font-medium">Olá, {profile.name}</span>
              </div>
            </div>
        <div className="flex items-center gap-1 bg-zinc-50 rounded-full p-1 border border-zinc-200/50">
          <button 
            onClick={() => setCurrentDate(subDays(currentDate, 1))}
            className="p-1.5 hover:bg-white hover:shadow-sm rounded-full transition-all text-zinc-500 hover:text-zinc-900"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex flex-col items-center min-w-[70px]">
            <span className="text-xs font-bold tracking-tight">
              {isSameDay(currentDate, new Date()) ? 'Hoje' : format(currentDate, 'dd MMM', { locale: ptBR })}
            </span>
          </div>
          <button 
            onClick={() => setCurrentDate(addDays(currentDate, 1))}
            className="p-1.5 hover:bg-white hover:shadow-sm rounded-full transition-all text-zinc-500 hover:text-zinc-900"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto pb-24 px-4 pt-6">
        {activeTab === 'daily' && (
          <div className="space-y-6">
            {/* Time of Day Tip */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/50 p-4 rounded-[24px] flex items-center gap-4 shadow-sm"
            >
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm">
                {timeOfDayTip.icon}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-0.5">Dica do Momento</p>
                <p className="text-xs font-medium text-indigo-900 leading-snug">{timeOfDayTip.text}</p>
              </div>
            </motion.div>

            {/* Streak and Comparison */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-orange-50 border border-orange-100 p-4 rounded-[24px] flex items-center gap-3 shadow-sm"
              >
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-0.5">Ofensiva</p>
                  <p className="text-sm font-bold text-orange-900 leading-snug">{streak} {streak === 1 ? 'dia' : 'dias'}</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-100 p-4 rounded-[24px] flex items-center gap-3 shadow-sm"
              >
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                  <ArrowRightLeft size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-0.5">vs Ontem</p>
                  <p className="text-sm font-bold text-blue-900 leading-snug">
                    {yesterdayComparison ? (
                      yesterdayComparison.diff > 0 ? `+${Math.round(yesterdayComparison.diff)} kcal` : `${Math.round(yesterdayComparison.diff)} kcal`
                    ) : 'Sem dados'}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Dashboard Card */}
            <section className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-800 text-white rounded-[32px] p-6 shadow-xl shadow-zinc-200/50 space-y-6">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white/5 blur-xl pointer-events-none"></div>

              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1 flex items-center gap-1">⚡ Status do dia</p>
                  <h2 className="text-4xl font-black tracking-tighter leading-none flex items-baseline gap-1">
                    {Math.round(totals.calories)} <span className="text-lg font-medium text-zinc-400">/ {goals.calories}</span>
                  </h2>
                  <p className="text-sm font-medium text-zinc-300 mt-2">
                    {totals.calories > goals.calories 
                      ? `Passou ${Math.round(totals.calories - goals.calories)} kcal` 
                      : `Faltam ${Math.round(goals.calories - totals.calories)} kcal`}
                  </p>
                </div>
                <div className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 backdrop-blur-md border",
                  totals.calories > goals.calories 
                    ? "bg-red-500/20 text-red-300 border-red-500/30 animate-pulse" 
                    : totals.calories >= goals.calories * 0.85
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : totals.calories > 0
                        ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                        : "bg-zinc-500/20 text-zinc-300 border-zinc-500/30"
                )}>
                  {totals.calories > goals.calories ? '🚨 Acima do limite' : totals.calories >= goals.calories * 0.85 ? '🔥 Dentro da meta' : totals.calories > 0 ? '⚠️ Calorias baixas' : '🌱 Começando o dia'}
                </div>
              </div>

              <div className="relative z-10 grid grid-cols-4 gap-3 pt-4 border-t border-white/10">
                <DarkProgressBar label="Proteína" current={totals.protein} target={goals.protein} color="bg-orange-400" />
                <DarkProgressBar label="Carbos" current={totals.carbs} target={goals.carbs} color="bg-blue-400" />
                <DarkProgressBar label="Gorduras" current={totals.fat} target={goals.fat} color="bg-yellow-400" />
                <DarkProgressBar label="Água" current={currentLog.water || 0} target={goals.waterGoal} color="bg-cyan-400" unit="ml" />
              </div>

              {autonomousSuggestion && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative z-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex gap-3 items-start mt-2"
                >
                  <div className="w-8 h-8 bg-white/20 rounded-full flex-shrink-0 flex items-center justify-center text-white">
                    <Star size={14} fill="currentColor" />
                  </div>
                  <p className="text-sm font-medium text-zinc-100 leading-tight pt-1">
                    {autonomousSuggestion}
                  </p>
                </motion.div>
              )}
            </section>

            {/* Meals List */}
            <div className="space-y-5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-black tracking-tight">Refeições</h3>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{currentLog.meals.length} Registros</span>
              </div>

              {MEAL_TYPES.map((type) => {
                const meal = currentLog.meals.find(m => m.type === type);
                const mealCalories = meal?.items.reduce((acc, item) => {
                  const food = FOODS.find(f => f.id === item.foodId);
                  if (!food) return acc;
                  return acc + (food.calories * (item.amount * (UNIT_CONVERSIONS[item.unit] || 1)) / food.baseAmount);
                }, 0) || 0;

                return (
                  <motion.div 
                    key={type} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[28px] overflow-hidden border border-zinc-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="px-5 py-4 flex justify-between items-center bg-zinc-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-zinc-900 shadow-sm border border-zinc-100">
                          {type === 'café da manhã' && <Coffee size={20} />}
                          {type === 'almoço' && <Sun size={20} />}
                          {type === 'lanche' && <Star size={20} />}
                          {type === 'jantar' && <Moon size={20} />}
                          {type === 'ceia' && <Moon size={20} />}
                        </div>
                        <div>
                          <h3 className="font-bold capitalize text-base tracking-tight">{type}</h3>
                          <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-widest">{Math.round(mealCalories)} kcal</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => duplicateMeal(type)}
                          className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl text-zinc-400 hover:text-zinc-900 transition-colors shadow-sm border border-transparent hover:border-zinc-200"
                          title="Duplicar de ontem"
                        >
                          <Copy size={16} />
                        </button>
                        <button 
                          onClick={() => setIsAddingFood({ mealType: type })}
                          className="w-10 h-10 flex items-center justify-center bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors shadow-md shadow-zinc-200"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                    
                    {meal && meal.items.length > 0 ? (
                      <div className="divide-y divide-zinc-50 px-2">
                        {meal.items.map((item, idx) => {
                          const food = FOODS.find(f => f.id === item.foodId);
                          if (!food) return null;
                          const cals = (food.calories * (item.amount * (UNIT_CONVERSIONS[item.unit] || 1)) / food.baseAmount);
                          return (
                            <div key={idx} className="px-4 py-3.5 flex justify-between items-center group">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-zinc-800">{food.name}</span>
                                <span className="text-xs text-zinc-500 font-medium">{item.amount} {item.unit} • <span className="text-zinc-400">{Math.round(cals)} kcal</span></span>
                              </div>
                              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => {
                                    const category = food.category;
                                    setIsSubstituting({ mealType: type, itemIndex: idx, category });
                                  }}
                                  className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                                  title="Trocar por equivalente"
                                >
                                  <ArrowRightLeft size={16} />
                                </button>
                                <button 
                                  onClick={() => removeFoodFromMeal(type, idx)}
                                  className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-6 py-6 text-center bg-white">
                        <p className="text-xs font-medium text-zinc-400">Nenhum alimento registrado</p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'water' && (
          <div className="space-y-8 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-black tracking-tighter">Meta de Água</h2>
              <p className="text-zinc-500 text-sm">Mantenha-se hidratado hoje</p>
            </div>

            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Background Circle */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-zinc-100"
                />
                {/* Progress Circle */}
                <motion.circle
                  cx="128"
                  cy="128"
                  r="110"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray={2 * Math.PI * 110}
                  initial={{ strokeDashoffset: 2 * Math.PI * 110 }}
                  animate={{ 
                    strokeDashoffset: 2 * Math.PI * 110 * (1 - Math.min((currentLog.water || 0) / goals.waterGoal, 1)) 
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  strokeLinecap="round"
                  className="text-blue-500"
                />
              </svg>

              {/* Inner Content */}
              <div className="z-10 text-center">
                <Droplets size={48} className="text-blue-500 mx-auto mb-2" fill="currentColor" />
                <div className="text-4xl font-black tracking-tighter">
                  {currentLog.water || 0}
                  <span className="text-lg font-normal text-zinc-400 ml-1">ml</span>
                </div>
                <div className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mt-1">
                  Meta: {goals.waterGoal}ml
                </div>
              </div>

              {/* Water Wave Animation Effect */}
              <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none opacity-10">
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 5, 0]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute bottom-0 left-0 right-0 h-[150%] bg-blue-500"
                  style={{
                    top: `${100 - Math.min(((currentLog.water || 0) / goals.waterGoal) * 100, 100)}%`
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full max-w-xs mt-8">
              <button 
                onClick={() => updateWater(-250)}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-3xl border border-zinc-100 shadow-sm active:scale-95 transition-transform"
              >
                <Minus size={20} className="text-zinc-400" />
                <span className="text-[10px] font-bold uppercase">250ml</span>
              </button>
              <button 
                onClick={() => updateWater(250)}
                className="flex flex-col items-center gap-2 p-4 bg-blue-500 text-white rounded-3xl shadow-lg shadow-blue-200 active:scale-95 transition-transform"
              >
                <Plus size={20} />
                <span className="text-[10px] font-bold uppercase">250ml</span>
              </button>
              <button 
                onClick={() => updateWater(500)}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-3xl border border-zinc-100 shadow-sm active:scale-95 transition-transform"
              >
                <Plus size={20} className="text-blue-500" />
                <span className="text-[10px] font-bold uppercase">500ml</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-zinc-400 mt-4">
              <GlassWater size={16} />
              <span className="text-xs font-medium">
                {Math.round((currentLog.water || 0) / 250)} copos de 250ml consumidos
              </span>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100">
              <div className="flex items-center gap-3 mb-8">
                <History className="text-zinc-900" />
                <h2 className="text-2xl font-black tracking-tighter">Histórico e Resumo</h2>
              </div>

              {/* Weekly Summary */}
              <div className="mb-8 p-6 bg-zinc-900 text-white rounded-[32px] space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} />
                  <h3 className="font-bold text-sm uppercase tracking-widest">Média Últimos 7 Dias</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold">Calorias</p>
                    <p className="text-xl font-black">
                      {Math.round(logs.slice(-7).reduce((acc, log) => {
                        return acc + log.meals.reduce((mAcc, m) => mAcc + m.items.reduce((iAcc, i) => {
                          const f = FOODS.find(food => food.id === i.foodId);
                          return iAcc + (f ? (f.calories * (i.amount * (UNIT_CONVERSIONS[i.unit] || 1)) / f.baseAmount) : 0);
                        }, 0), 0);
                      }, 0) / Math.max(logs.length, 1))} kcal
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold">Proteína</p>
                    <p className="text-xl font-black">
                      {Math.round(logs.slice(-7).reduce((acc, log) => {
                        return acc + log.meals.reduce((mAcc, m) => mAcc + m.items.reduce((iAcc, i) => {
                          const f = FOODS.find(food => food.id === i.foodId);
                          return iAcc + (f ? (f.protein * (i.amount * (UNIT_CONVERSIONS[i.unit] || 1)) / f.baseAmount) : 0);
                        }, 0), 0);
                      }, 0) / Math.max(logs.length, 1))}g
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {logs.sort((a, b) => b.date.localeCompare(a.date)).map(log => {
                  const logDate = new Date(log.date + 'T12:00:00');
                  const logTotals = log.meals.reduce((acc, meal) => {
                    meal.items.forEach(item => {
                      const food = FOODS.find(f => f.id === item.foodId);
                      if (food) {
                        const factor = (item.amount * (UNIT_CONVERSIONS[item.unit] || 1)) / food.baseAmount;
                        acc.calories += food.calories * factor;
                      }
                    });
                    return acc;
                  }, { calories: 0 });

                  return (
                    <button 
                      key={log.date}
                      onClick={() => {
                        setCurrentDate(logDate);
                        setActiveTab('daily');
                      }}
                      className="w-full flex items-center justify-between p-4 bg-zinc-50 rounded-2xl hover:bg-zinc-100 transition-colors"
                    >
                      <div className="text-left">
                        <p className="text-sm font-bold">{format(logDate, 'dd MMMM yyyy', { locale: ptBR })}</p>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest">{Math.round(logTotals.calories)} kcal</p>
                      </div>
                      <ChevronRight size={18} className="text-zinc-300" />
                    </button>
                  );
                })}
                {logs.length === 0 && (
                  <p className="text-center text-zinc-400 text-sm italic py-8">Nenhum registro encontrado.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shopping' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100">
              <div className="flex items-center gap-3 mb-6">
                <ShoppingCart className="text-zinc-900" />
                <h2 className="text-2xl font-black tracking-tighter">Lista de Compras</h2>
              </div>
              
              {shoppingList.length > 0 ? (
                <div className="space-y-4">
                  {shoppingList.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 group">
                      <div className="w-5 h-5 border-2 border-zinc-200 rounded-md group-hover:border-zinc-900 transition-colors" />
                      <div className="flex-1 border-b border-zinc-50 pb-2">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="ml-2 text-xs text-zinc-400">{item.amount} {item.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-zinc-400 text-sm italic">Sua lista está vazia. Adicione alimentos à sua dieta para gerar a lista automaticamente.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-zinc-100">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white">
                    <Calculator size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tighter">Calculadora de Metas</h2>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Mifflin-St Jeor Equation</p>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Profile Header in Settings */}
                <div className="flex items-center gap-6 p-6 bg-zinc-50 rounded-[32px]">
                  <div className="relative">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-zinc-300 overflow-hidden border-2 border-white shadow-sm">
                      {profile.photoUrl ? (
                        <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User size={32} />
                      )}
                    </div>
                    <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center text-white cursor-pointer hover:bg-zinc-800 transition-colors shadow-lg border-2 border-zinc-50">
                      <Camera size={14} />
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                  <div>
                    <h3 className="font-black text-xl tracking-tight">{profile.name || 'Seu Nome'}</h3>
                    <p className="text-xs text-zinc-500">{profile.weight}kg • {profile.height}cm • {profile.age} anos</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Name Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest ml-1">Seu Nome</label>
                    <input 
                      type="text" 
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      className="w-full bg-zinc-50 border-2 border-transparent rounded-2xl p-4 text-sm font-bold focus:border-zinc-900 focus:bg-white outline-none transition-all"
                      placeholder="Como podemos te chamar?"
                    />
                  </div>

                  {/* Goal & Diet Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest ml-1">Objetivo</label>
                      <div className="relative">
                        <select 
                          value={profile.goalType}
                          onChange={(e) => setProfile({...profile, goalType: e.target.value as any})}
                          className="w-full bg-zinc-50 border-2 border-transparent rounded-2xl p-4 text-sm font-bold focus:border-zinc-900 focus:bg-white outline-none appearance-none transition-all"
                        >
                          <option value="lose">Perder Peso</option>
                          <option value="maintain">Manter Peso</option>
                          <option value="gain">Ganhar Massa</option>
                        </select>
                        <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 rotate-90" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest ml-1">Tipo de Dieta</label>
                      <div className="relative">
                        <select 
                          value={profile.dietType}
                          onChange={(e) => setProfile({...profile, dietType: e.target.value as any})}
                          className="w-full bg-zinc-50 border-2 border-transparent rounded-2xl p-4 text-sm font-bold focus:border-zinc-900 focus:bg-white outline-none appearance-none transition-all"
                        >
                          <option value="balanced">Equilibrada</option>
                          <option value="lowcarb">Low Carb</option>
                          <option value="highprotein">Alta Proteína</option>
                        </select>
                        <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 rotate-90" />
                      </div>
                    </div>
                  </div>

                  {/* Physical Data Inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest ml-1">Peso (kg)</label>
                      <input 
                        type="number" 
                        value={profile.weight}
                        onChange={(e) => setProfile({...profile, weight: Number(e.target.value)})}
                        className="w-full bg-zinc-50 border-2 border-transparent rounded-2xl p-4 text-sm font-bold focus:border-zinc-900 focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest ml-1">Altura (cm)</label>
                      <input 
                        type="number" 
                        value={profile.height}
                        onChange={(e) => setProfile({...profile, height: Number(e.target.value)})}
                        className="w-full bg-zinc-50 border-2 border-transparent rounded-2xl p-4 text-sm font-bold focus:border-zinc-900 focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest ml-1">Idade</label>
                      <input 
                        type="number" 
                        value={profile.age}
                        onChange={(e) => setProfile({...profile, age: Number(e.target.value)})}
                        className="w-full bg-zinc-50 border-2 border-transparent rounded-2xl p-4 text-sm font-bold focus:border-zinc-900 focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest ml-1">Gênero</label>
                      <div className="relative">
                        <select 
                          value={profile.gender}
                          onChange={(e) => setProfile({...profile, gender: e.target.value as 'male' | 'female'})}
                          className="w-full bg-zinc-50 border-2 border-transparent rounded-2xl p-4 text-sm font-bold focus:border-zinc-900 focus:bg-white outline-none appearance-none transition-all"
                        >
                          <option value="male">Masculino</option>
                          <option value="female">Feminino</option>
                        </select>
                        <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest ml-1">Nível de Atividade</label>
                    <div className="relative">
                      <select 
                        value={profile.activityLevel}
                        onChange={(e) => setProfile({...profile, activityLevel: Number(e.target.value)})}
                        className="w-full bg-zinc-50 border-2 border-transparent rounded-2xl p-4 text-sm font-bold focus:border-zinc-900 focus:bg-white outline-none appearance-none transition-all"
                      >
                        <option value={1.2}>Sedentário (pouco ou nenhum exercício)</option>
                        <option value={1.375}>Levemente ativo (1-3 dias/semana)</option>
                        <option value={1.55}>Moderadamente ativo (3-5 dias/semana)</option>
                        <option value={1.725}>Muito ativo (6-7 dias/semana)</option>
                        <option value={1.9}>Extremamente ativo (atleta, trabalho físico)</option>
                      </select>
                      <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-6">
                  <button 
                    onClick={saveProfileAndCalculate}
                    className="w-full bg-zinc-900 text-white font-bold py-5 rounded-3xl hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-lg shadow-zinc-200 flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    Atualizar Perfil e Metas
                  </button>
                  
                  {/* Macro Distribution Visualization */}
                  <div className="p-8 bg-zinc-900 text-white rounded-[40px] space-y-8 shadow-2xl shadow-zinc-300">
                    <div className="flex justify-between items-end">
                      <div>
                        <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-widest mb-1">Meta Diária</h3>
                        <p className="text-4xl font-black tracking-tighter">{goals.calories} <span className="text-lg font-normal text-zinc-500">kcal</span></p>
                      </div>
                      <div className="text-right">
                        <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-widest mb-1">Água</h3>
                        <p className="text-2xl font-black tracking-tighter">{goals.waterGoal} <span className="text-sm font-normal text-zinc-500">ml</span></p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex h-4 w-full rounded-full overflow-hidden bg-zinc-800">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(goals.protein * 4 / goals.calories) * 100}%` }}
                          className="bg-orange-500 h-full"
                        />
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(goals.carbs * 4 / goals.calories) * 100}%` }}
                          className="bg-blue-500 h-full"
                        />
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(goals.fat * 9 / goals.calories) * 100}%` }}
                          className="bg-yellow-500 h-full"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            <span className="text-[10px] font-bold uppercase text-zinc-400">Proteína</span>
                          </div>
                          <p className="text-lg font-black">{goals.protein}g</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-[10px] font-bold uppercase text-zinc-400">Carbos</span>
                          </div>
                          <p className="text-lg font-black">{goals.carbs}g</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            <span className="text-[10px] font-bold uppercase text-zinc-400">Gordura</span>
                          </div>
                          <p className="text-lg font-black">{goals.fat}g</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-800 space-y-4">
                      <h4 className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Ajuste Fino Manual</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 uppercase font-bold">Calorias</label>
                          <input 
                            type="number" 
                            value={manualCalories}
                            onChange={(e) => setManualCalories(e.target.value)}
                            onBlur={handleManualCalorieBlur}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                            }}
                            className="w-full bg-zinc-800 border-none rounded-2xl p-3 text-sm font-bold focus:ring-1 focus:ring-white outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 uppercase font-bold">Água (ml)</label>
                          <input 
                            type="number" 
                            value={goals.waterGoal}
                            onChange={(e) => setGoals({...goals, waterGoal: Number(e.target.value)})}
                            className="w-full bg-zinc-800 border-none rounded-2xl p-3 text-sm font-bold focus:ring-1 focus:ring-white outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Aggressive Goal Warning Modal */}
      <AnimatePresence>
        {aggressiveWarning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl"
            >
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-black tracking-tight mb-2">Aviso Importante</h3>
              <p className="text-sm text-zinc-600 mb-4">
                <strong className="text-red-500">⚠️ Calorias muito baixas podem ser prejudiciais.</strong>
                <br/><br/>
                O limite recomendado para {profile.gender === 'female' ? 'mulheres' : 'homens'} é de {profile.gender === 'female' ? 1300 : 1500} kcal.
                Você está escolhendo uma meta agressiva de {aggressiveWarning.pendingCalories} kcal. Deseja continuar?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setManualCalories(goals.calories.toString());
                    setAggressiveWarning(null);
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-zinc-500 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    updateGoalsWithCalories(aggressiveWarning.pendingCalories);
                    setAggressiveWarning(null);
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                >
                  Sim, continuar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Food Picker Modal */}
      <AnimatePresence>
        {isAddingFood && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[80vh] rounded-t-[40px] sm:rounded-[40px] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-zinc-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black tracking-tighter">Adicionar ao {isAddingFood.mealType}</h2>
                  <button onClick={() => setIsAddingFood(null)} className="p-2 hover:bg-zinc-100 rounded-full">
                    <Trash2 size={20} className="text-zinc-400" />
                  </button>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Buscar alimento..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                      selectedCategory === 'all' ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                    )}
                  >
                    Todos
                  </button>
                  {Array.from(new Set(FOODS.map(f => f.category))).map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all capitalize",
                        selectedCategory === cat ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
                  <button 
                    onClick={() => setFilters({...filters, cheap: !filters.cheap})}
                    className={cn("px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all", filters.cheap ? "bg-green-50 border-green-200 text-green-700" : "border-zinc-200 text-zinc-400")}
                  >
                    Barato
                  </button>
                  <button 
                    onClick={() => setFilters({...filters, highProtein: !filters.highProtein})}
                    className={cn("px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all", filters.highProtein ? "bg-orange-50 border-orange-200 text-orange-700" : "border-zinc-200 text-zinc-400")}
                  >
                    + Proteína
                  </button>
                  <button 
                    onClick={() => setFilters({...filters, lowCarb: !filters.lowCarb})}
                    className={cn("px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all", filters.lowCarb ? "bg-blue-50 border-blue-200 text-blue-700" : "border-zinc-200 text-zinc-400")}
                  >
                    Low Carb
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {selectedFoodForAmount ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-zinc-50 rounded-[32px] p-8 space-y-6"
                  >
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-black tracking-tight">{selectedFoodForAmount.name}</h3>
                      <p className="text-xs text-zinc-400 uppercase tracking-widest">Defina a quantidade</p>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-400">Quantidade</label>
                        <input 
                          type="number" 
                          value={amountInput}
                          onChange={(e) => setAmountInput(Number(e.target.value))}
                          className="w-full bg-white border-none rounded-2xl p-4 text-center text-lg font-bold outline-none focus:ring-2 focus:ring-zinc-900"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-400">Unidade</label>
                        <select 
                          value={unitInput}
                          onChange={(e) => setUnitInput(e.target.value as Unit)}
                          className="w-full bg-white border-none rounded-2xl p-4 text-center text-sm font-bold outline-none focus:ring-2 focus:ring-zinc-900 appearance-none"
                        >
                          <option value="gramas">Gramas</option>
                          <option value="colher">Colher</option>
                          <option value="concha">Concha</option>
                          <option value="unidade">Unidade</option>
                          <option value="fatia">Fatia</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <button 
                        onClick={() => setSelectedFoodForAmount(null)}
                        className="bg-zinc-200 text-zinc-600 font-bold py-4 rounded-2xl hover:bg-zinc-300 transition-colors"
                      >
                        Voltar
                      </button>
                      <button 
                        onClick={() => {
                          addFoodToMeal(selectedFoodForAmount.id, amountInput, unitInput, isAddingFood.mealType);
                          setSelectedFoodForAmount(null);
                        }}
                        className="bg-zinc-900 text-white font-bold py-4 rounded-2xl hover:bg-zinc-800 transition-colors"
                      >
                        Adicionar
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  filteredFoods.map(food => (
                    <div key={food.id} className="bg-zinc-50 rounded-3xl p-4 flex justify-between items-center group hover:bg-zinc-100 transition-colors">
                      <div>
                        <h4 className="font-bold text-sm">{food.name}</h4>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest">{food.calories} kcal / {food.baseAmount}{food.baseUnit}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setSelectedFoodForAmount(food);
                            setAmountInput(food.baseAmount);
                            setUnitInput(food.baseUnit);
                          }}
                          className="bg-white text-zinc-900 p-3 rounded-2xl shadow-sm hover:scale-110 transition-transform"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Substitution Modal */}
      <AnimatePresence>
        {isSubstituting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-lg h-[80vh] sm:h-auto sm:max-h-[70vh] rounded-t-[40px] sm:rounded-[40px] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-zinc-100">
                <h2 className="text-2xl font-black tracking-tighter">Trocar por Equivalente</h2>
                <p className="text-xs text-zinc-400 uppercase tracking-widest mt-1">Sugestões na categoria: {isSubstituting.category}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {FOODS.filter(f => f.category === isSubstituting.category).map(food => (
                  <button 
                    key={food.id}
                    onClick={() => substituteFood(isSubstituting.mealType, isSubstituting.itemIndex, food.id)}
                    className="w-full bg-zinc-50 rounded-3xl p-4 flex justify-between items-center hover:bg-zinc-100 transition-colors"
                  >
                    <div className="text-left">
                      <h4 className="font-bold text-sm">{food.name}</h4>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest">{food.calories} kcal / {food.baseAmount}{food.baseUnit}</p>
                    </div>
                    <ArrowRightLeft size={18} className="text-zinc-300" />
                  </button>
                ))}
              </div>
              <div className="p-4">
                <button 
                  onClick={() => setIsSubstituting(null)}
                  className="w-full bg-zinc-100 text-zinc-500 font-bold py-4 rounded-2xl"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-zinc-200 px-6 py-4 flex justify-around items-center z-40">
        <button 
          onClick={() => setActiveTab('daily')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'daily' ? "text-zinc-900" : "text-zinc-300")}
        >
          <Calendar size={24} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Diário</span>
        </button>
        <button 
          onClick={() => setActiveTab('water')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'water' ? "text-zinc-900" : "text-zinc-300")}
        >
          <Droplets size={24} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Água</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'history' ? "text-zinc-900" : "text-zinc-300")}
        >
          <History size={24} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Histórico</span>
        </button>
        <button 
          onClick={() => setActiveTab('shopping')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'shopping' ? "text-zinc-900" : "text-zinc-300")}
        >
          <ShoppingCart size={24} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Lista</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'settings' ? "text-zinc-900" : "text-zinc-300")}
        >
          <Calculator size={24} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Metas</span>
        </button>
      </nav>
    </>
    )}
  </div>
);
}
