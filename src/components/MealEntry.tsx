import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImageUpload } from './ImageUpload';
import { useNutrition } from '@/context/NutritionContext';
import { useToast } from '@/hooks/use-toast';
import { analyzeImage } from '@/utils/nutritionApi';

export const MealEntry = () => {
  const { addMeal } = useNutrition();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageAnalysis = async (file: File) => {
    setIsProcessing(true);
    try {
      const analysis = await analyzeImage(file);
      
      addMeal({
        ...analysis,
        imageUrl: URL.createObjectURL(file),
      });

      toast({
        title: 'Meal logged successfully!',
        description: `Estimated calories: ${analysis.calories}kcal`,
      });
    } catch (error) {
      toast({
        title: 'Error analyzing meal',
        description: 'Please try again or enter manually',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualEntry = () => {
    addMeal({
      name: 'Manual Entry',
      calories: 350,
      protein: 20,
      carbs: 30,
      fats: 15,
    });

    toast({
      title: 'Meal logged successfully!',
      description: 'Manual entry added to your log',
    });
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Add New Meal</h2>
      <div className="space-y-6">
        <ImageUpload onUpload={handleImageAnalysis} isProcessing={isProcessing} />
        <div className="text-center">
          <span className="text-sm text-gray-500">or</span>
        </div>
        <Button 
          className="w-full bg-primary hover:bg-primary-hover text-white"
          onClick={handleManualEntry}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Enter Manually
        </Button>
      </div>
    </Card>
  );
};