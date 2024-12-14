import React, { createContext, useContext, useState, useEffect } from 'react';
import { Meal, NutritionGoals } from '@/types/meal';
import { supabase } from '@/integrations/supabase/client';

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
    const fetchUserGoals = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('daily_calories, protein_goal, carbs_goal, fats_goal')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching goals:', error);
            return;
          }

          if (data) {
            console.log('Fetched user goals:', data);
            setGoals({
              calories: Math.round(data.daily_calories) || defaultGoals.calories,
              protein: Math.round(data.protein_goal) || defaultGoals.protein,
              carbs: Math.round(data.carbs_goal) || defaultGoals.carbs,
              fats: Math.round(data.fats_goal) || defaultGoals.fats,
            });
          }
        }
      } catch (error) {
        console.error('Error in fetchUserGoals:', error);
      }
    };

    fetchUserGoals();
  }, []);

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

  const updateGoals = async (newGoals: NutritionGoals) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            daily_calories: Math.round(newGoals.calories),
            protein_goal: Math.round(newGoals.protein),
            carbs_goal: Math.round(newGoals.carbs),
            fats_goal: Math.round(newGoals.fats),
          })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating goals:', error);
          return;
        }

        setGoals(newGoals);
      }
    } catch (error) {
      console.error('Error in updateGoals:', error);
    }
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