import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { NutritionProvider } from "@/context/NutritionContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import { SetupWizard } from "./components/SetupWizard";
import { LoginForm } from "./components/auth/LoginForm";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Auth error:', error);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        setIsAuthenticated(!!user);

        if (user) {
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('setup_completed')
            .eq('id', user.id)
            .single();
          
          if (profileError) {
            console.error('Profile error:', profileError);
          }
          
          setSetupCompleted(!!data?.setup_completed);
        }
      } catch (error) {
        console.error('Check auth error:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsAuthenticated(!!session?.user);
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('setup_completed')
          .eq('id', session.user.id)
          .single();
        
        setSetupCompleted(!!data?.setup_completed);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#1E1C23] flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
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
            <Route path="/login" element={<LoginForm />} />
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