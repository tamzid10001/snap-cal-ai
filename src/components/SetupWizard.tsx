import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SetupForm } from "./setup/SetupForm";
import { calculateBMR } from "./setup/utils";
import type { SetupFormValues } from "./setup/types";
import { Camera } from "lucide-react";
import { useEffect, useState } from "react";

export const SetupWizard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error('Auth error:', error);
        navigate('/login');
        return;
      }
      setUser(user);
    };
    
    checkUser();
  }, [navigate]);
  
  const onSubmit = async (values: SetupFormValues) => {
    try {
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Get the final height in centimeters
      const heightInCm = values.heightUnit === 'ft' && values.heightFeet && values.heightInches 
        ? Math.round((values.heightFeet * 30.48) + (values.heightInches * 2.54))
        : values.height;

      const goals = calculateBMR({
        ...values,
        height: heightInCm
      });

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          age: values.age,
          weight: values.weight,
          height: heightInCm,
          gender: values.gender,
          activity_level: values.activityLevel,
          goal: values.goal,
          ...goals,
          setup_completed: true,
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw updateError;
      }

      toast({
        title: "Setup completed!",
        description: "Your personalized nutrition plan is ready.",
      });
      
      navigate('/');
    } catch (error) {
      console.error('Setup error:', error);
      toast({
        title: "Error",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">Checking authentication...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8 animate-fade-up">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <Camera className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to Your Nutrition Journey</h1>
          <p className="text-muted-foreground">Let's set up your personalized plan</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border/40 shadow-lg">
          <SetupForm onSubmit={onSubmit} />
        </div>
      </div>
    </div>
  );
};