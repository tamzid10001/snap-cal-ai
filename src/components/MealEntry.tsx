import React, { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImageUpload } from './ImageUpload';
import { useNutrition } from '@/context/NutritionContext';
import { useToast } from '@/hooks/use-toast';
import { analyzeImage } from '@/utils/nutritionApi';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const MealEntry = () => {
  const { addMeal } = useNutrition();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
  });

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
        name: analysis.name,
        calories: analysis.calories,
        protein: analysis.protein,
        carbs: analysis.carbs,
        fats: analysis.fats,
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

  const handleManualEntryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setManualEntry(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleManualEntry = async () => {
    try {
      setIsProcessing(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const manualMeal = {
        name: manualEntry.name || 'Manual Entry',
        calories: parseInt(manualEntry.calories) || 0,
        protein: parseFloat(manualEntry.protein) || 0,
        carbs: parseFloat(manualEntry.carbs) || 0,
        fats: parseFloat(manualEntry.fats) || 0,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('meals')
        .insert([manualMeal])
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      addMeal({
        name: manualMeal.name,
        calories: manualMeal.calories,
        protein: manualMeal.protein,
        carbs: manualMeal.carbs,
        fats: manualMeal.fats,
        imageUrl: null,
      });

      toast({
        title: 'Meal logged successfully!',
        description: 'Manual entry added to your log',
      });

      // Reset form and close dialog
      setManualEntry({
        name: '',
        calories: '',
        protein: '',
        carbs: '',
        fats: '',
      });
      setIsDialogOpen(false);
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isProcessing}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Enter Manually
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Meal Manually</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Meal Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={manualEntry.name}
                  onChange={handleManualEntryChange}
                  placeholder="e.g., Chicken Salad"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  name="calories"
                  type="number"
                  value={manualEntry.calories}
                  onChange={handleManualEntryChange}
                  placeholder="e.g., 350"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  name="protein"
                  type="number"
                  value={manualEntry.protein}
                  onChange={handleManualEntryChange}
                  placeholder="e.g., 20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  name="carbs"
                  type="number"
                  value={manualEntry.carbs}
                  onChange={handleManualEntryChange}
                  placeholder="e.g., 30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fats">Fats (g)</Label>
                <Input
                  id="fats"
                  name="fats"
                  type="number"
                  value={manualEntry.fats}
                  onChange={handleManualEntryChange}
                  placeholder="e.g., 15"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleManualEntry}
                disabled={isProcessing}
              >
                Add Meal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
};
