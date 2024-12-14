import React from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImageUpload } from './ImageUpload';

export const MealEntry = () => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Add New Meal</h2>
      <div className="space-y-6">
        <ImageUpload />
        <div className="text-center">
          <span className="text-sm text-gray-500">or</span>
        </div>
        <Button className="w-full bg-primary hover:bg-primary-hover text-white">
          <PlusCircle className="mr-2 h-4 w-4" />
          Enter Manually
        </Button>
      </div>
    </Card>
  );
};