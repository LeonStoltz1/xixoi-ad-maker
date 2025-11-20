import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedHeader } from "@/components/UnifiedHeader";
import { Hero } from "@/components/Hero";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is authenticated and redirect to dashboard
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // Don't redirect if coming from Header with scrollToPricing state
      if (session && !location.state?.scrollToPricing) {
        navigate('/dashboard');
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && !location.state?.scrollToPricing) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.state]);

  // Scroll to pricing section if requested
  useEffect(() => {
    if (location.state?.scrollToPricing) {
      setTimeout(() => {
        const pricingElement = document.getElementById('pricing');
        if (pricingElement) {
          pricingElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location.state]);

  // Capture affiliate referral code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    
    if (refCode) {
      try {
        // Store in localStorage
        localStorage.setItem('xixoi_affiliate_ref', refCode);
        
        // Also store in cookie as backup (expires in 30 days)
        const expires = new Date();
        expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000);
        document.cookie = `xixoi_affiliate_ref=${encodeURIComponent(refCode)};expires=${expires.toUTCString()};path=/`;
        
        console.log('Affiliate referral code captured:', refCode);
      } catch (error) {
        console.error('Error storing affiliate code:', error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen">
      <UnifiedHeader />
      <main>
        <Hero />
        <HowItWorksSection />
        <div id="pricing">
          <Pricing />
        </div>
        <div id="faq">
          <FAQ />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
