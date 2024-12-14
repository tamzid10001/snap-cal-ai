import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NutritionProvider } from "@/context/NutritionContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import { SetupWizard } from "./components/SetupWizard";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [setupCompleted, setSetupCompleted] = useState(false);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        // For development, we'll create a default profile if none exists
        const { data: profiles } = await supabase
          .from('profiles')
          .select('setup_completed')
          .limit(1)
          .single();
        
        setSetupCompleted(!!profiles?.setup_completed);
      } catch (error) {
        console.error('Profile check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSetup();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#1E1C23] flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  if (!setupCompleted) {
    return <SetupWizard />;
  }

  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <NutritionProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/setup" element={<SetupWizard />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </NutritionProvider>
  </QueryClientProvider>
);

export default App;