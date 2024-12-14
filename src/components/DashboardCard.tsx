import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface DashboardCardProps {
  title: string;
  value: string | number;
  max: number;
  unit?: string;
  className?: string;
}

export const DashboardCard = ({ title, value, max, unit = '', className = '' }: DashboardCardProps) => {
  const progress = (Number(value) / max) * 100;

  return (
    <Card className={`p-6 animate-fade-up bg-white border border-gray-200 hover:border-gray-300 transition-colors shadow-sm ${className}`}>
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <p className="text-2xl font-semibold mt-2 text-black">
        {value}
        {unit}
      </p>
      <div className="mt-4">
        <Progress value={progress} className="h-2 bg-gray-100" />
      </div>
      <p className="text-sm text-gray-500 mt-2">
        of {max}
        {unit} goal
      </p>
    </Card>
  );
};