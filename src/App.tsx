import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { NutritionProvider } from "@/context/NutritionContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import Index from "./pages/Index";
import { SetupWizard } from "./components/SetupWizard";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useToast } from "./components/ui/use-toast";

const queryClient = new QueryClient();

const LoginPage = () => {
  const [session, setSession] = useState<Session | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_IN') {
        toast({
          title: "Success",
          description: "Successfully signed in!",
        });
      }
      if (_event === 'SIGNED_OUT') {
        toast({
          title: "Signed out",
          description: "Successfully signed out.",
        });
      }
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-black">Welcome to SnapCal AI</h1>
          <p className="text-gray-600">Login to kickstart Diet!</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#000000',
                    brandAccent: '#333333',
                  },
                },
              },
              style: {
                button: {
                  borderRadius: '6px',
                },
                anchor: {
                  color: '#000000',
                },
                container: {
                  gap: '16px',
                },
              },
            }}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email Address',
                  password_label: 'Password',
                  button_label: 'Sign In',
                },
                sign_up: {
                  email_label: 'Email Address',
                  password_label: 'Create Password',
                  button_label: 'Create Account',
                },
              }
            }}
            providers={[]}
          />
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [setupCompleted, setSetupCompleted] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        checkSetup(session.user.id);
      } else {
        setLoading(false);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkSetup(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSetup = async (userId: string) => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('setup_completed')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Profile check error:', error);
        setLoading(false);
        return;
      }
      
      setSetupCompleted(!!profiles?.setup_completed);
      setLoading(false);
    } catch (error) {
      console.error('Profile check error:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-black">Loading...</div>
    </div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
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
        <div className="min-h-screen bg-background">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/setup" element={<SetupWizard />} />
            </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </NutritionProvider>
  </QueryClientProvider>
);

export default App;