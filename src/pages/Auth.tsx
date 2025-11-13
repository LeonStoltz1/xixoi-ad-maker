import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";

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

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // If user is already logged in and has a plan parameter, redirect to checkout
        if (planParam) {
          handlePlanRedirect(planParam);
        } else {
          navigate("/dashboard");
        }
      }
    });
  }, [navigate, planParam]);

  const handlePlanRedirect = (plan: string) => {
    // Redirect to appropriate checkout based on plan
    if (plan === 'pro') {
      createCheckoutSession('pro_subscription');
    } else if (plan === 'elite' || plan === 'agency') {
      // For elite and agency, redirect to sales email
      window.location.href = 'mailto:sales@xixoi.com';
    } else {
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
          handlePlanRedirect(planParam);
        } else {
          navigate("/dashboard");
        }
      } else {
        const { error } = await supabase.auth.signUp({
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

        toast({
          title: "Account created!",
          description: "Welcome to xiXoi™. Redirecting...",
        });
        
        // Check if user came from pricing page with a plan parameter
        if (planParam) {
          handlePlanRedirect(planParam);
        } else {
          navigate("/dashboard");
        }
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
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        {planDetails && (
          <div className="border-2 border-primary bg-primary/5 rounded-xl p-4 text-center space-y-1">
            <p className="text-sm uppercase tracking-wide font-medium text-muted-foreground">
              Selected Plan
            </p>
            <h3 className="text-xl font-bold">{planDetails.name}</h3>
            <p className="text-lg font-medium text-primary">{planDetails.price}</p>
          </div>
        )}

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">xiXoi™</h1>
          <p className="text-muted-foreground">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6 border border-foreground rounded-2xl p-8">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium uppercase tracking-wide">Full Name</label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="John Doe"
                className="border-foreground"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium uppercase tracking-wide">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="border-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium uppercase tracking-wide">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="border-foreground"
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
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
