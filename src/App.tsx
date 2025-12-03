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
import About from "./pages/About";
import AddAdBudget from "./pages/AddAdBudget";
import Wallet from "./pages/Wallet";
import AgencyPortal from "./pages/AgencyPortal";
import AdminDashboard from "./pages/AdminDashboard";
import TargetingSetup from "./pages/TargetingSetup";
import CampaignBudgetPayment from "./pages/CampaignBudgetPayment";
import EditCampaign from "./pages/EditCampaign";
import Affiliates from "./pages/Affiliates";
import AffiliateAdmin from "./pages/AffiliateAdmin";
import Influencers from "./pages/Influencers";
import AffiliateLeaderboard from "./pages/AffiliateLeaderboard";
import PayoutDashboard from "./pages/PayoutDashboard";
import PayoutSettings from "./pages/PayoutSettings";
import CampaignPublish from "./pages/CampaignPublish";
import ReviewAd from "./pages/ReviewAd";
import NotFound from "./pages/NotFound";
import { RealtorIdentification } from "./components/onboarding/RealtorIdentification";
import { RealtorProvider } from "./contexts/RealtorContext";
import { PoliticalProvider } from "./contexts/PoliticalContext";
// POLITICAL MODE ARCHIVED - Files moved to src/archive/political/
// import VerifyCandidate from "./pages/political/VerifyCandidate";
// import GeneratePoliticalAd from "./pages/political/GeneratePoliticalAd";
// import PoliticalDashboard from "./pages/political/PoliticalDashboard";
// import VerifyAd from "./pages/political/VerifyAd";
import PlatformCredentialsAdmin from "./pages/admin/PlatformCredentialsAdmin";
import TestMetaPublish from "./pages/admin/TestMetaPublish";
import SeedTestData from "./pages/admin/SeedTestData";
import TierTestingChecklist from "./pages/admin/TierTestingChecklist";
import ConnectPlatforms from "./pages/ConnectPlatforms";
import CustomerIntake from "./pages/CustomerIntake";
import CampaignStatus from "./pages/CampaignStatus";
import { AIOnboardingPage } from "./features/onboarding";

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
      <RealtorProvider>
        <PoliticalProvider>
          <BrowserRouter>
            <AffiliateTracker />
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<RealtorIdentification />} />
            
            {/* POLITICAL MODE HIDDEN - Re-enable later for launch */}
            {/* <Route path="/political/verify" element={<VerifyCandidate />} /> */}
            {/* <Route path="/political/generate" element={<GeneratePoliticalAd />} /> */}
            {/* <Route path="/political/dashboard" element={<PoliticalDashboard />} /> */}
            {/* <Route path="/verify/ad/:adId" element={<VerifyAd />} /> */}
            {/* <Route path="/verify/candidate/:candidateId" element={<VerifyCandidate />} /> */}
            <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-campaign" element={<CreateCampaign />} />
          <Route path="/campaign/:id" element={<CampaignStatus />} />
          <Route path="/connect-platforms" element={<ConnectPlatforms />} />
          <Route path="/targeting/:campaignId" element={<TargetingSetup />} />
          <Route path="/campaign/:campaignId/publish" element={<CampaignBudgetPayment />} />
          <Route path="/edit-campaign/:campaignId" element={<EditCampaign />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-canceled" element={<PaymentCanceled />} />
          <Route path="/ad-published/:id" element={<AdPublished />} />
          <Route path="/analytics/:id" element={<CampaignAnalytics />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/delete-account" element={<DeleteAccount />} />
          <Route path="/about" element={<About />} />
          <Route path="/add-ad-budget" element={<AddAdBudget />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/agency" element={<AgencyPortal />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/affiliates" element={<Affiliates />} />
          <Route path="/affiliate-admin" element={<AffiliateAdmin />} />
          <Route path="/influencers" element={<Influencers />} />
          <Route path="/leaderboard" element={<AffiliateLeaderboard />} />
          <Route path="/payouts" element={<PayoutDashboard />} />
          <Route path="/payout-settings" element={<PayoutSettings />} />
          <Route path="/campaign-publish" element={<CampaignPublish />} />
          <Route path="/review-ad/:campaignId" element={<ReviewAd />} />
          <Route path="/admin/platform-credentials" element={<PlatformCredentialsAdmin />} />
          <Route path="/admin/test-meta" element={<TestMetaPublish />} />
          <Route path="/admin/seed-data" element={<SeedTestData />} />
          <Route path="/admin/tier-testing" element={<TierTestingChecklist />} />
<Route path="/customer-intake" element={<CustomerIntake />} />
          <Route path="/ai-onboarding" element={<AIOnboardingPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </PoliticalProvider>
      </RealtorProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
