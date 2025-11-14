import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { UploadSection } from "@/components/UploadSection";
import { AIBuildsSection } from "@/components/AIBuildsSection";
import { TargetingSection } from "@/components/TargetingSection";
import { PaymentSection } from "@/components/PaymentSection";
import { ChannelsSection } from "@/components/ChannelsSection";
import { LiveAdSection } from "@/components/LiveAdSection";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

const Index = () => {
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
      <Header />
      <main>
        <Hero />
        <UploadSection />
        <AIBuildsSection />
        <TargetingSection />
        <PaymentSection />
        <ChannelsSection />
        <LiveAdSection />
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
