import React from 'react';
import { Header } from '@/components/Header';
import { DashboardCard } from '@/components/DashboardCard';
import { MealEntry } from '@/components/MealEntry';
import { useNutrition } from '@/context/NutritionContext';

const Index = () => {
  const { dailyProgress, goals } = useNutrition();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DashboardCard
            title="Daily Calories"
            value={dailyProgress.calories}
            max={goals.calories}
            unit="kcal"
          />
          <DashboardCard
            title="Protein"
            value={dailyProgress.protein}
            max={goals.protein}
            unit="g"
          />
          <DashboardCard
            title="Carbs"
            value={dailyProgress.carbs}
            max={goals.carbs}
            unit="g"
          />
        </div>
        
        <div className="max-w-md mx-auto">
          <MealEntry />
        </div>
      </main>
    </div>
  );
};

export default Index;