import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
