import React from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const setupFormSchema = z.object({
  age: z.string().transform(Number).pipe(z.number().min(1).max(120)),
  weight: z.string().transform(Number).pipe(z.number().min(20).max(300)),
  height: z.string().transform(Number).pipe(z.number().min(100).max(250)),
  gender: z.enum(["male", "female"]),
  activityLevel: z.enum(["sedentary", "light", "moderate", "very", "extra"]),
  goal: z.enum(["lose", "maintain", "gain"]),
});

type SetupFormValues = z.infer<typeof setupFormSchema>;

const calculateBMR = (values: SetupFormValues) => {
  // Mifflin-St Jeor Equation
  const { age, weight, height, gender } = values;
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  bmr = gender === "male" ? bmr + 5 : bmr - 161;
  
  // Activity level multiplier
  const activityMultipliers = {
    sedentary: 1.2, // Little or no exercise
    light: 1.375, // Light exercise 1-3 days/week
    moderate: 1.55, // Moderate exercise 3-5 days/week
    very: 1.725, // Heavy exercise 6-7 days/week
    extra: 1.9, // Very heavy exercise, physical job
  };
  
  const dailyCalories = Math.round(bmr * activityMultipliers[values.activityLevel]);
  
  // Adjust calories based on goal
  const goalAdjustments = {
    lose: -500, // Deficit for weight loss
    maintain: 0,
    gain: 500, // Surplus for weight gain
  };
  
  const adjustedCalories = dailyCalories + goalAdjustments[values.goal];
  
  // Calculate macros (40/30/30 split by default)
  const proteinGrams = Math.round((adjustedCalories * 0.3) / 4); // 4 calories per gram
  const carbsGrams = Math.round((adjustedCalories * 0.4) / 4);
  const fatsGrams = Math.round((adjustedCalories * 0.3) / 9); // 9 calories per gram
  
  return {
    bmr: Math.round(bmr),
    dailyCalories: adjustedCalories,
    proteinGoal: proteinGrams,
    carbsGoal: carbsGrams,
    fatsGoal: fatsGrams,
  };
};

export const SetupWizard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupFormSchema),
    defaultValues: {
      age: "",
      weight: "",
      height: "",
      gender: "male",
      activityLevel: "moderate",
      goal: "maintain",
    },
  });

  const onSubmit = async (values: SetupFormValues) => {
    try {
      const goals = calculateBMR(values);
      const { error } = await supabase
        .from('profiles')
        .update({
          ...values,
          ...goals,
          setup_completed: true,
        })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      toast({
        title: "Setup completed!",
        description: "Your personalized nutrition plan is ready.",
      });
      
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#1E1C23] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome to Your Nutrition Journey</h1>
          <p className="text-gray-400 mt-2">Let's set up your personalized plan</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter your age" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (kg)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter your weight" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Height (cm)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter your height" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="activityLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                      <SelectItem value="light">Light (exercise 1-3 days/week)</SelectItem>
                      <SelectItem value="moderate">Moderate (exercise 3-5 days/week)</SelectItem>
                      <SelectItem value="very">Very Active (exercise 6-7 days/week)</SelectItem>
                      <SelectItem value="extra">Extra Active (very active & physical job)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your goal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="lose">Lose Weight</SelectItem>
                      <SelectItem value="maintain">Maintain Weight</SelectItem>
                      <SelectItem value="gain">Gain Weight</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Complete Setup
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};