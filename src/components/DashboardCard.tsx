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
    <Card className={`p-6 animate-fade-up bg-card hover:bg-accent/5 transition-colors ${className}`}>
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <p className="text-2xl font-semibold mt-2 text-primary">
        {value}
        {unit}
      </p>
      <div className="mt-4">
        <Progress value={progress} className="h-2" />
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        of {max}
        {unit} goal
      </p>
    </Card>
  );
};