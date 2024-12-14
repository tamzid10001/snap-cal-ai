import React, { useState } from 'react';
import { PhotoCapture } from './PhotoCapture';
import { useNutrition } from '@/context/NutritionContext';
import { useToast } from '@/hooks/use-toast';
import { analyzeImage } from '@/utils/nutritionApi';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';

export const MealEntry = () => {
  const { addMeal } = useNutrition();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePhotoCapture = async (file: File) => {
    setIsProcessing(true);
    try {
      // Upload image to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meal-images')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error('Failed to upload image');
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('meal-images')
        .getPublicUrl(fileName);

      // Analyze the image
      const analysis = await analyzeImage(file);
      
      // Save to Supabase
      const { data: mealData, error: mealError } = await supabase
        .from('meals')
        .insert([
          {
            ...analysis,
            image_url: publicUrl,
          }
        ])
        .select()
        .single();

      if (mealError) {
        throw mealError;
      }

      // Update local state
      addMeal({
        name: analysis.name,
        calories: analysis.calories,
        protein: analysis.protein,
        carbs: analysis.carbs,
        fats: analysis.fats,
        imageUrl: publicUrl,
      });

      toast({
        title: 'Meal logged successfully!',
        description: `${analysis.name}: ${analysis.calories}kcal`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error analyzing meal',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Add New Meal</h2>
      <div className="space-y-4">
        <PhotoCapture 
          onCapture={handlePhotoCapture}
          isProcessing={isProcessing}
        />
      </div>
    </Card>
  );
};