import { Food, Unit } from '../types';

export const FOODS: Food[] = [
  // Arroz, Macarrão, Batata
  { id: '1', name: 'Arroz Branco Cozido', category: 'arroz', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, baseUnit: 'gramas', baseAmount: 100, isCheap: true, isLactoseFree: true },
  { id: '2', name: 'Arroz Integral Cozido', category: 'arroz', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, fiber: 1.8, baseUnit: 'gramas', baseAmount: 100, isCheap: true, isLactoseFree: true },
  { id: '3', name: 'Macarrão Espaguete Cozido', category: 'macarrão', calories: 158, protein: 5.8, carbs: 31, fat: 0.9, fiber: 1.8, baseUnit: 'gramas', baseAmount: 100, isCheap: true, isLactoseFree: true },
  { id: '4', name: 'Batata Inglesa Cozida', category: 'batata', calories: 87, protein: 1.9, carbs: 20, fat: 0.1, fiber: 1.8, baseUnit: 'gramas', baseAmount: 100, isCheap: true, isLactoseFree: true, isLowFat: true },
  { id: '5', name: 'Batata Doce Cozida', category: 'batata', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, baseUnit: 'gramas', baseAmount: 100, isCheap: true, isLactoseFree: true, isLowFat: true },

  // Frango, Carne, Ovo, Peixe
  { id: '6', name: 'Frango Grelhado (Peito)', category: 'frango', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, baseUnit: 'gramas', baseAmount: 100, isHighProtein: true, isLowCarb: true, isLactoseFree: true },
  { id: '7', name: 'Carne Moída Patinho', category: 'carne', calories: 218, protein: 26, carbs: 0, fat: 12, fiber: 0, baseUnit: 'gramas', baseAmount: 100, isHighProtein: true, isLowCarb: true, isLactoseFree: true },
  { id: '8', name: 'Ovo Cozido', category: 'ovo', calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, baseUnit: 'unidade', baseAmount: 1, isHighProtein: true, isLowCarb: true, isLactoseFree: true, isCheap: true },
  { id: '9', name: 'Filé de Tilápia Grelhado', category: 'peixe', calories: 128, protein: 26, carbs: 0, fat: 2.7, fiber: 0, baseUnit: 'gramas', baseAmount: 100, isHighProtein: true, isLowCarb: true, isLowFat: true, isLactoseFree: true },

  // Feijão, Lentilha
  { id: '10', name: 'Feijão Carioca Cozido', category: 'feijão', calories: 76, protein: 4.8, carbs: 14, fat: 0.5, fiber: 8.5, baseUnit: 'gramas', baseAmount: 100, isCheap: true, isLactoseFree: true, isLowFat: true },
  { id: '11', name: 'Lentilha Cozida', category: 'lentilha', calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9, baseUnit: 'gramas', baseAmount: 100, isCheap: true, isLactoseFree: true, isLowFat: true },

  // Legumes
  { id: '12', name: 'Brócolis Cozido', category: 'legumes', calories: 35, protein: 2.4, carbs: 7.2, fat: 0.4, fiber: 3.3, baseUnit: 'gramas', baseAmount: 100, isLowCarb: true, isLowFat: true, isLactoseFree: true },
  { id: '13', name: 'Cenoura Cozida', category: 'legumes', calories: 35, protein: 0.8, carbs: 8.2, fat: 0.2, fiber: 3, baseUnit: 'gramas', baseAmount: 100, isLowFat: true, isLactoseFree: true },
  { id: '14', name: 'Alface', category: 'legumes', calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3, baseUnit: 'gramas', baseAmount: 100, isLowCarb: true, isLowFat: true, isLactoseFree: true },

  // Frutas
  { id: '15', name: 'Banana Prata', category: 'frutas', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, baseUnit: 'unidade', baseAmount: 1, isCheap: true, isLactoseFree: true },
  { id: '16', name: 'Maçã', category: 'frutas', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, baseUnit: 'unidade', baseAmount: 1, isLactoseFree: true },

  // Bebidas
  { id: '17', name: 'Suco de Laranja Natural', category: 'bebidas', calories: 45, protein: 0.7, carbs: 10, fat: 0.2, fiber: 0.2, baseUnit: 'gramas', baseAmount: 100, isLactoseFree: true },
  { id: '18', name: 'Café sem Açúcar', category: 'bebidas', calories: 1, protein: 0.1, carbs: 0, fat: 0, fiber: 0, baseUnit: 'gramas', baseAmount: 100, isLowCarb: true, isLowFat: true, isLactoseFree: true },

  // Refeições Prontas
  { id: '19', name: 'Prato Almoço Simples (Arroz, Feijão, Frango, Salada)', category: 'refeição pronta', calories: 450, protein: 35, carbs: 55, fat: 12, fiber: 10, baseUnit: 'unidade', baseAmount: 1, isHighProtein: true },
  { id: '20', name: 'Café da Manhã Proteico (Ovo, Pão Integral, Café)', category: 'refeição pronta', calories: 320, protein: 20, carbs: 35, fat: 12, fiber: 5, baseUnit: 'unidade', baseAmount: 1, isHighProtein: true },
  { id: '21', name: 'Jantar Leve (Sopa de Legumes com Frango)', category: 'refeição pronta', calories: 250, protein: 15, carbs: 30, fat: 8, fiber: 8, baseUnit: 'unidade', baseAmount: 1, isLowFat: true },
];

export const UNIT_CONVERSIONS: Record<Unit, number> = {
  gramas: 1,
  colher: 15, // 15g approx for rice/beans
  concha: 100, // 100g approx for beans
  unidade: 1, // depends on food
  fatia: 30, // 30g approx for bread/cheese
};
