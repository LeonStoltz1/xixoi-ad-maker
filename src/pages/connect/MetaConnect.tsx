import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function MetaConnect() {
  const navigate = useNavigate();
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-oauth`;

  const handleConnect = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    const state = user.id;

    window.location.href =
      `https://www.facebook.com/v20.0/dialog/oauth?client_id=${
        import.meta.env.VITE_META_APP_ID
      }&redirect_uri=${encodeURIComponent(url)}&scope=ads_management,ads_read&state=${state}`;
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Connect Meta Ads</h1>
      <p className="text-muted-foreground mb-6">
        Connect your Meta (Facebook) Ads account to publish campaigns directly from xiXoi.
      </p>
      <Button onClick={handleConnect} size="lg">
        Connect Meta Ads Account
      </Button>
    </div>
  );
}
