import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { linkUserToAffiliate } from "@/lib/affiliateTracking";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { createCheckoutSession } = useStripeCheckout();
  const planParam = searchParams.get('plan');
  const modeParam = searchParams.get('mode');

  // Set isLogin based on mode parameter
  useEffect(() => {
    if (modeParam === 'signup') {
      setIsLogin(false);
    } else if (modeParam === 'login') {
      setIsLogin(true);
    }
  }, [modeParam]);

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // If user is already logged in and has a plan parameter, redirect to checkout
        if (planParam) {
          await handlePlanRedirect(planParam);
        } else {
          navigate("/dashboard");
        }
      }
    };
    checkSession();
  }, [navigate, planParam]);

  const handlePlanRedirect = async (plan: string) => {
    // Redirect to appropriate checkout based on plan
    try {
      if (plan === 'pro') {
        await createCheckoutSession('pro_subscription', undefined, false);
      } else if (plan === 'elite') {
        await createCheckoutSession('elite_subscription', undefined, false);
      } else if (plan === 'agency') {
        await createCheckoutSession('agency_subscription', undefined, false);
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error('Checkout error:', error);
      navigate("/dashboard");
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
        
        // Check if user came from pricing page with a plan parameter
        if (planParam) {
          await handlePlanRedirect(planParam);
        } else {
          navigate("/dashboard");
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        // Link user to affiliate if they came from a referral link
        if (data.user) {
          await linkUserToAffiliate(data.user.id);
        }

        toast({
          title: "Account created!",
          description: "Welcome to xiXoi™. Let's get started...",
        });
        
        // Redirect to onboarding to collect realtor info
        navigate("/onboarding");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlanDetails = (plan: string | null) => {
    switch(plan) {
      case 'pro':
        return { name: 'Publish Pro', price: '$99/month unlimited' };
      case 'elite':
        return { name: 'Scale Elite', price: '$199/month + 5% ad spend' };
      case 'agency':
        return { name: 'Agency White-Label', price: '$999/month' };
      default:
        return null;
    }
  };

  const planDetails = getPlanDetails(planParam);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex items-center justify-center px-6 py-12 mt-32">
        <div className="w-full max-w-md space-y-8">
        {planDetails && (
          <div className="border-2 border-primary bg-primary/5 p-4 text-center space-y-1">
            <p className="text-sm uppercase tracking-wide font-medium text-muted-foreground">
              Selected Plan
            </p>
            <h3 className="text-lg md:text-xl font-bold">{planDetails.name}</h3>
            <p className="text-base md:text-lg font-medium text-primary">{planDetails.price}</p>
          </div>
        )}

        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">xiXoi™</h1>
          <p className="text-foreground">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6 border border-foreground p-8 bg-background">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium uppercase tracking-wide text-foreground">Full Name</label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="John Doe"
                className="border-foreground bg-background text-foreground"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium uppercase tracking-wide text-foreground">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="border-foreground bg-background text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium uppercase tracking-wide text-foreground">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="border-foreground bg-background text-foreground"
              minLength={6}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-foreground hover:text-foreground/70 transition-colors underline"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
      </div>
      <Footer />
    </div>
  );
}
