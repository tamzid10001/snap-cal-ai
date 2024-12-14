import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImageUpload } from './ImageUpload';
import { useNutrition } from '@/context/NutritionContext';
import { useToast } from '@/hooks/use-toast';
import { analyzeImage } from '@/utils/nutritionApi';
import { supabase } from '@/integrations/supabase/client';

export const MealEntry = () => {
  const { addMeal } = useNutrition();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageAnalysis = async (file: File) => {
    setIsProcessing(true);
    try {
      // First upload the image to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meal-images')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error('Failed to upload image');
      }

      // Get the public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('meal-images')
        .getPublicUrl(fileName);

      // Analyze the image using our edge function
      const analysis = await analyzeImage(file);
      
      // Save the meal to Supabase
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
        ...analysis,
        imageUrl: publicUrl,
      });

      toast({
        title: 'Meal logged successfully!',
        description: `Estimated calories: ${analysis.calories}kcal`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error analyzing meal',
        description: 'Please try again or enter manually',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualEntry = async () => {
    const manualMeal = {
      name: 'Manual Entry',
      calories: 350,
      protein: 20,
      carbs: 30,
      fats: 15,
      image_url: null,
    };

    try {
      setIsProcessing(true);
      const { data, error } = await supabase
        .from('meals')
        .insert([manualMeal])
        .select()
        .single();

      if (error) throw error;

      // Add to local state with the correct structure
      addMeal({
        ...manualMeal,
        id: data.id,
        timestamp: new Date(),
      });

      toast({
        title: 'Meal logged successfully!',
        description: 'Manual entry added to your log',
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error adding meal',
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
      <div className="space-y-6">
        <ImageUpload onUpload={handleImageAnalysis} isProcessing={isProcessing} />
        <div className="text-center">
          <span className="text-sm text-muted-foreground">or</span>
        </div>
        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={handleManualEntry}
          disabled={isProcessing}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Enter Manually
        </Button>
      </div>
    </Card>
  );
};