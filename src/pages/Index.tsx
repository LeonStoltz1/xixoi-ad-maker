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
