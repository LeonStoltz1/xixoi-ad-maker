import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CreateCampaign from "./pages/CreateCampaign";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import AdPublished from "./pages/AdPublished";
import CampaignAnalytics from "./pages/CampaignAnalytics";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import DeleteAccount from "./pages/DeleteAccount";
import AdminDashboard from "./pages/AdminDashboard";
import TargetingSetup from "./pages/TargetingSetup";
import Affiliates from "./pages/Affiliates";
import Influencers from "./pages/Influencers";
import AffiliateLeaderboard from "./pages/AffiliateLeaderboard";
import PayoutDashboard from "./pages/PayoutDashboard";
import PayoutSettings from "./pages/PayoutSettings";
import AdPlatformDashboard from "./pages/AdPlatformDashboard";
import CampaignPublish from "./pages/CampaignPublish";
import MetaConnect from "./pages/connect/MetaConnect";
import GoogleConnect from "./pages/connect/GoogleConnect";
import TikTokConnect from "./pages/connect/TikTokConnect";
import LinkedInConnect from "./pages/connect/LinkedInConnect";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Affiliate tracking component
const AffiliateTracker = () => {
  useEffect(() => {
    const url = new URL(window.location.href);
    const refCode = url.searchParams.get('ref');

    if (refCode) {
      localStorage.setItem('xixoi_affiliate_ref', refCode);
      document.cookie = `xixoi_affiliate_ref=${refCode};path=/;max-age=${60 * 60 * 24 * 30}`;
    }
  }, []);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AffiliateTracker />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-campaign" element={<CreateCampaign />} />
          <Route path="/targeting/:campaignId" element={<TargetingSetup />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-canceled" element={<PaymentCanceled />} />
          <Route path="/ad-published/:id" element={<AdPublished />} />
          <Route path="/analytics/:id" element={<CampaignAnalytics />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/delete-account" element={<DeleteAccount />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/affiliates" element={<Affiliates />} />
          <Route path="/influencers" element={<Influencers />} />
          <Route path="/leaderboard" element={<AffiliateLeaderboard />} />
          <Route path="/payouts" element={<PayoutDashboard />} />
          <Route path="/payout-settings" element={<PayoutSettings />} />
          <Route path="/ad-platforms" element={<AdPlatformDashboard />} />
          <Route path="/campaign-publish" element={<CampaignPublish />} />
          <Route path="/connect/meta" element={<MetaConnect />} />
          <Route path="/connect/google" element={<GoogleConnect />} />
          <Route path="/connect/tiktok" element={<TikTokConnect />} />
          <Route path="/connect/linkedin" element={<LinkedInConnect />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
