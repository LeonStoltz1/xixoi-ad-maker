import { useState } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const DeleteAccount = () => {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (!confirmed) {
      toast.error("Please check the confirmation box before proceeding");
      return;
    }

    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to delete your account");
        navigate("/auth");
        return;
      }

      // Call delete account edge function
      const { error } = await supabase.functions.invoke('delete-account');

      if (error) throw error;

      toast.success("Account deleted successfully");
      
      // Sign out and redirect
      await supabase.auth.signOut();
      navigate("/");
      
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error(error.message || "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-[720px] mx-auto px-6 py-24">
        <h1 className="text-4xl font-bold mb-8">Delete Your Account</h1>
        
        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">What happens when you delete your account?</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Immediate deletion:</strong> Your xiXoi™ account will be permanently deleted</li>
              <li><strong>Data removal:</strong> All campaigns, ad variants, uploads, and user data will be permanently erased within 30 days</li>
              <li><strong>OAuth disconnection:</strong> All connected ad platform tokens (Meta, TikTok, Google Ads, LinkedIn, X) will be revoked</li>
              <li><strong>Subscription cancellation:</strong> Active subscriptions will be canceled (no refunds for partial periods)</li>
              <li><strong>No recovery:</strong> This action cannot be undone</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">What is NOT deleted?</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Published ads:</strong> Ads already published to Meta/TikTok/Google/LinkedIn/X will remain active until you manually pause them in those platforms</li>
              <li><strong>Ad spend records:</strong> Retained for 7 years for tax/accounting compliance (Elite/Agency tiers only)</li>
              <li><strong>Payment history:</strong> Stripe transaction records retained per their data retention policy</li>
            </ul>
          </div>

          <div className="border border-black p-6 mt-8">
            <h2 className="text-2xl font-semibold mb-4">Confirm Account Deletion</h2>
            <p className="mb-6">This action is permanent and cannot be reversed.</p>
            
            <div className="flex items-start gap-3 mb-6">
              <input
                type="checkbox"
                id="confirm-delete"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="confirm-delete" className="text-sm">
                I understand that my account, campaigns, and all associated data will be permanently deleted. This action cannot be undone.
              </label>
            </div>

            <Button
              onClick={handleDeleteAccount}
              disabled={loading || !confirmed}
              className="w-full bg-black text-white hover:bg-black/90"
            >
              {loading ? "Deleting..." : "Delete My Account Permanently"}
            </Button>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Need help instead?</h2>
            <p>If you're experiencing issues or have questions, contact us before deleting your account:</p>
            <p className="mt-4">
              <strong>Email:</strong> support@xixoi.com<br />
              <strong>Privacy inquiries:</strong> privacy@xixoi.com
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Data Export (Before Deletion)</h2>
            <p>You can request a copy of your data before deletion:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Campaign data and ad variants</li>
              <li>Uploaded content</li>
              <li>Ad spend records (Elite/Agency)</li>
              <li>Account information</li>
            </ul>
            <p className="mt-4">Email <strong>privacy@xixoi.com</strong> to request a data export (GDPR/CCPA compliant).</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DeleteAccount;
