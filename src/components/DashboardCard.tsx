import React from 'react';
import { Card } from '@/components/ui/card';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
}

export const DashboardCard = ({ title, value, subtitle, className = '' }: DashboardCardProps) => {
  return (
    <Card className={`p-6 animate-fade-up ${className}`}>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-semibold mt-2 text-text">{value}</p>
      {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
    </Card>
  );
};