import { Food, Unit } from '../types';

export const FOODS: Food[] = [
  // Arroz, Macarrão, Batata
  { id: '1', name: 'Arroz Branco Cozido', category: 'arroz', calories: 130, protein: 2.5, carbs: 28.0, fat: 0.3, fiber: 1.6, baseUnit: 'gramas', baseAmount: 100, isCheap: true, isLactoseFree: true },
  { id: '2', name: 'Arroz Integral Cozido', category: 'arroz', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, fiber: 1.8, baseUnit: 'gramas', baseAmount: 100, isCheap: true, isLactoseFree: true },
  { id: '3', name: 'Macarrão Cozido', category: 'macarrão', calories: 131, protein: 5.0, carbs: 25.0, fat: 1.1, fiber: 1.5, baseUnit: 'gramas', baseAmount: 100, isCheap: true, isLactoseFree: true },
  { id: '4', name: 'Batata Inglesa Cozida', category: 'batata', calories: 52, protein: 1.2, carbs: 12.0, fat: 0.1, fiber: 1.3, baseUnit: 'gramas', baseAmount: 100, isCheap: true, isLactoseFree: true, isLowFat: true },
  { id: '5', name: 'Batata Doce Cozida', category: 'batata', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, baseUnit: 'gramas', baseAmount: 100, isCheap: true, isLactoseFree: true, isLowFat: true },

  // Frango, Carne, Ovo, Peixe
  { id: '6', name: 'Peito de Frango Grelhado', category: 'frango', calories: 165, protein: 31.0, carbs: 0, fat: 3.6, fiber: 0, baseUnit: 'gramas', baseAmount: 100, isHighProtein: true, isLowCarb: true, isLactoseFree: true },
  { id: '7', name: 'Carne Bovina (Patinho Grelhado)', category: 'carne', calories: 219, protein: 26.0, carbs: 0, fat: 12.0, fiber: 0, baseUnit: 'gramas', baseAmount: 100, isHighProtein: true, isLowCarb: true, isLactoseFree: true },
  { id: '8', name: 'Ovo Cozido', category: 'ovo', calories: 155, protein: 13.0, carbs: 1.1, fat: 11.0, fiber: 0, baseUnit: 'gramas', baseAmount: 100, isHighProtein: true, isLowCarb: true, isLactoseFree: true, isCheap: true },
  { id: '9', name: 'Filé de Tilápia Grelhado', category: 'peixe', calories: 128, protein: 26, carbs: 0, fat: 2.7, fiber: 0, baseUnit: 'gramas', baseAmount: 100, isHighProtein: true, isLowCarb: true, isLowFat: true, isLactoseFree: true },

  // Feijão, Lentilha
  { id: '10', name: 'Feijão Carioca Cozido', category: 'feijão', calories: 76, protein: 4.8, carbs: 13.6, fat: 0.5, fiber: 8.5, baseUnit: 'gramas', baseAmount: 100, isCheap: true, isLactoseFree: true, isLowFat: true },
  { id: '11', name: 'Lentilha Cozida', category: 'lentilha', calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9, baseUnit: 'gramas', baseAmount: 100, isCheap: true, isLactoseFree: true, isLowFat: true },

  // Legumes e Verduras
  { id: '12', name: 'Brócolis Cozido', category: 'legumes', calories: 35, protein: 2.4, carbs: 7.0, fat: 0.4, fiber: 3.3, baseUnit: 'gramas', baseAmount: 100, isLowCarb: true, isLowFat: true, isLactoseFree: true },
  { id: '13', name: 'Cenoura Cozida', category: 'legumes', calories: 35, protein: 0.8, carbs: 8.2, fat: 0.2, fiber: 3, baseUnit: 'gramas', baseAmount: 100, isLowFat: true, isLactoseFree: true },
  { id: '14', name: 'Alface', category: 'verduras', calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3, baseUnit: 'gramas', baseAmount: 100, isLowCarb: true, isLowFat: true, isLactoseFree: true },
  { id: '27', name: 'Cenoura Crua', category: 'legumes', calories: 34, protein: 1.3, carbs: 8.0, fat: 0.2, fiber: 2.8, baseUnit: 'gramas', baseAmount: 100, isLowFat: true, isLactoseFree: true },

  // Frutas
  { id: '15', name: 'Banana Prata', category: 'frutas', calories: 98, protein: 1.3, carbs: 26.0, fat: 0.1, fiber: 2.0, baseUnit: 'gramas', baseAmount: 100, isCheap: true, isLactoseFree: true },
  { id: '16', name: 'Maçã', category: 'frutas', calories: 52, protein: 0.3, carbs: 14.0, fat: 0.2, fiber: 2.4, baseUnit: 'gramas', baseAmount: 100, isLactoseFree: true },

  // Laticínios
  { id: '23', name: 'Leite Integral', category: 'laticínios', calories: 61, protein: 3.2, carbs: 4.7, fat: 3.3, fiber: 0, baseUnit: 'gramas', baseAmount: 100 },
  { id: '25', name: 'Queijo Muçarela', category: 'laticínios', calories: 300, protein: 22.0, carbs: 3.0, fat: 22.0, fiber: 0, baseUnit: 'gramas', baseAmount: 100, isHighProtein: true },
  { id: '26', name: 'Iogurte Natural Integral', category: 'laticínios', calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0, baseUnit: 'gramas', baseAmount: 100 },
  { id: '29', name: 'Manteiga', category: 'laticínios', calories: 717, protein: 0.9, carbs: 0.1, fat: 81.0, fiber: 0, baseUnit: 'gramas', baseAmount: 100 },

  // Pães e Cereais
  { id: '22', name: 'Pão Francês', category: 'pães', calories: 300, protein: 8.0, carbs: 58.0, fat: 3.0, fiber: 2.3, baseUnit: 'gramas', baseAmount: 100 },
  { id: '24', name: 'Aveia em Flocos', category: 'cereais', calories: 394, protein: 13.9, carbs: 66.0, fat: 8.5, fiber: 9.1, baseUnit: 'gramas', baseAmount: 100 },

  // Óleos
  { id: '28', name: 'Azeite de Oliva', category: 'óleos', calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, baseUnit: 'gramas', baseAmount: 100, isLactoseFree: true },

  // Bebidas
  { id: '17', name: 'Suco de Laranja Natural', category: 'bebidas', calories: 45, protein: 0.7, carbs: 10, fat: 0.2, fiber: 0.2, baseUnit: 'gramas', baseAmount: 100, isLactoseFree: true },
  { id: '18', name: 'Café sem Açúcar', category: 'bebidas', calories: 1, protein: 0.1, carbs: 0, fat: 0, fiber: 0, baseUnit: 'gramas', baseAmount: 100, isLowCarb: true, isLowFat: true, isLactoseFree: true },
  { id: '31', name: 'Refrigerante', category: 'bebidas', calories: 42, protein: 0, carbs: 10.6, fat: 0, fiber: 0, baseUnit: 'gramas', baseAmount: 100, isLactoseFree: true },

  // Outros
  { id: '30', name: 'Açúcar Refinado', category: 'outros', calories: 387, protein: 0, carbs: 100, fat: 0, fiber: 0, baseUnit: 'gramas', baseAmount: 100, isLactoseFree: true },

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
