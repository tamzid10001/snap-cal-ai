import React from 'react';
import { Header } from '@/components/Header';
import { DashboardCard } from '@/components/DashboardCard';
import { MealEntry } from '@/components/MealEntry';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DashboardCard
            title="Daily Calories"
            value="1,200"
            subtitle="of 2,000 goal"
          />
          <DashboardCard
            title="Protein"
            value="65g"
            subtitle="of 120g goal"
          />
          <DashboardCard
            title="Meals Today"
            value="2"
            subtitle="of 3 planned"
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