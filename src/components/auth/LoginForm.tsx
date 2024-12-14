import { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

export const LoginForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user && !error) {
        navigate('/');
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      if (event === 'SIGNED_IN') {
        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
        navigate('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-up">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <Camera className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to SnapCal AI</h1>
          <p className="text-muted-foreground">
            Your personal AI-powered nutrition tracking assistant
          </p>
        </div>

        <Card className="p-6 border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              extend: false,
              className: {
                container: 'w-full',
                button: 'w-full bg-primary hover:bg-primary-hover text-white rounded-md px-4 py-2',
                input: 'w-full rounded-md border border-border bg-background px-4 py-2',
                label: 'text-sm font-medium text-foreground',
                message: 'text-sm text-destructive mt-2',
                anchor: 'text-primary hover:text-primary-hover',
              },
              variables: {
                default: {
                  colors: {
                    brand: '#86A789',
                    brandAccent: '#739276',
                  },
                },
              },
            }}
            theme="dark"
            providers={['google']}
          />
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          By continuing, you agree to our{' '}
          <a href="#" className="underline hover:text-primary">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="underline hover:text-primary">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};