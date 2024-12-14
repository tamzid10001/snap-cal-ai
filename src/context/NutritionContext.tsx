import React, { createContext, useContext, useState, useEffect } from 'react';
import { Meal, NutritionGoals } from '@/types/meal';

interface NutritionContextType {
  meals: Meal[];
  addMeal: (meal: Omit<Meal, 'id' | 'timestamp'>) => void;
  deleteMeal: (id: string) => void;
  goals: NutritionGoals;
  updateGoals: (goals: NutritionGoals) => void;
  dailyProgress: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

const defaultGoals: NutritionGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fats: 65,
};

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

export const NutritionProvider = ({ children }: { children: React.ReactNode }) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [goals, setGoals] = useState<NutritionGoals>(defaultGoals);
  const [dailyProgress, setDailyProgress] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });

  useEffect(() => {
    // Calculate daily progress whenever meals change
    const progress = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fats: acc.fats + meal.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
    setDailyProgress(progress);
  }, [meals]);

  const addMeal = (mealData: Omit<Meal, 'id' | 'timestamp'>) => {
    const newMeal: Meal = {
      ...mealData,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
    };
    setMeals((prev) => [...prev, newMeal]);
  };

  const deleteMeal = (id: string) => {
    setMeals((prev) => prev.filter((meal) => meal.id !== id));
  };

  const updateGoals = (newGoals: NutritionGoals) => {
    setGoals(newGoals);
  };

  return (
    <NutritionContext.Provider
      value={{
        meals,
        addMeal,
        deleteMeal,
        goals,
        updateGoals,
        dailyProgress,
      }}
    >
      {children}
    </NutritionContext.Provider>
  );
};

export const useNutrition = () => {
  const context = useContext(NutritionContext);
  if (context === undefined) {
    throw new Error('useNutrition must be used within a NutritionProvider');
  }
  return context;
};