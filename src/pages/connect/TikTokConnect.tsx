import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function TikTokConnect() {
  const navigate = useNavigate();
  const redirect = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tiktok-oauth`;

  const connectTikTok = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    const state = user.id;

    window.location.href =
      `https://business-api.tiktok.com/open_api/v1.3/oauth2/authorize/?client_key=${
        import.meta.env.VITE_TIKTOK_CLIENT_ID
      }&scope=business.basic,business.ads.manage,business.ads.read` +
      `&redirect_uri=${encodeURIComponent(redirect)}&state=${state}`;
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Connect TikTok Ads</h1>
      <p className="text-muted-foreground mb-6">
        Connect your TikTok Ads account to publish campaigns directly from xiXoi.
      </p>
      <Button onClick={connectTikTok} size="lg">
        Connect TikTok Ads Account
      </Button>
    </div>
  );
}
