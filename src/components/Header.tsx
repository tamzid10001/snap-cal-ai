import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Header = () => {
  return (
    <header className="w-full bg-surface shadow-sm p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6 text-text" />
          </Button>
          <h1 className="text-xl font-semibold text-text">NutriTrack AI</h1>
        </div>
      </div>
    </header>
  );
};