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
  Droplets
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
import { GoogleGenAI } from "@google/genai";
import { auth, db } from './firebase';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';

const MEAL_TYPES: MealType[] = ['café da manhã', 'almoço', 'lanche', 'jantar', 'ceia'];

const INITIAL_GOALS: UserGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
  tdee: 2000,
  waterGoal: 2000
};

export default function App() {
  // --- Auth State ---
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- State ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [goals, setGoals] = useState<UserGoals>(INITIAL_GOALS);
  const [profile, setProfile] = useState<UserProfile>({
    userId: '',
    name: '',
    photoUrl: '',
    weight: 70,
    height: 170,
    age: 30,
    gender: 'male',
    activityLevel: 1.2
  });
  const [hasProfile, setHasProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'daily' | 'history' | 'shopping' | 'settings'>('daily');
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
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [notifications, setNotifications] = useState<{ id: string; message: string }[]>([]);

  // --- Auth & Data Fetching ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch Profile
        const profileDoc = await getDoc(doc(db, 'users', user.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as UserProfile);
          setHasProfile(true);
        } else {
          setProfile(prev => ({ ...prev, userId: user.uid, name: user.displayName || '' }));
          setHasProfile(false);
        }

        // Fetch Logs
        const q = query(collection(db, 'logs'), where('userId', '==', user.uid));
        const unsubscribeLogs = onSnapshot(q, (snapshot) => {
          const fetchedLogs = snapshot.docs.map(doc => doc.data() as DailyLog);
          setLogs(fetchedLogs);
        });

        return () => unsubscribeLogs();
      } else {
        setHasProfile(false);
        setLogs([]);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- Handlers ---
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro no login com Google:", error);
      alert("Erro ao entrar com Google.");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error("Erro na autenticação:", error);
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const saveProfileAndCalculate = async () => {
    if (!profile.name) {
      alert("Por favor, insira seu nome.");
      return;
    }
    if (!user) return;

    const { weight, height, age, gender, activityLevel } = profile;
    let bmr = 0;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    const tdee = Math.round(bmr * activityLevel);
    const bmi = Number((weight / Math.pow(height / 100, 2)).toFixed(1));
    
    const newGoals = {
      ...goals,
      tdee,
      calories: tdee,
      protein: Math.round(weight * 2),
      carbs: Math.round((tdee * 0.4) / 4),
      fat: Math.round((tdee * 0.3) / 9),
      waterGoal: Math.round(weight * 35), // 35ml per kg
    };
    
    setGoals(newGoals);

    const updatedProfile = { 
      ...profile, 
      userId: user.uid,
      bmi,
      bmr,
      tdee,
      reminders: profile.reminders || {
        water: { enabled: true, interval: 60 },
        meals: { enabled: true, times: ['08:00', '12:00', '16:00', '20:00'] },
        protein: { enabled: true, target: 80 }
      }
    };
    await setDoc(doc(db, 'users', user.uid), updatedProfile);
    setProfile(updatedProfile);
    setHasProfile(true);
  };

  const updateLogsInFirestore = async (newLogs: DailyLog[]) => {
    if (!user) return;
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const log = newLogs.find(l => l.date === dateStr);
    if (log) {
      await setDoc(doc(db, 'logs', `${user.uid}_${dateStr}`), { ...log, userId: user.uid });
    }
  };

  const addWater = (amount: number) => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const newLogs = [...logs];
    let logIndex = newLogs.findIndex(l => l.date === dateStr);
    
    if (logIndex === -1) {
      newLogs.push({ userId: user?.uid || '', date: dateStr, meals: [], waterIntake: amount });
    } else {
      newLogs[logIndex].waterIntake = (newLogs[logIndex].waterIntake || 0) + amount;
    }
    
    setLogs(newLogs);
    updateLogsInFirestore(newLogs);
  };

  // --- Derived Data ---
  const currentLog = useMemo(() => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    return logs.find(l => l.date === dateStr) || { userId: user?.uid || '', date: dateStr, meals: [], waterIntake: 0 };
  }, [logs, currentDate, user]);

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

  // --- Reminders Logic ---
  useEffect(() => {
    if (!profile.reminders) return;

    const checkReminders = () => {
      const now = new Date();
      const timeStr = format(now, 'HH:mm');

      // Meal Reminders
      if (profile.reminders?.meals.enabled) {
        if (profile.reminders.meals.times.includes(timeStr)) {
          addNotification(`Hora de comer! 🍽️`);
        }
      }

      // Protein Reminder (check at 8 PM)
      if (profile.reminders?.protein.enabled && timeStr === '20:00') {
        const proteinPercentage = (totals.protein / goals.protein) * 100;
        if (proteinPercentage < profile.reminders.protein.target) {
          addNotification(`Atenção! Você atingiu apenas ${Math.round(proteinPercentage)}% da sua meta de proteína. 🥩`);
        }
      }
    };

    const addNotification = (message: string) => {
      const id = Math.random().toString(36).substr(2, 9);
      setNotifications(prev => [...prev, { id, message }]);
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [profile.reminders, totals, goals]);

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

  // --- AI Suggestions ---
  useEffect(() => {
    const getAiFeedback = async () => {
      if (!process.env.GEMINI_API_KEY) return;
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        Com base na dieta de hoje:
        Meta: ${goals.calories}kcal, ${goals.protein}g prot, ${goals.carbs}g carb, ${goals.fat}g gord.
        Consumido: ${Math.round(totals.calories)}kcal, ${Math.round(totals.protein)}g prot, ${Math.round(totals.carbs)}g carb, ${Math.round(totals.fat)}g gord.
        
        Dê uma sugestão curta e motivadora em português (máximo 15 palavras). 
        Exemplo: "Faltam 20g de proteína, tente adicionar ovos no jantar." ou "Você passou 300kcal, foque em fibras agora."
      `;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
        });
        setAiSuggestion(response.text || '');
      } catch (e) {
        console.error(e);
      }
    };

    const timer = setTimeout(getAiFeedback, 2000);
    return () => clearTimeout(timer);
  }, [totals, goals]);

  // --- Handlers ---
  const addFoodToMeal = (foodId: string, amount: number, unit: Unit, mealType: MealType) => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const newLogs = [...logs];
    let logIndex = newLogs.findIndex(l => l.date === dateStr);
    
    if (logIndex === -1) {
      newLogs.push({ userId: user?.uid || '', date: dateStr, meals: [], waterIntake: 0 });
      logIndex = newLogs.length - 1;
    }

    const log = newLogs[logIndex];
    let mealIndex = log.meals.findIndex(m => m.type === mealType);
    
    if (mealIndex === -1) {
      log.meals.push({ type: mealType, items: [] });
      mealIndex = log.meals.length - 1;
    }

    log.meals[mealIndex].items.push({ foodId, amount, unit });
    setLogs(newLogs);
    updateLogsInFirestore(newLogs);
    setIsAddingFood(null);
  };

  const removeFoodFromMeal = (mealType: MealType, itemIndex: number) => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const newLogs = [...logs];
    const logIndex = newLogs.findIndex(l => l.date === dateStr);
    if (logIndex === -1) return;

    const log = newLogs[logIndex];
    const mealIndex = log.meals.findIndex(m => m.type === mealType);
    if (mealIndex === -1) return;

    log.meals[mealIndex].items.splice(itemIndex, 1);
    setLogs(newLogs);
    updateLogsInFirestore(newLogs);
  };

  const substituteFood = (mealType: MealType, itemIndex: number, newFoodId: string) => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const newLogs = [...logs];
    const logIndex = newLogs.findIndex(l => l.date === dateStr);
    if (logIndex === -1) return;

    const log = newLogs[logIndex];
    const mealIndex = log.meals.findIndex(m => m.type === mealType);
    if (mealIndex === -1) return;

    const item = log.meals[mealIndex].items[itemIndex];
    item.foodId = newFoodId;
    setLogs(newLogs);
    updateLogsInFirestore(newLogs);
    setIsSubstituting(null);
  };

  const duplicateMeal = (mealType: MealType) => {
    // Logic to duplicate meal from previous day or another meal
    const yesterday = subDays(currentDate, 1);
    const dateStr = format(yesterday, 'yyyy-MM-dd');
    const prevLog = logs.find(l => l.date === dateStr);
    if (!prevLog) return;

    const prevMeal = prevLog.meals.find(m => m.type === mealType);
    if (!prevMeal) return;

    const todayStr = format(currentDate, 'yyyy-MM-dd');
    const newLogs = [...logs];
    let todayLogIndex = newLogs.findIndex(l => l.date === todayStr);
    
    if (todayLogIndex === -1) {
      newLogs.push({ userId: user?.uid || '', date: todayStr, meals: [], waterIntake: 0 });
      todayLogIndex = newLogs.length - 1;
    }

    const todayLog = newLogs[todayLogIndex];
    let todayMealIndex = todayLog.meals.findIndex(m => m.type === mealType);
    
    if (todayMealIndex === -1) {
      todayLog.meals.push({ type: mealType, items: [...prevMeal.items] });
    } else {
      todayLog.meals[todayMealIndex].items = [...todayLog.meals[todayMealIndex].items, ...prevMeal.items];
    }
    
    setLogs(newLogs);
    updateLogsInFirestore(newLogs);
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

  return (
    <div className="min-h-screen bg-[#F5F5F3] text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
      {authLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !user ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-xl border border-zinc-100 space-y-8"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-zinc-900 rounded-3xl flex items-center justify-center text-white mx-auto mb-4">
                <Utensils size={32} />
              </div>
              <h1 className="text-3xl font-black tracking-tighter">NutriPlan</h1>
              <p className="text-zinc-500 text-sm">Sua jornada nutricional começa aqui.</p>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Senha</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-zinc-900 text-white font-bold py-4 rounded-2xl hover:bg-zinc-800 transition-all active:scale-[0.98]"
              >
                {authMode === 'login' ? 'Entrar' : 'Criar Conta'}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-100" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-zinc-400">Ou</span></div>
            </div>

            <button 
              onClick={handleGoogleLogin}
              className="w-full bg-white border border-zinc-200 text-zinc-900 font-bold py-4 rounded-2xl hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.png" alt="Google" className="w-5 h-5" />
              Entrar com Google
            </button>

            <p className="text-center text-sm text-zinc-500">
              {authMode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="ml-1 font-bold text-zinc-900 hover:underline"
              >
                {authMode === 'login' ? 'Cadastre-se' : 'Faça Login'}
              </button>
            </p>
          </motion.div>
        </div>
      ) : !hasProfile ? (
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
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-zinc-400 font-medium">🔥 {Math.round(totals.calories)} kcal</span>
                  <span className="text-[10px] text-zinc-400 font-medium">💧 {currentLog.waterIntake || 0} / {goals.waterGoal} ml</span>
                </div>
              </div>
            </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCurrentDate(subDays(currentDate, 1))}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold">
              {isSameDay(currentDate, new Date()) ? 'Hoje' : format(currentDate, 'dd MMM', { locale: ptBR })}
            </span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">
              {format(currentDate, 'EEEE', { locale: ptBR })}
            </span>
          </div>
          <button 
            onClick={() => setCurrentDate(addDays(currentDate, 1))}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto pb-24 px-4 pt-6">
        {activeTab === 'daily' && (
          <div className="space-y-8">
            {/* Dashboard Card */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter leading-none">
                    {Math.round(totals.calories)} <span className="text-lg font-normal text-zinc-400">kcal</span>
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">Meta: {goals.calories} kcal</p>
                </div>
                {totals.calories > goals.calories && (
                  <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 animate-pulse">
                    <AlertTriangle size={12} /> LIMITE EXCEDIDO
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <ProgressBar label="Proteína" current={totals.protein} target={goals.protein} color="bg-orange-500" />
                <ProgressBar label="Carboidratos" current={totals.carbs} target={goals.carbs} color="bg-blue-500" />
                <ProgressBar label="Gorduras" current={totals.fat} target={goals.fat} color="bg-yellow-500" />
              </div>

              {aiSuggestion && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex gap-3 items-start"
                >
                  <div className="w-8 h-8 bg-zinc-900 rounded-full flex-shrink-0 flex items-center justify-center text-white">
                    <Star size={14} fill="currentColor" />
                  </div>
                  <p className="text-sm italic text-zinc-700 leading-tight">
                    "{aiSuggestion}"
                  </p>
                </motion.div>
              )}
            </section>

            {/* Meals List */}
            <div className="space-y-4">
              {/* Hydration Card */}
              <div className="bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm">
                <div className="px-6 py-4 flex justify-between items-center bg-blue-50/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-500">
                      <Droplets size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Hidratação</h3>
                      <p className="text-[10px] text-blue-400 font-medium uppercase tracking-widest">Meta: {goals.waterGoal} ml</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => addWater(200)}
                      className="px-3 py-1.5 bg-blue-500 text-white text-[10px] font-bold rounded-xl hover:bg-blue-600 transition-colors"
                    >
                      +200ml
                    </button>
                    <button 
                      onClick={() => addWater(250)}
                      className="px-3 py-1.5 bg-blue-500 text-white text-[10px] font-bold rounded-xl hover:bg-blue-600 transition-colors"
                    >
                      +250ml
                    </button>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
                    <span>Progresso</span>
                    <span>{Math.round(((currentLog.waterIntake || 0) / goals.waterGoal) * 100)}%</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(((currentLog.waterIntake || 0) / goals.waterGoal) * 100), 100}%` }}
                      className="h-full bg-blue-500 rounded-full"
                    />
                  </div>
                </div>
              </div>

              {MEAL_TYPES.map((type) => {
                const meal = currentLog.meals.find(m => m.type === type);
                const mealCalories = meal?.items.reduce((acc, item) => {
                  const food = FOODS.find(f => f.id === item.foodId);
                  if (!food) return acc;
                  return acc + (food.calories * (item.amount * (UNIT_CONVERSIONS[item.unit] || 1)) / food.baseAmount);
                }, 0) || 0;

                return (
                  <div key={type} className="bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm">
                    <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400">
                          {type === 'café da manhã' && <Coffee size={20} />}
                          {type === 'almoço' && <Sun size={20} />}
                          {type === 'lanche' && <Star size={20} />}
                          {type === 'jantar' && <Moon size={20} />}
                          {type === 'ceia' && <Moon size={20} />}
                        </div>
                        <div>
                          <h3 className="font-bold capitalize text-sm">{type}</h3>
                          <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest">{Math.round(mealCalories)} kcal</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => duplicateMeal(type)}
                          className="p-2 hover:bg-zinc-50 rounded-xl text-zinc-400 transition-colors"
                          title="Duplicar de ontem"
                        >
                          <Copy size={18} />
                        </button>
                        <button 
                          onClick={() => setIsAddingFood({ mealType: type })}
                          className="p-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                    
                    {meal && meal.items.length > 0 ? (
                      <div className="divide-y divide-zinc-50">
                        {meal.items.map((item, idx) => {
                          const food = FOODS.find(f => f.id === item.foodId);
                          if (!food) return null;
                          const cals = (food.calories * (item.amount * (UNIT_CONVERSIONS[item.unit] || 1)) / food.baseAmount);
                          return (
                            <div key={idx} className="px-6 py-3 flex justify-between items-center group">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{food.name}</span>
                                <span className="text-[10px] text-zinc-400">{item.amount} {item.unit} • {Math.round(cals)} kcal</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={() => {
                                    const category = food.category;
                                    setIsSubstituting({ mealType: type, itemIndex: idx, category });
                                  }}
                                  className="text-zinc-300 hover:text-zinc-900 transition-colors"
                                  title="Trocar por equivalente"
                                >
                                  <ArrowRightLeft size={14} />
                                </button>
                                <button 
                                  onClick={() => removeFoodFromMeal(type, idx)}
                                  className="text-zinc-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-6 py-8 text-center">
                        <p className="text-xs text-zinc-400 italic">Nenhum alimento adicionado</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100">
              <div className="flex items-center gap-3 mb-8">
                <History className="text-zinc-900" />
                <h2 className="text-2xl font-black tracking-tighter">Histórico e Evolução</h2>
              </div>

              {/* Evolution Chart */}
              <div className="mb-8 p-6 bg-zinc-50 rounded-[32px] space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-zinc-900" />
                  <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-900">Evolução Calórica (7 dias)</h3>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={logs.slice(-7).sort((a,b) => a.date.localeCompare(b.date)).map(log => {
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
                      return {
                        date: format(new Date(log.date + 'T12:00:00'), 'dd/MM'),
                        kcal: Math.round(logTotals.calories),
                        meta: goals.calories
                      };
                    })}>
                      <defs>
                        <linearGradient id="colorKcal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#18181b" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#a1a1aa'}} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="kcal" stroke="#18181b" strokeWidth={2} fillOpacity={1} fill="url(#colorKcal)" />
                      <Line type="monotone" dataKey="meta" stroke="#ef4444" strokeDasharray="5 5" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
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
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100">
              <div className="flex items-center gap-3 mb-8">
                <Settings className="text-zinc-900" />
                <h2 className="text-2xl font-black tracking-tighter">Meu Perfil</h2>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 mb-4">
                  <div className="relative w-24 h-24">
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
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Nome</label>
                  <input 
                    type="text" 
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
                  />
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
                    <option value={1.2}>Sedentário (pouco ou nenhum exercício)</option>
                    <option value={1.375}>Levemente ativo (1-3 dias/semana)</option>
                    <option value={1.55}>Moderadamente ativo (3-5 dias/semana)</option>
                    <option value={1.725}>Muito ativo (6-7 dias/semana)</option>
                    <option value={1.9}>Extremamente ativo (atleta, trabalho físico)</option>
                  </select>
                </div>

                <div className="pt-4 space-y-4">
                  <button 
                    onClick={saveProfileAndCalculate}
                    className="w-full bg-zinc-900 text-white font-bold py-4 rounded-2xl hover:bg-zinc-800 transition-all active:scale-[0.98]"
                  >
                    Atualizar Perfil e Metas
                  </button>
                  
                  <div className="p-4 bg-zinc-50 rounded-2xl space-y-2">
                    <h3 className="text-xs font-bold uppercase text-zinc-400">Metas Atuais</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between"><span>Calorias:</span> <span className="font-bold">{goals.calories}</span></div>
                      <div className="flex justify-between"><span>Proteína:</span> <span className="font-bold">{goals.protein}g</span></div>
                      <div className="flex justify-between"><span>Carbos:</span> <span className="font-bold">{goals.carbs}g</span></div>
                      <div className="flex justify-between"><span>Gordura:</span> <span className="font-bold">{goals.fat}g</span></div>
                      <div className="flex justify-between"><span>Água:</span> <span className="font-bold">{goals.waterGoal}ml</span></div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-100">
                    <h3 className="text-xs font-bold uppercase text-zinc-400 mb-4 tracking-widest">Calculadora Nutricional</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-zinc-50 p-4 rounded-2xl text-center">
                        <p className="text-[10px] text-zinc-400 uppercase font-bold">IMC</p>
                        <p className="text-lg font-black">{profile.bmi || '--'}</p>
                        <p className="text-[8px] text-zinc-500 mt-1">
                          {profile.bmi ? (
                            profile.bmi < 18.5 ? 'Abaixo' : 
                            profile.bmi < 25 ? 'Normal' : 
                            profile.bmi < 30 ? 'Sobrepeso' : 'Obesidade'
                          ) : ''}
                        </p>
                      </div>
                      <div className="bg-zinc-50 p-4 rounded-2xl text-center">
                        <p className="text-[10px] text-zinc-400 uppercase font-bold">TMB</p>
                        <p className="text-lg font-black">{profile.bmr || '--'}</p>
                        <p className="text-[8px] text-zinc-500 mt-1">kcal/dia</p>
                      </div>
                      <div className="bg-zinc-50 p-4 rounded-2xl text-center">
                        <p className="text-[10px] text-zinc-400 uppercase font-bold">Gasto</p>
                        <p className="text-lg font-black">{profile.tdee || '--'}</p>
                        <p className="text-[8px] text-zinc-500 mt-1">kcal/dia</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-100">
                    <h3 className="text-xs font-bold uppercase text-zinc-400 mb-4 tracking-widest">Lembretes Inteligentes</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <Droplets size={18} className="text-blue-500" />
                          <div>
                            <p className="text-sm font-bold">Beber Água</p>
                            <p className="text-[10px] text-zinc-400">A cada {profile.reminders?.water.interval} min</p>
                          </div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={profile.reminders?.water.enabled}
                          onChange={(e) => setProfile({
                            ...profile, 
                            reminders: {
                              ...profile.reminders!,
                              water: { ...profile.reminders!.water, enabled: e.target.checked }
                            }
                          })}
                          className="w-5 h-5 accent-zinc-900"
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <Utensils size={18} className="text-orange-500" />
                          <div>
                            <p className="text-sm font-bold">Refeições</p>
                            <p className="text-[10px] text-zinc-400">{profile.reminders?.meals.times.length || 0} horários definidos</p>
                          </div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={profile.reminders?.meals.enabled}
                          onChange={(e) => setProfile({
                            ...profile, 
                            reminders: {
                              ...profile.reminders!,
                              meals: { ...profile.reminders!.meals, enabled: e.target.checked }
                            }
                          })}
                          className="w-5 h-5 accent-zinc-900"
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <TrendingUp size={18} className="text-red-500" />
                          <div>
                            <p className="text-sm font-bold">Meta de Proteína</p>
                            <p className="text-[10px] text-zinc-400">Alerta se abaixo de {profile.reminders?.protein.target}%</p>
                          </div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={profile.reminders?.protein.enabled}
                          onChange={(e) => setProfile({
                            ...profile, 
                            reminders: {
                              ...profile.reminders!,
                              protein: { ...profile.reminders!.protein, enabled: e.target.checked }
                            }
                          })}
                          className="w-5 h-5 accent-zinc-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-100">
                    <button 
                      onClick={handleLogout}
                      className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-2xl hover:bg-red-100 transition-all active:scale-[0.98]"
                    >
                      Sair da Conta
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Notifications Overlay */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xs space-y-2 px-4">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div 
              key={n.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
            >
              <Info size={18} className="text-blue-400" />
              <p className="text-xs font-bold">{n.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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
